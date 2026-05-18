const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../timetable.db');

// SQLite schema adapted from MySQL schema
const schema = `
-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role TEXT DEFAULT 'student' CHECK(role IN ('admin', 'teacher', 'student')),
  profile_photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Director of Studies table
CREATE TABLE IF NOT EXISTS dos (
  dos_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teacher table
CREATE TABLE IF NOT EXISTS teacher (
  teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(50) NOT NULL DEFAULT 'SSOD',
  school_code VARCHAR(100) DEFAULT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('pending', 'active', 'inactive', 'on_leave')),
  date_joined DATE,
  profile_photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Module table
CREATE TABLE IF NOT EXISTS module (
  module_id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_name VARCHAR(255) NOT NULL,
  department VARCHAR(50) NOT NULL DEFAULT 'SSOD',
  hours_per_year INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shift table
CREATE TABLE IF NOT EXISTS shift (
  shift_id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  teacher_changeover_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Section table
CREATE TABLE IF NOT EXISTS section (
  section_id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_name VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class table
CREATE TABLE IF NOT EXISTS class (
  class_id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_name VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  class_teacher_id INTEGER,
  shift_id INTEGER,
  dos_id INTEGER,
  section_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_teacher_id) REFERENCES teacher(teacher_id) ON DELETE SET NULL,
  FOREIGN KEY (shift_id) REFERENCES shift(shift_id) ON DELETE SET NULL,
  FOREIGN KEY (dos_id) REFERENCES dos(dos_id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES section(section_id) ON DELETE SET NULL
);

-- Room table
CREATE TABLE IF NOT EXISTS room (
  room_id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_name VARCHAR(50) NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignment table
CREATE TABLE IF NOT EXISTS assignment (
  assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES class(class_id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES module(module_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teacher(teacher_id) ON DELETE CASCADE
);

-- Break time table
CREATE TABLE IF NOT EXISTS break_time (
  break_id INTEGER PRIMARY KEY AUTOINCREMENT,
  break_name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
  timetable_id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES class(class_id) ON DELETE CASCADE
);

-- Timetable entries table
CREATE TABLE IF NOT EXISTS timetable_entry (
  entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  timetable_id INTEGER NOT NULL,
  day_of_week VARCHAR(20) NOT NULL,
  period_number INTEGER NOT NULL,
  assignment_id INTEGER,
  room_id INTEGER,
  shift_id INTEGER,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (timetable_id) REFERENCES timetable(timetable_id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignment(assignment_id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE SET NULL,
  FOREIGN KEY (shift_id) REFERENCES shift(shift_id) ON DELETE SET NULL
);

-- Timetable comments table
CREATE TABLE IF NOT EXISTS timetable_comment (
  comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  timetable_id INTEGER NOT NULL,
  user_id INTEGER,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (timetable_id) REFERENCES timetable(timetable_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Notification table
CREATE TABLE IF NOT EXISTS notification (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  path VARCHAR(255) DEFAULT '/dashboard',
  tone VARCHAR(20) DEFAULT 'blue',
  recipient_role VARCHAR(50) DEFAULT 'all',
  recipient_id INTEGER NULL,
  school_code VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_setting (
  setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pending teachers table
CREATE TABLE IF NOT EXISTS pending_teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(50) DEFAULT 'SSOD',
  date_joined DATE,
  profile_photo VARCHAR(255),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Failed to open database:', err);
        reject(err);
        return;
      }

      console.log('✅ Database file opened/created');

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('❌ Failed to enable foreign keys:', err);
          reject(err);
          return;
        }

        // Split schema into individual statements
        const statements = schema
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt && !stmt.startsWith('--'));

        let completed = 0;

        statements.forEach((statement, index) => {
          db.run(statement, (err) => {
            if (err) {
              console.error(`❌ Error executing statement ${index + 1}:`, err);
              reject(err);
              return;
            }
            completed++;
            console.log(`✓ Created table/index ${completed}/${statements.length}`);

            if (completed === statements.length) {
              console.log('✅ All tables created successfully');
              db.close((err) => {
                if (err) reject(err);
                else resolve();
              });
            }
          });
        });
      });
    });
  });
}

// Run initialization
initDatabase()
  .then(() => {
    console.log('✅ Database initialization completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  });
