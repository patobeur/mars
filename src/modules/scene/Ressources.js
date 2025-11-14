import * as THREE from "three";

export class Ressources {
	constructor(R, scene, planet) {
		this.ressources = [];
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

	get_ressources = () => {
		return this.ressources;
	};

	addRessources = (n, type) => {
		let color = undefined;
		if (this.types[type] != undefined) {
			color = this.types[type].color;
		} else return;

		const ressourceMat = new THREE.MeshStandardMaterial({ color: color });
		const ressourceGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
		for (let i = 0; i < n; i++) {
			const phi = Math.acos(2 * Math.random() - 1);
			const theta = Math.random() * Math.PI * 2;
			const initialHeight = this.R + Math.random() * 5; // Spawn between R and R+5
			const x = initialHeight * Math.sin(phi) * Math.cos(theta);
			const y = initialHeight * Math.cos(phi);
			const z = initialHeight * Math.sin(phi) * Math.sin(theta);
			const ressource = new THREE.Mesh(ressourceGeo, ressourceMat);
			ressource.position.set(x, y, z);
			ressource.lookAt(this.planet.position);
			// Add physics properties
			ressource.velocity = new THREE.Vector3();
			ressource.onGround = false;
			ressource.type = type;
			this.scene.add(ressource);
			this.ressources.push(ressource);
		}
	};
}
