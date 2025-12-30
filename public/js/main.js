async function fetchSite() {
  const res = await fetch('/api/site');
  if (!res.ok) return null;
  return await res.json();
}

function applySettings(settings) {
  const body = document.getElementById('public-body');
  if (!body) return;

  const bg = settings.backgroundColor || '#020617';
  const from = settings.gradientFrom || '#1d4ed8';
  const to = settings.gradientTo || '#22c55e';
  const font = settings.fontFamily || "'Poppins', system-ui";

  body.style.background = `radial-gradient(circle at top left, ${bg}, #000 75%)`;
  body.style.fontFamily = font;

  const overlay = document.querySelector('.bg-gradient-overlay');
  if (overlay) {
    overlay.style.background = `
      radial-gradient(circle at 0% 0%, ${from}40, transparent 55%),
      radial-gradient(circle at 100% 0%, ${to}40, transparent 55%)
    `;
  }
}

function createPublicElement(el) {
  const div = document.createElement('div');
  div.classList.add('public-element');

  div.style.left = (el.x || 10) + 'px';
  div.style.top = (el.y || 10) + 'px';
  if (el.width) div.style.width = el.width + '%';
  if (el.height) div.style.height = el.height + 'px';
  if (el.radius !== undefined) div.style.borderRadius = el.radius + 'px';

  if (el.shadow === 'none') div.classList.add('shadow-none');
  else if (el.shadow === 'soft') div.classList.add('shadow-soft');
  else if (el.shadow === 'strong') div.classList.add('shadow-strong');

  const color = el.color || '#e5e7eb';
  const bgColor = el.bgColor || 'rgba(15, 23, 42, 0.85)';
  const fontSize = el.fontSize ? el.fontSize + 'px' : '16px';
  const align = el.align || 'left';

  div.style.color = color;
  div.style.background = bgColor;
  div.style.fontSize = fontSize;
  div.style.textAlign = align;

  if (el.type === 'button') {
    const a = document.createElement('a');
    a.classList.add('public-button');
    a.textContent = el.content || 'Button';
    if (el.url) a.href = el.url;
    div.appendChild(a);
  } else {
    div.textContent = el.content || 'Text';
  }

  return div;
}

async function initPublic() {
  const root = document.getElementById('public-root');
  if (!root) return;

  const site = await fetchSite();
  if (!site) return;

  applySettings(site.settings || {});
  (site.elements || []).forEach(el => {
    const node = createPublicElement(el);
    root.appendChild(node);
  });

  initThemeToggle();
}

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

document.addEventListener('DOMContentLoaded', initPublic);
