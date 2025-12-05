const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/database");
const auth = require("../middleware/auth");
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Get all documents
router.get("/", auth, async (req, res) => {
  try {
    const [documents] = await db.execute(
      "SELECT d.*, u.name as uploaded_by FROM documents d JOIN users u ON d.uploaded_by = u.id ORDER BY d.created_at DESC"
    );
    const baseUrl = req.protocol + '://' + req.get('host');
    const documentsWithUrl = documents.map(doc => ({
      ...doc,
      fileUrl: `${baseUrl}/uploads/${path.basename(doc.file_path)}`
    }));
    res.json({ success: true, documents: documentsWithUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload document
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const { title, category } = req.body;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const [result] = await db.execute(
      "INSERT INTO documents (title, filename, file_path, file_size, category, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [
        title,
        file.originalname,
        file.path,
        file.size,
        category,
        req.user.userId,
      ]
    );

    res.json({ success: true, documentId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete document
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute("DELETE FROM documents WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update document name/title
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    await db.execute("UPDATE documents SET title = ? WHERE id = ?", [title, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;