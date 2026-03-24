(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const UI_KEY = 'gpUiComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = ['anexosNS', 'anexosApoioTITT'];

  function getRegistry() {
    const $doc = $(document);
    const registry = $doc.data(KEY) || {};
    $doc.data(KEY, registry);
    return registry;
  }

  function getUiComponents() {
    const ui = $(document).data(UI_KEY);
    return ui && typeof ui === 'object' ? ui : null;
  }

  function asText(value) {
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  }

  function parseJsonArraySafe(value) {
    if (Array.isArray(value)) return value;

    const text = asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function normalizeFileSizeToMb(rawSize) {
    if (rawSize === null || rawSize === undefined || rawSize === '') return null;

    const num = Number(rawSize);
    if (!isFinite(num) || num <= 0) return null;

    // Se vier muito grande, provavelmente bytes.
    if (num > 2048) {
      return Number((num / 1024 / 1024).toFixed(6));
    }

    return Number(num.toFixed(6));
  }

  function mergeAttachments(row) {
    const items = [];

    const pushNormalized = (raw) => {
      const documentId = asText(raw && (raw.documentId || raw.documentID || raw.id));
      const fileName = asText(raw && (raw.fileName || raw.filename || raw.name));
      if (!documentId || !fileName) return;

      const rawSize = raw && (raw.fileSize !== undefined ? raw.fileSize : raw.size);
      const fileSize = normalizeFileSizeToMb(rawSize);
      items.push({ documentId, fileName, fileSize });
    };

    parseJsonArraySafe(row && row.anexosNS).forEach(pushNormalized);
    parseJsonArraySafe(row && row.anexosApoioTITT).forEach(pushNormalized);

    const uniqueById = {};
    return items.filter((att) => {
      const key = asText(att && att.documentId);
      if (!key) return false;
      if (uniqueById[key]) return false;
      uniqueById[key] = true;
      return true;
    });
  }

  async function loadRow(documentId) {
    if (!documentId || typeof fluigService === 'undefined' || !fluigService.getDatasetRows) return null;

    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: { documentid: documentId }
    });

    return rows && rows.length ? rows[0] : null;
  }

  function renderHtml() {
    return `
      <div>
        <h2 class="text-xl font-montserrat font-bold text-bevap-navy mb-6 flex items-center">
          <i class="fa-solid fa-file-alt mr-3 text-bevap-gold"></i>
          Documentos do Projeto
        </h2>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Anexos do processo</h3>
          <div data-gp-attachments data-field="merged" class="divide-y">
            <div class="py-2 text-sm text-gray-500">Carregando anexos...</div>
          </div>
        </div>
      </div>
    `;
  }

  async function mountAttachments(rootEl, options = {}) {
    const ui = getUiComponents();
    if (!ui || !ui.attachments || typeof ui.attachments.render !== 'function') return;

    const $root = rootEl && rootEl.jquery ? rootEl : $(rootEl);
    if (!$root || !$root.length) return;

    const documentId = asText(options.documentId);
    const row = options.row;

    let merged = Array.isArray(options.value) ? options.value : null;
    if (!merged) {
      const baseRow = row || await loadRow(documentId);
      merged = mergeAttachments(baseRow || {});
    }

    $root.find('[data-gp-attachments]').each((_, el) => {
      const $el = $(el);
      if ($el.data('gpAttachmentsMounted')) return;
      $el.data('gpAttachmentsMounted', true);

      ui.attachments.render($el, {
        value: merged,
        emptyHtml: '<div class="py-2 text-sm text-gray-500">Nenhum documento anexado.</div>'
      });
    });
  }

  async function render(options = {}) {
    const documentId = asText(options.documentId);
    if (!documentId) {
      return '<div class="text-sm text-gray-500">Selecione uma solicitação para visualizar documentos.</div>';
    }

    // HTML não depende do dataset; anexos são montados depois.
    return renderHtml();
  }

  async function renderInto(targetEl, options = {}) {
    const $target = targetEl && targetEl.jquery ? targetEl : $(targetEl);
    if (!$target || !$target.length) {
      return render(options);
    }

    const html = await render(options);
    $target.html(html);

    try {
      await mountAttachments($target, options);
    } catch (error) {
      // silencioso
    }

    return html;
  }

  const registry = getRegistry();
  registry.committeeDocuments = {
    render,
    renderInto,
    mountAttachments
  };
})();
