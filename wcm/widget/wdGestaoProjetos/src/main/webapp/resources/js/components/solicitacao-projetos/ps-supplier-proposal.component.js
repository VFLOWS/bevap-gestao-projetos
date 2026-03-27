(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'nomeFornecedorTIPC',
    'cnpjTIPC',
    'nomeContatoTIPC',
    'emailTIPC',
    'telefoneTIPC',
    'nomeContato2TIPC',
    'email2TIPC',
    'telefone2TIPC',
    'numeroRefPropostaTIPC',
    'vigenciaDiasTIPC',
    'valortotalTIPC',
    'moedaTIPC',
    'prazoEstimadoTIPC',
    'condicaoPagamentoTIPC',
    'escopoResumidoTIPC',
    'anexosPropostaTIPC',
    'escopoClaroDetalhadoTIPC',
    'impostosTaxasInclusosTIPC',
    'prazosEntregaDefinidosTIPC',
    'garantiasSlaEspecificadosTIPC',
    'vigenciaPropostaConfirmadaTIPC',
    'documentosAnexCompTIPC',
    'decisaoPropostaSAP',
    'observacoesNegociacaoSAP',
    'liConcordoPropostaComercialSAP',
    'tblItensServicosTIPC.descricaoItemServicoTIPC',
    'tblItensServicosTIPC.quantidadeItemServicoTIPC',
    'tblItensServicosTIPC.valorUnitarioItemServicoTIPC',
    'tblItensServicosTIPC.totalItemServicoTIPC',
    'tblRiscosIniciaisTIPC.tituloRiscoTIPC',
    'tblRiscosIniciaisTIPC.descricaoRiscoTIPC',
    'tblRiscosIniciaisTIPC.mitigacaoRiscoTIPC',
    'tblRiscosIniciaisTIPC.planoBRiscoTIPC',
    'tblRiscosIniciaisTIPC.nivelRiscoTIPC',
    'tblRiscosIniciaisTIPC.impactoRiscoTIPC',
    'tblRiscosIniciaisTIPC.probabilidadeRiscoTIPC',
    'tblRiscosIniciaisTIPC.riscoPotencialTIPC',
    'tblPreRequisitosTIPC.tituloPreRequisitoTIPC',
    'tblPreRequisitosTIPC.statusPreRequisitoTIPC',
    'tblPreRequisitosTIPC.responsavelPreRequisitoTIPC',
    'tblPreRequisitosTIPC.mitigacaoPreRequisitoTIPC',
    'tblPreRequisitosTIPC.planoBPreRequisitoTIPC',
    'tblPreRequisitosTIPC.preRequisitoTIPC'
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
      console.warn('[approvalTab][supplierProposal] invalid table JSON:', error);
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

  function parseAttachmentsJson(value) {
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

  async function loadRow(documentId) {
    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: { documentid: documentId }
    });

    return rows && rows.length ? rows[0] : null;
  }

  function formatDays(value) {
    const text = asText(value);
    if (!text) return '';
    if (/^\d+$/.test(text)) return `${text} dias`;
    return text;
  }

  function formatWeeks(value) {
    const text = asText(value);
    if (!text) return '';
    if (/^\d+$/.test(text)) return `${text} Semana(s)`;
    return text;
  }

  function getRiskBadge(level) {
    const normalized = asText(level).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized === 'alto') return { label: 'Alto', classes: 'bg-red-100 text-red-800' };
    if (normalized === 'medio') return { label: 'Medio', classes: 'bg-yellow-100 text-yellow-800' };
    if (normalized === 'baixo') return { label: 'Baixo', classes: 'bg-green-100 text-green-800' };
    return { label: asText(level) || 'Nao informado', classes: 'bg-slate-100 text-slate-700' };
  }

  function renderItems(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum item informado.</div>';
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-gray-700 font-medium">Descricao</th>
              <th class="px-4 py-2 text-center text-gray-700 font-medium">Qtd</th>
              <th class="px-4 py-2 text-right text-gray-700 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${items.map((item) => `
              <tr>
                <td class="px-4 py-3">${escapeHtml(item.descricao || '-')}</td>
                <td class="px-4 py-3 text-center">${escapeHtml(item.quantidade || '-')}</td>
                <td class="px-4 py-3 text-right font-medium">${escapeHtml(item.valor || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRisks(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum risco informado.</div>';
    }

    return `
      <div class="grid grid-cols-1 gap-3">
        ${items.map((risk) => {
          const badge = getRiskBadge(risk.level);
          return `
              <div class="border border-yellow-300 rounded-xl p-4 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div class="flex items-start justify-between mb-2 gap-3">
                  <h6 class="font-medium text-bevap-navy">${escapeHtml(risk.title || 'Risco')}</h6>
                  <span class="text-xs font-semibold ${escapeHtml(badge.classes)} px-1.5 py-0.5 rounded">${escapeHtml(badge.label)}</span>
                </div>
                <div class="text-sm text-gray-600 mb-2">Probabilidade: ${escapeHtml(risk.probability || 'Nao informado')} | Impacto: ${escapeHtml(risk.impact || 'Nao informado')}</div>
                ${risk.mitigation ? `<div class="text-sm text-gray-700 mb-1"><strong>Mitigacao:</strong> ${escapeHtml(risk.mitigation)}</div>` : ''}
                ${escapeHtml(risk.fallback || risk.planoB || risk.planB || '') ? `<div class="text-sm text-gray-700"><strong>Plano B:</strong> ${escapeHtml(risk.fallback || risk.planoB || risk.planB || '')}</div>` : ''}
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  function getPrerequisiteStatusBadge(status) {
    const value = asText(status);
    if (value === 'Concluida' || value === 'Concluída') {
      return '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Concluida</span>';
    }
    if (value === 'Em andamento') {
      return '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Em andamento</span>';
    }
    if (value === 'Bloqueada') {
      return '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Bloqueada</span>';
    }
    return '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Pendente</span>';
  }

  function renderPrerequisites(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum pre-requisito informado.</div>';
    }

    return `
      <div class="grid grid-cols-1 gap-3">
        ${items.map((item) => {
          const title = escapeHtml((item && (item.title || item.titulo)) || item.value || item || '');
          const statusRaw = asText(item && (item.status || item.statusPreRequisitoTIPC));
          const owner = escapeHtml((item && (item.owner || item.responsavel)) || '');
          const mitigation = escapeHtml((item && (item.mitigation || item.mitigacao)) || '');
          const fallback = escapeHtml((item && (item.fallback || item.planoB)) || '');

          if (!title && !statusRaw && !owner && !mitigation && !fallback) return '';

          return `
            <div class="border border-blue-200 rounded-xl p-4 bg-blue-50/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="text-sm font-medium text-bevap-navy">${title || '-'}</div>
                </div>
                ${getPrerequisiteStatusBadge(statusRaw)}
              </div>
              ${(owner || mitigation || fallback) ? `
                <div class="mt-2 text-sm text-gray-600"><strong>Responsavel:</strong> ${owner || 'Nao informado'}</div>
                ${mitigation ? `<div class="mt-1 text-sm text-gray-700"><strong>Mitigacao:</strong> ${mitigation}</div>` : ''}
                ${fallback ? `<div class="mt-1 text-sm text-gray-700"><strong>Plano B:</strong> ${fallback}</div>` : ''}
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderRisksAndPrerequisites(risks, prerequisites) {
    return `
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <h4 class="text-lg font-semibold text-bevap-navy mb-5 flex items-center">
          <i class="fa-solid fa-shield-halved text-bevap-gold mr-2"></i>
          Riscos e Pré-requisitos
        </h4>
        <div class="space-y-6">
          <div>
            <div class="flex items-center mb-3">
              <h5 class="text-lg font-semibold text-bevap-navy flex items-center">
                <i class="fa-solid fa-triangle-exclamation text-yellow-500 mr-2"></i>
                Matriz de Riscos
              </h5>
            </div>
            ${renderRisks(risks)}
          </div>

          <div>
            <div class="flex items-center mb-3">
              <h5 class="text-lg font-semibold text-bevap-navy flex items-center">
                <i class="fa-solid fa-list-check text-blue-600 mr-2"></i>
                Pré-requisitos
              </h5>
            </div>
            ${renderPrerequisites(prerequisites)}
          </div>
        </div>
      </div>
    `;
  }

  function renderChecklist(items) {
    return `
      <div class="space-y-2">
        ${items.map((item) => {
      const parsed = parseBooleanLike(item.value);
      const badge = parsed === true
        ? { label: 'Sim', classes: 'bg-green-100 text-green-700', icon: 'fa-circle-check text-bevap-green' }
        : parsed === false
          ? { label: 'Nao', classes: 'bg-red-100 text-red-700', icon: 'fa-circle-xmark text-red-500' }
          : { label: 'Nao informado', classes: 'bg-slate-100 text-slate-700', icon: 'fa-circle-info text-slate-500' };

      return `
            <div class="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded-lg bg-white">
              <div class="flex items-center text-sm text-gray-700">
                <i class="fa-solid ${badge.icon} mr-2"></i>
                <span>${escapeHtml(item.label)}</span>
              </div>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.classes}">${badge.label}</span>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  function getProposalDecisionBadge(value) {
    const normalized = asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized === 'aprovado') return { label: 'Aprovado', classes: 'bg-green-100 text-green-800' };
    if (normalized === 'correcao') return { label: 'Correcao', classes: 'bg-yellow-100 text-yellow-800' };
    if (normalized === 'reprovado' || normalized === 'cancelado') return { label: 'Reprovado', classes: 'bg-red-100 text-red-800' };
    return { label: asText(value) || 'Nao informado', classes: 'bg-slate-100 text-slate-700' };
  }

  function renderHtml(row) {
    if (!row) {
      return '<div class="text-sm text-gray-500">Nao foi possivel carregar a proposta do fornecedor.</div>';
    }

    const items = parseTableJson(row.tblItensServicosTIPC || row['tblItensServicosTIPC']).map((item) => {
      return {
        descricao: asText(item && item.descricaoItemServicoTIPC),
        quantidade: asText(item && item.quantidadeItemServicoTIPC),
        valor: asText(item && item.totalItemServicoTIPC) || asText(item && item.valorUnitarioItemServicoTIPC)
      };
    }).filter((item) => item.descricao || item.quantidade || item.valor);

    const risks = parseTableJson(row.tblRiscosIniciaisTIPC || row['tblRiscosIniciaisTIPC']).map((item) => {
      const legacy = asText(item && item.riscoPotencialTIPC);
      return {
        title: asText(item && item.tituloRiscoTIPC) || legacy,
        description: asText(item && item.descricaoRiscoTIPC) || '',
        mitigation: asText(item && item.mitigacaoRiscoTIPC),
        fallback: asText(item && item.planoBRiscoTIPC),
        level: asText(item && item.nivelRiscoTIPC),
        impact: asText(item && item.impactoRiscoTIPC),
        probability: asText(item && item.probabilidadeRiscoTIPC)
      };
    }).filter((item) => item.title || item.description || item.mitigation || item.level || item.impact || item.probability);

    const prerequisites = parseTableJson(row.tblPreRequisitosTIPC || row['tblPreRequisitosTIPC']).map((item) => {
      const legacy = asText(item && item.preRequisitoTIPC);
      return {
        title: asText(item && item.tituloPreRequisitoTIPC) || legacy,
        status: asText(item && item.statusPreRequisitoTIPC),
        owner: asText(item && item.responsavelPreRequisitoTIPC),
        mitigation: asText(item && item.mitigacaoPreRequisitoTIPC),
        fallback: asText(item && item.planoBPreRequisitoTIPC)
      };
    }).filter((item) => item.title || item.status || item.owner || item.mitigation || item.fallback);

    const checklistItems = [
      { label: 'Escopo claro e detalhado', value: row.escopoClaroDetalhadoTIPC },
      { label: 'Impostos e taxas inclusos', value: row.impostosTaxasInclusosTIPC },
      { label: 'Prazos de entrega definidos', value: row.prazosEntregaDefinidosTIPC },
      { label: 'Garantias e SLA especificados', value: row.garantiasSlaEspecificadosTIPC },
      { label: 'Vigencia da proposta confirmada', value: row.vigenciaPropostaConfirmadaTIPC },
      { label: 'Documentos anexados e completos', value: row.documentosAnexCompTIPC }
    ];

    const additionalContact = [
      asText(row.nomeContato2TIPC),
      asText(row.email2TIPC),
      asText(row.telefone2TIPC)
    ].filter(Boolean);

    const hasCommercialApprovalFeedback = [
      row.decisaoPropostaSAP,
      row.observacoesNegociacaoSAP,
      row.liConcordoPropostaComercialSAP
    ].some((value) => asText(value));
    const proposalDecisionBadge = getProposalDecisionBadge(row.decisaoPropostaSAP);
    const agreementValue = parseBooleanLike(row.liConcordoPropostaComercialSAP);
    const agreementLabel = agreementValue === true ? 'Sim' : agreementValue === false ? 'Nao' : 'Nao informado';
    const feedbackBody = asText(row.observacoesNegociacaoSAP);

    return `
      <div class="space-y-6">
        <div>
          <h2 class="text-xl font-montserrat font-bold text-bevap-navy mb-6 flex items-center">
            <i class="fa-solid fa-handshake mr-3 text-bevap-gold"></i>
            Proposta do Fornecedor
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Fornecedor</h3>
              <div class="space-y-2 text-sm">
                <div class="font-medium text-gray-900">${escapeHtml(asText(row.nomeFornecedorTIPC) || 'Nao informado')}</div>
                <div class="text-gray-600">CNPJ: ${escapeHtml(asText(row.cnpjTIPC) || 'Nao informado')}</div>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Contato Principal</h3>
              <div class="space-y-1 text-sm">
                <div class="font-medium text-gray-900">${escapeHtml(asText(row.nomeContatoTIPC) || 'Nao informado')}</div>
                ${asText(row.emailTIPC) ? `<div class="text-gray-600">${escapeHtml(row.emailTIPC)}</div>` : ''}
                ${asText(row.telefoneTIPC) ? `<div class="text-gray-600">${escapeHtml(row.telefoneTIPC)}</div>` : ''}
              </div>
            </div>
          </div>

       

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Valor Total</div>
              <div class="text-lg font-bold text-bevap-navy">${escapeHtml(asText(row.valortotalTIPC) || 'Nao informado')}</div>
              ${asText(row.moedaTIPC) ? `<div class="text-xs text-green-600">${escapeHtml(row.moedaTIPC)}</div>` : ''}
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Condicao</div>
              <div class="text-sm font-medium text-gray-900">${escapeHtml(asText(row.condicaoPagamentoTIPC) || 'Nao informado')}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Prazo</div>
              <div class="text-lg font-bold text-bevap-navy">${escapeHtml(formatWeeks(row.prazoEstimadoTIPC) || 'Nao informado')}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Vigencia</div>
              <div class="text-sm font-medium text-gray-900">${escapeHtml(formatDays(row.vigenciaDiasTIPC) || 'Nao informado')}</div>
            </div>
          </div>

        

          <div class="mb-6">
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Escopo Resumido</h3>
            <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-line">${escapeHtml(asText(row.escopoResumidoTIPC) || 'Nao informado')}</p>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Itens e Servicos</h3>
            ${renderItems(items)}
          </div>

          <div class="mb-6">
            ${renderRisksAndPrerequisites(risks, prerequisites)}
          </div>

          

          <div class="mb-6">
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3 flex items-center">
              <i class="fa-solid fa-paperclip mr-2 text-bevap-gold"></i>
              Documentos da Proposta
            </h3>
            <div data-gp-attachments data-field="anexosPropostaTIPC" class="divide-y">
              <div class="py-2 text-sm text-gray-500">—</div>
            </div>
          </div>

          ${hasCommercialApprovalFeedback ? `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-bevap-navy mb-3 flex items-center">
                <i class="fa-solid fa-comment-dots mr-2 text-bevap-gold"></i>
                Feedback do Solicitante
              </h4>
              <div class="bg-white border border-green-200 rounded-lg p-4">
                <div class="mb-3">
                  <div class="font-semibold text-gray-900 text-sm">Solicitante</div>
                  <div class="text-xs text-gray-500">Decisao: ${escapeHtml(proposalDecisionBadge.label)} • Concorda com a proposta: ${escapeHtml(agreementLabel)}</div>
                </div>
                <p class="text-sm text-green-800 leading-relaxed whitespace-pre-line">${escapeHtml(feedbackBody || 'Sem observacoes registradas pelo solicitante.')}</p>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async function mountAttachments($root, params) {
    if (!$root || !$root.length) return;

    const ui = $(document).data('gpUiComponents');
    if (!ui || !ui.attachments || typeof ui.attachments.render !== 'function') return;

    const documentId = params && params.documentId ? String(params.documentId) : '';
    if (!documentId) return;

    let row;
    try {
      row = await loadRow(documentId);
    } catch (e) {
      row = null;
    }

    const value = row ? (row.anexosPropostaTIPC || row['anexosPropostaTIPC']) : null;

    $root.find('[data-gp-attachments]').each((_, el) => {
      const $el = $(el);
      if ($el.data('gpAttachmentsMounted')) return;
      $el.data('gpAttachmentsMounted', true);

      const fieldName = String($el.attr('data-field') || '').trim() || 'anexosPropostaTIPC';

      // Segue o mesmo padrão da aba de solicitação:
      // - Se houver JSON de anexos válido, renderiza direto.
      // - Caso contrário, deixa o componente buscar no dataset pelo documentId.
      const parsed = parseAttachmentsJson(value);
      if (parsed && parsed.length) {
        ui.attachments.render($el, { fieldName, value: parsed });
        return;
      }

      ui.attachments.render($el, { documentId, fieldName, datasetId: DATASET_ID });
    });
  }

  async function render(params) {
    const documentId = params && params.documentId ? String(params.documentId) : '';
    if (!documentId) {
      return '<div class="text-sm text-gray-500">documentId nao informado.</div>';
    }

    const row = await loadRow(documentId);
    return renderHtml(row);
  }

  const registry = getRegistry();
  registry.supplierProposal = {
    render,
    mountAttachments
  };
})();
