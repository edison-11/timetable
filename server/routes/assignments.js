const express = require('express');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create assignment
router.post('/', auth, [
  body('teacher_id').isInt().withMessage('Valid teacher ID is required'),
  body('module_id').isInt().withMessage('Valid module ID is required'),
  body('class_id').isInt().withMessage('Valid class ID is required'),
  body('academic_year').trim().notEmpty().withMessage('Academic year is required'),
  body('term').trim().notEmpty().withMessage('Term is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teacher_id, module_id, class_id, academic_year, term } = req.body;

    // Check for conflicts
    const hasConflict = await Assignment.checkConflict(teacher_id, module_id, class_id, academic_year, term);
    if (hasConflict) {
      return res.status(400).json({ message: 'Assignment already exists for this combination' });
    }

    const assignmentId = await Assignment.create({ teacher_id, module_id, class_id, academic_year, term });
    const assignment = await Assignment.findById(assignmentId);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    const assignments = await Assignment.getAll();
    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json({ assignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
  try {
    const assignments = await Assignment.getByTeacher(req.params.teacher_id);
    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments by class
router.get('/class/:class_id', auth, async (req, res) => {
  try {
    const assignments = await Assignment.getByClass(req.params.class_id);
    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments by module
router.get('/module/:module_id', auth, async (req, res) => {
  try {
    const assignments = await Assignment.getByModule(req.params.module_id);
    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments by academic year
router.get('/year/:academic_year', auth, async (req, res) => {
  try {
    const assignments = await Assignment.getByAcademicYear(req.params.academic_year);
    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update assignment
router.put('/:id', auth, [
  body('teacher_id').optional().isInt(),
  body('module_id').optional().isInt(),
  body('class_id').optional().isInt(),
  body('academic_year').optional().trim().notEmpty(),
  body('term').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teacher_id, module_id, class_id, academic_year, term } = req.body;
    const updateData = {};
    
    if (teacher_id) updateData.teacher_id = teacher_id;
    if (module_id) updateData.module_id = module_id;
    if (class_id) updateData.class_id = class_id;
    if (academic_year) updateData.academic_year = academic_year;
    if (term) updateData.term = term;

    // Check for conflicts if updating key fields
    if (teacher_id && module_id && class_id && academic_year && term) {
      const hasConflict = await Assignment.checkConflict(teacher_id, module_id, class_id, academic_year, term, req.params.id);
      if (hasConflict) {
        return res.status(400).json({ message: 'Assignment already exists for this combination' });
      }
    }

    await Assignment.update(req.params.id, updateData);
    const updatedAssignment = await Assignment.findById(req.params.id);

    res.json({
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete assignment
router.delete('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await Assignment.delete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
