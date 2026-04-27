const express = require('express');
const { body, validationResult } = require('express-validator');
const Section = require('../models/Section');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create section
router.post('/', auth, [
  body('section_name').trim().notEmpty().withMessage('Section name is required'),
  body('level').trim().notEmpty().withMessage('Level is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { section_name, level, description } = req.body;

    const sectionId = await Section.create({ section_name, level, description });
    const section = await Section.findById(sectionId);

    res.status(201).json({
      message: 'Section created successfully',
      section
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sections
router.get('/', auth, async (req, res) => {
  try {
    const sections = await Section.getAll();
    res.json({ sections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sections with class count
router.get('/with-count', auth, async (req, res) => {
  try {
    const sections = await Section.getSectionsWithClassCount();
    res.json({ sections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get section by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    res.json({ section });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sections by level
router.get('/level/:level', auth, async (req, res) => {
  try {
    const sections = await Section.getByLevel(req.params.level);
    res.json({ sections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update section
router.put('/:id', auth, [
  body('section_name').optional().trim().notEmpty(),
  body('level').optional().trim().notEmpty(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { section_name, level, description } = req.body;
    const updateData = {};
    
    if (section_name) updateData.section_name = section_name;
    if (level) updateData.level = level;
    if (description !== undefined) updateData.description = description;

    await Section.update(req.params.id, updateData);
    const updatedSection = await Section.findById(req.params.id);

    res.json({
      message: 'Section updated successfully',
      section: updatedSection
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete section
router.delete('/:id', auth, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    await Section.delete(req.params.id);
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
