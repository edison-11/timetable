const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const DOS = require('../models/DOS');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (dosId) => {
  return jwt.sign({ dosId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register DOS
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existingDOS = await DOS.findByEmail(email);
    if (existingDOS) {
      return res.status(400).json({ message: 'DOS already exists' });
    }

    const dosId = await DOS.create({ name, email, password });
    const dos = await DOS.findById(dosId);

    const token = generateToken(dosId);

    res.status(201).json({
      message: 'DOS created successfully',
      token,
      dos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login DOS
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const dos = await DOS.findByEmail(email);
    if (!dos) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await DOS.comparePassword(password, dos.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(dos.dos_id);

    res.json({
      message: 'Login successful',
      token,
      dos: {
        id: dos.dos_id,
        name: dos.name,
        email: dos.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all DOS (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const dosList = await DOS.getAll();
    res.json({ dos: dosList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get DOS by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const dos = await DOS.findById(req.params.id);
    if (!dos) {
      return res.status(404).json({ message: 'DOS not found' });
    }
    res.json({ dos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update DOS
router.put('/:id', auth, [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    await DOS.update(req.params.id, updateData);
    const updatedDOS = await DOS.findById(req.params.id);

    res.json({
      message: 'DOS updated successfully',
      dos: updatedDOS
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete DOS
router.delete('/:id', auth, async (req, res) => {
  try {
    const dos = await DOS.findById(req.params.id);
    if (!dos) {
      return res.status(404).json({ message: 'DOS not found' });
    }

    await DOS.delete(req.params.id);
    res.json({ message: 'DOS deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
