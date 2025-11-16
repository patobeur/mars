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
	const { speed, rotSpeed, collisionRadius } = data;

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
		collisionRadius,
		// charVelocity is no longer used
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
		charState, // Keep for animations
		animationManager,
	} = character;

    let { onGround } = charState;
    let charVelocity = character.charVelocity || new THREE.Vector3();
	const n0 = charPos.clone().normalize();
	let currentAction = "Idle";
	let desiredMovement = new THREE.Vector3();

    // Apply Gravity
    if (!onGround) {
        const gravity = n0.clone().multiplyScalar(MARS_GRAVITY * dt);
        charVelocity.add(gravity);
    }
    desiredMovement.add(charVelocity);

	// Handle rotation
	if (keys.has("q")) charForward.applyAxisAngle(n0, +rotSpeed * dt);
	if (keys.has("d")) charForward.applyAxisAngle(n0, -rotSpeed * dt);

	// Calculate desired movement based on input
	if (keys.has("z") || keys.has("s")) {
		const moveDirection = keys.has("z") ? 1 : -1;
		const moveVector = charForward.clone().multiplyScalar(speed * moveDirection * dt);
		desiredMovement.add(moveVector);
		currentAction = "Walking";
	}

    // Adjust movement for collisions
    let collisionObject = null;
    if (collisionManager) {
        const collisionResult = collisionManager.adjustMovement(desiredMovement);
        desiredMovement = collisionResult.adjustedVector;
        collisionObject = collisionResult.collisionObject;
    }

	// Apply the (potentially adjusted) movement
    const originalPos = charPos.clone();
    const newPos = originalPos.add(desiredMovement);

	// Project the new position onto the sphere (snapping to surface)
    const distanceToCenter = newPos.length();
    if (distanceToCenter <= R) {
        newPos.normalize().multiplyScalar(R);
        charVelocity.set(0, 0, 0); // Stop gravity effect
        onGround = true;
    } else {
        onGround = false;
    }
    charPos.copy(newPos);
    character.charVelocity = charVelocity;
    charState.onGround = onGround;

	// --- Animation ---
	if (charState.action !== currentAction) {
		animationManager.playAnimation(currentAction);
		charState.action = currentAction;
	}

	// --- Orientation ---
	// This part ensures the character model stays upright on the sphere
	const n1 = charPos.clone().normalize();
	const q = new THREE.Quaternion().setFromUnitVectors(n0, n1);
	charForward.applyQuaternion(q);
	charForward.addScaledVector(n1, -charForward.dot(n1)).normalize();

	const lookAt = charPos.clone().add(charForward);
	charGroup.position.copy(charPos);
	charGroup.up.copy(n1);
	charGroup.lookAt(lookAt);

	animationManager.update(dt);

    return { collisionObject };
}

export function tangentBasisAt(pos) {
	const n = pos.clone().normalize();
	let ref = new THREE.Vector3(0, 1, 0);
	if (Math.abs(n.dot(ref)) > 0.95) ref = new THREE.Vector3(1, 0, 0);
	const t1 = new THREE.Vector3().crossVectors(ref, n).normalize();
	const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
	return { n, t1, t2 };
}
