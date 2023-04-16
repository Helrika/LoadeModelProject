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

      this.dControls = new DragControls(this.object, this.camera, this.renderer.domElement);
      this.dControls.transformGroup = false;
      this.dControls.addEventListener("hoveron", function (event) {
        
       // event.object.material.wireframe = true;
        orbitControls.enabled = false;
      });
      this.dControls.addEventListener("hoveroff", function (event) {
        
       // event.object.material.wireframe = false;
        orbitControls.enabled = true;
      }); 

      this.dControls2 = new DragControls(this.simpleobject, this.camera, this.renderer.domElement);
      this.dControls2.transformGroup = false;
      this.dControls2.addEventListener("hoveron", function (event) {
        
       // event.object.material.wireframe = true;
        orbitControls.enabled = false;
      });
      this.dControls2.addEventListener("hoveroff", function (event) {
        
       // event.object.material.wireframe = false;
        orbitControls.enabled = true;
      });    
  }
  _InitializeScene() {
      //geometry
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    let plane1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    //gets the boundaries
    plane1BB.setFromObject(plane);
    this.scene.add(plane);
    
    this._LoadModel(); 
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
  }

  //static model
  _LoadModel() {

      const loader = new GLTFLoader();
      loader.load('./resources/cab/scene.gltf', (gltf) => {
          gltf.scene.traverse(c => {
              c.castShadow = true;
              
            });
            console.log(gltf)
            gltf.scene.position.x =20;
            gltf.scene.scale.x = 2;
            gltf.scene.scale.y = 2;
            gltf.scene.scale.z = 2;
            //this.objectGroup.add(gltf.scene)
            this.object.push(gltf.scene);
                //bounding box
            this.rok1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
              //gets the boundaries
             this.rok1BB.setFromObject(gltf.scene);
            console.log(this.rok1BB);     
            this.scene.add(gltf.scene);

  
      });
      //this.object.push(this.objectGroup);
  }

  _OnWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  _checkCollisions() {
    // console.log(this.rok1BB);
    // console.log("heheh")
    // console.log(this.box1BB)
    if(this.object.length >=1) {
      if(this.rok1BB.intersectsBox(this.box1BB)) {
        this.box.position.y=this.rok1BB.max.y+5;
      } else {
        this.box.position.y =5;
      }
    }

  }  
  
  _RAF() {
      requestAnimationFrame((t) => {
          if (this.previousRAF === null) {
            this.previousRAF = t;
          }
          if(this.object.length>= 1) {
            for(let i = 0; i< this.object.length; i++) {
              this.rok1BB.copy(this.object[i].children[0].children[0].children[0].children[0].children[0].geometry.boundingBox).applyMatrix4(this.object[i].children[0].children[0].children[0].children[0].children[0].matrixWorld)
          
            }
          
             // console.log(this.rok1BB);
          }
          if(this.simpleobject.length>= 1) {
            for(let i = 0; i< this.object.length; i++) {
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