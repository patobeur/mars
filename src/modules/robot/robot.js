import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { R } from "../../config.js";
import { MARS_GRAVITY } from "../gravity/mars.js";

export function createRobot(scene) {
	return new Promise((resolve, reject) => {
		const charGroup = new THREE.Group();
		scene.add(charGroup);

		const loader = new GLTFLoader();
		loader.load(
			"assets/characters/RobotExpressive.glb",
			(gltf) => {
				const model = gltf.scene;
				charGroup.add(model);

				let charPos = new THREE.Vector3(R + 2.0, 0, 0);
				let charVelocity = new THREE.Vector3();
				let charState = { onGround: false };
				let charForward = new THREE.Vector3();
				const speed = 0.018,
					rotSpeed = 0.035;

				function initForwardAt(pos) {
					const n = pos.clone().normalize();
					charForward
						.set(0, 0, 1)
						.addScaledVector(n, -n.dot(new THREE.Vector3(0, 0, 1)));
					if (charForward.lengthSq() < 1e-8)
						charForward
							.set(1, 0, 0)
							.addScaledVector(n, -n.dot(new THREE.Vector3(1, 0, 0)));
					charForward.normalize();
				}
				initForwardAt(charPos);

				resolve({
					charGroup,
					charPos,
					charForward,
					speed,
					rotSpeed,
					charVelocity,
					charState,
				});
			},
			undefined,
			(error) => {
				console.error(
					"An error happened while loading the robot model:",
					error
				);
				reject(error);
			}
		);
	});
}

export function updateRobot(character, keys, tangentBasisAt, dt) {
	const {
		charPos,
		charForward,
		speed,
		rotSpeed,
		charGroup,
		charVelocity,
		charState,
	} = character;

	// Gravity
	const gravityDirection = charPos
		.clone()
		.normalize()
		.multiplyScalar(MARS_GRAVITY);
	charVelocity.addScaledVector(gravityDirection, dt);

	// Update position with velocity
	charPos.addScaledVector(charVelocity, dt);

	// Ground collision and state update
	const distanceToCenter = charPos.length();
	if (distanceToCenter <= R) {
		charPos.normalize().multiplyScalar(R);
		if (charVelocity.dot(charPos.clone().normalize()) < 0) {
			charVelocity.set(0, 0, 0);
		}
		charState.onGround = true;
	} else {
		charState.onGround = false;
	}

	const n0 = charPos.clone().normalize();
	if (charState.onGround) {
		if (keys.has("q")) charForward.applyAxisAngle(n0, +rotSpeed);
		if (keys.has("d")) charForward.applyAxisAngle(n0, -rotSpeed);
		if (keys.has("z")) charPos.addScaledVector(charForward, speed);
		if (keys.has("s")) charPos.addScaledVector(charForward, -speed);
		charPos.normalize().multiplyScalar(R);
		if (keys.has(" ")) {
			charVelocity.addScaledVector(n0, 3.0);
			charState.onGround = false;
		}
	}

	const n1 = charPos.clone().normalize();
	const q = new THREE.Quaternion().setFromUnitVectors(n0, n1);
	charForward.applyQuaternion(q);
	charForward.addScaledVector(n1, -charForward.dot(n1)).normalize();

	const lookAt = charPos.clone().add(charForward);
	charGroup.position.copy(charPos);
	charGroup.up.copy(n1);
	charGroup.lookAt(lookAt);
}

export function tangentBasisAt(pos) {
	const n = pos.clone().normalize();
	let ref = new THREE.Vector3(0, 1, 0);
	if (Math.abs(n.dot(ref)) > 0.95) ref = new THREE.Vector3(1, 0, 0);
	const t1 = new THREE.Vector3().crossVectors(ref, n).normalize();
	const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
	return { n, t1, t2 };
}
