const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();
const bcrypt = require('bcryptjs');

// GET /api/users - List all users (admin only for now)
router.get('/', auth, async (req, res) => {
  try {
    // Optionally, restrict to admin users only
    // if (req.user.role !== 'Admin') {
    //   return res.status(403).json({ success: false, error: 'Access denied' });
    // }
    const [users] = await db.execute('SELECT id, name, email, role FROM users');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users - Add a new user (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    // Check if user exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/:id - Update a user (admin or self)
router.put('/:id', auth, async (req, res) => {
  try {
    // Allow admin or the user themselves
    if (req.user.role !== 'Admin' && req.user.userId != req.params.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const { name, email, role } = req.body;
    const { id } = req.params;
    await db.execute('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users/:id - Delete a user (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const { id } = req.params;
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users/:id/change-password
router.post('/:id/change-password', auth, async (req, res) => {
  try {
    if (req.user.userId != req.params.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    // Get current password
    const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = users[0];
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Old password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 