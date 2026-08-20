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
    externalAttachments: [],
    externalAttachmentMetadata: []
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
    this._state.externalAttachments = [];
    this._state.externalAttachmentMetadata = [];
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
      this.toggleExternalSection();
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

    container.on(`click${ns}`, '[data-action="pick-external-attachments"]', (event) => {
      event.preventDefault();
      const input = this.getContainer().find('#external-attachments-input').first();
      if (input.length) input.trigger('click');
    });

    container.on(`change${ns}`, '#external-attachments-input', (event) => {
      this.handleExternalAttachmentSelection(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="remove-external-attachment"]', (event) => {
      event.preventDefault();
      const index = parseInt(String($(event.currentTarget).attr('data-index') || ''), 10);
      if (!Number.isFinite(index)) return;
      this.removeExternalAttachment(index);
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

    root.find('#motivo-categoria').val(this.asText(row.motivoDecisaoCategoriaTITT));
    root.find('#motivo-descricao').val(this.asText(row.motivoDecisaoDescricaoTITT));

    const capValue = this.asText(row.disponibilidadedaEquipeTITT);
    if (capValue) {
      root.find('#team-capacity-input').val(capValue);
    }
    this.updateCapacityLabel(capValue);

    root.find('#desired-start-date').val(this.asText(row.dataDesejadaInicioTITT));

    root.find('#external-supplier').val(this.asText(row.fornecedorRecomendadoTITT));
    root.find('#external-contract-type').val(this.asText(row.tipoContratacaoTITT));
    root.find('#external-justification').val(this.asText(row.justifExecucaoExtTITT));

    this._state.externalAttachmentMetadata = this.parseExternalAttachments(row.anexosApoioTITT);
    this.renderExternalAttachments();

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

  updateChecklistProgress: function () {
    const root = this.getContainer().find('#tab-content-checklist');
    if (!root.length) return;

    const items = root.find('.triagem-checklist-item');
    const checked = items.filter(':checked').length;
    const percentage = items.length ? Math.round((checked / items.length) * 100) : 0;

    this.getContainer().find('#triagem-checklist-percentage').text(`${percentage}%`);
    this.getContainer().find('#triagem-checklist-progress').css('width', `${percentage}%`);
  },

  parseExternalAttachments: function (value) {
    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => {
          return {
            documentId: this.asText(item && (item.documentId || item.documentID || item.id)),
            fileName: this.asText(item && (item.fileName || item.filename || item.name)),
            fileSize: item && item.fileSize !== undefined ? item.fileSize : ''
          };
        })
        .filter((item) => item.fileName);
    } catch (error) {
      return [];
    }
  },

  renderExternalAttachments: function () {
    const target = this.getContainer().find('#external-attachments').first();
    if (!target.length) return;

    const selected = Array.isArray(this._state.externalAttachments) ? this._state.externalAttachments : [];
    const saved = Array.isArray(this._state.externalAttachmentMetadata) ? this._state.externalAttachmentMetadata : [];

    if (!selected.length && !saved.length) {
      target.html('<div class="text-sm text-gray-500">Nenhum anexo selecionado.</div>');
      return;
    }

    const savedHtml = saved.map((att) => {
      const name = this.escapeHtml(att.fileName || 'arquivo');

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid fa-paperclip text-gray-500 text-xl mr-3"></i>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 truncate">${name}</div>
              <div class="text-xs text-gray-500">Arquivo salvo</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const selectedHtml = selected.map((att, index) => {
      const file = att && att.file;
      const name = this.escapeHtml(file && file.name ? file.name : 'arquivo');
      const size = this.escapeHtml(file && file.size ? `${Math.round(file.size / 1024)} KB` : '');

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid fa-paperclip text-gray-500 text-xl mr-3"></i>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 truncate">${name}</div>
              <div class="text-xs text-gray-500">${size}</div>
            </div>
          </div>
          <button data-action="remove-external-attachment" data-index="${index}" class="text-red-500 hover:text-red-700">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    target.html(`${savedHtml}${selectedHtml}`);
  },

  handleExternalAttachmentSelection: function (inputEl) {
    const input = inputEl;
    if (!input || !input.files) return;

    const files = Array.from(input.files);
    if (!files.length) return;

    const maxSizeBytes = 10 * 1024 * 1024;
    const current = Array.isArray(this._state.externalAttachments) ? this._state.externalAttachments : [];
    const merged = current.slice();

    files.forEach((file) => {
      if (!file) return;

      if (file.size > maxSizeBytes) {
        this.showToast('Arquivo acima do limite', `${file.name} excede 10MB e não foi adicionado.`, 'warning');
        return;
      }

      const exists = merged.some((existing) => {
        return existing && existing.file
          && existing.file.name === file.name
          && existing.file.size === file.size
          && existing.file.lastModified === file.lastModified;
      });
      if (exists) return;

      merged.push({
        id: `titt-att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: file
      });
    });

    this._state.externalAttachments = merged;
    this.renderExternalAttachments();

    // limpa para permitir selecionar o mesmo arquivo novamente se precisar
    try { input.value = ''; } catch (e) {}
  },

  removeExternalAttachment: function (index) {
    const current = Array.isArray(this._state.externalAttachments) ? this._state.externalAttachments : [];
    if (index < 0 || index >= current.length) return;
    current.splice(index, 1);
    this._state.externalAttachments = current;
    this.renderExternalAttachments();
  },

  readFileAsBase64: function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = String(event.target && event.target.result ? event.target.result : '');
        const base64 = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;
        resolve(base64);
      };
      reader.onerror = () => {
        reject(new Error(`Falha ao ler o anexo ${file && file.name ? file.name : ''}`.trim()));
      };
      reader.readAsDataURL(file);
    });
  },

  collectExternalAttachmentsPayload: async function () {
    const items = Array.isArray(this._state.externalAttachments)
      ? this._state.externalAttachments.filter((att) => att && att.file)
      : [];

    if (!items.length) return [];

    const payload = await Promise.all(items.map(async (att) => {
      const file = att.file;
      const fileContent = await this.readFileAsBase64(file);
      return {
        fileName: String(file.name || '').trim(),
        fileContent: String(fileContent || '').trim(),
        fileSize: String(file.size || '').trim()
      };
    }));

    return payload.filter((item) => item.fileName && item.fileContent);
  },

  getBooleanFieldValue: function (selector) {
    return this.getContainer().find(selector).is(':checked') ? 'true' : 'false';
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

      const processInstanceId = await this.resolveProcessInstanceId();
      const choosedState = config && config.choosedState !== null && config.choosedState !== undefined
        ? String(config.choosedState).trim()
        : '';

      if (!choosedState) {
        throw new Error('Numero da atividade destino e obrigatorio');
      }
      const taskFields = this.collectTriageTaskFields();

      loading.updateMessage('Preparando anexos...');
      await this.waitForUiPaint();
      const attachments = await this.collectExternalAttachmentsPayload();

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
