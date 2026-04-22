function createCorrectionState() {
  return {
    currentStep: 1,
    numSolicitacao: "",
    documentId: "",
    processInstanceId: "",
    isSubmitting: false,
    attachments: [],
    tagFilters: {},
    tagFilterConfigs: [],
    pendingTagFilterSync: {},
    lastColigadaCode: ''
  };
}

function cloneCorrectionConstants(baseConstants) {
  return {
    requiredFields: (baseConstants && baseConstants.requiredFields ? baseConstants.requiredFields : []).slice(),
    completionFields: (baseConstants && baseConstants.completionFields ? baseConstants.completionFields : []).slice(),
    requiredFieldLabels: Object.assign({}, baseConstants && baseConstants.requiredFieldLabels),
    checklistSections: (baseConstants && baseConstants.checklistSections ? baseConstants.checklistSections : []).map(function (section) {
      return {
        step: section.step,
        fields: Array.isArray(section.fields) ? section.fields.slice() : []
      };
    })
  };
}

const correctionController = Object.create(newSolicitationController);

Object.assign(correctionController, {
  _eventNamespace: '.correction',
  _state: createCorrectionState(),
  _draftFields: Array.isArray(newSolicitationController._draftFields)
    ? newSolicitationController._draftFields.slice()
    : [],
  _constants: cloneCorrectionConstants(newSolicitationController._constants),
  _headerBackup: null,

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();
    this._state.documentId = params && params.documentId ? String(params.documentId) : "";
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : "";

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.applyCorrectionTexts();
        this.initializePage();
      })
      .fail((error) => {
        console.error('Correction template load error:', error);
        container.html('<div class="p-6 text-red-600">Failed to load correction page.</div>');
      });
  },

  destroy: function () {
    newSolicitationController.destroy.call(this);
    this.restoreHeader();
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
      titleEl.text('Solicitante - Corrigir Solicitacao');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Correcao</span>
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

  applyCorrectionTexts: function () {
    const container = this.getContainer();

    container.find('#summary-card-title').first().html(`
      <i class="fa-solid fa-clipboard-check mr-2 text-bevap-gold"></i>
      Resumo da Correcao
    `);

    container.find('#context-tip-title').first().text('Correcao');
    container.find('#context-tip-message').first().text('Revise os campos solicitados, ajuste as informacoes necessarias e reenvie a correcao para nova avaliacao da TI.');

    container.find('#submit-form-button').first().html('<i class="fa-solid fa-paper-plane mr-2"></i> Enviar Correcao para Avaliacao TI');
    container.find('[data-action="cancel-form"]').first().attr('data-action', 'open-cancel-modal');

    container.find('#success-modal-title').first().text('Correcao Enviada!');
    container.find('#success-modal-message').first().text('Sua correcao foi enviada com sucesso e retornou para avaliacao da equipe de TI.');
    container.find('#success-modal-next-step').first().text('TI - Avaliar Projeto');

    container.find('#validation-modal-message').first().html('Por favor, preencha todos os campos obrigatorios marcados com <span class="text-red-500 font-semibold">*</span> antes de reenviar sua correcao.');

    if (!container.find('#correction-cancel-modal').length) {
      container.append(`
        <div id="correction-cancel-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 class="text-xl font-montserrat font-bold text-bevap-navy mb-4">Cancelar Solicitacao</h3>
            <p class="text-sm text-gray-600 mb-4">Informe categoria e justificativa para cancelar:</p>
            <select id="correction-cancel-category" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green mb-3">
              <option value="">Selecione a categoria</option>
              <option value="escopo">Escopo</option>
              <option value="orcamento">Orcamento</option>
              <option value="prioridade">Prioridade</option>
              <option value="outro">Outro</option>
            </select>
            <textarea id="correction-cancel-reason" rows="4" placeholder="Descreva o motivo do cancelamento..." class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent resize-none mb-4"></textarea>
            <div class="flex justify-end space-x-3">
              <button data-action="close-cancel-modal" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all">Voltar</button>
              <button data-action="confirm-cancel-correction" class="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all">Confirmar cancelamento</button>
            </div>
          </div>
        </div>
      `);
    }
  },

  bindEvents: function () {
    newSolicitationController.bindEvents.call(this);

    const container = this.getContainer();
    const ns = this._eventNamespace;

    container.on(`click${ns}`, '[data-action="open-cancel-modal"]', (event) => {
      event.preventDefault();
      this.openCancelModal();
    });

    container.on(`click${ns}`, '[data-action="close-cancel-modal"]', (event) => {
      event.preventDefault();
      this.closeCancelModal();
    });

    container.on(`click${ns}`, '[data-action="confirm-cancel-correction"]', (event) => {
      event.preventDefault();
      this.handleCancelAction();
    });

    container.on(`click${ns}`, '#correction-cancel-modal', (event) => {
      if (event.target !== event.currentTarget) return;
      this.closeCancelModal();
    });
  },

  openCancelModal: function () {
    this.getContainer().find('#correction-cancel-modal').removeClass('hidden');
  },

  closeCancelModal: function () {
    this.getContainer().find('#correction-cancel-modal').addClass('hidden');
  },

  updateDraftHash: function () {
    if (!this._state.documentId || !window.history || typeof window.history.replaceState !== 'function') {
      return;
    }

    const nextHash = `#correction?documentId=${encodeURIComponent(this._state.documentId)}`;
    const url = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, '', url);
  },

  loadDraftFromDataset: async function () {
    if (!this._state.documentId) {
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Correcao nao encontrada',
        message: 'Nao foi possivel identificar a solicitacao para correcao.'
      });
      return;
    }

    try {
      const rows = await fluigService.getDatasetRows('dsGetSolicitacaoProjetos', {
        fields: this._draftFields,
        filters: {
          documentid: this._state.documentId
        }
      });

      const row = rows && rows.length ? rows[0] : null;
      if (!row) {
        this.showNotification({
          borderClass: 'border-red-500',
          iconClass: 'fa-triangle-exclamation text-red-500',
          title: 'Correcao nao encontrada',
          message: 'Nao foi possivel localizar os dados salvos desta solicitacao.'
        });
        return;
      }

      this.applyDraftRow(row);
    } catch (error) {
      console.error('[correction] Error loading correction:', error);
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Erro ao carregar correcao',
        message: 'Nao foi possivel carregar os dados salvos desta solicitacao.'
      });
    }
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createSubmitLoading('Salvando correcao', 'Aguarde enquanto a correcao e salva...');
    this._state.isSubmitting = true;

    try {
      if (!this._state.documentId) {
        throw new Error('Nao foi possivel identificar a solicitacao para salvar a correcao.');
      }

      loading.updateMessage('Preparando dados da correcao...');
      await this.waitForUiPaint();
      const payload = await this.buildSubmissionPayload();

      loading.updateMessage('Atualizando correcao em andamento...');
      await this.waitForUiPaint();
      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        cardData: fluigService.buildProjectSolicitationCardData(payload)
      });

      this.writeDraftUiCache(this._state.documentId, payload);

      this.showNotification({
        borderClass: 'border-bevap-green',
        iconClass: 'fa-check-circle text-bevap-green',
        title: 'Correcao salva!',
        message: 'As alteracoes foram salvas com sucesso.'
      });

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 150);
    } catch (error) {
      console.error('[correction] Error saving draft:', error);
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Erro ao salvar correcao',
        message: error && error.message ? error.message : 'Nao foi possivel salvar a correcao.'
      });
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  submitForm: async function () {
    if (this._state.isSubmitting) return;

    const missingFields = this.validateForm();
    if (missingFields.length > 0) {
      this.showValidationModal(missingFields);
      return;
    }

    this.closeValidationModal();

    const loading = this.createSubmitLoading('Enviando correcao', 'Aguarde enquanto a correcao e reenviada ao Fluig...');
    this._state.isSubmitting = true;

    try {
      if (!this._state.documentId) {
        throw new Error('Nao foi possivel identificar a solicitacao para reenviar a correcao.');
      }

      loading.updateMessage('Preparando dados da correcao...');
      await this.waitForUiPaint();
      const payload = await this.buildSubmissionPayload();

      loading.updateMessage('Atualizando rascunho antes do reenvio...');
      await this.waitForUiPaint();
      const processInstanceId = await this.resolveProcessInstanceId();
      const taskFields = this.toTaskFields(fluigService.buildProjectSolicitationCardData(payload));
      taskFields.push({
        name: 'decisaoCorrecao',
        value: 'aprovado'
      });
      taskFields.push({
        name: 'justificativaCorrecao',
        value: ''
      });
      taskFields.push({
        name: 'categoriajustiCorrecao',
        value: ''
      });

      loading.updateMessage('Enviando correcao para avaliacao TI...');
      await this.waitForUiPaint();
      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 85,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos',
        attachments: payload.attachments
      }, taskFields);

      this._state.numSolicitacao = this.asText(processInstanceId);
      this.clearDraftUiCache(this._state.documentId);
      this.getContainer().find('#success-modal').removeClass('hidden');
    } catch (error) {
      console.error('[correction] Error submitting correction:', error);
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Erro ao enviar correcao',
        message: (error && error.message) || String(error || '') || 'Nao foi possivel reenviar a correcao para avaliacao.'
      });
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  cancelForm: async function () {
    this.openCancelModal();
  },

  handleCancelAction: async function () {
    if (this._state.isSubmitting) return;

    const container = this.getContainer();
    const category = this.asText(container.find('#correction-cancel-category').val());
    const justification = this.asText(container.find('#correction-cancel-reason').val());

    if (!category) {
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Categoria obrigatoria',
        message: 'Selecione a categoria do cancelamento.'
      });
      container.find('#correction-cancel-category').trigger('focus');
      return;
    }

    if (!justification) {
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Justificativa obrigatoria',
        message: 'Informe o motivo do cancelamento.'
      });
      container.find('#correction-cancel-reason').trigger('focus');
      return;
    }

    const loading = this.createSubmitLoading('Cancelando correcao', 'Registrando e enviando cancelamento...');
    this._state.isSubmitting = true;

    try {
      if (!this._state.documentId) {
        throw new Error('Nao foi possivel identificar a solicitacao para cancelar.');
      }

      loading.updateMessage('Preparando dados da correcao...');
      await this.waitForUiPaint();
      const payload = await this.buildSubmissionPayload();

      loading.updateMessage('Atualizando dados antes do cancelamento...');
      await this.waitForUiPaint();
      const processInstanceId = await this.resolveProcessInstanceId();
      const taskFields = this.toTaskFields(fluigService.buildProjectSolicitationCardData(payload));
      taskFields.push({
        name: 'decisaoCorrecao',
        value: 'cancelado'
      });
      taskFields.push({
        name: 'justificativaCorrecao',
        value: justification
      });
      taskFields.push({
        name: 'categoriajustiCorrecao',
        value: category
      });

      loading.updateMessage('Enviando cancelamento para o fluxo...');
      await this.waitForUiPaint();
      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 85,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos',
        attachments: payload.attachments
      }, taskFields);

      this.closeCancelModal();
      this.clearDraftUiCache(this._state.documentId);
      this.showNotification({
        borderClass: 'border-bevap-green',
        iconClass: 'fa-check-circle text-bevap-green',
        title: 'Correcao cancelada',
        message: 'O cancelamento foi registrado com sucesso.'
      });

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 300);
    } catch (error) {
      console.error('[correction] Error canceling correction:', error);
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Erro ao cancelar',
        message: (error && error.message) || String(error || '') || 'Nao foi possivel concluir o cancelamento.'
      });
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  persistCorrectionDecision: async function (decisionValue, justification, category) {
    if (!this._state.documentId) {
      return;
    }

    await fluigService.saveDraft({
      mode: 'updateCardDraft',
      documentId: this._state.documentId,
      cardData: {
        decisaoCorrecao: this.asText(decisionValue),
        justificativaCorrecao: this.asText(justification),
        categoriajustiCorrecao: this.asText(category)
      }
    });
  }
});
