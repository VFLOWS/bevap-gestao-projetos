(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const UI_KEY = 'gpUiComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'execucaoProjetoTITT',
    'motivoDecisaoCategoriaTITT',
    'motivoDecisaoDescricaoTITT',
    'disponibilidadedaEquipeTITT',
    'dataDesejadaInicioTITT',
    'fornecedorRecomendadoTITT',
    'tipoContratacaoTITT',
    'justifExecucaoExtTITT',
    'anexosApoioTITT',
    'escopoProjClaroDetTITT',
    'estimativasCustoPrazoRegTITT',
    'anexosEssenciaisPresentesTITT',
    'decisaoExecucaoDocumentadaTITT',
    'riscosDependenciasMapeadosTITT',
    'tblRiscosIdentificadosTITT.tituloRiscoTITT',
    'tblRiscosIdentificadosTITT.descricaoRiscoTITT',
    'tblRiscosIdentificadosTITT.mitigacaoRiscoTITT',
    'tblRiscosIdentificadosTITT.nivelRiscoTITT',
    'tblRiscosIdentificadosTITT.impactoRiscoTITT',
    'tblRiscosIdentificadosTITT.probabilidadeRiscoTITT',
    'tblDependenciasTITT.tituloDependenciaTITT',
    'tblDependenciasTITT.statusDependenciaTITT',
    'tblDependenciasTITT.responsavelDependenciaTITT',
    'tblDependenciasTITT.mitigacaoDependenciaTITT',
    'tblDependenciasTITT.planoBDependenciaTITT',
    'tblRiscosDependenciasTITT.riscoPotencialTITT'
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
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  }

  function escapeHtml(value) {
    return asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseTableJson(value) {
    const text = asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[approvalTab][technicalTriageHistory] invalid table JSON:', error);
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

  function getExecutionBadge(mode) {
    const normalized = asText(mode)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized === 'externo') {
      return {
        label: 'Execução Externa',
        badgeClasses: 'bg-yellow-100 text-yellow-800',
        iconClass: 'fa-solid fa-handshake'
      };
    }

    if (normalized === 'interno') {
      return {
        label: 'Execução Interna',
        badgeClasses: 'bg-green-100 text-green-800',
        iconClass: 'fa-solid fa-users'
      };
    }

    return {
      label: asText(mode) || 'Não informado',
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

  function getRiskLevelBadge(level) {
    const normalized = asText(level)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized === 'alto') return { label: 'Alto', badgeClasses: 'bg-red-100 text-red-800' };
    if (normalized === 'medio' || normalized === 'médio') return { label: 'Médio', badgeClasses: 'bg-yellow-100 text-yellow-800' };
    if (normalized === 'baixo') return { label: 'Baixo', badgeClasses: 'bg-green-100 text-green-800' };

    return { label: asText(level) || 'Não informado', badgeClasses: 'bg-slate-100 text-slate-700' };
  }

  function renderIdentifiedRisks(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum risco identificado.</div>';
    }

    return `
      <div class="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
        ${items.map((risk) => {
      const badge = getRiskLevelBadge(risk.level);
      return `
            <div class="p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="font-medium text-gray-900">${escapeHtml(risk.title || 'Risco')}</h4>
                <span class="inline-flex items-center px-2 py-1 ${escapeHtml(badge.badgeClasses)} text-xs font-medium rounded">${escapeHtml(badge.label)}</span>
              </div>
              ${risk.description ? `<p class="text-sm text-gray-700 mt-2 whitespace-pre-line">${escapeHtml(risk.description)}</p>` : ''}
              ${risk.mitigation ? `<p class="text-xs text-gray-600 mt-2 whitespace-pre-line"><strong>Mitigação:</strong> ${escapeHtml(risk.mitigation)}</p>` : ''}
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  function renderDependencies(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhuma dependência informada.</div>';
    }

    return `
      <div class="grid grid-cols-1 gap-3">
        ${items.map((dep) => {
      const status = escapeHtml(dep.status || 'Pendente');
      return `
            <div class="border border-blue-200 rounded-xl p-4 bg-blue-50/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div class="flex items-start justify-between mb-2 gap-3">
                <h6 class="font-medium text-bevap-navy">${escapeHtml(dep.title || 'Dependência')}</h6>
                <span class="px-2 py-1 text-xs rounded ${status === 'Bloqueada' ? 'bg-red-100 text-red-800' : status === 'Concluída' || status === 'Concluida' ? 'bg-green-100 text-green-800' : status === 'Em andamento' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">${status}</span>
              </div>
              <div class="text-sm text-gray-600 mb-1"><strong>Responsável:</strong> ${escapeHtml(dep.owner || 'Não informado')}</div>
              ${dep.mitigation ? `<div class="text-sm text-gray-700 mb-1 whitespace-pre-line"><strong>Mitigação:</strong> ${escapeHtml(dep.mitigation)}</div>` : ''}
              ${dep.fallback ? `<div class="text-sm text-gray-700 whitespace-pre-line"><strong>Plano B:</strong> ${escapeHtml(dep.fallback)}</div>` : ''}
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  async function loadRow(documentId) {
    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: { documentid: documentId }
    });

    return rows && rows.length ? rows[0] : null;
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

      const fieldName = String($el.attr('data-field') || 'anexosApoioTITT').trim() || 'anexosApoioTITT';

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
      return '<div class="text-sm text-gray-500">Selecione uma solicitação para visualizar a triagem técnica.</div>';
    }

    const row = await loadRow(documentId);
    if (!row) {
      return '<div class="text-sm text-gray-500">Nenhum dado da triagem técnica foi encontrado.</div>';
    }

    const execucao = asText(row.execucaoProjetoTITT);
    const badge = getExecutionBadge(execucao);
    const identifiedRisks = parseTableJson(row.tblRiscosIdentificadosTITT || row['tblRiscosIdentificadosTITT'])
      .map((item) => {
        return {
          title: asText(item && item.tituloRiscoTITT),
          description: asText(item && item.descricaoRiscoTITT),
          mitigation: asText(item && item.mitigacaoRiscoTITT),
          level: asText(item && item.nivelRiscoTITT),
          impact: asText(item && item.impactoRiscoTITT),
          probability: asText(item && item.probabilidadeRiscoTITT)
        };
      })
      .filter((risk) => {
        return risk.title || risk.description || risk.mitigation || risk.level || risk.impact || risk.probability;
      });

    const legacyRisks = parseTableJson(row.tblRiscosDependenciasTITT)
      .map((item) => asText(item && item.riscoPotencialTITT))
      .filter(Boolean);

    const dependencies = parseTableJson(row.tblDependenciasTITT || row['tblDependenciasTITT'])
      .map((item) => {
        return {
          title: asText(item && item.tituloDependenciaTITT),
          status: asText(item && item.statusDependenciaTITT),
          owner: asText(item && item.responsavelDependenciaTITT),
          mitigation: asText(item && item.mitigacaoDependenciaTITT),
          fallback: asText(item && item.planoBDependenciaTITT)
        };
      })
      .filter((dep) => dep.title || dep.status || dep.owner || dep.mitigation || dep.fallback);

    const checklistRows = [
      { label: 'Escopo do projeto está claro e detalhado', value: row.escopoProjClaroDetTITT },
      { label: 'Estimativas de custo e prazo registradas', value: row.estimativasCustoPrazoRegTITT },
      { label: 'Anexos essenciais estão presentes', value: row.anexosEssenciaisPresentesTITT },
      { label: 'Decisão de execução documentada', value: row.decisaoExecucaoDocumentadaTITT },
      { label: 'Riscos e dependências mapeados', value: row.riscosDependenciasMapeadosTITT }
    ];

    const externalInfo = asText(execucao).toLowerCase() === 'externo'
      ? `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-5 bg-white border border-gray-200 rounded-lg">
            <div class="flex items-center mb-2">
              <i class="fa-solid fa-building text-bevap-gold mr-2"></i>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Fornecedor</h3>
            </div>
            <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.fornecedorRecomendadoTITT || 'Não informado')}</p>
          </div>

          <div class="p-5 bg-white border border-gray-200 rounded-lg">
            <div class="flex items-center mb-2">
              <i class="fa-solid fa-file-signature text-bevap-green mr-2"></i>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Tipo de Contratação</h3>
            </div>
            <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.tipoContratacaoTITT || 'Não informado')}</p>
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-center mb-2">
            <i class="fa-solid fa-comment-dots text-bevap-navy mr-2"></i>
            <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Justificativa (Execução Externa)</h3>
          </div>
          <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.justifExecucaoExtTITT || 'Não informado')}</p>
        </div>
      `
      : '';

    const html = `
      <div class="space-y-6">
        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-1">Decisão de Execução</h3>
              <p class="text-sm text-gray-600">Resultado registrado na triagem técnica.</p>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs ${escapeHtml(badge.badgeClasses)} font-medium">
              <i class="${escapeHtml(badge.iconClass)} mr-1"></i>${escapeHtml(badge.label)}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-5 bg-white border border-gray-200 rounded-lg">
            <div class="flex items-center mb-2">
              <i class="fa-solid fa-layer-group text-bevap-green mr-2"></i>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Categoria do Motivo</h3>
            </div>
            <p class="text-sm text-gray-700">${escapeHtml(row.motivoDecisaoCategoriaTITT || 'Não informado')}</p>
          </div>
          <div class="p-5 bg-white border border-gray-200 rounded-lg">
            <div class="flex items-center mb-2">
              <i class="fa-solid fa-comment text-bevap-navy mr-2"></i>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Descrição do Motivo</h3>
            </div>
            <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.motivoDecisaoDescricaoTITT || 'Não informado')}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-5 bg-white border border-gray-200 rounded-lg">
            <div class="flex items-center mb-2">
              <i class="fa-solid fa-chart-pie text-bevap-green mr-2"></i>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Disponibilidade da Equipe</h3>
            </div>
            <p class="text-sm text-gray-700">${escapeHtml(row.disponibilidadedaEquipeTITT || 'Não informado')}${asText(row.disponibilidadedaEquipeTITT) ? '%' : ''}</p>
          </div>

          <div class="p-5 bg-white border border-gray-200 rounded-lg">
            <div class="flex items-center mb-2">
              <i class="fa-solid fa-calendar-day text-bevap-gold mr-2"></i>
              <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Data Desejada de Início</h3>
            </div>
            <p class="text-sm text-gray-700">${escapeHtml(row.dataDesejadaInicioTITT || 'Não informado')}</p>
          </div>
        </div>

        ${externalInfo}

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Riscos &amp; Dependências</h3>

          <div class="space-y-4">
            <div>
              <div class="text-sm font-semibold text-gray-800 mb-2">Riscos Identificados</div>
              ${identifiedRisks.length ? renderIdentifiedRisks(identifiedRisks) : legacyRisks.length ? `<div class="space-y-2">${legacyRisks.map((text) => {
      return `
                      <div class="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <i class="fa-solid fa-triangle-exclamation text-yellow-600 mt-0.5"></i>
                        <span class="text-sm text-gray-700">${escapeHtml(text)}</span>
                      </div>
                    `;
    }).join('')}</div>` : '<div class="text-sm text-gray-500">Nenhum risco informado.</div>'}
            </div>

            <div>
              <div class="text-sm font-semibold text-gray-800 mb-2">Dependências Internas/Externas</div>
              ${renderDependencies(dependencies)}
            </div>
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Checklist da Triagem</h3>
          <div class="space-y-3">
            ${renderCheckRows(checklistRows)}
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Anexos de Apoio</h3>
          <div data-gp-attachments data-field="anexosApoioTITT" class="divide-y">
            <div class="py-2 text-sm text-gray-500">—</div>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  async function renderInto(targetEl, options = {}) {
    const $target = targetEl && targetEl.jquery ? targetEl : $(targetEl);
    if (!$target || !$target.length) {
      return render(options);
    }

    const html = await render(options);
    $target.html(html);
    const documentId = asText(options && options.documentId);
    if (documentId) {
      mountAttachments($target, { documentId });
    }
    return html;
  }

  const registry = getRegistry();
  registry.technicalTriageHistory = {
    render: render,
    renderInto: renderInto,
    mountAttachments: mountAttachments
  };
})();
