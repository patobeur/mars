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
		debug: {}, // Empty object for debug helpers
	};
}

export function updateRobot(
	character,
	keys,
	tangentBasisAt,
	dt,
	collisionManager,
	scene // Pass scene for debugging
) {
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

	const n0 = charPos.clone().normalize();
	let currentAction = "Idle";

	// --- Grounded Movement ---
	if (charState.onGround) {
		charVelocity.set(0, 0, 0); // No accumulated velocity on ground

		const collisionOrigin = charPos.clone().addScaledVector(n0, 0.2);
		const charRight = new THREE.Vector3().crossVectors(n0, charForward);

		// Rotation
		const rotRayLength = 0.6;
		const canRotateLeft = !collisionManager.checkCollision(collisionOrigin, charRight.clone().negate(), rotRayLength, true, "rotLeft");
		const canRotateRight = !collisionManager.checkCollision(collisionOrigin, charRight, rotRayLength, true, "rotRight");
		if (keys.has("q") && canRotateLeft) charForward.applyAxisAngle(n0, +rotSpeed * dt);
		if (keys.has("d") && canRotateRight) charForward.applyAxisAngle(n0, -rotSpeed * dt);

		// Forward/Backward Movement
		const moveRayLength = speed * dt + 0.1;
		const upwardBias = 0.08;
		const forwardDir = charForward.clone().addScaledVector(n0, upwardBias).normalize();
		const backDir = charForward.clone().negate().addScaledVector(n0, upwardBias).normalize();

		const canMoveForward = !collisionManager.checkCollision(collisionOrigin, forwardDir, moveRayLength, true, "moveForward");
		const canMoveBackward = !collisionManager.checkCollision(collisionOrigin, backDir, moveRayLength, true, "moveBackward");

		let moveVector = new THREE.Vector3();
		if (keys.has("z") && canMoveForward) {
			moveVector.add(charForward);
			currentAction = "Walking";
		}
		if (keys.has("s") && canMoveBackward) {
			moveVector.sub(charForward);
			currentAction = "Walking";
		}
		charPos.addScaledVector(moveVector, speed * dt);

		// Jump
		if (keys.has(" ")) {
			charVelocity.addScaledVector(n0, 3.0); // Jump impulse
			charState.onGround = false;
			currentAction = "Jump";
		}
	}

	// --- Air Movement ---
	if (!charState.onGround) {
		const gravity = charPos.clone().normalize().multiplyScalar(MARS_GRAVITY);
		charVelocity.addScaledVector(gravity, dt);
		charPos.addScaledVector(charVelocity, dt);
		currentAction = "Jump";
	}

	// --- Ground Correction ---
	// This is the key: move the character, then stick it to the ground.
	const distanceToCenter = charPos.length();
	if (distanceToCenter <= R) {
		charPos.normalize().multiplyScalar(R);
		// If character was moving downwards, stop that velocity.
		const n = charPos.clone().normalize();
		const projection = charVelocity.dot(n);
		if (projection < 0) {
			charVelocity.addScaledVector(n, -projection);
		}
		charState.onGround = true;
	} else {
		charState.onGround = false;
	}

	// --- Update Animation ---
	if (charState.action !== currentAction) {
		animationManager.playAnimation(currentAction);
		charState.action = currentAction;
	}

	// --- Update Model Orientation ---
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
