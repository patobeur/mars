import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class Ressources {
	constructor(R, scene, planet, loadingManager) {
		this.ressources = [];
		this.scene = scene;
		this.planet = planet;
		this.R = R;
		this.ressourcesPath = "assets/ressources/";
		this.loader = new GLTFLoader(loadingManager);
		this.models = {};
		this.types = {
			astate: {
				model: "Rock.glb",
				color: 0xeaeaea,
				scale: 0.5,
				rotation: [0, 0, Math.PI],
				y_offset: 0,
			},
			or: {
				model: "Rock Medium.glb",
				color: 0xffff00,
				scale: 0.2,
				rotation: [0, 0, Math.PI],
				y_offset: 0,
			},
			carbone: {
				model: "Rock Medium.glb",
				color: 0x000000,
				scale: 0.2,
				rotation: [0, 0, Math.PI],
				y_offset: 0,
			},
		};
	}

	get_ressources = () => {
		return this.ressources;
	};

	addRessources = (n, type) => {
		const typeInfo = this.types[type];
		if (!typeInfo) return;

		if (this.models[type]) {
			this.spawnRessources(n, type, this.models[type]);
		} else {
			this.loader.load(this.ressourcesPath + typeInfo.model, (gltf) => {
				let CurrentModel = gltf.scene.children[0];
				console.log("Current Ressource", CurrentModel);
				CurrentModel.scale.set(
					typeInfo.scale,
					typeInfo.scale,
					typeInfo.scale
				);
				//console.log("gltf.scene", gltf.scene);
				this.models[type] = CurrentModel;
				this.spawnRessources(n, type, CurrentModel);
			});
		}
	};

	spawnRessources = (n, type, model) => {
		const typeInfo = this.types[type];

		for (let i = 0; i < n; i++) {
			const ressource = model.clone();
			const phi = Math.acos(2 * Math.random() - 1);
			const theta = Math.random() * Math.PI * 2;
			const initialHeight = this.R + Math.random() * 5; // Spawn between R and R+5
			const x = initialHeight * Math.sin(phi) * Math.cos(theta);
			const y = initialHeight * Math.cos(phi);
			const z = initialHeight * Math.sin(phi) * Math.sin(theta);
			ressource.position.set(x, y, z);
			ressource.lookAt(this.planet.position);
			ressource.rotation.set(
				typeInfo.rotation[0],
				typeInfo.rotation[1],
				typeInfo.rotation[2]
			);
			ressource.receiveShadow = true;
			ressource.castShadow = true;
			ressource.traverse((child) => {
				if (child.isMesh) {
					child.material = new THREE.MeshStandardMaterial({
						color: typeInfo.color,
					});
					child.receiveShadow = true;
					child.castShadow = true;
				}
			});
			// Add physics properties
			ressource.velocity = new THREE.Vector3();
			ressource.onGround = false;
			ressource.type = type;

            // Assign collision radius based on type
            if (type === 'astate') {
                ressource.userData.collisionRadius = 1.5;
            } else {
                ressource.userData.collisionRadius = 0.8;
            }

			this.scene.add(ressource);
			this.ressources.push(ressource);
		}
	};
}
