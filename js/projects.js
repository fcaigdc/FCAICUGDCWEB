document.addEventListener('DOMContentLoaded', async function() {
    console.log('Projects script initializing');



    // Load and Render Community Games
    async function loadCommunityGames() {
        const grid = document.getElementById('community-games-grid');
        if (!grid) return;

        try {
            const res = await fetch('./data/community-games.json');
            if (!res.ok) throw new Error('Failed to fetch community games');
            const games = await res.json();

            if (!games || !games.length) {
                grid.innerHTML = '<p class="section-subtitle" style="grid-column: 1/-1;">No community games available yet.</p>';
                return;
            }

            grid.innerHTML = games.map(game => `
                <div class="game-card">
                    <div class="game-image">
                        <img src="${game.image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?fit=crop&w=600&q=80'}" alt="${game.title}" loading="lazy" decoding="async">
                    </div>
                    <div class="game-info">
                        <h3>${game.title}</h3>
                        <p class="game-description">${game.description || 'No description provided.'}</p>
                        <p class="game-team"><i class="fas fa-users"></i> Team: ${game.team || 'GD Community'}</p>

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
            const res = await fetch('./data/waves.json');
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
                            <img src="${proj.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?fit=crop&w=600&q=80'}" alt="${proj.title}" loading="lazy" decoding="async">
                        </div>
                        <div class="game-info">
                            <h3>${proj.title}</h3>
                            <p class="game-description">${proj.description || 'No description provided.'}</p>
                            <p class="game-team"><i class="fas fa-user-graduate"></i> Student: ${proj.team || 'FCAI Student'}</p>

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
            const panels = panelsContainer.querySelectorAll('.wave-panel');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // deactivate all tabs & panels
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));

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