import * as THREE from "three";

export class CollisionManager {
	constructor(character, collidableObjects) {
		this.character = character;
		this.collidableObjects = collidableObjects;
		this.raycaster = new THREE.Raycaster();
	}

	checkCollision(origin, direction, distance) {
		this.raycaster.set(origin, direction);
		this.raycaster.far = distance;
		const intersections = this.raycaster.intersectObjects(
			this.collidableObjects,
			true
		);
		return intersections.length > 0 ? intersections[0] : null;
	}

	checkCameraCollision(cameraPosition, targetPosition) {
		const direction = cameraPosition
			.clone()
			.sub(targetPosition)
			.normalize();
		const distance = cameraPosition.distanceTo(targetPosition);
		this.raycaster.set(targetPosition, direction);
		this.raycaster.far = distance;
		const intersections = this.raycaster.intersectObjects(
			this.collidableObjects,
			true
		);
		if (intersections.length > 0) {
			return intersections[0];
		}
		return null;
	}
}
