// --- Config ---
export const R = 20; // Rayon de la planète

export const config = {
	player: { glb: "assets/Animated_Base_Character.glb" },
};

export const MODES = {
	TPS: "TPS",
	FPS: "FPS",
	SAT: "SAT",
	TOP: "TOP",
	ORBIT: "ORBIT",
	ORBIT_SPHERE: "ORBIT_SPHERE",
};

// --- Constantes pour les contrôles ---
export const TOP_MIN = 1.2;
export const TOP_MAX = 10;
export const SAT_MIN = R * 1.2;
export const SAT_MAX = R * 10;
