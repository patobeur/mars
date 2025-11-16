import * as THREE from "three";
import { MODES } from "./config.js";

export function initDiag() {
	const menuDiv = document.getElementById("infos-menu");
	const diagLink = document.getElementById("infosLink");
	const diagDiv = document.getElementById("infos");
	const textes = ["Afficher les Infos", "Retirer les Infos"];

	diagDiv.classList.add("hidden");
	diagLink.textContent = textes[0];

	// Gérer les raccourcis clavier pour changer de mode
	menuDiv.addEventListener("click", (e) => {
		let isHidden = diagDiv.classList.contains("hidden");
		console.log();
		if (isHidden) {
			diagDiv.classList.remove("hidden");
			diagLink.textContent = textes[1];
		} else {
			diagDiv.classList.add("hidden");
			diagLink.textContent = textes[0];
		}
	});
}
export function initUI(setModeCallback) {
	const modeName = document.getElementById("modeName");

	// Gérer les raccourcis clavier pour changer de mode
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
			const labels = {
				TPS: "3e personne",
				FPS: "1re personne",
				SAT: "Satellite",
				TOP: "Top‑down",
				ORBIT: "Orbit perso",
				ORBIT_SPHERE: "Orbit sphère",
			};
			if (modeName) {
				modeName.textContent = labels[mode] || mode;
			}
		},
	};
}

export function setupTests(renderer, scene, camera, planet, controls) {
	const log = (ok, msg) => {
		const testsDiv = document.getElementById("tests");
		if (!testsDiv) return;
		const div = document.createElement("div");
		div.textContent = (ok ? "✔︎ " : "✖︎ ") + msg;
		div.className = ok ? "pass" : "fail";
		testsDiv.appendChild(div);
	};

	function runTests() {
		const testsDiv = document.getElementById("tests");
		if (testsDiv) {
			testsDiv.innerHTML = "";
		}
		try {
			log(!!THREE, "THREE chargé via import map");
			log(renderer instanceof THREE.WebGLRenderer, "Renderer initialisé");
			log(scene instanceof THREE.Scene, "Scene créée");
			log(camera instanceof THREE.PerspectiveCamera, "Camera créée");
			log(
				planet.geometry.parameters.radius === 50,
				"Planète rayon R correct"
			);
			// Add more tests if needed
		} catch (e) {
			log(false, "Tests interrompus: " + (e?.message || e));
		}
	}

	// Le bouton "runTests" n'existe plus, donc l'appel à runTests()
	// pourrait être déclenché d'une autre manière si nécessaire, par exemple depuis la console.
	// Pour l'instant, la fonction est conservée mais n'est plus liée à un événement de clic.
}

export function updateCollisionUI(collidingObject) {
    const collisionDiv = document.getElementById("collision-info");
    if (!collisionDiv) return;

    if (collidingObject) {
        collisionDiv.classList.remove("hidden");
        collisionDiv.textContent = `Collision avec : ${collidingObject.name}`;
    } else {
        collisionDiv.classList.add("hidden");
    }
}
