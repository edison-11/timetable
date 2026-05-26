const pool = require('../config/database');

async function addModuleRequiredRoomType() {
  const [columns] = await pool.query("SHOW COLUMNS FROM module LIKE 'required_room_type'");

  if (columns.length === 0) {
    await pool.query(
      'ALTER TABLE module ADD COLUMN required_room_type VARCHAR(50) NULL AFTER description'
    );
    console.log('Added required_room_type column to module table');
  } else {
    console.log('required_room_type column already exists on module table');
  }
}

addModuleRequiredRoomType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error adding required_room_type column:', error);
    process.exit(1);
  });
