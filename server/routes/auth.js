require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const multer = require('multer');
const path = require('path');
const { sendOTPEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from .env");
}

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, 'profile_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(403).json({ error: 'Invalid token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Failed to authenticate token' });
  }
};

// Register student
router.post('/register/student', async (req, res) => {
  const { name, email, password, linkedin } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (name, email, password, linkedin) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, linkedin],
      function(err) {
        if (err) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        const token = jwt.sign({ id: this.lastID, role: 'student' }, process.env.JWT_SECRET);
        res.json({ message: 'Student registered successfully', token, role: 'student', name, email, linkedin });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (user) {
      if (!user.password) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      const role = user.role;
      const token = jwt.sign({ id: user.id, role }, process.env.JWT_SECRET);
      res.json({ token, role: user.role, name: user.name, email: user.email, linkedin: user.linkedin });
    } else {
      db.get('SELECT * FROM companies WHERE email = ?', [email], async (err, company) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!company || !(await bcrypt.compare(password, company.password))) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: company.id, role: 'company' }, process.env.JWT_SECRET);
        res.json({ token, role: 'company', name: company.name, email: company.email });
      });
    }
  });
});

// Get current user profile
router.get('/profile', verifyToken, (req, res) => {
  db.get('SELECT id, name, email, role, linkedin, github, profile_image, created_at FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(user);
  });
});

// Update current user profile
router.put('/profile', verifyToken, (req, res) => {
  const { name, linkedin, github, profile_image } = req.body;
  db.run(
    'UPDATE users SET name = ?, linkedin = ?, github = ?, profile_image = COALESCE(?, profile_image) WHERE id = ?',
    [name, linkedin, github, profile_image, req.userId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      // Return updated profile data
      db.get('SELECT id, name, email, role, linkedin, github, profile_image, created_at FROM users WHERE id = ?', [req.userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(user);
      });
    }
  );
});

// Profile image upload
router.post('/profile/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  db.run('UPDATE users SET profile_image = ? WHERE id = ?', [fileUrl, req.userId], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ success: true, url: fileUrl });
  });
});

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Forgot Password - Generate OTP
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Cooldown check (1 minute)
  db.get('SELECT created_at FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1', [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (row) {
      const lastRequest = new Date(row.created_at).getTime();
      const now = new Date().getTime();
      // Wait at least 60 seconds
      if (now - lastRequest < 60000) {
        return res.status(429).json({ error: 'Please wait before requesting another OTP.' });
      }
    }

    db.get('SELECT id FROM users WHERE email = ? UNION SELECT id FROM companies WHERE email = ?', [email, email], async (err, user) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      
      if (user) {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins expiry
        
        try {
          const hashedOtp = await bcrypt.hash(otp, 10);
          db.run('INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)', 
            [email, hashedOtp, expiresAt], 
            async (err) => {
              if (err) console.error('Error saving OTP:', err);
              else {
                // Send email
                const emailResult = await sendOTPEmail(email, otp);
                if (!emailResult.success) {
                  console.error('Failed to send OTP email:', emailResult.error);
                }
              }
            }
          );
        } catch (hashErr) {
          console.error('OTP Hashing Error:', hashErr);
        }
      }
      
      // Always return success to prevent email enumeration
      res.json({ message: 'If the email exists, an OTP has been sent.' });
    });
  });
});

// 2. Verify OTP
router.post('/verify-otp', (req, res) => {
  let { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  otp = String(otp).trim();

  db.get('SELECT * FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1', 
    [email], 
    async (err, record) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      
      if (!record) return res.status(400).json({ error: 'No OTP request found for this email' });
      
      if (record.attempts >= 5) {
        return res.status(403).json({ error: 'Too many failed attempts. Please request a new OTP.' });
      }

      const now = new Date();
      const expiresAt = new Date(record.expires_at);
      
      if (now > expiresAt) return res.status(400).json({ error: 'OTP has expired' });
      
      const isValid = await bcrypt.compare(otp, record.otp);
      
      if (!isValid) {
        db.run('UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?', [record.id]);
        return res.status(400).json({ error: 'Invalid OTP' });
      }
      
      res.json({ success: true, message: 'OTP verified successfully' });
    }
  );
});

// 3. Reset Password
router.post('/reset-password', async (req, res) => {
  let { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Missing required fields' });
  otp = String(otp).trim();

  // Double check OTP validity
  db.get('SELECT * FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1', 
    [email], 
    async (err, record) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!record) return res.status(400).json({ error: 'No OTP request found' });
      
      if (record.attempts >= 5) return res.status(403).json({ error: 'Too many failed attempts. Request a new OTP.' });

      const isValid = await bcrypt.compare(otp, record.otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

      const now = new Date();
      if (now > new Date(record.expires_at)) return res.status(400).json({ error: 'OTP has expired' });
      
      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Find user to generate token
        db.get('SELECT id, role FROM users WHERE email = ?', [email], (err, user) => {
            if (user) {
              db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], function(updateErr) {
                if (updateErr) return res.status(500).json({ error: 'Server error' });
                db.run('DELETE FROM password_resets WHERE email = ?', [email]);
                
                const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
                res.json({ success: true, message: 'Password has been reset', token, role: user.role });
              });
            } else {
              // Might be a company account
              db.get('SELECT id FROM companies WHERE email = ?', [email], (err, company) => {
                  if (company) {
                    db.run('UPDATE companies SET password = ? WHERE email = ?', [hashedPassword, email], function(updateErr) {
                      if (updateErr) return res.status(500).json({ error: 'Server error' });
                      db.run('DELETE FROM password_resets WHERE email = ?', [email]);
                      
                      const token = jwt.sign({ id: company.id, role: 'company' }, JWT_SECRET, { expiresIn: '24h' });
                      res.json({ success: true, message: 'Password has been reset', token, role: 'company' });
                    });
                  } else {
                    res.status(404).json({ error: 'User not found' });
                  }
              });
            }
        });
      } catch (e) {
        res.status(500).json({ error: 'Error hashing password' });
      }
    }
  );
});

// Change current user password
router.put('/profile/password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  db.get('SELECT password FROM users WHERE id = ?', [req.userId], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.userId], function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Password changed successfully' });
    });
  });
});

// Change password route (alternative endpoint)
router.put('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  db.get('SELECT password FROM users WHERE id = ?', [req.userId], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.userId], function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Password changed successfully' });
    });
  });
});


// Get projects for current user
router.get('/my-projects', verifyToken, (req, res) => {
  const query = `
    SELECT p.*, 
           (SELECT AVG(rating) FROM ratings WHERE item_id = p.id AND item_type = 'project') as avg_rating,
           (SELECT rating FROM ratings WHERE item_id = p.id AND item_type = 'project' AND user_id = ?) as user_rating
    FROM projects p 
    WHERE p.user_id = ?
  `;
  db.all(query, [req.userId, req.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

// Add user project
router.post('/my-projects', verifyToken, (req, res) => {
  const { title, description, image, video, team } = req.body;
  db.run(
    'INSERT INTO projects (title, description, image, video, team, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, image, video, team, req.userId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID, message: 'Project created successfully' });
    }
  );
});

// Update user project
router.put('/my-projects/:id', verifyToken, (req, res) => {
  const { title, description, image, video, team } = req.body;
  db.run(
    'UPDATE projects SET title = ?, description = ?, image = ?, video = ?, team = ? WHERE id = ? AND user_id = ?',
    [title, description, image, video, team, req.params.id, req.userId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });
      res.json({ message: 'Project updated successfully' });
    }
  );
});

// Delete user project
router.delete('/my-projects/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.userId], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });
    res.json({ message: 'Project deleted successfully' });
  });
});

// Verify admin status
router.get('/verify-admin', verifyToken, (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Not admin' });
  res.json({ ok: true });
});

module.exports = router;