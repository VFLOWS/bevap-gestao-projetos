const committeeCostApprovalController = {
  _eventNamespace: '.committeeCostApproval',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _baseFields: [
    'documentid',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'patrocinadorNS',
    'prioridadeNS',
    'estadoProcesso',
    'anexosNS',
    'anexosApoioTITT',
    'beneficiosesperadosNS',
    'tblBeneficiosEsperadosNS.beneficioEsperadoNS',
    'alinhadobevapNS',
    'tblObjetivosEstrategicosNS.descricaoobjetivoNS',
    'categoriajusticomite2',
    'dataHoraACP',
    'anotacoesACP',
    'anexarAtaReuniaoACP',
    'tblParticipantesACP.nomeParticipanteACP',

    // TITT - Riscos & Dependências (para aba Risco & Compliance)
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
    'tblRiscosDependenciasTITT.riscoPotencialTITT'
    ,
    // Resumo do Projeto (campos extras)
    'execucaoProjetoTITT',
    'fornecedorRecomendadoTITT',
    'valortotalTIPC',
    'prazoEstimadoTIPC',
    // GCC (para aba Custo & Orcamento)
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
    'tblNaturezaCustoOpexGCC.saldoAposCompromissoOpexGCC'
  ],
  _uiComponentsKey: 'gpUiComponents',
  _tabComponentsKey: 'gpApprovalTabComponents',
  _tabsRoot: null,
  _headerBackup: null,
  _toastTimer: null,
  _state: {
    documentId: null,
    estadoProcesso: null,
    processInstanceId: null,
    baseRow: null,
    currentTab: 'solicitacao',
    historyCache: {},
    isSubmitting: false,
    participants: [],
    attachments: []
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
        this.applyCostApprovalLabels();
        this.renderSidebarSkeleton();
        this.initializeTabs();
        this.bindEvents();
        this.loadReadOnlyTab('solicitacao');
        this.loadBaseContext();
      })
      .fail((error) => {
        console.error('[committeeCostApproval] Template load error:', error);
        container.html('<div class="p-6 text-red-600">Falha ao carregar a tela do Comitê.</div>');
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
    this._state.participants = [];
    this._state.attachments = [];
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-committee-cost-approval.html`;
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
      titleEl.text('Comitê - Aprovar Custo do Projeto');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Comitê</span>
      `);
    }
  },

  applyCostApprovalLabels: function () {
    const root = this.getContainer();

    const bannerTitle = root.find('#alert-banner .font-medium').first();
    if (bannerTitle.length) {
      bannerTitle.text('Aprovação do Comitê - Custo do Projeto');
    }

    const approveButton = root.find('[data-action="open-approve-modal"]').first();
    if (approveButton.length) {
      approveButton.html('<i class="fa-solid fa-check mr-2"></i> Aprovar Custo do Projeto');
    }

    const approveText = root.find('#approve-modal p.text-gray-700').first();
    if (approveText.length) {
      approveText.html('Você está aprovando o custo do projeto <strong id="cap-approve-project">—</strong>.');
    }

    const rejectTitle = root.find('#modal-reject h3').first();
    if (rejectTitle.length) {
      rejectTitle.text('Reprovar Custo do Projeto');
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

    container.on(`click${ns}`, '#toast-close', (event) => {
      event.preventDefault();
      container.find('#toast').addClass('hidden');
      if (this._toastTimer) {
        clearTimeout(this._toastTimer);
        this._toastTimer = null;
      }
    });

    container.on(`click${ns}`, '[data-action="save-draft"]', (event) => {
      event.preventDefault();
      this.saveDraft();
    });

    container.on(`click${ns}`, '[data-action="open-return-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-return');
    });

    container.on(`click${ns}`, '[data-action="open-reject-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-reject');
    });

    container.on(`click${ns}`, '[data-action="open-approve-modal"]', (event) => {
      event.preventDefault();
      this.openModal('approve-modal');
    });

    container.on(`click${ns}`, '[data-action="close-modal"]', (event) => {
      event.preventDefault();
      const modalId = String($(event.currentTarget).attr('data-modal-id') || '').trim();
      if (!modalId) return;
      this.closeModal(modalId);
    });

    container.on(`click${ns}`, '#cap-add-participant', (event) => {
      event.preventDefault();
      this.addParticipantFromInput();
    });

    container.on(`keydown${ns}`, '#cap-participant-input', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      this.addParticipantFromInput();
    });

    container.on(`click${ns}`, '[data-action="remove-cap-participant"]', (event) => {
      event.preventDefault();
      const id = String($(event.currentTarget).attr('data-participant-id') || '').trim();
      if (!id) return;
      this.removeParticipant(id);
    });

    container.on(`change${ns}`, '#cap-ata-input', (event) => {
      const input = event.currentTarget;
      const files = input && input.files ? input.files : [];
      this.addAttachments(files);
      try { input.value = ''; } catch (e) {}
    });

    container.on(`click${ns}`, '[data-action="remove-cap-attachment"]', (event) => {
      event.preventDefault();
      const id = String($(event.currentTarget).attr('data-attachment-id') || '').trim();
      if (!id) return;
      this.removeAttachment(id);
    });

    container.on(`click${ns}`, '[data-action="confirm-approve"]', (event) => {
      event.preventDefault();
      this.handleTaskAction({
        action: 'Aprovar',
        choosedState: 63,
        modalId: 'approve-modal',
        decisionField: 'decisaocomite2',
        decisionValue: 'aprovado',
        justification: '',
        extraCardData: { categoriajusticomite2: '' }
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-return"]', (event) => {
      event.preventDefault();
      const category = this.asText(container.find('#cap-return-category').val());
      if (!category) {
        this.showToast('Categoria', 'Selecione a categoria da devolução.', 'warning');
        container.find('#cap-return-category').trigger('focus');
        return;
      }

      const justification = this.asText(container.find('#cap-justification-return').val());
      if (!justification) {
        this.showToast('Justificativa', 'Informe o motivo da devolução.', 'warning');
        container.find('#cap-justification-return').trigger('focus');
        return;
      }

      this.handleTaskAction({
        action: 'Devolver para Correção',
        choosedState: 63,
        modalId: 'modal-return',
        decisionField: 'decisaocomite2',
        decisionValue: 'correcao',
        justification: justification,
        extraCardData: { categoriajusticomite2: category }
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-reject"]', (event) => {
      event.preventDefault();

      const category = this.asText(container.find('#cap-reject-category').val());
      if (!category) {
        this.showToast('Categoria', 'Selecione a categoria da reprovação.', 'warning');
        container.find('#cap-reject-category').trigger('focus');
        return;
      }

      const justification = this.asText(container.find('#cap-justification-reject').val());
      if (!justification) {
        this.showToast('Justificativa', 'Informe a justificativa da reprovação.', 'warning');
        container.find('#cap-justification-reject').trigger('focus');
        return;
      }

      this.handleTaskAction({
        action: 'Reprovar',
        choosedState: 63,
        modalId: 'modal-reject',
        decisionField: 'decisaocomite2',
        decisionValue: 'cancelado',
        justification: justification,
        extraCardData: { categoriajusticomite2: category }
      });
    });

    container.on(`click${ns}`, '#approve-modal, #modal-return, #modal-reject', (event) => {
      if (event.target !== event.currentTarget) return;
      $(event.currentTarget).addClass('hidden');
    });
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho do Comitê...');
      await this.waitForUiPaint();

      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        taskFields: this.collectCommitteeTaskFields()
      });

      this.showToast('Rascunho salvo', 'As alterações foram salvas com sucesso.', 'success');
    } catch (error) {
      console.error('[committeeCostApproval] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Não foi possível salvar o rascunho.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
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

  getReadOnlyTabConfig: function (tabName) {
    const configMap = {
      solicitacao: { key: 'solicitationHistory', mount: 'tab-solicitacao-history' },
      'analise-ti': { key: 'tiAnalysisHistory', mount: 'tab-analise-ti-history' },
      impacto: { key: 'areaImpactHistory', mount: 'tab-impacto-history' },
      'triagem-ti': { key: 'tiTriageHistory', mount: 'tab-triagem-ti-history' },
      'proposta-fornecedor': { key: 'supplierProposal', mount: 'tab-proposta-fornecedor' },
      'business-case': { key: 'committeeBusinessCase', mount: 'tab-business-case' },
      'risk-compliance': { key: 'committeeRiskCompliance', mount: 'tab-risk-compliance' },
      'custo-orcamento': { key: 'committeeCostBudget', mount: 'tab-custo-orcamento' },
      documents: { key: 'committeeDocuments', mount: 'tab-documents' }
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

    const componentOptions = {
      documentId: this._state.documentId,
      row: this._state.baseRow || null
    };

    if (this._state.historyCache[tabName]) {
      target.html(this._state.historyCache[tabName]);
      this.mountAttachmentsInTab(target, component, componentOptions);
      return;
    }

    if (!component || typeof component.render !== 'function') {
      target.html('<div class="text-sm text-red-600">Componente da aba indisponível.</div>');
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteúdo...</div>');

    try {
      const html = typeof component.renderInto === 'function'
        ? await component.renderInto(target, componentOptions)
        : await component.render(componentOptions);
      this._state.historyCache[tabName] = html;

      if (typeof component.renderInto !== 'function') {
        target.html(html);
      }

      this.mountAttachmentsInTab(target, component, componentOptions);
    } catch (error) {
      console.error(`[committeeCostApproval] Error loading tab ${tabName}:`, error);
      target.html('<div class="text-sm text-red-600">Não foi possível carregar esta aba.</div>');
    }
  },

  mountAttachmentsInTab: function (tabRootEl, component, options) {
    if (!component || typeof component.mountAttachments !== 'function') return;
    try {
      component.mountAttachments(tabRootEl, Object.assign({ documentId: this._state.documentId }, options));
    } catch (error) {
      // silencioso
    }
  },

  loadBaseContext: async function () {
    if (!this._state.documentId) {
      this.showToast('Sem solicitação', 'Nenhum documentId foi informado para esta rota.', 'warning');
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
        this.showToast('Não encontrado', 'Não foi possível localizar dados da solicitação.', 'warning');
        return;
      }

      this.renderSidebarFromRow(row);
      this.fillAcpFieldsFromRow(row);
      this.renderApproveModalFromRow(row);
    } catch (error) {
      console.error('[committeeCostApproval] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Não foi possível carregar os dados do Comitê.', 'error');
    }
  },

  renderApproveModalFromRow: function (row) {
    const root = this.getContainer();
    const strong = root.find('#cap-approve-project').first();
    if (!strong.length) return;

    const code = this.asText(row && row.documentid);
    const title = this.asText(row && row.titulodoprojetoNS);
    const label = [code, title].filter(Boolean).join(' • ');
    strong.text(label || '—');
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
      showRequester: false,
      area: 'N/A',
      sponsor: 'N/A',
      attachmentsCount: 0,
      priority: { label: 'N/A', iconClass: 'fa-solid fa-star', badgeClasses: 'bg-gray-100 text-gray-800' },
      customRows: [
        {
          label: 'Tipo',
          value: 'N/A',
          variant: 'badge',
          iconClass: 'fa-solid fa-users',
          badgeClasses: 'bg-gray-100 text-gray-800'
        },
        { variant: 'block', label: 'Fornecedor Recomendado', value: 'N/A' },
        {
          variant: 'kvList',
          label: 'Estimativa Original',
          items: [
            { label: 'Custo:', value: 'N/A' },
            { label: 'Prazo:', value: 'N/A' }
          ]
        }
      ],
      status: { label: 'N/A', iconClass: 'fa-solid fa-clock', badgeClasses: 'bg-gray-100 text-gray-800' }
    });

    ui.sidebar.renderProgress(progressTarget, {
      items: this.getProgressItems()
    });
  },

  renderSidebarFromRow: function (row) {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    const progressTarget = container.find('[data-component="progress-status"]').first();

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: this.asText(row && row.documentid) || 'N/A',
      title: this.asText(row && row.titulodoprojetoNS) || 'N/A',
      requester: 'N/A',
      showRequester: false,
      area: this.asText(row && row.areaUnidadeNS) || 'N/A',
      sponsor: this.asText(row && row.patrocinadorNS) || 'N/A',
      attachmentsCount: this.countAttachments(row && row.anexosNS),
      priority: {
        label: this.getPriorityLabel(row && row.prioridadeNS) || 'N/A',
        iconClass: 'fa-solid fa-star',
        badgeClasses: this.getPriorityBadgeClasses(row && row.prioridadeNS)
      },
      customRows: [
        {
          label: 'Tipo',
          value: this.getExecucaoProjetoLabel(row && row.execucaoProjetoTITT) || 'N/A',
          variant: 'badge',
          iconClass: 'fa-solid fa-users',
          badgeClasses: this.getExecucaoProjetoBadgeClasses(row && row.execucaoProjetoTITT)
        },
        {
          variant: 'block',
          label: 'Fornecedor Recomendado',
          value: this.asText(row && row.fornecedorRecomendadoTITT) || 'Nao informado'
        },
        {
          variant: 'kvList',
          label: 'Estimativa Original',
          items: [
            { label: 'Custo:', value: this.formatMoney(row && row.valortotalTIPC) || 'N/A' },
            { label: 'Prazo:', value: this.asText(row && row.prazoEstimadoTIPC) || 'N/A' }
          ]
        }
      ],
      status: {
        label: this.getEstadoProcessoLabel(row && row.estadoProcesso) || 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-yellow-100 text-yellow-800'
      }
    });

    ui.sidebar.renderProgress(progressTarget, {
      items: this.getProgressItems()
    });
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitação aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Análise TI concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Impacto na área concluído', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Triagem técnica concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Análise do comitê em andamento', iconClass: 'fa-solid fa-clock' }
    ];
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

  getExecucaoProjetoLabel: function (value) {
    const text = this.asText(value);
    if (!text) return '';

    const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('intern') !== -1) return 'Interno';
    if (normalized.indexOf('extern') !== -1) return 'Externo';
    if (normalized.indexOf('misto') !== -1) return 'Misto';
    return text;
  },

  getExecucaoProjetoBadgeClasses: function (value) {
    const text = this.asText(value);
    if (!text) return 'bg-gray-100 text-gray-800';

    const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('intern') !== -1) return 'bg-purple-100 text-purple-800';
    if (normalized.indexOf('extern') !== -1) return 'bg-indigo-100 text-indigo-800';
    if (normalized.indexOf('misto') !== -1) return 'bg-violet-100 text-violet-800';
    return 'bg-gray-100 text-gray-800';
  },

  formatMoney: function (value) {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';

    const normalized = raw
      .replace(/\s/g, '')
      .replace(/^R\$/i, '')
      .replace(/\./g, '')
      .replace(/,/g, '.');

    const amount = Number(normalized);
    if (!Number.isFinite(amount)) return raw;

    try {
      return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (error) {
      return `R$ ${amount.toFixed(2).replace('.', ',')}`;
    }
  },

  fillAcpFieldsFromRow: function (row) {
    const root = this.getContainer();

    const dt = this.normalizeDateTimeToInputValue(row && row.dataHoraACP);
    if (dt) root.find('#cap-datetime').val(dt);

    root.find('#cap-notes').val(this.asText(row.anotacoesACP));

    const rejectCategory = this.asText(row && row.categoriajusticomite2);
    if (rejectCategory) {
      const select = root.find('#cap-reject-category').first();
      if (select.length) select.val(rejectCategory);
    }

    const participants = this.parseTableJson(row.tblParticipantesACP || row['tblParticipantesACP'])
      .map((item) => this.asText(item && item.nomeParticipanteACP))
      .filter(Boolean)
      .map((name) => ({ id: `persisted:${name}:${Math.random().toString(16).slice(2)}`, name }));

    this._state.participants = participants;
    this.renderParticipants();

    this._state.attachments = [];
    this.renderAttachmentsList();
  },

  validateCap: function () {
    const root = this.getContainer();
    const missing = [];

    const dt = this.asText(root.find('#cap-datetime').val());
    if (!dt) missing.push('Data/Hora da Reunião');

    const participants = Array.isArray(this._state.participants) ? this._state.participants : [];
    const hasOne = participants.some((p) => p && this.asText(p.name));
    if (!hasOne) missing.push('Participantes (mínimo 1)');

    return missing;
  },

  addParticipantFromInput: function () {
    const root = this.getContainer();
    const input = root.find('#cap-participant-input').first();
    if (!input.length) return;

    const name = this.asText(input.val());
    if (!name) {
      this.showToast('Participante', 'Informe o nome do participante.', 'warning');
      input.trigger('focus');
      return;
    }

    const current = Array.isArray(this._state.participants) ? this._state.participants.slice() : [];
    current.push({
      id: `local:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      name: name
    });
    this._state.participants = current;
    input.val('');
    this.renderParticipants();
  },

  removeParticipant: function (id) {
    const current = Array.isArray(this._state.participants) ? this._state.participants : [];
    this._state.participants = current.filter((p) => String(p && p.id) !== String(id));
    this.renderParticipants();
  },

  renderParticipants: function () {
    const root = this.getContainer();
    const list = root.find('#cap-participants').first();
    if (!list.length) return;

    const items = Array.isArray(this._state.participants) ? this._state.participants : [];
    if (!items.length) {
      list.html('<div class="text-sm text-gray-500">Nenhum participante adicionado.</div>');
      return;
    }

    list.html(items.map((p) => {
      const safeName = this.escapeHtml(p.name);
      const safeId = this.escapeHtml(p.id);
      return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-bevap-navy text-white">
          ${safeName}
          <button type="button" data-action="remove-cap-participant" data-participant-id="${safeId}" class="ml-2 hover:text-red-300" aria-label="Remover participante" title="Remover">
            <i class="fa-solid fa-times text-xs"></i>
          </button>
        </span>
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

  getAttachmentIconClass: function (fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  formatAttachmentSize: function (bytes) {
    const size = Number(bytes);
    if (!isFinite(size) || size <= 0) return '';
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  },

  renderAttachmentsList: function () {
    const root = this.getContainer();
    const list = root.find('#cap-ata-list').first();
    if (!list.length) return;

    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    if (!items.length) {
      list.html('<div class="text-sm text-gray-500">Nenhum anexo selecionado.</div>');
      return;
    }

    list.html(items.map((att) => {
      const safeName = this.escapeHtml(att.file ? (att.file.name || '') : (att.fileName || 'arquivo'));
      const sizeLabel = att.file ? this.escapeHtml(this.formatAttachmentSize(att.file.size || 0)) : '';
      const iconClass = this.escapeHtml(this.getAttachmentIconClass(att.file ? att.file.name : att.fileName));
      const safeId = this.escapeHtml(att.id);

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid ${iconClass} text-xl mr-3"></i>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 truncate">${safeName}</div>
              <div class="text-xs text-gray-500">${sizeLabel || ''}</div>
            </div>
          </div>
          <button type="button" data-action="remove-cap-attachment" data-attachment-id="${safeId}" class="text-red-500 hover:text-red-700" title="Remover">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    }).join(''));
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

  collectCommitteeCardData: function (decisionField, decisionValue, justificationValue, extraCardData) {
    const root = this.getContainer();
    const inputDateTime = this.asText(root.find('#cap-datetime').val());

    const cardData = {
      dataHoraACP: this.formatDateTimeForCard(inputDateTime),
      anotacoesACP: this.asText(root.find('#cap-notes').val())
    };

    const participants = Array.isArray(this._state.participants) ? this._state.participants : [];
    const names = participants.map((p) => this.asText(p && p.name)).filter(Boolean);
    names.forEach((name, index) => {
      cardData[`nomeParticipanteACP___${index + 1}`] = name;
    });

    if (decisionField) {
      cardData[decisionField] = this.asText(decisionValue);
    }

    if (justificationValue !== undefined) {
      cardData.justificativacomite2 = this.asText(justificationValue);
    }

    if (extraCardData && typeof extraCardData === 'object') {
      Object.keys(extraCardData).forEach((key) => {
        const name = this.asText(key);
        if (!name) return;
        cardData[name] = this.asText(extraCardData[key]);
      });
    }

    return cardData;
  },

  collectCommitteeTaskFields: function (decisionField, decisionValue, justificationValue, extraCardData) {
    const cardData = this.collectCommitteeCardData(decisionField, decisionValue, justificationValue, extraCardData);

    return Object.keys(cardData).map((fieldName) => {
      return { name: fieldName, value: cardData[fieldName] };
    });
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

  handleTaskAction: async function (config) {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Validando dados do Comitê...');
      await this.waitForUiPaint();

      const missing = this.validateCap();
      if (missing && missing.length) {
        this.showToast('Campos obrigatórios', `Preencha: ${missing.join(' | ')}`, 'warning');
        return;
      }

      const processInstanceId = await this.resolveProcessInstanceId();
      const choosedState = config && config.choosedState !== null && config.choosedState !== undefined
        ? String(config.choosedState).trim()
        : '';

      if (!choosedState) {
        throw new Error('Número da atividade destino é obrigatório');
      }

      const taskFields = this.collectCommitteeTaskFields(
        config && config.decisionField,
        config && config.decisionValue,
        config && config.justification,
        config && config.extraCardData
      );
      const attachments = await this.collectAttachmentsPayload();

      loading.updateMessage('Enviando movimentação para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: choosedState,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos',
        comments: `Comitê (custo): ${this.asText(config && config.action)}`,
        attachments: attachments
      }, taskFields);

      if (config && config.modalId) {
        this.closeModal(config.modalId);
      }

      this.showToast('Sucesso', `Ação registrada: ${this.asText(config && config.action)}.`, 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[committeeCostApproval] Error moving task:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Não foi possível movimentar a solicitação.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
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
    toast.attr('class', `fixed top-20 right-4 z-50 bg-white rounded-lg shadow-xl border-l-4 p-4 max-w-md ${config[finalType].border}`);
    toastTitle.text(title || 'Informação');
    toastMessage.text(message || '');
    toast.removeClass('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
      this._toastTimer = null;
    }, 3500);
  },

  normalizeDateTimeToInputValue: function (rawText) {
    const text = this.asText(rawText);
    if (!text) return '';

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) {
      return text;
    }

    const isoSpace = text.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2})?$/);
    if (isoSpace) {
      return `${isoSpace[1]}T${isoSpace[2]}`;
    }

    const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*|\s+)(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (br) {
      return `${br[3]}-${br[2]}-${br[1]}T${br[4]}:${br[5]}`;
    }

    try {
      const parsed = new Date(text);
      if (!isNaN(parsed.getTime())) {
        return this.buildDateTimeLocalValue(parsed);
      }
    } catch (e) {}

    return '';
  },

  buildDateTimeLocalValue: function (date) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  },

  formatDateTimeForCard: function (inputDateTimeLocal) {
    const text = this.asText(inputDateTimeLocal);
    if (!text) return '';

    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) return text;

    const year = match[1];
    const month = match[2];
    const day = match[3];
    const hour = match[4];
    const minute = match[5];

    return `${day}/${month}/${year} - ${hour}:${minute}`;
  },

  parseTableJson: function (value) {
    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

    return String(value).trim();
  },

  escapeHtml: function (value) {
    return this.asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
