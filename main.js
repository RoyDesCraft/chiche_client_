const sidebar = document.getElementById("sidebar");
const sidebarContent = document.querySelector('.sidebar-content');
const postButton = document.getElementById('post-button');
const tabContent = document.getElementById('tab-content');
const tabTextElements = document.querySelectorAll('.tab-text');

// INITIAL STATES

sidebar.classList.add("sidebar-open"); // FIRST STATE
tabTextElements.forEach((element) => {
    element.classList.add("tab-text-sidebar-opened");
});

document.querySelector(".close-sidebar").addEventListener("click", () => {
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
        })
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
        })
    }
});

/* LOGIN OVERLAY */
const loginOverlay = document.getElementById('login-overlay');
loginOverlay.style.display = 'flex';
history.pushState(null, '', '/login');

/* GOOGLE SIGN-IN */
function handleCredentialResponse(response) {
    console.log("ID Token: " + response.credential);
    // Envoie le token à ton backend ici
    // fetch('/auth/google', { method: 'POST', body: JSON.stringify({ token: response.credential }) });
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "375435848419-ud1ao7ot13k81uh48gfvk3rbjo47hdce.apps.googleusercontent.com",
        login_uri: "https://chiche-server.onrender.com/auth/google",
        callback: handleCredentialResponse,
        ux_mode: 'popup',
    });
    // Associe le bouton Google personnalisé
    googleLoginButton.onclick = () => {
        google.accounts.id.prompt();
    };
};