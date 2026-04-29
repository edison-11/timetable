-- Update teacher table to include 'pending' status
ALTER TABLE teacher MODIFY COLUMN status ENUM('pending', 'active', 'inactive', 'on_leave') DEFAULT 'pending';
