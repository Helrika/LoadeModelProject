//import { KeyDisplay } from './utils';
//import { CharacterControls } from './characterControls';
import * as THREE from 'three';

import { OrbitControls } from "./build/three/examples/jsm/controls/OrbitControls.js";
import {DragControls} from './build/three/examples/jsm/controls/DragControls.js';
import Ammo from './build/ammo.js';
import {FBXLoader} from './build/three/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from './build/three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from './build/three/examples/jsm/loaders/DRACOLoader.js';
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

      this.clock = new THREE.Clock()

			this.rigidBodies = [];
			this.meshes = [];
			this.meshMap = new WeakMap();

      this.scene.add(plane);
      this.object = [];
      //this._LoadMoreModels(); 
      this.startAmmo();

     // this._LoadAnimatedModel();   
     this.objectGroup = new THREE.Group();  
      //this._RAF();
      
      this.dControls = new DragControls(this.object, this.camera, this.renderer.domElement);
      //this.dControls.transformGroup = true;
      this.dControls.addEventListener("hoveron", function (event) {
        
       // event.object.material.wireframe = true;
        orbitControls.enabled = false;
      });
      this.dControls.addEventListener("hoveroff", function (event) {
        
       // event.object.material.wireframe = false;
        orbitControls.enabled = true;
      });
      this.update();
  }

  //animated model
	startAmmo(){
		Ammo().then( (Ammo) => {
			Ammo = Ammo
			this.ammoClone = Ammo
			this.createAmmo(Ammo)
		})
	}

  createAmmo(Ammo = this.ammoClone){
		this.tempTransform = new Ammo.btTransform()

		this.setupPhysicsWorld(Ammo)
		this.createPlane(Ammo)
		this.createGLTF(Ammo)
		// this.createBall2(Ammo)
		
	}

	setupPhysicsWorld(Ammo = this.ammoClone){
		let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
		let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
		let overlappingPairCache = new Ammo.btDbvtBroadphase()
		let solver = new Ammo.btSequentialImpulseConstraintSolver()

		this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration)
		this.physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0))		
		console.log('physics world init')
	}

  createPlane(Ammo = this.ammoClone){
		let pos = {x: 0, y: 0, z: 0},
		scale = {x: 50, y: 1, z: 50},
		quat = {x: 0, y: 0, z: 0, w: 1},
		mass = 0

		//plane in threejs
		let blockPlane = new THREE.Mesh(new THREE.BoxGeometry(scale.x, scale.y, scale.z), new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 1, roughness: 0.3}))
		blockPlane.position.set(pos.x, pos.y, pos.z)
		
		blockPlane.castShadow = true
		blockPlane.receiveShadow = true

		this.scene.add(blockPlane)

		//physics in ammojs
		let transform = new Ammo.btTransform()
		transform.setIdentity()
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))

		let motionState = new Ammo.btDefaultMotionState(transform)

		let localInertia = new Ammo.btVector3(0, 0, 0)

		let shape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5))
		shape.setMargin(0.05)
		shape.calculateLocalInertia(mass, localInertia)

		let rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia)
		let rBody = new Ammo.btRigidBody(rigidBodyInfo)

		this.physicsWorld.addRigidBody(rBody)
	}

	createGLTF(Ammo = this.ammoClone){
		let pos = {x: 0, y: 4, z: 1},
		quat = {x: 0, y: 0, z: 0, w: 1},
		mass = 1

		this.loader = new GLTFLoader();
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('/build/draco/');
		this.loader.setDRACOLoader(dracoLoader);
		this.loader.load('./resources/bench/bench.gltf', (gltf) => {
      //gltf.scene.scale.set(0.001, 0.001, 0.001);
      // gltf.scene.traverse(c => {
      //   c.castShadow = true;
      //  // console.log(c);
      //   this.createInstances(c.geometry, c.material, Ammo);

      // });
      // gltf.scene.traverse( function ( object ) {
      //   if ( object.isMesh ){
      //     console.log(object);
      //   }
      // } );
      //this.object.push(gltf.scene);
     // console.log(gltf.scene.children[0].children[0].children[0].children[0].children[0]);
			const geometry = gltf.scene.children[0].children[0].children[0].children[0].children[0].geometry;
     // console.log(geometry);
      //findType(gltf.scene, 'Mesh');
			const material = gltf.scene.children[0].children[0].children[0].children[0].children[0].material;
      //gltf.scene.scale.set(10, 10, 10);
			this.createInstances(geometry, material, Ammo);
      //this.scene.add(gltf.scene);


		})
		

	}

	createInstances(geometry, material, Ammo){
		const matrix = new THREE.Matrix4();
		const count = 2;
		const mesh = new THREE.InstancedMesh(geometry, material, count);

		for(let i = 0; i < count; i++){
			this.randomizeMatrix(matrix);
			mesh.setMatrixAt( i, matrix );
			mesh.castShadow = true	;		
      mesh.scale.set(0.1,0.1,0.1);

		}
    console.log(mesh[0]);
    
		this.scene.add(mesh);
    this.object.push(mesh);

		let triangle, triangle_mesh = new Ammo.btTriangleMesh()
		//declare triangles position vectors
		let vectA = new Ammo.btVector3(0, 0, 0);
		let vectB = new Ammo.btVector3(0, 0, 0);
		let vectC = new Ammo.btVector3(0, 0, 0);

		//retrieve vertices positions from object
		let verticesPos = geometry.getAttribute('position').array
		let triangles = [];
		for (let i = 0; i < verticesPos.length; i += 3) {
			triangles.push({
				x: verticesPos[i],
				y: verticesPos[i + 1],
				z: verticesPos[i + 2]
			})
		}

		for (let i = 0; i < triangles.length - 3; i += 3) {

			vectA.setX(triangles[i].x);
			vectA.setY(triangles[i].y);
			vectA.setZ(triangles[i].z);

			vectB.setX(triangles[i + 1].x);
			vectB.setY(triangles[i + 1].y);
			vectB.setZ(triangles[i + 1].z);

			vectC.setX(triangles[i + 2].x);
			vectC.setY(triangles[i + 2].y);
			vectC.setZ(triangles[i + 2].z);

			triangle_mesh.addTriangle(vectA, vectB, vectC, true);
		}
		
		Ammo.destroy(vectA);
		Ammo.destroy(vectB);
		Ammo.destroy(vectC);

		let shape = new Ammo.btConvexTriangleMeshShape( triangle_mesh, true);
		
		geometry.verticesNeedUpdate = true;

		this.handleInstancedMesh(mesh, shape, 1, Ammo);
	}

	handleInstancedMesh(mesh, shape, mass, Ammo){
		const array = mesh.instanceMatrix.array;

		const bodies = [];

		for(let i = 0; i < mesh.count; i++){
			const index = i * 16;
			
			const transform = new Ammo.btTransform();
			transform.setFromOpenGLMatrix( array.slice( index, index + 16 ) );

			const motionState = new Ammo.btDefaultMotionState( transform );

			const localInertia = new Ammo.btVector3( 0, 0, 0 );
			shape.calculateLocalInertia(mass, localInertia);

			const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
			const body = new Ammo.btRigidBody( rbInfo );
			this.physicsWorld.addRigidBody( body );

			bodies.push( body );
		}

		this.meshes.push(mesh);
		this.meshMap.set(mesh, bodies);

		let index = Math.floor(Math.random() * mesh.count);
		let position = new THREE.Vector3();
		position.set(0, Math.random() + 1, 0);
		this.setMeshPosition(mesh, position, index, Ammo);
	}

	setMeshPosition(mesh, position, index, Ammo) {
		if(mesh.isInstancedMesh){
			const bodies = this.meshMap.get(mesh);
			const body = bodies[index];

			body.setAngularVelocity( new Ammo.btVector3(0, 0, 0));
			body.setLinearVelocity( new Ammo.btVector3(0, 0, 0));

			this.tempTransform.setIdentity();
			this.tempTransform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
			body.setWorldTransform( this.tempTransform);
		}
	}

	randomizeMatrix = function () {

		const position = new THREE.Vector3();
		const rotation = new THREE.Euler();
		const quaternion = new THREE.Quaternion();
		const scale = new THREE.Vector3();

		return function ( matrix ) {

			position.x = Math.random() * 10 - 5;
			position.y = 10 + Math.random() * 20;
			position.z = Math.random() * 10 - 5;

			rotation.x = Math.random() * 2 * Math.PI;
			rotation.y = Math.random() * 2 * Math.PI;
			rotation.z = Math.random() * 2 * Math.PI;

			quaternion.setFromEuler( rotation );

			scale.x = scale.y = scale.z = 1;

			matrix.compose( position, quaternion, scale );

		};

	}();

  updatePhysics(delta){
		this.physicsWorld.stepSimulation(delta, 10);
		
		for(let i = 0; i < this.meshes.length; i++){
			const mesh = this.meshes[ i ];

			if(mesh.isInstancedMesh){
				const array = mesh.instanceMatrix.array;
				const bodies = this.meshMap.get(mesh);

				for(let j = 0; j < bodies.length; j++){
					const body = bodies[j];
					const motionState = body.getMotionState();
					motionState.getWorldTransform(this.tempTransform);

					const position = this.tempTransform.getOrigin();
					const quaternion = this.tempTransform.getRotation();

					this.compose( position, quaternion, array, j * 16 );
				}

				mesh.instanceMatrix.needsUpdate = true;
			}
		}
   // console.log(this.rigidBodies);
		for(let i = 0; i < this.rigidBodies.length; i++){
			let threeObject = this.rigidBodies[i];
			let ammoObject = threeObject.userData.physicsBody;
			let ms = ammoObject.getMotionState();

			if(ms){
				
				ms.getWorldTransform(this.tempTransform);
				let pos = this.tempTransform.getOrigin();
				let quat = this.tempTransform.getRotation();
				threeObject.position.set(pos.x(), pos.y(), pos.z());
				threeObject.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
			}
		}
	}
  compose( position, quaternion, array, index ) {

		const x = quaternion.x(), y = quaternion.y(), z = quaternion.z(), w = quaternion.w();
		const x2 = x + x, y2 = y + y, z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;
	
		array[ index + 0 ] = ( 1 - ( yy + zz ) );
		array[ index + 1 ] = ( xy + wz );
		array[ index + 2 ] = ( xz - wy );
		array[ index + 3 ] = 0;
	
		array[ index + 4 ] = ( xy - wz );
		array[ index + 5 ] = ( 1 - ( xx + zz ) );
		array[ index + 6 ] = ( yz + wx );
		array[ index + 7 ] = 0;
	
		array[ index + 8 ] = ( xz + wy );
		array[ index + 9 ] = ( yz - wx );
		array[ index + 10 ] = ( 1 - ( xx + yy ) );
		array[ index + 11 ] = 0;
	
		array[ index + 12 ] = position.x();
		array[ index + 13 ] = position.y();
		array[ index + 14 ] = position.z();
		array[ index + 15 ] = 1;
	
	}

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
          //idle.play();
        });
        this.scene.add(fbx);
       // this.object.push(fbx);
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
            console.log(gltf)
            //this.objectGroup.add(gltf.scene)
            this.object.push(gltf.scene);
            this.scene.add(gltf.scene);

  
      });
      //this.object.push(this.objectGroup);
  }
  _LoadMoreModels() {

    const loader = new GLTFLoader();
    loader.load('./resources/bench/bench.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
          });
          gltf.scene.scale.set(10, 10, 10)
          console.log(gltf)
          //this.objectGroup.add(gltf.scene)
          this.object.push(gltf.scene);
          this.scene.add(gltf.scene);


    });
    //this.object.push(this.objectGroup);
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
        requestAnimationFrame(this.update.bind(this));
  }

  update(){
		this.delta = this.clock.getDelta()
		if(this.physicsWorld){
			this.updatePhysics(this.delta * 2)
		}

		this.renderer.render(this.scene, this.camera)
		requestAnimationFrame(this.update.bind(this))
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