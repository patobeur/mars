import * as THREE from "three";
import { CONFIG } from "./config.js";

export const scene = new THREE.Scene();
export let planet;

function createWorld() {
    // --- Scène ---
    scene.background = new THREE.Color(0x050508);

    // --- Lumières ---
    scene.add(new THREE.AmbientLight(0xffffff, CONFIG.lighting.ambient));
    const dirLight = new THREE.DirectionalLight(
        0xffffff,
        CONFIG.lighting.sun
    );
    dirLight.position.set(...CONFIG.lighting.sunDir).multiplyScalar(500);
    scene.add(dirLight);

    // --- Planète (Mars réduite) ---
    const planetGeo = new THREE.SphereGeometry(CONFIG.planet.radius, 128, 64);
    const planetMat = new THREE.MeshStandardMaterial({
        color: CONFIG.planet.color,
        roughness: CONFIG.planet.roughness,
        metalness: CONFIG.planet.metalness,
    });
    planet = new THREE.Mesh(planetGeo, planetMat);
    planet.receiveShadow = false;
    planet.castShadow = false;
    scene.add(planet);

    // --- Ciel/Brouillard ---
    scene.fog = new THREE.Fog(0x090a0f, CONFIG.planet.radius * 0.6, CONFIG.planet.radius * 2.6);
}

export function initWorld() {
    createWorld();
}