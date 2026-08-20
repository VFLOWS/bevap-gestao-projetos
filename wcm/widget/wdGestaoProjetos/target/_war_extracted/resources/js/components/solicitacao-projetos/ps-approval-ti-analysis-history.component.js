(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'visibilidadetecnicaAPTI',
    'alternativasconsideradasAPTI',
    'esforcoestimadohorasAPTI',
    'esforcoestimadopontosAPTI',
    'dependenciastecnicasAPTI',
    'observacoesdaanaliseAPTI',
    'objetivoClaramenteDefinidoAPTI',
    'escopoBemDelimitadoAPTI',
    'documentacaoTecnicaAdeqAPTI',
    'patrocinadoridentificadoAPTI',
    'alinhEstratConfAPTI',
    'recursosTecDispAPTI',
    'anexosessenciaispresentesAPTI',
    'tblRiscosIdentificadosAPTI.nivelRiscoAPTI',
    'tblRiscosIdentificadosAPTI.descricaoRiscoAPTI'
  ];

  function getRegistry() {
    const $doc = $(document);
    const registry = $doc.data(KEY) || {};
    $doc.data(KEY, registry);
    return registry;
  }

  function asText(value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

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
      console.warn('[approvalTab][tiAnalysisHistory] invalid table JSON:', error);
      return [];
    }
  }

  function parseBooleanLike(value) {
    const normalized = asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized) return null;
    if (['true', '1', 'sim', 'yes', 'on'].indexOf(normalized) >= 0) return true;
    if (['false', '0', 'nao', 'no', 'off'].indexOf(normalized) >= 0) return false;
    return null;
  }

  function renderTextSection(title, value, iconClass) {
    return `
      <div class="p-5 bg-white border border-gray-200 rounded-lg">
        <div class="flex items-center mb-2">
          <i class="${iconClass} mr-2"></i>
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy">${escapeHtml(title)}</h3>
        </div>
        <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(value || 'Nao informado')}</p>
      </div>
    `;
  }

  function renderRiskRows(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum risco tecnico informado.</div>';
    }

    return items.map((item) => {
      const level = asText(item && item.nivelRiscoAPTI) || 'Nao informado';
      const description = asText(item && item.descricaoRiscoAPTI) || 'Nao informado';
      const normalized = level.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const badgeClasses = normalized.indexOf('alto') !== -1
        ? 'bg-red-100 text-red-700'
        : normalized.indexOf('medio') !== -1
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-green-100 text-green-700';

      return `
        <div class="flex items-start p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span class="inline-flex items-center px-2 py-1 rounded text-xs ${badgeClasses} font-medium mr-3">${escapeHtml(level)}</span>
          <div class="text-sm text-gray-700">${escapeHtml(description)}</div>
        </div>
      `;
    }).join('');
  }

  function renderCheckRows(rows) {
    return rows.map((item) => {
      const parsed = parseBooleanLike(item.value);
      const isYes = parsed === true;
      const label = isYes ? 'Sim' : parsed === false ? 'Nao' : 'Nao informado';
      const badgeClasses = isYes ? 'bg-green-100 text-green-700' : parsed === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700';
      const iconClass = isYes ? 'fa-circle-check text-bevap-green' : parsed === false ? 'fa-circle-xmark text-red-600' : 'fa-circle-info text-slate-500';

      return `
        <div class="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded-lg bg-white">
          <div class="flex items-center text-sm text-gray-700">
            <i class="fa-solid ${iconClass} mr-2"></i>
            <span>${escapeHtml(item.label)}</span>
          </div>
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}">${label}</span>
        </div>
      `;
    }).join('');
  }

  async function render(options = {}) {
    const documentId = asText(options.documentId);
    if (!documentId) {
      return '<div class="text-sm text-gray-500">Selecione uma solicitacao para visualizar a analise TI.</div>';
    }

    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: {
        documentid: documentId
      }
    });

    const row = rows && rows.length ? rows[0] : null;
    if (!row) {
      return '<div class="text-sm text-gray-500">Nenhum dado da analise TI foi encontrado.</div>';
    }

    const risks = parseTableJson(row.tblRiscosIdentificadosAPTI);
    const checklistRows = [
      { label: 'Objetivo claramente definido', value: row.objetivoClaramenteDefinidoAPTI },
      { label: 'Escopo bem delimitado', value: row.escopoBemDelimitadoAPTI },
      { label: 'Documentacao tecnica adequada', value: row.documentacaoTecnicaAdeqAPTI },
      { label: 'Patrocinador identificado', value: row.patrocinadoridentificadoAPTI },
      { label: 'Alinhamento estrategico confirmado', value: row.alinhEstratConfAPTI },
      { label: 'Recursos tecnicos disponiveis', value: row.recursosTecDispAPTI },
      { label: 'Anexos essenciais presentes', value: row.anexosessenciaispresentesAPTI }
    ];

    return `
      <div class="space-y-6">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center mb-2">
            <i class="fa-solid fa-microscope text-bevap-green text-xl mr-2"></i>
            <h3 class="font-montserrat font-semibold text-bevap-navy">Parecer TI</h3>
          </div>
          <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.visibilidadetecnicaAPTI || 'Nao informado')}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${renderTextSection('Alternativas Consideradas', row.alternativasconsideradasAPTI, 'fa-solid fa-lightbulb text-bevap-gold')}
          <div class="p-5 bg-white border border-gray-200 rounded-lg">
            <div class="flex items-center mb-3">
              <i class="fa-solid fa-chart-simple text-blue-600 mr-2"></i>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Esforco Estimado</h3>
            </div>
            <div class="space-y-3 text-sm text-gray-700">
              <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                <span>Horas</span>
                <span class="font-semibold text-bevap-navy">${escapeHtml(row.esforcoestimadohorasAPTI || 'Nao informado')}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Pontos</span>
                <span class="font-semibold text-bevap-navy">${escapeHtml(row.esforcoestimadopontosAPTI || 'Nao informado')}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Riscos Identificados</h3>
          <div class="space-y-3">
            ${renderRiskRows(risks)}
          </div>
        </div>

        ${renderTextSection('Dependencias Tecnicas', row.dependenciastecnicasAPTI, 'fa-solid fa-link text-bevap-navy')}
        ${renderTextSection('Observacoes da Analise', row.observacoesdaanaliseAPTI, 'fa-solid fa-comment-dots text-bevap-navy')}

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Checklist da Analise TI</h3>
          <div class="space-y-3">
            ${renderCheckRows(checklistRows)}
          </div>
        </div>
      </div>
    `;
  }

  const registry = getRegistry();
  registry.tiAnalysisHistory = {
    render: render
  };
})();
