const executionActivityWaitingController = {
  _formId: '113630',
  _datasetName: 'formExecucaoFasesAtividades',
  _eventNamespace: '.executionActivityWaiting',
  _toastTimer: null,
  _state: {
    documentId: null,
    processInstanceId: null,
    card: null,
    isSubmitting: false
  },

  async load(params = {}) {
    this.destroy();
    this._state = {
      documentId: this.normalizeId(params.documentId),
      processInstanceId: this.normalizeId(params.processInstanceId),
      card: null,
      isSubmitting: false
    };

    const container = $('#route-content');
    const template = await $.get(this.getTemplateUrl());
    container.html(template);

    this.bindEvents();
    await this.loadCard();
  },

  destroy() {
    $(document).off(this._eventNamespace);
    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }
  },

  getTemplateUrl() {
    const baseUrl = typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '';
    return `${baseUrl}/wdGestaoProjetos/resources/js/templates/execucao-fases/ef-activity-waiting.html`;
  },

  bindEvents() {
    $(document).on(`click${this._eventNamespace}`, '[data-action="start-execution"]', () => {
      this.openStartModal();
    });

    $(document).on(`click${this._eventNamespace}`, '[data-action="close-start-modal"]', () => {
      this.closeModal();
    });

    $(document).on(`click${this._eventNamespace}`, '[data-action="confirm-start-execution"]', () => {
      this.startExecution();
    });
  },

  async loadCard() {
    try {
      this.setLoading(true, 'Carregando dados da atividade...');

      await this.resolveContextIds();
      const cards = await fluigService.searchCard(this._formId, this._state.documentId);
      const card = Array.isArray(cards) ? cards[0] : cards;

      if (!card) {
        this.renderError('Card nao encontrado para a solicitacao informada.');
        return;
      }

      this._state.card = this.normalizeCard(card);
      this.renderCard(this._state.card);
    } catch (error) {
      console.error('Erro ao carregar atividade em aguardando execucao:', error);
      this.renderError(error && error.message ? error.message : 'Nao foi possivel carregar a atividade.');
    } finally {
      this.setLoading(false);
    }
  },

  async resolveContextIds() {
    const state = this._state;

    if (!state.documentId && !state.processInstanceId) {
      throw new Error('Informe documentId ou processInstanceId para abrir a tela.');
    }

    if (!state.documentId && state.processInstanceId) {
      state.documentId = this.normalizeId(await fluigService.resolveDocumentIdByProcessInstanceId(state.processInstanceId));
    }

    if (!state.processInstanceId && state.documentId) {
      state.processInstanceId = this.normalizeId(await fluigService.resolveProcessInstanceIdByDocumentId(state.documentId));
    }

    if (!state.documentId) {
      throw new Error('Nao foi possivel localizar o documentId do card da atividade.');
    }

    if (!state.processInstanceId) {
      throw new Error('Nao foi possivel localizar o processInstanceId da atividade.');
    }
  },

  normalizeCard(card) {
    const source = card || {};

    return {
      documentId: this.firstFilledValue(source, ['documentId', 'cardId']),
      activity: this.firstFilledValue(source, ['milestoneTaskSummaryTextDP']),
      dueDate: this.firstFilledValue(source, ['milestoneTaskSummaryDueDateDP']),
      phase: this.firstFilledValue(source, ['milestoneTaskSummaryPhaseDP']),
      milestone: this.firstFilledValue(source, ['milestoneTaskSummaryMarcoDP']),
      parentProcess: this.firstFilledValue(source, ['milestoneTaskSummaryProcessDP']),
      projectCode: this.firstFilledValue(source, ['codigoglpi']),
      projectTitle: this.firstFilledValue(source, ['titulodoprojetoNS']),
      projectArea: this.firstFilledValue(source, ['areaUnidadeNS']),
      projectSponsor: this.firstFilledValue(source, ['patrocinadorNS']),
      projectPriority: this.firstFilledValue(source, ['prioridadeNS']),
      requesterName: this.firstFilledValue(source, ['solicitanteNomeNS']),
      glpiStatus: this.firstFilledValue(source, ['statusIntegracaoGLPIAtividade']),
      glpiError: this.firstFilledValue(source, ['mensagemErroGLPIAtividade']),
      glpiActivityId: this.firstFilledValue(source, ['idGLPIAtividade'])
    };
  },

  renderCard(card) {
    this.setText('#ef-activity-name', card.activity || 'Atividade sem nome informado');
    this.setText('#ef-due-date', this.formatDate(card.dueDate) || '-');
    this.setText('#ef-phase-name', card.phase || '-');
    this.setText('#ef-milestone-name', card.milestone || '-');
    this.setText('#ef-parent-process', card.parentProcess || '-');
    this.setText('#ef-project-code', card.projectCode || '-');
    this.setText('#ef-project-title', card.projectTitle || '-');
    this.setText('#ef-project-area', card.projectArea || '-');
    this.setText('#ef-project-sponsor', card.projectSponsor || '-');
    this.setText('#ef-project-priority', card.projectPriority || '-');
    this.setText('#ef-project-requester', card.requesterName || '-');
    this.setText('#ef-glpi-id', card.glpiActivityId ? `ID da atividade: ${card.glpiActivityId}` : 'ID da atividade nao informado');

    this.renderGlpiStatus(card.glpiStatus);
    this.renderGlpiError(card.glpiError);

    $('#ef-page-alert').addClass('hidden').empty();
    $('#ef-content, #ef-action-footer').removeClass('hidden');
  },

  renderGlpiStatus(status) {
    const normalized = this.asText(status);
    const label = normalized || 'Status nao informado';
    const statusClass = this.getGlpiStatusClass(normalized);

    $('#ef-glpi-status')
      .removeClass()
      .addClass(`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`)
      .text(label);
  },

  renderGlpiError(message) {
    const error = this.asText(message);
    const element = $('#ef-glpi-error');

    if (!error) {
      element.addClass('hidden').text('');
      return;
    }

    element.removeClass('hidden').text(error);
  },

  getGlpiStatusClass(status) {
    const normalized = this.asText(status).toLowerCase();

    if (normalized.includes('erro')) {
      return 'bg-red-100 text-red-800';
    }

    if (normalized.includes('sucesso') || normalized.includes('integrado')) {
      return 'bg-green-100 text-green-800';
    }

    return 'bg-yellow-100 text-yellow-800';
  },

  renderError(message) {
    $('#ef-content, #ef-action-footer').addClass('hidden');
    $('#ef-page-alert')
      .removeClass('hidden')
      .html(`
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          ${this.escapeHtml(message)}
        </div>
      `);
  },

  openStartModal() {
    if (this._state.isSubmitting) {
      return;
    }

    const activityName = this._state.card && this._state.card.activity
      ? this._state.card.activity
      : 'esta atividade';

    $('#modal-root').html(`
      <div class="fixed inset-0 z-40 bg-black/40 px-4 py-8" role="dialog" aria-modal="true">
        <div class="mx-auto max-w-lg rounded-lg bg-white shadow-xl">
          <div class="border-b border-gray-200 px-5 py-4">
            <h3 class="text-lg font-semibold text-gray-900">Iniciar execucao?</h3>
          </div>
          <div class="px-5 py-4">
            <p class="text-sm text-gray-600">
              A solicitacao sera enviada para a atividade <strong>18 - Execucao do Atividade</strong>.
            </p>
            <p class="mt-3 text-sm font-medium text-gray-900">${this.escapeHtml(activityName)}</p>
          </div>
          <div class="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
            <button type="button" data-action="close-start-modal" class="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" data-action="confirm-start-execution" class="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    `);
  },

  closeModal() {
    $('#modal-root').empty();
  },

  async startExecution() {
    if (this._state.isSubmitting) {
      return;
    }

    try {
      this._state.isSubmitting = true;
      this.closeModal();
      this.setStartButtonState(true);
      this.setLoading(true, 'Iniciando execucao...');

      await fluigService.saveAndSendTask({
        id: this._state.processInstanceId,
        numState: 18,
        documentId: this._state.documentId,
        datasetName: this._datasetName
      }, []);

      this.showToast('Atividade enviada para execucao.');
      setTimeout(() => {
        window.location.hash = `#executionActivity?processInstanceId=${this._state.processInstanceId}&documentId=${this._state.documentId}`;
      }, 900);
    } catch (error) {
      console.error('Erro ao iniciar execucao da atividade:', error);
      this.showToast('Nao foi possivel iniciar a execucao da atividade.', 'error');
      this.setStartButtonState(false);
    } finally {
      this._state.isSubmitting = false;
      this.setLoading(false);
    }
  },

  setStartButtonState(isDisabled) {
    $('#ef-start-button')
      .prop('disabled', isDisabled)
      .toggleClass('opacity-70 cursor-not-allowed', isDisabled);
  },

  setLoading(isVisible, label = 'Carregando...') {
    const overlay = $('#ui-loading-overlay');
    $('#ui-loading-label').text(label);
    overlay.toggleClass('hidden', !isVisible);
  },

  showToast(message, type = 'success') {
    const toast = $('#toast');
    const toastMessage = $('#toast-message');
    const isError = type === 'error';

    toast
      .removeClass('hidden border-green-200 border-red-200')
      .addClass(isError ? 'border-red-200' : 'border-green-200');
    toastMessage
      .removeClass('text-gray-900 text-red-800')
      .addClass(isError ? 'text-red-800' : 'text-gray-900')
      .text(message);

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
    }

    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
    }, 3500);
  },

  setText(selector, value) {
    $(selector).text(this.asText(value));
  },

  normalizeId(value) {
    const normalized = this.asText(value);
    return normalized || null;
  },

  firstFilledValue(source, fields) {
    for (const field of fields) {
      const value = this.asText(source[field]);
      if (value) {
        return value;
      }
    }

    return '';
  },

  asText(value) {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  },

  formatDate(value) {
    const text = this.asText(value);

    if (!text) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split('-');
      return `${day}/${month}/${year}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
      return text;
    }

    return text;
  },

  escapeHtml(value) {
    return this.asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

if (typeof window !== 'undefined') {
  window.executionActivityWaitingController = executionActivityWaitingController;
}
