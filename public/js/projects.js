document.addEventListener('DOMContentLoaded', async function() {
    console.log('Projects script initializing');

    function getPublicHeaders() {
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        } else {
            const visitorId = localStorage.getItem('visitor_id');
            if (visitorId) {
                headers['x-visitor-id'] = visitorId;
            }
        }
        return headers;
    }

    // Interactive Star Rating click listener
    document.addEventListener("click", async function (e) {
        const star = e.target.closest(".stars.interactive i");
        if (!star) return;

        const container = star.closest(".stars");
        const id = container.dataset.id;
        const type = container.dataset.type;
        const val = parseFloat(star.dataset.value);

        // Immediately update DOM visuals for responsive feedback
        const allStars = container.querySelectorAll("i");
        allStars.forEach(s => {
            const starVal = parseFloat(s.dataset.value);
            if (starVal <= val) {
                s.className = "fas fa-star active";
            } else {
                s.className = "far fa-star";
            }
        });

        // Submit to rating API
        await window.submitRating(id, type, val, () => {
            // Re-fetch either community games or waves based on rated type
            if (type === 'community_game') {
                loadCommunityGames();
            } else if (type === 'student_project') {
                loadWavesAndProjects();
            }
        });
    });

    // Load and Render Community Games
    async function loadCommunityGames() {
        const grid = document.getElementById('community-games-grid');
        if (!grid) return;

        try {
            const res = await fetch('/api/data/community-games', {
                headers: getPublicHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch community games');
            const games = await res.json();

            if (!games || !games.length) {
                grid.innerHTML = '<p class="section-subtitle" style="grid-column: 1/-1;">No community games available yet.</p>';
                return;
            }

            grid.innerHTML = games.map(game => `
                <div class="game-card">
                    <div class="game-image">
                        <img src="${game.image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?fit=crop&w=600&q=80'}" alt="${game.title}" loading="lazy">
                    </div>
                    <div class="game-info">
                        <h3>${game.title}</h3>
                        <p class="game-description">${game.description || 'No description provided.'}</p>
                        <p class="game-team"><i class="fas fa-users"></i> Team: ${game.team || 'GD Community'}</p>
                        <div class="rating-wrapper">
                            ${window.renderStars(game.user_rating, game.avg_rating, game.id, 'community_game')}
                        </div>
                        ${game.itch_url ? `
                            <a href="${game.itch_url}" target="_blank" class="btn-primary play-btn">
                                <i class="fas fa-gamepad"></i> Play Game
                            </a>
                        ` : ''}
                    </div>
                </div>
            `).join('');

            // Re-observe newly added cards for scroll reveal
            if (window.revealObserver) {
                grid.querySelectorAll('.game-card').forEach(card => {
                    card.classList.add('scroll-reveal');
                    window.revealObserver.observe(card);
                });
            }

        } catch (err) {
            console.error('Error loading community games:', err);
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Failed to load community games.</p>';
        }
    }

    // Load and Render Student Waves (Tabs + Panels)
    async function loadWavesAndProjects() {
        const tabsContainer = document.getElementById('wave-tabs');
        const panelsContainer = document.getElementById('wave-panels');
        if (!tabsContainer || !panelsContainer) return;

        try {
            const res = await fetch('/api/data/waves', {
                headers: getPublicHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch waves');
            const waves = await res.json();

            if (!waves || !waves.length) {
                tabsContainer.innerHTML = '';
                panelsContainer.innerHTML = '<p class="section-subtitle" style="text-align: center;">No student waves available yet.</p>';
                return;
            }

            // Keep track of currently selected wave number/id if any, default to first wave
            const activeTab = tabsContainer.querySelector('.wave-tab.active');
            const activeWaveId = activeTab ? activeTab.dataset.waveId : waves[0].id.toString();

            // Render Tabs
            tabsContainer.innerHTML = waves.map(wave => `
                <button class="wave-tab ${wave.id.toString() === activeWaveId ? 'active' : ''}" data-wave-id="${wave.id}">
                    Wave ${wave.number}: ${wave.name}
                </button>
            `).join('');

            // Render Panels
            panelsContainer.innerHTML = waves.map(wave => {
                const projectsHTML = wave.projects && wave.projects.length ? wave.projects.map(proj => `
                    <div class="game-card">
                        <div class="game-image">
                            <img src="${proj.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?fit=crop&w=600&q=80'}" alt="${proj.title}" loading="lazy">
                        </div>
                        <div class="game-info">
                            <h3>${proj.title}</h3>
                            <p class="game-description">${proj.description || 'No description provided.'}</p>
                            <p class="game-team"><i class="fas fa-user-graduate"></i> Student: ${proj.team || 'FCAI Student'}</p>
                            <div class="rating-wrapper">
                                ${window.renderStars(proj.user_rating, proj.avg_rating, proj.id, 'student_project')}
                            </div>
                            ${proj.itch_url ? `
                                <a href="${proj.itch_url}" target="_blank" class="btn-primary play-btn">
                                    <i class="fas fa-gamepad"></i> Play Game
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : '<p style="grid-column: 1/-1; text-align: center; opacity: 0.6;">No student projects registered for this wave.</p>';

                return `
                    <div class="wave-panel ${wave.id.toString() === activeWaveId ? 'active' : ''}" id="wave-panel-${wave.id}">
                        <p class="section-subtitle" style="margin-bottom: 30px; font-style: italic;">${wave.description || ''}</p>
                        <div class="games-grid">
                            ${projectsHTML}
                        </div>
                    </div>
                `;
            }).join('');

            // Re-observe newly added cards for scroll reveal
            if (window.revealObserver) {
                panelsContainer.querySelectorAll('.game-card').forEach(card => {
                    card.classList.add('scroll-reveal');
                    window.revealObserver.observe(card);
                });
            }

            // Attach Tab Switching click events
            const tabs = tabsContainer.querySelectorAll('.wave-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // deactivate all tabs & panels
                    tabsContainer.querySelectorAll('.wave-tab').forEach(t => t.classList.remove('active'));
                    panelsContainer.querySelectorAll('.wave-panel').forEach(p => p.classList.remove('active'));

                    // activate current
                    tab.classList.add('active');
                    const targetPanel = panelsContainer.querySelector(`#wave-panel-${tab.dataset.waveId}`);
                    if (targetPanel) targetPanel.classList.add('active');
                });
            });

        } catch (err) {
            console.error('Error loading waves and projects:', err);
            panelsContainer.innerHTML = '<p style="text-align: center; color: red;">Failed to load student projects.</p>';
        }
    }

    // Initialize Page Content
    await loadCommunityGames();
    await loadWavesAndProjects();
});