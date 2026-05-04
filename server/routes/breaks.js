const express = require('express');
const { body, validationResult } = require('express-validator');
const BreakTime = require('../models/BreakTime');
const Shift = require('../models/Shift');
const { auth } = require('../middleware/auth');

const router = express.Router();

const timeValidator = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

router.get('/', auth, async (req, res) => {
  try {
    const breaks = await BreakTime.getAll();
    res.json({ breaks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, [
  body('shift_id').isInt().withMessage('Shift is required'),
  body('break_name').trim().notEmpty().withMessage('Break name is required'),
  body('start_time').matches(timeValidator).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(timeValidator).withMessage('Invalid end time format (HH:MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { shift_id, break_name, start_time, end_time } = req.body;
    const shift = await Shift.findById(shift_id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    const conflicts = await BreakTime.checkTimeConflict(shift_id, start_time, end_time);
    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Break time conflict detected' });
    }

    const breakId = await BreakTime.create({ shift_id, break_name, start_time, end_time });
    const breakTime = await BreakTime.findById(breakId);

    res.status(201).json({
      message: 'Break time created successfully',
      break: breakTime
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, [
  body('shift_id').isInt().withMessage('Shift is required'),
  body('break_name').trim().notEmpty().withMessage('Break name is required'),
  body('start_time').matches(timeValidator).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(timeValidator).withMessage('Invalid end time format (HH:MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const currentBreak = await BreakTime.findById(req.params.id);
    if (!currentBreak) {
      return res.status(404).json({ message: 'Break time not found' });
    }

    const { shift_id, break_name, start_time, end_time } = req.body;
    const conflicts = await BreakTime.checkTimeConflict(shift_id, start_time, end_time, req.params.id);
    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Break time conflict detected' });
    }

    await BreakTime.update(req.params.id, { shift_id, break_name, start_time, end_time });
    const breakTime = await BreakTime.findById(req.params.id);

    res.json({
      message: 'Break time updated successfully',
      break: breakTime
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const breakTime = await BreakTime.findById(req.params.id);
    if (!breakTime) {
      return res.status(404).json({ message: 'Break time not found' });
    }

    await BreakTime.delete(req.params.id);
    res.json({ message: 'Break time deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
