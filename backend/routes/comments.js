const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Get comments for a document
router.get('/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const [comments] = await db.execute(
      'SELECT c.*, u.name as author FROM comments c JOIN users u ON c.user_id = u.id WHERE c.document_id = ? ORDER BY c.created_at DESC',
      [documentId]
    );
    
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add comment
router.post('/', auth, async (req, res) => {
  try {
    const { documentId, comment } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO comments (document_id, user_id, comment) VALUES (?, ?, ?)',
      [documentId, req.user.userId, comment]
    );
    
    res.json({ success: true, commentId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute('DELETE FROM comments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
