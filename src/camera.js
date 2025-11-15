import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MODES, R, TOP_MIN, TOP_MAX, SAT_MIN, SAT_MAX } from "./config.js";

let topDownHeight = 3.2;
let satDistance = R * 3.2;

export function createControls(camera, renderer) {
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enabled = false;
	controls.enableDamping = true;
	controls.enablePan = false;
	controls.enableZoom = true;
	controls.minDistance = 0.5;
	controls.maxDistance = 5000;
	controls.target.set(0, 0, 0);
	return controls;
}

export function setMode(mode, controls, camera, character) {
	const { charPos, charForward } = character;
	controls.enabled = mode === MODES.ORBIT || mode === MODES.ORBIT_SPHERE;

	if (mode === MODES.ORBIT) {
		controls.enablePan = false;
		controls.minDistance = 0.8;
		controls.maxDistance = 8;
		controls.target.copy(charPos);
		const { n } = tangentBasisAt(charPos);
		const back = charForward
			.clone()
			.multiplyScalar(-2.5)
			.addScaledVector(n, 1.0);
		camera.position.copy(charPos).add(back);
		camera.lookAt(charPos);
	} else if (mode === MODES.ORBIT_SPHERE) {
		controls.enablePan = false;
		controls.minDistance = R * 1.1;
		controls.maxDistance = R * 5.0;
		controls.target.set(0, 0, 0);
		let d = camera.position.length();
		if (
			!Number.isFinite(d) ||
			d < controls.minDistance ||
			d > controls.maxDistance
		) {
			const dir = camera.position.clone().normalize();
			if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
			const desired = THREE.MathUtils.clamp(
				R * 2.0,
				controls.minDistance * 1.05,
				controls.maxDistance * 0.95
			);
			camera.position.copy(dir.multiplyScalar(desired));
			camera.lookAt(0, 0, 0);
		}
	} else {
		controls.enabled = false;
	}
	return mode;
}

export function updateCamera(
	mode,
	camera,
	character,
	controls,
	collisionManager
) {
	const { charPos, charForward } = character;
	const { n } = tangentBasisAt(charPos);
	const forward = charForward;

	if (mode === MODES.TPS) {
		const camPos = charPos
			.clone()
			.addScaledVector(forward, -1.6)
			.addScaledVector(n, 0.7);
		const collision = collisionManager.checkCameraCollision(camPos, charPos);
		if (collision) {
			camera.position.copy(collision.point);
		} else {
			camera.position.lerp(camPos, 0.25);
		}
		camera.up.copy(n);
		camera.lookAt(charPos.clone().addScaledVector(forward, 1.2));
	} else if (mode === MODES.FPS) {
		const eye = charPos.clone().addScaledVector(n, 0.18);
		const target = charPos.clone().addScaledVector(forward, 2.0);
		camera.position.lerp(eye, 0.4);
		camera.up.copy(n);
		camera.lookAt(target);
	} else if (mode === MODES.SAT) {
		const camPos = charPos.clone().normalize().multiplyScalar(satDistance);
		camera.position.lerp(camPos, 0.2);
		camera.up.set(0, 1, 0);
		camera.lookAt(charPos);
	} else if (mode === MODES.TOP) {
		const camPos = charPos.clone().addScaledVector(n, topDownHeight);
		camera.position.lerp(camPos, 0.25);
		camera.up.copy(forward);
		camera.lookAt(charPos);
	} else if (mode === MODES.ORBIT) {
		controls.target.copy(charPos);
		controls.update();
	} else if (mode === MODES.ORBIT_SPHERE) {
		controls.target.set(0, 0, 0);
		controls.update();
	}
}

export function tangentBasisAt(pos) {
	const n = pos.clone().normalize();
	let ref = new THREE.Vector3(0, 1, 0);
	if (Math.abs(n.dot(ref)) > 0.95) ref = new THREE.Vector3(1, 0, 0);
	const t1 = new THREE.Vector3().crossVectors(ref, n).normalize();
	const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
	return { n, t1, t2 };
}

export function handleCameraZoom(event, mode) {
	if (mode !== MODES.TOP && mode !== MODES.SAT) return;
	event.preventDefault();
	const factor = Math.exp(event.deltaY * 0.001);
	if (mode === MODES.TOP) {
		topDownHeight = THREE.MathUtils.clamp(
			topDownHeight * factor,
			TOP_MIN,
			TOP_MAX
		);
	} else if (mode === MODES.SAT) {
		satDistance = THREE.MathUtils.clamp(
			satDistance * factor,
			SAT_MIN,
			SAT_MAX
		);
	}
}

export function handleCameraKeyboard(event, mode) {
	if (mode === MODES.TOP) {
		if (event.key === "+" || event.key === "=")
			topDownHeight = Math.max(TOP_MIN, topDownHeight * 0.9);
		if (event.key === "-")
			topDownHeight = Math.min(TOP_MAX, topDownHeight * 1.1);
	}
	if (mode === MODES.SAT) {
		if (event.key === "+" || event.key === "=")
			satDistance = Math.max(SAT_MIN, satDistance * 0.9);
		if (event.key === "-") satDistance = Math.min(SAT_MAX, satDistance * 1.1);
	}
}
