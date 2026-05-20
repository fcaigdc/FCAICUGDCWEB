document.addEventListener('DOMContentLoaded', function() {
    console.log('Gallery script initializing');

    const lightbox = document.getElementById('lightbox-modal');
    const lightboxMedia = document.getElementById('lightbox-media-container');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-description');
    const lightboxCreator = document.getElementById('lightbox-creator');
    const closeLightboxBtn = document.getElementById('close-lightbox');

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

    // Load gallery items on page load
    loadGalleryItems();

    // Rating click listener
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

        // Submit rating to API
        await window.submitRating(id, type, val, () => {
            loadGalleryItems();
        });
    });

    async function loadGalleryItems() {
        try {
            const response = await fetch('/api/data/gallery', {
                headers: getPublicHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch gallery');
            const data = await response.json();
            const items = data.items || [];
            const grid = document.getElementById('gallery-grid');

            if (!items.length) {
                grid.innerHTML = '<p style="text-align: center; color: var(--text-color); grid-column: 1/-1;">No creative works uploaded yet.</p>';
                return;
            }

            grid.innerHTML = '';
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'gallery-card scroll-reveal';
                card.dataset.id = item.id;
                card.dataset.type = item.media_type;

                let mediaHTML = '';
                if (item.media_type === 'video') {
                    mediaHTML = `
                        <div class="gallery-media">
                            <video src="${item.src}#t=0.5" preload="metadata" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; pointer-events:none;"></video>
                            <div class="play-overlay"><i class="fas fa-play-circle"></i></div>
                        </div>
                    `;
                } else {
                    mediaHTML = `
                        <div class="gallery-media">
                            <img src="${item.src}" alt="${item.title}" loading="lazy">
                        </div>
                    `;
                }

                card.innerHTML = `
                    ${mediaHTML}
                    <div class="gallery-info">
                        <h3>${item.title}</h3>
                        <p>${item.description || 'No description available.'}</p>
                        <p class="gallery-creator"><i class="fas fa-user"></i> ${item.creator_name || 'Media Committee'}</p>
                        <div class="gallery-rating">
                            ${window.renderStars(item.user_rating, item.avg_rating, item.id, 'gallery')}
                        </div>
                    </div>
                `;

                // Card Click opens Lightbox Modal
                card.addEventListener('click', (e) => {
                    // Do not trigger lightbox if user clicked rating star
                    if (e.target.closest('.stars.interactive')) return;

                    openLightbox(item);
                });

                grid.appendChild(card);
            });

            // Re-observe newly added cards for scroll reveal
            if (window.revealObserver) {
                grid.querySelectorAll('.gallery-card').forEach(card => {
                    window.revealObserver.observe(card);
                });
            }

        } catch (error) {
            console.error('Error loading gallery items:', error);
            const grid = document.getElementById('gallery-grid');
            if (grid) grid.innerHTML = '<p style="text-align: center; color: red; grid-column: 1/-1;">Failed to load gallery items.</p>';
        }
    }

    // Lightbox modal functionality
    function openLightbox(item) {
        if (!lightbox) return;

        lightboxMedia.innerHTML = '';
        if (item.media_type === 'video') {
            lightboxMedia.innerHTML = `
                <video src="${item.src}" controls autoplay style="width: 100%; max-height: 60vh; border-radius: 12px 12px 0 0;"></video>
            `;
        } else {
            lightboxMedia.innerHTML = `
                <img src="${item.src}" alt="${item.title}">
            `;
        }

        lightboxTitle.textContent = item.title;
        lightboxDesc.textContent = item.description || '';
        lightboxCreator.innerHTML = `<i class="fas fa-user"></i> Creator: ${item.creator_name || 'Media Committee'}`;

        lightbox.style.display = 'flex';
        document.body.classList.add('no-scroll');

        // Capture ESC to close
        document.addEventListener('keydown', escHandler);
    }

    function closeLightbox() {
        if (!lightbox) return;
        // Stop playing video if active
        lightboxMedia.innerHTML = '';
        lightbox.style.display = 'none';
        document.body.classList.remove('no-scroll');
        document.removeEventListener('keydown', escHandler);
    }

    function escHandler(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    }

    if (closeLightboxBtn) {
        closeLightboxBtn.addEventListener('click', closeLightbox);
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content') === false && e.target.closest('.lightbox-content') === null) {
                closeLightbox();
            }
        });
    }
});