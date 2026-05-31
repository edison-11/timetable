const express = require('express');
const { body, validationResult } = require('express-validator');
const Module = require('../models/Module');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { getRequestSchoolId, enforceSameSchool } = require('../utils/tenant');

const router = express.Router();

// Create module
router.post('/', auth, [
  body('module_name').trim().notEmpty().withMessage('Module name is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('hours_per_year').isInt({ min: 1 }).withMessage('Hours per year must be a positive integer'),
  body('description').optional().trim(),
  body('required_room_type').optional({ nullable: true, checkFalsy: true }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { module_name, department, hours_per_year, description, required_room_type } = req.body;
    const school_id = getRequestSchoolId(req);

    const moduleId = await Module.create({ module_name, department, hours_per_year, description, required_room_type, school_id });
    const module = await Module.findById(moduleId);

    await Notification.create({
      type: 'module_created',
      title: `Module added: ${module.module_name}`,
      message: `${module.module_name} was added to ${module.department}.`,
      path: '/modules',
      tone: 'green'
    });

    res.status(201).json({
      message: 'Module created successfully',
      module
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all modules
router.get('/', auth, async (req, res) => {
  try {
    const modules = await Module.getAll({
      school_id: getRequestSchoolId(req),
      include_unassigned: req.user?.role !== 'super_admin'
    });
    res.json({ modules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get modules by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
  try {
    const modules = await Module.getModulesByTeacher(req.params.teacher_id, { school_id: getRequestSchoolId(req) });
    res.json({ modules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get modules by class
router.get('/class/:class_id', auth, async (req, res) => {
  try {
    const modules = await Module.getModulesByClass(req.params.class_id, { school_id: getRequestSchoolId(req) });
    res.json({ modules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get module by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    if (!enforceSameSchool(req, module)) {
      return res.status(403).json({ message: 'Module belongs to another school' });
    }
    res.json({ module });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update module
router.put('/:id', auth, [
  body('module_name').optional().trim().notEmpty(),
  body('department').optional().trim().notEmpty(),
  body('hours_per_year').optional().isInt({ min: 1 }),
  body('description').optional().trim(),
  body('required_room_type').optional({ nullable: true, checkFalsy: true }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { module_name, department, hours_per_year, description, required_room_type } = req.body;
    const updateData = {};
    updateData.school_id = getRequestSchoolId(req);
    
    if (module_name) updateData.module_name = module_name;
    if (department) updateData.department = department;
    if (hours_per_year) updateData.hours_per_year = hours_per_year;
    if (description !== undefined) updateData.description = description;
    if (required_room_type !== undefined) updateData.required_room_type = required_room_type;

    const existingModule = await Module.findById(req.params.id);
    if (!existingModule) return res.status(404).json({ message: 'Module not found' });
    if (!enforceSameSchool(req, existingModule)) return res.status(403).json({ message: 'Module belongs to another school' });

    await Module.update(req.params.id, updateData);
    const updatedModule = await Module.findById(req.params.id);

    await Notification.create({
      type: 'module_updated',
      title: `Module updated: ${updatedModule.module_name}`,
      message: `${updatedModule.module_name} details were updated.`,
      path: '/modules',
      tone: 'violet'
    });

    res.json({
      message: 'Module updated successfully',
      module: updatedModule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete module
router.delete('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    if (!enforceSameSchool(req, module)) {
      return res.status(403).json({ message: 'Module belongs to another school' });
    }

    await Module.delete(req.params.id);
    await Notification.create({
      type: 'module_deleted',
      title: `Module deleted: ${module.module_name}`,
      message: `${module.module_name} was removed from the system.`,
      path: '/modules',
      tone: 'rose'
    });

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
