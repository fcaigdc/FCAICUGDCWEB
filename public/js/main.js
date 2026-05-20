// Reusable toast system
function getToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function toastIcon(type) {
    const icons = {
        success: '✔',
        error: '⚠',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

function showToast(message, type = 'info') {
    const container = getToastContainer();
    const existingToasts = container.querySelectorAll('.toast');
    if (existingToasts.length >= 3) {
        existingToasts[0].remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${toastIcon(type)}</span>
        <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-enter');
    });

    const removeToast = () => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        toast.style.pointerEvents = 'none';
    };

    const handleAnimationEnd = (event) => {
        if (event.animationName === 'toastExit') {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }
    };

    toast.addEventListener('animationend', handleAnimationEnd);
    setTimeout(removeToast, 3700);
    return toast;
}

window.showToast = showToast;

// Shared Rating System Logic
window.renderStars = function (userRating, avgRating, itemId, itemType) {
    // Interactive stars for user rating input (rendered in reverse DOM order for CSS sibling hover)
    let starsHTML = `<div class="stars interactive" data-id="${itemId}" data-type="${itemType}">`;

    const rating = userRating || 0;

    for (let i = 5; i >= 1; i--) {
        const isFull = rating >= i;
        const isHalf = !isFull && rating >= i - 0.5;
        const starClass = isFull ? 'fas fa-star' : (isHalf ? 'fas fa-star-half-alt' : 'far fa-star');
        starsHTML += `<i class="${starClass} ${rating >= i - 0.5 ? 'active' : ''}" data-value="${i}" title="Rate ${i} Star${i > 1 ? 's' : ''}"></i>`;
    }
    starsHTML += '</div>';

    // Average rating as static text display only (never interactive)
    let avgText = avgRating && avgRating > 0
        ? `<span class="rating-avg">${parseFloat(avgRating).toFixed(1)} / 5 Average</span>`
        : `<span class="rating-avg" style="font-style: italic;">Not rated yet</span>`;

    return starsHTML + avgText;
};

// Generates or fetches unique visitor identifier
function getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
        visitorId = 'visitor_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
}

window.submitRating = async function (id, type, value, onSuccess) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    const body = { itemId: id, itemType: type, rating: value };

    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    } else {
        const visitorId = getOrCreateVisitorId();
        headers['x-visitor-id'] = visitorId;
        body.visitor_id = visitorId;
    }

    try {
        const res = await fetch('/api/data/rate', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (res.ok) {
            showToast('Rating submitted successfully!', 'success');
            if (onSuccess) onSuccess();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to submit rating', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error', 'error');
    }
};

// Secret Admin Login trigger (double-click logo)
function initAdminLoginTrigger() {
    if (window.location.pathname.includes('/admin')) return;
    const logo = document.querySelector('.nav-logo');
    if (!logo) return;

    const openAdminModal = () => {
        let modal = document.getElementById('admin-login-modal');
        if (modal) return; // already open

        modal = document.createElement('div');
        modal.id = 'admin-login-modal';
        modal.className = 'modal';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <span id="close-admin-modal" class="close">&times;</span>
                <div class="admin-login-icon" style="font-size: 3.5rem; color: var(--primary-color); margin-bottom: 1rem; filter: drop-shadow(0 0 10px rgba(255, 69, 0, 0.35));">
                    <i class="fas fa-user-shield"></i>
                </div>
                <h3 style="margin-bottom: 1.5rem; color: var(--primary-color); font-size: 1.5rem; font-weight: 700;">Admin Sign In</h3>
                <form id="admin-login-form">
                    <div class="form-group" style="text-align: left;">
                        <label for="admin-email">Email Address</label>
                        <input type="email" id="admin-email" required placeholder="admin@admin.com">
                    </div>
                    <div class="form-group" style="text-align: left;">
                        <label for="admin-password">Password</label>
                        <input type="password" id="admin-password" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1.5rem; justify-content: center; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.classList.add('no-scroll');

        // Force reflow and add class for smooth CSS transitions
        modal.offsetHeight;
        modal.classList.add('show');

        const closeBtn = modal.querySelector('#close-admin-modal');
        closeBtn.addEventListener('click', closeAdminModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAdminModal();
        });

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeAdminModal();
            }
        };
        document.addEventListener('keydown', escHandler);

        function closeAdminModal() {
            modal.classList.remove('show');
            document.body.classList.remove('no-scroll');
            document.removeEventListener('keydown', escHandler);
            setTimeout(() => {
                modal.remove();
            }, 300);
        }

        const form = modal.querySelector('#admin-login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = modal.querySelector('#admin-email').value;
            const password = modal.querySelector('#admin-password').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    if (data.role !== 'admin') {
                        showToast('Access denied: Admin role required', 'error');
                        return;
                    }
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.role);
                    showToast('Admin signed in successfully', 'success');
                    closeAdminModal();
                    updateNavbar();
                } else {
                    showToast(data.error || 'Invalid credentials', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Network error during sign in', 'error');
            }
        });
    };

    // Trigger on desktop double click
    logo.addEventListener('dblclick', openAdminModal);

    // Trigger on mobile double tap (touch devices)
    let lastTap = 0;
    logo.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapDelay = currentTime - lastTap;
        if (tapDelay < 300 && tapDelay > 0) {
            e.preventDefault(); // prevent zoom and default behaviors
            openAdminModal();
        }
        lastTap = currentTime;
    });
}

function updateNavbar() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Remove legacy auth buttons
    const oldLogin = navLinks.querySelector('.login-btn');
    if (oldLogin) oldLogin.remove();

    const oldCrown = navLinks.querySelector('.admin-link');
    if (oldCrown) oldCrown.remove();

    const oldLogout = navLinks.querySelector('.logout-btn');
    if (oldLogout) oldLogout.remove();

    const oldProfile = navLinks.querySelector('.user-profile');
    if (oldProfile) oldProfile.remove();

    const oldDropdown = navLinks.querySelector('.admin-dropdown');
    if (oldDropdown) oldDropdown.remove();

    // If admin is logged in, show crown link to /admin and logout button
    if (token && role === 'admin') {
        // Admin link button
        const adminBtn = document.createElement('a');
        adminBtn.href = '/admin';
        adminBtn.className = 'admin-link';
        adminBtn.title = 'Admin Dashboard';
        adminBtn.style.cssText = "color: #ff4500; font-size: 16px; margin-right: 15px; display: inline-flex; align-items: center; justify-content: center;";
        adminBtn.innerHTML = '<i class="fas fa-crown"></i>';
        navLinks.insertBefore(adminBtn, document.getElementById('theme-toggle'));

        // Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.title = 'Logout';
        logoutBtn.style.cssText = "background: none; border: none; color: var(--text-color); cursor: pointer; font-size: 16px; margin-right: 15px; display: inline-flex; align-items: center; justify-content: center; padding: 0;";
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            showToast('Logged out successfully', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
        navLinks.insertBefore(logoutBtn, document.getElementById('theme-toggle'));
    }
}

// Load Partners section dynamic grid
async function loadPartners() {
    const grid = document.getElementById('partners-grid');
    if (!grid) return;
    try {
        const res = await fetch('/api/data/partners');
        const partners = await res.json();
        if (!partners.length) {
            grid.style.display = 'none';
            return;
        }
        grid.innerHTML = partners.map(p => `
                <img src="${p.logo_url}" alt="${p.name}" loading="lazy" class="partner-card">
        `).join('');
    } catch (err) {
        console.error('Failed to load partners:', err);
    }
}

// Wait for DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', function () {
    // Theme Toggle & Load Saved Theme (Runs globally, including on the admin page)
    const body = document.body;
    
    const setTheme = (theme) => {
        body.classList.toggle('light-mode', theme === 'light');
        document.documentElement.dataset.theme = theme;
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        localStorage.setItem('theme', theme);
    };

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        setTheme('light');
    } else {
        setTheme('dark');
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('light-mode') ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    if (document.body.classList.contains('admin-page')) return;

    // Hamburger Menu Logic
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon
            const icon = hamburger.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when a link is clicked
        navLinks.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'A' || target.closest('a')) {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (navLinks.classList.contains('active') &&
                !navLinks.contains(event.target) &&
                !hamburger.contains(event.target)) {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // Global Confirm Modal Function
    window.showConfirmModal = function (message, onConfirm) {
        let confirmModal = document.getElementById('global-confirm-modal');
        if (!confirmModal) {
            confirmModal = document.createElement('div');
            confirmModal.id = 'global-confirm-modal';
            confirmModal.className = 'modal';
            confirmModal.innerHTML = `
                <div class="modal-content">
                    <h3 id="global-confirm-msg" style="margin-bottom: 2rem;">Are you sure?</h3>
                    <div class="modal-buttons" style="display: flex; gap: 1rem; justify-content: center;">
                        <button id="global-confirm-btn" class="btn-primary" style="background: red;">Delete</button>
                        <button id="global-cancel-btn" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);
        }

        document.getElementById('global-confirm-msg').textContent = message;
        confirmModal.classList.add('show');
        document.body.classList.add('no-scroll');

        const confirmBtn = document.getElementById('global-confirm-btn');
        const cancelBtn = document.getElementById('global-cancel-btn');

        // Clean up old listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newConfirmBtn.addEventListener('click', () => {
            confirmModal.classList.remove('show');
            document.body.classList.remove('no-scroll');
            onConfirm();
        });

        newCancelBtn.addEventListener('click', () => {
            confirmModal.classList.remove('show');
            document.body.classList.remove('no-scroll');
        });
    };

    // Theme Toggle handled globally at the beginning of DOMContentLoaded

    // Video Mute Toggle
    const muteBtn = document.getElementById('mute-btn');
    const heroVideo = document.getElementById('hero-video');

    if (muteBtn && heroVideo) {
        muteBtn.addEventListener('click', () => {
            const icon = muteBtn.querySelector('i');
            if (heroVideo.muted) {
                heroVideo.muted = false;
                icon.className = 'fas fa-volume-up';
            } else {
                heroVideo.muted = true;
                icon.className = 'fas fa-volume-mute';
            }
        });
    }

    // Animated Text
    const animatedText = document.querySelector('.animated-text');
    if (animatedText) {
        const words = animatedText.querySelectorAll('span');
        let currentWord = 0;

        function changeWord() {
            words.forEach(word => word.style.opacity = '0');
            if (words[currentWord]) words[currentWord].style.opacity = '1';
            currentWord = (currentWord + 1) % words.length;
        }

        if (words.length > 0) {
            setInterval(changeWord, 2000);
            changeWord(); // Initial call
        }
    }

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Load Team Members
    async function loadTeamMembers() {
        const teamGrid = document.getElementById('team-grid');
        if (!teamGrid) return; // Exit if element doesn't exist
        teamGrid.innerHTML = '';

        let teamMembers = [];
        try {
            const response = await fetch('/api/data/team');
            if (response.ok) {
                teamMembers = await response.json();
            }
        } catch (error) {
            console.error('Error loading team members:', error);
        }

        if (!teamMembers || !teamMembers.length) {
            teamGrid.innerHTML = '<p>No team members found</p>';
            return;
        }

        teamMembers.forEach(member => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.innerHTML = `
                <img src="${member.image}" alt="${member.name}" loading="lazy">
                <div class="overlay">
                    <h3>${member.name}</h3>
                    <p>${member.committee}</p>
                    <a href="${member.linkedin}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i></a>
                </div>
            `;
            teamGrid.appendChild(card);
        });
    }

    // Load Statistics
    async function loadStatistics() {
        const studentsCountEl = document.getElementById('students-count');
        const graduatesCountEl = document.getElementById('graduates-count');
        const projectsCountEl = document.getElementById('projects-count');

        try {
            const response = await fetch('/api/data/statistics');
            if (response.ok) {
                const stats = await response.json();
                if (studentsCountEl) studentsCountEl.textContent = stats.students_count;
                if (graduatesCountEl) graduatesCountEl.textContent = stats.graduates_count;
                if (projectsCountEl) projectsCountEl.textContent = stats.projects_count;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            if (studentsCountEl) studentsCountEl.textContent = '120';
            if (graduatesCountEl) graduatesCountEl.textContent = '35';
            if (projectsCountEl) projectsCountEl.textContent = '25';
        }
    }

    function extractYouTubeId(url, fallbackId) {
        if (!url) return fallbackId;

        const regExp = /(?:youtube\.com.*v=|youtu\.be\/)([^&#?]+)/;
        const match = url.match(regExp);

        return match ? match[1] : fallbackId;
    }

    // Load YouTube Thumbnails (from API)
    function loadYouTubeThumbnails() {
        const slider = document.getElementById('youtube-slider');
        if (!slider) return;

        slider.innerHTML = '';
        const track = document.createElement('div');
        track.className = 'youtube-track';

        // Fetch YouTube videos from API
        fetch('/api/data/youtube')
            .then(response => response.json())
            .then(videos => {
                if (videos.length === 0) {
                    // Fallback to default videos if none in database
                    const defaultVideos = [
                        { id: 'dQw4w9WgXcQ', title: 'Game Jam Tips', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                        { id: '3fumBcKC6RE', title: 'Design Workflow', youtube_url: 'https://www.youtube.com/watch?v=3fumBcKC6RE' },
                        { id: 'L_jWHffIx5E', title: 'Art Pipeline', youtube_url: 'https://www.youtube.com/watch?v=L_jWHffIx5E' },
                        { id: 'V-_O7nl0Ii0', title: 'Team Collaboration', youtube_url: 'https://www.youtube.com/watch?v=V-_O7nl0Ii0' },
                        { id: 'Zi_XLOBDo_Y', title: 'Unity Basics', youtube_url: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y' }
                    ];
                    videos = defaultVideos;
                }

                // Duplicate videos for seamless loop
                const allVideos = videos.concat(videos);

                allVideos.forEach(video => {
                    const img = document.createElement('img');
                    const videoId = extractYouTubeId(video.youtube_url, video.id);

                    if (video.thumbnail) {
                        img.src = video.thumbnail;
                    } else {
                        img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }

                    img.alt = video.title;
                    img.addEventListener('click', () => {
                        window.open(video.youtube_url || `https://www.youtube.com/watch?v=${videoId}`, '_blank');
                    });
                    track.appendChild(img);
                });

                slider.appendChild(track);
                initializeMarquee(track);
            })
            .catch(error => {
                console.error('Error loading YouTube videos:', error);
                // Fallback to default videos
                const defaultVideos = [
                    { id: 'dQw4w9WgXcQ', title: 'Game Jam Tips', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                    { id: '3fumBcKC6RE', title: 'Design Workflow', youtube_url: 'https://www.youtube.com/watch?v=3fumBcKC6RE' },
                    { id: 'L_jWHffIx5E', title: 'Art Pipeline', youtube_url: 'https://www.youtube.com/watch?v=L_jWHffIx5E' },
                    { id: 'V-_O7nl0Ii0', title: 'Team Collaboration', youtube_url: 'https://www.youtube.com/watch?v=V-_O7nl0Ii0' },
                    { id: 'Zi_XLOBDo_Y', title: 'Unity Basics', youtube_url: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y' }
                ];

                const allVideos = defaultVideos.concat(defaultVideos);
                allVideos.forEach(video => {
                    const img = document.createElement('img');
                    img.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
                    img.alt = video.title;
                    img.addEventListener('click', () => {
                        window.open(video.youtube_url, '_blank');
                    });
                    track.appendChild(img);
                });

                slider.appendChild(track);
                initializeMarquee(track);
            });
    }

    function initializeMarquee(track) {
        const images = Array.from(track.querySelectorAll('img'));
        if (!images.length) return;

        const update = () => {
            const totalWidth = track.scrollWidth;
            const marqueeWidth = totalWidth / 2;
            if (marqueeWidth <= 0) return;

            const speed = 120; // pixels per second
            const durationSeconds = Math.max(12, marqueeWidth / speed);

            track.style.setProperty('--marquee-width', `${marqueeWidth}px`);
            track.style.animationDuration = `${durationSeconds}s`;
            track.style.animationTimingFunction = 'linear';
            track.style.animationName = 'marquee';
            track.style.animationIterationCount = 'infinite';
        };

        const waitForImages = images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            });
        });

        Promise.all(waitForImages).then(() => {
            update();
            window.addEventListener('resize', update);
        });
    }



    function initScrollReveal() {
        const path = window.location.pathname;
        const isExcluded = path.includes('/login') || path.includes('/profile') || path.includes('/admin');

        if (isExcluded) return;

        const observerOptions = {
            threshold: 0.12,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Stop observing once animated
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        window.revealObserver = observer;

        // Target major layout sections and cards
        const revealTargets = document.querySelectorAll(
            'section, .team-card, .item-card, .big-link-card, .gallery-item, .gallery-card, .game-card, .mission, .vision, .footer-section, .partners-grid'
        );

        revealTargets.forEach(target => {
            if (!target.closest('.modal')) {
                target.classList.add('scroll-reveal');
                observer.observe(target);
            }
        });
    }

    // Initialize triggers & dynamic layouts
    initAdminLoginTrigger();
    updateNavbar();
    loadTeamMembers();
    loadStatistics();
    loadYouTubeThumbnails();
    loadPartners();
    initScrollReveal();
});