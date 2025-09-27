import * as THREE from "three";
import { R, MODES } from "./config.js";
import { initScene } from "./scene.js";
import { createCharacter, updateCharacter, tangentBasisAt } from "./character.js";
import { createControls, setMode as setCameraMode, updateCamera, handleCameraZoom, handleCameraKeyboard } from "./camera.js";
import { initUI, setupTests } from "./ui.js";

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// --- Scene, Camera, Planet ---
const { scene, camera, planet } = initScene();

// --- Character ---
const character = createCharacter(scene);
const { charPos, charForward } = character;

// --- Controls ---
const controls = createControls(camera, renderer);

// --- UI & State ---
let currentMode = MODES.TPS;
const { updateUI } = initUI(setMode);
setMode(currentMode);

// --- Main State Management ---
function setMode(newMode) {
	currentMode = newMode;
	setCameraMode(currentMode, controls, camera, character);
	updateUI(currentMode);
}

// --- Event Listeners ---
const keys = new Set();
window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("wheel", (e) => handleCameraZoom(e, currentMode), { passive: false });
window.addEventListener("keydown", (e) => handleCameraKeyboard(e, currentMode));

// --- Tests ---
setupTests(renderer, scene, camera, planet, controls);


// --- Animation Loop ---
function tick() {
	updateCharacter(character, keys, tangentBasisAt);
	updateCamera(currentMode, camera, character, controls);
	renderer.render(scene, camera);
	requestAnimationFrame(tick);
}

tick();