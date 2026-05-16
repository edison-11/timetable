const express = require('express');
const { body, validationResult } = require('express-validator');
const Module = require('../models/Module');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create module
router.post('/', auth, [
  body('module_name').trim().notEmpty().withMessage('Module name is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('hours_per_year').isInt({ min: 1 }).withMessage('Hours per year must be a positive integer'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { module_name, department, hours_per_year, description } = req.body;

    const moduleId = await Module.create({ module_name, department, hours_per_year, description });
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
    const modules = await Module.getAll();
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
    res.json({ module });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get modules by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
  try {
    const modules = await Module.getModulesByTeacher(req.params.teacher_id);
    res.json({ modules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get modules by class
router.get('/class/:class_id', auth, async (req, res) => {
  try {
    const modules = await Module.getModulesByClass(req.params.class_id);
    res.json({ modules });
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
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { module_name, department, hours_per_year, description } = req.body;
    const updateData = {};
    
    if (module_name) updateData.module_name = module_name;
    if (department) updateData.department = department;
    if (hours_per_year) updateData.hours_per_year = hours_per_year;
    if (description !== undefined) updateData.description = description;

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
