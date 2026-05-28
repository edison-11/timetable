const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { getRequestSchoolId, enforceSameSchool } = require('../utils/tenant');

const router = express.Router();

// Create class
router.post('/', auth, [
  body('class_name').trim().notEmpty().withMessage('Class name is required'),
  body('level').trim().notEmpty().withMessage('Level is required'),
  body('academic_year').trim().notEmpty().withMessage('Academic year is required'),
  body('class_teacher_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('shift_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('dos_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt(),
  body('section_id').notEmpty().withMessage('Section is required').bail().toInt().isInt().withMessage('Section is invalid'),
  body('room_id').notEmpty().withMessage('Room is required').bail().toInt().isInt().withMessage('Room is invalid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id, room_id } = req.body;
    const school_id = getRequestSchoolId(req);

    // Check for duplicate section assignment if section_id is provided
    if (section_id) {
      const existingSectionClass = await Class.findBySectionId(section_id, { school_id });
      if (existingSectionClass) {
        return res.status(400).json({ message: 'This section is already assigned to another class' });
      }
    }

    const existingRoomClass = await Class.findByRoomId(room_id, { school_id });
    if (existingRoomClass) {
      return res.status(400).json({ message: 'This room is already assigned to another class' });
    }

    const classId = await Class.create({ class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id, room_id, school_id });

    // Enforce: only one teacher per class per academic year (based on assignment records).
    if (class_teacher_id) {
      const hasDifferentTeacher = await Assignment.checkDifferentTeacherForClassAndYear(classId, academic_year, class_teacher_id, { school_id });
      if (hasDifferentTeacher) {
        return res.status(400).json({ message: 'This class already has a different teacher assigned for the selected academic year.' });
      }
    }

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
    const classes = await Class.getAll({ school_id: getRequestSchoolId(req) });
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes by level
router.get('/level/:level', auth, async (req, res) => {
  try {
    const classes = await Class.getByLevel(req.params.level, { school_id: getRequestSchoolId(req) });
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes by section
router.get('/section/:section_id', auth, async (req, res) => {
  try {
    const classes = await Class.getBySection(req.params.section_id, { school_id: getRequestSchoolId(req) });
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes by academic year
router.get('/year/:academic_year', auth, async (req, res) => {
  try {
    const classes = await Class.getByAcademicYear(req.params.academic_year, { school_id: getRequestSchoolId(req) });
    res.json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classes by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
  try {
    const classes = await Class.getClassesByTeacher(req.params.teacher_id, { school_id: getRequestSchoolId(req) });
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
    if (!enforceSameSchool(req, classData)) return res.status(403).json({ message: 'Class belongs to another school' });
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
  body('section_id').optional().notEmpty().withMessage('Section is required').bail().toInt().isInt().withMessage('Section is invalid'),
  body('room_id').optional().notEmpty().withMessage('Room is required').bail().toInt().isInt().withMessage('Room is invalid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id, room_id } = req.body;
    const updateData = {};
    updateData.school_id = getRequestSchoolId(req);
    
    if (class_name) {
      updateData.class_name = class_name;
    }
    if (level) updateData.level = level;
    if (academic_year) updateData.academic_year = academic_year;
    if (class_teacher_id !== undefined) updateData.class_teacher_id = class_teacher_id || null;

    // Enforce: only one teacher per class per academic year (based on assignment records).
    // We only check if the frontend is providing an academic_year in the payload.
    // If academic_year is missing, Class.update will keep the existing academic_year.
    if (class_teacher_id !== undefined) {
      const currentClass = await Class.findById(req.params.id);
      const resolvedAcademicYear = academic_year ?? currentClass?.academic_year;

      if (class_teacher_id && resolvedAcademicYear) {
        const hasDifferentTeacher = await Assignment.checkDifferentTeacherForClassAndYear(
          req.params.id,
          resolvedAcademicYear,
          class_teacher_id,
          { school_id: getRequestSchoolId(req) }
        );

        if (hasDifferentTeacher) {
          return res.status(400).json({
            message: 'This class already has a different teacher assigned for the selected academic year.'
          });
        }
      }
    }
    if (shift_id !== undefined) updateData.shift_id = shift_id;
    if (dos_id !== undefined) updateData.dos_id = dos_id;
    if (room_id !== undefined) updateData.room_id = room_id;
    if (room_id) {
      const existingRoomClass = await Class.findByRoomIdExcludingId(room_id, req.params.id, { school_id: getRequestSchoolId(req) });
      if (existingRoomClass) {
        return res.status(400).json({ message: 'This room is already assigned to another class' });
      }
    }
    if (section_id !== undefined) {
      // Check for duplicate section assignment if section_id is provided and not null
      if (section_id) {
        const existingSectionClass = await Class.findBySectionIdExcludingId(section_id, req.params.id, { school_id: getRequestSchoolId(req) });
        if (existingSectionClass) {
          return res.status(400).json({ message: 'This section is already assigned to another class' });
        }
      }
      updateData.section_id = section_id;
    }

    const currentClass = await Class.findById(req.params.id);
    if (!currentClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (!enforceSameSchool(req, currentClass)) return res.status(403).json({ message: 'Class belongs to another school' });

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
    if (!enforceSameSchool(req, classData)) return res.status(403).json({ message: 'Class belongs to another school' });

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
