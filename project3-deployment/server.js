require('dotenv').config();
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const db = new Database(path.join(__dirname, 'tasks.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API ----------
app.get('/api/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY id DESC').all();
  res.json({ data: rows });
});

app.post('/api/tasks', (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Judul tugas wajib diisi' });
  const info = db.prepare('INSERT INTO tasks (title) VALUES (?)').run(title);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ data: row });
});

app.put('/api/tasks/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
  const done = req.body.done ? 1 : 0;
  db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(done, req.params.id);
  res.json({ data: db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ data: { id: Number(req.params.id) } });
});

// Health check endpoint — dipakai untuk monitoring & uptime checks (mis. UptimeRobot,
// health check bawaan platform PaaS, atau load balancer) setelah aplikasi dideploy.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: NODE_ENV, uptime_seconds: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] Server berjalan di port ${PORT}`);
});
