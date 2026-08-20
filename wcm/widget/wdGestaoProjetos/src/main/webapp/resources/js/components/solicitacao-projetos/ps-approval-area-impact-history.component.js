(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'disponibilidadedaEquipeSI',
    'recursosNecessariosAreaSI',
    'conflitosdeAgendaSI',
    'prioridadeparaaAreaSI',
    'observacoesdoGestorSI',
    'equipepossuiDisponibilidadeSI',
    'recursosNecessIdentSI',
    'naoHaConflitosCriticosSI',
    'projetoAlinhadoPrioridadesSI'
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
        label: 'Crítico',
        badgeClasses: 'bg-red-100 text-red-700',
        iconClass: 'fa-solid fa-triangle-exclamation'
      };
    }

    if (normalized.indexOf('estrategico') !== -1) {
      return {
        label: 'Estratégico',
        badgeClasses: 'bg-green-100 text-green-800',
        iconClass: 'fa-solid fa-star'
      };
    }

    if (normalized.indexOf('operacional') !== -1) {
      return {
        label: 'Operacional',
        badgeClasses: 'bg-slate-100 text-slate-700',
        iconClass: 'fa-solid fa-cog'
      };
    }

    return {
      label: asText(priority) || 'Não informado',
      badgeClasses: 'bg-slate-100 text-slate-700',
      iconClass: 'fa-solid fa-circle-info'
    };
  }

  function renderCheckRows(rows) {
    return rows.map((item) => {
      const parsed = parseBooleanLike(item.value);
      const isYes = parsed === true;
      const label = isYes ? 'Sim' : parsed === false ? 'Não' : 'Não informado';
      const badgeClasses = isYes
        ? 'bg-green-100 text-green-700'
        : parsed === false
          ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-700';

      const iconClass = isYes
        ? 'fa-circle-check text-bevap-green'
        : parsed === false
          ? 'fa-circle-xmark text-red-600'
          : 'fa-circle-info text-slate-500';

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

  async function loadRow(documentId) {
    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: { documentid: documentId }
    });

    return rows && rows.length ? rows[0] : null;
  }

  async function render(options = {}) {
    const documentId = asText(options.documentId);
    if (!documentId) {
      return '<div class="text-sm text-gray-500">Selecione uma solicitação para visualizar o impacto na área.</div>';
    }

    const row = await loadRow(documentId);
    if (!row) {
      return '<div class="text-sm text-gray-500">Nenhum dado do impacto na área foi encontrado.</div>';
    }

    const capacityValue = asText(row.disponibilidadedaEquipeSI) || '0';
    const priority = getPriorityInfo(row.prioridadeparaaAreaSI);

    const checklistRows = [
      { label: 'Equipe possui disponibilidade para o projeto', value: row.equipepossuiDisponibilidadeSI },
      { label: 'Recursos necessários estão identificados', value: row.recursosNecessIdentSI },
      { label: 'Não há conflitos críticos de agenda', value: row.naoHaConflitosCriticosSI },
      { label: 'Projeto alinhado às prioridades da área', value: row.projetoAlinhadoPrioridadesSI }
    ];

    return `
      <div class="space-y-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            <i class="fa-solid fa-info-circle mr-2"></i>
            Impacto registrado pelo Superior Imediato.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Capacidade Atual</div>
            <div class="text-3xl font-bold text-bevap-navy">${escapeHtml(capacityValue)}%</div>
            <p class="text-sm text-gray-600 mt-2">Disponibilidade indicada para absorver a execução.</p>
          </div>

          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-3">Prioridade da Área</div>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs ${escapeHtml(priority.badgeClasses)} font-medium">
              <i class="${escapeHtml(priority.iconClass)} mr-1"></i> ${escapeHtml(priority.label)}
            </span>
            <p class="text-sm text-gray-600 mt-2">Classificação informada na aprovação do Superior Imediato.</p>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-5">
          <h4 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Recursos Necessários da Área</h4>
          <div class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.recursosNecessariosAreaSI || 'Não informado')}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-5">
          <h4 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Conflitos de Agenda</h4>
          <div class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.conflitosdeAgendaSI || 'Não informado')}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-5">
          <h4 class="text-base font-montserrat font-semibold text-bevap-navy mb-3 flex items-center">
            <i class="fa-solid fa-comment-dots mr-2 text-bevap-gold"></i>
            Observações do Gestor
          </h4>
          <div class="bg-slate-50 border-l-4 border-bevap-green rounded-r-lg p-3">
            <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.observacoesdoGestorSI || 'Não informado')}</p>
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Checklist do Impacto</h3>
          <div class="space-y-3">
            ${renderCheckRows(checklistRows)}
          </div>
        </div>
      </div>
    `;
  }

  const registry = getRegistry();
  registry.areaImpactHistory = { render: render };
})();
