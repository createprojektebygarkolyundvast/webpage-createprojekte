const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Pfade
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SITE_FILE = path.join(DATA_DIR, 'site.json');

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Hilfsfunktionen
function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Error reading JSON', filePath, e);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Initiale Dateien sicherstellen
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

if (!fs.existsSync(USERS_FILE)) {
  writeJson(USERS_FILE, {
    users: []
  });
}

if (!fs.existsSync(SITE_FILE)) {
  writeJson(SITE_FILE, {
    settings: {
      backgroundColor: "#020617",
      gradientFrom: "#1d4ed8",
      gradientTo: "#22c55e",
      fontFamily: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    },
    elements: []
  });
}

// API: Admin Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const data = readJson(USERS_FILE, { users: [] });
  const user = data.users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Simple Session-Token (nicht super-secure, aber reicht hier)
  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

  return res.json({ token });
});

// Middleware: simple Token-Check (Client sendet es im Header)
function requireAuth(req, res, next) {
  const authHeader = req.headers['x-admin-token'];
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  // Für echtes Projekt: Token verifizieren + evtl. expiries
  // Hier reicht: irgendwas da
  next();
}

// API: Site-Daten holen
app.get('/api/site', (req, res) => {
  const site = readJson(SITE_FILE, { settings: {}, elements: [] });
  res.json(site);
});

// API: Site-Daten speichern (nur für Admin)
app.post('/api/site', requireAuth, (req, res) => {
  const { settings, elements } = req.body || {};
  if (!settings || !Array.isArray(elements)) {
    return res.status(400).json({ error: 'Invalid site data' });
  }

  const payload = { settings, elements };
  writeJson(SITE_FILE, payload);
  res.json({ success: true });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Public site:  http://localhost:${PORT}/`);
  console.log(`Admin panel:  http://localhost:${PORT}/admin.html`);
});

// Export für createAdmin.js
module.exports = {
  USERS_FILE,
  readJson,
  writeJson
};
