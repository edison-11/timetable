const express = require('express');
const AdminMessage = require('../models/AdminMessage');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { getRequestSchoolId } = require('../utils/tenant');

const router = express.Router();

const isSuperAdmin = (user) => user?.role === 'super_admin';

const actor = (user = {}) => ({
  sender_user_id: user.user_id || user.id || null,
  sender_role: user.role || null,
  sender_name: AdminMessage.userName(user),
  sender_email: AdminMessage.userEmail(user)
});

router.get('/', auth, async (req, res) => {
  try {
    const schoolId = getRequestSchoolId(req) || req.user?.school_id || null;
    const messages = await AdminMessage.getThreads({
      role: req.user?.role,
      school_id: schoolId
    });
    res.json({ messages });
  } catch (error) {
    console.error('Failed to load admin messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const schoolId = getRequestSchoolId(req) || req.user?.school_id || null;
    const thread = await AdminMessage.getThread(req.params.id, {
      role: req.user?.role,
      school_id: schoolId
    });
    if (!thread) return res.status(404).json({ message: 'Message thread not found.' });
    res.json({ thread });
  } catch (error) {
    console.error('Failed to load admin message thread:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (isSuperAdmin(req.user)) {
      return res.status(400).json({ message: 'Use reply on an existing message thread.' });
    }

    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();
    const schoolId = getRequestSchoolId(req) || req.user?.school_id || null;

    if (!subject) return res.status(400).json({ message: 'Subject is required.' });
    if (!message) return res.status(400).json({ message: 'Message is required.' });

    const thread = await AdminMessage.create({
      ...actor(req.user),
      school_id: schoolId,
      subject,
      message
    });

    await Notification.create({
      type: 'admin_message',
      title: `Message from ${thread.sender_name || 'school admin'}`,
      message: subject,
      path: '/notifications',
      tone: 'violet',
      recipient_role: 'super_admin'
    });

    res.status(201).json({ message: 'Message sent to Super Admin.', thread });
  } catch (error) {
    console.error('Failed to send admin message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/replies', auth, async (req, res) => {
  try {
    const schoolId = getRequestSchoolId(req) || req.user?.school_id || null;
    const root = await AdminMessage.getThread(req.params.id, {
      role: req.user?.role,
      school_id: schoolId
    });
    if (!root) return res.status(404).json({ message: 'Message thread not found.' });

    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Reply message is required.' });

    const reply = await AdminMessage.create({
      ...actor(req.user),
      parent_id: root.message_id,
      school_id: root.school_id,
      subject: `Re: ${root.subject}`,
      message,
      status: 'replied'
    });

    await AdminMessage.markReplied(root.message_id);

    await Notification.create({
      type: 'admin_reply',
      title: isSuperAdmin(req.user) ? 'Super Admin replied' : `Reply from ${reply.sender_name || 'school admin'}`,
      message: root.subject,
      path: '/notifications',
      tone: isSuperAdmin(req.user) ? 'green' : 'violet',
      school_id: isSuperAdmin(req.user) ? root.school_id : null,
      recipient_role: isSuperAdmin(req.user) ? null : 'super_admin'
    });

    res.status(201).json({ message: 'Reply sent.', reply });
  } catch (error) {
    console.error('Failed to send admin reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/seen', auth, async (req, res) => {
  try {
    const schoolId = getRequestSchoolId(req) || req.user?.school_id || null;
    const thread = await AdminMessage.getThread(req.params.id, {
      role: req.user?.role,
      school_id: schoolId
    });
    if (!thread) return res.status(404).json({ message: 'Message thread not found.' });

    await AdminMessage.markSeen(thread.message_id, req.user?.role);
    const updatedThread = await AdminMessage.getThread(thread.message_id, {
      role: req.user?.role,
      school_id: schoolId
    });
    res.json({ message: 'Message marked as seen.', thread: updatedThread });
  } catch (error) {
    console.error('Failed to mark admin message as seen:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/seen/all', auth, async (req, res) => {
  try {
    const schoolId = getRequestSchoolId(req) || req.user?.school_id || null;
    const deleted = await AdminMessage.deleteSeen(req.user?.role, schoolId);
    res.json({ message: `${deleted} seen message${deleted === 1 ? '' : 's'} deleted.`, deleted });
  } catch (error) {
    console.error('Failed to delete seen admin messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const schoolId = getRequestSchoolId(req) || req.user?.school_id || null;
    const thread = await AdminMessage.getThread(req.params.id, {
      role: req.user?.role,
      school_id: schoolId
    });
    if (!thread) return res.status(404).json({ message: 'Message thread not found.' });

    const deleted = await AdminMessage.deleteThread(thread.message_id, req.user?.role, { requireSeen: true });
    if (!deleted) return res.status(400).json({ message: 'Open the message first, then you can delete it.' });
    res.json({ message: 'Seen message deleted.' });
  } catch (error) {
    console.error('Failed to delete admin message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
