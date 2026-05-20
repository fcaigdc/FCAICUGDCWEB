require('dotenv').config();

console.log("JWT:", process.env.JWT_SECRET);

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CREATE UPLOADS FOLDER
========================= */
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/uploads', express.static(uploadsPath));

/* =========================
   JWT MIDDLEWARE (🔥 مهم جدًا)
========================= */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 👈 هنا السحر
  } catch (err) {
    req.user = null;
  }

  next();
}

/* نخليه شغال على الـ API كله */
app.use('/api', authMiddleware);

/* =========================
   ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/admin', adminRoutes);

/* =========================
   PAGES
========================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/projects.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gallery.html'));
});


/* =========================
   ERROR HANDLING
========================= */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

/* =========================
   404
========================= */
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

/* =========================
   START SERVER
========================= */
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use, trying another dynamic port...`);
    setTimeout(() => {
      server.close();
      server.listen(0); // 0 lets the OS assign a random available port
    }, 1000);
  } else {
    console.error(e);
  }
});