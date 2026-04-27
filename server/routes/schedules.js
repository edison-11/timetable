const express = require('express');
const { body, validationResult } = require('express-validator');
const Schedule = require('../models/Schedule');
const Timetable = require('../models/Timetable');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create schedule item
router.post('/', auth, [
  body('timetable_id').isInt().withMessage('Valid timetable ID is required'),
  body('day_of_week').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Invalid day of week'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('room').optional().trim(),
  body('teacher').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { timetable_id, day_of_week, start_time, end_time, subject, room, teacher } = req.body;

    // Check if timetable exists and user has access
    const timetable = await Timetable.getById(timetable_id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    if (req.user.role !== 'admin' && timetable.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check for conflicts
    const conflicts = await Schedule.getConflicts(timetable_id, day_of_week, start_time, end_time);
    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Time conflict detected', conflicts });
    }

    const scheduleId = await Schedule.create({
      timetable_id,
      day_of_week,
      start_time,
      end_time,
      subject,
      room,
      teacher
    });

    const schedules = await Schedule.getByTimetableId(timetable_id);
    const newSchedule = schedules.find(s => s.id === scheduleId);

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule: newSchedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get schedules for a timetable
router.get('/timetable/:timetable_id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.getById(req.params.timetable_id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    if (req.user.role !== 'admin' && timetable.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const schedules = await Schedule.getByTimetableId(req.params.timetable_id);

    res.json({ schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update schedule
router.put('/:id', auth, [
  body('day_of_week').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('subject').optional().trim().notEmpty(),
  body('room').optional().trim(),
  body('teacher').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get current schedule to check timetable access
    const schedules = await Schedule.getByTimetableId(1); // We'll need to modify this to get schedule by ID
    const currentSchedule = schedules.find(s => s.id == req.params.id);
    
    if (!currentSchedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const timetable = await Timetable.getById(currentSchedule.timetable_id);
    if (req.user.role !== 'admin' && timetable.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { day_of_week, start_time, end_time } = req.body;
    
    // Check for conflicts if time-related fields are being updated
    if (day_of_week && start_time && end_time) {
      const conflicts = await Schedule.getConflicts(
        currentSchedule.timetable_id,
        day_of_week,
        start_time,
        end_time,
        req.params.id
      );
      if (conflicts.length > 0) {
        return res.status(400).json({ message: 'Time conflict detected', conflicts });
      }
    }

    await Schedule.update(req.params.id, req.body);
    
    const updatedSchedules = await Schedule.getByTimetableId(currentSchedule.timetable_id);
    const updatedSchedule = updatedSchedules.find(s => s.id == req.params.id);

    res.json({
      message: 'Schedule updated successfully',
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete schedule
router.delete('/:id', auth, async (req, res) => {
  try {
    // Get current schedule to check timetable access
    const schedules = await Schedule.getByTimetableId(1); // We'll need to modify this to get schedule by ID
    const currentSchedule = schedules.find(s => s.id == req.params.id);
    
    if (!currentSchedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const timetable = await Timetable.getById(currentSchedule.timetable_id);
    if (req.user.role !== 'admin' && timetable.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Schedule.delete(req.params.id);

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
