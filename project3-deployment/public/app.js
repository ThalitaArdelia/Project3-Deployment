const els = {
  form: document.getElementById('task-form'),
  input: document.getElementById('task-input'),
  list: document.getElementById('task-list'),
  envBadge: document.getElementById('env-badge'),
};

async function loadTasks() {
  const res = await fetch('/api/tasks');
  const { data } = await res.json();
  render(data);
}

function render(tasks) {
  if (tasks.length === 0) {
    els.list.innerHTML = `<li class="empty">Belum ada tugas.</li>`;
    return;
  }
  els.list.innerHTML = tasks
    .map(
      (t) => `
      <li class="task ${t.done ? 'task--done' : ''}">
        <label>
          <input type="checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''} />
          <span>${escapeHtml(t.title)}</span>
        </label>
        <button data-id="${t.id}" class="btn-delete" aria-label="Hapus">✕</button>
      </li>`
    )
    .join('');
}

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = els.input.value.trim();
  if (!title) return;
  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  els.input.value = '';
  loadTasks();
});

els.list.addEventListener('change', async (e) => {
  if (e.target.matches('input[type="checkbox"]')) {
    await fetch(`/api/tasks/${e.target.dataset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: e.target.checked }),
    });
    loadTasks();
  }
});

els.list.addEventListener('click', async (e) => {
  if (e.target.matches('.btn-delete')) {
    await fetch(`/api/tasks/${e.target.dataset.id}`, { method: 'DELETE' });
    loadTasks();
  }
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function loadHealth() {
  try {
    const res = await fetch('/api/health');
    const health = await res.json();
    els.envBadge.textContent = `env: ${health.env} · uptime: ${Math.floor(health.uptime_seconds)}s`;
  } catch {
    els.envBadge.textContent = 'health check gagal';
  }
}

loadTasks();
loadHealth();
setInterval(loadHealth, 10000);
