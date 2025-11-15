import * as THREE from "three";
import { R } from "./config.js";
import { Ressources } from "./modules/scene/Ressources.js";
import { Structures } from "./modules/model/Structures.js";

export function initScene(loadingManager) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x070910);

	const camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
		0.05,
		20000
	);
	camera.position.set(0, 6, 10);

	scene.add(new THREE.AmbientLight(0xffffff, 0.45));
	const dir = new THREE.DirectionalLight(0xffffff, 0.9);
	dir.castShadow = true;
	dir.position.set(8, 10, 6);
	dir.shadow.camera.top = 10;
	dir.shadow.camera.bottom = -10;
	dir.shadow.camera.left = -10;
	dir.shadow.camera.right = 10;
	dir.shadow.camera.near = 0.1;
	dir.shadow.camera.far = 100;
	dir.shadow.mapSize.width = 2048;
	dir.shadow.mapSize.height = 2048;
	dir.shadow.bias = -0.0001;
	scene.add(dir);

	// --- Textures ---
	const loader = new THREE.TextureLoader(loadingManager);
	const color = loader.load("assets/textures/mars/mars_8k_color.jpg");
	const bump = loader.load("assets/textures/mars/mars_8k_bump.jpg");
	const normal = loader.load("assets/textures/mars/mars_1k_normal.jpg");

	// --- Planète ---
	const marsMaterial = new THREE.MeshStandardMaterial({
		map: color,
		bumpMap: bump,
		bumpScale: 0.1,
		normalMap: normal,
		normalScale: new THREE.Vector2(1, 1),
		roughness: 1,
	});
	const marsGeometry = new THREE.SphereGeometry(R, 64, 64);
	const planet = new THREE.Mesh(marsGeometry, marsMaterial);
	planet.receiveShadow = true;
	planet.castShadow = true;

	scene.add(planet);

	const atmosphere = new THREE.Mesh(
		new THREE.SphereGeometry(R * 1.03, 64, 48),
		new THREE.MeshBasicMaterial({
			color: 0x992205,
			transparent: true,
			opacity: 0.07,
		})
	);
	scene.add(atmosphere);

	const ressourcesManager = new Ressources(R, scene, planet, loadingManager);

	// Poteaux blancs
	const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
	const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 20, 16);
	const northPole = new THREE.Mesh(poleGeo, poleMat);
	northPole.position.set(0, R + 1, 0);
	scene.add(northPole);
	const southPole = new THREE.Mesh(poleGeo, poleMat);
	southPole.position.set(0, -R - 1, 0);
	scene.add(southPole);

	// Étoiles
	const stars = new THREE.Points(
		new THREE.BufferGeometry(),
		new THREE.PointsMaterial({ size: 0.03, color: 0xffffff })
	);
	const starPos = new Float32Array(2000 * 3);
	for (let i = 0; i < 2000; i++) {
		const r = 120 + Math.random() * 80;
		const phi = Math.acos(2 * Math.random() - 1);
		const theta = Math.random() * Math.PI * 2;
		starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
		starPos[i * 3 + 1] = r * Math.cos(phi);
		starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
	}
	stars.geometry.setAttribute(
		"position",
		new THREE.BufferAttribute(starPos, 3)
	);
	scene.add(stars);

	ressourcesManager.addRessources(200, "astate");
	ressourcesManager.addRessources(200, "or");
	ressourcesManager.addRessources(200, "carbone");

	const structuresManager = new Structures(R, scene, planet, loadingManager);
	structuresManager.addStructures(60, "habitat");
	structuresManager.addStructures(60, "command");
	structuresManager.addStructures(60, "cupola");

	const ressources = ressourcesManager.get_ressources();
	const structures = structuresManager.get_structures();
	console.log(ressources);
	console.log(structures);

	return { scene, camera, planet, ressources, structures, dir };
}

export function updateRessources(ressources, planet, dt) {
	const gravity = -3.72076; // Mars gravity
	ressources.forEach((ressource) => {
		if (ressource.onGround) return;

		const normal = ressource.position.clone().normalize();
		ressource.velocity.addScaledVector(normal, gravity * dt);
		ressource.position.addScaledVector(ressource.velocity, dt);

		const distanceToCenter = ressource.position.length();
		if (distanceToCenter <= R) {
			ressource.position.normalize().multiplyScalar(R);
			ressource.velocity.set(0, 0, 0);
			ressource.onGround = true;
		}
	});
}
