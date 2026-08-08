// ── A11Y-UTILS.JS ──
// Minimal focus trap + Escape-to-close + focus-return for modal-style panels
// (#settings-panel, #setup, #setup2), applied once here instead of each modal
// reimplementing its own keyboard handling.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let current = null;   // { modalEl, triggerEl, onEscape }

function focusables(modalEl) {
  return [...modalEl.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
}

function trapKeydown(e) {
  if (!current) return;
  if (e.key === 'Escape' && current.onEscape) { e.preventDefault(); current.onEscape(); return; }
  if (e.key !== 'Tab') return;
  const items = focusables(current.modalEl);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// Moves focus into `modalEl`, traps Tab cycling inside it, and (if `onEscape`
// is given) closes on Escape — omit it for a modal the user can't dismiss
// (e.g. required first-run setup). Pair with closeModal() on whatever path
// the modal already uses to hide itself, to restore focus to the trigger.
export function openModal(modalEl, { onEscape } = {}) {
  if (!modalEl) return;
  current = { modalEl, triggerEl: document.activeElement, onEscape };
  document.addEventListener('keydown', trapKeydown);
  const items = focusables(modalEl);
  (items[0] || modalEl).focus?.();
}

export function closeModal(modalEl) {
  if (!current || current.modalEl !== modalEl) return;
  document.removeEventListener('keydown', trapKeydown);
  const { triggerEl } = current;
  current = null;
  triggerEl?.focus?.();
}
