const requesterProposalApprovalController = {
  _eventNamespace: '.requesterProposalApproval',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _baseFields: [
    'documentid',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'patrocinadorNS',
    'prioridadeNS',
    'fornecedorRecomendadoTITT',
    'nomeFornecedorTIPC',
    'valortotalTIPC',
    'prazoEstimadoTIPC',
    'estadoProcesso',
    'anexosNS',
    'anexosPropostaTIPC',
    'observacoesNegociacaoSAP',
    'liConcordoPropostaComercialSAP'
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
    isSubmitting: false
  },

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();

    this._state.documentId = params && params.documentId ? String(params.documentId) : null;
    this._state.estadoProcesso = params && params.estadoProcesso ? String(params.estadoProcesso) : null;
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : null;

    const initialTab = this.normalizeTabParam(params && params.tab ? String(params.tab) : '');
    this._state.currentTab = initialTab || 'solicitacao';

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.renderSidebarSkeleton();
        this.initializeTabs(this._state.currentTab);
        this.bindEvents();
        this.loadReadOnlyTab(this._state.currentTab);
        this.loadBaseContext();
      })
      .fail((error) => {
        console.error('[requesterProposalApproval] Template load error:', error);
        container.html('<div class="p-6 text-red-600">Falha ao carregar a tela de aprovação da proposta.</div>');
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
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-requester-proposal-approval.html`;
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
      titleEl.text('Solicitante - Aprovar Proposta Comercial');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Aprovar Proposta</span>
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

    container.on(`click${ns}`, '[data-action="open-approve-modal"]', (event) => {
      event.preventDefault();
      this.openModal('approve-modal');
    });

    container.on(`click${ns}`, '[data-action="open-return-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-return');
    });

    container.on(`click${ns}`, '[data-action="open-discontinue-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-discontinue');
    });

    container.on(`click${ns}`, '[data-action="close-modal"]', (event) => {
      event.preventDefault();
      const modalId = String($(event.currentTarget).attr('data-modal-id') || '').trim();
      if (!modalId) return;
      this.closeModal(modalId);
    });

    container.on(`click${ns}`, '[data-action="confirm-approve"]', (event) => {
      event.preventDefault();
      this.handleApprove();
    });

    container.on(`click${ns}`, '[data-action="confirm-return"]', (event) => {
      event.preventDefault();
      this.handleReturn();
    });

    container.on(`click${ns}`, '[data-action="confirm-discontinue"]', (event) => {
      event.preventDefault();
      this.handleDiscontinue();
    });

    container.on(`click${ns}`, '#approve-modal, #modal-return, #modal-discontinue', (event) => {
      if (event.target !== event.currentTarget) return;
      $(event.currentTarget).addClass('hidden');
    });
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

  showToast: function (title, message, type = 'info') {
    const container = this.getContainer();
    const toast = container.find('#toast');
    if (!toast.length) return;

    const icon = toast.find('#toast-icon');
    const titleEl = toast.find('#toast-title');
    const messageEl = toast.find('#toast-message');

    toast.removeClass('hidden');
    toast.removeClass('border-green-500 border-red-500 border-yellow-500 border-blue-500');
    icon.removeClass('text-green-500 text-red-500 text-yellow-500 text-blue-500 fa-check-circle fa-times-circle fa-exclamation-circle fa-info-circle');

    if (type === 'success') {
      toast.addClass('border-green-500');
      icon.addClass('fa-solid fa-check-circle text-green-500');
    } else if (type === 'error') {
      toast.addClass('border-red-500');
      icon.addClass('fa-solid fa-times-circle text-red-500');
    } else if (type === 'warning') {
      toast.addClass('border-yellow-500');
      icon.addClass('fa-solid fa-exclamation-circle text-yellow-500');
    } else {
      toast.addClass('border-blue-500');
      icon.addClass('fa-solid fa-info-circle text-blue-500');
    }

    titleEl.text(this.asText(title));
    messageEl.text(this.asText(message));

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
    }

    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
    }, 5500);
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
      customRows: [
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

    ui.sidebar.renderProgress(progressTarget, { items: this.getProgressItems() });
  },

  loadBaseContext: async function () {
    if (!this._state.documentId) {
      this.showToast('Sem solicitacao', 'Nenhum documentId foi informado para esta rota.', 'warning');
      return;
    }

    try {
      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields: this._baseFields,
        filters: {
          documentid: this._state.documentId
        }
      });

      const row = rows && rows.length ? rows[0] : null;
      this._state.baseRow = row;

      if (!row) {
        this.renderSidebarSkeleton();
        return;
      }

      this.renderSidebarFromRow(row);
      this.fillSapFieldsFromRow(row);
      this.updateApproveModalProject(row);
    } catch (error) {
      console.error('[requesterProposalApproval] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Nao foi possivel carregar os dados principais da solicitacao.', 'error');
    }
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
      requester: 'Solicitante',
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
          variant: 'block',
          label: 'Fornecedor Recomendado',
          value: this.asText(row.fornecedorRecomendadoTITT) || 'Nao informado'
        },
        {
          variant: 'kvList',
          label: 'Estimativa Original',
          items: [
            { label: 'Custo:', value: this.asText(row.valortotalTIPC) || 'Nao informado' },
            { label: 'Prazo:', value: this.asText(row.prazoEstimadoTIPC) || 'Nao informado' }
          ]
        }
      ],
      status: {
        label: this.getEstadoProcessoLabel(row.estadoProcesso) || 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-gray-100 text-gray-800'
      }
    });

    ui.sidebar.renderProgress(progressTarget, { items: this.getProgressItems() });
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitação aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Análise TI concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Impacto na área concluído', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Triagem técnica (Externo)', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Proposta comercial validada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Aprovação do solicitante', iconClass: 'fa-solid fa-exclamation-circle' }
    ];
  },

  fillSapFieldsFromRow: function (row) {
    const root = this.getContainer();
    root.find('#sap-feedback-input').val(this.asText(row.observacoesNegociacaoSAP));

    const liValue = this.asText(row.liConcordoPropostaComercialSAP)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const checked = ['true', '1', 'sim', 'yes', 'on'].indexOf(liValue) >= 0;
    root.find('#sap-li-concordo-check').prop('checked', checked);
  },

  updateApproveModalProject: function (row) {
    const label = [this.asText(row.documentid), this.asText(row.titulodoprojetoNS)].filter(Boolean).join(' • ');
    this.getContainer().find('#approve-project-label').text(label || 'Projeto selecionado');
  },

  getReadOnlyTabConfig: function (tabName) {
    const configMap = {
      solicitacao: { key: 'solicitationHistory', mount: 'tab-solicitacao-history' },
      'analise-ti': { key: 'tiAnalysisHistory', mount: 'tab-analise-ti-history' },
      impacto: { key: 'areaImpactHistory', mount: 'tab-impacto-history' },
      'triagem-ti': { key: 'tiTriageHistory', mount: 'tab-triagem-ti-history' },
      'proposta-fornecedor': { key: 'supplierProposal', mount: 'tab-proposta-fornecedor' }
    };

    return configMap[tabName] || null;
  },

  normalizeTabParam: function (tabParam) {
    const raw = this.asText(tabParam);
    if (!raw) return '';

    const normalized = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const allowList = {
      solicitacao: 'solicitacao',
      'analise-ti': 'analise-ti',
      analise: 'analise-ti',
      impacto: 'impacto',
      'triagem-ti': 'triagem-ti',
      triagem: 'triagem-ti',
      'proposta-fornecedor': 'proposta-fornecedor',
      proposta: 'proposta-fornecedor'
    };

    return allowList[normalized] || '';
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
      this.mountAttachmentsInTab(target, component);
      return;
    }

    if (!component || typeof component.render !== 'function') {
      target.html('<div class="text-sm text-red-600">Componente da aba indisponivel.</div>');
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteudo...</div>');

    try {
      const html = await component.render({
        documentId: this._state.documentId
      });

      this._state.historyCache[tabName] = html;
      target.html(html);
      this.mountAttachmentsInTab(target, component);
    } catch (error) {
      console.error(`[requesterProposalApproval] Error loading tab ${tabName}:`, error);
      target.html('<div class="text-sm text-red-600">Nao foi possivel carregar esta aba.</div>');
    }
  },

  mountAttachmentsInTab: function (tabRootEl, component) {
    if (component && typeof component.mountAttachments === 'function') {
      try {
        component.mountAttachments($(tabRootEl), {
          documentId: this._state.documentId
        });
      } catch (e) {}
    }

    const ui = this.getUiComponents();
    if (!ui || !ui.attachments || typeof ui.attachments.render !== 'function') return;

    const $root = $(tabRootEl);
    if (!$root.length) return;

    $root.find('[data-gp-attachments]').each((_, el) => {
      const $el = $(el);
      if ($el.data('gpAttachmentsMounted')) return;
      $el.data('gpAttachmentsMounted', true);

      const fieldName = String($el.attr('data-field') || '').trim() || 'anexosNS';
      ui.attachments.render($el, {
        documentId: this._state.documentId,
        fieldName: fieldName
      });
    });
  },

  collectSapCardData: function (overrideObservations) {
    const root = this.getContainer();
    const obs = overrideObservations !== undefined
      ? this.asText(overrideObservations)
      : this.asText(root.find('#sap-feedback-input').val());

    const checked = root.find('#sap-li-concordo-check').is(':checked');

    return {
      observacoesNegociacaoSAP: obs,
      liConcordoPropostaComercialSAP: checked ? 'true' : 'false'
    };
  },

  collectApproveCardData: function () {
    const root = this.getContainer();
    const obs = this.asText(root.find('#sap-feedback-input').val());

    return {
      observacoesNegociacaoSAP: obs,
      liConcordoPropostaComercialSAP: 'true',
      decisaoPropostaSAP: 'aprovado',
      justificativaPropostaSAP: '',
      categoriajustiPropostaSAP: ''
    };
  },

  collectReturnCardData: function (reason) {
    return {
      observacoesNegociacaoSAP: this.collectSapCardData().observacoesNegociacaoSAP,
      liConcordoPropostaComercialSAP: 'false',
      decisaoPropostaSAP: 'correcao',
      justificativaPropostaSAP: this.asText(reason),
      categoriajustiPropostaSAP: ''
    };
  },

  collectDiscontinueCardData: function (category, reason) {
    return {
      observacoesNegociacaoSAP: this.collectSapCardData().observacoesNegociacaoSAP,
      liConcordoPropostaComercialSAP: 'false',
      decisaoPropostaSAP: 'cancelado',
      justificativaPropostaSAP: this.asText(reason),
      categoriajustiPropostaSAP: this.asText(category)
    };
  },

  createActionLoading: function () {
    if (typeof modalLoadingService !== 'undefined' && modalLoadingService && typeof modalLoadingService.show === 'function') {
      return modalLoadingService.show({
        title: 'Enviando',
        message: 'Aguarde enquanto a tarefa e enviada ao Fluig...'
      });
    }

    const legacyLoading = FLUIGC.loading(this.getContainer());
    legacyLoading.show();

    return {
      hide: function () {
        legacyLoading.hide();
      },
      updateMessage: function () { }
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

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho...');
      await this.waitForUiPaint();

      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        cardData: this.collectSapCardData()
      });

      this.showToast('Rascunho salvo', 'As alteracoes foram salvas com sucesso.', 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 150);
    } catch (error) {
      console.error('[requesterProposalApproval] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Nao foi possivel salvar o rascunho.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  handleApprove: async function () {
    if (this._state.isSubmitting) return;

    const root = this.getContainer();
    if (!root.find('#sap-li-concordo-check').is(':checked')) {
      this.showToast('Confirmacao', 'Marque o checkbox "Li e concordo" para aprovar a proposta.', 'warning');
      return;
    }

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Preparando dados...');
      await this.waitForUiPaint();

      const processInstanceId = await this.resolveProcessInstanceId();
      const cardData = this.collectApproveCardData();
      const taskFields = Object.keys(cardData).map((fieldName) => {
        return { name: fieldName, value: cardData[fieldName] };
      });

      loading.updateMessage('Enviando aprovacao para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 42,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos'
      }, taskFields);

      this.closeModal('approve-modal');
      this.showToast('Sucesso', 'Proposta aprovada.', 'success');

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[requesterProposalApproval] Error approving proposal:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Nao foi possivel aprovar a proposta.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  handleReturn: async function () {
    if (this._state.isSubmitting) return;

    const root = this.getContainer();
    const reason = this.asText(root.find('#return-reason-input').val());
    if (!reason) {
      this.showToast('Motivo', 'Informe o motivo da devolucao.', 'warning');
      root.find('#return-reason-input').trigger('focus');
      return;
    }

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Preparando devolucao...');
      await this.waitForUiPaint();

      const processInstanceId = await this.resolveProcessInstanceId();
      const cardData = this.collectReturnCardData(reason);
      const taskFields = Object.keys(cardData).map((fieldName) => {
        return { name: fieldName, value: cardData[fieldName] };
      });

      loading.updateMessage('Enviando devolucao para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 42,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos'
      }, taskFields);

      this.closeModal('modal-return');
      this.showToast('Sucesso', 'Devolvido para correcao.', 'success');

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[requesterProposalApproval] Error returning proposal:', error);
      this.showToast('Erro ao devolver', error && error.message ? error.message : 'Nao foi possivel devolver para correcao.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  handleDiscontinue: async function () {
    if (this._state.isSubmitting) return;

    const root = this.getContainer();
    const category = this.asText(root.find('#discontinue-category-input').val());
    if (!category) {
      this.showToast('Categoria', 'Selecione a categoria da nao continuidade.', 'warning');
      root.find('#discontinue-category-input').trigger('focus');
      return;
    }

    const reason = this.asText(root.find('#discontinue-reason-input').val());
    if (!reason) {
      this.showToast('Justificativa', 'Informe a justificativa da nao continuidade.', 'warning');
      root.find('#discontinue-reason-input').trigger('focus');
      return;
    }

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Preparando nao continuidade...');
      await this.waitForUiPaint();

      const processInstanceId = await this.resolveProcessInstanceId();
      const cardData = this.collectDiscontinueCardData(category, reason);
      const taskFields = Object.keys(cardData).map((fieldName) => {
        return { name: fieldName, value: cardData[fieldName] };
      });

      loading.updateMessage('Enviando nao continuidade para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 42,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos'
      }, taskFields);

      this.closeModal('modal-discontinue');
      this.showToast('Sucesso', 'Nao continuidade registrada.', 'success');

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[requesterProposalApproval] Error discontinuing project:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Nao foi possivel registrar a nao continuidade.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
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
      if (Array.isArray(parsed)) {
        return parsed.length;
      }
    } catch (error) { }

    return text.split(/\r?\n|;|,/).map((item) => this.asText(item)).filter(Boolean).length;
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

    return String(value).trim();
  }
};
