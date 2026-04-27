const express = require('express');
const { body, validationResult } = require('express-validator');
const Shift = require('../models/Shift');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create shift
router.post('/', auth, [
  body('shift_name').trim().notEmpty().withMessage('Shift name is required'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { shift_name, start_time, end_time } = req.body;

    const shiftId = await Shift.create({ shift_name, start_time, end_time });
    const shift = await Shift.findById(shiftId);

    res.status(201).json({
      message: 'Shift created successfully',
      shift
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all shifts
router.get('/', auth, async (req, res) => {
  try {
    const shifts = await Shift.getAll();
    res.json({ shifts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all shifts with breaks
router.get('/with-breaks', auth, async (req, res) => {
  try {
    const shifts = await Shift.getAllWithBreaks();
    res.json({ shifts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shift by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    res.json({ shift });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shift with breaks
router.get('/:id/with-breaks', auth, async (req, res) => {
  try {
    const shift = await Shift.getShiftWithBreaks(req.params.id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    res.json({ shift });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shift
router.put('/:id', auth, [
  body('shift_name').optional().trim().notEmpty(),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { shift_name, start_time, end_time } = req.body;
    const updateData = {};
    
    if (shift_name) updateData.shift_name = shift_name;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;

    await Shift.update(req.params.id, updateData);
    const updatedShift = await Shift.findById(req.params.id);

    res.json({
      message: 'Shift updated successfully',
      shift: updatedShift
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete shift
router.delete('/:id', auth, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    await Shift.delete(req.params.id);
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
