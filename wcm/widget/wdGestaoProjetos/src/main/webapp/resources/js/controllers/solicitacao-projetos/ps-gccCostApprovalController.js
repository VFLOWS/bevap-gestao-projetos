const gccCostApprovalController = {
  _eventNamespace: '.gccCostApproval',
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
    'prioridadeNS',
    'estadoProcesso',
    'anexosNS',
    'anexosPropostaTIPC',
    'nomeFornecedorTIPC',
    'numeroRefPropostaTIPC',
    'vigenciaDiasTIPC',
    'valortotalTIPC',
    'condicaoPagamentoTIPC',
    'prazoEstimadoTIPC',
    'capexGCC',
    'opexGCC',
    'competenciaGCC',
    'observacoesNegociacaoGCC',
    'decisaoGCC',
    'justificativaGCC',
    'categoriaJustificativaGCC',
    'tblNaturezaCustoCapexGCC.centroCustoCapexGCC',
    'tblNaturezaCustoCapexGCC.contaContabilCapexGCC',
    'tblNaturezaCustoCapexGCC.porcentagemCapexGCC',
    'tblNaturezaCustoCapexGCC.saldoCapexGCC',
    'tblNaturezaCustoCapexGCC.saldoAposCompromissoCapexGCC',
    'tblNaturezaCustoOpexGCC.centroCustoOpexGCC',
    'tblNaturezaCustoOpexGCC.contaContabilOpexGCC',
    'tblNaturezaCustoOpexGCC.porcentagemOpexGCC',
    'tblNaturezaCustoOpexGCC.saldoOpexGCC',
    'tblNaturezaCustoOpexGCC.saldoAposCompromissoOpexGCC'
  ],
  _state: {
    documentId: null,
    estadoProcesso: null,
    processInstanceId: null,
    baseRow: null,
    currentTab: 'solicitacao',
    historyCache: {},
    isSubmitting: false
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
        this.updateAllocationVisibility();
        this.ensureVisibleAllocationRows();
        this.loadReadOnlyTab(this._state.currentTab);
        this.loadBaseContext();
      })
      .fail((error) => {
        console.error('[gccCostApproval] Template load error:', error);
        container.html('<div class="p-6 text-red-600">Falha ao carregar a tela do GCC.</div>');
      });
  },

  destroy: function () {
    this.unbindEvents();
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
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-gcc-cost-approval.html`;
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
        title: titleEl.text() || '',
        breadcrumbHtml: breadcrumbEl.html() || ''
      };
    }

    titleEl.text('GCC - Aprovar Custo do Projeto');
    breadcrumbEl.html('<a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a><i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i><span class="text-bevap-gold font-medium">Aprovacao GCC</span>');
  },

  restoreHeader: function () {
    if (!this._headerBackup) return;

    const header = $('#header');
    if (!header.length) return;

    header.find('h1').first().text(this._headerBackup.title || '');
    header.find('nav').first().html(this._headerBackup.breadcrumbHtml || '');
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
    });

    root.on(`click${ns}`, '[data-action="save-draft"]', (event) => {
      event.preventDefault();
      this.saveDraft();
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

    root.on(`click${ns}`, '#approve-modal, #modal-return, #modal-reject', (event) => {
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

    root.on(`input${ns}`, '#gcc-capex-percent', () => this.syncPercentages('capex'));
    root.on(`input${ns}`, '#gcc-opex-percent', () => this.syncPercentages('opex'));

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
      target.html('<div class="text-sm text-red-600">Componente da aba indisponivel.</div>');
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteudo...</div>');

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
      console.error(`[gccCostApproval] Error loading tab ${tabName}:`, error);
      target.html('<div class="text-sm text-red-600">Nao foi possivel carregar esta aba.</div>');
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
    if (!this._state.documentId) {
      this.showToast('Sem solicitacao', 'Nenhum documentId foi informado para esta rota.', 'warning');
      return;
    }

    try {
      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields: this._baseFields,
        filters: { documentid: this._state.documentId }
      });

      const row = rows && rows.length ? rows[0] : null;
      this._state.baseRow = row;

      if (!row) {
        this.showToast('Nao encontrado', 'Nao foi possivel localizar dados da solicitacao.', 'warning');
        return;
      }

      this.renderSidebarFromRow(row);
      this.fillFieldsFromRow(row);
      this.updateApproveModalProject(row);
    } catch (error) {
      console.error('[gccCostApproval] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Nao foi possivel carregar os dados do GCC.', 'error');
    }
  },

  updateApproveModalProject: function (row) {
    const label = [this.asText(row.documentid), this.asText(row.titulodoprojetoNS)].filter(Boolean).join(' - ');
    this.getContainer().find('#gcc-approve-project').text(label || 'Projeto selecionado');
  },

  renderSidebarSkeleton: function () {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const root = this.getContainer();
    ui.sidebar.renderProjectSummary(root.find('[data-component="project-summary"]').first(), {
      code: 'N/A',
      title: 'N/A',
      requester: 'Solicitante',
      area: 'N/A',
      sponsor: 'N/A',
      attachmentsCount: 0,
      priority: {
        label: 'N/A',
        iconClass: 'fa-solid fa-star',
        badgeClasses: 'bg-gray-100 text-gray-800'
      },
      customRows: [{ variant: 'block', label: 'Fornecedor', value: 'Nao informado' }],
      status: {
        label: 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-gray-100 text-gray-800'
      }
    });

    ui.sidebar.renderProgress(root.find('[data-component="progress-status"]').first(), {
      items: this.getProgressItems()
    });
  },

  renderSidebarFromRow: function (row) {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const root = this.getContainer();
    ui.sidebar.renderProjectSummary(root.find('[data-component="project-summary"]').first(), {
      code: this.asText(row.documentid) || 'N/A',
      title: this.asText(row.titulodoprojetoNS) || 'N/A',
      requester: 'Solicitante',
      area: this.asText(row.areaUnidadeNS) || 'N/A',
      sponsor: this.asText(row.patrocinadorNS) || 'N/A',
      attachmentsCount: this.countAttachments(row.anexosNS) + this.countAttachments(row.anexosPropostaTIPC),
      priority: {
        label: this.getPriorityLabel(row.prioridadeNS) || 'N/A',
        iconClass: 'fa-solid fa-star',
        badgeClasses: this.getPriorityBadgeClasses(row.prioridadeNS)
      },
      customRows: [{ variant: 'block', label: 'Fornecedor', value: this.asText(row.nomeFornecedorTIPC) || 'Nao informado' }],
      status: {
        label: this.getEstadoProcessoLabel(row.estadoProcesso) || 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-blue-100 text-blue-800'
      }
    });

    ui.sidebar.renderProgress(root.find('[data-component="progress-status"]').first(), {
      items: this.getProgressItems()
    });
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitacao aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Analise TI concluida', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Impacto na area concluido', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Triagem tecnica concluida', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Proposta comercial aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Aprovacao GCC em andamento', iconClass: 'fa-solid fa-clock' },
      { style: 'default', label: 'Comite de custo', iconClass: 'fa-solid fa-hourglass-half' }
    ];
  },

  fillFieldsFromRow: function (row) {
    const root = this.getContainer();

    root.find('#gcc-summary-supplier').text(this.asText(row.nomeFornecedorTIPC) || 'Nao informado');
    root.find('#gcc-summary-reference').text(this.asText(row.numeroRefPropostaTIPC) || 'Nao informado');
    root.find('#gcc-summary-validity').text(this.formatDays(row.vigenciaDiasTIPC) || 'Nao informado');
    root.find('#gcc-summary-total').text(this.asText(row.valortotalTIPC) || 'Nao informado');
    root.find('#gcc-summary-condition').text(this.asText(row.condicaoPagamentoTIPC) || 'Nao informado');
    root.find('#gcc-summary-deadline').text(this.asText(row.prazoEstimadoTIPC) || 'Nao informado');

    root.find('#gcc-capex-percent').val(this.asText(row.capexGCC));
    root.find('#gcc-opex-percent').val(this.asText(row.opexGCC));
    root.find('#gcc-capex-percent-label').text(this.formatPercentLabel(row.capexGCC));
    root.find('#gcc-opex-percent-label').text(this.formatPercentLabel(row.opexGCC));
    root.find('#gcc-competence').val(this.normalizeMonthValue(row.competenciaGCC));
    root.find('#gcc-observations').val(this.asText(row.observacoesNegociacaoGCC));

    this.renderAllocationRows('capex', this.parseAllocationTable(row.tblNaturezaCustoCapexGCC || row['tblNaturezaCustoCapexGCC'], 'capex'));
    this.renderAllocationRows('opex', this.parseAllocationTable(row.tblNaturezaCustoOpexGCC || row['tblNaturezaCustoOpexGCC'], 'opex'));

    this.updateAllocationVisibility();
    this.ensureVisibleAllocationRows();
  },

  parseAllocationTable: function (value, kind) {
    return this.parseTableJson(value).map((item) => {
      if (kind === 'capex') {
        return {
          centerCost: this.asText(item && item.centroCustoCapexGCC),
          account: this.asText(item && item.contaContabilCapexGCC),
          percentage: this.asText(item && item.porcentagemCapexGCC),
          balance: this.asText(item && item.saldoCapexGCC),
          balanceAfter: this.asText(item && item.saldoAposCompromissoCapexGCC)
        };
      }

      return {
        centerCost: this.asText(item && item.centroCustoOpexGCC),
        account: this.asText(item && item.contaContabilOpexGCC),
        percentage: this.asText(item && item.porcentagemOpexGCC),
        balance: this.asText(item && item.saldoOpexGCC),
        balanceAfter: this.asText(item && item.saldoAposCompromissoOpexGCC)
      };
    }).filter((item) => item.centerCost || item.account || item.percentage || item.balance || item.balanceAfter);
  },

  getAllocationContainer: function (kind) {
    return this.getContainer().find(`#gcc-${kind}-rows`).first();
  },

  renderAllocationRows: function (kind, rows) {
    const container = this.getAllocationContainer(kind);
    if (!container.length) return;

    container.empty();
    (rows || []).forEach((row) => this.appendAllocationRow(kind, row));
  },

  appendAllocationRow: function (kind, row) {
    const container = this.getAllocationContainer(kind);
    if (!container.length) return;

    const data = row || {};
    const safeKind = this.escapeHtml(kind);
    container.append(`
      <div class="gcc-allocation-row border border-gray-200 rounded-lg p-4 bg-white" data-kind="${safeKind}">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Centro de Custo</label>
            <input type="text" data-field="center-cost" value="${this.escapeHtml(data.centerCost)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm" />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Conta Contabil</label>
            <input type="text" data-field="account" value="${this.escapeHtml(data.account)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm" />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Porcentagem</label>
            <input type="number" min="0" max="100" step="0.01" data-field="percentage" value="${this.escapeHtml(data.percentage)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm" />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Saldo</label>
            <input type="text" data-field="balance" value="${this.escapeHtml(data.balance)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm" />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Saldo apos compromisso</label>
            <input type="text" data-field="balance-after" value="${this.escapeHtml(data.balanceAfter)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm" />
          </div>
        </div>
        <div class="flex justify-end mt-3">
          <button type="button" data-action="remove-allocation-row" class="text-sm text-red-600 hover:text-red-700 font-medium">
            <i class="fa-solid fa-trash mr-1"></i> Remover linha
          </button>
        </div>
      </div>
    `);
  },

  addAllocationRow: function (kind) {
    this.appendAllocationRow(kind, {});
  },

  removeAllocationRow: function (buttonEl) {
    const rowEl = $(buttonEl).closest('.gcc-allocation-row');
    const kind = this.asText(rowEl.attr('data-kind'));
    rowEl.remove();
    this.ensureVisibleAllocationRows();
    if (kind) this.updateAllocationVisibility();
  },

  collectAllocationRows: function (kind) {
    return this.getAllocationContainer(kind).find('.gcc-allocation-row').map((_, rowEl) => {
      const row = $(rowEl);
      return {
        centerCost: this.asText(row.find('[data-field="center-cost"]').val()),
        account: this.asText(row.find('[data-field="account"]').val()),
        percentage: this.asText(row.find('[data-field="percentage"]').val()),
        balance: this.asText(row.find('[data-field="balance"]').val()),
        balanceAfter: this.asText(row.find('[data-field="balance-after"]').val())
      };
    }).get().filter((row) => row.centerCost || row.account || row.percentage || row.balance || row.balanceAfter);
  },

  getAllocationPercent: function (kind) {
    const selector = kind === 'capex' ? '#gcc-capex-percent' : '#gcc-opex-percent';
    return this.parsePercentValue(this.getContainer().find(selector).val());
  },

  syncPercentages: function (changedKind) {
    const root = this.getContainer();
    let capex = this.parsePercentValue(root.find('#gcc-capex-percent').val());
    let opex = this.parsePercentValue(root.find('#gcc-opex-percent').val());

    if (changedKind === 'capex') {
      opex = Math.max(0, 100 - capex);
      root.find('#gcc-opex-percent').val(opex);
    } else {
      capex = Math.max(0, 100 - opex);
      root.find('#gcc-capex-percent').val(capex);
    }

    root.find('#gcc-capex-percent-label').text(this.formatPercentLabel(capex));
    root.find('#gcc-opex-percent-label').text(this.formatPercentLabel(opex));

    this.updateAllocationVisibility();
    this.ensureVisibleAllocationRows();
  },

  updateAllocationVisibility: function () {
    const root = this.getContainer();
    const capex = this.getAllocationPercent('capex');
    const opex = this.getAllocationPercent('opex');

    root.find('#gcc-capex-percent-label').text(this.formatPercentLabel(capex));
    root.find('#gcc-opex-percent-label').text(this.formatPercentLabel(opex));
    root.find('#gcc-capex-wrapper').toggleClass('hidden', capex <= 0);
    root.find('#gcc-opex-wrapper').toggleClass('hidden', opex <= 0);
  },

  ensureVisibleAllocationRows: function () {
    if (this.getAllocationPercent('capex') > 0 && !this.collectAllocationRows('capex').length) {
      this.appendAllocationRow('capex', {});
    }

    if (this.getAllocationPercent('opex') > 0 && !this.collectAllocationRows('opex').length) {
      this.appendAllocationRow('opex', {});
    }
  },

  validateFinancePanel: function () {
    const missing = [];
    const root = this.getContainer();
    const competence = this.asText(root.find('#gcc-competence').val());
    const capex = this.getAllocationPercent('capex');
    const opex = this.getAllocationPercent('opex');
    const total = Number((capex + opex).toFixed(2));

    if (!competence) missing.push('Competencia');
    if (total !== 100) missing.push('Distribuicao CAPEX/OPEX deve totalizar 100%');

    ['capex', 'opex'].forEach((kind) => {
      const kindPercent = kind === 'capex' ? capex : opex;
      if (kindPercent <= 0) return;

      const rows = this.collectAllocationRows(kind);
      if (!rows.length) {
        missing.push(`${kind.toUpperCase()} precisa de pelo menos uma linha`);
        return;
      }

      const allocationSum = Number(rows.reduce((acc, row) => acc + this.parsePercentValue(row.percentage), 0).toFixed(2));
      if (allocationSum !== Number(kindPercent.toFixed(2))) {
        missing.push(`Rateio de ${kind.toUpperCase()} deve somar ${this.formatPercentLabel(kindPercent)}`);
      }

      rows.forEach((row, index) => {
        const label = `${kind.toUpperCase()} linha ${index + 1}`;
        if (!row.centerCost) missing.push(`${label} - Centro de Custo`);
        if (!row.account) missing.push(`${label} - Conta Contabil`);
        if (!row.percentage) missing.push(`${label} - Porcentagem`);
      });
    });

    return missing;
  },

  collectGccCardData: function (decisionValue, justificationValue, categoryValue) {
    const root = this.getContainer();
    const capexRows = this.collectAllocationRows('capex');
    const opexRows = this.collectAllocationRows('opex');
    const cardData = {
      capexGCC: this.asText(root.find('#gcc-capex-percent').val()),
      opexGCC: this.asText(root.find('#gcc-opex-percent').val()),
      competenciaGCC: this.formatMonthForCard(root.find('#gcc-competence').val()),
      observacoesNegociacaoGCC: this.asText(root.find('#gcc-observations').val())
    };

    if (decisionValue !== undefined) cardData.decisaoGCC = this.asText(decisionValue);
    if (justificationValue !== undefined) cardData.justificativaGCC = this.asText(justificationValue);
    if (categoryValue !== undefined) cardData.categoriaJustificativaGCC = this.asText(categoryValue);

    capexRows.forEach((row, index) => {
      const i = index + 1;
      cardData[`centroCustoCapexGCC___${i}`] = row.centerCost;
      cardData[`contaContabilCapexGCC___${i}`] = row.account;
      cardData[`porcentagemCapexGCC___${i}`] = row.percentage;
      cardData[`saldoCapexGCC___${i}`] = row.balance;
      cardData[`saldoAposCompromissoCapexGCC___${i}`] = row.balanceAfter;
    });

    opexRows.forEach((row, index) => {
      const i = index + 1;
      cardData[`centroCustoOpexGCC___${i}`] = row.centerCost;
      cardData[`contaContabilOpexGCC___${i}`] = row.account;
      cardData[`porcentagemOpexGCC___${i}`] = row.percentage;
      cardData[`saldoOpexGCC___${i}`] = row.balance;
      cardData[`saldoAposCompromissoOpexGCC___${i}`] = row.balanceAfter;
    });

    return cardData;
  },

  collectGccTaskFields: function (decisionValue, justificationValue, categoryValue) {
    const cardData = this.collectGccCardData(decisionValue, justificationValue, categoryValue);
    return Object.keys(cardData).map((fieldName) => ({
      name: fieldName,
      value: cardData[fieldName]
    }));
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho do GCC...');
      await this.waitForUiPaint();

      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        taskFields: this.collectGccTaskFields()
      });

      this.showToast('Rascunho salvo', 'As alteracoes foram salvas com sucesso.', 'success');
    } catch (error) {
      console.error('[gccCostApproval] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Nao foi possivel salvar o rascunho.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  handleApprove: function () {
    this.submitAction({
      actionLabel: 'Aprovar',
      modalId: 'approve-modal',
      decisionValue: 'aprovado',
      validateFinance: true
    });
  },

  handleReturn: function () {
    const justification = this.asText(this.getContainer().find('#gcc-justification-return').val());
    if (!justification) {
      this.showToast('Justificativa', 'Informe o motivo da devolucao.', 'warning');
      this.getContainer().find('#gcc-justification-return').trigger('focus');
      return;
    }

    this.submitAction({
      actionLabel: 'Devolver para Correcao',
      modalId: 'modal-return',
      decisionValue: 'correcao',
      justification: justification,
      validateFinance: false
    });
  },

  handleReject: function () {
    const root = this.getContainer();
    const category = this.asText(root.find('#gcc-reject-category').val());
    const justification = this.asText(root.find('#gcc-justification-reject').val());

    if (!category) {
      this.showToast('Categoria', 'Selecione a categoria da reprovacao.', 'warning');
      root.find('#gcc-reject-category').trigger('focus');
      return;
    }

    if (!justification) {
      this.showToast('Justificativa', 'Informe a justificativa da reprovacao.', 'warning');
      root.find('#gcc-justification-reject').trigger('focus');
      return;
    }

    this.submitAction({
      actionLabel: 'Reprovar',
      modalId: 'modal-reject',
      decisionValue: 'reprovado',
      justification: justification,
      category: category,
      validateFinance: false
    });
  },

  submitAction: async function (config) {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      if (config && config.validateFinance) {
        const missing = this.validateFinancePanel();
        if (missing.length) {
          this.showToast('Campos obrigatorios', `Preencha: ${missing.join(' | ')}`, 'warning');
          return;
        }
      }

      loading.updateMessage('Preparando movimentacao do GCC...');
      await this.waitForUiPaint();

      const processInstanceId = await this.resolveProcessInstanceId();
      const taskFields = this.collectGccTaskFields(
        config && config.decisionValue,
        config && config.justification,
        config && config.category
      );

      loading.updateMessage('Enviando movimentacao para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 56,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos',
        comments: `GCC: ${this.asText(config && config.actionLabel)}`
      }, taskFields);

      if (config && config.modalId) {
        this.closeModal(config.modalId);
      }

      this.showToast('Sucesso', `Acao registrada: ${this.asText(config && config.actionLabel)}.`, 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[gccCostApproval] Error moving task:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Nao foi possivel movimentar a solicitacao.', 'error');
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
      throw new Error('Nao foi possivel identificar a solicitacao atual');
    }

    const processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(this._state.documentId);
    this._state.processInstanceId = this.asText(processInstanceId);
    return this._state.processInstanceId;
  },

  showToast: function (title, message, type) {
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

  formatDays: function (value) {
    const text = this.asText(value);
    if (!text) return '';
    if (/^\d+$/.test(text)) return `${text} dias`;
    return text;
  },

  formatPercentLabel: function (value) {
    const percent = this.parsePercentValue(value);
    const normalized = Number(percent.toFixed(2));
    return `${String(normalized).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}%`;
  },

  parsePercentValue: function (value) {
    const text = this.asText(value).replace('%', '').replace(',', '.');
    const parsed = Number(text);
    if (!isFinite(parsed)) return 0;
    return Math.max(0, Math.min(100, parsed));
  },

  normalizeMonthValue: function (value) {
    const text = this.asText(value);
    if (!text) return '';

    if (/^\d{4}-\d{2}$/.test(text)) return text;

    const br = text.match(/^(\d{2})\/(\d{4})$/);
    if (br) return `${br[2]}-${br[1]}`;

    return '';
  },

  formatMonthForCard: function (value) {
    const text = this.asText(value);
    if (!text) return '';

    const match = text.match(/^(\d{4})-(\d{2})$/);
    if (!match) return text;

    return `${match[2]}/${match[1]}`;
  },

  getPriorityLabel: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'Critico';
    if (normalized.indexOf('estrategico') !== -1) return 'Estrategico';
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
