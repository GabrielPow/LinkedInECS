// --- Save As ---
// Injetado dentro da pagina. Codigo isolado dentro do contexto da pagina, não faz referencia para outras funções
async function expandThenCapture() {
  const triggerPatterns = [/read more/i, /show more/i, /see more/i, /view more/i, /expand/i];

  const looksLikeExpandTrigger = (el) => {
    const text = (el.textContent || '').trim();
    if (triggerPatterns.some((p) => p.test(text))) return true;
    if (el.getAttribute('aria-expanded') === 'false') return true;
    if (/show-?more|read-?more|truncat/i.test(el.className || '')) return true;
    return false;
  };

  document.querySelectorAll('button, a, span, div').forEach((el) => {
    if (looksLikeExpandTrigger(el)) {
      try { el.click(); } catch (e) { /* not all matches are actually clickable */ }
    }
  });

  await new Promise((resolve) => {
    let quietTimer;
    const settle = () => { observer.disconnect(); resolve(); };

    // MutationObserver deixa o HTML ser expandido
    const observer = new MutationObserver(() => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(settle, 500); // 500ms sem mudaças quer dizer que esta tudo bem
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    quietTimer = setTimeout(settle, 500);   
    setTimeout(settle, 3000);                // Limite maximo de espera
  });

  return document.documentElement.outerHTML;
}

const saveBtn = document.getElementById('saveBtn');
const originalSaveLabel = saveBtn.textContent;

saveBtn.addEventListener('click', async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const [{ result: html }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: expandThenCapture
    });

    const safeName = (tab.title || 'page').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({ url, filename: `${safeName}.html`, saveAs: true });
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalSaveLabel;
  }
});

document.getElementById('openOptions').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// --- Snippet quick-insert list ---
async function renderSnippets() {
  const { snippets = {} } = await chrome.storage.local.get('snippets');
  const container = document.getElementById('snippetList');
  const triggers = Object.keys(snippets).filter((t) => snippets[t].variants?.some((v) => v.length > 0));

  if (triggers.length === 0) {
    container.className = 'empty';
    container.textContent = 'Nenhum Snippet Ainda.';
    return;
  }

  container.className = '';
  container.innerHTML = triggers
    .map((trigger) => {
      const variants = snippets[trigger].variants.filter((v) => v.length > 0);
      const label = variants[0].slice(0, 28);
      const suffix = variants.length > 1 ? ` (+${variants.length - 1})` : '';
      return `<button class="snippet-btn" data-trigger="${trigger}">${trigger} — ${label}${suffix}</button>`;
    })
    .join('');

  container.querySelectorAll('.snippet-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: requestInsert,
        args: [btn.dataset.trigger]
      });
      window.close();
    });
  });
}

// Injetado para dentro da pagina.
function requestInsert(trigger) {
  window.postMessage({ __snippetInsert: true, trigger }, '*');
}

renderSnippets();
