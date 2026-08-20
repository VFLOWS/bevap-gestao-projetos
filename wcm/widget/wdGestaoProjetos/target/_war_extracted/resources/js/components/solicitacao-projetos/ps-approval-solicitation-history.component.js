(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const UI_KEY = 'gpUiComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'centrodecustoNS',
    'patrocinadorNS',
    'objetivodoprojetoNS',
    'problemaOportunidadeNS',
    'beneficiosesperadosNS',
    'alinhadobevapNS',
    'prioridadeNS',
    'escopoinicialNS',
    'foradeescopoNS',
    'dependenciasNS',
    'anexosNS',
    'observacoesadicionaisNS',
    'tblObjetivosEstrategicosNS.descricaoobjetivoNS',
    'tblRiscosIniciaisNS.riscoPotencialNS',
    'tblStakeholdersNS.valorstakeholdersNS'
  ];

  function getRegistry() {
    const $doc = $(document);
    const registry = $doc.data(KEY) || {};
    $doc.data(KEY, registry);
    return registry;
  }

  function getUiComponents() {
    const $doc = $(document);
    const ui = $doc.data(UI_KEY);
    return ui && typeof ui === 'object' ? ui : null;
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
      console.warn('[approvalTab][solicitationHistory] invalid table JSON:', error);
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

  function getPriorityInfo(priority) {
    const normalized = asText(priority)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.indexOf('critico') !== -1) {
      return {
        label: 'Critico',
        badgeClasses: 'bg-red-100 text-red-700',
        iconClass: 'fa-solid fa-circle-exclamation'
      };
    }

    if (normalized.indexOf('estrategico') !== -1) {
      return {
        label: 'Estrategico',
        badgeClasses: 'bg-green-100 text-green-800',
        iconClass: 'fa-solid fa-star'
      };
    }

    if (normalized.indexOf('operacional') !== -1) {
      return {
        label: 'Operacional',
        badgeClasses: 'bg-slate-100 text-slate-700',
        iconClass: 'fa-solid fa-circle'
      };
    }

    return {
      label: asText(priority) || 'Nao informado',
      badgeClasses: 'bg-slate-100 text-slate-700',
      iconClass: 'fa-solid fa-circle'
    };
  }

  function renderTextCard(iconClass, title, value) {
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

  function renderTagList(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum item informado.</div>';
    }

    return items.map((item) => {
      return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-bevap-navy text-white">
          ${escapeHtml(item)}
        </span>
      `;
    }).join('');
  }

  function renderRiskList(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum risco informado.</div>';
    }

    return items.map((item) => {
      return `
        <div class="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <i class="fa-solid fa-triangle-exclamation text-yellow-600 mt-0.5"></i>
          <span class="text-sm text-gray-700">${escapeHtml(item)}</span>
        </div>
      `;
    }).join('');
  }

  async function loadSolicitationRow(documentId) {
    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: {
        documentid: documentId
      }
    });

    return rows && rows.length ? rows[0] : null;
  }

  function buildViewModel(row) {
    const objectives = parseTableJson(row.tblObjetivosEstrategicosNS)
      .map((item) => asText(item && item.descricaoobjetivoNS))
      .filter(Boolean);
    const risks = parseTableJson(row.tblRiscosIniciaisNS)
      .map((item) => asText(item && item.riscoPotencialNS))
      .filter(Boolean);
    const stakeholders = parseTableJson(row.tblStakeholdersNS)
      .map((item) => asText(item && item.valorstakeholdersNS))
      .filter(Boolean);
    const priority = getPriorityInfo(row.prioridadeNS);
    const isAligned = parseBooleanLike(row.alinhadobevapNS) === true;

    return {
      row,
      objectives,
      risks,
      stakeholders,
      priority,
      isAligned
    };
  }

  function renderHtml(model) {
    const row = model.row;
    const objectives = model.objectives;
    const risks = model.risks;
    const stakeholders = model.stakeholders;
    const priority = model.priority;
    const isAligned = model.isAligned;

    return `
      <div class="space-y-6">
        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-1">Dados Basicos</h3>
              <p class="text-lg font-semibold text-gray-800">${escapeHtml(row.titulodoprojetoNS || 'Projeto sem titulo')}</p>
            </div>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs ${escapeHtml(priority.badgeClasses)} font-medium">
              <i class="${escapeHtml(priority.iconClass)} mr-1"></i>${escapeHtml(priority.label)}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Area/Unidade</label>
              <p class="text-gray-800">${escapeHtml(row.areaUnidadeNS || 'Nao informado')}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Centro de Custo</label>
              <p class="text-gray-800">${escapeHtml(row.centrodecustoNS || 'Nao informado')}</p>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-500 mb-1">Patrocinador</label>
              <p class="text-gray-800">${escapeHtml(row.patrocinadorNS || 'Nao informado')}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center px-4 py-3 border rounded-lg ${isAligned ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
          <i class="fa-solid ${isAligned ? 'fa-circle-check text-bevap-green' : 'fa-circle-xmark text-red-600'} mr-2"></i>
          <span class="text-sm font-medium ${isAligned ? 'text-bevap-green' : 'text-red-700'}">
            ${isAligned ? 'Alinhado aos objetivos estrategicos BEVAP' : 'Nao alinhado aos objetivos estrategicos BEVAP'}
          </span>
        </div>

        ${renderTextCard('fa-solid fa-bullseye text-bevap-green', 'Objetivo do Projeto', row.objetivodoprojetoNS)}
        ${renderTextCard('fa-solid fa-circle-exclamation text-bevap-gold', 'Problema/Oportunidade', row.problemaOportunidadeNS)}
        ${renderTextCard('fa-solid fa-chart-line text-bevap-green', 'Beneficios Esperados', row.beneficiosesperadosNS)}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${renderTextCard('fa-solid fa-list-check text-bevap-navy', 'Escopo Inicial', row.escopoinicialNS)}
          ${renderTextCard('fa-solid fa-ban text-red-600', 'Fora de Escopo', row.foradeescopoNS)}
        </div>

        ${renderTextCard('fa-solid fa-link text-bevap-navy', 'Dependencias', row.dependenciasNS)}

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Objetivos Estrategicos</h3>
          <div class="space-y-2">
            ${objectives.length ? objectives.map((item) => `
              <div class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-700">${escapeHtml(item)}</div>
            `).join('') : '<div class="text-sm text-gray-500">Nenhum objetivo informado.</div>'}
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Riscos Iniciais</h3>
          <div class="space-y-2">
            ${renderRiskList(risks)}
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Stakeholders</h3>
          <div class="flex flex-wrap gap-2">
            ${renderTagList(stakeholders)}
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Anexos</h3>
          <div data-gp-attachments data-field="anexosNS" class="divide-y">
            <div class="py-2 text-sm text-gray-500">—</div>
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Observacoes Adicionais</h3>
          <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.observacoesadicionaisNS || 'Nao informado')}</p>
        </div>
      </div>
    `;
  }

  function mountAttachments(rootEl, options = {}) {
    const ui = getUiComponents();
    if (!ui || !ui.attachments || typeof ui.attachments.render !== 'function') return;

    const $root = rootEl && rootEl.jquery ? rootEl : $(rootEl);
    if (!$root || !$root.length) return;

    const documentId = asText(options.documentId);
    const value = options.value;

    $root.find('[data-gp-attachments]').each((_, el) => {
      const $el = $(el);
      if ($el.data('gpAttachmentsMounted')) return;
      $el.data('gpAttachmentsMounted', true);

      const fieldName = String($el.attr('data-field') || 'anexosNS').trim() || 'anexosNS';

      // Preferir valor direto (evita nova ida ao dataset). Se não houver, deixa o componente buscar pelo documentId.
      if (value !== undefined) {
        ui.attachments.render($el, { fieldName, value });
        return;
      }

      if (documentId) {
        ui.attachments.render($el, { documentId, fieldName, datasetId: DATASET_ID });
      }
    });
  }


  async function render(options = {}) {
    const documentId = asText(options.documentId);
    if (!documentId) {
      return '<div class="text-sm text-gray-500">Selecione uma solicitacao para visualizar o historico.</div>';
    }

    const row = await loadSolicitationRow(documentId);
    if (!row) {
      return '<div class="text-sm text-gray-500">Nenhum dado da solicitacao foi encontrado.</div>';
    }

    return renderHtml(buildViewModel(row));
  }

  async function renderInto(targetEl, options = {}) {
    const $target = targetEl && targetEl.jquery ? targetEl : $(targetEl);
    if (!$target || !$target.length) {
      return render(options);
    }

    const documentId = asText(options.documentId);
    if (!documentId) {
      const emptyHtml = await render({ documentId: '' });
      $target.html(emptyHtml);
      return emptyHtml;
    }

    const row = await loadSolicitationRow(documentId);
    if (!row) {
      const emptyHtml = '<div class="text-sm text-gray-500">Nenhum dado da solicitacao foi encontrado.</div>';
      $target.html(emptyHtml);
      return emptyHtml;
    }

    const html = renderHtml(buildViewModel(row));
    $target.html(html);
    mountAttachments($target, { documentId, value: row.anexosNS });
    return html;
  }

  const registry = getRegistry();
  registry.solicitationHistory = {
    render: render,
    renderInto: renderInto,
    mountAttachments: mountAttachments
  };
})();
