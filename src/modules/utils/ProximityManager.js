export class ProximityManager {
    constructor(character, cubes) {
        this.character = character;
        this.cubes = cubes;
        this.proximityThreshold = 2;
        this.messageElement = this.createMessageElement();
    }

    createMessageElement() {
        const element = document.createElement('div');
        element.id = 'proximity-message';
        element.classList.add('hidden');
        document.body.appendChild(element);
        return element;
    }

    update() {
        let closestCube = null;
        let minDistance = Infinity;

        for (const cube of this.cubes) {
            const distance = this.character.position.distanceTo(cube.position);
            if (distance < minDistance) {
                minDistance = distance;
                closestCube = cube;
            }
        }

        if (closestCube && minDistance <= this.proximityThreshold) {
            this.messageElement.classList.remove('hidden');
            this.messageElement.textContent = `Vous pouvez récupérer la ressource ${closestCube.type}`;
        } else {
            this.messageElement.classList.add('hidden');
        }
    }
}
