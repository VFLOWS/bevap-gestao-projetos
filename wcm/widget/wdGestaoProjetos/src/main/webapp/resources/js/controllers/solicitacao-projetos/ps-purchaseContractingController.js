const purchaseContractingController = {
  _eventNamespace: '.purchaseContracting',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _uiComponentsKey: 'gpUiComponents',
  _tabComponentsKey: 'gpApprovalTabComponents',
  _tabsRoot: null,
  _headerBackup: null,
  _toastTimer: null,
  _baseFields: [
    'documentid',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'patrocinadorNS',
    'solicitanteNomeNS',
    'solicitanteColleagueIdNS',
    'prioridadeNS',
    'estadoProcesso',
    'anexosNS',
    'anexosPropostaTIPC',
    'fornecedorRecomendadoTITT',
    'execucaoProjetoTITT',
    'nomeFornecedorTIPC',
    'numeroRefPropostaTIPC',
    'vigenciaDiasTIPC',
    'valortotalTIPC',
    'condicaoPagamentoTIPC',
    'prazoEstimadoTIPC',

    'capexGCC',
    'opexGCC',
    'tblNaturezaCustoCapexGCC.centroCustoCapexGCC',
    'tblNaturezaCustoCapexGCC.contaContabilCapexGCC',
    'tblNaturezaCustoCapexGCC.porcentagemCapexGCC',
    'tblNaturezaCustoCapexGCC.saldoCapexGCC',
    'tblNaturezaCustoCapexGCC.saldoAposCompromissoCapexGCC',
    'tblNaturezaCustoOpexGCC.centroCustoOpexGCC',
    'tblNaturezaCustoOpexGCC.contaContabilOpexGCC',
    'tblNaturezaCustoOpexGCC.porcentagemOpexGCC',
    'tblNaturezaCustoOpexGCC.saldoOpexGCC',
    'tblNaturezaCustoOpexGCC.saldoAposCompromissoOpexGCC',

    'tipoContratacaoCRC',
    'numeroPedidoContratoCRC',
    'dataEmissaoCRC',
    'inicioVigenciaCRC',
    'fimVigenciaCRC',
    'condicaoPagamentoCRC',
    'centroCustoCRC',
    'contaContabilCRC',
    'escopoAcordadoCRC',
    'slaGarantiaCRC',
    'multasRescisaoCRC',
    'pessoaJuridicaRegularCRC',
    'certidoesNegativasCRC',
    'lgpdCRC',
    'analiseSegurancaCRC',
    'seguroResponsabilidadeCRC',
    'anexosCRC',
    'escolhercondicaopagamentoCRC',
    'quantasVezesCondicaoCRC',
    'periodoEmDiasCondicaoCRC',
    'escolherparcelasCRC',
    'valorFinalCRC',
    'impostosEncargosCRC',
    'capexCRC',
    'opexCRC',
    'decisaoCRC',
    'justificativaCRC',
    'categoriajustiCRC'
  ],
  _state: {
    documentId: null,
    estadoProcesso: null,
    processInstanceId: null,
    baseRow: null,
    currentTab: 'solicitacao',
    historyCache: {},
    isSubmitting: false,
    attachments: [],
    paymentSchedule: [],
    costCenterOptions: [],
    allocationCostCenterFilters: {},
    paymentConditionFilter: null,
    paymentConditionOptions: [],
    pendingPaymentConditionSync: null,
    suppressPaymentConditionAutoSchedule: false
  },

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();

    this._state.documentId = params && params.documentId ? String(params.documentId) : null;
    this._state.estadoProcesso = params && params.estadoProcesso ? String(params.estadoProcesso) : null;
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : null;
    this._state.currentTab = this.normalizeTabParam(params && params.tab ? String(params.tab) : '') || 'solicitacao';

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.renderSidebarSkeleton();
        this.initializeTabs(this._state.currentTab);
        this.bindEvents();
        this.loadCostCenterOptions();
        this.initializePaymentConditionTagFilter();
        this.loadReadOnlyTab(this._state.currentTab);
        this.loadBaseContext();
      })
      .fail((error) => {
        console.error('[purchaseContracting] Template load error:', error);
        container.html('<div class="p-6 text-red-600">Falha ao carregar a tela de Compras.</div>');
      });
  },

  destroy: function () {
    this.unbindEvents();
    this.destroyAllAllocationCostCenterFilters();
    this.destroyTabs();
    this.restoreHeader();

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }

    this._state.documentId = null;
    this._state.estadoProcesso = null;
    this._state.processInstanceId = null;
    this._state.baseRow = null;
    this._state.currentTab = 'solicitacao';
    this._state.historyCache = {};
    this._state.isSubmitting = false;
    this._state.attachments = [];
    this._state.paymentSchedule = [];
    this._state.costCenterOptions = [];
    this._state.allocationCostCenterFilters = {};
    this._state.paymentConditionFilter = null;
    this._state.paymentConditionOptions = [];
    this._state.pendingPaymentConditionSync = null;
    this._state.suppressPaymentConditionAutoSchedule = false;
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-purchase-contracting.html`;
  },

  getContainer: function () {
    return $('#page-container');
  },

  getUiComponents: function () {
    if (typeof $ === 'undefined') return null;
    return $(document).data(this._uiComponentsKey) || null;
  },

  getTabComponents: function () {
    if (typeof $ === 'undefined') return {};
    return $(document).data(this._tabComponentsKey) || {};
  },

  backupAndSetHeader: function () {
    const header = $('#header');
    if (!header.length) return;

    const titleEl = header.find('h1').first();
    const breadcrumbEl = header.find('nav').first();

    if (!this._headerBackup) {
      this._headerBackup = {
        title: titleEl.length ? titleEl.text() : '',
        breadcrumbHtml: breadcrumbEl.length ? breadcrumbEl.html() : ''
      };
    }

    if (titleEl.length) {
      titleEl.text('Compras - Realizar Contratação');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Compras</span>
      `);
    }
  },

  restoreHeader: function () {
    if (!this._headerBackup) return;

    const header = $('#header');
    if (!header.length) return;

    const titleEl = header.find('h1').first();
    const breadcrumbEl = header.find('nav').first();

    if (titleEl.length) {
      titleEl.text(this._headerBackup.title || '');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(this._headerBackup.breadcrumbHtml || '');
    }

    this._headerBackup = null;
  },

  initializeTabs: function (defaultTabName) {
    const ui = this.getUiComponents();
    const tabsRoot = this.getContainer().find('[data-component="tabs"]').first();
    if (!ui || !ui.tabs || !tabsRoot.length) return;

    this.destroyTabs();
    this._tabsRoot = tabsRoot;

    ui.tabs.init(tabsRoot, {
      defaultTab: defaultTabName || 'solicitacao',
      hideNoticeOnOpen: true,
      onChange: (tabName) => {
        this._state.currentTab = String(tabName || 'solicitacao');
        this.loadReadOnlyTab(this._state.currentTab);
      }
    });

    if (defaultTabName) {
      try {
        ui.tabs.setActive(tabsRoot, defaultTabName);
      } catch (e) {}
    }
  },

  destroyTabs: function () {
    const ui = this.getUiComponents();
    if (ui && ui.tabs && this._tabsRoot && this._tabsRoot.length) {
      ui.tabs.destroy(this._tabsRoot);
    }
    this._tabsRoot = null;
  },

  bindEvents: function () {
    const root = this.getContainer();
    const ns = this._eventNamespace;
    this.unbindEvents();

    root.on(`click${ns}`, '#toast-close', (event) => {
      event.preventDefault();
      root.find('#toast').addClass('hidden');
      if (this._toastTimer) {
        clearTimeout(this._toastTimer);
        this._toastTimer = null;
      }
    });

    root.on(`click${ns}`, '[data-action="save-draft"]', (event) => {
      event.preventDefault();
      this.saveDraft();
    });

    root.on(`click${ns}`, '[data-action="show-timeline"]', (event) => {
      event.preventDefault();
      this.showToast('Linha do tempo em desenvolvimento', 'info');
    });

    root.on(`click${ns}`, '[data-action="show-attachments"]', (event) => {
      event.preventDefault();
      this.openAttachmentsFromSidebar();
    });

    root.on(`click${ns}`, '[data-action="open-approve-modal"]', (event) => {
      event.preventDefault();
      this.openModal('approve-modal');
    });

    root.on(`click${ns}`, '[data-action="open-return-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-return');
    });

    root.on(`click${ns}`, '[data-action="open-reject-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-reject');
    });

    root.on(`click${ns}`, '[data-action="close-modal"]', (event) => {
      event.preventDefault();
      const modalId = this.asText($(event.currentTarget).attr('data-modal-id'));
      if (modalId) this.closeModal(modalId);
    });

    root.on(`click${ns}`, '#approve-modal, #modal-return, #modal-reject, #finance-installment-edit-modal', (event) => {
      if (event.target === event.currentTarget) {
        $(event.currentTarget).addClass('hidden');
      }
    });

    root.on(`click${ns}`, '[data-action="confirm-approve"]', (event) => {
      event.preventDefault();
      this.handleApprove();
    });

    root.on(`click${ns}`, '[data-action="confirm-return"]', (event) => {
      event.preventDefault();
      this.handleReturn();
    });

    root.on(`click${ns}`, '[data-action="confirm-reject"]', (event) => {
      event.preventDefault();
      this.handleReject();
    });

    root.on(`change${ns}`, 'input[name="contract-type"]', () => {
      this.updateContractTypeCards();
    });

    root.on(`change${ns}`, '#contract-cost-nature-capex', () => this.handleCostNatureToggle('capex'));
    root.on(`change${ns}`, '#contract-cost-nature-opex', () => this.handleCostNatureToggle('opex'));

    root.on(`click${ns}`, '[data-action="add-capex-row"]', (event) => {
      event.preventDefault();
      this.addAllocationRow('capex');
    });

    root.on(`click${ns}`, '[data-action="add-opex-row"]', (event) => {
      event.preventDefault();
      this.addAllocationRow('opex');
    });

    root.on(`click${ns}`, '[data-action="remove-allocation-row"]', (event) => {
      event.preventDefault();
      this.removeAllocationRow(event.currentTarget);
    });

    root.on(`input${ns}`, '#contract-capex-percent', () => {
      this.syncCostNaturePercentages('capex');
    });

    root.on(`input${ns}`, '#contract-opex-percent', () => {
      this.syncCostNaturePercentages('opex');
    });

    root.on(`input${ns}`, '.crc-allocation-row [data-field="committed"], .crc-allocation-row [data-field="balance"]', (event) => {
      this.applyCurrencyMaskInput(event.currentTarget);
      this.recomputeAllocationRow($(event.currentTarget).closest('.crc-allocation-row'));
      this.refreshCostNatureTotals();
    });

    root.on(`blur${ns}`, '.crc-allocation-row [data-field="committed"], .crc-allocation-row [data-field="balance"]', (event) => {
      this.normalizeCurrencyInput(event.currentTarget);
      this.recomputeAllocationRow($(event.currentTarget).closest('.crc-allocation-row'));
      this.refreshCostNatureTotals();
    });

    root.on(`change${ns}`, '#contract-issue-date', () => {
      this.generateAndRenderPaymentSchedule();
    });

    root.on(`change${ns}`, '#crc-check-pj, #crc-check-certidoes, #crc-check-lgpd, #crc-check-seguranca, #crc-check-seguro', () => {
      this.applyComplianceChecklistStyles();
    });

    root.on(`click${ns}`, '[data-action="edit-installment"]', (event) => {
      event.preventDefault();
      const index = Number($(event.currentTarget).attr('data-index'));
      this.openInstallmentEditModal(index);
    });

    root.on(`input${ns}`, '#installment-edit-amount', (event) => {
      this.applyCurrencyMaskInput(event.currentTarget);
    });

    root.on(`blur${ns}`, '#installment-edit-amount', (event) => {
      this.normalizeCurrencyInput(event.currentTarget);
    });

    root.on(`click${ns}`, '[data-action="save-installment-edit"]', (event) => {
      event.preventDefault();
      this.saveInstallmentEdit();
    });

    root.on(`dragover${ns}`, '#crc-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).addClass('border-bevap-green bg-green-50');
    });

    root.on(`dragleave${ns}`, '#crc-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('border-bevap-green bg-green-50');
    });

    root.on(`drop${ns}`, '#crc-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('border-bevap-green bg-green-50');
      const files = event.originalEvent && event.originalEvent.dataTransfer ? event.originalEvent.dataTransfer.files : null;
      this.addAttachments(files);
    });

    root.on(`change${ns}`, '#crc-attachments-input', (event) => {
      const files = event.currentTarget && event.currentTarget.files ? event.currentTarget.files : null;
      this.addAttachments(files);
      try { event.currentTarget.value = ''; } catch (e) {}
    });

    root.on(`click${ns}`, '[data-action="remove-crc-attachment"]', (event) => {
      event.preventDefault();
      const attachmentId = this.asText($(event.currentTarget).attr('data-attachment-id'));
      if (attachmentId) this.removeAttachment(attachmentId);
    });
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
  },

  openModal: function (id) {
    if (id) this.getContainer().find(`#${id}`).removeClass('hidden');
  },

  closeModal: function (id) {
    if (id) this.getContainer().find(`#${id}`).addClass('hidden');
  },

  getReadOnlyTabConfig: function (tabName) {
    return {
      solicitacao: { key: 'solicitationHistory', mount: 'tab-solicitacao-history' },
      'analise-ti': { key: 'tiAnalysisHistory', mount: 'tab-analise-ti-history' },
      impacto: { key: 'areaImpactHistory', mount: 'tab-impacto-history' },
      'triagem-ti': { key: 'tiTriageHistory', mount: 'tab-triagem-ti-history' },
      'proposta-fornecedor': { key: 'supplierProposal', mount: 'tab-proposta-fornecedor' }
    }[tabName] || null;
  },

  normalizeTabParam: function (tabParam) {
    const normalized = this.asText(tabParam).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return {
      solicitacao: 'solicitacao',
      'analise-ti': 'analise-ti',
      analise: 'analise-ti',
      impacto: 'impacto',
      'triagem-ti': 'triagem-ti',
      triagem: 'triagem-ti',
      'proposta-fornecedor': 'proposta-fornecedor',
      proposta: 'proposta-fornecedor',
      contratacao: 'contratacao',
      compliance: 'compliance',
      financeiro: 'financeiro'
    }[normalized] || '';
  },

  loadReadOnlyTab: async function (tabName) {
    const config = this.getReadOnlyTabConfig(tabName);
    if (!config) return;

    const target = this.getContainer().find(`[data-component="${config.mount}"]`).first();
    if (!target.length) return;

    const components = this.getTabComponents();
    const component = components[config.key];
    const options = { documentId: this._state.documentId, row: this._state.baseRow || null };

    if (this._state.historyCache[tabName]) {
      target.html(this._state.historyCache[tabName]);
      this.mountAttachmentsInTab(target, component, options);
      return;
    }

    if (!component || typeof component.render !== 'function') {
      target.html('<div class="text-sm text-red-600">Componente da aba indisponível.</div>');
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteúdo...</div>');

    try {
      const html = typeof component.renderInto === 'function'
        ? await component.renderInto(target, options)
        : await component.render(options);

      this._state.historyCache[tabName] = html;
      if (typeof component.renderInto !== 'function') {
        target.html(html);
      }
      this.mountAttachmentsInTab(target, component, options);
    } catch (error) {
      console.error(`[purchaseContracting] Error loading tab ${tabName}:`, error);
      target.html('<div class="text-sm text-red-600">Não foi possível carregar esta aba.</div>');
    }
  },

  mountAttachmentsInTab: function (tabRootEl, component, options) {
    if (component && typeof component.mountAttachments === 'function') {
      try {
        component.mountAttachments(tabRootEl, Object.assign({ documentId: this._state.documentId }, options));
      } catch (error) {}
    }
  },

  loadBaseContext: async function () {
    try {
      const row = await this.findBaseRow();
      this._state.baseRow = row;

      if (!row) {
        this.renderSidebarSkeleton();
        this.showToast('Não encontrado', 'Não foi possível localizar dados da solicitação.', 'warning');
        return;
      }

      await this.renderSidebarFromRow(row);
      this.fillFieldsFromRow(row);
      this.updateApproveModalProject(row);
    } catch (error) {
      console.error('[purchaseContracting] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Não foi possível carregar os dados de Compras.', 'error');
    }
  },

  findBaseRow: async function () {
    const fields = this._baseFields;

    const docId = this.asText(this._state.documentId);
    if (docId) {
      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields,
        filters: { documentid: docId }
      });
      if (rows && rows.length) return rows[0];
    }

    const processId = this.asText(this._state.processInstanceId);
    if (processId) {
      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields,
        filters: { NUM_PROCES: processId }
      });
      if (rows && rows.length) {
        const row = rows[0];
        if (!docId) {
          this._state.documentId = this.asText(row && row.documentid) || null;
        }
        return row;
      }
    }

    return null;
  },

  updateApproveModalProject: function (row) {
    const label = [this.asText(row.documentid), this.asText(row.titulodoprojetoNS)].filter(Boolean).join(' - ');
    this.getContainer().find('#purchase-approve-project').text(label || 'Projeto selecionado');
  },

  renderSidebarSkeleton: function () {
    const root = this.getContainer();
    this.renderProjectSummarySidebar({
      code: 'N/A',
      title: 'N/A',
      requester: 'N/A',
      area: 'N/A',
      sponsor: 'N/A',
      priorityLabel: 'N/A',
      priorityClasses: 'bg-gray-100 text-gray-700',
      typeLabel: 'N/A',
      typeClasses: 'bg-gray-100 text-gray-700',
      supplier: 'Não informado',
      totalValue: 'R$ 0,00',
      payment: 'Não informado',
      vigencia: 'Não informado',
      statusLabel: 'Aguardando Compras'
    });

    this.renderSidebarProgress();
  },

  renderSidebarFromRow: async function (row) {
    const totalValueRaw = this.parseCurrencyValue(this.asText(row.valorFinalCRC)) !== null
      ? this.asText(row.valorFinalCRC)
      : this.asText(row.valortotalTIPC);
    const projectCode = await fluigService.resolveProjectSummaryCode({
      documentId: this.asText(row && row.documentid) || this.asText(this._state.documentId),
      processInstanceId: this.asText(this._state.processInstanceId)
    }) || 'N/A';

    this.renderProjectSummarySidebar({
      code: projectCode,
      title: this.asText(row.titulodoprojetoNS) || 'N/A',
      requester: this.asText(row.solicitanteNomeNS) || 'N/A',
      area: this.asText(row.areaUnidadeNS) || 'N/A',
      sponsor: this.asText(row.patrocinadorNS) || 'N/A',
      priorityLabel: this.getPriorityLabel(row.prioridadeNS) || 'N/A',
      priorityClasses: this.getPriorityBadgeClasses(row.prioridadeNS),
      typeLabel: this.getExecutionTypeLabel(row.execucaoProjetoTITT) || 'N/A',
      typeClasses: this.getExecutionTypeBadgeClasses(row.execucaoProjetoTITT),
      supplier: this.asText(row.fornecedorRecomendadoTITT) || this.asText(row.nomeFornecedorTIPC) || 'Não informado',
      totalValue: totalValueRaw ? this.formatCurrency(this.parseCurrencyValue(totalValueRaw) || 0) : 'R$ 0,00',
      payment: this.asText(row.condicaoPagamentoCRC) || this.asText(row.condicaoPagamentoTIPC) || 'Não informado',
      vigencia: this.formatSummaryVigencia(row.vigenciaDiasTIPC) || 'Não informado',
      statusLabel: 'Aguardando Compras'
    });

    this.renderSidebarProgress();
  },

  renderProjectSummarySidebar: function (summary) {
    const target = this.getContainer().find('[data-component="project-summary"]').first();
    if (!target.length) return;

    const code = this.escapeHtml(this.asText(summary && summary.code) || 'N/A');
    const title = this.escapeHtml(this.asText(summary && summary.title) || 'N/A');
    const requester = this.escapeHtml(this.asText(summary && summary.requester) || 'N/A');
    const area = this.escapeHtml(this.asText(summary && summary.area) || 'N/A');
    const sponsor = this.escapeHtml(this.asText(summary && summary.sponsor) || 'N/A');
    const priorityLabel = this.escapeHtml(this.asText(summary && summary.priorityLabel) || 'N/A');
    const priorityClasses = this.escapeHtml(this.asText(summary && summary.priorityClasses) || 'bg-gray-100 text-gray-700');
    const typeLabel = this.escapeHtml(this.asText(summary && summary.typeLabel) || 'N/A');
    const typeClasses = this.escapeHtml(this.asText(summary && summary.typeClasses) || 'bg-gray-100 text-gray-700');
    const supplier = this.escapeHtml(this.asText(summary && summary.supplier) || 'Não informado');
    const totalValue = this.escapeHtml(this.asText(summary && summary.totalValue) || 'R$ 0,00');
    const payment = this.escapeHtml(this.asText(summary && summary.payment) || 'Não informado');
    const vigencia = this.escapeHtml(this.asText(summary && summary.vigencia) || 'Não informado');
    const statusLabel = this.escapeHtml(this.asText(summary && summary.statusLabel) || 'Aguardando Compras');

    target.html(`
      <div class="bg-white rounded-lg shadow-md p-5">
        <h3 class="font-montserrat font-bold text-lg text-bevap-navy mb-4 flex items-center">
          <i class="fa-solid fa-project-diagram mr-2 text-bevap-gold"></i>
          Resumo do Projeto
        </h3>

        <div class="space-y-3 text-sm">
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Código</span>
            <span class="font-mono font-semibold text-bevap-navy">${code}</span>
          </div>
          <div class="pb-2 border-b">
            <span class="text-gray-600">Título</span>
            <p class="font-medium text-gray-900 mt-1">${title}</p>
          </div>
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Solicitante</span>
            <span class="font-medium text-gray-900">${requester}</span>
          </div>
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Área</span>
            <span class="font-medium text-gray-900">${area}</span>
          </div>
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Patrocinador</span>
            <span class="font-medium text-gray-900">${sponsor}</span>
          </div>
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Prioridade</span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${priorityClasses}">
              <i class="fa-solid fa-circle-exclamation mr-1"></i> ${priorityLabel}
            </span>
          </div>
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Tipo</span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeClasses}">
              <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i> ${typeLabel}
            </span>
          </div>
          <div class="pb-2 border-b">
            <span class="text-gray-600">Fornecedor Recomendado</span>
            <p class="font-medium text-gray-900 mt-1">${supplier}</p>
          </div>
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Valor</span>
            <span class="font-bold text-bevap-green">${totalValue}</span>
          </div>
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Pagamento</span>
            <span class="font-medium text-gray-900">${payment}</span>
          </div>
          <div class="flex items-center justify-between pb-2 border-b">
            <span class="text-gray-600">Vigência</span>
            <span class="font-medium text-gray-900">${vigencia}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Status</span>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
              <i class="fa-solid fa-clipboard-check mr-1"></i> ${statusLabel}
            </span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t space-y-2">
          <button type="button" data-action="show-timeline" class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-bevap-navy border border-bevap-navy rounded-lg hover:bg-gray-50 transition-colors">
            <i class="fa-solid fa-timeline mr-2"></i> Linha do Tempo
          </button>
          <button type="button" data-action="show-attachments" class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-bevap-green border border-bevap-green rounded-lg hover:bg-green-50 transition-colors">
            <i class="fa-solid fa-paperclip mr-2"></i> Ver Anexos
          </button>
        </div>
      </div>
    `);
  },

  renderSidebarProgress: function () {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    ui.sidebar.renderProgress(this.getContainer().find('[data-component="progress-status"]').first(), {
      items: this.getProgressItems()
    });
  },

  openAttachmentsFromSidebar: async function () {
    const ui = this.getUiComponents();
    if (ui && ui.tabs && this._tabsRoot) {
      ui.tabs.setActive(this._tabsRoot, 'solicitacao');
    }

    await this.loadReadOnlyTab('solicitacao');

    const target = this.getContainer().find('[data-tab-panel="solicitacao"] [data-gp-attachments]').first();
    const fallback = this.getContainer().find('[data-component="tab-solicitacao-history"]').first();
    const scrollTarget = target.length ? target : fallback;
    if (!scrollTarget.length) return;

    const el = scrollTarget.get(0);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitação aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Análise TI concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Impacto na área concluido', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Triagem técnica concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Proposta comercial aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Aprovação GCC concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Comite de custo concluido', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Compras - contratação em andamento', iconClass: 'fa-solid fa-clock' }
    ];
  },

  fillFieldsFromRow: function (row) {
    const root = this.getContainer();

    const tipoContratacao = this.asText(row.tipoContratacaoCRC) || 'pedido';
    root.find(`input[name="contract-type"][value="${this.escapeSelectorValue(tipoContratacao)}"]`).prop('checked', true);
    this.updateContractTypeCards();

    root.find('#contract-number').val(this.asText(row.numeroPedidoContratoCRC));
    root.find('#contract-issue-date').val(this.normalizeDateToInput(this.asText(row.dataEmissaoCRC)));
    root.find('#contract-start-date').val(this.normalizeDateToInput(this.asText(row.inicioVigenciaCRC)));
    root.find('#contract-end-date').val(this.normalizeDateToInput(this.asText(row.fimVigenciaCRC)));
    root.find('#contract-scope').val(this.asText(row.escopoAcordadoCRC));
    root.find('#contract-sla').val(this.asText(row.slaGarantiaCRC));
    root.find('#contract-penalties').val(this.asText(row.multasRescisaoCRC));

    const capexPercent = this.asText(row.capexCRC) || this.asText(row.capexGCC);
    const opexPercent = this.asText(row.opexCRC) || this.asText(row.opexGCC);
    root.find('#contract-capex-percent').val(capexPercent || '0');
    root.find('#contract-opex-percent').val(opexPercent || '0');

    const capexRows = this.parseAllocationTable(row.tblNaturezaCustoCapexGCC || row['tblNaturezaCustoCapexGCC'], 'capex');
    const opexRows = this.parseAllocationTable(row.tblNaturezaCustoOpexGCC || row['tblNaturezaCustoOpexGCC'], 'opex');

    root.find('#contract-cost-nature-capex').prop('checked', this.parsePercentValue(capexPercent) > 0 || capexRows.length > 0);
    root.find('#contract-cost-nature-opex').prop('checked', this.parsePercentValue(opexPercent) > 0 || opexRows.length > 0);

    this.renderAllocationRows('capex', capexRows);
    this.renderAllocationRows('opex', opexRows);

    root.find('#crc-check-pj').prop('checked', this.parseBooleanLike(row.pessoaJuridicaRegularCRC) === true);
    root.find('#crc-check-certidoes').prop('checked', this.parseBooleanLike(row.certidoesNegativasCRC) === true);
    root.find('#crc-check-lgpd').prop('checked', this.parseBooleanLike(row.lgpdCRC) === true);
    root.find('#crc-check-seguranca').prop('checked', this.parseBooleanLike(row.analiseSegurancaCRC) === true);
    root.find('#crc-check-seguro').prop('checked', this.parseBooleanLike(row.seguroResponsabilidadeCRC) === true);
    this.applyComplianceChecklistStyles();

    root.find('#finance-payment-condition').val(this.asText(row.condicaoPagamentoCRC));
    root.find('#finance-payment-condition-code').val(this.asText(row.escolhercondicaopagamentoCRC));
    root.find('#finance-payment-condition-installments').val(this.asText(row.quantasVezesCondicaoCRC));
    root.find('#finance-payment-condition-period-days').val(this.asText(row.periodoEmDiasCondicaoCRC));
    this.requestPaymentConditionSyncFromHidden();

    this._state.attachments = this.parsePersistedAttachments(row.anexosCRC);
    this.renderAttachmentsList();

    this.syncCostNaturePercentages('toggle');
    this.updateAllocationVisibility();
    this.ensureVisibleAllocationRows();
    this.recomputeAllAllocationRows();
    this.refreshCostNatureTotals();
    this.loadStoredOrGenerateSchedule(row.escolherparcelasCRC);
    this.updateFinancialComparison();
  },

  parseAllocationTable: function (value, kind) {
    return this.parseTableJson(value).map((item) => {
      const rawCenter = kind === 'capex'
        ? this.asText(item && item.centroCustoCapexGCC)
        : this.asText(item && item.centroCustoOpexGCC);
      const normalizedCenter = this.normalizeCostCenterValue(rawCenter);

      if (kind === 'capex') {
        return {
          centerCost: normalizedCenter.code,
          centerCostLabel: normalizedCenter.label,
          account: this.asText(item && item.contaContabilCapexGCC),
          committed: this.asText(item && item.porcentagemCapexGCC),
          balance: this.asText(item && item.saldoCapexGCC),
          balanceAfter: this.asText(item && item.saldoAposCompromissoCapexGCC)
        };
      }

      return {
        centerCost: normalizedCenter.code,
        centerCostLabel: normalizedCenter.label,
        account: this.asText(item && item.contaContabilOpexGCC),
        committed: this.asText(item && item.porcentagemOpexGCC),
        balance: this.asText(item && item.saldoOpexGCC),
        balanceAfter: this.asText(item && item.saldoAposCompromissoOpexGCC)
      };
    }).filter((row) => row.centerCost || row.centerCostLabel || row.account || row.committed || row.balance || row.balanceAfter);
  },

  getAllocationContainer: function (kind) {
    return this.getContainer().find(kind === 'capex' ? '#contract-capex-rows' : '#contract-opex-rows').first();
  },

  renderAllocationRows: function (kind, rows) {
    const container = this.getAllocationContainer(kind);
    if (!container.length) return;

    container.empty();
    const normalizedRows = Array.isArray(rows) ? rows.filter(Boolean) : [];

    if (!normalizedRows.length) {
      return;
    }

    normalizedRows.forEach((row) => this.appendAllocationRow(kind, row));
  },

  appendAllocationRow: function (kind, row) {
    const container = this.getAllocationContainer(kind);
    if (!container.length) return;

    const data = row || {};
    const template = this.getContainer().find('#contract-allocation-row-template').html();
    if (!template) return;

    const uid = `crc-center-cost-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const rowMarkup = template.replace('data-kind="capex"', `data-kind="${this.escapeHtml(kind)}"`);

    container.append(rowMarkup);

    const appendedRow = container.find('.crc-allocation-row').last();
    appendedRow.find('[data-role="center-cost-filter"]').attr('id', uid);
    appendedRow.find('[data-field="center-cost"]').val(this.asText(data.centerCost));
    appendedRow.find('[data-field="center-cost-label"]').val(this.asText(data.centerCostLabel || data.centerCost));
    appendedRow.find('[data-field="account"]').val(this.asText(data.account));
    appendedRow.find('[data-field="committed"]').val(this.asText(data.committed));
    appendedRow.find('[data-field="balance"]').val(this.asText(data.balance));
    appendedRow.find('[data-field="balance-after"]').val(this.asText(data.balanceAfter));

    this.initializeAllocationCostCenterFilter(appendedRow, uid, data);
    this.recomputeAllocationRow(appendedRow);
  },

  addAllocationRow: function (kind) {
    this.appendAllocationRow(kind, {});
    this.refreshCostNatureTotals();
  },

  removeAllocationRow: function (buttonEl) {
    const row = $(buttonEl).closest('.crc-allocation-row');
    if (!row.length) return;

    const kind = this.asText(row.attr('data-kind'));
    if (!kind) return;

    const enabled = Boolean(this.getContainer().find(kind === 'capex' ? '#contract-cost-nature-capex' : '#contract-cost-nature-opex').prop('checked'));
    const container = this.getAllocationContainer(kind);
    const rowCount = container.find('.crc-allocation-row').length;

    if (enabled && rowCount <= 1) {
      row.find('[data-field="committed"]').val('');
      row.find('[data-field="balance"]').val('');
      row.find('[data-field="balance-after"]').val('');
      this.resetAllocationCostCenterFilter(row);
      this.refreshCostNatureTotals();
      return;
    }

    this.destroyAllocationCostCenterFilter(row);
    row.remove();
    this.ensureVisibleAllocationRows();
    this.refreshCostNatureTotals();
  },

  collectAllocationRows: function (kind) {
    return this.getAllocationContainer(kind).find('.crc-allocation-row').map((_, rowEl) => {
      const row = $(rowEl);
      const centerCost = this.asText(row.find('[data-field="center-cost"]').val());
      const centerCostLabel = this.asText(row.find('[data-field="center-cost-label"]').val());
      return {
        centerCost: centerCost,
        centerCostLabel: centerCostLabel || centerCost,
        account: this.asText(row.find('[data-field="account"]').val()),
        committed: this.asText(row.find('[data-field="committed"]').val()),
        balance: this.asText(row.find('[data-field="balance"]').val()),
        balanceAfter: this.asText(row.find('[data-field="balance-after"]').val())
      };
    }).get().filter((row) => row.centerCost || row.centerCostLabel || row.account || row.committed || row.balance || row.balanceAfter);
  },

  applyComplianceChecklistStyles: function () {
    this.getContainer().find('[data-role="compliance-check-card"]').each((_, el) => {
      const card = $(el);
      const checked = card.find('input[type="checkbox"]').is(':checked');
      const title = card.find('[data-role="compliance-title"]').first();
      const desc = card.find('[data-role="compliance-desc"]').first();
      const icon = card.find('[data-role="compliance-status-icon"]').first();

      card.removeClass('border-green-200 bg-green-50 border-yellow-200 bg-yellow-50');
      title.removeClass('text-green-900 text-yellow-900');
      desc.removeClass('text-green-700 text-yellow-700');

      card.addClass(checked ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50');
      title.addClass(checked ? 'text-green-900' : 'text-yellow-900');
      desc.addClass(checked ? 'text-green-700' : 'text-yellow-700');

      icon.removeClass('fa-check-circle fa-exclamation-triangle text-green-600 text-yellow-600');
      icon.addClass('fa-solid');
      if (checked) {
        icon.addClass('fa-check-circle text-green-600');
      } else {
        icon.addClass('fa-exclamation-triangle text-yellow-600');
      }
    });
  },

  loadCostCenterOptions: async function () {
    try {
      let rows = [];
      try {
        rows = await fluigService.getDatasetRows('ds_buscaCentroCusto', {
          fields: ['CODCCUSTO', 'NOME']
        });
      } catch (error) {
        rows = await fluigService.getDataset('ds_buscaCentroCusto');
      }

      this._state.costCenterOptions = this.normalizeCostCenterOptions(rows);
      this.syncAllocationCostCenterFilters();
    } catch (error) {
      console.error('[purchaseContracting] Erro ao carregar ds_buscaCentroCusto:', error);
      this._state.costCenterOptions = [];
      this.syncAllocationCostCenterFilters();
    }
  },

  normalizeCostCenterOptions: function (rows) {
    if (!Array.isArray(rows)) return [];

    const map = {};
    rows.forEach((row) => {
      const code = this.asText(row && (row.CODCCUSTO || row.codccusto || row.codCentroCusto));
      const name = this.asText(row && (row.NOME || row.nome || row.DESCRICAO || row.descricao));
      if (!code || !name) return;
      map[code] = { CODCCUSTO: code, NOME: name };
    });

    return Object.keys(map).map((key) => map[key]);
  },

  normalizeLookupText: function (value) {
    return this.asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  normalizeCostCenterValue: function (rawValue) {
    const raw = this.asText(rawValue);
    if (!raw) return { code: '', label: '' };

    const options = Array.isArray(this._state.costCenterOptions) ? this._state.costCenterOptions : [];
    const byCode = options.find((item) => this.asText(item && item.CODCCUSTO) === raw);
    if (byCode) {
      return { code: this.asText(byCode.CODCCUSTO), label: this.asText(byCode.NOME) };
    }

    const normalizedRaw = this.normalizeLookupText(raw);
    const byLabel = options.find((item) => this.normalizeLookupText(item && item.NOME) === normalizedRaw);
    if (byLabel) {
      return { code: this.asText(byLabel.CODCCUSTO), label: this.asText(byLabel.NOME) };
    }

    return { code: raw, label: raw };
  },

  initializeAllocationCostCenterFilter: function (rowEl, mountId, rowData) {
    const row = rowEl && rowEl.jquery ? rowEl : $(rowEl);
    if (!row || !row.length) return;

    const mountSelector = `#${mountId}`;
    const codeInput = row.find('[data-field="center-cost"]').first();
    const labelInput = row.find('[data-field="center-cost-label"]').first();
    const options = Array.isArray(this._state.costCenterOptions) ? this._state.costCenterOptions : [];

    if (typeof TagInputFilter === 'undefined') {
      row.find('[data-role="center-cost-filter"]').first().replaceWith(
        `<input type="text" data-field="center-cost-fallback" value="${this.escapeHtml(this.asText((rowData && rowData.centerCostLabel) || (rowData && rowData.centerCost)))}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent" />`
      );

      row.off('input.purchaseCostCenterFallback');
      row.on('input.purchaseCostCenterFallback', '[data-field="center-cost-fallback"]', (event) => {
        const value = this.asText($(event.currentTarget).val());
        codeInput.val(value);
        labelInput.val(value);
        this.refreshCostNatureTotals();
      });
      return;
    }

    const normalizedInitial = this.normalizeCostCenterValue((rowData && rowData.centerCost) || codeInput.val() || labelInput.val());
    if (!this.asText(codeInput.val())) codeInput.val(normalizedInitial.code);
    if (!this.asText(labelInput.val())) labelInput.val(normalizedInitial.label || normalizedInitial.code);

    const filter = new TagInputFilter(mountSelector, {
      placeholder: 'Selecione o centro de custo...',
      data: options,
      labelField: 'NOME',
      valueField: 'CODCCUSTO',
      columns: [
        { header: 'Codigo', field: 'CODCCUSTO', width: 'w-1/3' },
        { header: 'Nome', field: 'NOME', width: 'w-2/3' }
      ],
      singleSelection: true,
      onItemAdded: (item) => {
        codeInput.val(this.asText(item && item.CODCCUSTO));
        labelInput.val(this.asText(item && item.NOME));
        this.refreshCostNatureTotals();
      },
      onItemRemoved: () => {
        codeInput.val('');
        labelInput.val('');
        this.refreshCostNatureTotals();
      }
    });

    if (filter && typeof filter.setSelectedItems === 'function') {
      const initialCode = this.asText(codeInput.val());
      const initialLabel = this.asText(labelInput.val());
      let selectedOption = null;

      if (initialCode) {
        selectedOption = options.find((item) => this.asText(item && item.CODCCUSTO) === initialCode) || null;
      }

      if (!selectedOption && initialLabel) {
        const normalizedLabel = this.normalizeLookupText(initialLabel);
        selectedOption = options.find((item) => this.normalizeLookupText(item && item.NOME) === normalizedLabel) || null;
      }

      if (selectedOption) {
        codeInput.val(this.asText(selectedOption.CODCCUSTO));
        labelInput.val(this.asText(selectedOption.NOME));
        filter.setSelectedItems([
          {
            value: this.asText(selectedOption.CODCCUSTO),
            label: this.asText(selectedOption.NOME)
          }
        ]);
      }
    }

    row.attr('data-cost-center-filter-id', mountId);
    this._state.allocationCostCenterFilters[mountId] = filter;
  },

  resetAllocationCostCenterFilter: function (rowEl) {
    const row = rowEl && rowEl.jquery ? rowEl : $(rowEl);
    if (!row || !row.length) return;

    const mountId = this.asText(row.attr('data-cost-center-filter-id'));
    const filter = mountId ? this._state.allocationCostCenterFilters[mountId] : null;

    if (filter && typeof filter.removeAll === 'function') {
      filter.removeAll();
    }

    row.find('[data-field="center-cost"]').val('');
    row.find('[data-field="center-cost-label"]').val('');
    row.find('[data-field="center-cost-fallback"]').val('');
  },

  destroyAllocationCostCenterFilter: function (rowEl) {
    const row = rowEl && rowEl.jquery ? rowEl : $(rowEl);
    if (!row || !row.length) return;

    const mountId = this.asText(row.attr('data-cost-center-filter-id'));
    if (mountId && this._state.allocationCostCenterFilters[mountId]) {
      delete this._state.allocationCostCenterFilters[mountId];
    }

    row.off('input.purchaseCostCenterFallback');
  },

  destroyAllAllocationCostCenterFilters: function () {
    const root = this.getContainer();
    root.find('.crc-allocation-row').each((_, rowEl) => this.destroyAllocationCostCenterFilter(rowEl));
    this._state.allocationCostCenterFilters = {};
  },

  syncAllocationCostCenterFilters: function () {
    const options = Array.isArray(this._state.costCenterOptions) ? this._state.costCenterOptions : [];
    const root = this.getContainer();

    root.find('.crc-allocation-row').each((_, rowEl) => {
      const row = $(rowEl);
      const codeInput = row.find('[data-field="center-cost"]').first();
      const labelInput = row.find('[data-field="center-cost-label"]').first();
      const current = this.normalizeCostCenterValue(codeInput.val() || labelInput.val());

      codeInput.val(current.code);
      labelInput.val(current.label || current.code);

      const mountId = this.asText(row.attr('data-cost-center-filter-id'));
      const filter = mountId ? this._state.allocationCostCenterFilters[mountId] : null;
      if (!filter) return;

      if (typeof filter.updateData === 'function') {
        filter.updateData(options);
      }

      if (typeof filter.setSelectedItems !== 'function') return;

      const selectedCode = this.asText(codeInput.val());
      if (!selectedCode) {
        if (typeof filter.removeAll === 'function') filter.removeAll();
        return;
      }

      const found = options.find((item) => this.asText(item && item.CODCCUSTO) === selectedCode) || null;
      if (!found) return;

      labelInput.val(this.asText(found.NOME));
      filter.setSelectedItems([
        {
          value: this.asText(found.CODCCUSTO),
          label: this.asText(found.NOME)
        }
      ]);
    });
  },

  initializePaymentConditionTagFilter: function () {
    const mount = this.getContainer().find('#finance-payment-condition-filter').get(0);
    if (!mount || typeof TagInputFilter === 'undefined') return;

    if (!mount.id) {
      mount.id = 'finance-payment-condition-filter';
    }

    this._state.paymentConditionFilter = new TagInputFilter('#finance-payment-condition-filter', {
      placeholder: 'Selecione a condição...',
      data: [],
      labelField: 'NOME',
      valueField: 'CODIGO',
      columns: [
        { header: 'Codigo', field: 'CODIGO', width: 'w-1/4' },
        { header: 'Nome', field: 'NOME', width: 'w-2/4' },
        { header: 'Parcelas', field: 'QUANTASVEZES1', width: 'w-1/4' },
        { header: 'Periodo', field: 'PERIODOEMDIAS1', width: 'w-1/4' }
      ],
      singleSelection: true,
      onItemAdded: (item) => {
        this.applyPaymentConditionSelection(item);
      },
      onItemRemoved: () => {
        this.clearPaymentConditionSelection();
      }
    });

    this.loadPaymentConditionOptions()
      .then((rows) => {
        this._state.paymentConditionOptions = rows;
        if (this._state.paymentConditionFilter && typeof this._state.paymentConditionFilter.updateData === 'function') {
          this._state.paymentConditionFilter.updateData(rows);
        }
        this.syncPaymentConditionFilterFromPending();
      })
      .catch((error) => {
        console.error('[purchaseContracting] Erro carregando dsGetCondPagto_ReadView:', error);
      });
  },

  loadPaymentConditionOptions: async function () {
    let rows = [];
    try {
      rows = await fluigService.getDatasetRows('dsGetCondPagto_ReadView', {
        filters: { CODCOLIGADA: '1' }
      });
    } catch (error) {
      rows = await fluigService.getDataset('dsGetCondPagto_ReadView', { CODCOLIGADA: '1' });
    }

    return (rows || []).map((row) => {
      const codigo = this.asText(row && (row.CODIGO || row.CODCPG));
      const nome = this.asText(row && row.NOME);
      if (!codigo || !nome) return null;
      return {
        CODIGO: codigo,
        NOME: nome,
        QUANTASVEZES1: this.asText(row && (row.QUANTASVEZES1 || row.QUANTASVEZES)),
        PERIODOEMDIAS1: this.asText(row && (row.PERIODOEMDIAS1 || row.PERIODOEMDIAS))
      };
    }).filter(Boolean);
  },

  applyPaymentConditionSelection: function (item) {
    const root = this.getContainer();
    root.find('#finance-payment-condition').val(this.asText(item && item.NOME));
    root.find('#finance-payment-condition-code').val(this.asText(item && item.CODIGO));
    root.find('#finance-payment-condition-installments').val(this.asText(item && item.QUANTASVEZES1));
    root.find('#finance-payment-condition-period-days').val(this.asText(item && item.PERIODOEMDIAS1));
    if (this._state.suppressPaymentConditionAutoSchedule) return;
    this.generateAndRenderPaymentSchedule();
  },

  clearPaymentConditionSelection: function () {
    const root = this.getContainer();
    root.find('#finance-payment-condition').val('');
    root.find('#finance-payment-condition-code').val('');
    root.find('#finance-payment-condition-installments').val('');
    root.find('#finance-payment-condition-period-days').val('');
    this.generateAndRenderPaymentSchedule();
  },

  requestPaymentConditionSyncFromHidden: function () {
    const root = this.getContainer();
    this._state.pendingPaymentConditionSync = {
      codigo: this.asText(root.find('#finance-payment-condition-code').val()),
      nome: this.asText(root.find('#finance-payment-condition').val()),
      quantasVezes: this.asText(root.find('#finance-payment-condition-installments').val()),
      periodoDias: this.asText(root.find('#finance-payment-condition-period-days').val())
    };
    this.syncPaymentConditionFilterFromPending();
  },

  syncPaymentConditionFilterFromPending: function () {
    const filter = this._state.paymentConditionFilter;
    const pending = this._state.pendingPaymentConditionSync;
    const options = Array.isArray(this._state.paymentConditionOptions) ? this._state.paymentConditionOptions : [];
    if (!filter || !pending || !options.length) return;

    let found = null;
    const pendingCode = this.asText(pending.codigo);
    const pendingLabel = this.asText(pending.nome);

    if (pendingCode) {
      found = options.find((row) => this.asText(row && row.CODIGO) === pendingCode) || null;
    } else if (pendingLabel) {
      const normalizedLabel = this.normalizeLookupText(pendingLabel);
      found = options.find((row) => this.normalizeLookupText(row && row.NOME) === normalizedLabel) || null;
    }

    if (!found || typeof filter.setSelectedItems !== 'function') return;
    if (!pendingCode) {
      this.getContainer().find('#finance-payment-condition-code').val(this.asText(found.CODIGO));
    }
    if (!this.asText(pending.quantasVezes)) {
      this.getContainer().find('#finance-payment-condition-installments').val(this.asText(found.QUANTASVEZES1));
    }
    if (!this.asText(pending.periodoDias)) {
      this.getContainer().find('#finance-payment-condition-period-days').val(this.asText(found.PERIODOEMDIAS1));
    }
    this._state.suppressPaymentConditionAutoSchedule = true;
    filter.setSelectedItems([
      {
        value: this.asText(found.CODIGO),
        label: this.asText(found.NOME)
      }
    ]);
    this._state.suppressPaymentConditionAutoSchedule = false;
  },

  updateContractTypeCards: function () {
    const root = this.getContainer();
    const selected = this.asText(root.find('input[name="contract-type"]:checked').val());

    root.find('[data-role="contract-type-card"]').each((_, cardEl) => {
      const card = $(cardEl);
      const cardValue = this.asText(card.attr('data-value'));
      const active = cardValue && cardValue === selected;
      card.toggleClass('border-bevap-green bg-green-50', active);
      card.toggleClass('border-gray-200', !active);
      card.toggleClass('text-bevap-green', active);
      card.toggleClass('text-gray-700', !active);
    });
  },

  syncCostNaturePercentages: function (changedKind) {
    const root = this.getContainer();
    let capex = this.parsePercentValue(root.find('#contract-capex-percent').val());
    let opex = this.parsePercentValue(root.find('#contract-opex-percent').val());

    const capexChecked = Boolean(root.find('#contract-cost-nature-capex').prop('checked'));
    const opexChecked = Boolean(root.find('#contract-cost-nature-opex').prop('checked'));

    if (capexChecked && opexChecked) {
      if (changedKind === 'capex') {
        opex = Math.max(0, 100 - capex);
      } else if (changedKind === 'opex') {
        capex = Math.max(0, 100 - opex);
      }
    } else if (capexChecked && !opexChecked) {
      capex = 100;
      opex = 0;
    } else if (!capexChecked && opexChecked) {
      capex = 0;
      opex = 100;
    } else {
      capex = 0;
      opex = 0;
    }

    root.find('#contract-capex-percent').val(capex);
    root.find('#contract-opex-percent').val(opex);
    root.find('#contract-capex-percent-label').text(this.formatPercentLabel(capex));
    root.find('#contract-opex-percent-label').text(this.formatPercentLabel(opex));

    this.updateCostNatureCardStyles();
    this.updateAllocationVisibility();
    this.ensureVisibleAllocationRows();
    this.recomputeAllAllocationRows();
    this.refreshCostNatureTotals();
  },

  handleCostNatureToggle: function (kind) {
    this.syncCostNaturePercentages('toggle');
    this.ensureVisibleAllocationRows();
    this.refreshCostNatureTotals();
  },

  updateCostNatureCardStyles: function () {
    const root = this.getContainer();
    ['capex', 'opex'].forEach((kind) => {
      const checkbox = root.find(kind === 'capex' ? '#contract-cost-nature-capex' : '#contract-cost-nature-opex').first();
      const card = root.find(`[data-role="cost-nature-card"][data-kind="${kind}"]`).first();
      if (!checkbox.length || !card.length) return;

      const checked = Boolean(checkbox.prop('checked'));
      card.toggleClass('border-bevap-green bg-green-50', checked);
      card.toggleClass('border-gray-300', !checked);
    });
  },

  updateAllocationVisibility: function () {
    const root = this.getContainer();
    const capexEnabled = Boolean(root.find('#contract-cost-nature-capex').prop('checked'));
    const opexEnabled = Boolean(root.find('#contract-cost-nature-opex').prop('checked'));

    root.find('#contract-capex-wrapper').toggleClass('hidden', !capexEnabled);
    root.find('#contract-opex-wrapper').toggleClass('hidden', !opexEnabled);
  },

  ensureVisibleAllocationRows: function () {
    ['capex', 'opex'].forEach((kind) => {
      const enabled = Boolean(this.getContainer().find(kind === 'capex' ? '#contract-cost-nature-capex' : '#contract-cost-nature-opex').prop('checked'));
      const container = this.getAllocationContainer(kind);
      if (!container.length) return;

      const existingRows = container.find('.crc-allocation-row').length;
      if (enabled && existingRows === 0) {
        this.appendAllocationRow(kind, {});
      }
    });
  },

  recomputeAllocationRow: function (rowEl) {
    const row = rowEl && rowEl.jquery ? rowEl : $(rowEl);
    if (!row || !row.length) return;

    const committed = this.parseCurrencyValue(row.find('[data-field="committed"]').val());
    const balanceInput = row.find('[data-field="balance"]').first();
    const balanceAfterInput = row.find('[data-field="balance-after"]').first();
    if (!balanceInput.length || !balanceAfterInput.length) return;

    const balance = this.parseCurrencyValue(balanceInput.val());
    if (balance === null) {
      balanceAfterInput.val('');
      return;
    }

    if (committed === null || committed <= 0) {
      balanceAfterInput.val(this.formatCurrency(balance));
      return;
    }

    balanceAfterInput.val(this.formatCurrency(balance - committed));
  },

  recomputeAllAllocationRows: function () {
    this.getContainer().find('.crc-allocation-row').each((_, rowEl) => {
      this.recomputeAllocationRow(rowEl);
    });
  },

  calculateCommittedAmount: function (kind) {
    return this.collectAllocationRows(kind).reduce((sum, row) => {
      const value = this.parseCurrencyValue(row.committed);
      return sum + (value !== null && value > 0 ? value : 0);
    }, 0);
  },

  getProposalTotalAmount: function () {
    const rowTotal = this.parseCurrencyValue(this._state.baseRow && this._state.baseRow.valortotalTIPC);
    return rowTotal !== null ? rowTotal : 0;
  },

  refreshCostNatureTotals: function () {
    const root = this.getContainer();
    const total = this.getProposalTotalAmount();
    const capex = this.parsePercentValue(root.find('#contract-capex-percent').val());
    const opex = this.parsePercentValue(root.find('#contract-opex-percent').val());

    const capexEnabled = Boolean(root.find('#contract-cost-nature-capex').prop('checked'));
    const opexEnabled = Boolean(root.find('#contract-cost-nature-opex').prop('checked'));

    const capexTotal = capexEnabled ? total * (capex / 100) : 0;
    const opexTotal = opexEnabled ? total * (opex / 100) : 0;
    const capexCommitted = capexEnabled ? this.calculateCommittedAmount('capex') : 0;
    const opexCommitted = opexEnabled ? this.calculateCommittedAmount('opex') : 0;

    const effectiveCapex = capexCommitted > 0 ? capexCommitted : capexTotal;
    const effectiveOpex = opexCommitted > 0 ? opexCommitted : opexTotal;
    const finalValue = effectiveCapex + effectiveOpex;

    root.find('#contract-capex-total-value').text(this.formatCurrency(capexTotal));
    root.find('#contract-opex-total-value').text(this.formatCurrency(opexTotal));
    root.find('#contract-capex-committed-total-value').text(this.formatCurrency(capexCommitted));
    root.find('#contract-opex-committed-total-value').text(this.formatCurrency(opexCommitted));

    root.find('#contract-final-value').val(this.formatCurrency(finalValue));
    this.updateFinancialComparison();
    this.generateAndRenderPaymentSchedule();
  },

  getContractTotalValue: function () {
    const root = this.getContainer();
    const finalValue = this.parseCurrencyValue(root.find('#contract-final-value').val());
    if (finalValue !== null) return finalValue;

    const baseValue = this.parseCurrencyValue(this._state.baseRow && this._state.baseRow.valortotalTIPC);
    return baseValue !== null ? baseValue : 0;
  },

  loadStoredOrGenerateSchedule: function (storedValue) {
    const parsedStored = this.parsePaymentSchedule(storedValue);
    if (parsedStored.length) {
      this._state.paymentSchedule = parsedStored;
      this.renderPaymentSchedule();
      return;
    }

    this.generateAndRenderPaymentSchedule();
  },

  generateAndRenderPaymentSchedule: function () {
    const root = this.getContainer();
    const selectedCode = this.asText(root.find('#finance-payment-condition-code').val());
    const selectedLabel = this.asText(root.find('#finance-payment-condition').val());
    const installmentsCount = parseInt(this.asText(root.find('#finance-payment-condition-installments').val()), 10);
    const periodDays = parseInt(this.asText(root.find('#finance-payment-condition-period-days').val()), 10);
    const total = this.getContractTotalValue();
    const issueDate = this.asText(root.find('#contract-issue-date').val()) || this.getTodayIso();

    this._state.paymentSchedule = this.generatePaymentSchedule(
      selectedCode || selectedLabel,
      total,
      issueDate,
      installmentsCount,
      periodDays
    );
    this.renderPaymentSchedule();
  },

  generatePaymentSchedule: function (conditionKey, total, issueDate, forcedInstallments, forcedPeriodDays) {
    const safeTotal = isFinite(total) ? Math.max(0, total) : 0;
    const baseDate = this.parseIsoDate(issueDate) || this.parseIsoDate(this.getTodayIso());

    const key = this.asText(conditionKey);
    const options = Array.isArray(this._state.paymentConditionOptions) ? this._state.paymentConditionOptions : [];
    const found = options.find((item) => this.asText(item && item.CODIGO) === key)
      || options.find((item) => this.normalizeLookupText(item && item.NOME) === this.normalizeLookupText(key))
      || null;

    let installments = 1;
    let periodDays = 30;

    const forcedCount = isFinite(forcedInstallments) ? Number(forcedInstallments) : NaN;
    const forcedPeriod = isFinite(forcedPeriodDays) ? Number(forcedPeriodDays) : NaN;

    if (isFinite(forcedCount) && forcedCount > 0) {
      installments = Math.min(60, Math.max(1, forcedCount));
      periodDays = isFinite(forcedPeriod) && forcedPeriod >= 0 ? forcedPeriod : 30;
    } else if (found) {
      const q = parseInt(this.asText(found.QUANTASVEZES1), 10);
      const p = parseInt(this.asText(found.PERIODOEMDIAS1), 10);
      installments = isFinite(q) && q > 0 ? Math.min(60, q) : 1;
      periodDays = isFinite(p) && p >= 0 ? p : 30;
    } else if (!key) {
      installments = 0;
    }

    const daysOffsets = [];
    for (let i = 1; i <= installments; i += 1) {
      daysOffsets.push(periodDays * i);
    }

    if (!daysOffsets.length) {
      return [];
    }

    const precision = 100;
    const rawInstallment = safeTotal / daysOffsets.length;
    const rounded = Math.floor(rawInstallment * precision) / precision;

    const schedule = [];
    let sum = 0;

    for (let i = 0; i < daysOffsets.length; i += 1) {
      const amount = i === daysOffsets.length - 1
        ? Math.max(0, Number((safeTotal - sum).toFixed(2)))
        : Number(rounded.toFixed(2));
      sum += amount;

      const dueDate = new Date(baseDate.getTime());
      dueDate.setDate(dueDate.getDate() + daysOffsets[i]);

      schedule.push({
        installment: i + 1,
        dueDate: this.formatDateToIso(dueDate),
        amount: amount
      });
    }

    return schedule;
  },

  renderPaymentSchedule: function () {
    const root = this.getContainer();
    const tbody = root.find('#finance-installments-tbody').first();
    if (!tbody.length) return;

    const schedule = Array.isArray(this._state.paymentSchedule) ? this._state.paymentSchedule : [];
    if (!schedule.length) {
      tbody.html('<tr><td class="px-4 py-3 text-gray-500" colspan="4">Sem parcelas geradas.</td></tr>');
      this.updateInstallmentsTotal();
      this.persistPaymentScheduleInField();
      return;
    }

    tbody.html(schedule.map((row, index) => {
      const installmentLabel = `${Number(row.installment || (index + 1))}a Parcela`;
      return `
        <tr>
          <td class="px-4 py-3">${this.escapeHtml(installmentLabel)}</td>
          <td class="px-4 py-3">${this.escapeHtml(this.formatDateForDisplay(this.asText(row.dueDate)))}</td>
          <td class="px-4 py-3 text-right font-medium">${this.escapeHtml(this.formatCurrency(row.amount || 0))}</td>
          <td class="px-4 py-3 text-center">
            <button type="button" data-action="edit-installment" data-index="${index}" class="text-blue-600 hover:text-blue-800" title="Editar parcela">
              <i class="fa-solid fa-edit"></i>
            </button>
          </td>
        </tr>
      `;
    }).join(''));

    this.updateInstallmentsTotal();
    this.persistPaymentScheduleInField();
  },

  openInstallmentEditModal: function (index) {
    if (!isFinite(index) || index < 0) return;
    const row = this._state.paymentSchedule[index];
    if (!row) return;

    const root = this.getContainer();
    root.find('#installment-edit-index').val(String(index));
    root.find('#installment-edit-number').text(`${Number(row.installment || (index + 1))}a Parcela`);
    root.find('#installment-edit-date').val(this.normalizeDateToInput(this.asText(row.dueDate)) || this.getTodayIso());
    root.find('#installment-edit-amount').val(this.formatCurrency(row.amount || 0));
    this.openModal('finance-installment-edit-modal');
  },

  saveInstallmentEdit: function () {
    const root = this.getContainer();
    const index = Number(root.find('#installment-edit-index').val());
    if (!isFinite(index) || index < 0 || !this._state.paymentSchedule[index]) return;

    const dueDate = this.normalizeDateToInput(root.find('#installment-edit-date').val());
    const parsedAmount = this.parseCurrencyValue(root.find('#installment-edit-amount').val());

    if (!dueDate) {
      this.showToast('Parcela', 'Informe a data programada para vencimento.', 'warning');
      root.find('#installment-edit-date').trigger('focus');
      return;
    }

    if (parsedAmount === null || parsedAmount < 0) {
      this.showToast('Parcela', 'Informe um valor de parcela valido.', 'warning');
      root.find('#installment-edit-amount').trigger('focus');
      return;
    }

    this._state.paymentSchedule[index].dueDate = dueDate;
    this._state.paymentSchedule[index].amount = Number(parsedAmount.toFixed(2));

    this.renderPaymentSchedule();
    this.updateFinancialComparison();
    this.closeModal('finance-installment-edit-modal');
  },

  updateInstallmentsTotal: function () {
    const total = this.getInstallmentsTotalAmount();

    this.getContainer().find('#finance-installments-total').text(this.formatCurrency(total));
  },

  getInstallmentsTotalAmount: function () {
    return (Array.isArray(this._state.paymentSchedule) ? this._state.paymentSchedule : []).reduce((sum, row) => {
      const value = Number(row && row.amount);
      return sum + (isFinite(value) ? value : 0);
    }, 0);
  },

  persistPaymentScheduleInField: function () {
    const schedule = Array.isArray(this._state.paymentSchedule) ? this._state.paymentSchedule : [];
    const clean = schedule.map((row, index) => {
      return {
        parcela: row && row.installment ? Number(row.installment) : index + 1,
        vencimento: this.asText(row && row.dueDate),
        valor: Number(row && row.amount ? row.amount : 0)
      };
    });

    try {
      this.getContainer().find('#finance-installments-tbody').attr('data-serialized', JSON.stringify(clean));
    } catch (error) {
      this.getContainer().find('#finance-installments-tbody').attr('data-serialized', '[]');
    }
  },

  parsePaymentSchedule: function (value) {
    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((row, index) => {
        const dueDate = this.normalizeDateToInput(this.asText(row && (row.vencimento || row.dueDate || row.data)));
        const amountRaw = row && (row.valor !== undefined ? row.valor : row.amount);
        const amount = typeof amountRaw === 'number' ? amountRaw : (this.parseCurrencyValue(amountRaw) || 0);
        return {
          installment: Number(row && (row.parcela || row.installment || index + 1)) || (index + 1),
          dueDate: dueDate,
          amount: Number(isFinite(amount) ? amount : 0)
        };
      }).filter((row) => row.installment > 0);
    } catch (error) {
      return [];
    }
  },

  updateFinancialComparison: function () {
    const root = this.getContainer();
    const approved = this.parseCurrencyValue(this._state.baseRow && this._state.baseRow.valortotalTIPC) || 0;
    const finalValue = this.parseCurrencyValue(root.find('#contract-final-value').val()) || 0;

    const diff = approved - finalValue;
    const percent = approved > 0 ? (diff / approved) * 100 : 0;

    root.find('#comparison-approved').text(this.formatCurrency(approved));
    root.find('#comparison-final').text(this.formatCurrency(finalValue));

    const diffText = `${diff >= 0 ? '-' : '+'}${this.formatCurrency(Math.abs(diff))} (${this.formatPercent(diff >= 0 ? -Math.abs(percent) : Math.abs(percent))})`;
    const diffEl = root.find('#comparison-economy');
    diffEl.text(diffText);
    diffEl.toggleClass('text-green-700', diff >= 0);
    diffEl.toggleClass('text-red-700', diff < 0);
  },

  parsePersistedAttachments: function (value) {
    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item) => {
        const documentId = this.asText(item && (item.documentId || item.documentID || item.id));
        const fileName = this.asText(item && (item.fileName || item.filename || item.name));
        const fileSize = item && item.fileSize !== undefined ? String(item.fileSize) : '';
        if (!fileName) return null;
        return {
          id: documentId ? `persisted:${documentId}` : `persisted:${fileName}`,
          documentId: documentId,
          fileName: fileName,
          fileSize: fileSize,
          persisted: true
        };
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  },

  formatAttachmentSize: function (bytes) {
    const size = Number(bytes);
    if (!isFinite(size) || size <= 0) return '';
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  },

  getAttachmentIconClass: function (fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  renderAttachmentsList: function () {
    const list = this.getContainer().find('#crc-attachments-list').first();
    if (!list.length) return;

    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    if (!items.length) {
      list.html('<div class="text-sm text-gray-500">Nenhum anexo selecionado.</div>');
      return;
    }

    list.html(items.map((att) => {
      const fileName = att.file ? att.file.name : att.fileName;
      const safeName = this.escapeHtml(fileName || 'arquivo');
      const sizeLabel = att.file
        ? this.escapeHtml(this.formatAttachmentSize(att.file.size || 0))
        : this.escapeHtml(this.asText(att.fileSize));
      const iconClass = this.escapeHtml(this.getAttachmentIconClass(fileName));
      const canRemove = !att.persisted;
      const removeAction = canRemove
        ? `<button type="button" data-action="remove-crc-attachment" data-attachment-id="${this.escapeHtml(att.id)}" class="text-red-500 hover:text-red-700" title="Remover"><i class="fa-solid fa-trash"></i></button>`
        : `<button type="button" disabled aria-disabled="true" class="text-red-500 opacity-30 cursor-not-allowed" title="Anexo ja salvo"><i class="fa-solid fa-lock"></i></button>`;

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid ${iconClass} text-xl mr-3"></i>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 truncate">${safeName}</div>
              <div class="text-xs text-gray-500">${sizeLabel || ''}</div>
            </div>
          </div>
          ${removeAction}
        </div>
      `;
    }).join(''));
  },

  addAttachments: function (fileList) {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;

    const current = Array.isArray(this._state.attachments) ? this._state.attachments.slice() : [];
    files.forEach((file) => {
      current.push({
        id: `local:${Date.now()}:${Math.random().toString(16).slice(2)}`,
        file: file,
        persisted: false
      });
    });

    this._state.attachments = current;
    this.renderAttachmentsList();
  },

  removeAttachment: function (id) {
    const current = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    this._state.attachments = current.filter((att) => String(att && att.id) !== String(id));
    this.renderAttachmentsList();
  },

  readFileAsBase64: function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = String(event.target && event.target.result ? event.target.result : '');
        const base64 = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Falha ao ler anexo'));
      reader.readAsDataURL(file);
    });
  },

  collectAttachmentsPayload: async function () {
    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    const localItems = items.filter((att) => att && att.file && !att.persisted);
    if (!localItems.length) return [];

    const payload = await Promise.all(localItems.map(async (att) => {
      const file = att.file;
      const content = await this.readFileAsBase64(file);
      return {
        fileName: this.asText(file && file.name),
        fileContent: this.asText(content),
        fileSize: String(file && file.size ? file.size : '').trim()
      };
    }));

    return payload.filter((item) => item.fileName && item.fileContent);
  },

  validateAllocationCompliance: function () {
    const issues = [];
    const tolerance = 0.009;
    const proposalTotal = this.getProposalTotalAmount();
    const root = this.getContainer();

    const kinds = [
      {
        kind: 'capex',
        enabled: Boolean(root.find('#contract-cost-nature-capex').prop('checked')),
        percent: this.parsePercentValue(root.find('#contract-capex-percent').val())
      },
      {
        kind: 'opex',
        enabled: Boolean(root.find('#contract-cost-nature-opex').prop('checked')),
        percent: this.parsePercentValue(root.find('#contract-opex-percent').val())
      }
    ];

    kinds.forEach((entry) => {
      if (!entry.enabled) return;

      const kindLabel = entry.kind.toUpperCase();
      const expectedTotal = proposalTotal * (entry.percent / 100);
      const committedTotal = this.calculateCommittedAmount(entry.kind);

      if (Math.abs(committedTotal - expectedTotal) > tolerance) {
        issues.push(`${kindLabel} - Total comprometido (${this.formatCurrency(committedTotal)}) deve ser igual ao valor total da natureza (${this.formatCurrency(expectedTotal)})`);
      }

      const rows = this.collectAllocationRows(entry.kind);
      rows.forEach((row, index) => {
        const rowLabel = `${kindLabel} linha ${index + 1}`;
        const committed = this.parseCurrencyValue(row.committed);
        const balance = this.parseCurrencyValue(row.balance);
        let balanceAfter = this.parseCurrencyValue(row.balanceAfter);

        if (balanceAfter === null && committed !== null && balance !== null) {
          balanceAfter = balance - committed;
        }

        if (this.asText(row.committed) && (committed === null || committed <= 0)) {
          issues.push(`${rowLabel} - Valor Comprometido deve ser maior que zero`);
        }

        if (balance === null) {
          issues.push(`${rowLabel} - Saldo deve ser informado`);
          return;
        }

        if (committed !== null && committed - balance > tolerance) {
          issues.push(`${rowLabel} - Valor Comprometido nao pode ser maior que o Saldo`);
        }

        if (balanceAfter !== null && balanceAfter < -tolerance) {
          issues.push(`${rowLabel} - Saldo após compromisso não pode ficar negativo`);
        }
      });
    });

    return issues;
  },

  validateRequiredForApproval: function () {
    const root = this.getContainer();
    const missing = [];

    if (!this.asText(root.find('#contract-number').val())) missing.push('N do Pedido/Contrato');
    if (!this.asText(root.find('#contract-issue-date').val())) missing.push('Data de Emissão');
    if (!this.asText(root.find('#contract-start-date').val())) missing.push('Início da Vigência');
    if (!this.asText(root.find('#contract-end-date').val())) missing.push('Fim da Vigência');
    if (!this.asText(root.find('#contract-scope').val())) missing.push('Escopo Acordado');

    const capexChecked = Boolean(root.find('#contract-cost-nature-capex').prop('checked'));
    const opexChecked = Boolean(root.find('#contract-cost-nature-opex').prop('checked'));
    const capex = capexChecked ? this.parsePercentValue(root.find('#contract-capex-percent').val()) : 0;
    const opex = opexChecked ? this.parsePercentValue(root.find('#contract-opex-percent').val()) : 0;
    const totalPercent = Number((capex + opex).toFixed(2));

    if (!capexChecked && !opexChecked) missing.push('Selecione ao menos CAPEX ou OPEX');
    if (totalPercent !== 100) missing.push('Distribuicao CAPEX/OPEX deve totalizar 100%');

    ['capex', 'opex'].forEach((kind) => {
      const enabled = Boolean(root.find(kind === 'capex' ? '#contract-cost-nature-capex' : '#contract-cost-nature-opex').prop('checked'));
      if (!enabled) return;

      const kindPercent = kind === 'capex' ? capex : opex;
      if (kindPercent <= 0) {
        missing.push(`${kind.toUpperCase()} deve ter percentual maior que zero`);
      }

      const rows = this.collectAllocationRows(kind);
      if (!rows.length) {
        missing.push(`${kind.toUpperCase()} precisa de pelo menos uma linha`);
        return;
      }

      rows.forEach((row, index) => {
        const label = `${kind.toUpperCase()} linha ${index + 1}`;
        if (!row.centerCost) missing.push(`${label} - Centro de Custo`);
        if (!row.committed) missing.push(`${label} - Valor Comprometido`);
      });
    });

    if (!this.asText(root.find('#contract-final-value').val())) missing.push('Valor Final');
    if (!this.asText(root.find('#finance-payment-condition').val())) missing.push('Condição de Pagamento (Financeiro)');

    const finalValue = this.parseCurrencyValue(root.find('#contract-final-value').val());
    const installmentsTotal = this.getInstallmentsTotalAmount();
    if (finalValue !== null && Math.abs(Number(finalValue) - Number(installmentsTotal)) > 0.009) {
      missing.push(`Total das parcelas deve ser igual ao Valor Final (${this.formatCurrency(finalValue)}). Total atual: ${this.formatCurrency(installmentsTotal)}`);
    }

    const complianceIssues = this.validateAllocationCompliance();
    if (complianceIssues.length) {
      missing.push.apply(missing, complianceIssues);
    }

    return missing;
  },

  collectTaskFields: function (decisionValue, justificationValue, categoryValue) {
    const root = this.getContainer();

    const capexRows = this.collectAllocationRows('capex');
    const opexRows = this.collectAllocationRows('opex');

    const allCenters = capexRows.concat(opexRows)
      .map((row) => this.asText(row.centerCost))
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .join(', ');

    const allAccounts = capexRows.concat(opexRows)
      .map((row) => this.asText(row.account))
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .join(', ');

    const fallbackCenter = this.asText(this._state.baseRow && this._state.baseRow.centroCustoCRC);
    const fallbackAccount = this.asText(this._state.baseRow && this._state.baseRow.contaContabilCRC);

    const cardData = {
      tipoContratacaoCRC: this.asText(root.find('input[name="contract-type"]:checked').val()),
      numeroPedidoContratoCRC: this.asText(root.find('#contract-number').val()),
      dataEmissaoCRC: this.formatDateForCard(root.find('#contract-issue-date').val()),
      inicioVigenciaCRC: this.formatDateForCard(root.find('#contract-start-date').val()),
      fimVigenciaCRC: this.formatDateForCard(root.find('#contract-end-date').val()),
      condicaoPagamentoCRC: this.asText(root.find('#finance-payment-condition').val()),
      centroCustoCRC: allCenters || fallbackCenter,
      contaContabilCRC: allAccounts || fallbackAccount,
      escopoAcordadoCRC: this.asText(root.find('#contract-scope').val()),
      slaGarantiaCRC: this.asText(root.find('#contract-sla').val()),
      multasRescisaoCRC: this.asText(root.find('#contract-penalties').val()),
      pessoaJuridicaRegularCRC: this.getBooleanFieldValue('#crc-check-pj'),
      certidoesNegativasCRC: this.getBooleanFieldValue('#crc-check-certidoes'),
      lgpdCRC: this.getBooleanFieldValue('#crc-check-lgpd'),
      analiseSegurancaCRC: this.getBooleanFieldValue('#crc-check-seguranca'),
      seguroResponsabilidadeCRC: this.getBooleanFieldValue('#crc-check-seguro'),
      escolhercondicaopagamentoCRC: this.asText(root.find('#finance-payment-condition-code').val()) || this.asText(root.find('#finance-payment-condition').val()),
      quantasVezesCondicaoCRC: this.asText(root.find('#finance-payment-condition-installments').val()),
      periodoEmDiasCondicaoCRC: this.asText(root.find('#finance-payment-condition-period-days').val()),
      escolherparcelasCRC: this.serializePaymentSchedule(),
      valorFinalCRC: this.asText(root.find('#contract-final-value').val()),
      impostosEncargosCRC: '',
      capexCRC: this.asText(root.find('#contract-capex-percent').val()),
      opexCRC: this.asText(root.find('#contract-opex-percent').val())
    };

    const persistedAttachments = (Array.isArray(this._state.attachments) ? this._state.attachments : [])
      .filter((att) => att && att.persisted)
      .map((att) => ({
        documentId: this.asText(att.documentId),
        fileName: this.asText(att.fileName),
        fileSize: this.asText(att.fileSize)
      }))
      .filter((att) => att.fileName);

    if (persistedAttachments.length) {
      cardData.anexosCRC = JSON.stringify(persistedAttachments);
    }

    if (decisionValue !== undefined) {
      cardData.decisaoCRC = this.asText(decisionValue);
    }

    if (justificationValue !== undefined) {
      cardData.justificativaCRC = this.asText(justificationValue);
    }

    if (categoryValue !== undefined) {
      cardData.categoriajustiCRC = this.asText(categoryValue);
    }

    return Object.keys(cardData).map((fieldName) => {
      return { name: fieldName, value: cardData[fieldName] };
    });
  },

  serializePaymentSchedule: function () {
    const schedule = Array.isArray(this._state.paymentSchedule) ? this._state.paymentSchedule : [];
    return JSON.stringify(schedule.map((row, index) => {
      return {
        parcela: row && row.installment ? Number(row.installment) : (index + 1),
        vencimento: this.asText(row && row.dueDate),
        valor: Number(row && row.amount ? row.amount : 0)
      };
    }));
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho de Compras...');
      await this.waitForUiPaint();

      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        taskFields: this.collectTaskFields()
      });

      try {
        sessionStorage.setItem('gpDashboardFeedback', JSON.stringify({
          title: 'Rascunho salvo',
          message: 'As alterações foram salvas com sucesso.',
          type: 'success'
        }));
      } catch (storageError) {}
      location.hash = '#dashboard';
    } catch (error) {
      console.error('[purchaseContracting] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Não foi possível salvar o rascunho.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  handleApprove: function () {
    this.submitAction({
      actionLabel: 'Concluir Contratação',
      modalId: 'approve-modal',
      decisionValue: 'aprovado',
      justification: '',
      category: '',
      requireValidation: true
    });
  },

  handleReturn: function () {
    const root = this.getContainer();
    const category = this.asText(root.find('#purchase-return-category').val());
    const justification = this.asText(root.find('#purchase-justification-return').val());

    if (!category) {
      this.showToast('Categoria', 'Selecione a categoria da devolucao.', 'warning');
      root.find('#purchase-return-category').trigger('focus');
      return;
    }

    if (!justification) {
      this.showToast('Justificativa', 'Informe o motivo da devolucao.', 'warning');
      root.find('#purchase-justification-return').trigger('focus');
      return;
    }

    this.submitAction({
      actionLabel: 'Devolver para Correção',
      modalId: 'modal-return',
      decisionValue: 'correcao',
      justification: justification,
      category: category,
      requireValidation: false
    });
  },

  handleReject: function () {
    const root = this.getContainer();
    const category = this.asText(root.find('#purchase-reject-category').val());
    const justification = this.asText(root.find('#purchase-justification-reject').val());

    if (!category) {
      this.showToast('Categoria', 'Selecione a categoria do cancelamento.', 'warning');
      root.find('#purchase-reject-category').trigger('focus');
      return;
    }

    if (!justification) {
      this.showToast('Justificativa', 'Informe a justificativa do cancelamento.', 'warning');
      root.find('#purchase-justification-reject').trigger('focus');
      return;
    }

    this.submitAction({
      actionLabel: 'Cancelar Processo',
      modalId: 'modal-reject',
      decisionValue: 'cancelado',
      justification: justification,
      category: category,
      requireValidation: false
    });
  },

  submitAction: async function (config) {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      if (config && config.requireValidation) {
        const missing = this.validateRequiredForApproval();
        if (missing.length) {
          this.showToast('Campos obrigatórios', `Preencha: ${missing.join(' | ')}`, 'warning');
          return;
        }
      }

      loading.updateMessage('Preparando movimentacao de Compras...');
      await this.waitForUiPaint();

      const processInstanceId = await this.resolveProcessInstanceId();
      const taskFields = this.collectTaskFields(
        config && config.decisionValue,
        config && config.justification,
        config && config.category
      );
      const attachments = await this.collectAttachmentsPayload();

      loading.updateMessage('Enviando movimentacao para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 68,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos',
        comments: `Compras: ${this.asText(config && config.actionLabel)}`,
        attachments: attachments
      }, taskFields);

      if (config && config.modalId) {
        this.closeModal(config.modalId);
      }

      this.showToast('Sucesso', `Acao registrada: ${this.asText(config && config.actionLabel)}.`, 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[purchaseContracting] Error moving task:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Não foi possível movimentar a solicitação.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  createActionLoading: function () {
    if (typeof modalLoadingService !== 'undefined' && modalLoadingService.show) {
      return modalLoadingService.show({
        title: 'Movendo solicitacao',
        message: 'Aguarde enquanto a tarefa e enviada ao Fluig...'
      });
    }

    const legacyLoading = FLUIGC.loading(this.getContainer());
    legacyLoading.show();

    return {
      hide: function () { legacyLoading.hide(); },
      updateMessage: function () {}
    };
  },

  waitForUiPaint: function () {
    return new Promise((resolve) => {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => setTimeout(resolve, 0));
        return;
      }
      setTimeout(resolve, 0);
    });
  },

  resolveProcessInstanceId: async function () {
    if (this._state.processInstanceId) {
      return this._state.processInstanceId;
    }

    if (!this._state.documentId) {
      throw new Error('Não foi possível identificar a solicitação atual');
    }

    const processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(this._state.documentId);
    this._state.processInstanceId = this.asText(processInstanceId);
    return this._state.processInstanceId;
  },

  showToast: function (title, message, type) {
    const ui = $(document).data('gpUiComponents');
    if (type === 'warning' && ui && ui.validation && typeof ui.validation.showValidationFromLegacy === 'function') {
      if (ui.validation.showValidationFromLegacy(this.getContainer(), title, message)) return;
    }

    const root = this.getContainer();
    const toast = root.find('#toast');
    const icon = root.find('#toast-icon');
    const toastTitle = root.find('#toast-title');
    const toastMessage = root.find('#toast-message');
    if (!toast.length || !icon.length || !toastTitle.length || !toastMessage.length) return;

    const config = {
      success: { icon: 'fa-solid fa-check-circle text-bevap-green', border: 'border-bevap-green' },
      error: { icon: 'fa-solid fa-times-circle text-red-500', border: 'border-red-500' },
      warning: { icon: 'fa-solid fa-exclamation-triangle text-bevap-gold', border: 'border-bevap-gold' },
      info: { icon: 'fa-solid fa-info-circle text-blue-500', border: 'border-blue-500' }
    };

    const finalType = config[type] ? type : 'info';
    icon.attr('class', `${config[finalType].icon} text-2xl mr-3`);
    toast.attr('class', `fixed top-20 right-4 z-50 bg-white rounded-lg shadow-xl border-l-4 p-4 max-w-md ${config[finalType].border}`);
    toastTitle.text(title || 'Informacao');
    toastMessage.text(message || '');
    toast.removeClass('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
      this._toastTimer = null;
    }, 3500);
  },

  getPriorityLabel: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'Crítico';
    if (normalized.indexOf('estrategico') !== -1) return 'Estratégico';
    if (normalized.indexOf('operacional') !== -1) return 'Operacional';
    return this.asText(priority);
  },

  getPriorityBadgeClasses: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'bg-red-100 text-red-800';
    if (normalized.indexOf('estrategico') !== -1) return 'bg-green-100 text-green-800';
    if (normalized.indexOf('operacional') !== -1) return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-800';
  },

  getExecutionTypeLabel: function (value) {
    const raw = this.asText(value);
    const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('extern') !== -1) return 'Externo';
    if (normalized.indexOf('intern') !== -1) return 'Interno';
    return raw || 'N/A';
  },

  getExecutionTypeBadgeClasses: function (value) {
    const normalized = this.asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('extern') !== -1) return 'bg-purple-100 text-purple-800';
    if (normalized.indexOf('intern') !== -1) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  },

  getEstadoProcessoLabel: function (estadoProcesso) {
    const raw = this.asText(estadoProcesso);
    if (!raw) return '';
    return raw.replace(/^\s*\d+\s*-\s*/i, '').trim() || raw;
  },

  countAttachments: function (value) {
    const text = this.asText(value);
    if (!text) return 0;

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.length;
    } catch (error) {}

    return text.split(/\r?\n|;|,/).map((item) => this.asText(item)).filter(Boolean).length;
  },

  getBooleanFieldValue: function (selector) {
    return this.getContainer().find(selector).is(':checked') ? 'true' : 'false';
  },

  parseBooleanLike: function (value) {
    const normalized = this.asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return ['true', '1', 'sim', 'yes', 'on'].indexOf(normalized) >= 0;
  },

  mapPaymentConditionToTerm: function (value) {
    const normalized = this.asText(value).toLowerCase().replace(/\s+/g, '');
    if (!normalized) return '';
    if (normalized.indexOf('30/60/90') >= 0) return '30/60/90';
    if (normalized.indexOf('45') >= 0) return '45';
    if (normalized.indexOf('60') >= 0) return '60';
    if (normalized.indexOf('30') >= 0) return '30';
    if (normalized.indexOf('vista') >= 0 || normalized.indexOf('avista') >= 0) return 'vista';
    return '';
  },

  parsePercentValue: function (value) {
    const text = this.asText(value).replace('%', '').replace(',', '.');
    const parsed = Number(text);
    if (!isFinite(parsed)) return 0;
    return Math.max(0, Math.min(100, parsed));
  },

  formatPercentLabel: function (value) {
    const percent = this.parsePercentValue(value);
    const normalized = Number(percent.toFixed(2));
    return `${String(normalized).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}%`;
  },

  formatPercent: function (value) {
    const amount = Number(value);
    const safe = isFinite(amount) ? amount : 0;
    return `${safe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  },

  parseCurrencyValue: function (value) {
    const text = this.asText(value);
    if (!text) return null;

    const normalized = text
      .replace(/\s/g, '')
      .replace(/[A-Za-z$€£R]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');

    const parsed = Number(normalized);
    return isFinite(parsed) ? parsed : null;
  },

  formatCurrency: function (value) {
    const amount = Number(value);
    const safe = isFinite(amount) ? amount : 0;
    return `R$ ${safe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  normalizeCurrencyInput: function (inputEl) {
    const input = inputEl && inputEl.jquery ? inputEl.get(0) : inputEl;
    if (!input) return;

    const parsed = this.parseCurrencyValue($(input).val());
    if (parsed === null) return;
    $(input).val(this.formatCurrency(parsed));
  },

  applyCurrencyMaskInput: function (inputEl) {
    const input = inputEl && inputEl.jquery ? inputEl.get(0) : inputEl;
    if (!input) return;

    const raw = this.asText($(input).val());
    const digitsOnly = raw.replace(/\D/g, '');

    if (!digitsOnly) {
      $(input).val('');
      return;
    }

    const cents = Number(digitsOnly) / 100;
    if (!isFinite(cents)) {
      $(input).val('');
      return;
    }

    $(input).val(this.formatCurrency(cents));
  },

  formatDays: function (value) {
    const text = this.asText(value);
    if (!text) return '';
    if (/^\d+$/.test(text)) return `${text} dias`;
    return text;
  },

  formatSummaryVigencia: function (value) {
    const text = this.asText(value);
    if (!text) return '';
    if (!/^\d+$/.test(text)) return text;

    const totalDays = Number(text);
    if (!isFinite(totalDays) || totalDays <= 0) return '';
    if (totalDays % 30 === 0) {
      const months = Math.round(totalDays / 30);
      return `${months} meses`;
    }

    return `${totalDays} dias`;
  },

  normalizeDateToInput: function (value) {
    const text = this.asText(value);
    if (!text) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;

    const isoDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoDateTime) return `${isoDateTime[1]}-${isoDateTime[2]}-${isoDateTime[3]}`;

    return '';
  },

  formatDateForCard: function (isoDate) {
    const text = this.asText(isoDate);
    if (!text) return '';

    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return text;

    return `${match[3]}/${match[2]}/${match[1]}`;
  },

  formatDateForDisplay: function (value) {
    const iso = this.normalizeDateToInput(value);
    if (!iso) return '-';
    return this.formatDateForCard(iso);
  },

  parseIsoDate: function (value) {
    const text = this.asText(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    const d = new Date(`${text}T00:00:00`);
    if (!isFinite(d.getTime())) return null;
    return d;
  },

  formatDateToIso: function (dateObj) {
    if (!dateObj || !isFinite(dateObj.getTime())) return '';
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  getTodayIso: function () {
    return this.formatDateToIso(new Date());
  },

  parseTableJson: function (value) {
    if (Array.isArray(value)) return value;

    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  escapeSelectorValue: function (value) {
    return this.asText(value).replace(/([\\"'\[\]:.])/g, '\\$1');
  },

  escapeHtml: function (value) {
    return this.asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  }
};
