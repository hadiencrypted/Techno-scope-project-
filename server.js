'use strict';

const express = require('express');
const path = require('path');
const detectRouter = require('./routes/detect');
const reverseRouter = require('./routes/reverse');

const app = express();
const PORT = 8000;  // ✅ Fixed: frontend connects to port 8000

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — allow frontend (aranged.html) to communicate from any host
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve the frontend static files from the project root
app.use(express.static(path.join(__dirname, '..')));

// ✅ Fixed: Mount router at BOTH /detect AND /analyze (frontend uses /analyze)
app.use('/detect', detectRouter);
app.use('/analyze', detectRouter);
app.use('/reverse', reverseRouter);

// Root route — open localhost:8000 directly in browser
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'aranged.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[TECHNO SCOPE] Server running at http://localhost:${PORT}`);
  console.log(`[TECHNO SCOPE] POST /analyze  — primary endpoint (frontend)`);
  console.log(`[TECHNO SCOPE] POST /detect   — alias endpoint`);
  console.log(`[TECHNO SCOPE] POST /reverse  — image reverse engineering`);
});

module.exports = app;
