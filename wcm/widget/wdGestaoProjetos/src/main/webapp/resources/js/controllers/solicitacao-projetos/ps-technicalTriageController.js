const technicalTriageController = {
  _eventNamespace: '.technicalTriage',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _uiComponentsKey: 'gpUiComponents',
  _tabComponentsKey: 'gpApprovalTabComponents',
  _tabsRoot: null,
  _headerBackup: null,
  _toastTimer: null,

  _fields: [
    'documentid',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'patrocinadorNS',
    'prioridadeNS',
    'estadoProcesso',
    'anexosNS',

    // TITT
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
    'fornecedorRecomendadoTITT',
    'codfornTITT',
    'tipoContratacaoTITT',
    'justifExecucaoExtTITT',
    'anexosApoioTITT',
    'escopoProjClaroDetTITT',
    'estimativasCustoPrazoRegTITT',
    'anexosEssenciaisPresentesTITT',
    'decisaoExecucaoDocumentadaTITT',
    'riscosDependenciasMapeadosTITT'
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
    executionMode: '',
    supplierFilter: null,
    supplierOptions: [],
    pendingSupplierSync: null
  },

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();

    this._state.documentId = params && params.documentId ? String(params.documentId) : null;
    this._state.estadoProcesso = params && params.estadoProcesso ? String(params.estadoProcesso) : null;
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : null;

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.renderSidebarSkeleton();
        this.initializeTabs();
        this.bindEvents();
        this.ensureInitialRiskDependencyState();
        this.initializeSupplierTagFilter();
        this.renderAttachmentsList();
        this.updateCapacityLabel();
        this.toggleExternalSection();
        this.updateChecklistProgress();
        this.loadReadOnlyTab('solicitacao');
        this.loadBaseContext();
      })
      .fail((error) => {
        console.error('Technical triage template load error:', error);
        container.html('<div class="p-6 text-red-600">Falha ao carregar a tela de triagem técnica.</div>');
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
    this._state.attachments = [];
    this._state.executionMode = '';
    this._state.supplierFilter = null;
    this._state.supplierOptions = [];
    this._state.pendingSupplierSync = null;
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-technical-triage.html`;
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
      titleEl.text('TI - Triagem Técnica');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Triagem Técnica</span>
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

  initializeTabs: function () {
    const ui = this.getUiComponents();
    const tabsRoot = this.getContainer().find('[data-component="tabs"]').first();
    if (!ui || !ui.tabs || !tabsRoot.length) return;

    this.destroyTabs();
    this._tabsRoot = tabsRoot;

    ui.tabs.init(tabsRoot, {
      defaultTab: 'solicitacao',
      hideNoticeOnOpen: true,
      onChange: (tabName) => {
        this._state.currentTab = String(tabName || 'solicitacao');
        this.loadReadOnlyTab(this._state.currentTab);
      }
    });
  },

  destroyTabs: function () {
    const ui = this.getUiComponents();
    if (ui && ui.tabs && this._tabsRoot && this._tabsRoot.length) {
      ui.tabs.destroy(this._tabsRoot);
    }

    this._tabsRoot = null;
  },

  bindEvents: function () {
    const container = this.getContainer();
    const ns = this._eventNamespace;

    this.unbindEvents();

    container.on(`input${ns} change${ns}`, '#team-capacity-input', (event) => {
      this.updateCapacityLabel($(event.currentTarget).val());
    });

    container.on(`change${ns}`, 'input[name="execucao"]', () => {
      this.handleExecutionModeChange();
    });

    container.on(`dragover${ns}`, '#triage-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).addClass('border-bevap-green bg-green-50');
    });

    container.on(`dragleave${ns}`, '#triage-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('border-bevap-green bg-green-50');
    });

    container.on(`drop${ns}`, '#triage-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const dropzone = $(event.currentTarget);
      dropzone.removeClass('border-bevap-green bg-green-50');

      const files = event.originalEvent && event.originalEvent.dataTransfer
        ? event.originalEvent.dataTransfer.files
        : null;
      this.addAttachments(files);
    });

    container.on(`change${ns}`, '#triage-attachments-input', (event) => {
      const files = event.currentTarget && event.currentTarget.files ? event.currentTarget.files : null;
      this.addAttachments(files);
      try { event.currentTarget.value = ''; } catch (e) {}
    });

    container.on(`click${ns}`, '[data-action="remove-triage-attachment"]', (event) => {
      event.preventDefault();
      const attachmentId = String($(event.currentTarget).attr('data-attachment-id') || '').trim();
      if (!attachmentId) return;
      this.removeAttachment(attachmentId);
    });

    container.on(`click${ns}`, '[data-action="add-risk-matrix"]', (event) => {
      event.preventDefault();
      this.addRiskMatrixItem({});
    });

    container.on(`click${ns}`, '[data-action="remove-risk-matrix"]', (event) => {
      event.preventDefault();
      this.removeRiskMatrixItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="add-dependency"]', (event) => {
      event.preventDefault();
      this.addDependencyItem({});
    });

    container.on(`click${ns}`, '[data-action="remove-dependency"]', (event) => {
      event.preventDefault();
      this.removeDependencyItem(event.currentTarget);
    });

    container.on(`change${ns}`, '.triagem-checklist-item', () => {
      this.updateChecklistProgress();
    });

    container.on(`click${ns}`, '[data-action="save-draft"]', (event) => {
      event.preventDefault();
      this.saveDraft();
    });

    container.on(`click${ns}`, '[data-action="open-approve-modal"]', (event) => {
      event.preventDefault();
      this.openModal('approve-modal');
    });

    container.on(`click${ns}`, '[data-action="open-return-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-return');
    });

    container.on(`click${ns}`, '[data-action="open-reject-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-reject');
    });

    container.on(`click${ns}`, '[data-action="close-modal"]', (event) => {
      event.preventDefault();
      const modalId = String($(event.currentTarget).attr('data-modal-id') || '').trim();
      if (!modalId) return;
      this.closeModal(modalId);
    });

    container.on(`click${ns}`, '[data-action="confirm-approve"]', (event) => {
      event.preventDefault();
      this.handleTaskAction({
        modalId: 'approve-modal',
        choosedState: 29,
        successMessage: 'Triagem técnica concluída.'
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-return"]', (event) => {
      event.preventDefault();
      this.closeModal('modal-return');
      this.showToast('Ação não roteada', 'O fluxo atual não prevê devolução a partir da triagem técnica.', 'warning');
    });

    container.on(`click${ns}`, '[data-action="confirm-reject"]', (event) => {
      event.preventDefault();
      this.closeModal('modal-reject');
      this.showToast('Ação não roteada', 'O fluxo atual não prevê cancelamento a partir da triagem técnica.', 'warning');
    });

    container.on(`click${ns}`, '#approve-modal, #modal-return, #modal-reject', (event) => {
      if (event.target !== event.currentTarget) return;
      $(event.currentTarget).addClass('hidden');
    });
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
  },

  getReadOnlyTabConfig: function (tabName) {
    const configMap = {
      solicitacao: { key: 'solicitationHistory', mount: 'tab-solicitacao-history' },
      'analise-ti': { key: 'tiAnalysisHistory', mount: 'tab-analise-ti-history' },
      impacto: { key: 'areaImpactHistory', mount: 'tab-impacto-history' }
    };

    return configMap[tabName] || null;
  },

  loadReadOnlyTab: async function (tabName) {
    const config = this.getReadOnlyTabConfig(tabName);
    if (!config) return;

    const target = this.getContainer().find(`[data-component="${config.mount}"]`).first();
    if (!target.length) return;

    const components = this.getTabComponents();
    const component = components[config.key];

    if (this._state.historyCache[tabName]) {
      target.html(this._state.historyCache[tabName]);
      this.mountAttachmentsInTab(tabName, target, component);
      return;
    }

    if (!component || typeof component.render !== 'function') {
      target.html('<div class="text-sm text-red-600">Componente da aba indisponível.</div>');
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteúdo...</div>');

    try {
      const html = await component.render({ documentId: this._state.documentId });
      this._state.historyCache[tabName] = html;
      target.html(html);
      this.mountAttachmentsInTab(tabName, target, component);
    } catch (error) {
      console.error(`[technicalTriage] Error loading tab ${tabName}:`, error);
      target.html('<div class="text-sm text-red-600">Não foi possível carregar esta aba.</div>');
    }
  },

  mountAttachmentsInTab: function (tabName, tabRootEl, solicitationHistoryComponent) {
    if (String(tabName || '') !== 'solicitacao') return;

    if (solicitationHistoryComponent && typeof solicitationHistoryComponent.mountAttachments === 'function') {
      solicitationHistoryComponent.mountAttachments(tabRootEl, { documentId: this._state.documentId });
      return;
    }

    const ui = this.getUiComponents();
    if (!ui || !ui.attachments || typeof ui.attachments.render !== 'function') return;

    const $root = $(tabRootEl);
    if (!$root.length) return;

    $root.find('[data-gp-attachments]').each((_, el) => {
      const $el = $(el);
      if ($el.data('gpAttachmentsMounted')) return;
      $el.data('gpAttachmentsMounted', true);

      const fieldName = String($el.attr('data-field') || 'anexosNS').trim() || 'anexosNS';
      ui.attachments.render($el, {
        documentId: this._state.documentId,
        fieldName: fieldName
      });
    });
  },

  loadBaseContext: async function () {
    if (!this._state.documentId) {
      this.showToast('Sem solicitação', 'Nenhum documentId foi informado para esta rota.', 'warning');
      return;
    }

    try {
      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields: this._fields,
        filters: { documentid: this._state.documentId }
      });

      const row = rows && rows.length ? rows[0] : null;
      this._state.baseRow = row;

      if (!row) {
        this.renderSidebarSkeleton();
        return;
      }

      this.fillFieldsFromRow(row);
      this.renderSidebarFromRow(row);
      this.updateApproveModalProject(row);
    } catch (error) {
      console.error('[technicalTriage] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Não foi possível carregar os dados principais da solicitação.', 'error');
    }
  },

  renderSidebarSkeleton: function () {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    const progressTarget = container.find('[data-component="progress-status"]').first();

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: 'N/A',
      title: 'N/A',
      requester: 'N/A',
      area: 'N/A',
      sponsor: 'N/A',
      attachmentsCount: 0,
      priority: { label: 'N/A', iconClass: 'fa-solid fa-star', badgeClasses: 'bg-gray-100 text-gray-800' },
      status: { label: 'N/A', iconClass: 'fa-solid fa-clock', badgeClasses: 'bg-gray-100 text-gray-800' }
    });

    ui.sidebar.renderProgress(progressTarget, { items: this.getProgressItems() });
  },

  renderSidebarFromRow: function (row) {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    const progressTarget = container.find('[data-component="progress-status"]').first();

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: this.asText(row.documentid) || 'N/A',
      title: this.asText(row.titulodoprojetoNS) || 'N/A',
      requester: 'N/A',
      area: this.asText(row.areaUnidadeNS) || 'N/A',
      sponsor: this.asText(row.patrocinadorNS) || 'N/A',
      attachmentsCount: this.countAttachments(row.anexosNS),
      priority: {
        label: this.getPriorityLabel(row.prioridadeNS) || 'N/A',
        iconClass: 'fa-solid fa-star',
        badgeClasses: this.getPriorityBadgeClasses(row.prioridadeNS)
      },
      status: {
        label: this.getEstadoProcessoLabel(row.estadoProcesso) || 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-blue-100 text-blue-800'
      }
    });

    ui.sidebar.renderProgress(progressTarget, { items: this.getProgressItems() });
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitação aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Análise TI concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Impacto na área concluído', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Triagem técnica em andamento', iconClass: 'fa-solid fa-clock' }
    ];
  },

  updateApproveModalProject: function (row) {
    const label = this.getContainer().find('#approve-project-label');
    if (!label.length) return;

    const documentId = this.asText(row && row.documentid);
    const title = this.asText(row && row.titulodoprojetoNS);
    const parts = [];

    if (documentId) parts.push(documentId);
    if (title) parts.push(title);

    label.text(parts.length ? parts.join(' - ') : 'Projeto selecionado');
  },

  parseTableJson: function (value) {
    if (Array.isArray(value)) return value;

    const text = this.asText(value);
    if (!text || text === 'null') return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  parseBooleanLike: function (value) {
    if (value === true) return true;
    if (value === false) return false;

    const normalized = this.asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!normalized) return null;
    if (['1', 'true', 'sim', 's', 'yes', 'on'].indexOf(normalized) >= 0) return true;
    if (['0', 'false', 'nao', 'n', 'no', 'off'].indexOf(normalized) >= 0) return false;
    return null;
  },

  fillFieldsFromRow: function (row) {
    const root = this.getContainer();

    const execucao = this.asText(row.execucaoProjetoTITT);
    if (execucao) {
      root.find('input[name="execucao"]').prop('checked', false).filter((_, el) => {
        return this.asText($(el).val()) === execucao;
      }).first().prop('checked', true);
    }
    this._state.executionMode = execucao;

    root.find('#motivo-categoria').val(this.asText(row.motivoDecisaoCategoriaTITT));
    root.find('#motivo-descricao').val(this.asText(row.motivoDecisaoDescricaoTITT));

    const capValue = this.asText(row.disponibilidadedaEquipeTITT);
    if (capValue) {
      root.find('#team-capacity-input').val(capValue);
    }
    this.updateCapacityLabel(capValue);

    root.find('#desired-start-date').val(this.asText(row.dataDesejadaInicioTITT));

    root.find('#external-supplier').val(this.asText(row.fornecedorRecomendadoTITT));
    root.find('#external-supplier-code').val(this.asText(row.codfornTITT));
    root.find('#external-contract-type').val(this.asText(row.tipoContratacaoTITT));
    root.find('#external-justification').val(this.asText(row.justifExecucaoExtTITT));

    this.requestSupplierSyncFromHidden();

    this._state.attachments = this.parsePersistedAttachments(row.anexosApoioTITT);
    this.renderAttachmentsList();

    const setCheck = (selector, value) => {
      const el = root.find(selector).first();
      if (!el.length) return;
      el.prop('checked', this.parseBooleanLike(value) === true);
    };

    setCheck('#check-scope', row.escopoProjClaroDetTITT);
    setCheck('#check-estimates', row.estimativasCustoPrazoRegTITT);
    setCheck('#check-essential-attachments', row.anexosEssenciaisPresentesTITT);
    setCheck('#check-decision-documented', row.decisaoExecucaoDocumentadaTITT);
    setCheck('#check-risks-mapped', row.riscosDependenciasMapeadosTITT);

    this.renderRiskMatrixFromRow(row.tblRiscosIdentificadosTITT || row['tblRiscosIdentificadosTITT']);
    this.renderDependenciesFromRow(row.tblDependenciasTITT || row['tblDependenciasTITT']);

    this.toggleExternalSection();
    this.updateChecklistProgress();
  },

  ensureInitialRiskDependencyState: function () {
    const riskEmpty = this.getContainer().find('#risk-matrix-empty');
    const depEmpty = this.getContainer().find('#dependencies-empty');

    if (riskEmpty.length) riskEmpty.removeClass('hidden');
    if (depEmpty.length) depEmpty.removeClass('hidden');
  },

  renderRiskMatrixFromRow: function (tblValue) {
    const list = this.getContainer().find('#risk-matrix-list');
    const empty = this.getContainer().find('#risk-matrix-empty');
    if (!list.length) return;

    const rows = this.parseTableJson(tblValue);
    list.empty();

    const risks = rows.map((item) => {
      return {
        title: this.asText(item && item.tituloRiscoTITT),
        description: this.asText(item && item.descricaoRiscoTITT),
        mitigation: this.asText(item && item.mitigacaoRiscoTITT),
        level: this.asText(item && item.nivelRiscoTITT),
        impact: this.asText(item && item.impactoRiscoTITT),
        probability: this.asText(item && item.probabilidadeRiscoTITT)
      };
    }).filter((item) => {
      return item.title || item.description || item.mitigation || item.level || item.impact || item.probability;
    });

    if (risks.length) {
      risks.forEach((risk) => this.addRiskMatrixItem(risk));
      if (empty.length) empty.addClass('hidden');
    } else {
      if (empty.length) empty.removeClass('hidden');
    }
  },

  renderDependenciesFromRow: function (tblValue) {
    const list = this.getContainer().find('#dependencies-list');
    const empty = this.getContainer().find('#dependencies-empty');
    if (!list.length) return;

    const rows = this.parseTableJson(tblValue);
    list.empty();

    const deps = rows.map((item) => {
      return {
        title: this.asText(item && item.tituloDependenciaTITT),
        status: this.asText(item && item.statusDependenciaTITT),
        owner: this.asText(item && item.responsavelDependenciaTITT),
        mitigation: this.asText(item && item.mitigacaoDependenciaTITT)
      };
    }).filter((item) => {
      return item.title || item.status || item.owner || item.mitigation;
    });

    if (deps.length) {
      deps.forEach((dep) => this.addDependencyItem(dep));
      if (empty.length) empty.addClass('hidden');
    } else {
      if (empty.length) empty.removeClass('hidden');
    }
  },

  addRiskMatrixItem: function (data) {
    const list = this.getContainer().find('#risk-matrix-list');
    const empty = this.getContainer().find('#risk-matrix-empty');
    if (!list.length) return;

    const title = this.escapeHtml(this.asText(data && data.title));
    const description = this.escapeHtml(this.asText(data && data.description));
    const mitigation = this.escapeHtml(this.asText(data && data.mitigation));
    const level = this.asText(data && data.level);
    const impact = this.asText(data && data.impact);
    const probability = this.asText(data && data.probability);

    const html = `
      <div class="titt-risk-item border border-gray-200 rounded-lg p-4 bg-white">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 mb-1">Título</label>
            <input type="text" data-field="risk-title" value="${title}" placeholder="Ex: Integração SSO com legado" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm" />
          </div>

          <div class="w-full md:w-48">
            <label class="block text-xs font-medium text-gray-600 mb-1">Nível do Risco</label>
            <select data-field="risk-level" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm">
              <option value="">Selecione</option>
              <option value="Baixo">Baixo</option>
              <option value="Médio">Médio</option>
              <option value="Alto">Alto</option>
            </select>
          </div>

          <div class="flex md:items-end md:pb-0 pt-1">
            <button type="button" data-action="remove-risk-matrix" class="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors" title="Remover risco">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div class="hidden">
            <label class="block text-xs font-medium text-gray-600 mb-1">Probabilidade</label>
            <select data-field="risk-probability" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div class="hidden">
            <label class="block text-xs font-medium text-gray-600 mb-1">Impacto</label>
            <select data-field="risk-impact" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="Baixo">Baixo</option>
              <option value="Médio">Médio</option>
              <option value="Alto">Alto</option>
            </select>
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
          <textarea rows="2" data-field="risk-description" placeholder="Descreva o risco identificado..." class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent transition-all resize-none text-sm">${description}</textarea>
        </div>

        <div class="mt-4">
          <label class="block text-xs font-medium text-gray-600 mb-1">Mitigação</label>
          <textarea rows="2" data-field="risk-mitigation" placeholder="Descreva a estratégia de mitigação..." class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent transition-all resize-none text-sm">${mitigation}</textarea>
        </div>
      </div>
    `;

    list.append(html);

    const $item = list.find('.titt-risk-item').last();
    $item.find('[data-field="risk-level"]').val(level);
    $item.find('[data-field="risk-impact"]').val(impact || 'Médio');
    $item.find('[data-field="risk-probability"]').val(probability || 'Média');

    if (empty.length) empty.addClass('hidden');
  },

  removeRiskMatrixItem: function (target) {
    const item = $(target).closest('.titt-risk-item');
    if (!item.length) return;
    item.remove();

    const list = this.getContainer().find('#risk-matrix-list');
    const empty = this.getContainer().find('#risk-matrix-empty');
    if (list.length && empty.length) {
      empty.toggleClass('hidden', list.find('.titt-risk-item').length > 0);
    }
  },

  addDependencyItem: function (data) {
    const list = this.getContainer().find('#dependencies-list');
    const empty = this.getContainer().find('#dependencies-empty');
    if (!list.length) return;

    const title = this.escapeHtml(this.asText(data && data.title));
    const status = this.asText(data && data.status);
    const owner = this.escapeHtml(this.asText(data && data.owner));
    const mitigation = this.escapeHtml(this.asText(data && data.mitigation));

    const html = `
      <div class="titt-dependency-item border border-gray-200 rounded-lg p-4 bg-white">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 mb-1">Título</label>
            <input type="text" data-field="dep-title" value="${title}" placeholder="Ex: Homologação Segurança" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm" />
          </div>

          <div class="w-full md:w-48">
            <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select data-field="dep-status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm">
              <option value="">Selecione</option>
              <option value="Pendente">Pendente</option>
              <option value="Bloqueada">Bloqueada</option>
              <option value="Concluída">Concluída</option>
            </select>
          </div>

          <div class="flex md:items-end pt-1">
            <button type="button" data-action="remove-dependency" class="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors" title="Remover dependência">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Responsável</label>
            <input type="text" data-field="dep-owner" value="${owner}" placeholder="Ex: TI Infraestrutura" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent text-sm" />
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-xs font-medium text-gray-600 mb-1">Mitigação</label>
          <textarea rows="2" data-field="dep-mitigation" placeholder="Descreva a estratégia de mitigação..." class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent transition-all resize-none text-sm">${mitigation}</textarea>
        </div>
      </div>
    `;

    list.append(html);

    const $item = list.find('.titt-dependency-item').last();
    $item.find('[data-field="dep-status"]').val(status);

    if (empty.length) empty.addClass('hidden');
  },

  removeDependencyItem: function (target) {
    const item = $(target).closest('.titt-dependency-item');
    if (!item.length) return;
    item.remove();

    const list = this.getContainer().find('#dependencies-list');
    const empty = this.getContainer().find('#dependencies-empty');
    if (list.length && empty.length) {
      empty.toggleClass('hidden', list.find('.titt-dependency-item').length > 0);
    }
  },

  handleExecutionModeChange: function () {
    const root = this.getContainer();
    const nextMode = this.asText(root.find('input[name="execucao"]:checked').val());
    const previousMode = this.asText(this._state.executionMode);

    this._state.executionMode = nextMode;

    if (previousMode === 'externo' && nextMode === 'interno') {
      this.clearExternalOnlyFields();
    }

    this.toggleExternalSection();
  },

  // --- Fornecedor (TagInputFilter) ---
  initializeSupplierTagFilter: function () {
    const container = this.getContainer();
    const mount = container.find('#fornecedor-tag-filter').get(0);
    if (!mount) return;

    if (typeof TagInputFilter === 'undefined') {
      console.warn('[technicalTriage] TagInputFilter nao encontrado. Verifique application.info');
      return;
    }

    // Garante que o container tenha um id (usado internamente no componente).
    if (!mount.id) {
      mount.id = 'fornecedor-tag-filter';
    }

    this._state.supplierFilter = new TagInputFilter('#fornecedor-tag-filter', {
      placeholder: 'Selecione...',
      data: [],
      labelField: 'nomeFantasia',
      valueField: 'codforn',
      columns: [
        { header: 'Codigo', field: 'codforn', width: 'w-1/3' },
        { header: 'Fornecedor', field: 'nomeFantasia', width: 'w-2/3' }
      ],
      singleSelection: true,
      onItemAdded: (item) => {
        this.applySupplierSelection(item);
      },
      onItemRemoved: () => {
        this.clearSupplierSelection();
      }
    });

    this.loadSupplierOptions()
      .then((rows) => {
        this._state.supplierOptions = rows;
        if (this._state.supplierFilter && typeof this._state.supplierFilter.updateData === 'function') {
          this._state.supplierFilter.updateData(rows);
        }
        this.requestSupplierSyncFromHidden();
      })
      .catch((error) => {
        console.error('[technicalTriage] Erro carregando ds_RM_fornecedores:', error);
      });
  },

  loadSupplierOptions: async function () {
    let rows = [];
    try {
      rows = await fluigService.getDatasetRows('ds_RM_fornecedores');
    } catch (error) {
      // Em alguns contextos do WCM/portal o DatasetFactory não está disponível.
      rows = await fluigService.getDataset('ds_RM_fornecedores');
    }

    const mapped = (rows || []).map((row) => {
      const cod = this.asText(row && (row.codforn || row.CODFORN || row.CodForn || row.CODCFO));
      const nome = this.asText(row && (row.nomeFantasia || row.nomefantasia || row.NOMEFANTASIA || row.NomeFantasia));
      if (!cod || !nome) return null;
      return {
        codforn: cod,
        nomeFantasia: nome
      };
    }).filter(Boolean);

    // Remove duplicados por código.
    const seen = new Set();
    return mapped.filter((item) => {
      if (seen.has(item.codforn)) return false;
      seen.add(item.codforn);
      return true;
    });
  },

  applySupplierSelection: function (item) {
    const root = this.getContainer();
    const cod = this.asText(item && (item.codforn || item.CODFORN));
    const nome = this.asText(item && (item.nomeFantasia || item.nomefantasia || item.NOMEFANTASIA));

    root.find('#external-supplier').val(nome);
    root.find('#external-supplier-code').val(cod);
  },

  clearSupplierSelection: function () {
    const root = this.getContainer();
    root.find('#external-supplier').val('');
    root.find('#external-supplier-code').val('');
  },

  requestSupplierSyncFromHidden: function () {
    const root = this.getContainer();
    const cod = this.asText(root.find('#external-supplier-code').val());
    const nome = this.asText(root.find('#external-supplier').val());

    if (!cod) {
      if (this._state.supplierFilter && typeof this._state.supplierFilter.removeAll === 'function') {
        this._state.supplierFilter.removeAll();
      }
      return;
    }

    this._state.pendingSupplierSync = { codforn: cod, nomeFantasia: nome };
    this.syncSupplierFilterFromPending();
  },

  syncSupplierFilterFromPending: function () {
    const filter = this._state.supplierFilter;
    const pending = this._state.pendingSupplierSync;
    if (!filter || !pending) return;
    if (!Array.isArray(this._state.supplierOptions) || !this._state.supplierOptions.length) return;

    const found = this._state.supplierOptions.find((row) => this.asText(row && row.codforn) === this.asText(pending.codforn));
    const label = this.asText(pending.nomeFantasia) || this.asText(found && (found.nomeFantasia || found.nomefantasia));
    const value = this.asText(pending.codforn);
    if (!label || !value) return;

    if (typeof filter.setSelectedItems === 'function') {
      filter.setSelectedItems([{ value: value, label: label }]);
    }
  },

  clearExternalOnlyFields: function () {
    const root = this.getContainer();

    root.find('#external-supplier').val('');
    root.find('#external-supplier-code').val('');
    root.find('#external-contract-type').val('');
    root.find('#external-justification').val('');

    if (this._state.supplierFilter && typeof this._state.supplierFilter.removeAll === 'function') {
      this._state.supplierFilter.removeAll();
    }

    const keepPersisted = Array.isArray(this._state.attachments)
      ? this._state.attachments.filter((att) => att && att.persisted)
      : [];

    this._state.attachments = keepPersisted;
    this.renderAttachmentsList();

    const inputEl = root.find('#triage-attachments-input').get(0);
    if (inputEl) {
      try { inputEl.value = ''; } catch (e) {}
    }
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
    const list = this.getContainer().find('#triage-attachments-list').first();
    if (!list.length) return;

    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    if (!items.length) {
      list.html('<div class="text-sm text-gray-500">Nenhum anexo selecionado.</div>');
      return;
    }

    list.html(items.map((att) => {
      const safeName = this.escapeHtml(att.file ? (att.file.name || '') : (att.fileName || 'arquivo'));
      const sizeLabel = att.file
        ? this.escapeHtml(this.formatAttachmentSize(att.file.size || 0))
        : this.escapeHtml(this.asText(att.fileSize));

      const iconClass = this.escapeHtml(this.getAttachmentIconClass(att.file ? att.file.name : att.fileName));
      const canRemove = !att.persisted;
      const removeBtn = canRemove
        ? `<button data-action="remove-triage-attachment" data-attachment-id="${this.escapeHtml(att.id)}" class="text-red-500 hover:text-red-700" title="Remover">
             <i class="fa-solid fa-trash"></i>
           </button>`
        : `<button disabled aria-disabled="true" class="text-red-500 opacity-30 cursor-not-allowed" title="Anexo já salvo">
             <i class="fa-solid fa-lock"></i>
           </button>`;

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid ${iconClass} text-xl mr-3"></i>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 truncate">${safeName}</div>
              <div class="text-xs text-gray-500">${sizeLabel || ''}</div>
            </div>
          </div>
          ${removeBtn}
        </div>
      `;
    }).join(''));
  },

  addAttachments: function (fileList) {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;

    const current = Array.isArray(this._state.attachments) ? this._state.attachments.slice() : [];
    files.forEach((file) => {
      const id = `local:${Date.now()}:${Math.random().toString(16).slice(2)}`;
      current.push({
        id: id,
        file: file,
        persisted: false
      });
    });

    this._state.attachments = current;
    this.renderAttachmentsList();
  },

  removeAttachment: function (id) {
    const current = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    const next = current.filter((att) => String(att && att.id) !== String(id));
    this._state.attachments = next;
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

  updateCapacityLabel: function (value) {
    const root = this.getContainer();
    const input = root.find('#team-capacity-input').first();
    const display = root.find('#team-capacity-value').first();
    if (!input.length || !display.length) return;

    const finalValue = value === null || value === undefined || value === '' ? String(input.val() || '0') : String(value);
    display.text(`${finalValue}%`);
  },

  toggleExternalSection: function () {
    const root = this.getContainer();
    const external = root.find('#external-section').first();
    if (!external.length) return;

    const value = this.asText(root.find('input[name="execucao"]:checked').val());
    if (value === 'externo') {
      external.removeClass('hidden');
    } else {
      external.addClass('hidden');
    }
  },

  updateChecklistProgress: function () {
    const root = this.getContainer().find('#tab-content-checklist');
    if (!root.length) return;

    const items = root.find('.triagem-checklist-item');
    const checked = items.filter(':checked').length;
    const percentage = items.length ? Math.round((checked / items.length) * 100) : 0;

    this.getContainer().find('#triagem-checklist-percentage').text(`${percentage}%`);
    this.getContainer().find('#triagem-checklist-progress').css('width', `${percentage}%`);
  },

  getBooleanFieldValue: function (selector) {
    return this.getContainer().find(selector).is(':checked') ? 'true' : 'false';
  },

  // --- Validação obrigatórios ---
  getField: function (selectorOrName) {
    const container = this.getContainer();
    const field = container.find(`#${selectorOrName}, [name="${selectorOrName}"]`).first();
    return field.length ? field : null;
  },

  isFieldFilled: function (field) {
    if (!field || !field.length) return false;

    const type = String(field.attr('type') || '').toLowerCase();

    if (type === 'checkbox') return field.is(':checked');

    if (type === 'radio') {
      const name = field.attr('name');
      if (!name) return field.is(':checked');
      return this.getContainer().find(`input[name="${name}"]:checked`).length > 0;
    }

    return String(field.val() || '').trim() !== '';
  },

  validateTriage: function () {
    const root = this.getContainer();
    const execucao = this.asText(root.find('input[name="execucao"]:checked').val());

    const missing = [];

    // Base obrigatórios (marcados com *)
    if (!execucao) missing.push('Execução do Projeto');
    if (!this.isFieldFilled(this.getField('motivo-categoria'))) missing.push('Motivo da Decisão - Categoria');
    if (!this.isFieldFilled(this.getField('motivo-descricao'))) missing.push('Motivo da Decisão - Descrição');
    if (!this.isFieldFilled(this.getField('desired-start-date'))) missing.push('Data Desejada de Início');

    // Condicional: execução externa
    if (execucao === 'externo') {
      const codForn = this.asText(root.find('#external-supplier-code').val());
      if (!codForn) missing.push('Fornecedor Recomendado');
      if (!this.isFieldFilled(this.getField('external-contract-type'))) missing.push('Tipo de Contratação');
      if (!this.isFieldFilled(this.getField('external-justification'))) missing.push('Justificativa para Execução Externa');
    }

    return missing;
  },

  collectTriageTaskFields: function () {
    const root = this.getContainer();

    const cardData = {
      execucaoProjetoTITT: this.asText(root.find('input[name="execucao"]:checked').val()),
      motivoDecisaoCategoriaTITT: this.asText(root.find('#motivo-categoria').val()),
      motivoDecisaoDescricaoTITT: this.asText(root.find('#motivo-descricao').val()),
      disponibilidadedaEquipeTITT: this.asText(root.find('#team-capacity-input').val()),
      dataDesejadaInicioTITT: this.asText(root.find('#desired-start-date').val()),
      fornecedorRecomendadoTITT: this.asText(root.find('#external-supplier').val()),
      codfornTITT: this.asText(root.find('#external-supplier-code').val()),
      tipoContratacaoTITT: this.asText(root.find('#external-contract-type').val()),
      justifExecucaoExtTITT: this.asText(root.find('#external-justification').val()),
      escopoProjClaroDetTITT: this.getBooleanFieldValue('#check-scope'),
      estimativasCustoPrazoRegTITT: this.getBooleanFieldValue('#check-estimates'),
      anexosEssenciaisPresentesTITT: this.getBooleanFieldValue('#check-essential-attachments'),
      decisaoExecucaoDocumentadaTITT: this.getBooleanFieldValue('#check-decision-documented'),
      riscosDependenciasMapeadosTITT: this.getBooleanFieldValue('#check-risks-mapped')
    };

    const risks = root.find('#risk-matrix-list .titt-risk-item').map((_, el) => {
      const $el = $(el);
      return {
        title: this.asText($el.find('[data-field="risk-title"]').val()),
        description: this.asText($el.find('[data-field="risk-description"]').val()),
        mitigation: this.asText($el.find('[data-field="risk-mitigation"]').val()),
        level: this.asText($el.find('[data-field="risk-level"]').val()),
        impact: this.asText($el.find('[data-field="risk-impact"]').val()),
        probability: this.asText($el.find('[data-field="risk-probability"]').val())
      };
    }).get().filter((item) => {
      return item.title || item.description || item.mitigation || item.level || item.impact || item.probability;
    });

    risks.forEach((risk, index) => {
      const i = index + 1;
      cardData[`tituloRiscoTITT___${i}`] = risk.title;
      cardData[`descricaoRiscoTITT___${i}`] = risk.description;
      cardData[`mitigacaoRiscoTITT___${i}`] = risk.mitigation;
      cardData[`nivelRiscoTITT___${i}`] = risk.level;
      cardData[`impactoRiscoTITT___${i}`] = risk.impact;
      cardData[`probabilidadeRiscoTITT___${i}`] = risk.probability;
    });

    const dependencies = root.find('#dependencies-list .titt-dependency-item').map((_, el) => {
      const $el = $(el);
      return {
        title: this.asText($el.find('[data-field="dep-title"]').val()),
        status: this.asText($el.find('[data-field="dep-status"]').val()),
        owner: this.asText($el.find('[data-field="dep-owner"]').val()),
        mitigation: this.asText($el.find('[data-field="dep-mitigation"]').val())
      };
    }).get().filter((item) => {
      return item.title || item.status || item.owner || item.mitigation;
    });

    dependencies.forEach((dep, index) => {
      const i = index + 1;
      cardData[`tituloDependenciaTITT___${i}`] = dep.title;
      cardData[`statusDependenciaTITT___${i}`] = dep.status;
      cardData[`responsavelDependenciaTITT___${i}`] = dep.owner;
      cardData[`mitigacaoDependenciaTITT___${i}`] = dep.mitigation;
    });

    return Object.keys(cardData).map((fieldName) => {
      return { name: fieldName, value: cardData[fieldName] };
    });
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho da triagem...');
      await this.waitForUiPaint();
      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        taskFields: this.collectTriageTaskFields()
      });
      this.showToast('Rascunho salvo', 'As alterações foram salvas com sucesso.', 'success');
    } catch (error) {
      console.error('[technicalTriage] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Não foi possível salvar o rascunho.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
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

  handleTaskAction: async function (config) {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Preparando dados da etapa...');
      await this.waitForUiPaint();

      const missing = this.validateTriage();
      if (missing && missing.length) {
        this.closeModal(config && config.modalId);
        this.showToast('Campos obrigatórios', `Preencha: ${missing.join(' | ')}`, 'warning');
        const tabBtn = this.getContainer().find('#tab-decisao').first();
        if (tabBtn.length) tabBtn.trigger('click');
        return;
      }

      const processInstanceId = await this.resolveProcessInstanceId();
      const choosedState = config && config.choosedState !== null && config.choosedState !== undefined
        ? String(config.choosedState).trim()
        : '';

      if (!choosedState) {
        throw new Error('Numero da atividade destino e obrigatorio');
      }
      const taskFields = this.collectTriageTaskFields();
      const attachments = await this.collectAttachmentsPayload();

      loading.updateMessage('Enviando movimentação para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: choosedState,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos',
        attachments: attachments
      }, taskFields);

      this.closeModal(config.modalId);
      this.showToast('Sucesso', config.successMessage, 'success');

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[technicalTriage] Error moving task:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Não foi possível movimentar a solicitação.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  openModal: function (modalId) {
    const modal = this.getContainer().find(`#${modalId}`);
    if (!modal.length) return;
    modal.removeClass('hidden');
  },

  closeModal: function (modalId) {
    const modal = this.getContainer().find(`#${modalId}`);
    if (!modal.length) return;
    modal.addClass('hidden');
  },

  showToast: function (title, message, type) {
    const toast = this.getContainer().find('#toast');
    const icon = this.getContainer().find('#toast-icon');
    const toastTitle = this.getContainer().find('#toast-title');
    const toastMessage = this.getContainer().find('#toast-message');
    if (!toast.length || !icon.length || !toastTitle.length || !toastMessage.length) return;

    const config = {
      success: { icon: 'fa-solid fa-check-circle text-bevap-green', border: 'border-bevap-green' },
      error: { icon: 'fa-solid fa-times-circle text-red-500', border: 'border-red-500' },
      warning: { icon: 'fa-solid fa-exclamation-triangle text-bevap-gold', border: 'border-bevap-gold' },
      info: { icon: 'fa-solid fa-info-circle text-blue-500', border: 'border-blue-500' }
    };
    const finalType = config[type] ? type : 'info';

    icon.attr('class', `${config[finalType].icon} text-2xl mr-3`);
    toast.attr('class', `fixed top-20 right-4 bg-white rounded-lg shadow-xl border-l-4 p-4 z-50 max-w-md ${config[finalType].border}`);
    toastTitle.text(title || 'Informação');
    toastMessage.text(message || '');
    toast.removeClass('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
      this._toastTimer = null;
    }, 3000);
  },

  createActionLoading: function () {
    if (typeof modalLoadingService !== 'undefined' && modalLoadingService.show) {
      return modalLoadingService.show({
        title: 'Movendo solicitação',
        message: 'Aguarde enquanto a tarefa é enviada ao Fluig...'
      });
    }

    const legacyLoading = FLUIGC.loading(this.getContainer());
    legacyLoading.show();

    return {
      hide: function () {
        legacyLoading.hide();
      },
      updateMessage: function () {}
    };
  },

  waitForUiPaint: function () {
    return new Promise((resolve) => {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          setTimeout(resolve, 0);
        });
        return;
      }

      setTimeout(resolve, 0);
    });
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
