//import { KeyDisplay } from './utils';
//import { CharacterControls } from './characterControls';
import * as THREE from 'three';

import { OrbitControls } from "./build/three/examples/jsm/controls/OrbitControls.js";
import {DragControls} from './build/three/examples/jsm/controls/DragControls.js';

import {FBXLoader} from './build/three/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from './build/three/examples/jsm/loaders/GLTFLoader.js';
class BasicCharacterControls {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);

    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._move.forward = true;
        break;
      case 65: // a
        this._move.left = true;
        break;
      case 83: // s
        this._move.backward = true;
        break;
      case 68: // d
        this._move.right = true;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  _onKeyUp(event) {
    switch(event.keyCode) {
      case 87: // w
        this._move.forward = false;
        break;
      case 65: // a
        this._move.left = false;
        break;
      case 83: // s
        this._move.backward = false;
        break;
      case 68: // d
        this._move.right = false;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  Update(timeInSeconds) {
    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._params.target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    if (this._move.forward) {
      velocity.z += this._acceleration.z * timeInSeconds;
    }
    if (this._move.backward) {
      velocity.z -= this._acceleration.z * timeInSeconds;
    }
    if (this._move.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._move.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);
  }
}


class loadedWorld {
  constructor() {
      this._Initialize();
      this._InitializeLights();
      this._InitializeCamera();
      this._InitializeScene(); 
      this._loadCube();
      this.raycast();
  }

  _Initialize() {
      this.renderer = new THREE.WebGLRenderer({
          antialias: true,
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    
        document.body.appendChild(this.renderer.domElement);
    
        window.addEventListener('resize', () => {
          this._OnWindowResize();
        }, false);

        // SCENE
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xa8def0);
      //[previous state]
      this.previousRAF = null;
      //animation state
      this.mixers = [];
      this.object = [];
      this.simpleobject = [];  
      this.resourcename = ["cab", "food"];
      this.setbounds = [];


      this.stoneGeo = new THREE.BoxGeometry(0,0,0);

      this._RAF();
      

  }


  //
  _InitializeLights(){
      //lighting
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.7))

      let dirLight = new THREE.DirectionalLight(0xffffff, 1)
      dirLight.position.set(- 60, 100, - 10);
      dirLight.castShadow = true;
      dirLight.shadow.camera.top = 50;
      dirLight.shadow.camera.bottom = - 50;
      dirLight.shadow.camera.left = - 50;
      dirLight.shadow.camera.right = 50;
      dirLight.shadow.camera.near = 0.1;
      dirLight.shadow.camera.far = 200;
      dirLight.shadow.mapSize.width = 4096;
      dirLight.shadow.mapSize.height = 4096;
      this.scene.add(dirLight);

      dirLight = new THREE.AmbientLight(0x101010);
      this.scene.add(dirLight);
  }

  _InitializeCamera() {
      //camera
      this.camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.set(75, 20, 0);

      const orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
      orbitControls.enableDamping = true
      orbitControls.minDistance = 25
      orbitControls.maxDistance = 155
      orbitControls.enablePan = false
      orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
      orbitControls.update();


     
      // this.dControls = new DragControls(this.object, this.camera, this.renderer.domElement);
      // this.dControls.transformGroup = false;
      // this.dControls.addEventListener("hoveron", function (event) {
        
      //  // event.object.material.wireframe = true;
      //   orbitControls.enabled = false;
      // });
      // this.dControls.addEventListener("hoveroff", function (event) {
        
      //  // event.object.material.wireframe = false;
      //   orbitControls.enabled = true;
      // }); 

      // this.dControls2 = new DragControls(this.simpleobject, this.camera, this.renderer.domElement);
      // this.dControls2.transformGroup = false;
      // this.dControls2.addEventListener("hoveron", function (event) {
        
      //  // event.object.material.wireframe = true;
      //   orbitControls.enabled = false;
      // });
      // this.dControls2.addEventListener("hoveroff", function (event) {
        
      //  // event.object.material.wireframe = false;
      //   orbitControls.enabled = true;
      // });    
  }
  _InitializeScene() {
      //geometry
      const textures = new THREE.TextureLoader();
      const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
      const floorMaterial= this.loadMaterial_('Metal_ArtDeco_Tiles_001_', 4);
      // floor.anisotropy = maxAnisotropy;
      // floor.wrapS = THREE.RepeatWrapping;
      // floor.wrapT = THREE.RepeatWrapping;
      // floor.repeat.set(32, 32);
      // floor.encoding = THREE.sRGBEncoding;
      this.plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 10, 10),
        floorMaterial);
    this.plane.castShadow = false;
    this.plane.receiveShadow = true;
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.userData.ground= true;
   this.plane1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    //gets the boundaries
    this.plane1BB.setFromObject(this.plane);
    this.scene.add(this.plane);
        //  this._LoadtestModel();
    
    const wallMaterial = this.loadMaterial_('Substance_graph_', 4);

    const wall1 = new THREE.Mesh(
      new THREE.BoxGeometry(100, 100, 4),
      wallMaterial);
    wall1.position.set(0, 40, -50);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    this.scene.add(wall1);

    const wall2 = new THREE.Mesh(
      new THREE.BoxGeometry(100, 100, 4),
      wallMaterial);
    wall2.position.set(0, 40, 50);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    this.scene.add(wall2);



    const wall4 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 100, 100),
      wallMaterial);
    wall4.position.set(-50, 40, 0);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    this.scene.add(wall4);

    
    this._Load2Model();
    this._LoadCouchModel();
    this._Load2PlateModel(); 
    this._LoadBigTableModel();
    this._LoadBookModel();

  }


  loadMaterial_(name, tiling) {
    //you can use this to load mateirials. edit the stuff in here and remove placeholder assets
    const mapLoader = new THREE.TextureLoader();
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const metalMap = mapLoader.load('resources/walls/' + name + 'metallic.jpg');
    metalMap.anisotropy = maxAnisotropy;
    metalMap.wrapS = THREE.RepeatWrapping;
    metalMap.wrapT = THREE.RepeatWrapping;
    metalMap.repeat.set(tiling, tiling);

    const albedo = mapLoader.load('resources/walls/' + name + 'basecolor.jpg');
    albedo.anisotropy = maxAnisotropy;
    albedo.wrapS = THREE.RepeatWrapping;
    albedo.wrapT = THREE.RepeatWrapping;
    albedo.repeat.set(tiling, tiling);
    albedo.encoding = THREE.sRGBEncoding;

    const normalMap = mapLoader.load('resources/walls/' + name + 'normal.jpg');
    normalMap.anisotropy = maxAnisotropy;
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(tiling, tiling);

    const roughnessMap = mapLoader.load('resources/walls/' + name + 'roughness.jpg');
    roughnessMap.anisotropy = maxAnisotropy;
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(tiling, tiling);

    const material = new THREE.MeshStandardMaterial({
      metalnessMap: metalMap,
      map: albedo,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
    });

    return material;
  }

  //animated model
  _loadCube () {
    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshPhongMaterial({
          color: 0xFFFFFF,
        }));
        this.box.position.set(5,5,15);
        this.box.castShadow = true;
        this.box.receiveShadow = true;


    //bounding box
    this.box1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    //gets the boundaries
    this.box1BB.setFromObject(this.box);
    //console.log(box1BB);
    this.simpleobject.push(this.box);   
    this.scene.add(this.box) ;
    this.box.userData.draggable = true;
    this.box.userData.name = "BOX";
  }

  //static model

  _LoadCouchModel() {
    
    const loader = new GLTFLoader();
    
    loader.load('./resources/couch/couch.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
    
          });
        // console.log(gltf.scene.children[0].children[0].children[0].children[0].children[0]);

         //stoneGeo = mergeBufferGeometries([stoneGeo,gltf.scene.children[0].children[0] ]);
         gltf.scene.children[0].children[0].children[0].children[0].children[0].position.set(0,0,-20);
         gltf.scene.children[0].children[0].children[0].children[0].children[0].scale.set(.1,.1,.1); 

          this.object.push(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
          gltf.scene.children[0].children[0].children[0].children[0].children[0].userData.draggable = true;
           gltf.scene.children[0].children[0].children[0].children[0].children[0].userData.name = "couch";
          
        //       //bounding box
               this.rok7BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        //       //gets the boundaries
              this.rok7BB.setFromObject(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
        //  // console.log(this.rok1BB);     
          this.scene.add(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
  
  
    });
    //this.object.push(this.objectGroup);
  }

  _LoadBigTableModel() {
    
    const loader = new GLTFLoader();
    
    loader.load('./resources/table/couch.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
    
          });
        // console.log(gltf.scene.children[0]);

         //stoneGeo = mergeBufferGeometries([stoneGeo,gltf.scene.children[0].children[0] ]);
         gltf.scene.children[0].position.set(-20,0,-20);
         gltf.scene.children[0].scale.set(15,10,12); 
         gltf.scene.children[0].rotation.y = Math.PI/2;
          this.object.push(gltf.scene.children[0]);
          gltf.scene.children[0].userData.draggable = true;
          gltf.scene.children[0].userData.name = "big table";
          
        //       //bounding box
               this.rok1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        //       //gets the boundaries
              this.rok1BB.setFromObject(gltf.scene.children[0]);
        //  // console.log(this.rok1BB);     
          this.scene.add(gltf.scene.children[0]);
  
  
    });
    //this.object.push(this.objectGroup);
  }

  _LoadBookModel() {
    
    const loader = new GLTFLoader();
    
    loader.load('./resources/book/book.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
    
          });
         console.log(gltf.scene.children[0]);

         //stoneGeo = mergeBufferGeometries([stoneGeo,gltf.scene.children[0].children[0] ]);
         gltf.scene.children[0].position.set(-20,0,-20);
         gltf.scene.children[0].scale.set(1,1,1); 
         gltf.scene.children[0].rotation.z = Math.PI/2;
          this.object.push(gltf.scene.children[0]);
          gltf.scene.children[0].userData.draggable = true;
          gltf.scene.children[0].userData.name = "book";
          
        //       //bounding box
               this.rok2BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        //       //gets the boundaries
              this.rok2BB.setFromObject(gltf.scene.children[0]);
        //  // console.log(this.rok1BB);     
          this.scene.add(gltf.scene.children[0]);
  
  
    });
    //this.object.push(this.objectGroup);
  }

  _Load2Model() {

    const loader = new GLTFLoader();

    loader.load('./resources/cab/scene.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
            
          });
         // console.log(gltf)
          gltf.scene.children[0].children[0].children[0].children[0].position.set(0,0,0);
          gltf.scene.children[0].children[0].children[0].children[0].children[0].scale.set(2,2,2)
          //this.objectGroup.add(gltf.scene)
          this.object.push(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
         gltf.scene.children[0].children[0].children[0].children[0].children[0].userData.draggable = true;
          gltf.scene.children[0].children[0].children[0].children[0].children[0].userData.name = "Table2";
              //bounding box
          this.rok5BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
            //gets the boundaries
           this.rok5BB.setFromObject(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
        // console.log(this.rok1BB);     
          this.scene.add(gltf.scene.children[0].children[0].children[0].children[0].children[0]);


    });
    //this.object.push(this.objectGroup);
}  





_Load2PlateModel() {

  const loader = new GLTFLoader();

  loader.load('./resources/plate/scene.gltf', (gltf) => {
      gltf.scene.traverse(c => {
          c.castShadow = true;
          
        });

        gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0].rotation.set(-Math.PI/2,0,0)
        gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0].scale.set(1/6,1/6,1/6)
        gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0].position.set(10,1,0)
        //this.objectGroup.add(gltf.scene)
        gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0].userData.draggable = true;
        gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0].userData.name = "Plate2";
        this.object.push(gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0]);
            //bounding box
            this.rok6BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
            //gets the boundaries
           this.rok6BB.setFromObject(gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0]);
        //console.log(gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0]);     
        this.scene.add(gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0]);


  });
  //this.object.push(this.objectGroup);
}
  _OnWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  _checkCollisions(name, index) {

    if(this.object.length >=5) {
      
      for(let i = 0; i< this.object.length; i++) {
   
        // this.rok1BB.copy(this.object[1].children[0].children[0].children[0].children[0].children[0].geometry.boundingBox).applyMatrix4(this.object[1].children[0].children[0].children[0].children[0].children[0].matrixWorld)
        // this.rok3BB.copy(this.object[0].children[0].children[0].children[0].children[0].children[0].children[0].geometry.boundingBox).applyMatrix4(this.object[0].children[0].children[0].children[0].children[0].children[0].children[0].matrixWorld)
        if(this.object[i].userData.name =="Plate2") {
          this.rok5BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
          if(this.rok6BB.intersectsBox(this.rok5BB) || this.rok6BB.containsBox(this.rok5BB)){
            this.object[i].position.y= this.rok6BB.max.y+0.4; 
          } else if(this.rok1BB.intersectsBox(this.rok5BB) || this.rok1BB.containsBox(this.rok5BB)){
            this.object[i].position.y= this.rok1BB.max.y+0.4; 
          }else {
            this.object[i].position.y =1;
          }

        }
        if(this.object[i].userData.name =="Table2") {
          this.rok6BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
          if(this.rok1BB.intersectsBox(this.rok6BB) || this.rok1BB.containsBox(this.rok6BB)){
            this.object[i].position.y= this.rok1BB.max.y; 
          } else {
            this.object[i].position.y =1;
          }
        }
        if(this.object[i].userData.name =="couch") {
           this.rok7BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
        }
        if(this.object[i].userData.name =="big table") {
          this.rok1BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);

       }
       if(this.object[i].userData.name =="book") {
        this.rok2BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
        if(this.rok6BB.intersectsBox(this.rok2BB) || this.rok6BB.containsBox(this.rok2BB)){
          this.object[i].position.y= this.rok6BB.max.y-0.6; 
        } else if(this.rok1BB.intersectsBox(this.rok2BB) || this.rok1BB.containsBox(this.rok2BB)){
          this.object[i].position.y= this.rok1BB.max.y-0.6; 
        }else {
          this.object[i].position.y =0;
        }
     }     
 
        
     
     }
      if(this.rok6BB.intersectsBox(this.box1BB) || this.rok6BB.containsBox(this.box1BB)) {
        this.box.position.y=this.rok6BB.max.y+5;
      } else {
        this.box.position.y =5;
      }


    }

  }
simpleAction(){

}    
raycast() {
  this.raycaster = new THREE.Raycaster();
  this.clickMouse = new THREE.Vector2();
  this.moveMouse = new THREE.Vector2();
  this.draggable =[];

  window.addEventListener("click",  (event) => {

    if(this.draggable[0]) {
      console.log('drag is gonezos '+ this.draggable[0].userData.name)
      this.draggable.pop();
      return;
    }
        
    this.clickMouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.clickMouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    this.raycaster.setFromCamera( this.clickMouse, this.camera );
    this.found = this.raycaster.intersectObjects( this.scene.children);
    console.log(this.found[0])
    if(this.found.length>0 && this.found[0].object.userData.draggable) {
      this.draggable.push(this.found[0].object);
      console.log(this.draggable[0].userData.name);
    }
   }); 


   window.addEventListener("mousemove",  (event) => {


    this.moveMouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.moveMouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;


   });    
  
}

dragObject() {
  if(this.draggable[0] != null) {
    //console.log("here");
    this.raycaster.setFromCamera( this.moveMouse, this.camera );
    this.found2 = this.raycaster.intersectObjects( this.scene.children );
    if(this.found2.length>0) {
      for(let o of this.found2){
        if(!o.object.userData.ground)
          continue
        //console.log(o.point.x)  
        this.draggable[0].position.x = o.point.x;
        this.draggable[0].position.z = o.point.z;

      }
    }
  }
}
  _RAF() {
      requestAnimationFrame((t) => {
          if (this.previousRAF === null) {
            this.previousRAF = t;
          }
          this.dragObject();
          if(this.object.length>= 2) {
            //console.log(this.object)
            //console.log(this.object[1].children[0].children[0].children[0].children[0].children[0]);
          //  for(let i = 0; i< this.object.length; i++) {
          //     // this.rok1BB.copy(this.object[1].children[0].children[0].children[0].children[0].children[0].geometry.boundingBox).applyMatrix4(this.object[1].children[0].children[0].children[0].children[0].children[0].matrixWorld)
          //     // this.rok3BB.copy(this.object[0].children[0].children[0].children[0].children[0].children[0].children[0].geometry.boundingBox).applyMatrix4(this.object[0].children[0].children[0].children[0].children[0].children[0].children[0].matrixWorld)
          //     if(this.object[i].userData.name =="Table2") {
          //       this.rok5BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld)
          //     }
          //     if(this.object[i].userData.name =="Plate2") {
          //       this.rok6BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld)
          //     }
          //     if(this.object[i].userData.name =="couch") {
          //       this.rok7BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld)
          //     }    
              
           
          //  }
          
             // console.log(this.rok1BB);
          }
          if(this.simpleobject.length>= 1) {
            for(let i = 0; i< this.simpleobject.length; i++) {
              this.box1BB.copy(this.simpleobject[i].geometry.boundingBox).applyMatrix4(this.simpleobject[i].matrixWorld)
          
            }
          
             // console.log(this.rok1BB);
          }

          
          this._checkCollisions();
          this._RAF();
    
          this.renderer.render(this.scene, this.camera);
          this._Step(t - this.previousRAF);
          this.previousRAF = t;
        });
  }

  _Step(timeElapsed) {
      const timeElapsedS = timeElapsed * 0.001;
      if (this.mixers) {
        this.mixers.map(m => m.update(timeElapsedS));
      }
  
      if (this.controls) {
        this.controls.Update(timeElapsedS);
      }
  }
  

}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
_APP = new loadedWorld();
});