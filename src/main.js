import * as THREE from "three";
import { R, MODES } from "./config.js";
import { initScene, updateCubes } from "./scene.js";
import {
	createRobot,
	updateRobot,
	tangentBasisAt,
} from "./modules/robot/robot.js";
import {
	createControls,
	setMode as setCameraMode,
	updateCamera,
	handleCameraZoom,
	handleCameraKeyboard,
} from "./camera.js";
import { initUI, initDiag, setupTests } from "./ui.js";
import Console from "./modules/console/console.js";
import { initNavbar } from "./modules/navbar/navbar.js";
import { ProximityManager } from "./modules/utils/ProximityManager.js";

async function main() {
	// --- Renderer ---
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	document.body.appendChild(renderer.domElement);

	// --- Console ---
	const consoleContainer = document.getElementById("console");
	Console.init(consoleContainer);
	Console.addMessage("Welcome!");

	// --- Scene, Camera, Planet ---
	const { scene, camera, planet, cubes } = initScene();
	Console.addMessage("Scene initialized");
	Console.addMessage("Loading robot model...");

	// --- Character (loaded asynchronously) ---
	const character = await createRobot(scene);
	Console.addMessage("Robot loaded successfully!");

	// --- Proximity Manager ---
	const proximityManager = new ProximityManager(character, cubes);

	// --- Controls ---
	const controls = createControls(camera, renderer);

	// --- UI & State ---
	let currentMode = MODES.TPS;
	const { updateUI } = initUI(setMode);
	initDiag();
	const { updateNavbar } = initNavbar(setMode);

	// --- Main State Management ---
	function setMode(newMode) {
		currentMode = newMode;
		setCameraMode(currentMode, controls, camera, character);
		updateUI(currentMode);
		updateNavbar(currentMode);
		Console.addMessage(`Camera mode: ${newMode}`);
	}

	setMode(currentMode); // Set initial mode

	// --- Event Listeners ---
	const keys = new Set();
	window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
	window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

	window.addEventListener("resize", () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	window.addEventListener("wheel", (e) => handleCameraZoom(e, currentMode), {
		passive: false,
	});
	window.addEventListener("keydown", (e) =>
		handleCameraKeyboard(e, currentMode)
	);

	// --- Tests ---
	setupTests(renderer, scene, camera, planet, controls);

	// --- Animation Loop ---
	const clock = new THREE.Clock();
	function tick() {
		const dt = clock.getDelta();
		updateRobot(character, keys, tangentBasisAt, dt);
		updateCubes(cubes, planet, dt);
		updateCamera(currentMode, camera, character, controls);

		if (proximityManager && character && character.charPos) {
			proximityManager.update();
		}
		renderer.render(scene, camera);
		requestAnimationFrame(tick);
	}

	tick(); // Start the animation loop
}

main().catch((error) => {
	console.error("Failed to initialize the application:", error);
	Console.addMessage(
		"Error: Failed to initialize the application. Check console for details.",
		"error"
	);
});
