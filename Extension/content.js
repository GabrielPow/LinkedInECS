// content.js — v1.1.2
// Lida com a injecao de snippets.

let snippets = {};
let cycleIndex = {};

function loadData() {
  chrome.storage.local.get(['snippets', 'cycleIndex'], (result) => {
    snippets = result.snippets || {};
    cycleIndex = result.cycleIndex || {};
  });
}
loadData();

// Ajustes de sync
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.snippets) snippets = changes.snippets.newValue || {};
  if (changes.cycleIndex) cycleIndex = changes.cycleIndex.newValue || cycleIndex;
});

// Como escolhe o proximo snippet, ou aleatoriamente ou sequencialmente
function nextVariant(trigger) {
  const entry = snippets[trigger];
  if (!entry || !entry.variants || entry.variants.length === 0) return null;

  const variants = entry.variants.filter((v) => v.length > 0);
  if (variants.length === 0) return null;

  if (entry.mode === 'random') {
    return variants[Math.floor(Math.random() * variants.length)];
  }

  const i = (cycleIndex[trigger] || 0) % variants.length;
  cycleIndex[trigger] = i + 1;
  chrome.storage.local.set({ cycleIndex }); // persistencia
  return variants[i];
}

// Ajuste de React/Vite que não tem seus proprios tags de value.
function setNativeValue(el, value) {
  const proto =
    el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

// Backward Delete para tags com contentEditable (Como Gmail, Twitter, etc.)
// execCommand não esta mais utilizado mais foda se
function deleteBackwardsContentEditable(length) {
  for (let i = 0; i < length; i++) {
    document.execCommand('delete', false);
  }
}

function insertIntoField(el, text, triggerLengthToRemove = 0) {
  if (el.isContentEditable) {
    if (triggerLengthToRemove > 0) deleteBackwardsContentEditable(triggerLengthToRemove);
    document.execCommand('insertText', false, text);
    return;
  }

  const cursor = el.selectionStart ?? el.value.length;
  const before = el.value.slice(0, cursor - triggerLengthToRemove);
  const after = el.value.slice(cursor);
  setNativeValue(el, before + text + after);
  const newPos = before.length + text.length;
  el.setSelectionRange(newPos, newPos);
}

// Expansao automatica em suas maos
let buffer = '';

document.addEventListener('input', (e) => {
  const el = e.target;
  const isEditable = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
  if (!isEditable) return;

  buffer += e.data || '';
  buffer = buffer.slice(-24); // Provavelmente deveria deixar dinamico

  for (const trigger of Object.keys(snippets)) {
    if (trigger && buffer.endsWith(trigger)) {
      const expansion = nextVariant(trigger);
      if (expansion == null) continue;

      insertIntoField(el, expansion, trigger.length);
      buffer = '';
      break;
    }
  }
});

// Injeção do snippet via popup.js via um botão foda.
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!event.data || !event.data.__snippetInsert) return;

  const el = document.activeElement;
  const isEditable = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  if (!isEditable) return;

  const expansion = nextVariant(event.data.trigger);
  if (expansion == null) return;

  insertIntoField(el, expansion, 0);
});
