// Mobile navigation: drill-down expands, hamburger toggle and body overlay.

// Add event listeners to expandable nav items
const navExpand = Array.from(document.querySelectorAll<HTMLElement>('.nav-expand'));

navExpand.forEach((item) => {
  item.querySelector('.nav-expand-link')?.addEventListener('click', () => item.classList.add('active'));
  item.querySelector('.nav-back-link')?.addEventListener('click', () => item.classList.remove('active'));
});

// Set up and add overlay
const bodyOverlay = document.createElement('div');
bodyOverlay.setAttribute('id', 'body-overlay');
bodyOverlay.classList.add('d-none');
document.body.appendChild(bodyOverlay);

const toggleMenu = (): void => {
  document.body.classList.toggle('nav-is-toggled');
  bodyOverlay.classList.toggle('d-none');
};

// Hamburger menu
document.getElementById('nav-mobile')?.addEventListener('click', toggleMenu);

// Overlay click closes the menu
bodyOverlay.addEventListener('click', toggleMenu);