import * as THREE from "three";
import { CONFIG } from "./config.js";

export const keys = Object.create(null);
export let targetZoom = CONFIG.camera.startZoom;

function setupEventListeners() {
    addEventListener("keydown", (e) => (keys[e.code] = true));
    addEventListener("keyup", (e) => (keys[e.code] = false));

    addEventListener(
        "wheel",
        (e) => {
            targetZoom += Math.sign(e.deltaY) * 8;
            targetZoom = THREE.MathUtils.clamp(
                targetZoom,
                CONFIG.camera.zoomMin,
                CONFIG.camera.zoomMax
            );
        },
        { passive: true }
    );
}

export function initControls() {
    setupEventListeners();
}