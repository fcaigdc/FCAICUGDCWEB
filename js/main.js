// Toast system removed (legacy code)


// Load Partners section dynamic grid
async function loadPartners() {
    const grid = document.getElementById('partners-grid');
    if (!grid) return;
    try {
        const res = await fetch('./data/partners.json');
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
            const response = await fetch('./data/team.json');
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
            const response = await fetch('./data/statistics.json');
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
        fetch('./data/youtube.json')
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

    // Initialize dynamic layouts
    loadTeamMembers();
    loadStatistics();
    loadYouTubeThumbnails();
    loadPartners();
    initScrollReveal();
});