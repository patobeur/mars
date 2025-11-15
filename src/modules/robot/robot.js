import * as THREE from "three";
import { R } from "../../config.js";
import { MARS_GRAVITY } from "../gravity/mars.js";
import { loadRobot } from "./loader.js";
import { createAnimationManager } from "./animation.js";

export async function createRobot(scene, loadingManager) {
	const { model, data, animations } = await loadRobot(scene, loadingManager);
	// console.log(model);
	// console.log(data);
	// console.log(animations);
	const charGroup = new THREE.Group();
	charGroup.add(model);
	scene.add(charGroup);

	let charPos = new THREE.Vector3(R + 2.0, 0, 0);
	let charVelocity = new THREE.Vector3();
	let charState = { onGround: false, action: "Idle" };
	let charForward = new THREE.Vector3();
	const { speed, rotSpeed } = data;

	const animationManager = createAnimationManager(model, animations);
	animationManager.playAnimation("Idle");

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

	return {
		charGroup,
		charPos,
		charForward,
		speed,
		rotSpeed,
		charVelocity,
		charState,
		animationManager,
	};
}

export function updateRobot(character, keys, tangentBasisAt, dt, collisionManager) {
	const {
		charPos,
		charForward,
		speed,
		rotSpeed,
		charGroup,
		charVelocity,
		charState,
		animationManager,
	} = character;

	// Gravity
	const gravityDirection = charPos
		.clone()
		.normalize()
		.multiplyScalar(MARS_GRAVITY);
	charVelocity.addScaledVector(gravityDirection, dt);

	// Update position with velocity
	const moveDirection = charVelocity.clone().normalize();
	const moveDistance = charVelocity.length() * dt;
	const collision = collisionManager.checkCollision(
		charPos,
		moveDirection,
		moveDistance
	);

	if (collision) {
		charVelocity.set(0, 0, 0);
	} else {
		charPos.addScaledVector(charVelocity, dt);
	}

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
	let currentAction = "Idle";

	if (charState.onGround) {
		// --- Collision Detection Origin ---
		// We lift the origin of the ray slightly off the ground to avoid immediate collision with the floor.
		const collisionOrigin = charPos.clone().addScaledVector(n0, 0.2);

		const charRight = new THREE.Vector3().crossVectors(n0, charForward);

		// --- Rotational Collision ---
		if (keys.has("q")) {
			const collision = collisionManager.checkCollision(
				collisionOrigin,
				charRight.clone().negate(),
				0.5
			);
			if (!collision) {
				charForward.applyAxisAngle(n0, +rotSpeed);
			}
		}
		if (keys.has("d")) {
			const collision = collisionManager.checkCollision(
				collisionOrigin,
				charRight,
				0.5
			);
			if (!collision) {
				charForward.applyAxisAngle(n0, -rotSpeed);
			}
		}

		// --- Movement Collision ---
		if (keys.has("z") || keys.has("s")) {
			const moveDirection = keys.has("z") ? 1 : -1;
			const direction = charForward.clone().multiplyScalar(moveDirection);
			const collision = collisionManager.checkCollision(
				collisionOrigin,
				direction,
				speed * dt + 0.1 // Add a small buffer to the distance
			);
			if (!collision) {
				charPos.addScaledVector(direction, speed * dt);
			}
			currentAction = "Walking";
		}
		if (keys.has(" ")) {
			charVelocity.addScaledVector(n0, 3.0);
			charState.onGround = false;
			currentAction = "Jump";
		}
		charPos.normalize().multiplyScalar(R);
	} else {
		currentAction = "Jump";
	}

	if (charState.action !== currentAction) {
		animationManager.playAnimation(currentAction);
		charState.action = currentAction;
	}

	const n1 = charPos.clone().normalize();
	const q = new THREE.Quaternion().setFromUnitVectors(n0, n1);
	charForward.applyQuaternion(q);
	charForward.addScaledVector(n1, -charForward.dot(n1)).normalize();

	const lookAt = charPos.clone().add(charForward);
	charGroup.position.copy(charPos);
	charGroup.up.copy(n1);
	charGroup.lookAt(lookAt);

	animationManager.update(dt);
}

export function tangentBasisAt(pos) {
	const n = pos.clone().normalize();
	let ref = new THREE.Vector3(0, 1, 0);
	if (Math.abs(n.dot(ref)) > 0.95) ref = new THREE.Vector3(1, 0, 0);
	const t1 = new THREE.Vector3().crossVectors(ref, n).normalize();
	const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
	return { n, t1, t2 };
}
