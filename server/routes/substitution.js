const express = require('express');
const { body, validationResult } = require('express-validator');
const SubstitutionLog = require('../models/SubstitutionLog');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create substitution log
router.post('/', auth, [
  body('absence_id').isInt().withMessage('Valid absence ID is required'),
  body('timetable_id').isInt().withMessage('Valid timetable ID is required'),
  body('original_teacher_id').isInt().withMessage('Valid original teacher ID is required'),
  body('substitute_teacher_id').isInt().withMessage('Valid substitute teacher ID is required'),
  body('substitution_date').isISO8601().withMessage('Valid substitution date is required'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const substitution = await SubstitutionLog.create(req.body);
    res.status(201).json(substitution);
  } catch (error) {
    console.error('Error creating substitution log:', error);
    res.status(500).json({ message: 'Failed to create substitution log' });
  }
});

// Get all substitution logs
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.absence_id) filters.absence_id = req.query.absence_id;
    if (req.query.substitution_date) filters.substitution_date = req.query.substitution_date;
    if (req.query.original_teacher_id) filters.original_teacher_id = req.query.original_teacher_id;
    if (req.query.substitute_teacher_id) filters.substitute_teacher_id = req.query.substitute_teacher_id;

    const substitutions = await SubstitutionLog.findAll(filters);
    res.json(substitutions);
  } catch (error) {
    console.error('Error fetching substitution logs:', error);
    res.status(500).json({ message: 'Failed to fetch substitution logs' });
  }
});

// Get substitution log by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const substitution = await SubstitutionLog.findById(req.params.id);
    
    if (!substitution) {
      return res.status(404).json({ message: 'Substitution log not found' });
    }

    res.json(substitution);
  } catch (error) {
    console.error('Error fetching substitution log:', error);
    res.status(500).json({ message: 'Failed to fetch substitution log' });
  }
});

// Update substitution log
router.put('/:id', auth, [
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const substitution = await SubstitutionLog.update(req.params.id, req.body);
    res.json(substitution);
  } catch (error) {
    console.error('Error updating substitution log:', error);
    res.status(500).json({ message: 'Failed to update substitution log' });
  }
});

// Delete substitution log
router.delete('/:id', auth, async (req, res) => {
  try {
    await SubstitutionLog.delete(req.params.id);
    res.json({ message: 'Substitution log deleted successfully' });
  } catch (error) {
    console.error('Error deleting substitution log:', error);
    res.status(500).json({ message: 'Failed to delete substitution log' });
  }
});

// Get substitutions by date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const substitutions = await SubstitutionLog.getByDate(req.params.date);
    res.json(substitutions);
  } catch (error) {
    console.error('Error fetching substitutions by date:', error);
    res.status(500).json({ message: 'Failed to fetch substitutions by date' });
  }
});

module.exports = router;
