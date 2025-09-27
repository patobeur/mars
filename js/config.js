export const CONFIG = {
	planet: {
		radius: 100,
		color: 0x914c2b,
		roughness: 1,
		metalness: 0,
	},
	camera: {
		fov: 55,
		near: 0.1,
		far: 5000,
		zoomMin: 10,
		zoomMax: 420,
		startZoom: 45,
	},
	gravity: {
		G: 30,
		dampTangent: 0.12,
		dampNormal: 0.45,
	},
	player: {
		glb: "assets/Animated_Base_Character.glb",
		height: 1.2, // écart à la surface (marge)
		colliderRadius: 1.05, // rayon de collision
		scale: 1.0,
		acceleration: 40, // accélération dans le plan tangent
		maxSpeed: 28, // vitesse maximale
		jumpStrength: 15, // impulsion verticale pour le saut
		groundFriction: 35, // friction au sol (freinage)
		spawnLatLongDeg: { lat: 15, lon: -40 }, // point de départ (facultatif)
		animations: [
			"Rig|Crouch_Fwd_Loop",
			"Rig|Crouch_Idle_Loop",
			"Rig|Dance_Loop",
			"Rig|Death01",
			"Rig|Driving_Loop",
			"Rig|Fixing_Kneeling",
			"Rig|Hit_Chest",
			"Rig|Hit_Head",
			"Rig|Idle_Loop",
			"Rig|Idle_Talking_Loop",
			"Rig|Idle_Torch_Loop",
			"Rig|Interact",
			"Rig|Jog_Fwd_Loop",
			"Rig|Jump_Land",
			"Rig|Jump_Loop",
			"Rig|Jump_Start",
			"Rig|Pickup_Table",
			"Rig|Pistol_Aim_Down",
			"Rig|Pistol_Aim_Neutral",
			"Rig|Pistol_Idle_Loop",
			"Rig|Pistol_Reload",
			"Rig|Pistol_Shoot",
			"Rig|Punch_Cross",
			"Rig|Punch_Enter",
			"Rig|Punch_Jab",
			"Rig|Push_Loop",
			"Rig|Roll",
			"Rig|Roll_RM",
			"Rig|Sitting_Enter",
			"Rig|Sitting_Exit",
			"Rig|Sitting_Idle_Loop",
			"Rig|Sitting_Talking_Loop",
			"Rig|Spell_Simple_Enter",
			"Rig|Spell_Simple_Exit",
			"Rig|Spell_Simple_Idle_Loop",
			"Rig|Spell_Simple_Shoot",
			"Rig|Sprint_Fwd",
			"Rig|Swim_Fwd_Loop",
			"Rig|Swim_Idle_Loop",
			"Rig|Sword_Attack",
			"Rig|Sword_Attack_RM",
			"Rig|Sword_Idle",
			"Rig|Walk_Formal_Loop",
			"Rig|Walk_Loop",
		],
	},
	rocks: {
		count: 600,
		safeSpawnRadius: 12, // pas de rochers trop près du spawn joueur (distance tangentielle approx)
		variants: [
			{
				glb: "assets/Rock.glb",
				scaleMin: 0.9,
				scaleMax: 1.6,
				baseCollider: 1.35,
				height: 0.6,
			},
			{
				glb: "assets/Rock Medium.glb",
				scaleMin: 0.8,
				scaleMax: 1.4,
				baseCollider: 1.2,
				height: 0.5,
			},
		],
	},
	lighting: { ambient: 0.35, sun: 1.0, sunDir: [0.8, 0.5, 0.3] },
};
