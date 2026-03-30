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
    'tblRiscosIdentificadosTITT.planoBRiscoTITT',
    'tblRiscosIdentificadosTITT.nivelRiscoTITT',
    'tblRiscosIdentificadosTITT.impactoRiscoTITT',
    'tblRiscosIdentificadosTITT.probabilidadeRiscoTITT',
    'tblDependenciasTITT.tituloDependenciaTITT',
    'tblDependenciasTITT.statusDependenciaTITT',
    'tblDependenciasTITT.responsavelDependenciaTITT',
    'tblDependenciasTITT.mitigacaoDependenciaTITT',
    'tblDependenciasTITT.planoBDependenciaTITT',
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

    container.on(`click${ns}`, '[data-action="confirm-risk-matrix"]', (event) => {
      event.preventDefault();
      this.confirmRiskMatrixItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="edit-risk-matrix"]', (event) => {
      event.preventDefault();
      this.editRiskMatrixItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="add-dependency"]', (event) => {
      event.preventDefault();
      this.addDependencyItem({});
    });

    container.on(`click${ns}`, '[data-action="remove-dependency"]', (event) => {
      event.preventDefault();
      this.removeDependencyItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="confirm-dependency"]', (event) => {
      event.preventDefault();
      this.confirmDependencyItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="edit-dependency"]', (event) => {
      event.preventDefault();
      this.editDependencyItem(event.currentTarget);
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
    if (!list.length) return;

    const rows = this.parseTableJson(tblValue);
    list.empty();

    const risks = rows.map((item) => {
      return {
        title: this.asText(item && item.tituloRiscoTITT),
        description: this.asText(item && item.descricaoRiscoTITT),
        mitigation: this.asText(item && item.mitigacaoRiscoTITT),
        fallback: this.asText(item && item.planoBRiscoTITT),
        level: this.asText(item && item.nivelRiscoTITT),
        impact: this.asText(item && item.impactoRiscoTITT),
        probability: this.asText(item && item.probabilidadeRiscoTITT),
        confirmed: true
      };
    }).filter((item) => {
      return item.title || item.description || item.mitigation || item.fallback || item.level || item.impact || item.probability;
    });

    if (!risks.length) {
      this.updateRiskEmptyState();
      return;
    }

    risks.forEach((risk) => this.addRiskMatrixItem(risk));
    this.updateRiskEmptyState();
  },

  updateRiskEmptyState: function () {
    const root = this.getContainer();
    const empty = root.find('#risk-matrix-empty');
    if (!empty.length) return;
    const any = root.find('#risk-matrix-list .titt-risk-item').length > 0;
    empty.toggleClass('hidden', any);
  },

  renderDependenciesFromRow: function (tblValue) {
    const list = this.getContainer().find('#dependencies-list');
    if (!list.length) return;

    const rows = this.parseTableJson(tblValue);
    list.empty();

    const deps = rows.map((item) => {
      return {
        title: this.asText(item && item.tituloDependenciaTITT),
        status: this.asText(item && item.statusDependenciaTITT),
        owner: this.asText(item && item.responsavelDependenciaTITT),
        mitigation: this.asText(item && item.mitigacaoDependenciaTITT),
        fallback: this.asText(item && item.planoBDependenciaTITT),
        confirmed: true
      };
    }).filter((item) => {
      return item.title || item.status || item.owner || item.mitigation || item.fallback;
    });

    if (!deps.length) {
      this.updateDependencyEmptyState();
      return;
    }

    deps.forEach((dep) => this.addDependencyItem(dep));
    this.updateDependencyEmptyState();
  },

  addRiskMatrixItem: function (data) {
    const list = this.getContainer().find('#risk-matrix-list');
    if (!list.length) return;

    const cardEl = document.createElement('div');
    cardEl.classList.add('titt-risk-item', 'risk-item');

    const confirmed = Boolean(data && data.confirmed);
    cardEl.setAttribute('data-confirmed', confirmed ? '1' : '0');
    cardEl.setAttribute('data-index', String(list.find('.titt-risk-item').length + 1));

    this.renderRiskCardShell(cardEl, {
      title: this.asText(data && data.title),
      description: this.asText(data && data.description),
      mitigation: this.asText(data && data.mitigation),
      fallback: this.asText(data && data.fallback),
      level: this.asText(data && data.level) || 'Alto',
      impact: this.asText(data && data.impact) || 'Alto',
      probability: this.asText(data && data.probability) || 'Alta'
    });

    if (confirmed) this.showRiskReadOnly(cardEl);
    else this.showRiskEdit(cardEl);

    list.append(cardEl);
    this.updateRiskEmptyState();
  },

  renderRiskCardShell: function (cardEl, data) {
    if (!cardEl) return;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;

    const idx = this.asText(el.getAttribute('data-index')) || '1';
    const title = this.escapeHtml(this.asText(data && data.title));
    const description = this.escapeHtml(this.asText(data && data.description));
    const mitigation = this.escapeHtml(this.asText(data && data.mitigation));
    const fallback = this.escapeHtml(this.asText(data && data.fallback));
    const level = this.escapeHtml(this.asText(data && data.level) || 'Alto');
    const impact = this.escapeHtml(this.asText(data && data.impact) || 'Alto');
    const probability = this.escapeHtml(this.asText(data && data.probability) || 'Alta');

    el.innerHTML = `
      <div class="risk-fields hidden">
        <input type="text" name="tituloRiscoTITT___${this.escapeHtml(idx)}" value="${title}" data-field="risk-title" />
        <input type="text" name="descricaoRiscoTITT___${this.escapeHtml(idx)}" value="${description}" data-field="risk-description" />
        <input type="text" name="mitigacaoRiscoTITT___${this.escapeHtml(idx)}" value="${mitigation}" data-field="risk-mitigation" />
        <input type="text" name="planoBRiscoTITT___${this.escapeHtml(idx)}" value="${fallback}" data-field="risk-fallback" />
        <input type="text" name="nivelRiscoTITT___${this.escapeHtml(idx)}" value="${level}" data-field="risk-level" />
        <input type="text" name="impactoRiscoTITT___${this.escapeHtml(idx)}" value="${impact}" data-field="risk-impact" />
        <input type="text" name="probabilidadeRiscoTITT___${this.escapeHtml(idx)}" value="${probability}" data-field="risk-probability" />
      </div>
      <div class="risk-edit"></div>
      <div class="risk-view"></div>
    `;

    this.setRiskCardData(el, {
      title: this.asText(data && data.title),
      description: this.asText(data && data.description),
      mitigation: this.asText(data && data.mitigation),
      fallback: this.asText(data && data.fallback),
      level: this.asText(data && data.level) || 'Alto',
      impact: this.asText(data && data.impact) || 'Alto',
      probability: this.asText(data && data.probability) || 'Alta'
    });
  },

  setRiskCardData: function (cardEl, data) {
    if (!cardEl) return;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el || !el.dataset) return;
    el.dataset.riskTitle = this.asText(data && data.title);
    el.dataset.riskDescription = this.asText(data && data.description);
    el.dataset.riskMitigation = this.asText(data && data.mitigation);
    el.dataset.riskFallback = this.asText(data && data.fallback);
    el.dataset.riskLevel = this.asText(data && data.level) || 'Alto';
    el.dataset.riskImpact = this.asText(data && data.impact) || 'Alto';
    el.dataset.riskProbability = this.asText(data && data.probability) || 'Alta';
  },

  syncRiskInputsFromDataset: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el || !el.dataset) return;
    const wrap = $(el).find('.risk-fields');
    if (!wrap.length) return;

    wrap.find('[name^="tituloRiscoTITT___"]').val(this.asText(el.dataset.riskTitle));
    wrap.find('[name^="descricaoRiscoTITT___"]').val(this.asText(el.dataset.riskDescription));
    wrap.find('[name^="mitigacaoRiscoTITT___"]').val(this.asText(el.dataset.riskMitigation));
    wrap.find('[name^="planoBRiscoTITT___"]').val(this.asText(el.dataset.riskFallback));
    wrap.find('[name^="nivelRiscoTITT___"]').val(this.asText(el.dataset.riskLevel));
    wrap.find('[name^="impactoRiscoTITT___"]').val(this.asText(el.dataset.riskImpact));
    wrap.find('[name^="probabilidadeRiscoTITT___"]').val(this.asText(el.dataset.riskProbability));
  },

  reindexRiskCards: function () {
    const list = this.getContainer().find('#risk-matrix-list');
    if (!list.length) return;

    list.find('.titt-risk-item').each((idx, el) => {
      const cardEl = el;
      const newIndex = String(idx + 1);
      cardEl.setAttribute('data-index', newIndex);

      const fields = $(cardEl).find('.risk-fields');
      if (!fields.length) return;

      const rename = (prefix) => {
        fields.find(`[name^="${prefix}___"]`).each((_, input) => {
          $(input).attr('name', `${prefix}___${newIndex}`);
        });
      };

      rename('tituloRiscoTITT');
      rename('descricaoRiscoTITT');
      rename('mitigacaoRiscoTITT');
      rename('planoBRiscoTITT');
      rename('nivelRiscoTITT');
      rename('impactoRiscoTITT');
      rename('probabilidadeRiscoTITT');
    });
  },

  getRiskVisual: function (level) {
    const normalized = (this.asText(level) || 'Alto').replace('Medio', 'Médio');

    if (normalized === 'Baixo') {
      return {
        card: 'border border-green-200 bg-green-50 rounded-lg p-4',
        title: 'text-green-900',
        badge: 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded',
        meta: 'text-xs text-green-800'
      };
    }

    if (normalized === 'Médio') {
      return {
        card: 'border border-yellow-200 bg-yellow-50 rounded-lg p-4',
        title: 'text-yellow-900',
        badge: 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded',
        meta: 'text-xs text-yellow-800'
      };
    }

    return {
      card: 'border border-red-200 bg-red-50 rounded-lg p-4',
      title: 'text-red-900',
      badge: 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded',
      meta: 'text-xs text-red-800'
    };
  },

  renderRiskReadOnlyCard: function (containerEl, cardEl) {
    const container = containerEl && containerEl.jquery ? containerEl.get(0) : containerEl;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!container || !el || !el.dataset) return;

    const title = this.asText(el.dataset.riskTitle);
    const description = this.asText(el.dataset.riskDescription);
    const mitigation = this.asText(el.dataset.riskMitigation);
    const fallback = this.asText(el.dataset.riskFallback);
    const level = (this.asText(el.dataset.riskLevel) || 'Alto').replace('Medio', 'Médio');
    const probability = (this.asText(el.dataset.riskProbability) || 'Alta').replace('Media', 'Média');
    const impact = (this.asText(el.dataset.riskImpact) || 'Alto').replace('Medio', 'Médio');
    const visual = this.getRiskVisual(level);

    el.className = `${visual.card} risk-item titt-risk-item`;
    container.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <h5 class="font-medium ${this.escapeHtml(visual.title)} break-all">${this.escapeHtml(title)}</h5>
        <span class="${this.escapeHtml(visual.badge)} shrink-0">${this.escapeHtml(level)}</span>
      </div>
      <div class="${this.escapeHtml(visual.meta)} break-all">Probabilidade: ${this.escapeHtml(probability)} | Impacto: ${this.escapeHtml(impact)}</div>
      ${description ? `<div class="text-sm text-gray-700 mt-2 break-all"><strong>Descricao:</strong> ${this.escapeHtml(description)}</div>` : ''}
      <div class="text-sm text-gray-700 mt-2 break-all"><strong>Mitigacao:</strong> ${this.escapeHtml(mitigation || 'Nao informado')}</div>
      <div class="text-sm text-gray-700 mt-2 break-all"><strong>Plano B:</strong> ${this.escapeHtml(fallback || 'Nao informado')}</div>
      <div class="flex justify-end items-center gap-2 mt-2">
        <button type="button" data-action="edit-risk-matrix" class="text-blue-500 hover:text-blue-700" title="Editar risco"><i class="fa-solid fa-pen"></i></button>
        <button type="button" data-action="remove-risk-matrix" class="text-red-400 hover:text-red-600" title="Remover risco"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  },

  renderRiskEditCard: function (containerEl, cardEl) {
    const container = containerEl && containerEl.jquery ? containerEl.get(0) : containerEl;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!container || !el || !el.dataset) return;

    el.className = 'border border-gray-200 rounded-lg p-4 bg-white risk-item titt-risk-item';

    const title = this.escapeHtml(this.asText(el.dataset.riskTitle));
    const description = this.escapeHtml(this.asText(el.dataset.riskDescription));
    const mitigation = this.escapeHtml(this.asText(el.dataset.riskMitigation));
    const fallback = this.escapeHtml(this.asText(el.dataset.riskFallback));
    const level = (this.asText(el.dataset.riskLevel) || 'Alto').replace('Medio', 'Médio');
    const probability = (this.asText(el.dataset.riskProbability) || 'Alta').replace('Media', 'Média');
    const impact = (this.asText(el.dataset.riskImpact) || 'Alto').replace('Medio', 'Médio');

    container.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <input data-field="risk-title" type="text" value="${title}" placeholder="Novo risco" class="font-medium text-bevap-navy bg-transparent border-none p-0 focus:outline-none w-full">
        <button type="button" data-action="remove-risk-matrix" class="text-red-400 hover:text-red-600" title="Remover risco"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="space-y-3 text-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="flex items-center gap-2">
            <span class="text-gray-600 min-w-[84px]">Nivel:</span>
            <select data-field="risk-level" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none">
              <option ${level === 'Baixo' ? 'selected' : ''}>Baixo</option>
              <option ${level === 'Médio' ? 'selected' : ''}>Médio</option>
              <option ${level === 'Alto' ? 'selected' : ''}>Alto</option>
            </select>
          </div>
          <div class="flex items-center gap-2 text-gray-600">
            <span class="min-w-[84px]">Probabilidade:</span>
            <select data-field="risk-probability" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none">
              <option ${probability === 'Baixa' ? 'selected' : ''}>Baixa</option>
              <option ${probability === 'Média' ? 'selected' : ''}>Média</option>
              <option ${probability === 'Alta' ? 'selected' : ''}>Alta</option>
            </select>
          </div>
          <div class="flex items-center gap-2 text-gray-600">
            <span class="min-w-[84px]">Impacto:</span>
            <select data-field="risk-impact" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none">
              <option ${impact === 'Baixo' ? 'selected' : ''}>Baixo</option>
              <option ${impact === 'Médio' ? 'selected' : ''}>Médio</option>
              <option ${impact === 'Alto' ? 'selected' : ''}>Alto</option>
            </select>
          </div>
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Descricao:</strong>
          <textarea data-field="risk-description" placeholder="Descreva o risco identificado..." rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none resize-none">${description}</textarea>
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Mitigacao:</strong>
          <textarea data-field="risk-mitigation" placeholder="Descreva a estrategia de mitigacao..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none resize-none">${mitigation}</textarea>
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Plano B:</strong>
          <textarea data-field="risk-fallback" placeholder="Descreva o plano B para este risco..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none resize-none">${fallback}</textarea>
        </div>
        <button type="button" data-action="confirm-risk-matrix" class="px-3 py-1.5 bg-bevap-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm shrink-0">
          <i class="fa-solid fa-check mr-1"></i>Confirmar
        </button>
      </div>
    `;
  },

  showRiskReadOnly: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const view = $(el).find('.risk-view').first();
    const edit = $(el).find('.risk-edit').first();
    if (!view.length || !edit.length) return;
    edit.addClass('hidden');
    view.removeClass('hidden');
    this.renderRiskReadOnlyCard(view.get(0), el);
  },

  showRiskEdit: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const view = $(el).find('.risk-view').first();
    const edit = $(el).find('.risk-edit').first();
    if (!view.length || !edit.length) return;
    view.addClass('hidden');
    edit.removeClass('hidden');
    this.renderRiskEditCard(edit.get(0), el);
  },

  confirmRiskMatrixItem: function (btnEl) {
    const card = $(btnEl).closest('.titt-risk-item');
    if (!card.length) return;

    const title = this.asText(card.find('.risk-edit [data-field="risk-title"]').val());
    if (!title) {
      this.showToast('Campo obrigatorio', 'Preencha o titulo do risco antes de confirmar.', 'warning');
      return;
    }

    const data = {
      title: title,
      description: this.asText(card.find('.risk-edit [data-field="risk-description"]').val()),
      mitigation: this.asText(card.find('.risk-edit [data-field="risk-mitigation"]').val()),
      fallback: this.asText(card.find('.risk-edit [data-field="risk-fallback"]').val()),
      level: this.asText(card.find('.risk-edit [data-field="risk-level"]').val()),
      impact: this.asText(card.find('.risk-edit [data-field="risk-impact"]').val()),
      probability: this.asText(card.find('.risk-edit [data-field="risk-probability"]').val())
    };

    this.setRiskCardData(card, data);
    card.attr('data-confirmed', '1');
    this.syncRiskInputsFromDataset(card);
    this.showRiskReadOnly(card);
    this.updateRiskEmptyState();
  },

  editRiskMatrixItem: function (btnEl) {
    const card = $(btnEl).closest('.titt-risk-item');
    if (!card.length) return;
    card.attr('data-confirmed', '0');
    this.showRiskEdit(card);
    this.updateRiskEmptyState();
  },

  removeRiskMatrixItem: function (target) {
    const item = $(target).closest('.titt-risk-item');
    if (!item.length) return;
    item.remove();

    this.reindexRiskCards();
    this.updateRiskEmptyState();
  },

  addDependencyItem: function (data) {
    const list = this.getContainer().find('#dependencies-list');
    if (!list.length) return;

    const cardEl = document.createElement('div');
    cardEl.classList.add('titt-dependency-item', 'dependency-item');
    const confirmed = Boolean(data && data.confirmed);
    cardEl.setAttribute('data-confirmed', confirmed ? '1' : '0');
    cardEl.setAttribute('data-index', String(list.find('.titt-dependency-item').length + 1));

    this.renderDependencyCardShell(cardEl, {
      title: this.asText(data && data.title),
      status: this.asText(data && data.status) || 'Pendente',
      owner: this.asText(data && data.owner),
      mitigation: this.asText(data && data.mitigation),
      fallback: this.asText(data && data.fallback)
    });

    if (confirmed) this.showDependencyReadOnly(cardEl);
    else this.showDependencyEdit(cardEl);

    list.append(cardEl);
    this.updateDependencyEmptyState();
  },

  removeDependencyItem: function (target) {
    const item = $(target).closest('.titt-dependency-item');
    if (!item.length) return;
    item.remove();

    this.reindexDependencyCards();
    this.updateDependencyEmptyState();
  },

  updateDependencyEmptyState: function () {
    const root = this.getContainer();
    const empty = root.find('#dependencies-empty');
    if (!empty.length) return;
    const any = root.find('#dependencies-list .titt-dependency-item').length > 0;
    empty.toggleClass('hidden', any);
  },

  reindexDependencyCards: function () {
    const list = this.getContainer().find('#dependencies-list');
    if (!list.length) return;

    list.find('.titt-dependency-item').each((idx, el) => {
      const cardEl = el;
      const newIndex = String(idx + 1);
      cardEl.setAttribute('data-index', newIndex);

      const fields = $(cardEl).find('.dependency-fields');
      if (!fields.length) return;

      const rename = (prefix) => {
        fields.find(`[name^="${prefix}___"]`).each((_, input) => {
          $(input).attr('name', `${prefix}___${newIndex}`);
        });
      };

      rename('tituloDependenciaTITT');
      rename('statusDependenciaTITT');
      rename('responsavelDependenciaTITT');
      rename('mitigacaoDependenciaTITT');
      rename('planoBDependenciaTITT');
    });
  },

  renderDependencyCardShell: function (cardEl, data) {
    if (!cardEl) return;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const idx = this.asText(el.getAttribute('data-index')) || '1';

    const title = this.escapeHtml(this.asText(data && data.title));
    const status = this.escapeHtml(this.asText(data && data.status) || 'Pendente');
    const owner = this.escapeHtml(this.asText(data && data.owner));
    const mitigation = this.escapeHtml(this.asText(data && data.mitigation));
    const fallback = this.escapeHtml(this.asText(data && data.fallback));

    el.innerHTML = `
      <div class="dependency-fields hidden">
        <input type="text" name="tituloDependenciaTITT___${this.escapeHtml(idx)}" value="${title}" />
        <input type="text" name="statusDependenciaTITT___${this.escapeHtml(idx)}" value="${status}" />
        <input type="text" name="responsavelDependenciaTITT___${this.escapeHtml(idx)}" value="${owner}" />
        <input type="text" name="mitigacaoDependenciaTITT___${this.escapeHtml(idx)}" value="${mitigation}" />
        <input type="text" name="planoBDependenciaTITT___${this.escapeHtml(idx)}" value="${fallback}" />
      </div>
      <div class="dependency-edit"></div>
      <div class="dependency-view"></div>
    `;

    this.setDependencyCardData(el, {
      title: this.asText(data && data.title),
      status: this.asText(data && data.status) || 'Pendente',
      owner: this.asText(data && data.owner),
      mitigation: this.asText(data && data.mitigation),
      fallback: this.asText(data && data.fallback)
    });
  },

  setDependencyCardData: function (cardEl, data) {
    if (!cardEl) return;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el || !el.dataset) return;
    el.dataset.dependencyTitle = this.asText(data && data.title);
    el.dataset.dependencyStatus = this.asText(data && data.status) || 'Pendente';
    el.dataset.dependencyOwner = this.asText(data && data.owner);
    el.dataset.dependencyMitigation = this.asText(data && data.mitigation);
    el.dataset.dependencyFallback = this.asText(data && data.fallback);
  },

  syncDependencyInputsFromDataset: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el || !el.dataset) return;
    const wrap = $(el).find('.dependency-fields');
    if (!wrap.length) return;

    wrap.find('[name^="tituloDependenciaTITT___"]').val(this.asText(el.dataset.dependencyTitle));
    wrap.find('[name^="statusDependenciaTITT___"]').val(this.asText(el.dataset.dependencyStatus));
    wrap.find('[name^="responsavelDependenciaTITT___"]').val(this.asText(el.dataset.dependencyOwner));
    wrap.find('[name^="mitigacaoDependenciaTITT___"]').val(this.asText(el.dataset.dependencyMitigation));
    wrap.find('[name^="planoBDependenciaTITT___"]').val(this.asText(el.dataset.dependencyFallback));
  },

  getDependencyStatusBadgeHtml: function (status) {
    const value = this.asText(status) || 'Pendente';
    if (value === 'Concluida' || value === 'Concluída') return '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"><i class="fa-solid fa-check mr-1"></i>Concluida</span>';
    if (value === 'Em andamento') return '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"><i class="fa-solid fa-spinner mr-1"></i>Em andamento</span>';
    if (value === 'Bloqueada') return '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"><i class="fa-solid fa-ban mr-1"></i>Bloqueada</span>';
    return '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"><i class="fa-solid fa-clock mr-1"></i>Pendente</span>';
  },

  renderDependencyReadOnlyCard: function (containerEl, cardEl) {
    const container = containerEl && containerEl.jquery ? containerEl.get(0) : containerEl;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!container || !el || !el.dataset) return;

    const title = this.asText(el.dataset.dependencyTitle);
    const status = this.asText(el.dataset.dependencyStatus) || 'Pendente';
    const owner = this.asText(el.dataset.dependencyOwner);
    const mitigation = this.asText(el.dataset.dependencyMitigation);
    const fallback = this.asText(el.dataset.dependencyFallback);

    el.className = 'border border-gray-200 rounded-lg p-4 dependency-item titt-dependency-item';
    container.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <h5 class="font-medium text-bevap-navy break-all">${this.escapeHtml(title)}</h5>
        ${this.getDependencyStatusBadgeHtml(status)}
      </div>
      <div class="text-sm text-gray-600 mb-1 break-all"><strong>Responsavel:</strong> ${this.escapeHtml(owner || 'Nao informado')}</div>
      <div class="text-sm text-gray-700 mb-1 break-all"><strong>Mitigacao:</strong> ${this.escapeHtml(mitigation || 'Nao informado')}</div>
      <div class="text-sm text-gray-700 break-all"><strong>Plano B:</strong> ${this.escapeHtml(fallback || 'Nao informado')}</div>
      <div class="flex justify-end items-center gap-2 mt-2">
        <button type="button" data-action="edit-dependency" class="text-blue-500 hover:text-blue-700" title="Editar dependência"><i class="fa-solid fa-pen"></i></button>
        <button type="button" data-action="remove-dependency" class="text-red-400 hover:text-red-600" title="Remover dependência"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  },

  renderDependencyEditCard: function (containerEl, cardEl) {
    const container = containerEl && containerEl.jquery ? containerEl.get(0) : containerEl;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!container || !el || !el.dataset) return;

    el.className = 'border border-gray-200 rounded-lg p-4 dependency-item titt-dependency-item';

    const title = this.escapeHtml(this.asText(el.dataset.dependencyTitle));
    const status = this.asText(el.dataset.dependencyStatus) || 'Pendente';
    const owner = this.escapeHtml(this.asText(el.dataset.dependencyOwner));
    const mitigation = this.escapeHtml(this.asText(el.dataset.dependencyMitigation));
    const fallback = this.escapeHtml(this.asText(el.dataset.dependencyFallback));

    container.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <input data-field="dependency-title" type="text" value="${title}" placeholder="Nova dependência" class="font-medium text-bevap-navy bg-transparent border-none p-0 focus:outline-none w-full">
        <button type="button" data-action="remove-dependency" class="text-red-400 hover:text-red-600" title="Remover dependência"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="space-y-3 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-gray-600 min-w-[84px]">Status:</span>
          <select data-field="dependency-status" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none">
            <option ${status === 'Pendente' ? 'selected' : ''}>Pendente</option>
            <option ${status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
            <option ${status === 'Bloqueada' ? 'selected' : ''}>Bloqueada</option>
            <option ${status === 'Concluida' || status === 'Concluída' ? 'selected' : ''}>Concluida</option>
          </select>
        </div>
        <div class="space-y-1 text-gray-600">
          <span class="block">Responsavel:</span>
          <input data-field="dependency-owner" type="text" value="${owner}" placeholder="Informe o responsável" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Mitigacao:</strong>
          <textarea data-field="dependency-mitigation" placeholder="Descreva a mitigação..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">${mitigation}</textarea>
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Plano B:</strong>
          <textarea data-field="dependency-fallback" placeholder="Descreva o plano B..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">${fallback}</textarea>
        </div>
        <button type="button" data-action="confirm-dependency" class="px-3 py-1.5 bg-bevap-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm shrink-0">
          <i class="fa-solid fa-check mr-1"></i>Confirmar
        </button>
      </div>
    `;
  },

  showDependencyReadOnly: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const view = $(el).find('.dependency-view').first();
    const edit = $(el).find('.dependency-edit').first();
    if (!view.length || !edit.length) return;
    edit.addClass('hidden');
    view.removeClass('hidden');
    this.renderDependencyReadOnlyCard(view.get(0), el);
    this.updateDependencyEmptyState();
  },

  showDependencyEdit: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const view = $(el).find('.dependency-view').first();
    const edit = $(el).find('.dependency-edit').first();
    if (!view.length || !edit.length) return;
    view.addClass('hidden');
    edit.removeClass('hidden');
    this.renderDependencyEditCard(edit.get(0), el);
    this.updateDependencyEmptyState();
  },

  confirmDependencyItem: function (btnEl) {
    const card = $(btnEl).closest('.titt-dependency-item');
    if (!card.length) return;

    const title = this.asText(card.find('.dependency-edit [data-field="dependency-title"]').val());
    if (!title) {
      this.showToast('Campo obrigatorio', 'Preencha a dependência antes de confirmar.', 'warning');
      return;
    }

    const data = {
      title,
      status: this.asText(card.find('.dependency-edit [data-field="dependency-status"]').val()),
      owner: this.asText(card.find('.dependency-edit [data-field="dependency-owner"]').val()),
      mitigation: this.asText(card.find('.dependency-edit [data-field="dependency-mitigation"]').val()),
      fallback: this.asText(card.find('.dependency-edit [data-field="dependency-fallback"]').val())
    };

    this.setDependencyCardData(card, data);
    card.attr('data-confirmed', '1');
    this.syncDependencyInputsFromDataset(card);
    this.showDependencyReadOnly(card);
    this.updateDependencyEmptyState();
  },

  editDependencyItem: function (btnEl) {
    const card = $(btnEl).closest('.titt-dependency-item');
    if (!card.length) return;
    card.attr('data-confirmed', '0');
    this.showDependencyEdit(card);
    this.updateDependencyEmptyState();
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

    const allowedRiskFieldName = /^(tituloRiscoTITT|descricaoRiscoTITT|mitigacaoRiscoTITT|planoBRiscoTITT|nivelRiscoTITT|impactoRiscoTITT|probabilidadeRiscoTITT)___\d+$/;
    root.find('#risk-matrix-list .titt-risk-item[data-confirmed="1"] .risk-fields :input[name]').each((_, input) => {
      const $input = $(input);
      const name = this.asText($input.attr('name'));
      if (!name || !allowedRiskFieldName.test(name)) return;
      cardData[name] = this.asText($input.val());
    });

    const allowedDependencyFieldName = /^(tituloDependenciaTITT|statusDependenciaTITT|responsavelDependenciaTITT|mitigacaoDependenciaTITT|planoBDependenciaTITT)___\d+$/;
    root.find('#dependencies-list .titt-dependency-item[data-confirmed="1"] .dependency-fields :input[name]').each((_, input) => {
      const $input = $(input);
      const name = this.asText($input.attr('name'));
      if (!name || !allowedDependencyFieldName.test(name)) return;
      cardData[name] = this.asText($input.val());
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
