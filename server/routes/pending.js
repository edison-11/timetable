const express = require('express');
const Teacher = require('../models/Teacher');

const router = express.Router();

// Get pending teachers (no auth required)
router.get('/teachers', async (req, res) => {
  try {
    const pendingTeachers = await Teacher.getByStatus('pending');
    res.json({ pendingTeachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
