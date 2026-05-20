const db = require('./database/db');

// Insert sample data
db.serialize(() => {
  // Start transaction for atomicity and significant performance boost in SQLite
  db.run('BEGIN TRANSACTION');

  // Sample team members
  const teamMembers = [
    { name: 'Ahmed Mohamed', committee: 'President', linkedin: 'https://linkedin.com/in/ahmed', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=600&q=80', details: 'Experienced game developer with 5+ years in Unity.' },
    { name: 'Sara Ali', committee: 'Vice President', linkedin: 'https://linkedin.com/in/sara', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=600&q=80', details: 'Graphic designer specializing in game art.' },
    { name: 'Mohamed Hassan', committee: 'Technical Lead', linkedin: 'https://linkedin.com/in/mohamed', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=600&q=80', details: 'Full-stack developer and Unreal Engine expert.' },
    { name: 'Fatima Omar', committee: 'Marketing', linkedin: 'https://linkedin.com/in/fatima', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=600&q=80', details: 'Digital marketing specialist for gaming communities.' },
    { name: 'Omar Khaled', committee: 'Events', linkedin: 'https://linkedin.com/in/omar', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=600&q=80', details: 'Event organizer with experience in game jams.' }
  ];

  teamMembers.forEach(member => {
    db.run(
      'INSERT OR IGNORE INTO team_members (name, committee, linkedin, image, details) VALUES (?, ?, ?, ?, ?)',
      [member.name, member.committee, member.linkedin, member.image, member.details]
    );
  });

  // Sample courses
  const courses = [
    { title: 'Unity Game Development Basics', description: 'Learn the fundamentals of Unity engine.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?fit=crop&w=600&q=80', video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', creator: 'Ahmed Mohamed' },
    { title: 'Advanced Unreal Engine', description: 'Master advanced features of Unreal Engine.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?fit=crop&w=600&q=80', video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', creator: 'Mohamed Hassan' },
    { title: 'Game Design Principles', description: 'Understand core game design concepts.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?fit=crop&w=600&q=80', video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', creator: 'Sara Ali' }
  ];

  courses.forEach(course => {
    db.run(
      'INSERT OR IGNORE INTO courses (title, description, image, video, creator) VALUES (?, ?, ?, ?, ?)',
      [course.title, course.description, course.image, course.video, course.creator]
    );
  });

  // Sample projects
  const projects = [
    { title: 'Adventure Quest', description: 'A 2D adventure game built with Unity.', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?fit=crop&w=600&q=80', video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', team: 'Ahmed & Team' },
    { title: 'Racing Simulator', description: 'Realistic racing game with physics.', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?fit=crop&w=600&q=80', video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', team: 'Mohamed & Team' },
    { title: 'Puzzle Master', description: 'Mind-bending puzzle game.', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?fit=crop&w=600&q=80', video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', team: 'Sara & Team' }
  ];

  projects.forEach(project => {
    db.run(
      'INSERT OR IGNORE INTO projects (title, description, image, video, team) VALUES (?, ?, ?, ?, ?)',
      [project.title, project.description, project.image, project.video, project.team]
    );
  });

  // Sample gallery items
  const galleryItems = [
    { title: 'Game Character Design', description: 'Original character concept for RPG game', src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?fit=crop&w=600&q=80', media_type: 'image', display_order: 1 },
    { title: 'UI Mockup', description: 'Modern game interface design', src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?fit=crop&w=600&q=80', media_type: 'image', display_order: 2 },
    { title: '3D Environment', description: 'Fantasy world scene', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=600&q=80', media_type: 'image', display_order: 3 },
    { title: 'Animation Demo', description: 'Character animation showcase', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', media_type: 'video', display_order: 4 },
    { title: 'Concept Art', description: 'Sci-fi vehicle design', src: 'https://images.unsplash.com/photo-1519659523062-9284ea6d840e?fit=crop&w=600&q=80', media_type: 'image', display_order: 5 },
    { title: 'Game Trailer', description: 'Short promotional video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', media_type: 'video', display_order: 6 }
  ];

  galleryItems.forEach(item => {
    db.run(
      'INSERT OR IGNORE INTO gallery_items (title, description, src, media_type, display_order) VALUES (?, ?, ?, ?, ?)',
      [item.title, item.description, item.src, item.media_type, item.display_order]
    );
  });

  db.run('COMMIT', (err) => {
    if (err) {
      console.error('Transaction failed, rolling back:', err);
      db.run('ROLLBACK');
    } else {
      console.log('Sample data inserted successfully');
    }
  });
});