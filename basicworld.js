//import { KeyDisplay } from './utils';
//import { CharacterControls } from './characterControls';
import * as THREE from 'three';

import { OrbitControls } from "./build/three/examples/jsm/controls/OrbitControls.js";
import {DragControls} from './build/three/examples/jsm/controls/DragControls.js';

import {FBXLoader} from './build/three/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from './build/three/examples/jsm/loaders/GLTFLoader.js';
import datGui from 'https://cdn.skypack.dev/dat.gui';
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
     // this._loadCube();
      this.raycast();
  
      this.loadAll();
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

      this.params = {
        MAX_HEIGHT: 100,
        MAX_WIDTH: 100,
    
     }
     this.wallMaterial =this.loadMaterial_('Substance_graph_', 4);
     this.floorMaterial= this.loadMaterial_('Metal_ArtDeco_Tiles_001_', 4);

   this.gui = new datGui.GUI();
      window.addEventListener("keydown",  (e) => {
     
        if(this.draggable[0]) {
          
            switch (e.key) {

              case "ArrowLeft":
                this.draggable[0].rotation.y -= 0.1;
              break;

              case "ArrowRight":
              this.draggable[0].rotation.y += 0.1;
              break;
            }
          if(this.draggable[0].userData.name == "lantern") {
            switch (e.key) {
              case "ArrowUp":
                this.draggable[0].children[6].intensity =0;
                //console.log(this.draggable[0].rotation.x);
              break;
              case "ArrowDown":
                this.draggable[0].children[6].intensity =1.5;
                //console.log(this.draggable[0].rotation.x);
              break;

            }
          }
          }



    }); 

      this._RAF();
      

  }


  //
  _InitializeLights(){
      //lighting
      this.scene.add(new THREE.AmbientLight(0xffffff, 1))

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
      //this.scene.add(dirLight);

      dirLight = new THREE.AmbientLight(0x101010);
      //this.scene.add(dirLight);


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
 
  }
  _InitializeScene() {
      //geometry


      this.plane = new THREE.Mesh(
        new THREE.PlaneGeometry(this.params.MAX_WIDTH, this.params.MAX_HEIGHT, 10, 10),
        this.floorMaterial);
    this.plane.castShadow = false;
    this.plane.receiveShadow = true;
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.userData.ground= true;
    this.plane.userData.name = "wall";
   this.plane1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    //gets the boundaries
    this.plane1BB.setFromObject(this.plane);
    this.scene.add(this.plane);

    const wall1 = new THREE.Mesh(
      new THREE.BoxGeometry(this.params.MAX_WIDTH, 100, 4),
      this.wallMaterial);
    wall1.position.set(0, 40, -this.params.MAX_HEIGHT/2);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    wall1.userData.name ="wall";
    //bounding box
    this.wall1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    //gets the boundaries
    this.wall1BB.setFromObject(wall1);
    this.scene.add(wall1);

    const wall2 = new THREE.Mesh(
      new THREE.BoxGeometry(this.params.MAX_WIDTH, 100, 4),
      this.wallMaterial);
    wall2.position.set(0, 40, this.params.MAX_HEIGHT/2);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    wall2.userData.name ="wall";
    //bounding box
    this.wall2BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    //gets the boundaries
    this.wall2BB.setFromObject(wall2);
    this.scene.add(wall2);



    const wall3 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 100, this.params.MAX_HEIGHT),
      this.wallMaterial);
    wall3.position.set(-this.params.MAX_WIDTH/2, 40, 0);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    wall3.userData.name ="wall";
    //bounding box
    this.wall3BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    //gets the boundaries
    this.wall3BB.setFromObject(wall3);    
    this.scene.add(wall3);

    

    
  }

  loadAll() {
    this._Load2Model();
    this._LoadCouchModel();
    this._Load2PlateModel(); 
    this._LoadBigTableModel();
    this._LoadBookModel();
    this._LoadSomeModel();
    this._LoadBedModel();
    this.gui.add(this.params,'MAX_HEIGHT',100,150).name("Change Height").onChange(()=>this.sceneControls());
    this.gui.add(this.params,'MAX_WIDTH',100,150).name("Change Width").onChange(()=>this.sceneControls());
  }

sceneControls() {
      if(this.scene.children){
        for(let k = 0; k <10; k++){
            for(let i = 0; i < this.scene.children.length; i++){
                if(this.scene.children[i].userData.name == "wall"){
                    console.log("yes")
                    this.scene.children[i].geometry.dispose();
                    this.scene.remove(this.scene.getObjectById( this.scene.children[i].id, true ));
                }
              
            
            
            }
            if(k == 9) {
                this._InitializeScene();
            }
        }
      }

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

    const base = mapLoader.load('resources/walls/' + name + 'base.jpg');
    base.anisotropy = maxAnisotropy;
    base.wrapS = THREE.RepeatWrapping;
    base.wrapT = THREE.RepeatWrapping;
    base.repeat.set(tiling, tiling);
    base.encoding = THREE.sRGBEncoding;

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
      map: base,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
    });

    return material;
  }

  _LoadBookModel() {
    
    const loader = new GLTFLoader();
    
    loader.load('./resources/book/book.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
    
          });
         console.log(gltf.scene.children[0]);

  
         gltf.scene.children[0].position.set(-20,0,20);
         gltf.scene.children[0].scale.set(1.5,1.5,1.5); 
         gltf.scene.children[0].rotation.z = Math.PI/2;
          this.object.push(gltf.scene.children[0]);
          gltf.scene.children[0].userData.draggable = true;
          gltf.scene.children[0].userData.name = "book";
          
        //       //bounding box
               this.bookBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        //       //gets the boundaries
              this.bookBB.setFromObject(gltf.scene.children[0]);
  
          this.scene.add(gltf.scene.children[0]);

    });

  }

  _LoadCouchModel() {
    
    const loader = new GLTFLoader();
    
    loader.load('./resources/couch/couch.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
    
          });
         gltf.scene.children[0].children[0].children[0].children[0].children[0].position.set(0,0,-20);
         gltf.scene.children[0].children[0].children[0].children[0].children[0].scale.set(.2,.2,.2); 

          this.object.push(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
          gltf.scene.children[0].children[0].children[0].children[0].children[0].userData.draggable = true;
           gltf.scene.children[0].children[0].children[0].children[0].children[0].userData.name = "couch";
          
        //       //bounding box
               this.rok7BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        //       //gets the boundaries
              this.rok7BB.setFromObject(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
   
          this.scene.add(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
  
  
    });
   
  }

  _LoadBigTableModel() {
    
    const loader = new GLTFLoader();
    
    loader.load('./resources/table/couch.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
    
          });

         gltf.scene.children[0].position.set(-20,0,20);
         gltf.scene.children[0].scale.set(20,15,15); 
         gltf.scene.children[0].rotation.y = Math.PI/2;
          this.object.push(gltf.scene.children[0]);
          gltf.scene.children[0].userData.draggable = true;
          gltf.scene.children[0].userData.name = "big table";
          
        //       //bounding box
               this.bigTableBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        //       //gets the boundaries
              this.bigTableBB.setFromObject(gltf.scene.children[0]);
        //  // console.log(this.bigTableBB);     
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
          this.tableBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
            //gets the boundaries
           this.tableBB.setFromObject(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
    
          this.scene.add(gltf.scene.children[0].children[0].children[0].children[0].children[0]);


    });

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
            this.plateBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
            //gets the boundaries
           this.plateBB.setFromObject(gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0]);
        //console.log(gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0]);     
        this.scene.add(gltf.scene.children[0].children[0].children[0].children[0].children[0].children[0]);


  });
  //this.object.push(this.objectGroup);
}

_LoadSomeModel() {

  const loader = new GLTFLoader();

  loader.load('./resources/light/lantern.gltf', (gltf) => {
      gltf.scene.traverse(c => {
          c.castShadow = true;
          
        });


        gltf.scene.children[0].userData.draggable = true;
        gltf.scene.children[0].userData.name = "lantern";
        //gltf.scene.children[0].rotation.x = -Math.PI/2;
        gltf.scene.children[0].position.set(15,0,15);
        let spotLight = new THREE.PointLight( 0xffffff );
        spotLight.castShadow = true;

        spotLight.intensity =1.5;
        spotLight.distance =100;
        //spotLight.angle = -Math.PI;
        spotLight.position.set( 0, 20, 0 );
  
        gltf.scene.children[0].add( spotLight );
        
       this.object.push(gltf.scene.children[0]);
            //bounding box
        this.lanternBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
            //gets the boundaries
         this.lanternBB.setFromObject(gltf.scene.children[0]);

        this.scene.add(gltf.scene.children[0]);


  });

}

_LoadBedModel() {

  const loader = new GLTFLoader();

  loader.load('./resources/bed/bed2.gltf', (gltf) => {
      gltf.scene.traverse(c => {
          c.castShadow = true;
          
        });
          console.log(gltf.scene.children[0]);

        gltf.scene.children[0].userData.draggable = true;
        gltf.scene.children[0].userData.name = "bed";
        //gltf.scene.children[0].rotation.x = -Math.PI/2;
        gltf.scene.children[0].position.set(15,0,15);
        gltf.scene.children[0].scale.set(.4,.4,.4); 

       this.object.push(gltf.scene.children[0]);
            //bounding box
        this.bedBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
            //gets the boundaries
         this.bedBB.setFromObject(gltf.scene.children[0]);

        this.scene.add(gltf.scene.children[0]);


  });

}
  _OnWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  _checkCollisions() {
   
    if(this.object.length >=7) {
     
      for(let i = 0; i< this.object.length; i++) {
        if(this.object[i].userData.name =="Plate2") {
          this.plateBB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
          this.simpleAction(i,this.tableBB);
          if(this.plateBB.intersectsBox(this.tableBB) || this.plateBB.containsBox(this.tableBB)){
            this.object[i].position.y= this.tableBB.max.y+0.4; 
          } else if(this.plateBB.intersectsBox(this.bigTableBB) || this.plateBB.containsBox(this.bigTableBB)){
            this.object[i].position.y= this.bigTableBB.max.y+0.4; 
          } else if(this.plateBB.intersectsBox(this.bedBB) || this.plateBB.containsBox(this.bedBB)){
            this.object[i].position.y= this.bedBB.max.y-7; 
          } else if(this.plateBB.intersectsBox(this.rok7BB) || this.plateBB.containsBox(this.rok7BB)){
            this.object[i].position.y= this.rok7BB.max.y-7.5; 
          } else {
            this.object[i].position.y =1;
          }
         
        }
        if(this.object[i].userData.name =="Table2") {
          this.tableBB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
          this.simpleAction(i,this.plateBB);
          if(this.bigTableBB.intersectsBox(this.tableBB) || this.bigTableBB.containsBox(this.tableBB)){
            this.object[i].position.y= this.bigTableBB.max.y; 
          } else {
            this.object[i].position.y =1;
          }
        }
        if(this.object[i].userData.name =="couch") {
           this.rok7BB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
           this.simpleAction(i,this.rok7BB);
        }
        if(this.object[i].userData.name =="big table") {
          this.bigTableBB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
          this.simpleAction(i,this.bigTableBB);
       }
       if(this.object[i].userData.name =="book") {
        //console.log("hhhhhh");
        this.bookBB.copy(this.object[i].geometry.boundingBox).applyMatrix4(this.object[i].matrixWorld);
        this.simpleAction(i,this.bookBB);
        if(this.tableBB.intersectsBox(this.bookBB) || this.tableBB.containsBox(this.bookBB)){
          this.object[i].position.y= this.tableBB.max.y-1; 
        } else if(this.bigTableBB.intersectsBox(this.bookBB) || this.bigTableBB.containsBox(this.bookBB)){
          this.object[i].position.y= this.bigTableBB.max.y-1; 
        } else if(this.bookBB.intersectsBox(this.bedBB) || this.bookBB.containsBox(this.bedBB)){
          this.object[i].position.y= this.bedBB.max.y-8; 
        } else if(this.bookBB.intersectsBox(this.rok7BB) || this.bookBB.containsBox(this.rok7BB)){
          this.object[i].position.y= this.rok7BB.max.y-8.5; 
        } else {
          this.object[i].position.y =0;
        }
     }     
     if(this.object[i].userData.name =="lantern") {

      this.lanternBB.copy(this.object[i].children[4].geometry.boundingBox).applyMatrix4(this.object[i].children[4].matrixWorld);
      this.simpleAction(i,this.tableBB);
      if(this.lanternBB.intersectsBox(this.tableBB) || this.lanternBB.containsBox(this.tableBB)){
        this.object[i].position.y= this.tableBB.max.y-0.5; 
      } else if(this.bigTableBB.intersectsBox(this.lanternBB) || this.bigTableBB.containsBox(this.lanternBB)){
        this.object[i].position.y= this.bigTableBB.max.y-0.5; 
      } else if(this.lanternBB.intersectsBox(this.bedBB) || this.lanternBB.containsBox(this.bedBB)){
        this.object[i].position.y= this.bedBB.max.y-7; 
      }else if(this.lanternBB.intersectsBox(this.rok7BB) || this.lanternBB.containsBox(this.rok7BB)){
        this.object[i].position.y= this.rok7BB.max.y-8; 
      } else {
        this.object[i].position.y =0;
      }
    }

    if(this.object[i].userData.name =="bed") {

      this.bedBB.copy(this.object[i].children[2].geometry.boundingBox).applyMatrix4(this.object[i].children[2].matrixWorld);

    }
        
     
     }


    }

  }
simpleAction(i, box){

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

    if((this.found.length>0 && this.found[0].object.userData.draggable)) {
      this.draggable.push(this.found[0].object);
 
    } else if((this.found.length>0 && this.found[0].object.parent.userData.draggable)) {
      this.draggable.push(this.found[0].object.parent);

    }
   }); 


   window.addEventListener("mousemove",  (event) => {


    this.moveMouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.moveMouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;


   }); 
}

dragObject() {
  if(this.draggable[0] != null) {

    this.raycaster.setFromCamera( this.moveMouse, this.camera );
    this.found2 = this.raycaster.intersectObjects( this.scene.children );
    if(this.found2.length>0) {
      for(let o of this.found2){
        if(!o.object.userData.ground)
          continue
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