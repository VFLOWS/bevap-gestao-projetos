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

  function renderField(label, value) {
    return `
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">${escapeHtml(label)}</label>
        <p class="text-sm text-gray-800">${escapeHtml(value || 'Nao informado')}</p>
      </div>
    `;
  }

  function renderItems(items) {
    if (!items.length) {
      return '<div class="text-sm text-gray-500">Nenhum item informado (mockado).</div>';
    }

    return `
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500">
              <th class="py-2 pr-3">Descricao</th>
              <th class="py-2 pr-3">Qtd.</th>
              <th class="py-2 pr-3">Valor Unit.</th>
              <th class="py-2">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            ${items.map((item) => {
              return `
                <tr>
                  <td class="py-2 pr-3 text-gray-800">${escapeHtml(item.descricao || '—')}</td>
                  <td class="py-2 pr-3 text-gray-800">${escapeHtml(item.quantidade || '—')}</td>
                  <td class="py-2 pr-3 text-gray-800">${escapeHtml(item.valorUnitario || '—')}</td>
                  <td class="py-2 text-gray-800">${escapeHtml(item.total || '—')}</td>
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

    const itens = parseTableJson(row.tblItensServicosTIPC).map((item) => {
      return {
        descricao: asText(item && item.descricaoItemServicoTIPC),
        quantidade: asText(item && item.quantidadeItemServicoTIPC),
        valorUnitario: asText(item && item.valorUnitarioItemServicoTIPC),
        total: asText(item && item.totalItemServicoTIPC)
      };
    });

    return `
      <div class="space-y-6">
        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-center mb-3">
            <i class="fa-solid fa-handshake text-bevap-green mr-2"></i>
            <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Resumo da Proposta (TIPC)</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${renderField('Fornecedor', row.nomeFornecedorTIPC || 'Mockado')}
            ${renderField('CNPJ', row.cnpjTIPC || 'Mockado')}
            ${renderField('Contato', row.nomeContatoTIPC || 'Mockado')}
            ${renderField('E-mail', row.emailTIPC || 'Mockado')}
            ${renderField('Telefone', row.telefoneTIPC || 'Mockado')}
            ${renderField('Nº/Ref. Proposta', row.numeroRefPropostaTIPC || 'Mockado')}
            ${renderField('Vigencia (dias)', row.vigenciaDiasTIPC || 'Mockado')}
            ${renderField('Valor total', row.valortotalTIPC || 'Mockado')}
            ${renderField('Moeda', row.moedaTIPC || 'Mockado')}
            ${renderField('Prazo estimado', row.prazoEstimadoTIPC || 'Mockado')}
            ${renderField('Condicao de pagamento', row.condicaoPagamentoTIPC || 'Mockado')}
          </div>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-center mb-2">
            <i class="fa-solid fa-align-left text-bevap-green mr-2"></i>
            <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Escopo resumido</h3>
          </div>
          <p class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(row.escopoResumidoTIPC || 'Mockado')}</p>
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-center mb-3">
            <i class="fa-solid fa-list text-bevap-green mr-2"></i>
            <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Itens / Servicos</h3>
          </div>
          ${renderItems(itens)}
        </div>

        <div class="p-5 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-center mb-3">
            <i class="fa-solid fa-paperclip text-bevap-green mr-2"></i>
            <h3 class="text-base font-montserrat font-semibold text-bevap-navy">Anexos da Proposta</h3>
          </div>
          <div data-gp-attachments data-field="anexosPropostaTIPC"></div>
        </div>
      </div>
    `;
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
    render
  };
})();
