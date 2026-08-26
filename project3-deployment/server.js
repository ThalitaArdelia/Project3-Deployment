require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const DB_FILE = path.join(__dirname, 'tasks.json');

// ---------- Helper baca/tulis file JSON ----------
function readTasks() {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Gagal membaca tasks.json:', err);
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

function getNextId(tasks) {
  return tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API -----------
app.get('/api/tasks', (req, res) => {
  const tasks = readTasks().sort((a, b) => b.id - a.id);
  res.json({ data: tasks });
});

app.post('/api/tasks', (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Judul tugas wajib diisi' });

  const tasks = readTasks();
  const newTask = {
    id: getNextId(tasks),
    title,
    done: 0,
    created_at: new Date().toISOString()
  };
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json({ data: newTask });
});

app.put('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

  tasks[index].done = req.body.done ? 1 : 0;
  writeTasks(tasks);
  res.json({ data: tasks[index] });
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks().filter(t => t.id !== id);
  writeTasks(tasks);
  res.json({ data: { id } });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: NODE_ENV, uptime_seconds: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] Server berjalan di port ${PORT}`);
});
