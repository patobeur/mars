import * as THREE from "three";
import { CONFIG } from "./config.js";
import { targetZoom } from "./controls.js";

export const camera = new THREE.PerspectiveCamera(
	CONFIG.camera.fov,
	window.innerWidth / window.innerHeight,
	CONFIG.camera.near,
	CONFIG.camera.far
);

let currentZoom = CONFIG.camera.startZoom;

// --- Constantes pour la stabilisation ---
// Un vecteur "vers le haut" de référence dans le monde pour stabiliser la caméra.
const WORLD_UP = new THREE.Vector3(0, 1, 0);
// Vecteurs temporaires pour éviter les allocations répétées.
const v_right = new THREE.Vector3();
const v_up = new THREE.Vector3();

export function setupCameraAndResizeListener() {
	window.addEventListener("resize", () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	});
}

/**
 * Calcule un vecteur "up" stable pour la caméra afin d'éviter le gimbal lock
 * et la rotation non désirée.
 * @param {THREE.Vector3} surfaceNormal - La normale à la surface sous la caméra.
 * @param {THREE.Vector3} result - Le vecteur où stocker le résultat.
 */
function getStableUpVector(surfaceNormal, result) {
	// Si la normale de surface est trop proche de l'axe Y du monde,
	// on utilise un autre axe (X) pour éviter l'instabilité (gimbal lock).
	const referenceUp =
		Math.abs(surfaceNormal.dot(WORLD_UP)) > 0.99
			? new THREE.Vector3(1, 0, 0)
			: WORLD_UP;

	// 1. Calculer le vecteur "droite" stable.
	v_right.crossVectors(referenceUp, surfaceNormal).normalize();
	// 2. Calculer le vecteur "haut" stable à partir de la droite et de la normale.
	result.crossVectors(surfaceNormal, v_right).normalize();
}

/**
 * Place la caméra instantanément sur le joueur, sans interpolation.
 * Utile pour l'initialisation.
 * @param {object} player - L'objet joueur.
 */
export function snapCameraToPlayer(player) {
	if (!player.mesh) return;

	currentZoom = targetZoom;
	updateCamera(player, 0); // Utilise la logique de mise à jour pour un placement initial correct.
}

/**
 * Met à jour la caméra à chaque frame.
 * La position suit le joueur de manière rigide, le zoom est lissé,
 * et l'orientation est stabilisée pour empêcher toute rotation.
 * @param {object} player - L'objet joueur.
 * @param {number} dt - Delta time (non utilisé).
 */
export function updateCamera(player, dt) {
	if (!player.mesh) return;

	const lerpFactor = 0.08; // Facteur d'interpolation pour le zoom.

	// 1. Interpoler le zoom pour un effet fluide.
	currentZoom = THREE.MathUtils.lerp(currentZoom, targetZoom, lerpFactor);

	// 2. La position de la caméra est directement au-dessus du joueur.
	const playerNormal = player.pos.clone().normalize();
	const targetPosition = player.pos
		.clone()
		.addScaledVector(playerNormal, currentZoom);
	camera.position.copy(targetPosition);

	// 3. Calculer l'orientation stable de la caméra.
	getStableUpVector(playerNormal, v_up);
	camera.up.copy(v_up);

	// 4. La caméra regarde la position du joueur.
	camera.lookAt(player.pos);
}
