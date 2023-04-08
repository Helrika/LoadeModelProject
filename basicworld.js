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

      //camera
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.set(75, 20, 0);

      const orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
      orbitControls.enableDamping = true
      orbitControls.minDistance = 25
      orbitControls.maxDistance = 155
      orbitControls.enablePan = false
      orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
      orbitControls.update();

      //geometry
      const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(100, 100, 10, 10),
          new THREE.MeshStandardMaterial({
              color: 0xFFFFFF,
            }));
      plane.castShadow = false;
      plane.receiveShadow = true;
      plane.rotation.x = -Math.PI / 2;
      this.scene.add(plane);
      this.object = [];
      this._LoadModel();      
      this._RAF();
      
      this.dControls = new DragControls(this.object, this.camera, this.renderer.domElement);

      this.dControls.addEventListener("hoveron", function (event) {
        
        event.object.material.wireframe = true;
      });
      this.dControls.addEventListener("hoveroff", function (event) {
        
        event.object.material.wireframe = false;
      });
  }

  //animated model

  _LoadAnimatedModel() {
      const loader = new FBXLoader();
      loader.setPath('./resources/peasant/');
      loader.load('PeasantGirl.fbx', (fbx) => {
        fbx.scale.setScalar(0.1);
        fbx.traverse(c => {
          c.castShadow = true;
        });
  
        const params = {
          target: fbx,
          camera: this.camera,
        }
        this.controls = new BasicCharacterControls(params);
  
        const anim = new FBXLoader();
        anim.setPath('./resources/peasant/');
        anim.load('Walking.fbx', (anim) => {
          const m = new THREE.AnimationMixer(fbx);
          this.mixers.push(m);
          const idle = m.clipAction(anim.animations[0]);
          idle.play();
        });
        this.scene.add(fbx);
      });

  }
  // _LoadAnimatedModelAndPlay(path, modelFile, animFile, offset) {
  //     const loader = new FBXLoader();
  //     loader.setPath(path);
  //     loader.load(modelFile, (fbx) => {
  //       fbx.scale.setScalar(0.1);
  //       fbx.traverse(c => {
  //         c.castShadow = true;
  //       });
  //       fbx.position.copy(offset);
  
  //       const anim = new FBXLoader();
  //       anim.setPath(path);
  //       anim.load(animFile, (anim) => {
  //         const m = new THREE.AnimationMixer(fbx);
  //         this._mixers.push(m);
  //         const idle = m.clipAction(anim.animations[0]);
  //         idle.play();
  //       });
  //       this.scene.add(fbx);
  //     });
  //   }
  //static model
  _LoadModel() {

      const loader = new GLTFLoader();
      loader.load('./resources/rocket/Rocket_Ship_01.gltf', (gltf) => {
          gltf.scene.traverse(c => {
              c.castShadow = true;
            });
            this.object.push(gltf.scene);
            this.scene.add(gltf.scene);

  
      });
  }

  _OnWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  
  _RAF() {
      requestAnimationFrame((t) => {
          if (this.previousRAF === null) {
            this.previousRAF = t;
          }
    
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