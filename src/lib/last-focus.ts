// Tracks the most recently focused editable text field globally so that
// floating panels (Equations, Symbols, etc.) can insert text at the
// real caret position even after the user taps a panel button.

type Editable = HTMLInputElement | HTMLTextAreaElement;

let lastEl: Editable | null = null;
let lastStart = 0;
let lastEnd = 0;
let installed = false;

function isEditable(el: EventTarget | null): el is Editable {
  if (!el) return false;
  const node = el as HTMLElement;
  if (node.tagName === "TEXTAREA") return true;
  if (node.tagName === "INPUT") {
    const t = (node as HTMLInputElement).type;
    return t === "text" || t === "search" || t === "" || t === "url" || t === "email";
  }
  return false;
}

function remember(el: Editable) {
  lastEl = el;
  lastStart = el.selectionStart ?? el.value.length;
  lastEnd = el.selectionEnd ?? el.value.length;
}

export function installLastFocusTracker() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener("focusin", (e) => {
    if (isEditable(e.target)) remember(e.target);
  });
  document.addEventListener("selectionchange", () => {
    const el = document.activeElement;
    if (isEditable(el)) remember(el);
  });
}

export function insertAtLastFocus(text: string) {
  const el = lastEl;
  if (!el || !document.body.contains(el)) return false;
  const start = lastStart;
  const end = lastEnd;
  const value = el.value;
  const next = value.slice(0, start) + text + value.slice(end);

  const proto =
    el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, next);
  el.dispatchEvent(new Event("input", { bubbles: true }));

  const pos = start + text.length;
  lastStart = pos;
  lastEnd = pos;
  requestAnimationFrame(() => {
    try {
      el.focus({ preventScroll: true });
      el.setSelectionRange(pos, pos);
    } catch {
      /* noop */
    }
  });
  return true;
}



