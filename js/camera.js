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

export function setupCameraAndResizeListener() {
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
}

/**
 * Place la caméra instantanément sur le joueur, sans interpolation.
 * Utile pour l'initialisation.
 * @param {object} player - L'objet joueur.
 */
export function snapCameraToPlayer(player) {
    if (!player.mesh) return;

    // Appliquer le zoom directement
    currentZoom = targetZoom;

    const playerNormal = player.pos.clone().normalize();
    const targetPosition = player.pos.clone().addScaledVector(playerNormal, currentZoom);

    camera.position.copy(targetPosition);
    camera.up.copy(playerNormal);
    camera.lookAt(player.pos);
}

/**
 * Met à jour la caméra à chaque frame.
 * Le zoom est lissé, mais la position suit le joueur de manière rigide pour éviter la rotation.
 * @param {object} player - L'objet joueur.
 * @param {number} dt - Delta time (non utilisé actuellement, mais conservé pour la cohérence de l'API).
 */
export function updateCamera(player, dt) {
    if (!player.mesh) return;

    const lerpFactor = 0.08; // Facteur d'interpolation pour le zoom

    // Le zoom est interpolé pour un effet fluide
    currentZoom = THREE.MathUtils.lerp(currentZoom, targetZoom, lerpFactor);

    // La position de la caméra est calculée directement à partir de la position du joueur
    const playerNormal = player.pos.clone().normalize();
    const targetPosition = player.pos.clone().addScaledVector(playerNormal, currentZoom);

    camera.position.copy(targetPosition);
    camera.up.copy(playerNormal);
    camera.lookAt(player.pos);
}