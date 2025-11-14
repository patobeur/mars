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
			astate: { model: "Rock.glb", color: 0xeaeaea },
			or: { model: "Rock Medium.glb", color: 0xffff00 },
			carbone: { model: "Rock Medium.glb", color: 0x000000 },
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
			this.loader.load(
				this.ressourcesPath + typeInfo.model,
				(gltf) => {
					this.models[type] = gltf.scene;
					this.spawnRessources(n, type, gltf.scene);
				}
			);
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
			ressource.traverse((child) => {
				if (child.isMesh) {
					child.material = new THREE.MeshStandardMaterial({
						color: typeInfo.color,
					});
				}
			});
			// Add physics properties
			ressource.velocity = new THREE.Vector3();
			ressource.onGround = false;
			ressource.type = type;
			this.scene.add(ressource);
			this.ressources.push(ressource);
		}
	};
}
