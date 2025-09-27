import * as THREE from "three";
import { R } from "./config.js";

export function createCharacter(scene) {
	const charGroup = new THREE.Group();
	charGroup.add(
		new THREE.Mesh(
			new THREE.SphereGeometry(0.2, 16, 12),
			new THREE.MeshStandardMaterial({ color: 0xffcc66 })
		)
	);
	const eyes = new THREE.Group();
	const eye_gauche = new THREE.Group();
	const eye_droit = new THREE.Group();
	const eye_g = new THREE.Mesh(
		new THREE.SphereGeometry(0.04, 16, 12),
		new THREE.MeshStandardMaterial({ color: 0xffffff })
	);
	const eye_d = new THREE.Mesh(
		new THREE.SphereGeometry(0.04, 16, 12),
		new THREE.MeshStandardMaterial({ color: 0xffffff })
	);
	const eye_g_pupille = new THREE.Mesh(
		new THREE.SphereGeometry(0.03, 16, 12),
		new THREE.MeshStandardMaterial({ color: 0x000000 })
	);
	const eye_d_pupille = new THREE.Mesh(
		new THREE.SphereGeometry(0.03, 16, 12),
		new THREE.MeshStandardMaterial({ color: 0x000000 })
	);
	eye_gauche.add(eye_g);
	eye_droit.add(eye_d);
	eyes.add(eye_gauche);
	eyes.add(eye_droit);
	charGroup.add(eyes);
	scene.add(charGroup);
	eye_gauche.position.set(0.05, 0.15, 0.1);
	eye_droit.position.set(-0.05, 0.15, 0.1);
	eye_g_pupille.position.z = 0.02;
	eye_d_pupille.position.z = 0.02;
	eye_gauche.add(eye_g_pupille);
	eye_droit.add(eye_d_pupille);

	let charPos = new THREE.Vector3(R, 0, 0);
	let charForward = new THREE.Vector3();
	const speed = 0.018,
		rotSpeed = 0.035;

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

	return { charGroup, charPos, charForward, speed, rotSpeed };
}

export function updateCharacter(
	character,
	keys,
	tangentBasisAt
) {
	const { charPos, charForward, speed, rotSpeed, charGroup } = character;
	const n0 = charPos.clone().normalize();
	if (keys.has("q")) charForward.applyAxisAngle(n0, +rotSpeed);
	if (keys.has("d")) charForward.applyAxisAngle(n0, -rotSpeed);
	if (keys.has("z")) charPos.addScaledVector(charForward, speed);
	if (keys.has("s")) charPos.addScaledVector(charForward, -speed);

	charPos.normalize().multiplyScalar(R);
	const n1 = charPos.clone().normalize();
	const q = new THREE.Quaternion().setFromUnitVectors(n0, n1);
	charForward.applyQuaternion(q);
	charForward.addScaledVector(n1, -charForward.dot(n1)).normalize();

	const lookAt = charPos.clone().add(charForward);
	charGroup.position.copy(charPos);
	charGroup.up.copy(n1);
	charGroup.lookAt(lookAt);
}

export function tangentBasisAt(pos) {
	const n = pos.clone().normalize();
	let ref = new THREE.Vector3(0, 1, 0);
	if (Math.abs(n.dot(ref)) > 0.95) ref = new THREE.Vector3(1, 0, 0);
	const t1 = new THREE.Vector3().crossVectors(ref, n).normalize();
	const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
	return { n, t1, t2 };
}