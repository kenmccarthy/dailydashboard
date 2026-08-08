// ── DOM-UTILS.JS ──
// Shared DOM helpers used across card modules: text/HTML setter, HTML escaping,
// and a consistent loading/error/last-updated pattern for cards that replace a
// whole #<id>-content block per fetch.

export function set$(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (typeof val === 'string' && val.includes('<')) el.innerHTML = val;
  else el.textContent = val;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

export function showLoading(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '<div class="wotd-missing">Loading…</div>';
}

export function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="wotd-missing">${msg || 'Unavailable right now.'}</div>`;
}

export function stampUpdated(id, date = new Date()) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = `Updated ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}
