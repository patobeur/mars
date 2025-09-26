import * as THREE from "three";
import { CONFIG } from "./config.js";

// --- Raccourcis de configuration ---
const R = CONFIG.planet.radius;
const G = CONFIG.gravity.G;
const DAMP_TANGENT = CONFIG.gravity.dampTangent;
const DAMP_NORMAL = CONFIG.gravity.dampNormal;
const MAX_SPEED = CONFIG.gravity.maxSpeed;

// --- Vecteurs temporaires pour éviter les allocations ---
const vTmp = new THREE.Vector3();
const vTmp2 = new THREE.Vector3();
const X_AXIS = new THREE.Vector3(1, 0, 0);

// --- Fonctions utilitaires de vecteurs (optimisées) ---
function projectOnPlane(vector, planeNormal) {
    const dotProduct = vector.dot(planeNormal);
    return vTmp.copy(vector).addScaledVector(planeNormal, -dotProduct);
}

// --- Physique principale ---

/**
 * Applique la gravité, l'amortissement et la contrainte de rayon.
 * @param {object} obj - L'objet sur lequel appliquer la physique (doit avoir pos, vel, height).
 * @param {number} dt - Delta time.
 */
export function applyCentripetal(obj, dt) {
    const desiredR = R + (obj.height || 0);
    const normal = obj.pos.clone().normalize();
    const toCenter = vTmp.copy(normal).multiplyScalar(-1);

    // 1. Gravité
    obj.vel.addScaledVector(toCenter, G * dt);

    // 2. Décomposition de la vitesse (normale vs tangente)
    const vNmag = obj.vel.dot(normal);
    const vN = vTmp.copy(normal).multiplyScalar(vNmag);
    const vT = vTmp2.copy(obj.vel).sub(vN);

    // 3. Amortissements
    vT.multiplyScalar(Math.max(0, 1 - DAMP_TANGENT * dt));
    vN.multiplyScalar(Math.max(0, 1 - DAMP_NORMAL * dt));

    // 4. Recomposition et limitation de la vitesse
    obj.vel.copy(vT.add(vN));
    if (obj.vel.length() > MAX_SPEED) {
        obj.vel.setLength(MAX_SPEED);
    }

    // 5. Intégration de la position
    obj.pos.addScaledVector(obj.vel, dt);

    // 6. Contrainte de rayon (coller à la surface)
    obj.pos.setLength(desiredR);

    // 7. Vitesse tangentielle stricte (après la contrainte)
    const newNormal = obj.pos.clone().normalize();
    const new_vNmag = obj.vel.dot(newNormal);
    obj.vel.addScaledVector(newNormal, -new_vNmag);
}

/**
 * Résout la collision entre le joueur et un rocher.
 * @param {object} player - L'objet joueur.
 * @param {object} rock - L'objet rocher.
 */
export function resolvePlayerRockCollision(player, rock) {
    const delta = vTmp.copy(player.pos).sub(rock.pos);
    const dist = delta.length();
    const minDist = player.radius + rock.radius;

    if (dist >= minDist) return;

    const playerNormal = player.pos.clone().normalize();
    const penetration = minDist - dist;

    // Direction pour repousser le joueur, projetée sur le plan tangent
    let pushDir = projectOnPlane(delta.clone(), playerNormal);
    if (pushDir.lengthSq() === 0) {
        // Si le joueur est pile sur le rocher, on choisit une direction arbitraire
        pushDir.crossVectors(playerNormal, X_AXIS).normalize();
    } else {
        pushDir.normalize();
    }

    // Repousser le joueur hors du rocher
    player.pos.addScaledVector(pushDir, penetration);
    player.pos.setLength(R + player.height); // Recalibrer la hauteur

    // Faire glisser le joueur le long du rocher (annuler la vitesse vers le rocher)
    const contactNormal = projectOnPlane(delta.normalize(), playerNormal);
    if (contactNormal.lengthSq() > 0) {
        const vn = player.vel.dot(contactNormal);
        if (vn < 0) { // Si le joueur va vers le rocher
            player.vel.addScaledVector(contactNormal, -vn);
        }
    }
}