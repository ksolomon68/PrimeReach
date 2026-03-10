const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = `cs-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}.pdf`);
    }
});

const ALLOWED_MIMETYPES = [
    'application/pdf',
    'application/x-pdf',
    'application/acrobat',
    'application/octet-stream' // some browsers send this for PDF
];

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_MIMETYPES.includes(file.mimetype) || ext === '.pdf') {
            cb(null, true);
        } else {
            cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are allowed'));
        }
    }
});

// POST /api/upload-cs
router.post('/', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'Upload failed' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = `/uploads/${req.file.filename}`;
        res.json({
            path: filePath,
            originalName: req.file.originalname,
            fileName: req.file.filename,
            date: new Date().toISOString(),
            size: req.file.size
        });
    });
});

module.exports = router;
