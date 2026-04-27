const express = require('express');
const { body, validationResult } = require('express-validator');
const Room = require('../models/Room');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create room
router.post('/', auth, [
  body('room_name').trim().notEmpty().withMessage('Room name is required'),
  body('room_type').trim().notEmpty().withMessage('Room type is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room_name, room_type, capacity } = req.body;

    const roomId = await Room.create({ room_name, room_type, capacity });
    const room = await Room.findById(roomId);

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.getAll();
    res.json({ rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rooms by type
router.get('/type/:room_type', auth, async (req, res) => {
  try {
    const rooms = await Room.getByType(req.params.room_type);
    res.json({ rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available rooms for specific time and day
router.get('/available', auth, async (req, res) => {
  try {
    const { start_time, end_time, day_of_week } = req.query;
    
    if (!start_time || !end_time || !day_of_week) {
      return res.status(400).json({ message: 'start_time, end_time, and day_of_week are required' });
    }

    const rooms = await Room.getAvailableRooms(start_time, end_time, day_of_week);
    res.json({ rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room usage statistics
router.get('/:id/usage', auth, async (req, res) => {
  try {
    const usage = await Room.getRoomUsage(req.params.id);
    res.json({ usage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room
router.put('/:id', auth, [
  body('room_name').optional().trim().notEmpty(),
  body('room_type').optional().trim().notEmpty(),
  body('capacity').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room_name, room_type, capacity } = req.body;
    const updateData = {};
    
    if (room_name) updateData.room_name = room_name;
    if (room_type) updateData.room_type = room_type;
    if (capacity) updateData.capacity = capacity;

    await Room.update(req.params.id, updateData);
    const updatedRoom = await Room.findById(req.params.id);

    res.json({
      message: 'Room updated successfully',
      room: updatedRoom
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete room
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await Room.delete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
