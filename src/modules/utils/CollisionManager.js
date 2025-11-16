
import * as THREE from 'three';

class CollisionManager {
    constructor(character, collidableObjects) {
        this.character = character;
        this.collidableObjects = collidableObjects;
        this.characterRadius = this.character.userData.collisionRadius || 1; // Default radius
    }

    adjustMovement(movementVector) {
        let adjustedVector = movementVector.clone();
        const charPosition = this.character.position.clone();
        const futurePosition = charPosition.add(adjustedVector);
        let collisionObject = null;

        for (const object of this.collidableObjects) {
            const objectPosition = object.position.clone();
            const objectRadius = object.userData.collisionRadius || 1; // Default radius

            const distance = futurePosition.distanceTo(objectPosition);
            const combinedRadius = this.characterRadius + objectRadius;

            if (distance < combinedRadius) {
                // Collision detected
                collisionObject = object;
                const collisionNormal = futurePosition.clone().sub(objectPosition).normalize();

                // Project the movement vector onto the collision normal
                const projection = adjustedVector.clone().projectOnVector(collisionNormal);

                // Subtract the projection to get the sliding vector
                adjustedVector.sub(projection);

                // For simplicity, we handle one collision per frame.
                // A more robust system might handle multiple simultaneous collisions.
                break;
            }
        }
        return { adjustedVector, collisionObject };
    }
}

export default CollisionManager;
