import * as THREE from "three";
import { MODES } from "./config.js";

export function initUI(setModeCallback) {
	const modeName = document.getElementById("modeName");
	const buttons = [...document.querySelectorAll(".btn")];

	document.getElementById("ui").addEventListener("click", (e) => {
		if (e.target.matches("button[data-mode]")) {
			const newMode = e.target.dataset.mode;
			setModeCallback(newMode);
		}
	});

	window.addEventListener("keydown", (e) => {
		if (e.key === "1") setModeCallback(MODES.TPS);
		if (e.key === "2") setModeCallback(MODES.FPS);
		if (e.key === "3") setModeCallback(MODES.SAT);
		if (e.key === "4") setModeCallback(MODES.TOP);
		if (e.key === "5") setModeCallback(MODES.ORBIT);
		if (e.key === "6") setModeCallback(MODES.ORBIT_SPHERE);
	});

	return {
		updateUI(mode) {
			buttons.forEach((b) =>
				b.classList.toggle("active", b.dataset.mode === mode)
			);
			const labels = {
				TPS: "3e personne",
				FPS: "1re personne",
				SAT: "Satellite",
				TOP: "Top‑down",
				ORBIT: "Orbit perso",
				ORBIT_SPHERE: "Orbit sphère",
			};
			modeName.textContent = labels[mode] || mode;
		},
	};
}

export function setupTests(renderer, scene, camera, planet, controls) {
	const log = (ok, msg) => {
		const div = document.createElement("div");
		div.textContent = (ok ? "✔︎ " : "✖︎ ") + msg;
		div.className = ok ? "pass" : "fail";
		document.getElementById("tests").appendChild(div);
	};

	function runTests() {
		document.getElementById("tests").innerHTML = "";
		try {
			log(!!THREE, "THREE chargé via import map");
			log(renderer instanceof THREE.WebGLRenderer, "Renderer initialisé");
			log(scene instanceof THREE.Scene, "Scene créée");
			log(camera instanceof THREE.PerspectiveCamera, "Camera créée");
			log(planet.geometry.parameters.radius === 50, "Planète rayon R correct");
			// Add more tests if needed
		} catch (e) {
			log(false, "Tests interrompus: " + (e?.message || e));
		}
	}

	document.getElementById("runTests").addEventListener("click", runTests);
}