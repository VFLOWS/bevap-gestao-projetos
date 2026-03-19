const immediateApprovalController = {
  _eventNamespace: '.immediateApproval',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _baseFields: [
    'documentid',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'patrocinadorNS',
    'prioridadeNS',
    'estadoProcesso',
    'anexosNS',
    'disponibilidadedaEquipeSI',
    'recursosNecessariosAreaSI',
    'conflitosdeAgendaSI',
    'prioridadeparaaAreaSI',
    'observacoesdoGestorSI',
    'equipepossuiDisponibilidadeSI',
    'recursosNecessIdentSI',
    'naoHaConflitosCriticosSI',
    'projetoAlinhadoPrioridadesSI'
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

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.renderSidebarSkeleton();
        this.initializeTabs();
        this.bindEvents();
        this.updateCapacityLabel();
        this.updateChecklistProgress();
        this.loadReadOnlyTab('solicitacao');
        this.loadBaseContext();
      })
      .fail((error) => {
        console.error('Immediate approval template load error:', error);
        container.html('<div class="p-6 text-red-600">Failed to load immediate approval page.</div>');
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
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-immediate-approval.html`;
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
      titleEl.text('Immediate Manager - Approve Project');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Immediate Approval</span>
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

    container.on(`input${ns} change${ns}`, '#team-availability-input', (event) => {
      this.updateCapacityLabel($(event.currentTarget).val());
    });

    container.on(`change${ns}`, '.impacto-checklist-item', () => {
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
        choosedState: 21,
        decisionField: 'decisaoSuperiorImediato',
        decisionValue: 'aprovado',
        successMessage: 'Projeto aprovado e encaminhado para a proxima etapa'
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-return"]', (event) => {
      event.preventDefault();
      this.handleTaskAction({
        modalId: 'modal-return',
        choosedState: 21,
        decisionField: 'decisaoSuperiorImediato',
        decisionValue: 'correcao',
        successMessage: 'Projeto devolvido para correcao'
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-reject"]', (event) => {
      event.preventDefault();
      this.handleTaskAction({
        modalId: 'modal-reject',
        choosedState: 21,
        decisionField: 'decisaoSuperiorImediato',
        decisionValue: 'cancelado',
        successMessage: 'Projeto reprovado'
      });
    });

    container.on(`click${ns}`, '[data-action="show-timeline"]', (event) => {
      event.preventDefault();
      this.showToast('Linha do tempo', 'Visualizacao de historico ainda nao implementada.', 'info');
    });

    container.on(`click${ns}`, '[data-action="show-attachments"]', (event) => {
      event.preventDefault();
      this.showToast('Anexos', 'Visualizacao de anexos ainda nao implementada.', 'info');
    });

    container.on(`click${ns}`, '[data-action="view-attachment"]', (event) => {
      event.preventDefault();
      const attachmentName = String($(event.currentTarget).attr('data-attachment-name') || '').trim();
      const message = attachmentName ? `Abrindo ${attachmentName}...` : 'Visualizacao de anexo ainda nao implementada.';
      this.showToast('Anexo', message, 'info');
    });

    container.on(`click${ns}`, '#approve-modal, #modal-return, #modal-reject', (event) => {
      if (event.target !== event.currentTarget) return;
      $(event.currentTarget).addClass('hidden');
    });
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
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

      this.fillImmediateFieldsFromRow(row);
      this.renderSidebarFromRow(row);
      this.updateApproveModalProject(row);
    } catch (error) {
      console.error('[immediateApproval] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Nao foi possivel carregar os dados principais da solicitacao.', 'error');
    }
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
      this.mountAttachmentsInTab(tabName, target, component);
    } catch (error) {
      console.error(`[immediateApproval] Error loading tab ${tabName}:`, error);
      target.html('<div class="text-sm text-red-600">Nao foi possivel carregar esta aba.</div>');
    }
  },

  mountAttachmentsInTab: function (tabName, tabRootEl, solicitationHistoryComponent) {
    if (String(tabName || '') !== 'solicitacao') return;

    if (solicitationHistoryComponent && typeof solicitationHistoryComponent.mountAttachments === 'function') {
      solicitationHistoryComponent.mountAttachments(tabRootEl, {
        documentId: this._state.documentId
      });
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

  getReadOnlyTabConfig: function (tabName) {
    const configMap = {
      solicitacao: {
        key: 'solicitationHistory',
        mount: 'tab-solicitacao-history'
      },
      'analise-ti': {
        key: 'tiAnalysisHistory',
        mount: 'tab-analise-ti-history'
      }
    };

    return configMap[tabName] || null;
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
        badgeClasses: 'bg-yellow-100 text-yellow-800'
      }
    });

    ui.sidebar.renderProgress(progressTarget, {
      items: this.getProgressItems()
    });
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitacao recebida', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Analise TI concluida', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Impacto na area pendente', iconClass: 'fa-solid fa-exclamation-circle' }
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

  updateCapacityLabel: function (value) {
    const input = this.getContainer().find('#team-availability-input').first();
    const display = this.getContainer().find('#capacity-value').first();
    if (!input.length || !display.length) return;

    const finalValue = value === null || value === undefined || value === '' ? String(input.val() || '0') : String(value);
    display.text(`${finalValue}%`);
  },

  updateChecklistProgress: function () {
    const root = this.getContainer().find('#tab-content-checklist');
    if (!root.length) return;

    const items = root.find('.impacto-checklist-item');
    const checked = items.filter(':checked').length;
    const percentage = items.length ? Math.round((checked / items.length) * 100) : 0;

    this.getContainer().find('#impacto-checklist-percentage').text(`${percentage}%`);
    this.getContainer().find('#impacto-checklist-progress').css('width', `${percentage}%`);
  },

  fillImmediateFieldsFromRow: function (row) {
    const root = this.getContainer();
    const setValue = (selector, value) => {
      const field = root.find(selector).first();
      if (field.length) {
        field.val(this.asText(value));
      }
    };
    const setChecked = (selector, value) => {
      const field = root.find(selector).first();
      if (field.length) {
        field.prop('checked', this.asText(value) === 'true');
      }
    };

    setValue('#team-availability-input', row.disponibilidadedaEquipeSI);
    this.updateCapacityLabel(row.disponibilidadedaEquipeSI);
    setValue('#required-resources-input', row.recursosNecessariosAreaSI);
    setValue('#schedule-conflicts-input', row.conflitosdeAgendaSI);
    setValue('#manager-observations-input', row.observacoesdoGestorSI);

    root.find('input[name="area-priority"]').prop('checked', false).filter((index, element) => {
      return this.asText($(element).val()) === this.asText(row.prioridadeparaaAreaSI);
    }).first().prop('checked', true);

    setChecked('#team-available-check', row.equipepossuiDisponibilidadeSI);
    setChecked('#resources-identified-check', row.recursosNecessIdentSI);
    setChecked('#conflicts-clear-check', row.naoHaConflitosCriticosSI);
    setChecked('#aligned-priorities-check', row.projetoAlinhadoPrioridadesSI);
    this.updateChecklistProgress();
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
    toast.attr('class', `fixed top-20 right-4 bg-white rounded-lg shadow-xl border-l-4 p-4 z-50 max-w-sm ${config[finalType].border}`);
    toastTitle.text(title || 'Informacao');
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
        title: 'Movendo solicitacao',
        message: 'Aguarde enquanto a tarefa e enviada ao Fluig...'
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

  getBooleanFieldValue: function (selector) {
    return this.getContainer().find(selector).is(':checked') ? 'true' : 'false';
  },

  collectImmediateCardData: function (decisionField, decisionValue) {
    const root = this.getContainer();
    const cardData = {
      disponibilidadedaEquipeSI: this.asText(root.find('#team-availability-input').val()),
      recursosNecessariosAreaSI: this.asText(root.find('#required-resources-input').val()),
      conflitosdeAgendaSI: this.asText(root.find('#schedule-conflicts-input').val()),
      prioridadeparaaAreaSI: this.asText(root.find('input[name="area-priority"]:checked').val()),
      observacoesdoGestorSI: this.asText(root.find('#manager-observations-input').val()),
      equipepossuiDisponibilidadeSI: this.getBooleanFieldValue('#team-available-check'),
      recursosNecessIdentSI: this.getBooleanFieldValue('#resources-identified-check'),
      naoHaConflitosCriticosSI: this.getBooleanFieldValue('#conflicts-clear-check'),
      projetoAlinhadoPrioridadesSI: this.getBooleanFieldValue('#aligned-priorities-check')
    };

    if (decisionField) {
      cardData[decisionField] = decisionValue;
    }
    return cardData;
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho da aprovacao...');
      await this.waitForUiPaint();
      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        cardData: this.collectImmediateCardData()
      });
      this.showToast('Rascunho salvo', 'As alteracoes foram salvas com sucesso.', 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 150);
    } catch (error) {
      console.error('[immediateApproval] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Nao foi possivel salvar o rascunho.', 'error');
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
      throw new Error('Nao foi possivel identificar a solicitacao atual');
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
      const cardData = this.collectImmediateCardData(config.decisionField, config.decisionValue);
      const taskFields = Object.keys(cardData).map((fieldName) => {
        return {
          name: fieldName,
          value: cardData[fieldName]
        };
      });

      loading.updateMessage('Enviando movimentacao para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: config.choosedState,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos'
      }, taskFields);

      this.closeModal(config.modalId);
      this.showToast('Sucesso', config.successMessage, 'success');

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[immediateApproval] Error moving task:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Nao foi possivel movimentar a solicitacao.', 'error');
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
    } catch (error) {}

    return text.split(/\r?\n|;|,/).map((item) => this.asText(item)).filter(Boolean).length;
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

    return String(value).trim();
  }
};
