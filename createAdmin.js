const readline = require('readline');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Pfad zur JSON-Datei mit den Usern
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Hilfsfunktionen zum Lesen/Schreiben
function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Fehler beim Lesen von JSON:', e);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Terminal-Eingabe vorbereiten
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Hauptfunktion
(async () => {
  try {
    console.log('🛠️ Admin-Account erstellen');
    const username = await ask('Benutzername: ');
    const password = await ask('Passwort: ');

    if (!username || !password) {
      console.log('❌ Benutzername und Passwort dürfen nicht leer sein.');
      rl.close();
      process.exit(1);
    }

    const data = readJson(USERS_FILE, { users: [] });

    if (data.users.find(u => u.username === username)) {
      console.log('⚠️ Benutzername existiert bereits.');
      rl.close();
      process.exit(1);
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    data.users.push({ username, passwordHash });
    writeJson(USERS_FILE, data);

    console.log(`✅ Admin-User "${username}" wurde erfolgreich erstellt.`);
  } catch (e) {
    console.error('❌ Fehler beim Erstellen des Admin-Users:', e);
  } finally {
    rl.close();
  }
})();
