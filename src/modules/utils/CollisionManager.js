import * as THREE from "three";

export class CollisionManager {
  constructor(character, collidableObjects) {
    this.character = character;
    this.collidableObjects = collidableObjects;
    this.collidableSpheres = [];
    this.initCollidableSpheres();
  }

  initCollidableSpheres() {
    this.collidableObjects.forEach(obj => {
      obj.updateWorldMatrix(true, false);
      const box = new THREE.Box3().setFromObject(obj);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const radius = box.getSize(new THREE.Vector3()).length() / 2;
        this.collidableSpheres.push(new THREE.Sphere(center, radius));
      }
    });
  }

  getAdjustedMovement(movementVector) {
    if (movementVector.lengthSq() === 0 || this.collidableSpheres.length === 0) {
      return movementVector;
    }

    this.character.charGroup.position.copy(this.character.charPos);
    this.character.charGroup.updateWorldMatrix(true, false);
    const charBox = new THREE.Box3().setFromObject(this.character.charGroup);
    const charCenter = charBox.getCenter(new THREE.Vector3());
    const charRadius = charBox.getSize(new THREE.Vector3()).length() / 2;
    const charSphere = new THREE.Sphere(charCenter, charRadius);

    let adjustedMovement = movementVector.clone();

    for (const collidableSphere of this.collidableSpheres) {
      const futureCharSphere = charSphere.clone().translate(adjustedMovement);

      if (futureCharSphere.intersectsSphere(collidableSphere)) {
        const collisionNormal = new THREE.Vector3()
            .subVectors(futureCharSphere.center, collidableSphere.center)
            .normalize();

        // Project the movement vector onto the collision normal
        const penetration = adjustedMovement.dot(collisionNormal);

        // If the movement is into the sphere, adjust it to slide along the surface
        if (penetration < 0) {
            const slideVector = collisionNormal.multiplyScalar(penetration);
            adjustedMovement.sub(slideVector);
        }
      }
    }

    return adjustedMovement;
  }
}
