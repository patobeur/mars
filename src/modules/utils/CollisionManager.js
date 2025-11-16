
import * as THREE from 'three';

export class CollisionManager {
    constructor(character, collidableObjects) {
        this.character = character;
        this.collidableObjects = collidableObjects;
        this.collisionThreshold = 1.5;
    }

    getAdjustedMovement(movementVector) {
        const charPos = this.character.charPos;
        let futurePos = charPos.clone().add(movementVector);
        let collidingObject = null;
        let totalCorrection = new THREE.Vector3();

        // --- Start of new logic ---

        // 1. Resolve any existing penetration first.
        // This prevents the character from getting stuck inside an object.
        for (const object of this.collidableObjects) {
            const distanceVector = charPos.clone().sub(object.position);
            const distance = distanceVector.length();
            const penetrationDepth = this.collisionThreshold - distance;

            if (penetrationDepth > 0) {
                // The character is already inside a sphere, push it out.
                if (distanceVector.lengthSq() > 0) {
                    const correction = distanceVector.normalize().multiplyScalar(penetrationDepth);
                    totalCorrection.add(correction);
                    collidingObject = object;
                }
            }
        }

        // Apply the push-out correction directly to the character's current position
        if (totalCorrection.lengthSq() > 0) {
            charPos.add(totalCorrection);
        }

        // 2. Now, calculate the allowed future movement from the corrected position.
        futurePos = charPos.clone().add(movementVector);

        for (const object of this.collidableObjects) {
            const distance = futurePos.distanceTo(object.position);

            if (distance < this.collisionThreshold) {
                collidingObject = object;
                const collisionNormal = futurePos.clone().sub(object.position);

                if (collisionNormal.lengthSq() > 0) {
                    collisionNormal.normalize();
                    // Project the intended movement onto the collision normal
                    const pushback = movementVector.clone().projectOnVector(collisionNormal);

                    // If moving towards the object, subtract the pushback
                    if (movementVector.dot(collisionNormal) < 0) {
                        movementVector.sub(pushback);
                    }
                }
            }
        }

        // --- End of new logic ---

        const adjustedMovement = movementVector;
        return { adjustedMovement, collidingObject };
    }
}
