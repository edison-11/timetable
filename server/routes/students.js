const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create student
router.post('/', auth, [
  body('student_number').isString().withMessage('Student number is required'),
  body('name').isString().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('academic_year').isString().withMessage('Academic year is required'),
  body('class_id').optional().isInt(),
  body('section_id').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Failed to create student' });
  }
});

// Get all students
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.class_id) filters.class_id = req.query.class_id;
    if (req.query.section_id) filters.section_id = req.query.section_id;
    if (req.query.academic_year) filters.academic_year = req.query.academic_year;
    if (req.query.status) filters.status = req.query.status;

    const students = await Student.findAll(filters);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Get student by user ID (for student portal)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const student = await Student.findByUserId(req.params.userId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student by user ID:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Get student timetable
router.get('/:id/timetable', auth, async (req, res) => {
  try {
    const { academic_year, term } = req.query;
    const timetable = await Student.getTimetable(req.params.id, academic_year, term);
    res.json(timetable);
  } catch (error) {
    console.error('Error fetching student timetable:', error);
    res.status(500).json({ message: 'Failed to fetch student timetable' });
  }
});

// Update student
router.put('/:id', auth, [
  body('name').optional().isString(),
  body('email').optional().isEmail(),
  body('class_id').optional().isInt(),
  body('section_id').optional().isInt(),
  body('academic_year').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'graduated'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const student = await Student.update(req.params.id, req.body);
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', auth, async (req, res) => {
  try {
    await Student.delete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

module.exports = router;
