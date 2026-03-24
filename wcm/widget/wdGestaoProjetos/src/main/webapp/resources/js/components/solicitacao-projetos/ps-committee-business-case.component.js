(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'beneficiosesperadosNS',
    'tblBeneficiosEsperadosNS.beneficioEsperadoNS',
    'tblObjetivosEstrategicosNS.descricaoobjetivoNS'
  ];

  function getRegistry() {
    const $doc = $(document);
    const registry = $doc.data(KEY) || {};
    $doc.data(KEY, registry);
    return registry;
  }

  function asText(value) {
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  }

  function escapeHtml(value) {
    return asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseTableJson(value) {
    const text = asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function parseLegacyRows(value) {
    const text = asText(value);
    if (!text) return [];

    if (text.indexOf('\n') === -1 && text.indexOf('\r') === -1) {
      return [text];
    }

    return text
      .split(/\r?\n/)
      .map((item) => asText(item))
      .filter(Boolean);
  }

  async function loadRow(documentId) {
    if (!documentId || typeof fluigService === 'undefined' || !fluigService.getDatasetRows) return null;

    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: { documentid: documentId }
    });

    return rows && rows.length ? rows[0] : null;
  }

  function buildModel(row) {
    const legacyBenefits = parseLegacyRows(row && row.beneficiosesperadosNS);
    const benefitsFromTable = parseTableJson(row && row.tblBeneficiosEsperadosNS)
      .map((item) => asText(item && item.beneficioEsperadoNS))
      .filter(Boolean);

    const benefits = benefitsFromTable.length ? benefitsFromTable : legacyBenefits;

    const objectives = parseTableJson(row && row.tblObjetivosEstrategicosNS)
      .map((item) => asText(item && item.descricaoobjetivoNS))
      .filter(Boolean);

    return { benefits, objectives };
  }

  function renderHtml(model) {
    const benefits = Array.isArray(model && model.benefits) ? model.benefits : [];
    const objectives = Array.isArray(model && model.objectives) ? model.objectives : [];

    const palette = [
      { bg: 'bg-green-50', border: 'border border-green-200', text: 'text-green-800' },
      { bg: 'bg-blue-50', border: 'border border-blue-200', text: 'text-blue-800' },
      { bg: 'bg-yellow-50', border: 'border border-yellow-200', text: 'text-yellow-800' },
      { bg: 'bg-purple-50', border: 'border border-purple-200', text: 'text-purple-800' }
    ];

    const benefitsHtml = benefits.length
      ? benefits.map((text, index) => {
        const theme = palette[index % palette.length];
        return `
          <div class="${escapeHtml(theme.bg)} ${escapeHtml(theme.border)} rounded-lg p-4">
            <p class="text-sm ${escapeHtml(theme.text)} whitespace-pre-line">${escapeHtml(text)}</p>
          </div>
        `;
      }).join('')
      : '<div class="text-sm text-gray-500 md:col-span-2">Nenhum benefício informado.</div>';

    const objectivesHtml = objectives.length
      ? `<ul class="list-disc pl-5 space-y-1">${objectives.map((item) => {
        return `<li class="text-sm text-blue-200 whitespace-pre-line">${escapeHtml(item)}</li>`;
      }).join('')}</ul>`
      : '<div class="text-sm text-blue-200">Nenhum objetivo estratégico informado.</div>';

    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Benefícios Esperados</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${benefitsHtml}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Alinhamento Estratégico</h3>
          <div class="bg-bevap-navy text-white rounded-lg p-4">
            ${objectivesHtml}
          </div>
        </div>
      </div>
    `;
  }

  async function render(options = {}) {
    const documentId = asText(options.documentId);
    if (!documentId) {
      return '<div class="text-sm text-gray-500">Selecione uma solicitação para visualizar o Business Case.</div>';
    }

    const row = options.row || await loadRow(documentId);
    if (!row) {
      return '<div class="text-sm text-gray-500">Não foi possível carregar dados do Business Case.</div>';
    }

    return renderHtml(buildModel(row));
  }

  async function renderInto(targetEl, options = {}) {
    const $target = targetEl && targetEl.jquery ? targetEl : $(targetEl);
    if (!$target || !$target.length) {
      return render(options);
    }

    $target.html('<div class="text-sm text-gray-500">Carregando Business Case...</div>');

    try {
      const html = await render(options);
      $target.html(html);
      return html;
    } catch (error) {
      $target.html('<div class="text-sm text-red-600">Não foi possível carregar esta aba.</div>');
      return '';
    }
  }

  const registry = getRegistry();
  registry.committeeBusinessCase = {
    render,
    renderInto
  };
})();
