const dpGlpiErrorTreatmentController = {
  _eventNamespace: '.dpGlpiErrorTreatment',
  _datasetId: 'dsGetDesenvolvimentoProjetos',
  _baseFields: [
    'documentid',
    'statusIntegracaoGLPI',
    'mensagemErroGLPI',
    'forcarErroGLPI'
  ],
  _headerBackup: null,
  _toastTimer: null,
  _state: {
    documentId: null,
    processInstanceId: null,
    currentActivity: null,
    contextController: null,
    isSubmitting: false
  },

  load: async function (params = {}) {
    this.destroy();

    this._state.documentId = params && params.documentId ? String(params.documentId) : null;
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : null;
    this._state.currentActivity = gpGlpiErrorContext.resolveCurrentActivity(params);
    const context = this.getContextConfig();

    try {
      this._state.contextController = await gpGlpiErrorContext.render({
        params: params,
        contextController: context.controller,
        contextActivity: context.activity,
        contextLabel: context.label,
        errorTemplateUrl: this.getTemplateUrl()
      });

      this.backupAndSetHeader();
      this.bindEvents();
      await this.loadBaseContext();
    } catch (error) {
      console.error('GLPI error treatment page load error:', error);
      this.getContainer().html('<div class="p-6 text-red-600">Failed to load GLPI error treatment page.</div>');
    }
  },

  destroy: function () {
    const contextController = this._state.contextController;

    this.unbindEvents();
    this.restoreHeader();

    if (contextController && typeof contextController.destroy === 'function') {
      try {
        contextController.destroy();
      } catch (error) {
        console.error('[dpGlpiErrorTreatment] Context destroy error:', error);
      }
    }

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }

    this._state.documentId = null;
    this._state.processInstanceId = null;
    this._state.currentActivity = null;
    this._state.contextController = null;
    this._state.isSubmitting = false;
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/desenvolvimento-projetos/dp-glpi-error-treatment.html`;
  },

  getContainer: function () {
    return $('#page-container');
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
      titleEl.text('TI - Tratar Erro Integracao GLPI');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Tratar Erro GLPI</span>
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

  bindEvents: function () {
    const container = this.getContainer();
    const ns = this._eventNamespace;

    this.unbindEvents();

    container.on(`click${ns}`, '[data-action="send-task"]', (event) => {
      event.preventDefault();
      this.submitTask();
    });
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
  },

  getContextConfig: function () {
    if (this._state.currentActivity === 52) {
      return {
        controller: projectTiValidationController,
        activity: 32,
        label: 'Validacao do Projeto Ambiente QA - TI'
      };
    }

    return {
      controller: projectPlanningController,
      activity: 14,
      label: 'Planejamento do Projeto'
    };
  },

  loadBaseContext: async function () {
    if (!this._state.documentId) {
      this.showToast('Sem projeto', 'Nenhum documentId foi informado para esta rota.', 'warning');
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

      if (!row) {
        this.showToast('Nao encontrado', 'Nao foi possivel localizar os dados deste projeto.', 'warning');
        return;
      }

      this.fillFormFromRow(row);
    } catch (error) {
      console.error('[dpGlpiErrorTreatment] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Nao foi possivel carregar os dados da etapa de erro GLPI.', 'error');
    }
  },

  fillFormFromRow: function (row) {
    const isForcedGlpiTest = gpGlpiErrorContext.isForcedGlpiTestRow(row);
    let status = this.firstFilledValue([
      row.statusIntegracaoGLPI,
      row.statusintegracaoglpi,
      row.statusGLPI,
      row.statusglpi,
      row.status
    ]);

    let message = this.firstFilledValue([
      row.mensagemErroGLPI,
      row.mensagemerroglpi,
      row.mensagemErroGlpi,
      row.mensagem,
      row.msgRetornoGLPI
    ]);

    if (isForcedGlpiTest) {
      status = status || 'ERROR';
      message = message || gpGlpiErrorContext.getForcedGlpiTestMessage();
    }

    this.getContainer().find('#glpi-status-input').val(status);
    this.getContainer().find('#glpi-error-message-input').val(message);
  },

  firstFilledValue: function (values) {
    for (let index = 0; index < values.length; index += 1) {
      const finalValue = this.asText(values[index]);
      if (finalValue) {
        return finalValue;
      }
    }

    return '';
  },

  resolveProcessInstanceId: async function () {
    if (this._state.processInstanceId) {
      return this._state.processInstanceId;
    }

    if (!this._state.documentId) {
      throw new Error('Nao foi possivel identificar o projeto atual');
    }

    const processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(this._state.documentId);
    this._state.processInstanceId = this.asText(processInstanceId);
    return this._state.processInstanceId;
  },

  collectTaskFields: function () {
    return [
      {
        name: 'statusIntegracaoGLPI',
        value: this.asText(this.getContainer().find('#glpi-status-input').val())
      },
      {
        name: 'mensagemErroGLPI',
        value: this.asText(this.getContainer().find('#glpi-error-message-input').val())
      }
    ];
  },

  getNextState: function () {
    return this._state.currentActivity === 52 ? 36 : 12;
  },

  createActionLoading: function () {
    if (typeof modalLoadingService !== 'undefined' && modalLoadingService.show) {
      return modalLoadingService.show({
        title: 'Movendo projeto',
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

  submitTask: async function () {
    if (this._state.isSubmitting) return;

    const sendButton = this.getContainer().find('[data-action="send-task"]').first();
    const loading = this.createActionLoading();
    this._state.isSubmitting = true;
    sendButton.prop('disabled', true).addClass('opacity-60 cursor-not-allowed');

    try {
      loading.updateMessage('Preparando movimentacao...');
      await this.waitForUiPaint();
      const processInstanceId = await this.resolveProcessInstanceId();
      const taskFields = this.collectTaskFields();

      loading.updateMessage('Enviando para a proxima atividade...');
      await this.waitForUiPaint();
      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: this.getNextState(),
        documentId: this._state.documentId,
        datasetName: 'DSFormDesenvolvimentoProjetos'
      }, taskFields);

      this.showToast('Sucesso', 'Projeto enviado para Integracao GLPI.', 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[dpGlpiErrorTreatment] Error moving task:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Nao foi possivel movimentar o projeto.', 'error');
    } finally {
      this._state.isSubmitting = false;
      sendButton.prop('disabled', false).removeClass('opacity-60 cursor-not-allowed');
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

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

    return String(value).trim();
  }
};
