import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CONFIG } from "./config.js";
import { keys } from "./controls.js";
import { scene, planet } from "./world.js";

// --- Objet joueur ---
export const player = {
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    height: CONFIG.player.height,
    radius: CONFIG.player.colliderRadius,
    isGrounded: false,
    mesh: null,
    mixer: null,
    actions: {},
    currentAction: null,
};

// --- Vecteurs temporaires ---
const vTmp = new THREE.Vector3();
const vTmp2 = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

// --- Fonctions utilitaires ---
function projectOnPlane(vector, planeNormal, resultVec) {
    const dotProduct = vector.dot(planeNormal);
    return resultVec.copy(vector).addScaledVector(planeNormal, -dotProduct);
}

// --- Animation ---
function switchToAction(name, duration = 0.2) {
    const newAction = player.actions[name];
    if (!newAction) {
        // console.warn(`Animation "${name}" not found.`);
        return;
    }
    if (newAction === player.currentAction) return;

    if (player.currentAction) {
        player.currentAction.fadeOut(duration);
    }

    newAction.reset().fadeIn(duration).play();
    player.currentAction = newAction;
}

// --- Chargement et Initialisation ---
async function loadPlayerModel() {
    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync(CONFIG.player.glb);
        const model = gltf.scene;
        model.scale.setScalar(CONFIG.player.scale);
        model.frustumCulled = false;

        player.mesh = model;
        scene.add(model);

        player.mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            player.actions[clip.name] = player.mixer.clipAction(clip);
        });

        // Lancer l'animation par défaut ('Idle') ou la première disponible
        if (player.actions['Idle']) {
            player.currentAction = player.actions['Idle'];
            player.currentAction.play();
        } else {
            const firstAction = player.actions[Object.keys(player.actions)[0]];
            if (firstAction) {
                player.currentAction = firstAction;
                player.currentAction.play();
            }
        }

    } catch (e) {
        console.error("Erreur lors du chargement du joueur:", e);
        const fallbackGeo = new THREE.CapsuleGeometry(0.6, 1.0, 4, 8);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
        player.mesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        scene.add(player.mesh);
    }
}

function setSpawnPoint() {
    const { lat, lon } = CONFIG.player.spawnLatLongDeg;
    const latRad = THREE.MathUtils.degToRad(lat);
    const lonRad = THREE.MathUtils.degToRad(lon);

    const x = Math.cos(latRad) * Math.cos(lonRad);
    const y = Math.sin(latRad);
    const z = Math.cos(latRad) * Math.sin(lonRad);

    player.pos.set(x, y, z).setLength(CONFIG.planet.radius + player.height);
}

export async function initPlayer() {
    await loadPlayerModel();
    setSpawnPoint();
}

// --- Logique de mise à jour ---
export function applyPlayerInputs(dt) {
    const normal = player.pos.clone().normalize();

    // --- Détection du sol ---
    const raycaster = new THREE.Raycaster(player.pos, normal.clone().multiplyScalar(-1));
    const intersects = raycaster.intersectObject(planet);
    const distToGround = intersects.length > 0 ? intersects[0].distance : Infinity;
    player.isGrounded = distToGround < player.height + 0.1;

    // --- Saut ---
    if (keys["Space"] && player.isGrounded) {
        player.vel.addScaledVector(normal, CONFIG.player.jumpStrength);
    }

    // --- Mouvement ---
    const east = projectOnPlane(X_AXIS, normal, vTmp).normalize();
    const north = vTmp2.copy(east).cross(normal);

    const moveDirection = new THREE.Vector3();
    if (keys["KeyW"]) moveDirection.add(north);
    if (keys["KeyS"]) moveDirection.sub(north);
    if (keys["KeyA"]) moveDirection.sub(east);
    if (keys["KeyD"]) moveDirection.add(east);

    if (moveDirection.lengthSq() > 0) {
        moveDirection.normalize();
        player.vel.addScaledVector(moveDirection, CONFIG.player.speed * dt);
    }
}

export function updatePlayerMesh(dt) {
    if (!player.mesh) return;

    player.mesh.position.copy(player.pos);

    const normal = player.pos.clone().normalize();
    const tangentVel = projectOnPlane(player.vel, normal, vTmp);

    // --- Orientation ---
    if (tangentVel.lengthSq() > 0.01) {
        const forward = tangentVel.clone().normalize();
        const targetQuaternion = new THREE.Quaternion().lookAt(forward, normal);
        player.mesh.quaternion.slerp(targetQuaternion, 0.2);
    } else {
        const defaultQuaternion = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, normal);
        player.mesh.quaternion.slerp(defaultQuaternion, 0.1);
    }

    // --- Animations ---
    if (player.mixer) {
        if (!player.isGrounded) {
            switchToAction('Jump');
        } else if (tangentVel.lengthSq() > 0.1) {
            switchToAction('Run');
        } else {
            switchToAction('Idle');
        }
        player.mixer.update(dt);
    }
}