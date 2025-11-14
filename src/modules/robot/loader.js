import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function loadRobot(scene, loadingManager) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader(loadingManager);
        const jsonLoader = new THREE.FileLoader(loadingManager);

        jsonLoader.load("assets/characters/RobotExpressive.json", (json) => {
            const data = JSON.parse(json);
            loader.load(
                `assets/characters/${data.file}`,
                (gltf) => {
                    const model = gltf.scene;
                    model.scale.setScalar(data.scale);
					model.traverse((child) => {
						if (child.isMesh) {
							child.castShadow = true;
						}
					});
                    scene.add(model);
                    resolve({ model, data, animations: gltf.animations });
                },
                undefined,
                (error) => {
                    console.error(`An error happened while loading the robot model: ${error}`);
                    reject(error);
                }
            );
        });
    });
}