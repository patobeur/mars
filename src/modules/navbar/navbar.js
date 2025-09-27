import { MODES } from '../../config.js';

const modeLabels = {
    [MODES.TPS]: "3e personne",
    [MODES.FPS]: "1re personne",
    [MODES.SAT]: "Satellite",
    [MODES.TOP]: "Top-down",
    [MODES.ORBIT]: "Orbit perso",
    [MODES.ORBIT_SPHERE]: "Orbit sphère",
};

let menuItems = [];

export function initNavbar(setModeCallback) {
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    const viewMenu = document.getElementById('view-menu');

    // Gérer le basculement du menu mobile
    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
        });
    }

    // Remplir le menu "Vue"
    if (viewMenu) {
        viewMenu.innerHTML = ''; // Vider le contenu existant
        menuItems = []; // Réinitialiser le tableau

        for (const modeKey in MODES) {
            const modeValue = MODES[modeKey];
            const label = modeLabels[modeValue] || modeValue;

            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = label;
            link.dataset.mode = modeValue;
            link.classList.add('dropdown-item');

            link.addEventListener('click', (e) => {
                e.preventDefault();
                setModeCallback(modeValue);
                // Sur mobile, fermer le menu après la sélection
                if (navbarMenu.classList.contains('active')) {
                    navbarMenu.classList.remove('active');
                }
            });

            listItem.appendChild(link);
            viewMenu.appendChild(listItem);
            menuItems.push(link);
        }
    }

    return {
        updateNavbar(currentMode) {
            menuItems.forEach(item => {
                item.classList.toggle('active', item.dataset.mode === currentMode);
            });
        }
    };
}