(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'tblRiscosIdentificadosTITT.tituloRiscoTITT',
    'tblRiscosIdentificadosTITT.descricaoRiscoTITT',
    'tblRiscosIdentificadosTITT.mitigacaoRiscoTITT',
    'tblRiscosIdentificadosTITT.nivelRiscoTITT',
    'tblRiscosIdentificadosTITT.impactoRiscoTITT',
    'tblRiscosIdentificadosTITT.probabilidadeRiscoTITT',
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

  async function loadRow(documentId) {
    if (!documentId || typeof fluigService === 'undefined' || !fluigService.getDatasetRows) return null;

    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: { documentid: documentId }
    });

    return rows && rows.length ? rows[0] : null;
  }

  function scoreFromLabel(value) {
    const normalized = asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized) return null;
    if (normalized === 'baixo' || normalized === 'baixa') return 1;
    if (normalized === 'medio' || normalized === 'media') return 2;
    if (normalized === 'alto' || normalized === 'alta') return 5;
    return null;
  }

  function mean(values) {
    const nums = Array.isArray(values) ? values.filter((n) => typeof n === 'number' && isFinite(n)) : [];
    if (!nums.length) return null;
    return nums.reduce((acc, n) => acc + n, 0) / nums.length;
  }

  function bucketFromMean(avg) {
    if (avg === null || avg === undefined || !isFinite(avg)) {
      return {
        label: 'Não informado',
        badgeClasses: 'bg-slate-100 border border-slate-200 text-slate-700',
        iconClass: 'fa-solid fa-circle-info text-slate-500'
      };
    }

    const candidates = [
      { score: 1, label: 'Baixo', badgeClasses: 'bg-green-100 border border-green-200 text-green-800', iconClass: 'fa-solid fa-shield text-green-700' },
      { score: 2, label: 'Médio', badgeClasses: 'bg-yellow-100 border border-yellow-300 text-yellow-800', iconClass: 'fa-solid fa-triangle-exclamation text-yellow-600' },
      { score: 5, label: 'Alto', badgeClasses: 'bg-red-100 border border-red-200 text-red-800', iconClass: 'fa-solid fa-triangle-exclamation text-red-700' }
    ];

    let best = candidates[0];
    let bestDiff = Math.abs(avg - best.score);
    for (let i = 1; i < candidates.length; i += 1) {
      const diff = Math.abs(avg - candidates[i].score);
      if (diff < bestDiff) {
        best = candidates[i];
        bestDiff = diff;
      }
    }

    return best;
  }

  function buildModel(row) {
    const risks = parseTableJson(row && (row.tblRiscosIdentificadosTITT || row['tblRiscosIdentificadosTITT']))
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

    const legacyRisks = parseTableJson(row && row.tblRiscosDependenciasTITT)
      .map((item) => asText(item && item.riscoPotencialTITT))
      .filter(Boolean);

    const riskAvg = mean(risks.map((r) => scoreFromLabel(r.level)).filter((n) => n !== null));
    const impactAvg = mean(risks.map((r) => scoreFromLabel(r.impact)).filter((n) => n !== null));
    const probAvg = mean(risks.map((r) => scoreFromLabel(r.probability)).filter((n) => n !== null));

    return {
      risks,
      legacyRisks,
      riskBucket: bucketFromMean(riskAvg),
      impactBucket: bucketFromMean(impactAvg),
      probBucket: bucketFromMean(probAvg)
    };
  }

  function renderHtml(model) {
    const risks = Array.isArray(model && model.risks) ? model.risks : [];
    const legacyRisks = Array.isArray(model && model.legacyRisks) ? model.legacyRisks : [];
    const riskBucket = model && model.riskBucket ? model.riskBucket : bucketFromMean(null);
    const impactBucket = model && model.impactBucket ? model.impactBucket : bucketFromMean(null);
    const probBucket = model && model.probBucket ? model.probBucket : bucketFromMean(null);

    const listHtml = risks.length
      ? risks.map((risk) => {
        const levelBucket = bucketFromMean(scoreFromLabel(risk.level));
        const title = escapeHtml(risk.title || 'Risco');
        const desc = escapeHtml(risk.description);
        const miti = escapeHtml(risk.mitigation);

        return `
          <div class="p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h4 class="font-medium text-gray-900">${title}</h4>
              <span class="inline-flex items-center px-2 py-1 ${escapeHtml(levelBucket.badgeClasses)} text-xs font-medium rounded">${escapeHtml(levelBucket.label)}</span>
            </div>
            ${desc ? `<p class="text-sm text-gray-700 mt-2 whitespace-pre-line">${desc}</p>` : ''}
            ${miti ? `<p class="text-xs text-gray-600 mt-2 whitespace-pre-line"><strong>Mitigação:</strong> ${miti}</p>` : ''}
          </div>
        `;
      }).join('')
      : legacyRisks.length
        ? legacyRisks.map((text) => {
          return `
            <div class="p-4">
              <div class="flex items-start gap-3">
                <i class="fa-solid fa-triangle-exclamation text-yellow-600 mt-0.5"></i>
                <div class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(text)}</div>
              </div>
            </div>
          `;
        }).join('')
        : '<div class="p-4 text-sm text-gray-500">Nenhum risco identificado.</div>';

    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Matriz de Risco Geral</h3>
          <div class="border border-gray-200 rounded-lg">
            <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${escapeHtml(riskBucket.badgeClasses)}">
                  <i class="${escapeHtml(riskBucket.iconClass)} mr-2"></i>Risco ${escapeHtml(riskBucket.label)}
                </span>
                <span class="text-sm text-gray-600">Probabilidade: <span class="font-semibold text-gray-900">${escapeHtml(probBucket.label)}</span></span>
                <span class="text-sm text-gray-400">•</span>
                <span class="text-sm text-gray-600">Impacto: <span class="font-semibold text-gray-900">${escapeHtml(impactBucket.label)}</span></span>
              </div>
              <span class="text-xs text-gray-500">Visão geral</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Riscos Identificados</h3>
          <div class="divide-y divide-gray-200 border border-gray-200 rounded-lg">
            ${listHtml}
          </div>
        </div>
      </div>
    `;
  }

  async function render(options = {}) {
    const documentId = asText(options.documentId);
    if (!documentId) {
      return '<div class="text-sm text-gray-500">Selecione uma solicitação para visualizar Risco &amp; Compliance.</div>';
    }

    const row = options.row || await loadRow(documentId);
    if (!row) {
      return '<div class="text-sm text-gray-500">Não foi possível carregar dados de Risco &amp; Compliance.</div>';
    }

    return renderHtml(buildModel(row));
  }

  async function renderInto(targetEl, options = {}) {
    const $target = targetEl && targetEl.jquery ? targetEl : $(targetEl);
    if (!$target || !$target.length) {
      return render(options);
    }

    $target.html('<div class="text-sm text-gray-500">Carregando Risco &amp; Compliance...</div>');

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
  registry.committeeRiskCompliance = {
    render,
    renderInto
  };
})();
