export class ProximityManager {
	constructor(character, ressources) {
		this.character = character;
		this.ressources = ressources;
		this.proximityThreshold = 0.5;
		this.messageElement = this.createMessageElement();
	}

	createMessageElement() {
		const element = document.createElement("div");
		element.id = "proximity-message";
		element.classList.add("hidden");
		document.body.appendChild(element);

		return element;
	}

	update() {
		let closestRessource = null;
		let minDistance = Infinity;

		for (const ressource of this.ressources) {
			const distance = this.character.charPos.distanceTo(ressource.position);
			if (distance < minDistance) {
				minDistance = distance;
				closestRessource = ressource;
			}
		}

		if (closestRessource && minDistance <= this.proximityThreshold) {
			this.messageElement.classList.remove("hidden");
			this.messageElement.textContent = `Vous pouvez récupérer la ressource ${closestRessource.type}`;
		} else {
			this.messageElement.classList.add("hidden");
		}
	}
}
