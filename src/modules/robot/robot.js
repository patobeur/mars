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
    let playerCollidingObject = null;
    let physicsCollidingObject = null;

    // Phase 1: Player-controlled movement (rotation and forward/backward)
    if (charState.onGround) {
        if (keys.has("q")) charForward.applyAxisAngle(n0, +rotSpeed * dt);
        if (keys.has("d")) charForward.applyAxisAngle(n0, -rotSpeed * dt);
    }

    const playerMovementIntent = new THREE.Vector3();
    if (keys.has("z") || keys.has("s")) {
        const moveDirection = keys.has("z") ? 1 : -1;
        playerMovementIntent.addScaledVector(charForward, speed * moveDirection * dt);
        currentAction = "Walking";
    }

    // Get and apply collision-adjusted player movement
    const { adjustedMovement: adjustedPlayerMovement, collidingObject: pco } = collisionManager.getAdjustedMovement(playerMovementIntent);
    charPos.add(adjustedPlayerMovement);
    playerCollidingObject = pco;

    // Phase 2: Physics-based movement (gravity, jumping, velocity)
    const posBeforePhysics = charPos.clone();

    // Apply gravity to velocity if in the air
    if (!charState.onGround) {
        const gravityDirection = charPos.clone().normalize().multiplyScalar(-MARS_GRAVITY);
        charVelocity.addScaledVector(gravityDirection, dt);
    }

    // Handle jumping
    if (charState.onGround && keys.has(" ")) {
        charVelocity.addScaledVector(n0, 4.0); // Jump impulse
    }

    const physicsMovementIntent = charVelocity.clone().multiplyScalar(dt);

    // Get and apply collision-adjusted physics movement
    const { adjustedMovement: adjustedPhysicsMovement, collidingObject: Fco } = collisionManager.getAdjustedMovement(physicsMovementIntent);
    charPos.add(adjustedPhysicsMovement);
    physicsCollidingObject = Fco;

    // Update velocity to reflect the actual movement that occurred
    const actualPhysicsMovement = charPos.clone().sub(posBeforePhysics);
    if (dt > 0) {
        charVelocity.copy(actualPhysicsMovement).divideScalar(dt);
    } else {
        charVelocity.set(0, 0, 0);
    }

    // Phase 3: Ground constraint
    const distanceToCenter = charPos.length();
    const justLanded = !charState.onGround && distanceToCenter <= R;

    if (distanceToCenter <= R) {
        charPos.normalize().multiplyScalar(R);
        charState.onGround = true;

        if (justLanded) {
            // Project velocity onto the tangent plane to stop downward/upward motion
            const surfaceNormal = charPos.clone().normalize();
            const projection = charVelocity.dot(surfaceNormal);
            charVelocity.sub(surfaceNormal.multiplyScalar(projection));
        }
    } else {
        charState.onGround = false;
    }

    // Phase 4: Finalize orientation and animation
    const n1 = charPos.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(n0, n1);
    charForward.applyQuaternion(q);
    charForward.addScaledVector(n1, -charForward.dot(n1)).normalize();

    const lookAt = charPos.clone().add(charForward);
    charGroup.position.copy(charPos);
    charGroup.up.copy(n1);
    charGroup.lookAt(lookAt);

    // Determine final animation state
    if (!charState.onGround) {
        currentAction = "Jump";
    }

    if (charState.action !== currentAction) {
        animationManager.playAnimation(currentAction);
        charState.action = currentAction;
    }
    animationManager.update(dt);

    return { collidingObject: playerCollidingObject || physicsCollidingObject };
}

export function tangentBasisAt(pos) {
	const n = pos.clone().normalize();
	let ref = new THREE.Vector3(0, 1, 0);
	if (Math.abs(n.dot(ref)) > 0.95) ref = new THREE.Vector3(1, 0, 0);
	const t1 = new THREE.Vector3().crossVectors(ref, n).normalize();
	const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
	return { n, t1, t2 };
}
