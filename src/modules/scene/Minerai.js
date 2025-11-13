import * as THREE from "three";

export class Minerai {
	constructor(R, scene, planet) {
		this.cubes = [];
		this.scene = scene;
		this.planet = planet;
		this.R = R;
	}

	get_cubes = () => {
		return this.cubes;
	};

	addMinerai = (n, type) => {
		const cubeMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
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
			this.scene.add(cube);
			this.cubes.push(cube);
		}
	};
}
