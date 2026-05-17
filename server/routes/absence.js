const express = require('express');
const { body, validationResult } = require('express-validator');
const AbsenceLog = require('../models/AbsenceLog');
const SubstitutionLog = require('../models/SubstitutionLog');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create absence log
router.post('/', auth, [
  body('teacher_id').isInt().withMessage('Valid teacher ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const absence = await AbsenceLog.create(req.body);
    
    // Find available substitutes
    const substitutes = await AbsenceLog.findAvailableSubstitutes(
      req.body.teacher_id,
      req.body.start_date,
      req.body.end_date
    );

    res.status(201).json({ absence, substitutes });
  } catch (error) {
    console.error('Error creating absence log:', error);
    res.status(500).json({ message: 'Failed to create absence log' });
  }
});

// Get all absence logs
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.status) filters.status = req.query.status;
    if (req.query.teacher_id) filters.teacher_id = req.query.teacher_id;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;

    const absences = await AbsenceLog.findAll(filters);
    res.json(absences);
  } catch (error) {
    console.error('Error fetching absence logs:', error);
    res.status(500).json({ message: 'Failed to fetch absence logs' });
  }
});

// Get absence log by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const absence = await AbsenceLog.findById(req.params.id);
    
    if (!absence) {
      return res.status(404).json({ message: 'Absence log not found' });
    }

    // Get teacher schedule for the absence period
    const schedule = await AbsenceLog.getTeacherSchedule(
      absence.teacher_id,
      absence.start_date
    );

    // Get substitutions for this absence
    const substitutions = await SubstitutionLog.getByAbsenceId(req.params.id);

    res.json({ absence, schedule, substitutions });
  } catch (error) {
    console.error('Error fetching absence log:', error);
    res.status(500).json({ message: 'Failed to fetch absence log' });
  }
});

// Update absence log
router.put('/:id', auth, [
  body('substitute_teacher_id').optional().isInt(),
  body('status').optional().isIn(['pending', 'approved', 'rejected', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const absence = await AbsenceLog.update(req.params.id, req.body);
    res.json(absence);
  } catch (error) {
    console.error('Error updating absence log:', error);
    res.status(500).json({ message: 'Failed to update absence log' });
  }
});

// Delete absence log
router.delete('/:id', auth, async (req, res) => {
  try {
    await AbsenceLog.delete(req.params.id);
    res.json({ message: 'Absence log deleted successfully' });
  } catch (error) {
    console.error('Error deleting absence log:', error);
    res.status(500).json({ message: 'Failed to delete absence log' });
  }
});

// Get available substitutes for a teacher
router.get('/:id/substitutes', auth, async (req, res) => {
  try {
    const absence = await AbsenceLog.findById(req.params.id);
    
    if (!absence) {
      return res.status(404).json({ message: 'Absence log not found' });
    }

    const substitutes = await AbsenceLog.findAvailableSubstitutes(
      absence.teacher_id,
      absence.start_date,
      absence.end_date
    );

    res.json(substitutes);
  } catch (error) {
    console.error('Error fetching substitutes:', error);
    res.status(500).json({ message: 'Failed to fetch substitutes' });
  }
});

module.exports = router;
