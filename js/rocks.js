import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CONFIG } from "./config.js";
import { scene } from "./world.js";
import { player } from "./player.js";

// --- Données sur les rochers ---
export const rocks = []; // Contient les données logiques de chaque rocher (pos, radius, etc.)
const rockInstancedMeshes = []; // Contient les InstancedMesh pour le rendu

// --- Vecteurs temporaires ---
const vTmp = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * Charge les géométries des différents types de rochers.
 * @returns {Promise<Array>} - Une promesse qui se résout avec un tableau de géométries de rochers.
 */
async function loadRockAssets() {
    const loader = new GLTFLoader();
    const assetPromises = CONFIG.rocks.variants.map(async (variant, index) => {
        try {
            const gltf = await loader.loadAsync(variant.glb);
            let geo = null;
            let mat = null;
            gltf.scene.traverse((o) => {
                if (o.isMesh && !geo) {
                    geo = o.geometry;
                    mat = o.material;
                }
            });
            if (!geo) throw new Error("No geometry found in GLB");
            return { geo, material: mat, variantIndex: index };
        } catch (e) {
            console.warn(`Rock GLB non chargé (${variant.glb}), fallback sur Icosahedron`, e);
            return {
                geo: new THREE.IcosahedronGeometry(1, 2),
                material: new THREE.MeshStandardMaterial({ color: 0x7b3d22, roughness: 1 }),
                variantIndex: index,
            };
        }
    });
    return Promise.all(assetPromises);
}

/**
 * Génère des points distribués uniformément sur une sphère.
 * @param {number} n - Le nombre de points à générer.
 * @returns {Array<THREE.Vector3>} - Un tableau de points.
 */
function fibonacciPoints(n) {
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = i * golden;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
}

/**
 * Crée et place les rochers sur la planète.
 */
async function spawnRocks() {
    const rockAssets = await loadRockAssets();
    const N = CONFIG.rocks.count;
    const points = fibonacciPoints(N);
    const R = CONFIG.planet.radius;

    // Créer un InstancedMesh pour chaque type de rocher
    for (const asset of rockAssets) {
        const countForVariant = Math.ceil(N / rockAssets.length);
        const imesh = new THREE.InstancedMesh(asset.geo, asset.material, countForVariant);
        imesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Permet la mise à jour
        scene.add(imesh);
        rockInstancedMeshes.push({ mesh: imesh, amount: 0, variantIndex: asset.variantIndex });
    }

    let variantCursor = 0;
    const safeSpawnDir = player.pos.clone().normalize();

    for (let i = 0; i < N; i++) {
        const p = points[i];

        // Éviter de placer des rochers trop près du point de départ du joueur
        if (p.dot(safeSpawnDir) > 0.99) continue;

        const variantIndex = variantCursor % CONFIG.rocks.variants.length;
        const variantConfig = CONFIG.rocks.variants[variantIndex];
        const instancedMeshInfo = rockInstancedMeshes.find(inst => inst.variantIndex === variantIndex);
        variantCursor++;

        const scale = THREE.MathUtils.lerp(variantConfig.scaleMin, variantConfig.scaleMax, Math.random());
        const height = variantConfig.height * scale;
        const position = p.clone().multiplyScalar(R + height);
        const radius = variantConfig.baseCollider * scale;

        // Stocker les données logiques du rocher
        rocks.push({
            pos: position,
            radius: radius,
            height: height,
            scale: scale,
        });

        // Appliquer la transformation à l'instance de l'InstancedMesh
        const matrix = new THREE.Matrix4();
        const orientation = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, p);
        matrix.compose(position, orientation, vTmp.set(scale, scale, scale));

        const instanceIdx = instancedMeshInfo.amount++;
        instancedMeshInfo.mesh.setMatrixAt(instanceIdx, matrix);
    }

    // Mettre à jour tous les InstancedMesh
    rockInstancedMeshes.forEach(inst => {
        inst.mesh.instanceMatrix.needsUpdate = true;
    });
}

/**
 * Initialise les rochers.
 */
export async function initRocks() {
    await spawnRocks();
}