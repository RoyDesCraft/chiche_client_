// ==================== CONFIGURATION ====================
const API_BASE_URL = 'https://chiche-server.onrender.com';

// ==================== STATE MANAGEMENT ====================
const state = {
    currentUser: null,
    currentTab: 'home',
    posts: [],
    isLoggedIn: false,
    accessToken: null,
    isGuestMode: false,
    currentPostView: null,
    users: [],
    searchFilter: 'all'
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
const editProfileButton = document.getElementById('edit-profile-button');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadSamplePosts();
    loadSampleUsers();
    checkAuthStatus();
    createGuestModeToggle();
    handleRouting();
    window.addEventListener('popstate', handleRouting);
});

function initializeApp() {
    setupEventListeners();
    setupTabNavigation();
    setupComposer();
    setupCustomTagSelectors();
    setupAuth();
    setupSettings();
    setupProfileTabs();
    setupSearchFilters();
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

// ==================== ROUTING ====================
function handleRouting() {
    const path = window.location.pathname;
    
    if (path.startsWith('/post/')) {
        const postId = parseInt(path.split('/')[2]);
        showPostDetail(postId);
    } else if (path.startsWith('/user/')) {
        const username = path.split('/')[2].replace('@', '');
        showUserProfile(username);
    } else if (path === '/home' || path === '/') {
        switchTab('home');
    } else if (path === '/search') {
        switchTab('search');
    } else if (path === '/notifications') {
        switchTab('notifications');
    } else if (path === '/messages') {
        switchTab('messages');
    } else if (path === '/profile') {
        switchTab('profile');
    } else if (path === '/settings') {
        switchTab('settings');
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    closeSidebarButton.addEventListener("click", toggleSidebar);
    logo.addEventListener('click', () => {
        switchTab('home');
        if (window.location.protocol !== 'file:') {
            history.pushState({ tab: 'home' }, '', '/home');
        }
    });
    closeLoginButton.addEventListener('click', closeLoginOverlay);
    loginOverlay.addEventListener('click', (e) => {
        if (e.target === loginOverlay) closeLoginOverlay();
    });
    openSettingsButton.addEventListener('click', () => {
        switchTab('settings');
        if (window.location.protocol !== 'file:') {
            history.pushState({ tab: 'settings' }, '', '/settings');
        }
        closeLoginOverlay();
    });
    editProfileButton.addEventListener('click', () => {
        switchTab('settings');
        if (window.location.protocol !== 'file:') {
            history.pushState({ tab: 'settings'}, '', '/settings')
        }});
    
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
            if (window.location.protocol !== 'file:') {
                history.pushState({ tab: tabName }, '', `/${tabName}`);
            }
        });
    });
}

function switchTab(tabName) {
    // Remove any dynamic views
    const postDetailView = document.getElementById('post-detail-view');
    const userProfileView = document.getElementById('user-profile-view');
    if (postDetailView) postDetailView.remove();
    if (userProfileView) userProfileView.remove();
    
    state.currentPostView = null;
    
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

// ==================== PROFILE TABS ====================
function setupProfileTabs() {
    const profileTabs = document.querySelectorAll('.profile-tab');
    profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            profileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabType = tab.dataset.profileTab;
            updateProfileContent(tabType);
        });
    });
}

function updateProfileContent(tabType) {
    const postsList = document.getElementById('profile-posts-list');
    if (!postsList) return;
    
    const userPosts = state.posts.filter(p => p.handle === state.currentUser?.username);
    
    postsList.innerHTML = '';
    
    if (tabType === 'posts') {
        if (userPosts.length === 0) {
            postsList.innerHTML = '<div class="empty-state"><h2>No posts yet</h2><p>Start sharing your thoughts!</p></div>';
        } else {
            userPosts.forEach(post => {
                const postElement = createPostElement(post);
                postsList.appendChild(postElement);
            });
        }
    } else if (tabType === 'reposts') {
        const reposts = userPosts.filter(p => p.reposted);
        if (reposts.length === 0) {
            postsList.innerHTML = '<div class="empty-state"><h2>No reposts yet</h2><p>Repost content you like!</p></div>';
        } else {
            reposts.forEach(post => {
                const postElement = createPostElement(post);
                postsList.appendChild(postElement);
            });
        }
    } else if (tabType === 'votes') {
        const votedPosts = state.posts.filter(p => 
            p.poll && p.poll.options.some(opt => opt.voters.includes(state.currentUser?.username))
        );
        if (votedPosts.length === 0) {
            postsList.innerHTML = '<div class="empty-state"><h2>No votes yet</h2><p>Vote on polls to see them here!</p></div>';
        } else {
            votedPosts.forEach(post => {
                const postElement = createPostElement(post);
                postsList.appendChild(postElement);
            });
        }
    }
}

// ==================== SEARCH FILTERS ====================
function setupSearchFilters() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Create filter buttons
    const searchHeader = document.querySelector('.search-header');
    if (searchHeader) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'search-filters';
        filterContainer.innerHTML = `
            <button class="search-filter-btn active" data-filter="all">All</button>
            <button class="search-filter-btn" data-filter="users">Users</button>
            <button class="search-filter-btn" data-filter="location">Location</button>
            <button class="search-filter-btn" data-filter="topic">Topic</button>
            <button class="search-filter-btn" data-filter="type">Type</button>
        `;
        searchHeader.appendChild(filterContainer);
        
        const filterBtns = filterContainer.querySelectorAll('.search-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.searchFilter = btn.dataset.filter;
                handleSearch({ target: searchInput });
            });
        });
    }
}

function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    const searchResults = document.getElementById('search-results');
    
    if (query.length === 0) {
        searchResults.innerHTML = `
            <div class="empty-state">
                <h2>Search for posts, users, or topics</h2>
                <p>Find what's happening now</p>
            </div>
        `;
        return;
    }

    let results = [];
    
    if (state.searchFilter === 'all' || state.searchFilter === 'users') {
        const userResults = state.users.filter(user =>
            user.name.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query)
        );
        
        if (userResults.length > 0 && state.searchFilter !== 'location' && state.searchFilter !== 'topic' && state.searchFilter !== 'type') {
            searchResults.innerHTML = '<h3 class="search-section-title">Users</h3>';
            userResults.forEach(user => {
                const userCard = document.createElement('div');
                userCard.className = 'user-search-result';
                userCard.innerHTML = `
                    <div class="user-result-pic"></div>
                    <div class="user-result-info">
                        <div class="user-result-name">${escapeHtml(user.name)}</div>
                        <div class="user-result-username">${escapeHtml(user.username)}</div>
                        <div class="user-result-bio">${escapeHtml(user.bio)}</div>
                    </div>
                `;
                userCard.addEventListener('click', () => navigateToProfile(user.username));
                searchResults.appendChild(userCard);
            });
        }
    }
    
    if (state.searchFilter !== 'users') {
        const postResults = state.posts.filter(post => {
            if (state.searchFilter === 'all') {
                return post.text.toLowerCase().includes(query) ||
                       post.username.toLowerCase().includes(query) ||
                       post.handle.toLowerCase().includes(query);
            } else if (state.searchFilter === 'location') {
                return post.tags?.location?.toLowerCase().includes(query);
            } else if (state.searchFilter === 'topic') {
                return post.tags?.topic?.toLowerCase().includes(query);
            } else if (state.searchFilter === 'type') {
                return post.tags?.type?.toLowerCase().includes(query);
            }
            return false;
        });

        if (postResults.length === 0 && (state.searchFilter === 'users' ? false : true)) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-state';
            emptyMsg.innerHTML = `
                <h2>No results found</h2>
                <p>Try searching for something else</p>
            `;
            searchResults.appendChild(emptyMsg);
            return;
        }
        
        if (postResults.length > 0) {
            if (state.searchFilter !== 'all') {
                const titleDiv = document.createElement('h3');
                titleDiv.className = 'search-section-title';
                titleDiv.textContent = 'Posts';
                searchResults.appendChild(titleDiv);
            }
            
            postResults.forEach(post => {
                const postElement = createPostElement(post);
                searchResults.appendChild(postElement);
            });
        }
    }
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
    
    // Setup poll options visibility
    document.querySelectorAll('.tag-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const value = e.target.dataset.value;
            const parentOptions = e.target.closest('.tag-options');
            if (parentOptions && parentOptions.dataset.options === 'type') {
                const pollOptions = document.getElementById('poll-options');
                if (pollOptions) {
                    if (value === 'poll') {
                        pollOptions.style.display = 'block';
                    } else {
                        pollOptions.style.display = 'none';
                    }
                }
            }
        });
    });
    
    // Add poll option button
    const addPollOptionBtn = document.getElementById('add-poll-option');
    if (addPollOptionBtn) {
        addPollOptionBtn.addEventListener('click', addPollOption);
    }
}

function addPollOption() {
    const container = document.getElementById('poll-options-list');
    const optionCount = container.children.length;
    
    if (optionCount >= 4) {
        showToast('Maximum 4 options allowed', 'error');
        return;
    }
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'poll-option-input-wrapper';
    optionDiv.innerHTML = `
        <input type="text" class="poll-option-input" placeholder="Option ${optionCount + 1}" maxlength="50">
        <button class="remove-poll-option" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(optionDiv);
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
        },
        commentsList: []
    };
    
    // Handle poll if type is poll
    if (tags.type === 'poll') {
        const pollInputs = document.querySelectorAll('.poll-option-input');
        const options = [];
        pollInputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                options.push({
                    text: value,
                    votes: 0,
                    voters: []
                });
            }
        });
        
        if (options.length < 2) {
            showToast('Poll needs at least 2 options', 'error');
            return;
        }
        
        newPost.poll = {
            options: options,
            totalVotes: 0
        };
    }

    state.posts.unshift(newPost);
    renderPost(newPost, true);

    composerTextarea.value = '';
    composerTextarea.style.height = 'auto';
    composerPostButton.disabled = true;
    
    // Reset poll options
    const pollOptionsDiv = document.getElementById('poll-options');
    if (pollOptionsDiv) {
        pollOptionsDiv.style.display = 'none';
        const optionsList = document.getElementById('poll-options-list');
        optionsList.innerHTML = `
            <div class="poll-option-input-wrapper">
                <input type="text" class="poll-option-input" placeholder="Option 1" maxlength="50">
            </div>
            <div class="poll-option-input-wrapper">
                <input type="text" class="poll-option-input" placeholder="Option 2" maxlength="50">
            </div>
        `;
    }
    
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
    
    // Poll HTML if it's a poll
    let pollHTML = '';
    if (post.poll) {
        const hasVoted = state.currentUser && post.poll.options.some(opt => 
            opt.voters.includes(state.currentUser.username)
        );
        
        pollHTML = '<div class="poll-container">';
        post.poll.options.forEach((option, index) => {
            const percentage = post.poll.totalVotes > 0 
                ? Math.round((option.votes / post.poll.totalVotes) * 100) 
                : 0;
            
            if (hasVoted || !state.isLoggedIn) {
                pollHTML += `
                    <div class="poll-option-result">
                        <div class="poll-option-bar" style="width: ${percentage}%"></div>
                        <div class="poll-option-content">
                            <span class="poll-option-text">${escapeHtml(option.text)}</span>
                            <span class="poll-option-percentage">${percentage}%</span>
                        </div>
                    </div>
                `;
            } else {
                pollHTML += `
                    <button class="poll-option-button" data-option-index="${index}">
                        ${escapeHtml(option.text)}
                    </button>
                `;
            }
        });
        pollHTML += `<div class="poll-votes-count">${post.poll.totalVotes} vote${post.poll.totalVotes !== 1 ? 's' : ''}</div>`;
        pollHTML += '</div>';
    }

    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-profile-picture" data-username="${escapeHtml(post.handle)}"></div>
            <div class="post-user-info">
                <div class="post-user-name" data-username="${escapeHtml(post.handle)}">${escapeHtml(post.username)}</div>
                <div class="post-user-username">${escapeHtml(post.handle)}</div>
            </div>
            <span class="post-timestamp">${escapeHtml(post.timestamp)}</span>
        </div>
        <div class="post-body" data-post-id="${post.id}">
            <p class="post-text">${escapeHtml(post.text)}</p>
            ${pollHTML}
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
    
    // Add click event for profile pictures and usernames
    const profilePic = postDiv.querySelector('.post-profile-picture');
    const userName = postDiv.querySelector('.post-user-name');
    
    profilePic.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToProfile(post.handle);
    });
    
    userName.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToProfile(post.handle);
    });
    
    // Add click event for post body to show detail
    const postBody = postDiv.querySelector('.post-body');
    postBody.addEventListener('click', (e) => {
        if (!e.target.closest('.poll-option-button')) {
            e.preventDefault();
            showPostDetail(post.id);
        }
    });
    
    // Setup poll voting if present
    if (post.poll) {
        const pollButtons = postDiv.querySelectorAll('.poll-option-button');
        pollButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePollVote(post.id, parseInt(button.dataset.optionIndex));
            });
        });
    }
    
    return postDiv;
}

function handlePollVote(postId, optionIndex) {
    if (!state.isLoggedIn) {
        openLoginOverlay();
        return;
    }
    
    const post = state.posts.find(p => p.id === postId);
    if (!post || !post.poll) return;
    
    // Check if already voted
    const hasVoted = post.poll.options.some(opt => 
        opt.voters.includes(state.currentUser.username)
    );
    
    if (hasVoted) {
        showToast('You have already voted', 'error');
        return;
    }
    
    // Add vote
    post.poll.options[optionIndex].votes++;
    post.poll.options[optionIndex].voters.push(state.currentUser.username);
    post.poll.totalVotes++;
    
    // Re-render the post
    const postContainer = document.querySelector(`[data-post-id="${postId}"]`);
    if (postContainer) {
        const newPostElement = createPostElement(post);
        postContainer.replaceWith(newPostElement);
    }
    
    showToast('Vote recorded!', 'success');
}

function navigateToProfile(username) {
    const cleanUsername = username.replace('@', '');
    if (window.location.protocol !== 'file:') {
        history.pushState({ user: cleanUsername }, '', `/user/@${cleanUsername}`);
    }
    showUserProfile(cleanUsername);
}

function showPostDetail(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;
    
    state.currentPostView = postId;
    if (window.location.protocol !== 'file:') {
        history.pushState({ post: postId }, '', `/post/${postId}`);
    }    
    // Hide all tab pages
    tabPages.forEach(page => page.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Create and show post detail view
    const postDetailContainer = document.createElement('div');
    postDetailContainer.id = 'post-detail-view';
    postDetailContainer.className = 'feed-container tab-page active';
    
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '← Back';
    backButton.addEventListener('click', () => {
        history.back();
    });
    
    const postElement = createPostElement(post);
    postElement.style.marginBottom = '0';
    
    // Show comments section by default
    const commentsSection = createCommentsSection(post);
    commentsSection.classList.add('open');
    commentsSection.style.display = 'block';
    
    postDetailContainer.appendChild(backButton);
    postDetailContainer.appendChild(postElement);
    postElement.appendChild(commentsSection);
    
    const existingDetail = document.getElementById('post-detail-view');
    if (existingDetail) {
        existingDetail.remove();
    }
    
    mainContent.appendChild(postDetailContainer);
    mainContent.scrollTo({ top: 0, behavior: 'smooth' });
}

function showUserProfile(username) {
    const cleanUsername = username.replace('@', '');
    const user = state.users.find(u => u.username.replace('@', '') === cleanUsername);
    
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    // Hide all tab pages
    tabPages.forEach(page => page.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Create user profile view
    const userProfileContainer = document.createElement('div');
    userProfileContainer.id = 'user-profile-view';
    userProfileContainer.className = 'feed-container tab-page active';
    
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '← Back';
    backButton.addEventListener('click', () => {
        history.back();
    });
    
    const userPosts = state.posts.filter(p => p.handle === user.username);
    
    userProfileContainer.innerHTML = `
        <div class="profile-header">
            <div class="profile-banner"></div>
            <div class="profile-info">
                <div class="profile-picture-large"></div>
                <div class="profile-details">
                    <h1 class="profile-name">${escapeHtml(user.name)}</h1>
                    <p class="profile-username">${escapeHtml(user.username)}</p>
                    <p class="profile-bio">${escapeHtml(user.bio)}</p>
                    <div class="profile-stats">
                        <span><strong>${userPosts.length}</strong> Posts</span>
                        <span><strong>${user.followers || 0}</strong> Followers</span>
                        <span><strong>${user.following || 0}</strong> Following</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="profile-content">
            <div class="profile-posts-list" id="user-profile-posts-list"></div>
        </div>
    `;
    
    userProfileContainer.insertBefore(backButton, userProfileContainer.firstChild);
    
    const existingProfile = document.getElementById('user-profile-view');
    if (existingProfile) {
        existingProfile.remove();
    }
    
    mainContent.appendChild(userProfileContainer);
    
    // Render user posts
    const postsList = document.getElementById('user-profile-posts-list');
    if (userPosts.length === 0) {
        postsList.innerHTML = `
            <div class="empty-state">
                <h2>No posts yet</h2>
                <p>This user hasn't shared anything</p>
            </div>
        `;
    } else {
        userPosts.forEach(post => {
            const postElement = createPostElement(post);
            postsList.appendChild(postElement);
        });
    }
    
    mainContent.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    const postContainer = document.querySelector(`[data-post-id="${post.id}"]`);
    let commentsSection = postContainer.querySelector('.comments-section');
    
    if (commentsSection) {
        // Toggle comments section
        if (commentsSection.style.display === 'none') {
            commentsSection.style.display = 'block';
            setTimeout(() => commentsSection.classList.add('open'), 10);
        } else {
            commentsSection.classList.remove('open');
            setTimeout(() => commentsSection.style.display = 'none', 300);
        }
    } else {
        // Create comments section
        commentsSection = createCommentsSection(post);
        postContainer.querySelector('.post-actions').insertAdjacentElement('afterend', commentsSection);
        setTimeout(() => commentsSection.classList.add('open'), 10);
    }
}

function createCommentsSection(post) {
    const section = document.createElement('div');
    section.className = 'comments-section';
    
    if (!post.commentsList) {
        post.commentsList = [];
    }
    
    const commentsHTML = post.commentsList.map(comment => `
        <div class="comment-item">
            <div class="comment-profile-pic" data-username="${escapeHtml(comment.handle || '@user')}"></div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-username" data-username="${escapeHtml(comment.handle || '@user')}">${escapeHtml(comment.username)}</span>
                    <span class="comment-time">${escapeHtml(comment.timestamp)}</span>
                </div>
                <p class="comment-text">${escapeHtml(comment.text)}</p>
                <div class="comment-actions">
                    <button class="comment-like-btn ${comment.liked ? 'liked' : ''}" data-comment-id="${comment.id}">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        <span class="comment-like-count">${comment.likes || 0}</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    section.innerHTML = `
        <div class="comments-list">${commentsHTML || '<p class="no-comments">No comments yet. Be the first!</p>'}</div>
        <div class="comment-composer">
            <div class="comment-input-wrapper">
                <div class="comment-composer-pic profile-picture"></div>
                <input type="text" class="comment-input" placeholder="Write a comment..." maxlength="280">
                <button class="comment-send-btn">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        </div>
    `;
    
    // Add click events for comment profile pics and usernames
    section.querySelectorAll('.comment-profile-pic, .comment-username').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const username = el.dataset.username;
            if (username) {
                navigateToProfile(username);
            }
        });
    });
    
    // Add comment like functionality
    section.querySelectorAll('.comment-like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!state.isLoggedIn) {
                openLoginOverlay();
                return;
            }
            const commentId = parseInt(btn.dataset.commentId);
            const comment = post.commentsList.find(c => c.id === commentId);
            if (comment) {
                comment.liked = !comment.liked;
                comment.likes = (comment.likes || 0) + (comment.liked ? 1 : -1);
                btn.classList.toggle('liked', comment.liked);
                btn.querySelector('.comment-like-count').textContent = comment.likes;
            }
        });
    });
    
    const input = section.querySelector('.comment-input');
    const sendBtn = section.querySelector('.comment-send-btn');
    
    const submitComment = () => {
        const text = input.value.trim();
        if (text.length === 0) return;
        
        const newComment = {
            id: Date.now(),
            username: state.currentUser?.name || 'User',
            handle: state.currentUser?.username || '@user',
            text: text,
            timestamp: 'Just now',
            likes: 0,
            liked: false
        };
        
        post.commentsList.push(newComment);
        post.comments++;
        
        // Update comment count in UI
        const postContainer = document.querySelector(`[data-post-id="${post.id}"]`);
        const commentButton = postContainer.querySelector('[data-action="comment"]');
        const countElement = commentButton.querySelector('.post-action-count');
        countElement.textContent = post.comments;
        
        // Add comment to list
        const commentsList = section.querySelector('.comments-list');
        const noCommentsMsg = commentsList.querySelector('.no-comments');
        if (noCommentsMsg) noCommentsMsg.remove();
        
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        commentElement.innerHTML = `
            <div class="comment-profile-pic" data-username="${escapeHtml(newComment.handle)}"></div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-username" data-username="${escapeHtml(newComment.handle)}">${escapeHtml(newComment.username)}</span>
                    <span class="comment-time">${escapeHtml(newComment.timestamp)}</span>
                </div>
                <p class="comment-text">${escapeHtml(newComment.text)}</p>
                <div class="comment-actions">
                    <button class="comment-like-btn" data-comment-id="${newComment.id}">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        <span class="comment-like-count">0</span>
                    </button>
                </div>
            </div>
        `;
        
        // Add click events
        commentElement.querySelectorAll('.comment-profile-pic, .comment-username').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateToProfile(newComment.handle);
            });
        });
        
        commentElement.querySelector('.comment-like-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!state.isLoggedIn) {
                openLoginOverlay();
                return;
            }
            newComment.liked = !newComment.liked;
            newComment.likes = (newComment.likes || 0) + (newComment.liked ? 1 : -1);
            const btn = e.currentTarget;
            btn.classList.toggle('liked', newComment.liked);
            btn.querySelector('.comment-like-count').textContent = newComment.likes;
        });
        
        commentsList.appendChild(commentElement);
        
        // Animate new comment
        commentElement.style.opacity = '0';
        commentElement.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            commentElement.style.transition = 'all 0.3s ease';
            commentElement.style.opacity = '1';
            commentElement.style.transform = 'translateY(0)';
        }, 10);
        
        input.value = '';
        showToast('Comment added!', 'success');
    };
    
    sendBtn.addEventListener('click', submitComment);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitComment();
        }
    });
    
    return section;
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
                email: email,
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
            tags: { location: 'paris', topic: 'tech', type: 'discussion' },
            commentsList: []
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
            tags: { topic: 'tech', type: 'question' },
            commentsList: []
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
            tags: { location: 'london', topic: 'tech', type: 'announcement' },
            commentsList: []
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
            tags: { type: 'discussion' },
            commentsList: []
        }
    ];

    state.posts = samplePosts;
    samplePosts.forEach(post => renderPost(post));
}

function loadSampleUsers() {
    state.users = [
        {
            name: 'Sarah Chen',
            username: '@sarahchen',
            bio: 'Tech enthusiast | Designer | Coffee addict ☕',
            followers: 1234,
            following: 567
        },
        {
            name: 'Alex Rivera',
            username: '@alexr',
            bio: 'Developer & UX Designer | Building cool stuff',
            followers: 892,
            following: 421
        },
        {
            name: 'Maya Patel',
            username: '@mayapatel',
            bio: 'Product Manager | Tech lover | Always learning',
            followers: 2104,
            following: 789
        },
        {
            name: 'Jordan Kim',
            username: '@jordank',
            bio: 'Freelance Developer | Open Source Contributor',
            followers: 456,
            following: 234
        }
    ];
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

// ==================== FEATHER EXPLOSION EFFECT ====================
function createFeatherExplosion(x, y) {
    const featherCount = 8;
    const colors = ['#004cffff', '#ffdd00ff', '#00ff51ff', '#ff00f2ff'];
    const images = [
        'icons/ChicheLogo.svg',
        'icons/ChicheLogo.svg',      
    ]
    
    for (let i = 0; i < featherCount; i++) {
        const feather = document.createElement('div');
        feather.className = 'feather';
        feather.style.left = x + 'px';
        feather.style.top = y + 'px';
        
        // Random color
        feather.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        feather.style.width, feather.style.height = (15 + Math.random() * 10) + 'px';

        const img = images[Math.floor(Math.random() * images.length)];
        feather.style.backgroundImage = `url(${img})`;
        feather.style.backgroundSize = 'contain';
        feather.style.backgroundRepeat = 'no-repeat';
        feather.style.backgroundPosition = 'center';
        
        // Random angle for explosion
        const angle = (Math.PI * 2 * i) / featherCount;
        const velocity = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        // Random rotation
        const rotation = Math.random() * 720 - 360;
        
        feather.style.setProperty('--tx', tx + 'px');
        feather.style.setProperty('--ty', ty + 'px');
        feather.style.setProperty('--rotation', rotation + 'deg');
        
        document.body.appendChild(feather);
        
        // Remove after animation
        setTimeout(() => {
            feather.remove();
        }, 1000);
    }
}

// Add click listener to body
document.body.addEventListener('click', (e) => {
    createFeatherExplosion(e.clientX, e.clientY);
});