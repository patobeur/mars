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
        maxSpeed: 28,
    },
    player: {
        glb: "assets/Animated Base Character.glb",
        height: 1.2, // écart à la surface (marge)
        colliderRadius: 1.05, // rayon de collision
        scale: 1.0,
        speed: 62, // accélération dans le plan tangent
        jumpStrength: 15, // impulsion verticale pour le saut
        spawnLatLongDeg: { lat: 15, lon: -40 }, // point de départ (facultatif)
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