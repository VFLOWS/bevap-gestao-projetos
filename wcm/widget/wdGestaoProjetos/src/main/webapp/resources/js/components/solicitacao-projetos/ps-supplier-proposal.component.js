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
    'numeroRefPropostaTIPC',
    'vigenciaDiasTIPC',
    'valortotalTIPC',
    'moedaTIPC',
    'prazoEstimadoTIPC',
    'condicaoPagamentoTIPC',
    'escopoResumidoTIPC',
    'anexosPropostaTIPC',
    'tblItensServicosTIPC.descricaoItemServicoTIPC',
    'tblItensServicosTIPC.quantidadeItemServicoTIPC',
    'tblItensServicosTIPC.valorUnitarioItemServicoTIPC',
    'tblItensServicosTIPC.totalItemServicoTIPC'
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
      console.warn('[approvalTab][supplierProposal] invalid table JSON:', error);
      return [];
    }
  }

  async function loadRow(documentId) {
    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: {
        documentid: documentId
      }
    });

    return rows && rows.length ? rows[0] : null;
  }

  function formatDays(value) {
    const text = asText(value);
    if (!text) return '';

    if (/^\d+$/.test(text)) {
      return `${text} dias`;
    }

    return text;
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
              <th class="px-4 py-2 text-left text-gray-700 font-medium">Descrição</th>
              <th class="px-4 py-2 text-center text-gray-700 font-medium">Qty</th>
              <th class="px-4 py-2 text-right text-gray-700 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${items.map((item) => {
              return `
                <tr>
                  <td class="px-4 py-3">${escapeHtml(item.descricao || '—')}</td>
                  <td class="px-4 py-3 text-center">${escapeHtml(item.quantidade || '—')}</td>
                  <td class="px-4 py-3 text-right font-medium">${escapeHtml(item.valor || '—')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderHtml(row) {
    if (!row) {
      return '<div class="text-sm text-gray-500">Nao foi possivel carregar a proposta do fornecedor.</div>';
    }

    const itens = parseTableJson(row.tblItensServicosTIPC || row['tblItensServicosTIPC']).map((item) => {
      const total = asText(item && item.totalItemServicoTIPC);
      const unit = asText(item && item.valorUnitarioItemServicoTIPC);

      return {
        descricao: asText(item && item.descricaoItemServicoTIPC),
        quantidade: asText(item && item.quantidadeItemServicoTIPC),
        valor: total || unit
      };
    });

    const supplierName = asText(row.nomeFornecedorTIPC) || 'Nao informado';
    const supplierCnpj = asText(row.cnpjTIPC) || 'Nao informado';

    const contactName = asText(row.nomeContatoTIPC) || 'Nao informado';
    const contactEmail = asText(row.emailTIPC);
    const contactPhone = asText(row.telefoneTIPC);

    const totalValue = asText(row.valortotalTIPC) || 'Nao informado';
    const currency = asText(row.moedaTIPC);

    const paymentCondition = asText(row.condicaoPagamentoTIPC) || 'Nao informado';
    const deadline = asText(row.prazoEstimadoTIPC) || 'Nao informado';
    const validity = formatDays(row.vigenciaDiasTIPC) || 'Nao informado';

    const scope = asText(row.escopoResumidoTIPC) || 'Nao informado';

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
                <div class="font-medium text-gray-900">${escapeHtml(supplierName)}</div>
                <div class="text-gray-600">CNPJ: ${escapeHtml(supplierCnpj)}</div>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Contato Principal</h3>
              <div class="space-y-1 text-sm">
                <div class="font-medium text-gray-900">${escapeHtml(contactName)}</div>
                ${contactEmail ? `<div class="text-gray-600">${escapeHtml(contactEmail)}</div>` : ''}
                ${contactPhone ? `<div class="text-gray-600">${escapeHtml(contactPhone)}</div>` : ''}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Valor Total</div>
              <div class="text-lg font-bold text-bevap-navy">${escapeHtml(totalValue)}</div>
              ${currency ? `<div class="text-xs text-green-600">${escapeHtml(currency)}</div>` : ''}
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Condição</div>
              <div class="text-sm font-medium text-gray-900">${escapeHtml(paymentCondition)}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Prazo</div>
              <div class="text-lg font-bold text-bevap-navy">${escapeHtml(deadline)}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Vigência</div>
              <div class="text-sm font-medium text-gray-900">${escapeHtml(validity)}</div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Escopo Resumido</h3>
            <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-line">${escapeHtml(scope)}</p>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3">Itens e Serviços</h3>
            ${renderItems(itens)}
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3 flex items-center">
              <i class="fa-solid fa-paperclip mr-2 text-bevap-gold"></i>
              Documentos da Proposta
            </h3>
            <div data-gp-attachments data-field="anexosPropostaTIPC" data-variant="prototype-cards"></div>
          </div>
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
