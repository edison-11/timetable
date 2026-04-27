const express = require('express');
const { body, validationResult } = require('express-validator');
const TimetableEntry = require('../models/TimetableEntry');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create timetable entry
router.post('/', auth, [
  body('class_id').isInt().withMessage('Valid class ID is required'),
  body('assignment_id').isInt().withMessage('Valid assignment ID is required'),
  body('day_of_week').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Invalid day of week'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('room_id').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id } = req.body;

    // Check for class conflicts
    const classConflicts = await TimetableEntry.getConflicts(class_id, day_of_week, start_time, end_time);
    if (classConflicts.length > 0) {
      return res.status(400).json({ message: 'Class time conflict detected', conflicts: classConflicts });
    }

    // Check teacher conflicts
    const assignment = await require('../models/Assignment').findById(assignment_id);
    if (assignment) {
      const teacherConflicts = await TimetableEntry.getTeacherConflicts(assignment.teacher_id, day_of_week, start_time, end_time);
      if (teacherConflicts.length > 0) {
        return res.status(400).json({ message: 'Teacher time conflict detected', conflicts: teacherConflicts });
      }
    }

    // Check room conflicts if room is specified
    if (room_id) {
      const roomConflicts = await TimetableEntry.getRoomConflicts(room_id, day_of_week, start_time, end_time);
      if (roomConflicts.length > 0) {
        return res.status(400).json({ message: 'Room time conflict detected', conflicts: roomConflicts });
      }
    }

    const timetableId = await TimetableEntry.create({ class_id, assignment_id, day_of_week, start_time, end_time, room_id });
    const timetable = await TimetableEntry.findById(timetableId);

    res.status(201).json({
      message: 'Timetable entry created successfully',
      timetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all timetable entries
router.get('/', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getAll();
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable entry by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const timetable = await TimetableEntry.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json({ timetable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by class
router.get('/class/:class_id', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getByClass(req.params.class_id);
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get weekly schedule for class
router.get('/class/:class_id/weekly', auth, async (req, res) => {
  try {
    const schedule = await TimetableEntry.getWeeklySchedule(req.params.class_id);
    res.json({ schedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getByTeacher(req.params.teacher_id);
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by room
router.get('/room/:room_id', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getByRoom(req.params.room_id);
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timetable by day
router.get('/day/:day_of_week', auth, async (req, res) => {
  try {
    const timetables = await TimetableEntry.getByDay(req.params.day_of_week);
    res.json({ timetables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update timetable entry
router.put('/:id', auth, [
  body('class_id').optional().isInt(),
  body('assignment_id').optional().isInt(),
  body('day_of_week').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('room_id').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id } = req.body;

    // Check for conflicts if updating time-related fields
    if (class_id && day_of_week && start_time && end_time) {
      const classConflicts = await TimetableEntry.getConflicts(class_id, day_of_week, start_time, end_time, req.params.id);
      if (classConflicts.length > 0) {
        return res.status(400).json({ message: 'Class time conflict detected', conflicts: classConflicts });
      }

      if (assignment_id) {
        const assignment = await require('../models/Assignment').findById(assignment_id);
        if (assignment) {
          const teacherConflicts = await TimetableEntry.getTeacherConflicts(assignment.teacher_id, day_of_week, start_time, end_time, req.params.id);
          if (teacherConflicts.length > 0) {
            return res.status(400).json({ message: 'Teacher time conflict detected', conflicts: teacherConflicts });
          }
        }
      }

      if (room_id) {
        const roomConflicts = await TimetableEntry.getRoomConflicts(room_id, day_of_week, start_time, end_time, req.params.id);
        if (roomConflicts.length > 0) {
          return res.status(400).json({ message: 'Room time conflict detected', conflicts: roomConflicts });
        }
      }
    }

    const updateData = {};
    if (class_id) updateData.class_id = class_id;
    if (assignment_id) updateData.assignment_id = assignment_id;
    if (day_of_week) updateData.day_of_week = day_of_week;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (room_id !== undefined) updateData.room_id = room_id;

    await TimetableEntry.update(req.params.id, updateData);
    const updatedTimetable = await TimetableEntry.findById(req.params.id);

    res.json({
      message: 'Timetable entry updated successfully',
      timetable: updatedTimetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete timetable entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const timetable = await TimetableEntry.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    await TimetableEntry.delete(req.params.id);
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
