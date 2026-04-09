'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { runPythonAnalysis } = require('../services/pythonBridge');
const { computeEnsembleScore } = require('../utils/ensembleScorer');

const router = express.Router();

// ── Multer storage: temp uploads folder inside /backend ──────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `upload-${unique}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|bmp|tiff/i;
    const ext = path.extname(file.originalname);
    if (allowed.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${ext}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

// ── POST /detect ─────────────────────────────────────────────────────────────
router.post('/', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided. Use field name "image".' });
    }

    const imagePath = req.file.path;

    try {
        // Step 1: Run Python analysis (metadata + features + classifier)
        const pythonResult = await runPythonAnalysis(imagePath);

        // Step 2: Combine scores via ensemble scorer
        const finalResult = computeEnsembleScore(pythonResult);

        // Step 3: Respond with API contract format
        return res.status(200).json(finalResult);
    } catch (err) {
        console.error('[detect.js] Analysis failed:', err.message);
        return res.status(500).json({ error: 'Analysis failed', message: err.message });
    } finally {
        // Clean up uploaded temp file
        fs.unlink(imagePath, () => { });
    }
});

module.exports = router;
