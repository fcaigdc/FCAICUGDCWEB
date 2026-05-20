// Admin Dashboard Controller
document.addEventListener('DOMContentLoaded', async () => {
    // Auth Guard
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    try {
        const res = await fetch('/api/auth/verify-admin', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Verification failed');
    } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
        return;
    }

    // Initialize Admin Panel
    initAdminPanel();
});

function initAdminPanel() {
    // Modal Selectors
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const formFields = document.getElementById('form-fields');
    const itemForm = document.getElementById('item-form');
    const closeBtn = document.querySelector('.close');

    const confirmModal = document.getElementById('confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');

    let currentItemType = '';
    let currentItemId = null;
    let currentExtraId = null; // Used for waveId in student projects
    let pendingDelete = null;

    // Set up global modal methods
    window.openModal = function(type, action, itemId = null, extraId = null) {
        currentItemType = type;
        currentItemId = itemId;
        currentExtraId = extraId;
        modalTitle.textContent = `${action === 'add' ? 'Add New' : 'Edit'} ${getFriendlyTypeName(type)}`;
        
        loadModalFields(type, action, itemId, extraId);
        modal.classList.add('show');
        document.body.classList.add('no-scroll');
    };

    window.deleteItem = function(type, id, extraId = null) {
        pendingDelete = { type, id, extraId };
        confirmModal.classList.add('show');
        document.body.classList.add('no-scroll');
    };

    // Close Modal Events
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove('show');
            document.body.classList.remove('no-scroll');
        };
    }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.remove('show');
            document.body.classList.remove('no-scroll');
        }
        if (event.target === confirmModal) {
            confirmModal.classList.remove('show');
            document.body.classList.remove('no-scroll');
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('show');
            confirmModal.classList.remove('show');
            document.body.classList.remove('no-scroll');
        }
    });

    if (cancelDeleteBtn) {
        cancelDeleteBtn.onclick = () => {
            pendingDelete = null;
            confirmModal.classList.remove('show');
            document.body.classList.remove('no-scroll');
        };
    }

    // Confirm Delete Event
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
            if (!pendingDelete) return;
            const { type, id, extraId } = pendingDelete;
            let url = `/api/admin/${type}/${id}`;
            if (type === 'student-projects') {
                url = `/api/admin/waves/${extraId}/projects/${id}`;
            }

            try {
                const res = await fetch(url, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                });
                if (!res.ok) throw new Error('Deletion failed');
                
                showToast('Deleted successfully!', 'success');
                refreshCurrentSection();
            } catch (err) {
                console.error(err);
                showToast('Failed to delete item.', 'error');
            } finally {
                pendingDelete = null;
                confirmModal.classList.remove('show');
                document.body.classList.remove('no-scroll');
            }
        };
    }

    // Section Switching Logic
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const section = link.getAttribute('data-section');
            renderSection(section);
        });
    });

    // Logout Click
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = '/';
        });
    }

    // Helper: File Upload
    async function uploadFile(fileInput) {
        if (!fileInput || !fileInput.files.length) return null;
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            body: formData
        });
        if (!res.ok) throw new Error('File upload failed');
        const result = await res.json();
        return result.url;
    }

    // Form Submit Event
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = itemForm.querySelector('button[type="submit"]');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const formData = new FormData(itemForm);
            
            // Extract & upload files
            let uploadedUrl = null;
            const fileInput = itemForm.querySelector('input[type="file"]');
            if (fileInput && fileInput.files.length > 0) {
                uploadedUrl = await uploadFile(fileInput);
            }

            // Map standard object properties
            const payload = {};
            for (let [key, val] of formData.entries()) {
                if (val instanceof File) continue;
                payload[key] = val;
            }

            // Bind upload url depending on the item field requirements
            if (uploadedUrl) {
                if (currentItemType === 'team') payload.image = uploadedUrl;
                else if (currentItemType === 'youtube') payload.thumbnail = uploadedUrl;
                else if (currentItemType === 'gallery') payload.src = uploadedUrl;
                else if (currentItemType === 'community-games') payload.image = uploadedUrl;
                else if (currentItemType === 'student-projects') payload.image = uploadedUrl;
                else if (currentItemType === 'partners') payload.logo_url = uploadedUrl;
            } else {
                // Carry over old image URL if present
                const oldUrlInput = itemForm.querySelector('input[name="existing_media_url"]');
                if (oldUrlInput && oldUrlInput.value) {
                    if (currentItemType === 'team') payload.image = oldUrlInput.value;
                    else if (currentItemType === 'youtube') payload.thumbnail = oldUrlInput.value;
                    else if (currentItemType === 'gallery') payload.src = oldUrlInput.value;
                    else if (currentItemType === 'community-games') payload.image = oldUrlInput.value;
                    else if (currentItemType === 'student-projects') payload.image = oldUrlInput.value;
                    else if (currentItemType === 'partners') payload.logo_url = oldUrlInput.value;
                }
            }

            let url = `/api/admin/${currentItemType}`;
            let method = currentItemId ? 'PUT' : 'POST';

            if (currentItemType === 'student-projects') {
                url = currentItemId 
                    ? `/api/admin/waves/${currentExtraId}/projects/${currentItemId}`
                    : `/api/admin/waves/${currentExtraId}/projects`;
            } else if (currentItemId) {
                url = `/api/admin/${currentItemType}/${currentItemId}`;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Saving failed');

            showToast('Saved successfully!', 'success');
            modal.classList.remove('show');
            document.body.classList.remove('no-scroll');
            refreshCurrentSection();
        } catch (err) {
            console.error(err);
            showToast('Failed to save changes.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save';
        }
    });

    // Default Section
    renderSection('statistics');
}

function refreshCurrentSection() {
    const activeLink = document.querySelector('.sidebar-link.active');
    if (activeLink) {
        const section = activeLink.getAttribute('data-section');
        renderSection(section);
    }
}

function getFriendlyTypeName(type) {
    const map = {
        'team': 'Team Member',
        'youtube': 'YouTube Video',
        'partners': 'Partner',
        'community-games': 'Community Game',
        'waves': 'Student Wave',
        'student-projects': 'Student Project',
        'gallery': 'Gallery Item'
    };
    return map[type] || 'Item';
}

// -------------------------------------------------------------
// SECTION RENDERERS
// -------------------------------------------------------------
async function renderSection(section) {
    const main = document.getElementById('admin-main');
    main.innerHTML = `<div class="loading-spinner" style="text-align: center; padding: 50px; font-size: 1.5rem;"><i class="fas fa-spinner fa-spin"></i> Loading Section...</div>`;

    switch (section) {
        case 'statistics':
            await renderStatistics(main);
            break;
        case 'team':
            await renderTeam(main);
            break;
        case 'youtube':
            await renderYouTube(main);
            break;

        case 'partners':
            await renderPartners(main);
            break;
        case 'community-games':
            await renderCommunityGames(main);
            break;
        case 'waves':
            await renderWaves(main);
            break;
        case 'gallery':
            await renderGallery(main);
            break;
        case 'site-settings':
            await renderSiteSettings(main);
            break;
        default:
            main.innerHTML = `<p>Section ${section} not implemented.</p>`;
    }
}

// 1. STATISTICS
async function renderStatistics(main) {
    main.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Statistics Overview</h2>
            </div>
            <form id="stats-form">
                <div class="stats-grid">
                    <div class="stats-card-input">
                        <i class="fas fa-users"></i>
                        <input type="number" id="students-count" name="students_count" required min="0">
                        <label>Enrolled Students</label>
                    </div>
                    <div class="stats-card-input">
                        <i class="fas fa-graduation-cap"></i>
                        <input type="number" id="graduates-count" name="graduates_count" required min="0">
                        <label>Graduates Count</label>
                    </div>
                    <div class="stats-card-input">
                        <i class="fas fa-gamepad"></i>
                        <input type="number" id="projects-count" name="projects_count" required min="0">
                        <label>Projects Completed</label>
                    </div>
                </div>
                <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Update Statistics</button>
            </form>
        </div>
    `;

    try {
        const res = await fetch('/api/data/statistics');
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('students-count').value = stats.students_count || 0;
            document.getElementById('graduates-count').value = stats.graduates_count || 0;
            document.getElementById('projects-count').value = stats.projects_count || 0;
        }
    } catch (err) {
        showToast('Failed to load statistics', 'error');
    }

    document.getElementById('stats-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            students_count: parseInt(document.getElementById('students-count').value),
            graduates_count: parseInt(document.getElementById('graduates-count').value),
            projects_count: parseInt(document.getElementById('projects-count').value)
        };

        try {
            const res = await fetch('/api/admin/statistics', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();
            showToast('Statistics updated successfully!', 'success');
        } catch (err) {
            showToast('Failed to update statistics.', 'error');
        }
    });
}

// 2. TEAM MEMBERS
async function renderTeam(main) {
    main.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Team Members</h2>
                <button class="btn-primary" onclick="openModal('team', 'add')"><i class="fas fa-plus"></i> Add Team Member</button>
            </div>
            <div id="team-list">Loading...</div>
        </div>
    `;

    const listDiv = document.getElementById('team-list');
    try {
        const res = await fetch('/api/data/team');
        const list = await res.json();
        if (!list.length) {
            listDiv.innerHTML = '<p>No team members found.</p>';
            return;
        }
        listDiv.innerHTML = list.map(item => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${item.name}</div>
                    <div class="item-subtitle">${item.committee}</div>
                </div>
                <div class="actions">
                    <button class="btn-edit-icon" onclick="openModal('team', 'edit', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete-icon" onclick="deleteItem('team', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listDiv.innerHTML = '<p style="color:red;">Failed to load team members.</p>';
    }
}

// 3. YOUTUBE VIDEOS
async function renderYouTube(main) {
    main.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>YouTube Videos</h2>
                <button class="btn-primary" onclick="openModal('youtube', 'add')"><i class="fas fa-plus"></i> Add YouTube Video</button>
            </div>
            <div id="youtube-list">Loading...</div>
        </div>
    `;

    const listDiv = document.getElementById('youtube-list');
    try {
        const res = await fetch('/api/data/youtube');
        const list = await res.json();
        if (!list.length) {
            listDiv.innerHTML = '<p>No YouTube videos found.</p>';
            return;
        }
        listDiv.innerHTML = list.map(item => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-subtitle">${item.youtube_url}</div>
                </div>
                <div class="actions">
                    <button class="btn-edit-icon" onclick="openModal('youtube', 'edit', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete-icon" onclick="deleteItem('youtube', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listDiv.innerHTML = '<p style="color:red;">Failed to load YouTube videos.</p>';
    }
}



// 5. PARTNERS
async function renderPartners(main) {
    main.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Our Partners</h2>
                <button class="btn-primary" onclick="openModal('partners', 'add')"><i class="fas fa-plus"></i> Add Partner</button>
            </div>
            <div id="partners-list">Loading...</div>
        </div>
    `;

    const listDiv = document.getElementById('partners-list');
    try {
        const res = await fetch('/api/data/partners');
        const list = await res.json();
        if (!list.length) {
            listDiv.innerHTML = '<p>No partners found.</p>';
            return;
        }
        listDiv.innerHTML = list.map(item => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${item.name}</div>
                    <div class="item-subtitle">${item.website_url || 'No URL'} (Order: ${item.display_order})</div>
                </div>
                <div class="actions">
                    <button class="btn-edit-icon" onclick="openModal('partners', 'edit', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete-icon" onclick="deleteItem('partners', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listDiv.innerHTML = '<p style="color:red;">Failed to load partners.</p>';
    }
}

// 6. COMMUNITY GAMES
async function renderCommunityGames(main) {
    main.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Community Games</h2>
                <button class="btn-primary" onclick="openModal('community-games', 'add')"><i class="fas fa-plus"></i> Add Community Game</button>
            </div>
            <div id="games-list">Loading...</div>
        </div>
    `;

    const listDiv = document.getElementById('games-list');
    try {
        const res = await fetch('/api/data/community-games');
        const list = await res.json();
        if (!list.length) {
            listDiv.innerHTML = '<p>No community games found.</p>';
            return;
        }
        listDiv.innerHTML = list.map(item => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-subtitle">by ${item.team} | Order: ${item.display_order}</div>
                </div>
                <div class="actions">
                    <button class="btn-edit-icon" onclick="openModal('community-games', 'edit', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete-icon" onclick="deleteItem('community-games', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listDiv.innerHTML = '<p style="color:red;">Failed to load games.</p>';
    }
}

// 7. STUDENT WAVES & NESTED PROJECTS
async function renderWaves(main) {
    main.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Student Waves</h2>
                <button class="btn-primary" onclick="openModal('waves', 'add')"><i class="fas fa-plus"></i> Add Student Wave</button>
            </div>
            <div id="waves-list">Loading...</div>
        </div>
    `;

    window.toggleWaveProjects = function(waveId) {
        const panel = document.getElementById(`wave-projects-${waveId}`);
        if (panel) {
            panel.classList.toggle('active');
        }
    };

    const listDiv = document.getElementById('waves-list');
    try {
        const res = await fetch('/api/data/waves');
        const waves = await res.json();
        if (!waves.length) {
            listDiv.innerHTML = '<p>No waves found.</p>';
            return;
        }

        let html = '';
        for (let wave of waves) {
            // Get wave projects nested
            const projects = wave.projects || [];
            const projectListHtml = projects.map(p => `
                <div class="nested-project-card">
                    <div>
                        <strong>${p.title}</strong>
                        <span style="opacity: 0.6; font-size: 0.8rem;"> - by ${p.team}</span>
                    </div>
                    <div class="actions">
                        <button class="btn-edit-icon" style="width: 28px; height: 28px; font-size: 0.8rem;" onclick="openModal('student-projects', 'edit', ${p.id}, ${wave.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete-icon" style="width: 28px; height: 28px; font-size: 0.8rem;" onclick="deleteItem('student-projects', ${p.id}, ${wave.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');

            html += `
                <div class="item-card-wrapper" style="margin-bottom: 1.5rem;">
                    <div class="item-card" style="margin-bottom: 0;">
                        <div class="item-info">
                            <div class="item-title">Wave ${wave.number}: ${wave.name}</div>
                            <div class="item-subtitle">${wave.description || 'No description'} (Order: ${wave.display_order})</div>
                        </div>
                        <div class="actions">
                            <button class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="toggleWaveProjects(${wave.id})"><i class="fas fa-tasks"></i> Manage Projects (${projects.length})</button>
                            <button class="btn-edit-icon" onclick="openModal('waves', 'edit', ${wave.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete-icon" onclick="deleteItem('waves', ${wave.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="wave-projects-panel" id="wave-projects-${wave.id}">
                        <div class="wave-projects-header">
                            <h4>Student Projects inside Wave ${wave.number}</h4>
                            <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="openModal('student-projects', 'add', null, ${wave.id})"><i class="fas fa-plus"></i> Add Wave Project</button>
                        </div>
                        <div class="nested-projects-list">
                            ${projectListHtml || '<p style="opacity: 0.5; font-size: 0.9rem;">No student projects added to this wave yet.</p>'}
                        </div>
                    </div>
                </div>
            `;
        }
        listDiv.innerHTML = html;
    } catch (err) {
        listDiv.innerHTML = '<p style="color:red;">Failed to load waves.</p>';
    }
}

// 8. GALLERY
async function renderGallery(main) {
    main.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Media Gallery</h2>
                <button class="btn-primary" onclick="openModal('gallery', 'add')"><i class="fas fa-plus"></i> Add Gallery Item</button>
            </div>
            <div id="gallery-list">Loading...</div>
        </div>
    `;

    const listDiv = document.getElementById('gallery-list');
    try {
        const res = await fetch('/api/data/gallery');
        const list = await res.json();
        const items = Array.isArray(list) ? list : (list.items || []);
        if (!items.length) {
            listDiv.innerHTML = '<p>No gallery items found.</p>';
            return;
        }
        listDiv.innerHTML = items.map(item => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-subtitle">by ${item.creator_name || 'Anonymous'} (${item.media_type}) | Order: ${item.display_order}</div>
                </div>
                <div class="actions">
                    <button class="btn-edit-icon" onclick="openModal('gallery', 'edit', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete-icon" onclick="deleteItem('gallery', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listDiv.innerHTML = '<p style="color:red;">Failed to load gallery items.</p>';
    }
}

// 9. SITE SETTINGS
async function renderSiteSettings(main) {
    main.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Site Settings</h2>
            </div>
            <form id="settings-form">
                <div class="form-group">
                    <label>Footer Email:</label>
                    <input type="email" name="footer_email" id="s-email" required>
                </div>
                <div class="form-group">
                    <label>Footer Phone:</label>
                    <input type="text" name="footer_phone" id="s-phone" required>
                </div>
                <div class="form-group">
                    <label>Hero Tagline / Subtitle:</label>
                    <input type="text" name="hero_tagline" id="s-tagline">
                </div>
                <div class="form-group">
                    <label>Mission Statement:</label>
                    <textarea name="mission_text" id="s-mission" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label>Vision Statement:</label>
                    <textarea name="vision_text" id="s-vision" rows="4"></textarea>
                </div>
                <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Save Settings</button>
            </form>
        </div>
    `;

    try {
        const res = await fetch('/api/data/site-settings');
        const settings = await res.json();
        document.getElementById('s-email').value = settings.footer_email || '';
        document.getElementById('s-phone').value = settings.footer_phone || '';
        document.getElementById('s-tagline').value = settings.hero_tagline || '';
        document.getElementById('s-mission').value = settings.mission_text || '';
        document.getElementById('s-vision').value = settings.vision_text || '';
    } catch (err) {
        showToast('Failed to load settings.', 'error');
    }

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const formData = new FormData(e.target);
            const payload = {};
            for (let [key, val] of formData.entries()) {
                payload[key] = val;
            }

            const res = await fetch('/api/admin/site-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error();
            showToast('Site settings updated successfully!', 'success');
        } catch (err) {
            showToast('Failed to update site settings.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Settings';
        }
    });
}

// -------------------------------------------------------------
// DYNAMIC MODAL FORM FIELDS INJECTOR
// -------------------------------------------------------------
async function loadModalFields(type, action, itemId, extraId) {
    const formFields = document.getElementById('form-fields');
    formFields.innerHTML = `<div style="padding: 20px; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading Fields...</div>`;

    let item = {};
    if (action === 'edit') {
        try {
            let res;
            if (type === 'student-projects') {
                // Fetch student waves and extract nested project details
                res = await fetch('/api/data/waves');
                const waves = await res.json();
                const wave = waves.find(w => w.id == extraId);
                if (wave) {
                    item = wave.projects.find(p => p.id == itemId) || {};
                }
            } else {
                res = await fetch(`/api/data/${type}`);
                const list = await res.json();
                const items = Array.isArray(list) ? list : (list.items || []);
                item = items.find(i => i.id == itemId) || {};
            }
        } catch (err) {
            console.error('Failed to load item info for edit.', err);
        }
    }

    let fieldsHtml = '';

    switch (type) {
        case 'team':
            fieldsHtml = `
                <div class="form-group">
                    <label>Full Name:</label>
                    <input type="text" name="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Committee / Role:</label>
                    <input type="text" name="committee" value="${item.committee || ''}" required placeholder="e.g. Vice Head, Community Lead">
                </div>
                <div class="form-group">
                    <label>LinkedIn URL:</label>
                    <input type="url" name="linkedin" value="${item.linkedin || ''}">
                </div>
                <div class="form-group">
                    <label>Bio / Details:</label>
                    <textarea name="details" rows="3">${item.details || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Profile Image File:</label>
                    <input type="file" name="image_file" accept="image/*">
                    ${item.image ? `<div style="margin-top:8px;"><small>Current:</small><br><img src="${item.image}" style="width: 50px; height: 50px; border-radius:50%; object-fit:cover; border:1px solid #ff4500;"></div>` : ''}
                    <input type="hidden" name="existing_media_url" value="${item.image || ''}">
                </div>
            `;
            break;

        case 'youtube':
            fieldsHtml = `
                <div class="form-group">
                    <label>Video Title:</label>
                    <input type="text" name="title" value="${item.title || ''}" required>
                </div>
                <div class="form-group">
                    <label>YouTube URL:</label>
                    <input type="url" name="youtube_url" value="${item.youtube_url || ''}" required placeholder="e.g. https://www.youtube.com/watch?v=XXXXXX">
                </div>
                <div class="form-group">
                    <label>Thumbnail Image File:</label>
                    <input type="file" name="thumbnail_file" accept="image/*">
                    ${item.thumbnail ? `<div style="margin-top:8px;"><small>Current:</small><br><img src="${item.thumbnail}" style="width: 80px; height: auto; border-radius: 4px;"></div>` : ''}
                    <input type="hidden" name="existing_media_url" value="${item.thumbnail || ''}">
                </div>
            `;
            break;

        case 'partners':
            fieldsHtml = `
                <div class="form-group">
                    <label>Partner Name:</label>
                    <input type="text" name="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Website URL:</label>
                    <input type="url" name="website_url" value="${item.website_url || ''}" placeholder="e.g. https://partner-website.com">
                </div>
                <div class="form-group">
                    <label>Display Order:</label>
                    <input type="number" name="display_order" value="${item.display_order || 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Logo Image File:</label>
                    <input type="file" name="logo_file" accept="image/*">
                    ${item.logo_url ? `<div style="margin-top:8px;"><small>Current Logo:</small><br><img src="${item.logo_url}" style="width: 80px; height: auto; border: 1px solid rgba(255,255,255,0.1); padding: 4px; border-radius: 4px;"></div>` : ''}
                    <input type="hidden" name="existing_media_url" value="${item.logo_url || ''}">
                </div>
            `;
            break;

        case 'community-games':
            fieldsHtml = `
                <div class="form-group">
                    <label>Game Title:</label>
                    <input type="text" name="title" value="${item.title || ''}" required>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea name="description" rows="3" required>${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Team Name / Creator:</label>
                    <input type="text" name="team" value="${item.team || ''}" required placeholder="e.g. Dream Team">
                </div>
                <div class="form-group">
                    <label>itch.io URL:</label>
                    <input type="url" name="itch_url" value="${item.itch_url || ''}" placeholder="e.g. https://dreamteam.itch.io/my-game">
                </div>
                <div class="form-group">
                    <label>Display Order:</label>
                    <input type="number" name="display_order" value="${item.display_order || 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Game Image Banner:</label>
                    <input type="file" name="game_image" accept="image/*">
                    ${item.image ? `<div style="margin-top:8px;"><small>Current Banner:</small><br><img src="${item.image}" style="width: 120px; height: auto; border-radius: 4px;"></div>` : ''}
                    <input type="hidden" name="existing_media_url" value="${item.image || ''}">
                </div>
            `;
            break;

        case 'waves':
            fieldsHtml = `
                <div class="form-group">
                    <label>Wave Name / Topic:</label>
                    <input type="text" name="name" value="${item.name || ''}" required placeholder="e.g. Game Development (Unreal Engine)">
                </div>
                <div class="form-group">
                    <label>Wave Number:</label>
                    <input type="number" name="number" value="${item.number || ''}" required min="1">
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea name="description" rows="3">${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Display Order:</label>
                    <input type="number" name="display_order" value="${item.display_order || 0}" min="0">
                </div>
            `;
            break;

        case 'student-projects':
            fieldsHtml = `
                <div class="form-group">
                    <label>Project Title:</label>
                    <input type="text" name="title" value="${item.title || ''}" required>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea name="description" rows="3" required>${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Student Names:</label>
                    <input type="text" name="team" value="${item.team || ''}" required placeholder="e.g. Omar Rabih, Ahmed Samir">
                </div>
                <div class="form-group">
                    <label>itch.io URL (Optional):</label>
                    <input type="url" name="itch_url" value="${item.itch_url || ''}" placeholder="e.g. https://itch.io/...">
                </div>
                <div class="form-group">
                    <label>Display Order:</label>
                    <input type="number" name="display_order" value="${item.display_order || 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Project Image:</label>
                    <input type="file" name="project_image" accept="image/*">
                    ${item.image ? `<div style="margin-top:8px;"><small>Current Cover:</small><br><img src="${item.image}" style="width: 120px; height: auto; border-radius: 4px;"></div>` : ''}
                    <input type="hidden" name="existing_media_url" value="${item.image || ''}">
                </div>
            `;
            break;

        case 'gallery':
            fieldsHtml = `
                <div class="form-group">
                    <label>Media Title:</label>
                    <input type="text" name="title" value="${item.title || ''}" required>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea name="description" rows="3" required>${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Creator Name:</label>
                    <input type="text" name="creator_name" value="${item.creator_name || ''}" placeholder="e.g. Media Committee Team">
                </div>
                <div class="form-group">
                    <label>Media Type:</label>
                    <select name="media_type" required>
                        <option value="image" ${item.media_type === 'image' ? 'selected' : ''}>Image</option>
                        <option value="video" ${item.media_type === 'video' ? 'selected' : ''}>Video</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Display Order:</label>
                    <input type="number" name="display_order" value="${item.display_order || 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Media File upload (Image or Video):</label>
                    <input type="file" name="media_file" accept="image/*,video/*">
                    ${item.src ? `<div style="margin-top:8px;"><small>Current File:</small><br><a href="${item.src}" target="_blank" style="color:var(--secondary-color); font-size: 0.9rem;">View Current Media File</a></div>` : ''}
                    <input type="hidden" name="existing_media_url" value="${item.src || ''}">
                </div>
            `;
            break;
    }

    formFields.innerHTML = fieldsHtml;
}