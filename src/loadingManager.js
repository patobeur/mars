import * as THREE from "three";

export function createLoadingManager(onLoad) {
	const loadingManager = new THREE.LoadingManager();
	const progressBar = document.getElementById("progress-bar");
	const progressText = document.getElementById("progress-text");
	const loadingScreen = document.getElementById("loading-screen");

	loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
		const progress = (itemsLoaded / itemsTotal) * 100;
		progressBar.style.width = `${progress}%`;
		progressText.textContent = `${Math.round(progress)}%`;
	};

	loadingManager.onLoad = () => {
		loadingScreen.style.display = "none";
		onLoad();
	};

	return loadingManager;
}
