const pool = require('../config/database');

async function addClassRoom() {
  const [columns] = await pool.query("SHOW COLUMNS FROM class LIKE 'room_id'");

  if (columns.length === 0) {
    await pool.query('ALTER TABLE class ADD COLUMN room_id INT NULL AFTER section_id');
    await pool.query('ALTER TABLE class ADD CONSTRAINT fk_class_room FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE SET NULL');
    await pool.query('CREATE INDEX idx_class_room ON class(room_id)');
    console.log('room_id column added to class');
  } else {
    console.log('class.room_id column already exists');
  }
}

addClassRoom()
  .then(() => {
    console.log('Class room migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
