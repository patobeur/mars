import { getUIDivs } from '../../ui.js';

function initializeNavbar() {
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
        const uiDivs = getUIDivs();
        const testSubMenuContainer = viewMenu.querySelector('.dropdown-submenu .dropdown-menu');
        const testSubMenuLi = viewMenu.querySelector('.dropdown-submenu');

        if (testSubMenuContainer && testSubMenuLi) {
            // Vider les anciens éléments pour éviter les doublons
            testSubMenuContainer.innerHTML = '';
            const existingItems = Array.from(viewMenu.children).filter(li => !li.classList.contains('dropdown-submenu'));
            existingItems.forEach(item => item.remove());

            uiDivs.forEach(div => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${div.id}`;
                link.textContent = div.dataset.name || div.id;
                link.classList.add('dropdown-item');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetElement = document.getElementById(div.id);
                    if (targetElement) {
                        const isHidden = targetElement.style.display === 'none';
                        targetElement.style.display = isHidden ? '' : 'none';
                    }
                });
                listItem.appendChild(link);

                if (div.id.toLowerCase().includes('test')) {
                    testSubMenuContainer.appendChild(listItem);
                } else {
                    // Ajouter l'élément au menu principal
                    viewMenu.appendChild(listItem);
                }
            });

            // S'assurer que le sous-menu est le dernier élément
            viewMenu.appendChild(testSubMenuLi);
        }
    }
}

initializeNavbar();