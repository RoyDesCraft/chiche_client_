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
