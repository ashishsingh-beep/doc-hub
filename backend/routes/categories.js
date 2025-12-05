const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/categories - List all categories
router.get('/', auth, async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/categories - Add a new category
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    await db.execute('INSERT INTO categories (name, description, user_id) VALUES (?, ?, ?)', [name, description || '', req.user.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 