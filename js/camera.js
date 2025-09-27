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
// Cible de la caméra lissée pour un suivi stable
const smoothedLookAtTarget = new THREE.Vector3();

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

    // Initialiser la cible lissée à la position actuelle du joueur
    smoothedLookAtTarget.copy(player.pos);

    // Appliquer le zoom directement
    currentZoom = targetZoom;

    const playerNormal = player.pos.clone().normalize();
    const targetPosition = player.pos.clone().addScaledVector(playerNormal, currentZoom);

    camera.position.copy(targetPosition);
    camera.up.copy(playerNormal);
    camera.lookAt(smoothedLookAtTarget);
}

/**
 * Met à jour la caméra à chaque frame avec une interpolation fluide.
 * @param {object} player - L'objet joueur.
 * @param {number} dt - Delta time.
 */
export function updateCamera(player, dt) {
    if (!player.mesh) return;

    const lerpFactor = 0.08; // Facteur d'interpolation pour un mouvement doux

    // 1. La cible de la caméra (le point regardé) suit le joueur avec un lerp
    smoothedLookAtTarget.lerp(player.pos, lerpFactor);

    // 2. Le zoom est également interpolé
    currentZoom = THREE.MathUtils.lerp(currentZoom, targetZoom, lerpFactor);

    // 3. La position idéale de la caméra est au-dessus de la cible lissée
    const targetNormal = smoothedLookAtTarget.clone().normalize();
    const targetPosition = smoothedLookAtTarget.clone().addScaledVector(targetNormal, currentZoom);

    // 4. La position de la caméra est interpolée vers sa position idéale
    camera.position.lerp(targetPosition, lerpFactor);

    // 5. Le "haut" de la caméra est aligné sur la normale de la planète à la position lissée
    camera.up.copy(targetNormal);

    // 6. La caméra regarde la cible lissée
    camera.lookAt(smoothedLookAtTarget);
}