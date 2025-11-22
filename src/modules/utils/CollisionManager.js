import * as THREE from "three";

export class CollisionManager {
	constructor(character, collidableObjects, scene) {
		this.character = character;
		this.collidableObjects = collidableObjects;
		this.raycaster = new THREE.Raycaster();
		this.scene = scene; // Keep a reference to the scene
		this.helpers = {}; // To store ArrowHelpers for debugging
	}

	// Method to create or update an ArrowHelper for debugging
	_updateArrowHelper(name, origin, direction, color = 0xff0000) {
		if (this.helpers[name]) {
			this.helpers[name].position.copy(origin);
			this.helpers[name].setDirection(direction);
		} else {
			const dir = direction.clone();
			const arrow = new THREE.ArrowHelper(
				dir,
				origin,
				direction.length(),
				color
			);
			this.helpers[name] = arrow;
			if (this.scene) {
				this.scene.add(this.helpers[name]);
			}
		}
	}

	checkCollision(origin, direction, distance, debug = false, name = "default") {
		if (debug) {
			const arrowDir = direction.clone().multiplyScalar(distance);
			this._updateArrowHelper(name, origin, arrowDir, 0xff0000); // Red for collision rays
		}

		this.raycaster.set(origin, direction);
		this.raycaster.far = distance;
		const intersections = this.raycaster.intersectObjects(
			this.collidableObjects,
			true
		);
		return intersections.length > 0 ? intersections[0] : null;
	}
}
