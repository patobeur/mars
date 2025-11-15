import * as THREE from "three";
import { R } from "../../config.js";
import { MARS_GRAVITY } from "../gravity/mars.js";
import { loadRobot } from "./loader.js";
import { createAnimationManager } from "./animation.js";

export async function createRobot(scene, loadingManager) {
	const { model, data, animations } = await loadRobot(scene, loadingManager);
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

	const n0 = charPos.clone().normalize();
	let currentAction = "Idle";
	let totalMovement = new THREE.Vector3();

	// 1. Calculate desired movement from controls
	let controlMovement = new THREE.Vector3();
	if (charState.onGround) {
		if (keys.has("q")) charForward.applyAxisAngle(n0, +rotSpeed * dt);
		if (keys.has("d")) charForward.applyAxisAngle(n0, -rotSpeed * dt);

		if (keys.has("z") || keys.has("s")) {
			const moveDirection = keys.has("z") ? 1 : -1;
			controlMovement.addScaledVector(charForward, speed * moveDirection * dt);
			currentAction = "Walking";
		}

		if (keys.has(" ")) {
			charVelocity.addScaledVector(n0, 3.0);
			charState.onGround = false;
			currentAction = "Jump";
		}
	} else {
		currentAction = "Jump";
	}

	// 2. Apply gravity to velocity only when the character is not on the ground
	if (!charState.onGround) {
		const gravityDirection = n0.clone().multiplyScalar(MARS_GRAVITY);
		charVelocity.addScaledVector(gravityDirection, dt);
	}

	// 3. Combine control and physics (velocity) movements
	totalMovement.add(controlMovement);
	totalMovement.addScaledVector(charVelocity, dt);

	// 4. Get collision-adjusted movement
	const adjustedMovement = collisionManager.getAdjustedMovement(totalMovement);
	charPos.add(adjustedMovement);

	// 5. Ground collision and state update
	const distanceToCenter = charPos.length();
	if (distanceToCenter <= R) {
		charPos.normalize().multiplyScalar(R);

		const radialVelocity = charVelocity.dot(charPos.clone().normalize());
		if (radialVelocity < 0) {
			charVelocity.addScaledVector(charPos.clone().normalize(), -radialVelocity);
		}

		charState.onGround = true;
	} else {
		charState.onGround = false;
	}

	// If movement was stopped by collision, update velocity accordingly
	if (totalMovement.lengthSq() > 0 && adjustedMovement.lengthSq() < totalMovement.lengthSq()) {
		// This is a simplification; true physical response would be more complex.
		// For instance, we could zero out the velocity component normal to the collision surface.
		charVelocity.multiplyScalar(0.9); // Dampen velocity on collision
	}

	// 6. Update animation
	if (charState.action !== currentAction) {
		animationManager.playAnimation(currentAction);
		charState.action = currentAction;
	}

	// 7. Update character model orientation
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
