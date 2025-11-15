import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class Structures {
	constructor(R, scene, planet, loadingManager) {
		this.structures = [];
		this.scene = scene;
		this.planet = planet;
		this.R = R;
		this.structuresPath = "assets/structures/";
		this.loader = new GLTFLoader(loadingManager);
		this.models = {};
		this.types = {
			habitat: {
				model: "Geodesic Dome.glb",
				scale: 0.3,
				rotation: [0, 0, Math.PI / 2],
			},
			command: {
				model: "Command pod.glb",
				scale: 0.3,
				rotation: [Math.PI / 2, 0, 0],
			},
			cupola: {
				model: "Cupola module.glb",
				scale: 0.3,
				rotation: [Math.PI / 2, , 0, 0],
			},
		};
	}

	get_structures = () => {
		return this.structures;
	};

	addStructures = (n, type) => {
		const typeInfo = this.types[type];
		if (!typeInfo) return;

		if (this.models[type]) {
			this.spawnStructures(n, type, this.models[type]);
		} else {
			this.loader.load(this.structuresPath + typeInfo.model, (gltf) => {
				let CurrentModel = gltf.scene.children[0];
				console.log("CurrentModel", CurrentModel);
				CurrentModel.scale.set(
					typeInfo.scale,
					typeInfo.scale,
					typeInfo.scale
				);

				const box = new THREE.Box3().setFromObject(CurrentModel);
				const height = box.max.y - box.min.y;
				console.log(box.max.y, "-", box.min.y);
				CurrentModel.height = height / 2;

				this.models[type] = CurrentModel;
				this.spawnStructures(n, type, CurrentModel);
			});
		}
	};

	spawnStructures = (n, type, model) => {
		const typeInfo = this.types[type];

		for (let i = 0; i < n; i++) {
			const structure = model.clone();
			const phi = Math.acos(2 * Math.random() - 1);
			const theta = Math.random() * Math.PI * 2;
			const initialHeight = this.R + model.height / 2;
			const x = initialHeight * Math.sin(phi) * Math.cos(theta);
			const y = initialHeight * Math.cos(phi);
			const z = initialHeight * Math.sin(phi) * Math.sin(theta);
			structure.position.set(x, y, z);
			structure.lookAt(this.planet.position);
			structure.rotateX(Math.PI / 2 + Math.PI);

			structure.receiveShadow = true;
			structure.castShadow = true;
			structure.traverse((child) => {
				if (child.isMesh) {
					child.receiveShadow = true;
					child.castShadow = true;
				}
			});

			structure.onGround = true;
			structure.type = type;
			this.scene.add(structure);
			this.structures.push(structure);
		}
	};
}
