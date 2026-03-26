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
    'tblRiscosIniciaisTIPC.nivelRiscoTIPC',
    'tblRiscosIniciaisTIPC.impactoRiscoTIPC',
    'tblRiscosIniciaisTIPC.probabilidadeRiscoTIPC',
    'tblRiscosIniciaisTIPC.riscoPotencialTIPC',
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
      <div class="space-y-3">
        ${items.map((risk) => {
      const badge = getRiskBadge(risk.level);
      return `
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="flex items-center justify-between gap-3">
                <div class="font-medium text-gray-900">${escapeHtml(risk.title || 'Risco')}</div>
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${escapeHtml(badge.classes)}">${escapeHtml(badge.label)}</span>
              </div>
              ${risk.description ? `<p class="text-sm text-gray-700 mt-2 whitespace-pre-line">${escapeHtml(risk.description)}</p>` : ''}
              ${risk.mitigation ? `<p class="text-xs text-gray-600 mt-2 whitespace-pre-line"><strong>Mitigacao:</strong> ${escapeHtml(risk.mitigation)}</p>` : ''}
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  function renderPrerequisites(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum pre-requisito informado.</div>';
    }

    return `
      <div class="space-y-2">
        ${items.map((item) => `
          <div class="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <i class="fa-solid fa-triangle-exclamation text-yellow-600 mt-0.5"></i>
            <span class="text-sm text-gray-700">${escapeHtml(item)}</span>
          </div>
        `).join('')}
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
        level: asText(item && item.nivelRiscoTIPC),
        impact: asText(item && item.impactoRiscoTIPC),
        probability: asText(item && item.probabilidadeRiscoTIPC)
      };
    }).filter((item) => item.title || item.description || item.mitigation || item.level || item.impact || item.probability);

    const prerequisites = parseTableJson(row.tblPreRequisitosTIPC || row['tblPreRequisitosTIPC'])
      .map((item) => asText(item && item.preRequisitoTIPC))
      .filter(Boolean);

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

          ${additionalContact.length ? `
            <div class="mb-6">
              <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Contato Adicional</h3>
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-1">
                ${asText(row.nomeContato2TIPC) ? `<div class="font-medium text-gray-900">${escapeHtml(row.nomeContato2TIPC)}</div>` : ''}
                ${asText(row.email2TIPC) ? `<div class="text-gray-600">${escapeHtml(row.email2TIPC)}</div>` : ''}
                ${asText(row.telefone2TIPC) ? `<div class="text-gray-600">${escapeHtml(row.telefone2TIPC)}</div>` : ''}
              </div>
            </div>
          ` : ''}

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
              <div class="text-lg font-bold text-bevap-navy">${escapeHtml(asText(row.prazoEstimadoTIPC) || 'Nao informado')}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Vigencia</div>
              <div class="text-sm font-medium text-gray-900">${escapeHtml(formatDays(row.vigenciaDiasTIPC) || 'Nao informado')}</div>
            </div>
          </div>

          <div class="mb-6">
            <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Referencia</div>
            <div class="font-medium text-gray-900">${escapeHtml(asText(row.numeroRefPropostaTIPC) || 'Nao informado')}</div>
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
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Riscos Iniciais</h3>
            ${renderRisks(risks)}
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Pre-requisitos</h3>
            ${renderPrerequisites(prerequisites)}
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Checklist da Proposta</h3>
            ${renderChecklist(checklistItems)}
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
              <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3 flex items-center">
                <i class="fa-solid fa-comment-dots mr-2 text-bevap-gold"></i>
                Feedback da Aprovacao Comercial
              </h3>
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-gray-600">Decisao do solicitante</span>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${proposalDecisionBadge.classes}">${escapeHtml(proposalDecisionBadge.label)}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-gray-600">Concorda com a proposta</span>
                  <span class="font-medium text-gray-900">${agreementValue === true ? 'Sim' : agreementValue === false ? 'Nao' : 'Nao informado'}</span>
                </div>
                ${asText(row.observacoesNegociacaoSAP) ? `
                  <div class="bg-white border border-green-200 rounded-lg p-4">
                    <div class="text-xs uppercase tracking-wide text-gray-500 mb-2">Observacoes / Negociacao</div>
                    <p class="text-sm text-green-900 whitespace-pre-line">${escapeHtml(row.observacoesNegociacaoSAP)}</p>
                  </div>
                ` : ''}
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
      ui.attachments.render($el, { fieldName, value });
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
