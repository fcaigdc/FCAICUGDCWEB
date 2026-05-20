const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const db = require('../../database/db');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

/* ==========================================================================
   TEAM MEMBERS CRUD
   ========================================================================== */
router.post('/team', verifyToken, (req, res) => {
  const { name, committee, linkedin, image, details } = req.body;
  db.run(
    'INSERT INTO team_members (name, committee, linkedin, image, details) VALUES (?, ?, ?, ?, ?)',
    [name, committee, linkedin, image, details],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID });
    }
  );
});

router.put('/team/:id', verifyToken, (req, res) => {
  const { name, committee, linkedin, image, details } = req.body;
  db.run(
    'UPDATE team_members SET name = ?, committee = ?, linkedin = ?, image = ?, details = ? WHERE id = ?',
    [name, committee, linkedin, image, details, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

router.delete('/team/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM team_members WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Deleted successfully' });
  });
});

/* ==========================================================================
   PARTNERS CRUD (NEW)
   ========================================================================== */
router.post('/partners', verifyToken, (req, res) => {
  const { name, logo_url, website_url, display_order } = req.body;
  db.run(
    'INSERT INTO partners (name, logo_url, website_url, display_order) VALUES (?, ?, ?, ?)',
    [name, logo_url, website_url, display_order || 0],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID });
    }
  );
});

router.put('/partners/:id', verifyToken, (req, res) => {
  const { name, logo_url, website_url, display_order } = req.body;
  db.run(
    'UPDATE partners SET name = ?, logo_url = ?, website_url = ?, display_order = ? WHERE id = ?',
    [name, logo_url, website_url, display_order || 0, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

router.delete('/partners/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM partners WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Deleted successfully' });
  });
});

/* ==========================================================================
   COMMUNITY GAMES CRUD (NEW)
   ========================================================================== */
router.post('/community-games', verifyToken, (req, res) => {
  const { title, description, image, team, itch_url, display_order } = req.body;
  db.run(
    'INSERT INTO community_games (title, description, image, team, itch_url, display_order) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, image, team, itch_url, display_order || 0],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID });
    }
  );
});

router.put('/community-games/:id', verifyToken, (req, res) => {
  const { title, description, image, team, itch_url, display_order } = req.body;
  db.run(
    'UPDATE community_games SET title = ?, description = ?, image = ?, team = ?, itch_url = ?, display_order = ? WHERE id = ?',
    [title, description, image, team, itch_url, display_order || 0, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

router.delete('/community-games/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM community_games WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Deleted successfully' });
  });
});

/* ==========================================================================
   STUDENT WAVES CRUD (NEW)
   ========================================================================== */
router.post('/waves', verifyToken, (req, res) => {
  const { name, number, description, display_order } = req.body;
  db.run(
    'INSERT INTO waves (name, number, description, display_order) VALUES (?, ?, ?, ?)',
    [name, number, description, display_order || 0],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID });
    }
  );
});

router.put('/waves/:id', verifyToken, (req, res) => {
  const { name, number, description, display_order } = req.body;
  db.run(
    'UPDATE waves SET name = ?, number = ?, description = ?, display_order = ? WHERE id = ?',
    [name, number, description, display_order || 0, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

router.delete('/waves/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM waves WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Deleted successfully' });
  });
});

/* ==========================================================================
   WAVE STUDENT PROJECTS CRUD (NEW)
   ========================================================================== */
router.post('/waves/:waveId/projects', verifyToken, (req, res) => {
  const { title, description, image, team, itch_url, display_order } = req.body;
  const waveId = req.params.waveId;
  db.run(
    'INSERT INTO student_projects (wave_id, title, description, image, team, itch_url, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [waveId, title, description, image, team, itch_url, display_order || 0],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID });
    }
  );
});

router.put('/waves/:waveId/projects/:id', verifyToken, (req, res) => {
  const { title, description, image, team, itch_url, display_order } = req.body;
  const { waveId, id } = req.params;
  db.run(
    'UPDATE student_projects SET title = ?, description = ?, image = ?, team = ?, itch_url = ?, display_order = ? WHERE id = ? AND wave_id = ?',
    [title, description, image, team, itch_url, display_order || 0, id, waveId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

router.delete('/waves/:waveId/projects/:id', verifyToken, (req, res) => {
  const { waveId, id } = req.params;
  db.run('DELETE FROM student_projects WHERE id = ? AND wave_id = ?', [id, waveId], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Deleted successfully' });
  });
});

/* ==========================================================================
   STATISTICS CRUD
   ========================================================================== */
router.put('/statistics', verifyToken, (req, res) => {
  const { students_count, graduates_count, projects_count } = req.body;
  db.run(
    'UPDATE statistics SET students_count = ?, graduates_count = ?, projects_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [students_count, graduates_count, projects_count],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Statistics updated' });
    }
  );
});

/* ==========================================================================
   GALLERY CRUD
   ========================================================================== */
router.post('/gallery', verifyToken, (req, res) => {
  const { title, description, src, media_type, creator_name, display_order } = req.body;
  db.run(
    'INSERT INTO gallery_items (title, description, src, media_type, creator_name, display_order) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, src, media_type, creator_name, display_order || 0],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID });
    }
  );
});

router.put('/gallery/:id', verifyToken, (req, res) => {
  const { title, description, src, media_type, creator_name, display_order } = req.body;
  db.run(
    'UPDATE gallery_items SET title = ?, description = ?, src = ?, media_type = ?, creator_name = ?, display_order = ? WHERE id = ?',
    [title, description, src, media_type, creator_name, display_order || 0, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

router.delete('/gallery/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM gallery_items WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Deleted successfully' });
  });
});

/* ==========================================================================
   YOUTUBE VIDEOS CRUD
   ========================================================================== */
router.post('/youtube', verifyToken, (req, res) => {
  const { title, youtube_url, thumbnail } = req.body;
  db.run(
    'INSERT INTO youtube_videos (title, youtube_url, thumbnail) VALUES (?, ?, ?)',
    [title, youtube_url, thumbnail],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID });
    }
  );
});

router.put('/youtube/:id', verifyToken, (req, res) => {
  const { title, youtube_url, thumbnail } = req.body;
  db.run(
    'UPDATE youtube_videos SET title = ?, youtube_url = ?, thumbnail = ? WHERE id = ?',
    [title, youtube_url, thumbnail, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

router.delete('/youtube/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM youtube_videos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Deleted successfully' });
  });
});

/* ==========================================================================
   SITE SETTINGS CRUD
   ========================================================================== */
router.put('/site-settings', verifyToken, (req, res) => {
  const updates = req.body;
  const promises = Object.keys(updates).map(key => {
    const value = updates[key];
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO site_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  Promise.all(promises)
    .then(() => res.json({ message: 'Site settings updated' }))
    .catch(err => res.status(500).json({ error: 'Server error' }));
});

/* ==========================================================================
   FILE UPLOAD ROUTE
   ========================================================================== */
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    message: 'Uploaded successfully',
    url: fileUrl
  });
});

// Multer error handler for upload route
router.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, error: 'Unexpected file upload field' });
  }
  if (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Upload failed' });
  }
  next();
});

module.exports = router;