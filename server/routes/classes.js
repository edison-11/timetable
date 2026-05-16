const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create class
router.post('/', auth, [
  body('class_name').trim().notEmpty().withMessage('Class name is required'),
  body('level').trim().notEmpty().withMessage('Level is required'),
  body('academic_year').trim().notEmpty().withMessage('Academic year is required'),
  body('class_teacher_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('shift_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('dos_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('section_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('room_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id, room_id } = req.body;

    // Check for duplicate section assignment if section_id is provided
    if (section_id) {
      const existingSectionClass = await Class.findBySectionId(section_id);
      if (existingSectionClass) {
        return res.status(400).json({ message: 'This section is already assigned to another class' });
      }
    }

    const classId = await Class.create({ class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id, room_id });
    const classData = await Class.findById(classId);

    await Notification.create({
      type: 'class_created',
      title: `Class added: ${classData.class_name}`,
      message: `${classData.class_name} was created for ${classData.academic_year}.`,
      path: '/classes',
      tone: 'green'
    });

    res.status(201).json({
      message: 'Class created successfully',
      class: classData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all classes
router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.getAll();
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes by level
router.get('/level/:level', auth, async (req, res) => {
  try {
    const classes = await Class.getByLevel(req.params.level);
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes by section
router.get('/section/:section_id', auth, async (req, res) => {
  try {
    const classes = await Class.getBySection(req.params.section_id);
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes by academic year
router.get('/year/:academic_year', auth, async (req, res) => {
  try {
    const classes = await Class.getByAcademicYear(req.params.academic_year);
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
  try {
    const classes = await Class.getClassesByTeacher(req.params.teacher_id);
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get class by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ class: classData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update class
router.put('/:id', auth, [
  body('class_name').optional().trim().notEmpty(),
  body('level').optional().trim().notEmpty(),
  body('academic_year').optional().trim().notEmpty(),
  body('class_teacher_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('shift_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('dos_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('section_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('room_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id, room_id } = req.body;
    const updateData = {};
    
    if (class_name) {
      updateData.class_name = class_name;
    }
    if (level) updateData.level = level;
    if (academic_year) updateData.academic_year = academic_year;
    if (class_teacher_id !== undefined) updateData.class_teacher_id = class_teacher_id || null;
    if (shift_id !== undefined) updateData.shift_id = shift_id;
    if (dos_id !== undefined) updateData.dos_id = dos_id;
    if (room_id !== undefined) updateData.room_id = room_id;
    if (section_id !== undefined) {
      // Check for duplicate section assignment if section_id is provided and not null
      if (section_id) {
        const existingSectionClass = await Class.findBySectionIdExcludingId(section_id, req.params.id);
        if (existingSectionClass) {
          return res.status(400).json({ message: 'This section is already assigned to another class' });
        }
      }
      updateData.section_id = section_id;
    }

    await Class.update(req.params.id, updateData);
    const updatedClass = await Class.findById(req.params.id);

    await Notification.create({
      type: 'class_updated',
      title: `Class updated: ${updatedClass.class_name}`,
      message: `${updatedClass.class_name} details were updated.`,
      path: '/classes',
      tone: 'violet'
    });

    res.json({
      message: 'Class updated successfully',
      class: updatedClass
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete class
router.delete('/:id', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await Class.delete(req.params.id);
    await Notification.create({
      type: 'class_deleted',
      title: `Class deleted: ${classData.class_name}`,
      message: `${classData.class_name} was removed from the system.`,
      path: '/classes',
      tone: 'rose'
    });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
