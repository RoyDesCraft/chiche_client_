document.querySelector('.close-sidebar').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('sidebar-closed');
    document.getElementById('post-button').classList.toggle('post-button-sidebar-closed');
});
