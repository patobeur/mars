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

	// 1. Calculate raw movement intent
	let movementVector = new THREE.Vector3();
	let currentAction = "Idle";

	// Apply gravity to velocity
	if (!charState.onGround) {
		const gravityDirection = charPos.clone().normalize().multiplyScalar(-MARS_GRAVITY);
		charVelocity.addScaledVector(gravityDirection, dt);
	}

	// Apply velocity from previous frames (e.g., from jumping)
	movementVector.addScaledVector(charVelocity, dt);

	// Apply user input for this frame
	const n0 = charPos.clone().normalize();
	if (charState.onGround) {
		if (keys.has("q")) charForward.applyAxisAngle(n0, +rotSpeed * dt);
		if (keys.has("d")) charForward.applyAxisAngle(n0, -rotSpeed * dt);
		if (keys.has("z") || keys.has("s")) {
			const moveDirection = keys.has("z") ? 1 : -1;
			movementVector.addScaledVector(charForward, speed * moveDirection * dt);
			currentAction = "Walking";
		}
		if (keys.has(" ")) {
			charVelocity.addScaledVector(n0, 4.0); // Jump impulse
			charState.onGround = false;
		}
	}

	// 2. Get collision-adjusted movement
	const adjustedMovement = collisionManager.getAdjustedMovement(movementVector);
	let futurePos = charPos.clone().add(adjustedMovement);

	// 3. Apply ground constraint and update state
	const distanceToCenter = futurePos.length();
	if (distanceToCenter <= R) {
		futurePos.normalize().multiplyScalar(R);
		// Project velocity onto the tangent plane to stop downward motion
        const surfaceNormal = futurePos.clone().normalize();
        const projection = charVelocity.dot(surfaceNormal);
        if (projection < 0) {
            charVelocity.sub(surfaceNormal.multiplyScalar(projection));
        }
		charState.onGround = true;
        if (currentAction === 'Idle' && !keys.has(" ")) {
            currentAction = charState.action; // Persist walking if still moving
        }
	} else {
		charState.onGround = false;
	}

    if (!charState.onGround) {
        currentAction = "Jump";
    }

	// 4. Finalize position and update character orientation
	charPos.copy(futurePos);

	const n1 = charPos.clone().normalize();
	const q = new THREE.Quaternion().setFromUnitVectors(n0, n1);
	charForward.applyQuaternion(q);
	charForward.addScaledVector(n1, -charForward.dot(n1)).normalize();

	const lookAt = charPos.clone().add(charForward);
	charGroup.position.copy(charPos);
	charGroup.up.copy(n1);
	charGroup.lookAt(lookAt);

	// 5. Update animation
	if (charState.action !== currentAction) {
		animationManager.playAnimation(currentAction);
		charState.action = currentAction;
	}
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
