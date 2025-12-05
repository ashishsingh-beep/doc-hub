const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/stats - Dashboard statistics
router.get('/', auth, async (req, res) => {
  try {
    const [[{ totalDocuments }]] = await db.execute('SELECT COUNT(*) as totalDocuments FROM documents');
    const [[{ totalUsers }]] = await db.execute('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalCategories }]] = await db.execute('SELECT COUNT(*) as totalCategories FROM categories');
    const [[{ recentUploads }]] = await db.execute("SELECT COUNT(*) as recentUploads FROM documents WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    res.json({ success: true, stats: { totalDocuments, totalUsers, totalCategories, recentUploads } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stats/user/:id - User-specific statistics
router.get('/user/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    // Documents uploaded by user
    const [[{ documentsUploaded }]] = await db.execute('SELECT COUNT(*) as documentsUploaded FROM documents WHERE uploaded_by = ?', [userId]);
    // Storage used by user
    const [[{ storageUsed }]] = await db.execute('SELECT IFNULL(SUM(file_size),0) as storageUsed FROM documents WHERE uploaded_by = ?', [userId]);
    // Last login (assuming you have a last_login column in users table)
    const [[{ lastLogin }]] = await db.execute('SELECT last_login FROM users WHERE id = ?', [userId]);
    res.json({ success: true, stats: { documentsUploaded, storageUsed, lastLogin } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 