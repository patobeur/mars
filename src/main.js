import * as THREE from "three";
import { R, MODES } from "./config.js";
import { initScene, updateRessources } from "./scene.js";
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
import { createLoadingManager } from "./loadingManager.js";

async function main() {
	const loadingManager = createLoadingManager(() => {});
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	const consoleContainer = document.getElementById("console");
	const keys = new Set();

	let character,
		ressources,
		structures,
		planet,
		scene,
		camera,
		proximityManager,
		controls,
		currentMode,
		updateUI,
		updateNavbar,
		dirLight;

	async function setup() {
		// --- Renderer ---
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.shadowMap.enabled = true;
		document.body.appendChild(renderer.domElement);

		// --- Console ---
		Console.init(consoleContainer);
		Console.addMessage("Welcome!");

		// --- Scene, Camera, Planet ---
		const sceneData = initScene(loadingManager);
		scene = sceneData.scene;
		camera = sceneData.camera;
		planet = sceneData.planet;
		ressources = sceneData.ressources;
		structures = sceneData.structures;
		dirLight = sceneData.dir;
		Console.addMessage("Scene initialized");
		Console.addMessage("Loading robot model...");

		// --- Character (loaded asynchronously) ---
		character = await createRobot(scene, loadingManager);
		Console.addMessage("Robot loaded successfully!");

		// --- Proximity Manager ---
		proximityManager = new ProximityManager(character, ressources);

		// --- Controls ---
		controls = createControls(camera, renderer);

		// --- UI & State ---
		currentMode = MODES.TPS;
		const uiData = initUI(setMode);
		updateUI = uiData.updateUI;
		initDiag();
		const navbarData = initNavbar(setMode);
		updateNavbar = navbarData.updateNavbar;

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
		window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
		window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

		window.addEventListener("resize", () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});

		window.addEventListener(
			"wheel",
			(e) => handleCameraZoom(e, currentMode),
			{
				passive: false,
			}
		);
		window.addEventListener("keydown", (e) =>
			handleCameraKeyboard(e, currentMode)
		);

		// --- Tests ---
		setupTests(renderer, scene, camera, planet, controls);

		// --- Start Animation Loop ---
		Console.addMessage("All assets loaded, starting the game!");
		tick();
	}

	// --- Animation Loop ---
	const clock = new THREE.Clock();
	function tick() {
		const dt = Math.min(clock.getDelta(), 0.1);
		updateRobot(character, keys, tangentBasisAt, dt);
		updateRessources(ressources, planet, dt);
		updateCamera(currentMode, camera, character, controls);

		if (dirLight && character && character.charPos) {
			dirLight.position
				.copy(character.charPos)
				.add(new THREE.Vector3(8, 10, 6));
			dirLight.target.position.copy(character.charPos);
		}

		if (proximityManager && character && character.charPos) {
			proximityManager.update();
		}
		renderer.render(scene, camera);
		requestAnimationFrame(tick);
	}

	setup(); // Start the setup
}

main().catch((error) => {
	console.error("Failed to initialize the application:", error);
	Console.addMessage(
		"Error: Failed to initialize the application. Check console for details.",
		"error"
	);
});
