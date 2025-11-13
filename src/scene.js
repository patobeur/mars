import * as THREE from "three";
import { R } from "./config.js";
import { Ressources } from "./modules/scene/Ressources.js";

export function initScene() {
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
	dir.position.set(8, 10, 6);
	scene.add(dir);

	// --- Textures ---
	const loader = new THREE.TextureLoader();
	const color = loader.load("textures/mars/mars_8k_color.jpg");
	const bump = loader.load("textures/mars/mars_8k_bump.jpg");
	const normal = loader.load("textures/mars/mars_1k_normal.jpg");

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

	const ressources = new Ressources(R, scene, planet);

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

	ressources.addRessources(200, "astate");
	ressources.addRessources(200, "or");
	ressources.addRessources(200, "carbone");

	const cubes = ressources.get_cubes();
	console.log(cubes);
	return { scene, camera, planet, cubes };
}

export function updateCubes(cubes, planet, dt) {
	const gravity = -3.72076; // Mars gravity
	cubes.forEach((cube) => {
		if (cube.onGround) return;

		const normal = cube.position.clone().normalize();
		cube.velocity.addScaledVector(normal, gravity * dt);
		cube.position.addScaledVector(cube.velocity, dt);

		const distanceToCenter = cube.position.length();
		if (distanceToCenter <= R) {
			cube.position.normalize().multiplyScalar(R);
			cube.velocity.set(0, 0, 0);
			cube.onGround = true;
		}
	});
}
