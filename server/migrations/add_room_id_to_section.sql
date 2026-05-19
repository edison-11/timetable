-- Add room_id column to section table
ALTER TABLE section ADD COLUMN room_id INT NULL;
ALTER TABLE section ADD FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE SET NULL;

-- Create index for room_id
CREATE INDEX idx_section_room ON section(room_id);
