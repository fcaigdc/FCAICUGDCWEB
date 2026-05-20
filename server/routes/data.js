const express = require('express');
const db = require('../../database/db');

const router = express.Router();

/* =========================
   TEAM (PUBLIC)
========================= */
router.get('/team', (req, res) => {
  db.all('SELECT * FROM team_members', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

/* =========================
   PARTNERS (PUBLIC - NEW)
========================= */
router.get('/partners', (req, res) => {
  db.all('SELECT * FROM partners ORDER BY display_order ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

/* =========================
   COMMUNITY GAMES (PUBLIC - NEW)
========================= */
router.get('/community-games', (req, res) => {
  const userId = req.user?.id || req.headers['x-visitor-id'] || req.query.visitor_id || '0';
  db.all(`
    SELECT g.*,
           (SELECT AVG(rating) FROM ratings WHERE item_id = g.id AND item_type = 'community_game') as avg_rating,
           (SELECT rating FROM ratings WHERE item_id = g.id AND item_type = 'community_game' AND user_id = ?) as user_rating
    FROM community_games g
    ORDER BY g.display_order ASC
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

/* =========================
   STUDENT WAVES & PROJECTS (PUBLIC - NEW)
========================= */
router.get('/waves', (req, res) => {
  const userId = req.user?.id || req.headers['x-visitor-id'] || req.query.visitor_id || '0';
  db.all('SELECT * FROM waves ORDER BY display_order ASC, number ASC', (err, waves) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!waves || !waves.length) return res.json([]);
    
    let completed = 0;
    waves.forEach(wave => {
      db.all(`
        SELECT p.*,
               (SELECT AVG(rating) FROM ratings WHERE item_id = p.id AND item_type = 'student_project') as avg_rating,
               (SELECT rating FROM ratings WHERE item_id = p.id AND item_type = 'student_project' AND user_id = ?) as user_rating
        FROM student_projects p
        WHERE p.wave_id = ?
        ORDER BY p.display_order ASC
      `, [userId, wave.id], (err, projects) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        wave.projects = projects || [];
        completed++;
        if (completed === waves.length) {
          res.json(waves);
        }
      });
    });
  });
});

router.get('/waves/:id/projects', (req, res) => {
  const userId = req.user?.id || req.headers['x-visitor-id'] || req.query.visitor_id || '0';
  db.all(`
    SELECT p.*,
           (SELECT AVG(rating) FROM ratings WHERE item_id = p.id AND item_type = 'student_project') as avg_rating,
           (SELECT rating FROM ratings WHERE item_id = p.id AND item_type = 'student_project' AND user_id = ?) as user_rating
    FROM student_projects p
    WHERE p.wave_id = ?
    ORDER BY p.display_order ASC
  `, [userId, req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

/* =========================
   PROJECTS (PUBLIC - BACKWARD COMPATIBILITY)
========================= */
router.get('/projects', (req, res) => {
  const userId = req.user?.id || req.headers['x-visitor-id'] || req.query.visitor_id || '0';
  db.all(`
    SELECT projects.*, 
           (SELECT AVG(rating) FROM ratings WHERE item_id = projects.id AND item_type = 'project') as avg_rating,
           (SELECT rating FROM ratings WHERE item_id = projects.id AND item_type = 'project' AND user_id = ?) as user_rating
    FROM projects
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

/* =========================
   STATISTICS (PUBLIC)
========================= */
router.get('/statistics', (req, res) => {
  db.get('SELECT * FROM statistics ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(row);
  });
});

/* =========================
   RATE ITEM (ANONYMOUS & JWT MULTI-AUTH)
========================= */
router.post('/rate', (req, res) => {
  const userId = req.user?.id || req.body.visitor_id || req.headers['x-visitor-id'];
  const { itemId, itemType, rating } = req.body;

  if (!userId) return res.status(400).json({ error: 'Rater identifier (visitor_id or JWT) is required' });
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating' });

  db.run(
    `INSERT INTO ratings (user_id, item_id, item_type, rating) 
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, item_id, item_type) DO UPDATE SET rating = excluded.rating`,
    [String(userId), itemId, itemType, rating],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ success: true });
    }
  );
});

/* =========================
   GALLERY (PUBLIC)
========================= */
router.get('/gallery', (req, res) => {
  const userId = req.user?.id || req.headers['x-visitor-id'] || req.query.visitor_id || '0';
  db.all(`
    SELECT gallery_items.*, 
           (SELECT AVG(rating) FROM ratings WHERE item_id = gallery_items.id AND item_type = 'gallery') as avg_rating,
           (SELECT rating FROM ratings WHERE item_id = gallery_items.id AND item_type = 'gallery' AND user_id = ?) as user_rating
    FROM gallery_items 
    ORDER BY display_order ASC
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ items: rows });
  });
});

/* =========================
   YOUTUBE (PUBLIC)
========================= */
router.get('/youtube', (req, res) => {
  db.all('SELECT * FROM youtube_videos', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

/* =========================
   SITE SETTINGS (PUBLIC)
========================= */
router.get('/site-settings', (req, res) => {
  db.all('SELECT * FROM site_settings', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    const settingsObj = {};
    rows.forEach(row => {
      settingsObj[row.key] = row.value;
    });
    res.json(settingsObj);
  });
});

module.exports = router;