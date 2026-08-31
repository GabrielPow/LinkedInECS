async function getData() {
  const { snippets = {} } = await chrome.storage.local.get('snippets');
  return snippets;
}

async function saveData(snippets) {
  await chrome.storage.local.set({ snippets });
}

function render(snippets) {
  const container = document.getElementById('snippetContainer');
  const triggers = Object.keys(snippets);

  if (triggers.length === 0) {
    container.innerHTML = '<p class="empty">Nenhum Snippet ainda, adiciona abaixo.</p>';
    return;
  }

  container.innerHTML = triggers
    .map((trigger) => {
      const entry = snippets[trigger];
      const variantRows = entry.variants
        .map(
          (v, i) => `
        <div class="variant-row">
          <input data-trigger="${trigger}" data-index="${i}" class="variant-input" value="${v.replace(/"/g, '&quot;')}" placeholder="Expansion text">
          <button class="danger remove-variant" data-trigger="${trigger}" data-index="${i}" title="Remove this variant">✕</button>
        </div>
      `
        )
        .join('');

      return `
      <div class="snippet-card">
        <div class="snippet-header">
          <span class="trigger-label">${trigger}</span>
          <button class="danger remove-snippet" data-trigger="${trigger}">Delete snippet</button>
        </div>
        ${variantRows}
        <button class="add-variant" data-trigger="${trigger}">+ Add variant</button>
        <div class="mode-toggle">
          Mode:
          <select data-trigger="${trigger}" class="mode-select">
            <option value="sequential" ${entry.mode !== 'random' ? 'selected' : ''}>Cycle in order</option>
            <option value="random" ${entry.mode === 'random' ? 'selected' : ''}>Random</option>
          </select>
        </div>
      </div>
    `;
    })
    .join('');

  attachHandlers();
}

async function attachHandlers() {
  document.querySelectorAll('.variant-input').forEach((input) => {
    input.addEventListener('change', async () => {
      const data = await getData();
      data[input.dataset.trigger].variants[input.dataset.index] = input.value;
      await saveData(data);
    });
  });

  document.querySelectorAll('.remove-variant').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const data = await getData();
      const variants = data[btn.dataset.trigger].variants;
      if (variants.length <= 1) {
        alert("A snippet needs at least one variant. Delete the whole snippet instead if you don't need it.");
        return;
      }
      variants.splice(Number(btn.dataset.index), 1);
      await saveData(data);
      render(await getData());
    });
  });

  document.querySelectorAll('.add-variant').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const data = await getData();
      data[btn.dataset.trigger].variants.push('');
      await saveData(data);
      render(await getData());
    });
  });

  document.querySelectorAll('.remove-snippet').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const data = await getData();
      delete data[btn.dataset.trigger];
      await saveData(data);
      render(await getData());
    });
  });

  document.querySelectorAll('.mode-select').forEach((select) => {
    select.addEventListener('change', async () => {
      const data = await getData();
      data[select.dataset.trigger].mode = select.value;
      await saveData(data);
    });
  });
}

document.getElementById('addSnippetBtn').addEventListener('click', async () => {
  const triggerInput = document.getElementById('newTrigger');
  const trigger = triggerInput.value.trim();
  if (!trigger) return;

  const data = await getData();
  if (data[trigger]) {
    alert('That trigger already exists.');
    return;
  }

  data[trigger] = { variants: [''], mode: 'sequential' };
  await saveData(data);
  triggerInput.value = '';
  render(await getData());
});

(async () => {
  render(await getData());
})();
