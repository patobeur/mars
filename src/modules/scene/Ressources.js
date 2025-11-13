import * as THREE from "three";

export class Ressources {
	constructor(R, scene, planet) {
		this.cubes = [];
		this.scene = scene;
		this.planet = planet;
		this.R = R;
		this.ressourcesPath = "assets/ressources/";
		this.types = {
			astate: { model: "Rock.glb", color: 0xeaeaea },
			or: { model: "Rock Medium.glb", color: 0xffff00 },
			carbone: { model: "Rock Medium.glb", color: 0x000000 },
		};
	}

	get_cubes = () => {
		return this.cubes;
	};

	addRessources = (n, type) => {
		let color = undefined;
		if (this.types[type] != undefined) {
			color = this.types[type].color;
		} else return;

		const cubeMat = new THREE.MeshStandardMaterial({ color: color });
		const cubeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
		for (let i = 0; i < n; i++) {
			const phi = Math.acos(2 * Math.random() - 1);
			const theta = Math.random() * Math.PI * 2;
			const initialHeight = this.R + Math.random() * 5; // Spawn between R and R+5
			const x = initialHeight * Math.sin(phi) * Math.cos(theta);
			const y = initialHeight * Math.cos(phi);
			const z = initialHeight * Math.sin(phi) * Math.sin(theta);
			const cube = new THREE.Mesh(cubeGeo, cubeMat);
			cube.position.set(x, y, z);
			cube.lookAt(this.planet.position);
			// Add physics properties
			cube.velocity = new THREE.Vector3();
			cube.onGround = false;
			cube.type = type;
			this.scene.add(cube);
			this.cubes.push(cube);
		}
	};
}
