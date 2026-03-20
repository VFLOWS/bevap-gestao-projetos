(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'execucaoProjetoTITT',
    'motivoDecisaoCategoriaTITT',
    'motivoDecisaoDescricaoTITT',
    'disponibilidadedaEquipeTITT',
    'dataDesejadaInicioTITT',
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
    'tblRiscosDependenciasTITT.riscoPotencialTITT'
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
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeText(value) {
    return asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function parseTableJson(value) {
    const text = asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[approvalTab][tiTriageHistory] invalid table JSON:', error);
      return [];
    }
  }

  function getExecutionInfo(mode) {
    const normalized = normalizeText(mode);

    if (normalized === 'externo') {
      return { label: 'Execução Externa', icon: 'fa-solid fa-handshake' };
    }

    if (normalized === 'interno') {
      return { label: 'Execução Interna', icon: 'fa-solid fa-users' };
    }

    return { label: asText(mode) || 'Não informado', icon: 'fa-solid fa-circle-info' };
  }

  function getCategoryLabel(value) {
    const normalized = normalizeText(value);
    const map = {
      capacidade: 'Capacidade da Equipe',
      competencia: 'Competência Técnica',
      prazo: 'Prazo/Urgência',
      dependencia: 'Dependência de Fornecedor',
      risco: 'Risco Alto',
      outro: 'Outro Motivo'
    };

    return map[normalized] || asText(value) || 'Não informado';
  }

  function formatDateBr(value) {
    const text = asText(value);
    if (!text) return '';

    // yyyy-mm-dd
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

    // dd/mm/yyyy (ou dd-mm-yyyy)
    const br = text.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (br) return `${br[1]}/${br[2]}/${br[3]}`;

    return text;
  }

  function parsePercent(value) {
    const text = asText(value);
    if (!text) return null;

    const match = text.match(/(\d{1,3})/);
    if (!match) return null;

    const num = Number(match[1]);
    if (Number.isNaN(num)) return null;

    return Math.max(0, Math.min(100, num));
  }

  async function loadRow(documentId) {
    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: { documentid: documentId }
    });

    return rows && rows.length ? rows[0] : null;
  }

  function getRiskLevelBadge(level) {
    const normalized = normalizeText(level);
    if (normalized === 'alto') return { label: 'Alto', badgeClasses: 'bg-red-100 text-red-800' };
    if (normalized === 'medio') return { label: 'Médio', badgeClasses: 'bg-yellow-100 text-yellow-800' };
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
      <div class="space-y-2">
        ${items.map((dep) => {
      const subtitle = [dep.status, dep.owner].filter(Boolean).join(' • ');
      return `
            <div class="p-4 bg-white border border-gray-200 rounded-lg">
              <div class="font-medium text-gray-900">${escapeHtml(dep.title || 'Dependência')}</div>
              ${subtitle ? `<div class="text-xs text-gray-600 mt-1">${escapeHtml(subtitle)}</div>` : ''}
              ${dep.mitigation ? `<div class="text-xs text-gray-600 mt-2 whitespace-pre-line"><strong>Mitigação:</strong> ${escapeHtml(dep.mitigation)}</div>` : ''}
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  async function render(options = {}) {
    const documentId = asText(options.documentId);
    if (!documentId) {
      return '<div class="text-sm text-gray-500">Selecione uma solicitação para visualizar a Triagem TI.</div>';
    }

    const row = await loadRow(documentId);
    if (!row) {
      return '<div class="text-sm text-gray-500">Nenhum dado de Triagem TI foi encontrado.</div>';
    }

    const execucao = asText(row.execucaoProjetoTITT);
    const execInfo = getExecutionInfo(execucao);

    const descricao = asText(row.motivoDecisaoDescricaoTITT);
    const categoriaLabel = getCategoryLabel(row.motivoDecisaoCategoriaTITT);

    const dateLabel = formatDateBr(row.dataDesejadaInicioTITT) || 'Não informado';

    const capacity = parsePercent(row.disponibilidadedaEquipeTITT);
    const capacityLabel = capacity === null ? 'Não informado' : `${capacity}%`;
    const capacityWidth = capacity === null ? 0 : capacity;

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
      .filter((risk) => risk.title || risk.description || risk.mitigation || risk.level || risk.impact || risk.probability);

    const legacyTableValue = row.tblRiscosDependenciasTITT || row['tblRiscosDependenciasTITT'] || row['tblRiscosDependenciasTITT.riscoPotencialTITT'];
    const legacyRisks = parseTableJson(legacyTableValue)
      .map((item) => asText(item && item.riscoPotencialTITT))
      .filter(Boolean);

    const dependencies = parseTableJson(row.tblDependenciasTITT || row['tblDependenciasTITT'])
      .map((item) => {
        return {
          title: asText(item && item.tituloDependenciaTITT),
          status: asText(item && item.statusDependenciaTITT),
          owner: asText(item && item.responsavelDependenciaTITT),
          mitigation: asText(item && item.mitigacaoDependenciaTITT)
        };
      })
      .filter((dep) => dep.title || dep.status || dep.owner || dep.mitigation);

    const descriptionText = descricao || 'Não informado.';

    return `
      <div class="space-y-6">
        <h2 class="text-xl font-montserrat font-bold text-bevap-navy mb-2 flex items-center">
          <i class="fa-solid fa-route mr-3 text-bevap-gold"></i>
          Triagem TI
        </h2>

        <div class="bg-gradient-to-r from-bevap-navy to-blue-900 text-white rounded-xl p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-xs uppercase tracking-wider text-white/80 mb-1">Resultado da Triagem</div>
              <h3 class="text-xl font-montserrat font-semibold">Decisão: ${escapeHtml(execInfo.label)}</h3>
              <p class="text-sm text-white/90 mt-2 whitespace-pre-line">${escapeHtml(descriptionText)}</p>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-bevap-navy whitespace-nowrap">
              <i class="${escapeHtml(execInfo.icon)} mr-1"></i> Aprovado na Triagem
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Categoria Principal</div>
            <div class="font-semibold text-bevap-navy">${escapeHtml(categoriaLabel)}</div>
            <p class="text-xs text-gray-600 mt-2 whitespace-pre-line">${escapeHtml(descricao || 'Não informado.')}</p>
          </div>

          <div class="bg-white border border-slate-200 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Data desejada de início</div>
            <div class="font-semibold text-bevap-navy">${escapeHtml(dateLabel)}</div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <div class="text-xs text-gray-500 mb-1">Capacidade Interna Atual</div>
          <div class="flex items-center justify-between mt-2">
            <span class="text-sm font-semibold text-bevap-navy">${escapeHtml(capacityLabel)}</span>
            <span class="text-xs text-gray-600">${escapeHtml(asText(row.disponibilidadedaEquipeTITT) ? 'Disponibilidade informada na triagem técnica' : 'Não informado')}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div class="bg-bevap-green h-2 rounded-full" style="width: ${capacityWidth}%"></div>
          </div>
        </div>

        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-bevap-navy mb-2 flex items-center">
            <i class="fa-solid fa-shield-halved text-bevap-gold mr-2"></i>
            Riscos e Dependências Monitoradas
          </h4>
          <div class="space-y-4">
            <div>
              <div class="text-xs font-semibold text-gray-700 mb-2">Riscos Identificados</div>
              ${identifiedRisks.length ? renderIdentifiedRisks(identifiedRisks) : legacyRisks.length ? `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  ${legacyRisks.map((text) => {
      return `
                      <div class="flex items-start bg-white border border-yellow-200 rounded-lg p-3">
                        <i class="fa-solid fa-triangle-exclamation text-bevap-gold mr-2 mt-0.5"></i>
                        <span class="text-gray-700">${escapeHtml(text)}</span>
                      </div>
                    `;
    }).join('')}
                </div>
              ` : '<div class="text-sm text-gray-500">Nenhum risco informado.</div>'}
            </div>

            <div>
              <div class="text-xs font-semibold text-gray-700 mb-2">Dependências Internas/Externas</div>
              ${renderDependencies(dependencies)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function mountAttachments() {
    // Triagem TI não tem anexos próprios nesta aba (por enquanto)
  }

  const registry = getRegistry();
  registry.tiTriageHistory = {
    render,
    mountAttachments
  };
})();
