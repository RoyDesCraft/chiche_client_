// ==================== CONFIGURATION ====================
const API_BASE_URL = 'https://chiche-server.onrender.com';

// ==================== STATE MANAGEMENT ====================
const state = {
    currentUser: null,
    currentTab: 'home',
    posts: [],
    isLoggedIn: false,
    accessToken: null,
    isGuestMode: false
};

// ==================== AUTH TOKEN MANAGEMENT ====================
function getAuthHeaders() {
    if (state.accessToken) {
        return {
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json'
        };
    }
    return {
        'Content-Type': 'application/json'
    };
}

function saveAuthToken(token) {
    state.accessToken = token;
    sessionStorage.setItem('chicheToken', token);
}

function loadAuthToken() {
    const token = sessionStorage.getItem('chicheToken');
    if (token) {
        state.accessToken = token;
        return token;
    }
    return null;
}

function clearAuthToken() {
    state.accessToken = null;
    sessionStorage.removeItem('chicheToken');
}

// ==================== DOM ELEMENTS ====================
const sidebar = document.getElementById("sidebar");
const closeSidebarButton = document.getElementById("close-sidebar");
const logo = document.getElementById("logo");
const mainContent = document.getElementById("main-content");

const loginOverlay = document.getElementById('login-overlay');
const closeLoginButton = document.getElementById('close-login-overlay-button');
const signupView = document.getElementById('signup-view');
const loginView = document.getElementById('login-view');
const showLoginButton = document.getElementById('show-login');
const showSignupButton = document.getElementById('show-signup');

const composerTextarea = document.querySelector('.composer-textarea');
const composerPostButton = document.querySelector('.composer-post-button');
const postsFeed = document.getElementById('posts-feed');

const tabs = document.querySelectorAll('.tab');
const tabPages = document.querySelectorAll('.tab-page');

const openSettingsButton = document.getElementById('open-settings-button');
const saveSettingsButton = document.getElementById('save-settings');
const logoutButton = document.getElementById('logout-button');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadSamplePosts();
    checkAuthStatus();
    createGuestModeToggle();
});

function initializeApp() {
    setupEventListeners();
    setupTabNavigation();
    setupComposer();
    setupCustomTagSelectors();
    setupAuth();
    setupSettings();
}

// ==================== GUEST MODE TOGGLE ====================
function createGuestModeToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'guest-mode-toggle';
    toggle.innerHTML = `
        <label class="guest-toggle-label">
            <input type="checkbox" id="guest-mode-checkbox">
            <span class="guest-toggle-slider"></span>
            <span class="guest-toggle-text">Guest Mode</span>
        </label>
    `;
    document.body.appendChild(toggle);

    const checkbox = document.getElementById('guest-mode-checkbox');
    checkbox.addEventListener('change', toggleGuestMode);
}

function toggleGuestMode() {
    const checkbox = document.getElementById('guest-mode-checkbox');
    state.isGuestMode = checkbox.checked;

    if (state.isGuestMode) {
        const guestUser = {
            email: 'guest@chiche.app',
            name: 'Guest User',
            username: '@guest',
            bio: 'Testing in guest mode'
        };
        loginUser(guestUser);
        showToast('Guest mode activated', 'success');
    } else {
        handleLogout();
        showToast('Guest mode deactivated', 'success');
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    closeSidebarButton.addEventListener("click", toggleSidebar);
    logo.addEventListener('click', () => {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    });
    closeLoginButton.addEventListener('click', closeLoginOverlay);
    loginOverlay.addEventListener('click', (e) => {
        if (e.target === loginOverlay) closeLoginOverlay();
    });
    openSettingsButton.addEventListener('click', () => {
        switchTab('settings');
        closeLoginOverlay();
    });
    logoutButton.addEventListener('click', handleLogout);
}

function toggleSidebar() {
    sidebar.classList.toggle("sidebar-closed");
}

// ==================== TAB NAVIGATION ====================
function setupTabNavigation() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    tabPages.forEach(page => {
        if (page.id === `${tabName}-page`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
    state.currentTab = tabName;
    mainContent.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== COMPOSER ====================
function setupComposer() {
    composerTextarea.addEventListener('input', () => {
        const text = composerTextarea.value.trim();
        composerPostButton.disabled = text.length === 0;
        composerTextarea.style.height = 'auto';
        composerTextarea.style.height = composerTextarea.scrollHeight + 'px';
    });
    composerPostButton.addEventListener('click', handleCreatePost);
    composerTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!composerPostButton.disabled) {
                composerPostButton.click();
            }
        }
    });
}

function handleCreatePost() {
    if (!state.isLoggedIn) {
        openLoginOverlay();
        return;
    }
    const text = composerTextarea.value.trim();
    if (text.length === 0) return;

    const tags = window.getSelectedTags();

    const newPost = {
        id: Date.now(),
        username: state.currentUser?.name || 'User',
        handle: state.currentUser?.username || '@user',
        text: text,
        timestamp: 'Just now',
        likes: 0,
        reposts: 0,
        comments: 0,
        liked: false,
        reposted: false,
        tags: {
            location: tags.location,
            topic: tags.topic,
            type: tags.type
        }
    };

    state.posts.unshift(newPost);
    renderPost(newPost, true);

    composerTextarea.value = '';
    composerTextarea.style.height = 'auto';
    composerPostButton.disabled = true;
    
    window.resetTags();

    showToast('Post created successfully!', 'success');
}

// ==================== POST RENDERING ====================
function renderPost(post, prepend = false) {
    const postElement = createPostElement(post);
    if (prepend) {
        postsFeed.insertBefore(postElement, postsFeed.firstChild);
        postElement.style.opacity = '0';
        postElement.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            postElement.style.transition = 'all 0.3s ease';
            postElement.style.opacity = '1';
            postElement.style.transform = 'translateY(0)';
        }, 10);
    } else {
        postsFeed.appendChild(postElement);
    }
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-container';
    postDiv.setAttribute('data-post-id', post.id);

    let tagsHTML = '';
    if (post.tags) {
        const tagArray = [];
        if (post.tags.location) tagArray.push(`<span class="post-tag">📍 ${post.tags.location}</span>`);
        if (post.tags.topic) tagArray.push(`<span class="post-tag">💬 ${post.tags.topic}</span>`);
        if (post.tags.type) tagArray.push(`<span class="post-tag">🏷️ ${post.tags.type}</span>`);
        if (tagArray.length > 0) {
            tagsHTML = `<div class="post-tags">${tagArray.join('')}</div>`;
        }
    }

    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-profile-picture"></div>
            <div class="post-user-info">
                <div class="post-user-name">${escapeHtml(post.username)}</div>
                <div class="post-user-username">${escapeHtml(post.handle)}</div>
            </div>
            <span class="post-timestamp">${escapeHtml(post.timestamp)}</span>
        </div>
        <div class="post-body">
            <p class="post-text">${escapeHtml(post.text)}</p>
            ${tagsHTML}
        </div>
        <div class="post-actions">
            <div class="post-action-group">
                <button class="post-action ${post.liked ? 'liked' : ''}" data-action="like">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span class="post-action-count">${post.likes}</span>
                </button>
                <button class="post-action ${post.reposted ? 'retweeted' : ''}" data-action="repost">
                    <svg viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>
                    <span class="post-action-count">${post.reposts}</span>
                </button>
                <button class="post-action" data-action="comment">
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                    <span class="post-action-count">${post.comments}</span>
                </button>
            </div>
            <button class="post-action" data-action="share">
                <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
            </button>
        </div>
    `;
    return postDiv;
}

// ==================== POST ACTIONS ====================
document.addEventListener('click', (e) => {
    const actionButton = e.target.closest('.post-action');
    if (!actionButton) return;
    const action = actionButton.getAttribute('data-action');
    const postContainer = actionButton.closest('.post-container');
    const postId = parseInt(postContainer.getAttribute('data-post-id'));
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    switch (action) {
        case 'like':
            handleLike(actionButton, post);
            break;
        case 'repost':
            handleRepost(actionButton, post);
            break;
        case 'comment':
            handleComment(post);
            break;
        case 'share':
            handleShare(post);
            break;
    }
});

function handleLike(button, post) {
    if (!state.isLoggedIn) {
        openLoginOverlay();
        return;
    }
    const countElement = button.querySelector('.post-action-count');
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    button.classList.toggle('liked', post.liked);
    countElement.textContent = post.likes;
    if (post.liked) {
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
}

function handleRepost(button, post) {
    if (!state.isLoggedIn) {
        openLoginOverlay();
        return;
    }
    const countElement = button.querySelector('.post-action-count');
    post.reposted = !post.reposted;
    post.reposts += post.reposted ? 1 : -1;
    button.classList.toggle('retweeted', post.reposted);
    countElement.textContent = post.reposts;
    if (post.reposted) {
        button.style.transform = 'rotate(180deg) scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'rotate(0deg) scale(1)';
        }, 300);
    }
}

function handleComment(post) {
    if (!state.isLoggedIn) {
        openLoginOverlay();
        return;
    }
    showToast('Comments coming soon!', 'success');
}

function handleShare(post) {
    if (navigator.share) {
        navigator.share({
            title: 'Chiche Post',
            text: post.text,
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href)
            .then(() => showToast('Link copied to clipboard!', 'success'))
            .catch(() => showToast('Failed to copy link', 'error'));
    }
}

// ==================== AUTHENTICATION ====================
function setupAuth() {
    showLoginButton.addEventListener('click', () => {
        signupView.classList.add('hidden');
        loginView.classList.remove('hidden');
    });
    showSignupButton.addEventListener('click', () => {
        loginView.classList.add('hidden');
        signupView.classList.remove('hidden');
    });
    document.getElementById('email-signup-button').addEventListener('click', handleEmailSignup);
    document.getElementById('email-login-button').addEventListener('click', handleEmailLogin);
    document.getElementById('google-signup-button').addEventListener('click', initiateGoogleAuth);
    document.getElementById('google-login-button').addEventListener('click', initiateGoogleAuth);
}

async function handleEmailSignup() {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value.trim();
    const username = document.getElementById('signup-username').value.trim();

    if (!email || !password || !name || !username) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/new_account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                email: email
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Signup failed');
        }

        showToast('Account created successfully! Please log in.', 'success');
        
        setTimeout(() => {
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').value = password;
            signupView.classList.add('hidden');
            loginView.classList.remove('hidden');
        }, 1000);

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleEmailLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        const username = email.includes('@') ? email.split('@')[0] : email;

        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        saveAuthToken(data.access_token);

        const user = {
            email: email,
            name: username,
            username: `@${username}`,
            bio: 'Welcome to Chiche!'
        };

        loginUser(user);
        showToast('Logged in successfully!', 'success');

    } catch (error) {
        showToast(error.message, 'error');
    }
}

function initiateGoogleAuth() {
    showToast('Google authentication: Click the button below', 'success');
}

window.handleGoogleSignIn = async function(response) {
    try {
        const googleToken = response.credential;
        
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: googleToken
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || 'Google sign-in failed');
        }

        saveAuthToken(data.access_token);

        const payload = JSON.parse(atob(googleToken.split('.')[1]));
        const user = {
            email: payload.email,
            name: payload.name,
            username: `@${payload.email.split('@')[0]}`,
            bio: 'Signed up with Google',
            picture: payload.picture
        };

        loginUser(user);
        showToast('Logged in with Google successfully!', 'success');

    } catch (error) {
        showToast('Google sign-in failed: ' + error.message, 'error');
    }
};

function loginUser(user) {
    state.currentUser = user;
    state.isLoggedIn = true;
    
    document.getElementById('account-name').textContent = user.name;
    document.getElementById('account-username').textContent = user.username;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-username-display').textContent = user.username;
    document.getElementById('profile-bio').textContent = user.bio;
    
    document.getElementById('settings-name').value = user.name;
    document.getElementById('settings-username').value = user.username.replace('@', '');
    document.getElementById('settings-bio').value = user.bio;
    document.getElementById('settings-email').value = user.email;

    if (!state.isGuestMode) {
        localStorage.setItem('chicheUser', JSON.stringify(user));
    }

    closeLoginOverlay();
}

function handleLogout() {
    state.currentUser = null;
    state.isLoggedIn = false;
    state.isGuestMode = false;
    clearAuthToken();
    
    document.getElementById('account-name').textContent = 'Guest';
    document.getElementById('account-username').textContent = '@guest';
    
    localStorage.removeItem('chicheUser');
    
    const checkbox = document.getElementById('guest-mode-checkbox');
    if (checkbox) checkbox.checked = false;
    
    showToast('Logged out successfully', 'success');
    switchTab('home');
}

function checkAuthStatus() {
    const savedUser = localStorage.getItem('chicheUser');
    const savedToken = loadAuthToken();
    
    if (savedUser && savedToken) {
        try {
            const user = JSON.parse(savedUser);
            loginUser(user);
        } catch (error) {
            console.error('Failed to restore user session');
            clearAuthToken();
            localStorage.removeItem('chicheUser');
        }
    }
}

function openLoginOverlay() {
    loginOverlay.classList.add('login-overlay-open');
    signupView.classList.remove('hidden');
    loginView.classList.add('hidden');
}

function closeLoginOverlay() {
    loginOverlay.classList.remove('login-overlay-open');
}

// ==================== SETTINGS ====================
function setupSettings() {
    saveSettingsButton.addEventListener('click', handleSaveSettings);
}

async function handleSaveSettings() {
    if (!state.isLoggedIn) {
        showToast('Please log in first', 'error');
        return;
    }

    const name = document.getElementById('settings-name').value.trim();
    const username = document.getElementById('settings-username').value.trim();
    const bio = document.getElementById('settings-bio').value.trim();
    const email = document.getElementById('settings-email').value.trim();

    if (!name || !username || !email) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    state.currentUser.name = name;
    state.currentUser.username = `@${username}`;
    state.currentUser.bio = bio;
    state.currentUser.email = email;

    document.getElementById('account-name').textContent = name;
    document.getElementById('account-username').textContent = `@${username}`;
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-username-display').textContent = `@${username}`;
    document.getElementById('profile-bio').textContent = bio;

    if (!state.isGuestMode) {
        localStorage.setItem('chicheUser', JSON.stringify(state.currentUser));
    }

    showToast('Settings saved successfully!', 'success');
}

// ==================== SEARCH ====================
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
}

function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
        searchResults.innerHTML = `
            <div class="empty-state">
                <h2>Search for posts, users, or topics</h2>
                <p>Find what's happening now</p>
            </div>
        `;
        return;
    }

    const results = state.posts.filter(post => 
        post.text.toLowerCase().includes(query) ||
        post.username.toLowerCase().includes(query) ||
        post.handle.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="empty-state">
                <h2>No results found</h2>
                <p>Try searching for something else</p>
            </div>
        `;
        return;
    }

    searchResults.innerHTML = '';
    results.forEach(post => {
        const postElement = createPostElement(post);
        searchResults.appendChild(postElement);
    });
}

// ==================== SAMPLE DATA ====================
function loadSamplePosts() {
    const samplePosts = [
        {
            id: 1,
            username: 'Sarah Chen',
            handle: '@sarahchen',
            text: 'Just discovered this amazing platform! The design is so clean and intuitive. Can\'t wait to see where this goes! 🚀',
            timestamp: '2h ago',
            likes: 128,
            reposts: 34,
            comments: 19,
            liked: true,
            reposted: false,
            tags: { location: 'paris', topic: 'tech', type: 'discussion' }
        },
        {
            id: 2,
            username: 'Alex Rivera',
            handle: '@alexr',
            text: 'Quick question for the community: What\'s your favorite feature so far? The sidebar animation is absolutely gorgeous! 👌',
            timestamp: '5h ago',
            likes: 89,
            reposts: 21,
            comments: 45,
            liked: false,
            reposted: true,
            tags: { topic: 'tech', type: 'question' }
        },
        {
            id: 3,
            username: 'Maya Patel',
            handle: '@mayapatel',
            text: 'The attention to detail here is incredible. From the smooth animations to the thoughtful color palette - everything just works. Props to the team! 💯',
            timestamp: '12h ago',
            likes: 203,
            reposts: 56,
            comments: 32,
            liked: false,
            reposted: false,
            tags: { location: 'london', topic: 'tech', type: 'announcement' }
        },
        {
            id: 4,
            username: 'Jordan Kim',
            handle: '@jordank',
            text: 'Anyone else spending way too much time customizing their profile? This platform makes it so fun! 😄',
            timestamp: '1d ago',
            likes: 67,
            reposts: 12,
            comments: 28,
            liked: false,
            reposted: false,
            tags: { type: 'discussion' }
        }
    ];

    state.posts = samplePosts;
    samplePosts.forEach(post => renderPost(post));
}

// ==================== UTILITIES ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ==================== CUSTOM TAG SELECTORS ====================
function setupCustomTagSelectors() {
    const selectedTags = {
        location: "",
        topic: "",
        type: ""
    };

    const selectorButtons = document.querySelectorAll('.tag-selector-button');

    selectorButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectorName = button.dataset.selector;
            const optionsDiv = document.querySelector(`[data-options="${selectorName}"]`);
            
            document.querySelectorAll('.tag-options').forEach(opt => {
                if (opt !== optionsDiv) {
                    opt.classList.remove('open');
                }
            });
            document.querySelectorAll('.tag-selector-button').forEach(btn => {
                if (btn !== button) {
                    btn.classList.remove('open');
                }
            });
            
            optionsDiv.classList.toggle('open');
            button.classList.toggle('open');
        });
    });

    document.querySelectorAll('.tag-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;
            const optionsDiv = option.closest('.tag-options');
            const selectorName = optionsDiv.dataset.options;
            const button = document.querySelector(`[data-selector="${selectorName}"]`);
            const selectedValueSpan = button.querySelector('.selected-value');
            
            selectedTags[selectorName] = value;
            
            if (value === "") {
                selectedValueSpan.textContent = `Select ${selectorName}...`;
                button.classList.remove('active');
            } else {
                selectedValueSpan.textContent = option.textContent;
                button.classList.add('active');
            }
            
            optionsDiv.querySelectorAll('.tag-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            
            optionsDiv.classList.remove('open');
            button.classList.remove('open');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.tag-options').forEach(opt => {
            opt.classList.remove('open');
        });
        document.querySelectorAll('.tag-selector-button').forEach(btn => {
            btn.classList.remove('open');
        });
    });

    window.getSelectedTags = function() {
        return selectedTags;
    };

    window.resetTags = function() {
        selectedTags.location = "";
        selectedTags.topic = "";
        selectedTags.type = "";
        
        document.querySelectorAll('.tag-selector-button').forEach(btn => {
            const selectorName = btn.dataset.selector;
            const selectedValueSpan = btn.querySelector('.selected-value');
            selectedValueSpan.textContent = `Select ${selectorName}...`;
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tag-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.classList.contains('no-selection')) {
                opt.classList.add('selected');
            }
        });
    };
}