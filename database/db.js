const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'club.db');
const db = new sqlite3.Database(dbPath);
console.log("DB PATH =>", dbPath);

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'student',
    linkedin TEXT,
    github TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add github column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE users ADD COLUMN github TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding github column:', err);
    }
  });

  // Add profile_image column to users
  db.run(`ALTER TABLE users ADD COLUMN profile_image TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding profile_image column:', err);
    }
  });

  // Add user_id column to projects
  db.run(`ALTER TABLE projects ADD COLUMN user_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding user_id column to projects:', err);
    }
  });

  // Enrollments table
  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(user_id, course_id)
  )`);

  // Password Resets table
  db.run(`CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`ALTER TABLE password_resets ADD COLUMN attempts INTEGER DEFAULT 0`, (err) => {
    // Ignore duplicate column name error
  });

  // Team members table
  db.run(`CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    committee TEXT,
    linkedin TEXT,
    image TEXT,
    details TEXT
  )`);

  // Courses table
  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image TEXT,
    video TEXT,
    creator TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image TEXT,
    video TEXT,
    team TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Gallery items table
  db.run(`CREATE TABLE IF NOT EXISTS gallery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    src TEXT,
    media_type TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Migration: Add creator_name to gallery_items
  db.run(`ALTER TABLE gallery_items ADD COLUMN creator_name TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding creator_name column to gallery_items:', err);
    }
  });

  // Partners table
  db.run(`CREATE TABLE IF NOT EXISTS partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Community games table
  db.run(`CREATE TABLE IF NOT EXISTS community_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    team TEXT,
    itch_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Waves table
  db.run(`CREATE TABLE IF NOT EXISTS waves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Student projects table
  db.run(`CREATE TABLE IF NOT EXISTS student_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wave_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    team TEXT,
    itch_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(wave_id) REFERENCES waves(id) ON DELETE CASCADE
  )`);

  // YouTube videos table
  db.run(`CREATE TABLE IF NOT EXISTS youtube_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    youtube_url TEXT,
    thumbnail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Site settings table
  db.run(`CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // Statistics table
  db.run(`CREATE TABLE IF NOT EXISTS statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    students_count INTEGER DEFAULT 0,
    graduates_count INTEGER DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add projects_count column if it doesn't exist (migration)
  db.run(`ALTER TABLE statistics ADD COLUMN projects_count INTEGER DEFAULT 0`, (err) => {
    // Ignore error if column already exists
  });

  // Ratings table
  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id, item_type)
  )`);

  // Insert default statistics if not exists
  db.get("SELECT COUNT(*) as count FROM statistics", (err, row) => {
    if (row && row.count === 0) {
      db.run("INSERT INTO statistics (students_count, graduates_count, projects_count) VALUES (120, 35, 25)");
    }
  });

  // Create default admin if it does not exist (only if there are no admins in the database)
db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", (err, row) => {
  if (row && row.count === 0) {
    const adminPassword = bcrypt.hashSync('admin123', 10);

    db.run(
      'INSERT INTO users (name, email, password, role, linkedin) VALUES (?, ?, ?, ?, ?)',
      ['Admin', 'admin@admin.com', adminPassword, 'admin', 'https://www.linkedin.com']
    );
  }
});

  // Seed gallery items if empty
  db.get('SELECT COUNT(*) AS count FROM gallery_items', (err, row) => {
    if (row && row.count === 0) {
      const seedItems = [
        {
          title: 'Motion Design Showcase',
          description: 'High energy visual design to support game campaigns.',
          src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?fit=crop&w=900&q=80',
          media_type: 'image'
        },
        {
          title: 'Concept Art Reel',
          description: 'Inspiration from our art team and mood board sessions.',
          src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?fit=crop&w=900&q=80',
          media_type: 'image'
        },
        {
          title: 'Project Trailer',
          description: 'A short highlight reel from our current projects.',
          src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          media_type: 'video'
        }
      ];
      seedItems.forEach((item, idx) => {
        db.run(
          'INSERT INTO gallery_items (title, description, src, media_type, display_order) VALUES (?, ?, ?, ?, ?)',
          [item.title, item.description, item.src, item.media_type, idx]
        );
      });
    }
  });

  // Seed site settings if empty
  db.get("SELECT COUNT(*) AS count FROM site_settings", (err, row) => {
    if (row && row.count === 0) {
      const defaultSettings = [
        { key: 'footer_email', value: 'fcaigamedevclub@gmail.com' },
        { key: 'footer_phone', value: '+20 102 046 8877' },
        { key: 'testimonial_text', value: 'Default testimonial text' },
        { key: 'testimonial_author', value: 'Default author' },
        { key: 'testimonial_video', value: '' }
      ];
      defaultSettings.forEach((setting) => {
        db.run('INSERT INTO site_settings (key, value) VALUES (?, ?)', [setting.key, setting.value]);
      });
    }
  });

  // Seed team members if empty
  db.get("SELECT COUNT(*) AS count FROM team_members", (err, row) => {
  if (row && row.count === 0) {
    const members = [
      {
        name: 'Omar Abdelaziz',
        committee: 'Vice Head',
        linkedin: 'https://www.linkedin.com/in/omar-abdelaziz-bb3842337',
        image: '/assets/images/team/omar.webp',
        details: 'Vice head of the club.'
      },
      {
        name: 'Mohamed Mostafa',
        committee: 'Community Lead',
        linkedin: 'https://www.linkedin.com',
        image: '/assets/images/team/mohamed.webp',
        details: 'Community lead.'
      }
    ];

    members.forEach(member => {
      db.run(
        `INSERT INTO team_members (name, committee, linkedin, image, details) VALUES (?, ?, ?, ?, ?)`,
        [member.name, member.committee, member.linkedin, member.image, member.details]
      );
    });
  }
});
});



module.exports = db;