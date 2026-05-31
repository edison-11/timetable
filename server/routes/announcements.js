const express = require('express');
const Announcement = require('../models/Announcement');
const { auth } = require('../middleware/auth');
const { getRequestSchoolId } = require('../utils/tenant');

const router = express.Router();

const isSuperAdmin = (user) => user?.role === 'super_admin';

router.get('/', auth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const schoolId = isSuperAdmin(req.user) ? null : (getRequestSchoolId(req) || req.user?.school_id || null);
    const announcements = await Announcement.getRecent({ limit, school_id: schoolId });

    res.json({ announcements });
  } catch (error) {
    console.error('Failed to load announcements:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Super Admin can send platform announcements.' });
    }

    const title = String(req.body.title || '').trim();
    const message = String(req.body.message || '').trim();
    const priority = String(req.body.priority || 'Normal').trim();
    const targetSchoolIds = Array.isArray(req.body.target_school_ids) ? req.body.target_school_ids : [];

    if (!title) return res.status(400).json({ message: 'Announcement title is required.' });
    if (!message) return res.status(400).json({ message: 'Announcement message is required.' });

    const announcement = await Announcement.create({
      title,
      message,
      priority,
      target_school_ids: targetSchoolIds,
      created_by: req.user?.user_id || req.user?.id || null
    });

    res.status(201).json({
      message: `Announcement sent to ${announcement.target_count || 0} school${Number(announcement.target_count || 0) === 1 ? '' : 's'}.`,
      announcement
    });
  } catch (error) {
    console.error('Failed to create announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
