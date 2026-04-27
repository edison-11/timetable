const express = require('express');
const { body, validationResult } = require('express-validator');
const Timetable = require('../models/Timetable');
const Schedule = require('../models/Schedule');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create timetable
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('days').isArray({ min: 1 }).withMessage('At least one day is required'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('subject').trim().notEmpty().withMessage('Subject is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, days, start_time, end_time, subject } = req.body;

    // Check for conflicts
    const conflicts = await Timetable.getConflicts(req.user.id, days, start_time, end_time);
    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Time conflict detected', conflicts });
    }

    const timetableId = await Timetable.create({
      title,
      description,
      user_id: req.user.id,
      days,
      start_time,
      end_time,
      subject
    });

    const timetable = await Timetable.getById(timetableId);

    res.status(201).json({
      message: 'Timetable created successfully',
      timetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all timetables
router.get('/', auth, async (req, res) => {
  try {
    const timetables = req.user.role === 'admin' 
      ? await Timetable.getAll()
      : await Timetable.getByUserId(req.user.id);

    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single timetable
router.get('/:id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.getById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    if (req.user.role !== 'admin' && timetable.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const schedules = await Schedule.getByTimetableId(req.params.id);

    res.json({ timetable, schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update timetable
router.put('/:id', auth, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('days').optional().isArray({ min: 1 }),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('subject').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const timetable = await Timetable.getById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    if (req.user.role !== 'admin' && timetable.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { days, start_time, end_time } = req.body;
    
    // Check for conflicts if time-related fields are being updated
    if (days && start_time && end_time) {
      const conflicts = await Timetable.getConflicts(
        req.user.id, 
        days, 
        start_time, 
        end_time, 
        req.params.id
      );
      if (conflicts.length > 0) {
        return res.status(400).json({ message: 'Time conflict detected', conflicts });
      }
    }

    await Timetable.update(req.params.id, req.body);
    const updatedTimetable = await Timetable.getById(req.params.id);

    res.json({
      message: 'Timetable updated successfully',
      timetable: updatedTimetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete timetable
router.delete('/:id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.getById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    if (req.user.role !== 'admin' && timetable.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Schedule.deleteByTimetableId(req.params.id);
    await Timetable.delete(req.params.id);

    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
