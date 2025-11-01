// DOM Elements
const sidebar = document.getElementById("sidebar");
const sidebarContent = document.querySelector('.sidebar-content');
const postButton = document.getElementById('post-button');
const tabContent = document.getElementById('tab-content');
const tabTextElements = document.querySelectorAll('.tab-text');
const closeSidebarButton = document.querySelector(".close-sidebar");

// INITIAL STATES
sidebar.classList.add("sidebar-open");
tabTextElements.forEach((element) => {
    element.classList.add("tab-text-sidebar-opened");
});

// Toggle Sidebar
closeSidebarButton.addEventListener("click", () => {
    if (sidebar.classList.contains("sidebar-open")) {
        // CLOSING
        sidebar.classList.remove("sidebar-open");
        sidebar.classList.add("sidebar-closed");
        sidebarContent.classList.remove("scrollbar-sidebar-opened");
        sidebarContent.classList.add("scrollbar-sidebar-closed");
        postButton.classList.remove("post-button-sidebar-opened");
        postButton.classList.add("post-button-sidebar-closed");
        tabContent.classList.remove("tab-sidebar-opened");
        tabContent.classList.add("tab-sidebar-closed");
        tabTextElements.forEach((element) => {
            element.classList.remove("tab-text-sidebar-opened");
            element.classList.add("tab-text-sidebar-closed");
        });
    } else {
        // OPENING
        sidebar.classList.remove("sidebar-closed");
        sidebar.classList.add("sidebar-open");
        sidebarContent.classList.remove("scrollbar-sidebar-closed");
        sidebarContent.classList.add("scrollbar-sidebar-opened");
        postButton.classList.remove("post-button-sidebar-closed");
        postButton.classList.add("post-button-sidebar-opened");
        tabContent.classList.remove("tab-sidebar-closed");
        tabContent.classList.add("tab-sidebar-opened");
        tabTextElements.forEach((element) => {
            element.classList.remove("tab-text-sidebar-closed");
            element.classList.add("tab-text-sidebar-opened");
        });
    }
});

// Login Overlay
const loginOverlay = document.getElementById('login-overlay');
const openLoginOverlayButton = document.getElementById('open-login-overlay-button');
const closeLoginOverlayButton = document.getElementById('close-login-overlay-button');

openLoginOverlayButton.addEventListener('click', () => {
    if (loginOverlay.classList.contains('login-overlay-open')) {

        loginOverlay.classList.remove('login-overlay-open');
        loginOverlay.classList.add('login-overlay-closed');
        history.pushState(null, '', '/');
    } else {

    loginOverlay.style.display = 'flex';
    history.pushState(null, '', '/login');

    loginOverlay.classList.remove('login-overlay-closed');
    loginOverlay.classList.add('login-overlay-open');
    }
});

closeLoginOverlayButton.addEventListener('click', () => {
    if (loginOverlay.classList.contains('login-overlay-open')) {

        loginOverlay.classList.remove('login-overlay-open');
        loginOverlay.classList.add('login-overlay-closed');
        history.pushState(null, '', '/');
    } else {

    loginOverlay.style.display = 'flex';
    history.pushState(null, '', '/login');

    loginOverlay.classList.remove('login-overlay-closed');
    loginOverlay.classList.add('login-overlay-open');
    }
});
