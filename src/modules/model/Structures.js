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
				scale: 0.5,
				rotation: [0, 0, Math.PI / 2],
				y_offset: -0.1,
				trigger_entry: false,
			},
			command: {
				model: "Command pod.glb",
				scale: 0.5,
				rotation: [0, 0, Math.PI / 2],
				y_offset: -0.1,
				trigger_entry: true,
			},
			cupola: {
				model: "Cupola module.glb",
				scale: 0.5,
				rotation: [0, 0, Math.PI / 2],
				y_offset: -0.1,
				trigger_entry: true,
			},
		};
	}

	add_contact_trigger = (model) => {
		// Géométrie de la porte : 1 (X) x 2 (Y) x 0.25 (Z)
		const doorGeometry = new THREE.BoxGeometry(1, 2, 0.25);

		// Matériau (bois marron par exemple)
		const doorMaterial = new THREE.MeshStandardMaterial({
			color: 0x00ffcc, // couleur de base (genre néon turquoise)
			emissive: 0x00ffcc, // couleur "fluo"
			emissiveIntensity: 0.7, // augmente si tu veux plus de glow
			metalness: 0.1,
			roughness: 0.2,
			transparent: true,
			opacity: 0.3, // 0 = invisible, 1 = opaque
		});

		// Mesh de la porte
		const door = new THREE.Mesh(doorGeometry, doorMaterial);

		// Optionnel : ombres
		door.castShadow = true;
		door.receiveShadow = true;

		// Positionner la porte :
		// si ton sol est à y = 0, on met la porte centrée à y = 1
		door.position.set(0, 0.5, model.x_min); // x, y, z
		model.add(door);
	};

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
				const model = gltf.scene;
				model.scale.set(typeInfo.scale, typeInfo.scale, typeInfo.scale);

                // Pre-calculate bounding box for positioning
				const box = new THREE.Box3().setFromObject(model);
				model.y_min = box.min.y;

				if (typeInfo.trigger_entry) {
					this.add_contact_trigger(model);
				}

				this.models[type] = model;
				this.spawnStructures(n, type, model);
			});
		}
	};

	spawnStructures = (n, type, model) => {
		const typeInfo = this.types[type];

		for (let i = 0; i < n; i++) {
			const structure = model.clone();
			const phi = Math.acos(2 * Math.random() - 1);
			const theta = Math.random() * Math.PI * 2;
			const initialHeight = this.R - model.y_min + (typeInfo.y_offset || 0);
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
