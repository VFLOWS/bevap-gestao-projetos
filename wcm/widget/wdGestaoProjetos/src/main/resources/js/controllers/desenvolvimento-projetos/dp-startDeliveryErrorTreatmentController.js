const dpStartDeliveryErrorTreatmentController = {
  _eventNamespace: '.dpStartDeliveryErrorTreatment',
  _datasetId: 'dsGetDesenvolvimentoProjetos',
  _baseFields: [
    'documentid',
    'erroIniciarEntregaMsg',
    'erroIniciarEntregaProc',
    'erroIniciarExecucaoMsg',
    'erroIniciarExecucaoIdx',
    'forcarErroGLPI'
  ],
  _headerBackup: null,
  _toastTimer: null,
  _state: {
    documentId: null,
    processInstanceId: null,
    contextController: null,
    isSubmitting: false
  },

  load: async function (params = {}) {
    this.destroy();

    this._state.documentId = params && params.documentId ? String(params.documentId) : null;
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : null;

    try {
      this._state.contextController = await gpGlpiErrorContext.render({
        params: params,
        contextController: projectFinalController,
        contextActivity: 38,
        contextLabel: 'Execucao de Projeto Finalizada',
        errorTemplateUrl: this.getTemplateUrl()
      });

      this.backupAndSetHeader();
      this.bindEvents();
      await this.loadBaseContext();
    } catch (error) {
      console.error('Start delivery error treatment page load error:', error);
      this.getContainer().html('<div class="p-6 text-red-600">Failed to load start delivery error treatment page.</div>');
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
        console.error('[dpStartDeliveryErrorTreatment] Context destroy error:', error);
      }
    }

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }

    this._state.documentId = null;
    this._state.processInstanceId = null;
    this._state.contextController = null;
    this._state.isSubmitting = false;
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/desenvolvimento-projetos/dp-start-delivery-error-treatment.html`;
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
      titleEl.text('TI - Tratar Erro Iniciar Entrega Projeto');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Tratar Erro Iniciar Entrega</span>
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

    container.on(`click${ns}`, '[data-action="return-to-55"]', (event) => {
      event.preventDefault();
      this.submitTask();
    });
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
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
      console.error('[dpStartDeliveryErrorTreatment] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Nao foi possivel carregar os dados da etapa de erro.', 'error');
    }
  },

  fillFormFromRow: function (row) {
    const isForcedGlpiTest = gpGlpiErrorContext.isForcedGlpiTestRow(row);
    let processReturn = this.firstFilledValue([
      row.erroIniciarEntregaProc,
      row.erroiniciarentregaproc,
      row.erroIniciarExecucaoIdx,
      row.erroiniciarexecucaoidx
    ]);

    let message = this.firstFilledValue([
      row.erroIniciarEntregaMsg,
      row.erroiniciarentregamsg,
      row.erroIniciarExecucaoMsg,
      row.erroiniciarexecucaomsg,
      row.erroMsg,
      row.erro
    ]);

    if (isForcedGlpiTest) {
      processReturn = processReturn || 'forcarErroGLPI=1';
      message = message || gpGlpiErrorContext.getForcedGlpiTestMessage();
    }

    this.getContainer().find('#start-delivery-error-proc').val(processReturn);
    this.getContainer().find('#start-delivery-error-msg').val(message);
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
        name: 'erroIniciarEntregaMsg',
        value: this.asText(this.getContainer().find('#start-delivery-error-msg').val())
      },
      {
        name: 'erroIniciarEntregaProc',
        value: this.asText(this.getContainer().find('#start-delivery-error-proc').val())
      }
    ];
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

    const sendButton = this.getContainer().find('[data-action="return-to-55"]').first();
    const loading = this.createActionLoading();
    this._state.isSubmitting = true;
    sendButton.prop('disabled', true).addClass('opacity-60 cursor-not-allowed');

    try {
      loading.updateMessage('Preparando movimentacao...');
      await this.waitForUiPaint();
      const processInstanceId = await this.resolveProcessInstanceId();
      const taskFields = this.collectTaskFields();

      loading.updateMessage('Enviando para a atividade 55...');
      await this.waitForUiPaint();
      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 55,
        documentId: this._state.documentId,
        datasetName: 'DSFormDesenvolvimentoProjetos'
      }, taskFields);

      this.showToast('Sucesso', 'Projeto enviado para Iniciar Entrega.', 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[dpStartDeliveryErrorTreatment] Error moving task:', error);
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

window.dpStartDeliveryErrorTreatmentController = dpStartDeliveryErrorTreatmentController;
