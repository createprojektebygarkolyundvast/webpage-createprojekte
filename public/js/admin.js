let adminToken = null;
let siteData = { settings: {}, elements: [] };
let selectedId = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Helpers
async function apiLogin(username, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return await res.json();
}

async function apiGetSite() {
  const res = await fetch('/api/site');
  if (!res.ok) throw new Error('Cannot load site');
  return await res.json();
}

async function apiSaveSite(data) {
  const res = await fetch('/api/site', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': adminToken
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Save failed');
  return await res.json();
}

function $(id) {
  return document.getElementById(id);
}

// Apply Settings to Preview
function applySettingsToPreview(settings) {
  const root = $('preview-root');
  if (!root) return;

  const bg = settings.backgroundColor || '#020617';
  const from = settings.gradientFrom || '#1d4ed8';
  const to = settings.gradientTo || '#22c55e';
  const font = settings.fontFamily || "'Poppins', system-ui";

  root.style.fontFamily = font;
  root.style.background = `radial-gradient(circle at top left, ${bg}, #000 70%)`;
}

// Create Preview Element
function createPreviewElement(el) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('preview-element');
  wrapper.dataset.id = el.id;

  wrapper.style.left = (el.x || 10) + 'px';
  wrapper.style.top = (el.y || 10) + 'px';
  wrapper.style.width = (el.width || 30) + '%';
  if (el.height) wrapper.style.height = el.height + 'px';
  if (el.radius !== undefined) wrapper.style.borderRadius = el.radius + 'px';

  wrapper.classList.remove('shadow-none', 'shadow-soft', 'shadow-strong');
  if (el.shadow === 'none') wrapper.classList.add('shadow-none');
  else if (el.shadow === 'soft') wrapper.classList.add('shadow-soft');
  else if (el.shadow === 'strong') wrapper.classList.add('shadow-strong');

  const color = el.color || '#e5e7eb';
  const bgColor = el.bgColor || 'rgba(15, 23, 42, 0.85)';
  const fontSize = el.fontSize ? el.fontSize + 'px' : '16px';
  const align = el.align || 'left';

  wrapper.style.color = color;
  wrapper.style.background = bgColor;
  wrapper.style.fontSize = fontSize;
  wrapper.style.textAlign = align;

  wrapper.innerHTML = '';

  if (el.type === 'button') {
    const a = document.createElement('a');
    a.classList.add('preview-button');
    a.textContent = el.content || 'Button';
    a.href = el.url || '#';
    wrapper.appendChild(a);
  } else {
    const p = document.createElement('div');
    p.textContent = el.content || 'Text';
    wrapper.appendChild(p);
  }

  wrapper.addEventListener('mousedown', onElementMouseDown);
  wrapper.addEventListener('click', onElementClick);

  return wrapper;
}

// Render Preview
function renderPreview() {
  const root = $('preview-root');
  if (!root) return;
  root.innerHTML = '';
  applySettingsToPreview(siteData.settings || {});

  (siteData.elements || []).forEach(el => {
    const node = createPreviewElement(el);
    if (el.id === selectedId) node.classList.add('selected');
    root.appendChild(node);
  });
}

// Selection & Controls
function selectElement(id) {
  selectedId = id;

  const els = document.querySelectorAll('.preview-element');
  els.forEach(el => {
    if (el.dataset.id === id) el.classList.add('selected');
    else el.classList.remove('selected');
  });

  const elData = siteData.elements.find(e => e.id === id);
  if (!elData) {
    $('no-selection').classList.remove('hidden');
    $('element-controls').classList.add('hidden');
    return;
  }

  $('no-selection').classList.add('hidden');
  $('element-controls').classList.remove('hidden');

  $('el-content').value = elData.content || '';
  $('el-url').value = elData.url || '';
  $('el-color').value = elData.color || '#e5e7eb';
  $('el-bg-color').value = elData.bgColor || '#0f172a';
  $('el-font-size').value = elData.fontSize || 16;
  $('el-align').value = elData.align || 'left';
  $('el-width').value = elData.width || 30;
  $('el-height').value = elData.height || 80;
  $('el-radius').value = elData.radius || 14;
  $('el-shadow').value = elData.shadow || 'soft';
}

function getSelectedElement() {
  return siteData.elements.find(e => e.id === selectedId) || null;
}

function updateSelectedElement(partial) {
  const el = getSelectedElement();
  if (!el) return;
  Object.assign(el, partial);
  renderPreview();
  selectElement(el.id);
}

// Drag & Drop
function onElementMouseDown(e) {
  e.preventDefault();
  const target = e.currentTarget;
  const id = target.dataset.id;
  selectElement(id);

  const rect = target.getBoundingClientRect();
  const rootRect = $('preview-root').getBoundingClientRect();
  isDragging = true;
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;

  function onMove(ev) {
    if (!isDragging) return;
    const x = ev.clientX - rootRect.left - dragOffset.x;
    const y = ev.clientY - rootRect.top - dragOffset.y;

    updateSelectedElement({ x: Math.max(0, x), y: Math.max(0, y) });
  }

  function onUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function onElementClick(e) {
  e.stopPropagation();
  const id = e.currentTarget.dataset.id;
  selectElement(id);
}

// Add Elements
function addElement(type) {
  const id = 'el_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
  const base = {
    id,
    x: 40,
    y: 40,
    width: 30,
    height: 80,
    radius: 14,
    color: '#e5e7eb',
    bgColor: 'rgba(15, 23, 42, 0.9)',
    fontSize: 16,
    align: 'left',
    shadow: 'soft'
  };

  if (type === 'button') {
    siteData.elements.push({
      ...base,
      type: 'button',
      content: 'Neuer Button',
      url: 'https://example.com'
    });
  } else {
    siteData.elements.push({
      ...base,
      type: 'text',
      content: 'Neuer Text'
    });
  }

  renderPreview();
}

// Delete Element
function deleteSelectedElement() {
  if (!selectedId) return;
  siteData.elements = siteData.elements.filter(e => e.id !== selectedId);
  selectedId = null;
  renderPreview();
  $('no-selection').classList.remove('hidden');
  $('element-controls').classList.add('hidden');
}

// Events Setup
function initLogin() {
  const form = $('login-form');
  const errorEl = $('login-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const username = $('username').value.trim();
    const password = $('password').value;

    try {
      const data = await apiLogin(username, password);
      adminToken = data.token;
      $('login-panel').classList.add('hidden');
      $('controls-panel').classList.remove('hidden');

      siteData = await apiGetSite();
      renderPreview();
      initControlsFromSettings();
    } catch (err) {
      errorEl.textContent = 'Login fehlgeschlagen.';
    }
  });
}

function initControlsFromSettings() {
  const s = siteData.settings || {};
  $('bg-color').value = s.backgroundColor || '#020617';
  $('gradient-from').value = s.gradientFrom || '#1d4ed8';
  $('gradient-to').value = s.gradientTo || '#22c55e';
  $('font-family').value = s.fontFamily || "'Poppins', system-ui";
}

// Background / Settings Controls
function initSettingsControls() {
  $('bg-color').addEventListener('input', (e) => {
    siteData.settings.backgroundColor = e.target.value;
    applySettingsToPreview(siteData.settings);
  });

  $('gradient-from').addEventListener('input', (e) => {
    siteData.settings.gradientFrom = e.target.value;
    applySettingsToPreview(siteData.settings);
  });

  $('gradient-to').addEventListener('input', (e) => {
    siteData.settings.gradientTo = e.target.value;
    applySettingsToPreview(siteData.settings);
  });

  $('font-family').addEventListener('change', (e) => {
    siteData.settings.fontFamily = e.target.value;
    applySettingsToPreview(siteData.settings);
  });
}

// Element Controls Events
function initElementControls() {
  $('el-content').addEventListener('input', (e) => {
    updateSelectedElement({ content: e.target.value });
  });

  $('el-url').addEventListener('input', (e) => {
    updateSelectedElement({ url: e.target.value });
  });

  $('el-color').addEventListener('input', (e) => {
    updateSelectedElement({ color: e.target.value });
  });

  $('el-bg-color').addEventListener('input', (e) => {
    updateSelectedElement({ bgColor: e.target.value });
  });

  $('el-font-size').addEventListener('input', (e) => {
    const val = parseInt(e.target.value || '16', 10);
    updateSelectedElement({ fontSize: val });
  });

  $('el-align').addEventListener('change', (e) => {
    updateSelectedElement({ align: e.target.value });
  });

  $('el-width').addEventListener('input', (e) => {
    const val = parseInt(e.target.value || '30', 10);
    updateSelectedElement({ width: val });
  });

  $('el-height').addEventListener('input', (e) => {
    const val = parseInt(e.target.value || '80', 10);
    updateSelectedElement({ height: val });
  });

  $('el-radius').addEventListener('input', (e) => {
    const val = parseInt(e.target.value || '14', 10);
    updateSelectedElement({ radius: val });
  });

  $('el-shadow').addEventListener('change', (e) => {
    updateSelectedElement({ shadow: e.target.value });
  });

  $('delete-element').addEventListener('click', () => {
    deleteSelectedElement();
  });
}

// Add Buttons
function initAddButtons() {
  $('add-text').addEventListener('click', () => {
    addElement('text');
  });
  $('add-button').addEventListener('click', () => {
    addElement('button');
  });
}

// Save
function initSave() {
  $('save-site').addEventListener('click', async () => {
    const status = $('save-status');
    status.textContent = 'Speichern...';
    try {
      await apiSaveSite(siteData);
      status.textContent = 'Gespeichert.';
      setTimeout(() => (status.textContent = ''), 1500);
    } catch (e) {
      status.textContent = 'Fehler beim Speichern.';
    }
  });
}

// Click outside elements -> deselect
function initPreviewClick() {
  const root = $('preview-root');
  root.addEventListener('click', () => {
    selectedId = null;
    const els = document.querySelectorAll('.preview-element');
    els.forEach(el => el.classList.remove('selected'));
    $('no-selection').classList.remove('hidden');
    $('element-controls').classList.add('hidden');
  });
}

// Theme Toggle
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");

  btn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    btn.textContent = document.body.classList.contains("light-mode") ? "☀️" : "🌙";

    localStorage.setItem(
      "theme",
      document.body.classList.contains("light-mode") ? "light" : "dark"
    );
  });

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    btn.textContent = "☀️";
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initSettingsControls();
  initElementControls();
  initAddButtons();
  initSave();
  initPreviewClick();
  initThemeToggle();
});
