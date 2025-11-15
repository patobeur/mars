import * as THREE from "three";

export class CollisionManager {
  constructor(character, collidableObjects) {
    this.character = character;
    this.collidableObjects = collidableObjects;

    // Pre-compute world-space AABBs for static collidable objects for efficiency.
    this.collidableBoxes = this.collidableObjects.map(
      (obj) => new THREE.Box3().setFromObject(obj)
    );
  }

  /**
   * Checks for collisions given a proposed movement vector and adjusts it to prevent passing through objects.
   * @param {THREE.Vector3} movementVector - The desired movement vector for the character.
   * @returns {THREE.Vector3} The adjusted movement vector after collision resolution.
   */
  getAdjustedMovement(movementVector) {
    if (movementVector.lengthSq() === 0 || this.collidableBoxes.length === 0) {
      return movementVector;
    }

    // To get an accurate AABB, we need to manually update the world matrix of the character group
    // to its current logical position and orientation before calculating the bounding box.
    this.character.charGroup.position.copy(this.character.charPos);
    this.character.charGroup.updateWorldMatrix(true, false);
    const currentBox = new THREE.Box3().setFromObject(this.character.charGroup);

    const futureBox = currentBox.clone().translate(movementVector);

    let adjustedMovement = movementVector.clone();

    for (const collidableBox of this.collidableBoxes) {
      if (futureBox.intersectsBox(collidableBox)) {
        // Simple AABB collision resolution.
        // We calculate the penetration depth on each axis and push the character back
        // along the axis of minimum penetration.

        const center_f = futureBox.getCenter(new THREE.Vector3());
        const center_c = collidableBox.getCenter(new THREE.Vector3());
        const half_size_f = futureBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        const half_size_c = collidableBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);

        const dx = center_f.x - center_c.x;
        const px = (half_size_f.x + half_size_c.x) - Math.abs(dx);
        if (px <= 0) continue; // No intersection

        const dy = center_f.y - center_c.y;
        const py = (half_size_f.y + half_size_c.y) - Math.abs(dy);
        if (py <= 0) continue; // No intersection

        const dz = center_f.z - center_c.z;
        const pz = (half_size_f.z + half_size_c.z) - Math.abs(dz);
        if (pz <= 0) continue; // No intersection

        // Find minimum penetration axis
        if (px < py && px < pz) {
          const sign = Math.sign(dx);
          adjustedMovement.x -= px * sign;
        } else if (py < px && py < pz) {
          const sign = Math.sign(dy);
          adjustedMovement.y -= py * sign;
        } else {
          const sign = Math.sign(dz);
          adjustedMovement.z -= pz * sign;
        }

        // After adjusting for one collision, we should re-evaluate the movement for other potential collisions.
        futureBox.copy(currentBox).translate(adjustedMovement);
      }
    }
    return adjustedMovement;
  }
}
