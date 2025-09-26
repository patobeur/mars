import * as THREE from "three";
import { CONFIG } from "./config.js";
import { initControls } from "./controls.js";
import { initWorld, scene } from "./world.js";
import { camera, setupCameraAndResizeListener, updateCamera, snapCameraToPlayer } from "./camera.js";
import { initPlayer, player, applyPlayerInputs, updatePlayerMesh } from "./player.js";
import { initRocks, rocks } from "./rocks.js";
import { applyCentripetal, resolvePlayerRockCollision } from "./physics.js";

// --- DOM Elements ---
const fpsEl = document.getElementById("fps");
const tipsEl = document.getElementById("tips");

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });

function setupRenderer() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- Game Loop ---
const clock = new THREE.Clock();
let frameCount = 0;
let timeAccumulator = 0;
const fixedDt = 1 / 120; // Stable physics integration step

function animate() {
    requestAnimationFrame(animate);

    let dt = clock.getDelta();
    // Clamp delta time to avoid large steps
    dt = Math.min(dt, 1 / 30);

    // Physics simulation with fixed time steps
    timeAccumulator += dt;
    while (timeAccumulator >= fixedDt) {
        step(fixedDt);
        timeAccumulator -= fixedDt;
    }

    // Update camera and render
    updateCamera(player, dt);
    renderer.render(scene, camera);

    // Update FPS counter
    updateFPS(dt);
}

function step(dt) {
    // 1. Apply inputs
    applyPlayerInputs(dt);

    // 2. Apply physics
    applyCentripetal(player, dt);

    // 3. Resolve collisions
    for (const rock of rocks) {
        resolvePlayerRockCollision(player, rock);
    }

    // 4. Update meshes
    updatePlayerMesh(dt);
}

function updateFPS(dt) {
    frameCount++;
    timeAccumulator += dt; // Re-use timeAccumulator for FPS calculation
    if (timeAccumulator > 0.5) {
        const fps = frameCount / timeAccumulator;
        fpsEl.textContent = `${Math.round(fps)} FPS • ${rocks.length} rochers`;
        frameCount = 0;
        timeAccumulator = 0;
    }
}


// --- Initialization ---
async function init() {
    // Update UI
    tipsEl.innerHTML = `ZQSD/Flèches pour bouger • Molette pour zoomer • Espace pour sauter`;

    // Setup basic components
    setupRenderer();
    initControls();
    initWorld();
    setupCameraAndResizeListener();

    // Load assets and setup game objects
    await initPlayer();
    await initRocks();

    // Set initial camera position
    snapCameraToPlayer(player);

    // Start the game loop
    animate();
}

init().catch(console.error);