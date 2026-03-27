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
    'fornecedorRecomendadoTITT',
    'execucaoProjetoTITT',
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
    'tblNaturezaCustoOpexGCC.saldoAposCompromissoOpexGCC',
    'tblItensServicosTIPC.descricaoItemServicoTIPC',
    'tblItensServicosTIPC.quantidadeItemServicoTIPC',
    'tblItensServicosTIPC.valorUnitarioItemServicoTIPC',
    'tblItensServicosTIPC.totalItemServicoTIPC'
  ],
  _state: {
    documentId: null,
    estadoProcesso: null,
    processInstanceId: null,
    baseRow: null,
    currentTab: 'solicitacao',
    historyCache: {},
    isSubmitting: false,
    costCenterOptions: [],
    allocationCostCenterFilters: {}
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
    this._state.costCenterOptions = [];
    this._state.allocationCostCenterFilters = {};
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

    root.on(`change${ns}`, '#gcc-cost-nature-capex', () => this.handleCostNatureToggle('capex'));
    root.on(`change${ns}`, '#gcc-cost-nature-opex', () => this.handleCostNatureToggle('opex'));

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

    root.on(`click${ns}`, '[data-action="toggle-cost-table"]', (event) => {
      event.preventDefault();
      this.toggleCostTable();
    });

    root.on(`input${ns}`, '#gcc-capex-rows [data-field="committed"], #gcc-capex-rows [data-field="balance"], #gcc-capex-rows [data-field="account"], #gcc-opex-rows [data-field="committed"], #gcc-opex-rows [data-field="balance"], #gcc-opex-rows [data-field="account"]', () => {
      this.refreshFinancialImpact();
    });

    root.on(`blur${ns}`, '#gcc-capex-rows [data-field="committed"], #gcc-capex-rows [data-field="balance"], #gcc-opex-rows [data-field="committed"], #gcc-opex-rows [data-field="balance"]', (event) => {
      this.normalizeCurrencyInput(event.currentTarget);
      this.refreshFinancialImpact();
    });
  },

  handleCostNatureToggle: function (kind) {
    const root = this.getContainer();
    const capexChecked = Boolean(root.find('#gcc-cost-nature-capex').prop('checked'));
    const opexChecked = Boolean(root.find('#gcc-cost-nature-opex').prop('checked'));

    if (capexChecked && !opexChecked) {
      root.find('#gcc-capex-percent').val(100);
      root.find('#gcc-opex-percent').val(0);
    } else if (!capexChecked && opexChecked) {
      root.find('#gcc-capex-percent').val(0);
      root.find('#gcc-opex-percent').val(100);
    } else if (!capexChecked && !opexChecked) {
      root.find('#gcc-capex-percent').val(0);
      root.find('#gcc-opex-percent').val(0);
    }

    this.syncPercentages(kind);
    this.updateCostNatureCardStyles();
  },

  updateCostNatureCardStyles: function () {
    const root = this.getContainer();
    ['capex', 'opex'].forEach((kind) => {
      const checkbox = root.find(kind === 'capex' ? '#gcc-cost-nature-capex' : '#gcc-cost-nature-opex').first();
      const card = checkbox.closest('[data-role="cost-nature-card"]');
      if (!card.length) return;

      const checked = Boolean(checkbox.prop('checked'));
      card.toggleClass('border-bevap-green bg-green-50', checked);
      card.toggleClass('border-gray-300', !checked);
    });
  },

  toggleCostTable: function () {
    const root = this.getContainer();
    const table = root.find('[data-role="cost-table"]').first();
    const icon = root.find('[data-role="toggle-icon"]').first();
    const text = root.find('[data-role="toggle-text"]').first();
    if (!table.length) return;

    const isHidden = table.hasClass('hidden');
    table.toggleClass('hidden', !isHidden);

    if (icon.length) {
      icon.toggleClass('fa-chevron-up', isHidden);
      icon.toggleClass('fa-chevron-down', !isHidden);
    }

    if (text.length) {
      text.text(isHidden ? 'Recolher' : 'Expandir');
    }
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
    try {
      const row = await this.findBaseRow();
      this._state.baseRow = row;

      if (!row) {
        this.renderSidebarSkeleton();
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
    this.getContainer().find('#gcc-approve-project').text(label || 'Projeto selecionado');
  },

  renderSidebarSkeleton: function () {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const root = this.getContainer();
    ui.sidebar.renderProjectSummary(root.find('[data-component="project-summary"]').first(), {
      code: 'N/A',
      title: 'N/A',
      requester: 'N/A',
      showRequester: false,
      area: 'N/A',
      sponsor: 'N/A',
      attachmentsCount: 0,
      priority: {
        label: 'N/A',
        iconClass: 'fa-solid fa-star',
        badgeClasses: 'bg-gray-100 text-gray-800'
      },
      customRows: [
        {
          variant: 'badge',
          label: 'Tipo',
          value: 'N/A',
          iconClass: 'fa-solid fa-arrow-up-right-from-square',
          badgeClasses: 'bg-gray-100 text-gray-800'
        },
        {
          variant: 'block',
          label: 'Fornecedor Recomendado',
          value: 'Nao informado'
        },
        {
          variant: 'kvList',
          label: 'Estimativa Original',
          items: [
            { label: 'Custo:', value: 'N/A' },
            { label: 'Prazo:', value: 'N/A' }
          ]
        }
      ],
      status: {
        label: 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-gray-100 text-gray-800'
      }
    });

    this.refreshFinancialImpact();
  },

  renderSidebarFromRow: function (row) {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const root = this.getContainer();
    ui.sidebar.renderProjectSummary(root.find('[data-component="project-summary"]').first(), {
      code: this.asText(row.documentid) || 'N/A',
      title: this.asText(row.titulodoprojetoNS) || 'N/A',
      requester: 'N/A',
      showRequester: false,
      area: this.asText(row.areaUnidadeNS) || 'N/A',
      sponsor: this.asText(row.patrocinadorNS) || 'N/A',
      attachmentsCount: this.countAttachments(row.anexosNS) + this.countAttachments(row.anexosPropostaTIPC),
      priority: {
        label: this.getPriorityLabel(row.prioridadeNS) || 'N/A',
        iconClass: 'fa-solid fa-star',
        badgeClasses: this.getPriorityBadgeClasses(row.prioridadeNS)
      },
      customRows: [
        {
          variant: 'badge',
          label: 'Tipo',
          value: this.getExecutionTypeLabel(row.execucaoProjetoTITT) || 'N/A',
          iconClass: 'fa-solid fa-arrow-up-right-from-square',
          badgeClasses: this.getExecutionTypeBadgeClasses(row.execucaoProjetoTITT)
        },
        {
          variant: 'block',
          label: 'Fornecedor Recomendado',
          value: this.asText(row.fornecedorRecomendadoTITT) || this.asText(row.nomeFornecedorTIPC) || 'Nao informado'
        },
        {
          variant: 'kvList',
          label: 'Estimativa Original',
          items: [
            { label: 'Custo:', value: this.asText(row.valortotalTIPC) || 'Nao informado' },
            { label: 'Prazo:', value: this.formatDays(row.prazoEstimadoTIPC) || 'Nao informado' }
          ]
        }
      ],
      status: {
        label: this.getEstadoProcessoLabel(row.estadoProcesso) || 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-blue-100 text-blue-800'
      }
    });

    this.refreshFinancialImpact();
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

    this.renderCostStructureFromRow(row);

    root.find('#gcc-capex-percent').val(this.asText(row.capexGCC));
    root.find('#gcc-opex-percent').val(this.asText(row.opexGCC));
    root.find('#gcc-capex-percent-label').text(this.formatPercentLabel(row.capexGCC));
    root.find('#gcc-opex-percent-label').text(this.formatPercentLabel(row.opexGCC));
    root.find('#gcc-competence').val(this.normalizeMonthValue(row.competenciaGCC));
    root.find('#gcc-observations').val(this.asText(row.observacoesNegociacaoGCC));

    const capexRows = this.parseAllocationTable(row.tblNaturezaCustoCapexGCC || row['tblNaturezaCustoCapexGCC'], 'capex');
    const opexRows = this.parseAllocationTable(row.tblNaturezaCustoOpexGCC || row['tblNaturezaCustoOpexGCC'], 'opex');

    this.renderAllocationRows('capex', capexRows);
    this.renderAllocationRows('opex', opexRows);

    root.find('#gcc-cost-nature-capex').prop('checked', this.getAllocationPercent('capex') > 0 || capexRows.length > 0);
    root.find('#gcc-cost-nature-opex').prop('checked', this.getAllocationPercent('opex') > 0 || opexRows.length > 0);
    this.updateCostNatureCardStyles();

    this.updateAllocationVisibility();
    this.ensureVisibleAllocationRows();
    this.refreshFinancialImpact();
  },

  renderCostStructureFromRow: function (row) {
    const root = this.getContainer();
    const tbody = root.find('[data-component="gcc-cost-structure"]').first();
    if (!tbody.length) return;

    const items = this.parseTableJson(row.tblItensServicosTIPC || row['tblItensServicosTIPC']);
    const normalized = Array.isArray(items) ? items.filter(Boolean) : [];

    if (!normalized.length) {
      tbody.html(`
        <tr>
          <td class="px-4 py-3 text-gray-500" colspan="4">Estrutura de custo indisponivel.</td>
        </tr>
      `);
    } else {
      tbody.html(normalized.map((item) => {
        const descricao = this.escapeHtml(item && item.descricaoItemServicoTIPC);
        const qtd = this.escapeHtml(item && item.quantidadeItemServicoTIPC);
        const unit = this.escapeHtml(item && item.valorUnitarioItemServicoTIPC);
        const total = this.escapeHtml(item && item.totalItemServicoTIPC);

        return `
          <tr>
            <td class="px-4 py-3">${descricao || ''}</td>
            <td class="px-4 py-3 text-center">${qtd || ''}</td>
            <td class="px-4 py-3 text-right">${unit || ''}</td>
            <td class="px-4 py-3 text-right font-medium">${total || ''}</td>
          </tr>
        `;
      }).join(''));
    }

    const totalEl = root.find('#gcc-cost-structure-total');
    if (totalEl.length) {
      const totalGeral = this.asText(row.valortotalTIPC);
      const fallbackTotal = normalized.reduce((sum, item) => {
        const val = this.parseCurrencyValue(item && item.totalItemServicoTIPC);
        return sum + (val !== null ? val : 0);
      }, 0);
      totalEl.text(totalGeral || (fallbackTotal > 0 ? this.formatCurrency(fallbackTotal) : '—'));
    }
  },

  parseAllocationTable: function (value, kind) {
    return this.parseTableJson(value).map((item) => {
      const rawCenterCost = kind === 'capex'
        ? this.asText(item && item.centroCustoCapexGCC)
        : this.asText(item && item.centroCustoOpexGCC);
      const normalizedCostCenter = this.normalizeCostCenterValue(rawCenterCost);

      if (kind === 'capex') {
        return {
          centerCost: normalizedCostCenter.code,
          centerCostLabel: normalizedCostCenter.label,
          account: this.asText(item && item.contaContabilCapexGCC),
          committed: this.asText(item && item.porcentagemCapexGCC),
          balance: this.asText(item && item.saldoCapexGCC),
          balanceAfter: this.asText(item && item.saldoAposCompromissoCapexGCC)
        };
      }

      return {
        centerCost: normalizedCostCenter.code,
        centerCostLabel: normalizedCostCenter.label,
        account: this.asText(item && item.contaContabilOpexGCC),
        committed: this.asText(item && item.porcentagemOpexGCC),
        balance: this.asText(item && item.saldoOpexGCC),
        balanceAfter: this.asText(item && item.saldoAposCompromissoOpexGCC)
      };
    }).filter((item) => item.centerCost || item.account || item.committed || item.balance || item.balanceAfter);
  },

  getAllocationContainer: function (kind) {
    return this.getContainer().find(`#gcc-${kind}-rows`).first();
  },

  renderAllocationRows: function (kind, rows) {
    const container = this.getAllocationContainer(kind);
    if (!container.length) return;

    container.empty();

    const normalizedRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if (!normalizedRows.length) {
      this.appendAllocationRow(kind, {});
      return;
    }

    normalizedRows.forEach((row) => this.appendAllocationRow(kind, row));
  },

  appendAllocationRow: function (kind, row) {
    const container = this.getAllocationContainer(kind);
    if (!container.length) return;

    const data = row || {};
    const safeKind = this.escapeHtml(kind);
    const uid = `gcc-center-cost-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    container.append(`
      <tr class="gcc-allocation-row cost-allocation-row" data-kind="${safeKind}">
        <td class="py-3" colspan="6">
          <div class="p-4 bg-white border border-gray-200 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Centro de Custo</label>
                <div id="${uid}" data-role="center-cost-filter"></div>
                <input type="hidden" data-field="center-cost" value="${this.escapeHtml(data.centerCost)}" />
                <input type="hidden" data-field="center-cost-label" value="${this.escapeHtml(data.centerCostLabel || data.centerCost)}" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Conta Contabil</label>
                <input type="text" data-field="account" value="${this.escapeHtml(data.account)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent" />
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Valor Comprometido</label>
                <input type="text" inputmode="numeric" data-field="committed" value="${this.escapeHtml(data.committed)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent" placeholder="R$ 0,00" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Saldo</label>
                <input type="text" data-field="balance" value="${this.escapeHtml(data.balance)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Saldo apos compromisso</label>
                <input type="text" data-field="balance-after" value="${this.escapeHtml(data.balanceAfter)}" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" />
              </div>
              <div class="flex md:justify-end">
                <button type="button" data-action="remove-allocation-row" class="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors" title="Remover">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `);

    const appendedRow = container.find('.gcc-allocation-row').last();
    this.initializeAllocationCostCenterFilter(appendedRow, uid, data);
  },

  addAllocationRow: function (kind) {
    this.appendAllocationRow(kind, {});
    this.refreshFinancialImpact();
  },

  removeAllocationRow: function (buttonEl) {
    const $rowEl = $(buttonEl).closest('.gcc-allocation-row');
    if (!$rowEl.length) return;

    const kind = this.asText($rowEl.attr('data-kind'));
    if (!kind) return;

    const remaining = this.getAllocationContainer(kind).find('.gcc-allocation-row').length;
    const enabled = Boolean(this.getContainer().find(kind === 'capex' ? '#gcc-cost-nature-capex' : '#gcc-cost-nature-opex').prop('checked'));

    if (enabled && remaining <= 1) {
      $rowEl.find('input').val('');
      this.resetAllocationCostCenterFilter($rowEl);
      this.updateAllocationVisibility();
      this.refreshFinancialImpact();
      return;
    }

    this.destroyAllocationCostCenterFilter($rowEl);
    $rowEl.remove();
    this.ensureVisibleAllocationRows();
    this.updateAllocationVisibility();
    this.refreshFinancialImpact();
  },

  collectAllocationRows: function (kind) {
    return this.getAllocationContainer(kind).find('.gcc-allocation-row').map((_, rowEl) => {
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
    }).get().filter((row) => row.centerCost || row.account || row.committed || row.balance || row.balanceAfter);
  },

  getAllocationPercent: function (kind) {
    const selector = kind === 'capex' ? '#gcc-capex-percent' : '#gcc-opex-percent';
    return this.parsePercentValue(this.getContainer().find(selector).val());
  },

  syncPercentages: function (changedKind) {
    const root = this.getContainer();
    let capex = this.parsePercentValue(root.find('#gcc-capex-percent').val());
    let opex = this.parsePercentValue(root.find('#gcc-opex-percent').val());

    const capexChecked = Boolean(root.find('#gcc-cost-nature-capex').prop('checked'));
    const opexChecked = Boolean(root.find('#gcc-cost-nature-opex').prop('checked'));

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

    root.find('#gcc-capex-percent').val(capex);
    root.find('#gcc-opex-percent').val(opex);

    root.find('#gcc-capex-percent-label').text(this.formatPercentLabel(capex));
    root.find('#gcc-opex-percent-label').text(this.formatPercentLabel(opex));

    this.updateCostNatureCardStyles();

    this.updateAllocationVisibility();
    this.ensureVisibleAllocationRows();
    this.refreshFinancialImpact();
  },

  updateAllocationVisibility: function () {
    const root = this.getContainer();
    const capexEnabled = Boolean(root.find('#gcc-cost-nature-capex').prop('checked'));
    const opexEnabled = Boolean(root.find('#gcc-cost-nature-opex').prop('checked'));

    root.find('#gcc-capex-wrapper').toggleClass('hidden', !capexEnabled);
    root.find('#gcc-opex-wrapper').toggleClass('hidden', !opexEnabled);
    this.refreshFinancialImpact();
  },

  ensureVisibleAllocationRows: function () {
    ['capex', 'opex'].forEach((kind) => {
      const enabled = Boolean(this.getContainer().find(kind === 'capex' ? '#gcc-cost-nature-capex' : '#gcc-cost-nature-opex').prop('checked'));
      const container = this.getAllocationContainer(kind);
      if (!container.length) return;

      const existingRows = container.find('.gcc-allocation-row').length;
      if (enabled && existingRows === 0) {
        this.appendAllocationRow(kind, {});
      }
    });

    this.refreshFinancialImpact();
  },

  getProposalTotalAmount: function () {
    const root = this.getContainer();
    const summaryTotal = this.parseCurrencyValue(root.find('#gcc-summary-total').text());
    if (summaryTotal !== null) return summaryTotal;

    const tableTotal = this.parseCurrencyValue(root.find('#gcc-cost-structure-total').text());
    if (tableTotal !== null) return tableTotal;

    const rowTotal = this.parseCurrencyValue(this._state.baseRow && this._state.baseRow.valortotalTIPC);
    return rowTotal !== null ? rowTotal : 0;
  },

  recomputeAllocationRow: function (rowEl, proposalTotal) {
    const row = $(rowEl);
    if (!row.length) return;

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

    const afterValue = balance - committed;
    balanceAfterInput.val(this.formatCurrency(afterValue));
  },

  recomputeAllAllocationRows: function (proposalTotal) {
    const root = this.getContainer();
    root.find('.gcc-allocation-row').each((_, rowEl) => {
      this.recomputeAllocationRow(rowEl, proposalTotal);
    });
  },

  calculateCommittedAmount: function (kind, proposalTotal) {
    const rows = this.collectAllocationRows(kind);
    if (!rows.length || proposalTotal <= 0) return 0;

    return rows.reduce((sum, row) => {
      const balance = this.parseCurrencyValue(row.balance);
      const balanceAfter = this.parseCurrencyValue(row.balanceAfter);

      if (balance !== null && balanceAfter !== null) {
        return sum + Math.max(0, balance - balanceAfter);
      }

      const committed = this.parseCurrencyValue(row.committed);
      if (committed === null || committed <= 0) return sum;
      return sum + committed;
    }, 0);
  },

  aggregateBalancesByCenter: function (mode, proposalTotal) {
    const rowsByKind = {
      capex: this.collectAllocationRows('capex'),
      opex: this.collectAllocationRows('opex')
    };

    const map = {};

    Object.keys(rowsByKind).forEach((kind) => {
      rowsByKind[kind].forEach((row, index) => {
        const name = this.asText(row.centerCostLabel) || this.asText(row.centerCost) || `${kind.toUpperCase()} ${index + 1}`;
        let value = null;

        if (mode === 'balance') {
          value = this.parseCurrencyValue(row.balance);
        } else {
          value = this.parseCurrencyValue(row.balanceAfter);
          if (value === null) {
            const balance = this.parseCurrencyValue(row.balance);
            const committed = this.parseCurrencyValue(row.committed);
            if (balance !== null) {
              value = balance - (committed !== null ? committed : 0);
            }
          }
        }

        if (value === null) return;
        map[name] = (map[name] || 0) + value;
      });
    });

    return Object.keys(map).map((name) => ({ name, value: map[name] }));
  },

  renderImpactList: function (selector, rows) {
    const target = this.getContainer().find(selector).first();
    if (!target.length) return;

    if (!Array.isArray(rows) || !rows.length) {
      target.html(`
        <div class="flex justify-between text-xs">
          <span class="text-blue-100">—</span>
          <span class="font-medium text-blue-50">—</span>
        </div>
      `);
      return;
    }

    target.html(rows.slice(0, 6).map((item) => {
      return `
        <div class="flex justify-between text-xs gap-2">
          <span class="text-blue-100 truncate">${this.escapeHtml(item.name)}</span>
          <span class="font-medium text-blue-50 whitespace-nowrap">${this.escapeHtml(this.formatCurrency(item.value))}</span>
        </div>
      `;
    }).join(''));
  },

  refreshFinancialImpact: function () {
    const root = this.getContainer();
    if (!root.length) return;

    const proposalTotal = this.getProposalTotalAmount();
    this.recomputeAllAllocationRows(proposalTotal);

    const capexPercent = this.getAllocationPercent('capex');
    const opexPercent = this.getAllocationPercent('opex');

    const capexTotal = proposalTotal * (capexPercent / 100);
    const opexTotal = proposalTotal * (opexPercent / 100);
    const capexCommitted = this.calculateCommittedAmount('capex', proposalTotal);
    const opexCommitted = this.calculateCommittedAmount('opex', proposalTotal);

    root.find('#gcc-capex-total-value').text(this.formatCurrency(capexTotal));
    root.find('#gcc-opex-total-value').text(this.formatCurrency(opexTotal));
    root.find('#gcc-capex-committed-total').text(this.formatCurrency(capexCommitted));
    root.find('#gcc-opex-committed-total').text(this.formatCurrency(opexCommitted));

    root.find('#impact-proposal-value').text(this.formatCurrency(proposalTotal));

    const availableRows = this.aggregateBalancesByCenter('balance', proposalTotal);
    const afterRows = this.aggregateBalancesByCenter('after', proposalTotal);

    this.renderImpactList('#impact-available-list', availableRows);
    this.renderImpactList('#impact-after-list', afterRows);

    const availableTotal = availableRows.reduce((sum, item) => sum + (isFinite(item.value) ? item.value : 0), 0);
    const afterTotal = afterRows.reduce((sum, item) => sum + (isFinite(item.value) ? item.value : 0), 0);

    root.find('#impact-available-balance').text(this.formatCurrency(availableTotal));
    root.find('#impact-balance-after')
      .text(this.formatCurrency(afterTotal))
      .toggleClass('text-green-300', afterTotal >= 0)
      .toggleClass('text-red-300', afterTotal < 0);
  },

  validateFinancePanel: function () {
    const missing = [];
    const root = this.getContainer();
    const competence = this.asText(root.find('#gcc-competence').val());
    const capex = this.getAllocationPercent('capex');
    const opex = this.getAllocationPercent('opex');
    const capexEnabled = Boolean(root.find('#gcc-cost-nature-capex').prop('checked'));
    const opexEnabled = Boolean(root.find('#gcc-cost-nature-opex').prop('checked'));
    const total = Number(((capexEnabled ? capex : 0) + (opexEnabled ? opex : 0)).toFixed(2));

    if (!competence) missing.push('Competencia');
    if (!capexEnabled && !opexEnabled) missing.push('Selecione pelo menos uma natureza de custo (CAPEX/OPEX)');
    if (total !== 100) missing.push('Distribuicao CAPEX/OPEX deve totalizar 100%');

    ['capex', 'opex'].forEach((kind) => {
      const enabled = Boolean(root.find(kind === 'capex' ? '#gcc-cost-nature-capex' : '#gcc-cost-nature-opex').prop('checked'));
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
        if (!row.account) missing.push(`${label} - Conta Contabil`);
        if (!row.committed) missing.push(`${label} - Valor Comprometido`);
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
      cardData[`porcentagemCapexGCC___${i}`] = row.committed;
      cardData[`saldoCapexGCC___${i}`] = row.balance;
      cardData[`saldoAposCompromissoCapexGCC___${i}`] = row.balanceAfter;
    });

    opexRows.forEach((row, index) => {
      const i = index + 1;
      cardData[`centroCustoOpexGCC___${i}`] = row.centerCost;
      cardData[`contaContabilOpexGCC___${i}`] = row.account;
      cardData[`porcentagemOpexGCC___${i}`] = row.committed;
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

  loadCostCenterOptions: async function () {
    try {
      let rows = [];
      try {
        rows = await fluigService.getDatasetRows('dsGetCC_ReadView', {
          fields: ['CODCCUSTO', 'NOME']
        });
      } catch (error) {
        rows = await fluigService.getDataset('dsGetCC_ReadView');
      }

      this._state.costCenterOptions = this.normalizeCostCenterOptions(rows);
      this.syncAllocationCostCenterFilters();
    } catch (error) {
      console.error('[gccCostApproval] Erro ao carregar dsGetCC_ReadView:', error);
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

      map[code] = {
        CODCCUSTO: code,
        NOME: name
      };
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
      return {
        code: this.asText(byCode.CODCCUSTO),
        label: this.asText(byCode.NOME)
      };
    }

    const normalizedRaw = this.normalizeLookupText(raw);
    const byLabel = options.find((item) => this.normalizeLookupText(item && item.NOME) === normalizedRaw);
    if (byLabel) {
      return {
        code: this.asText(byLabel.CODCCUSTO),
        label: this.asText(byLabel.NOME)
      };
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

      row.off('input.gccCostCenterFallback');
      row.on('input.gccCostCenterFallback', '[data-field="center-cost-fallback"]', (event) => {
        const value = this.asText($(event.currentTarget).val());
        codeInput.val(value);
        labelInput.val(value);
        this.refreshFinancialImpact();
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
        this.refreshFinancialImpact();
      },
      onItemRemoved: () => {
        codeInput.val('');
        labelInput.val('');
        this.refreshFinancialImpact();
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

    row.off('input.gccCostCenterFallback');
  },

  syncAllocationCostCenterFilters: function () {
    const options = Array.isArray(this._state.costCenterOptions) ? this._state.costCenterOptions : [];
    const root = this.getContainer();

    root.find('.gcc-allocation-row').each((_, rowEl) => {
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

    this.refreshFinancialImpact();
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
