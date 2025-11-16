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

        for (const object of this.collidableObjects) {
            const distance = futurePos.distanceTo(object.position);

            if (distance < this.collisionThreshold) {
                collidingObject = object; // Store the colliding object
                const collisionNormal = futurePos.clone().sub(object.position);

                if (collisionNormal.lengthSq() > 0) {
                    collisionNormal.normalize();

                    const correctionDistance = this.collisionThreshold - distance;
                    futurePos.add(collisionNormal.multiplyScalar(correctionDistance));
                }
            }
        }

        const adjustedMovement = futurePos.sub(charPos);
        return { adjustedMovement, collidingObject };
    }
}
