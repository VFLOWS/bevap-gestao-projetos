const executionActivityController = {
  _formId: '113630',
  _datasetName: 'formExecucaoFasesAtividades',
  _eventNamespace: '.executionActivity',
  _toastTimer: null,
  _state: {
    documentId: null,
    processInstanceId: null,
    card: null,
    entries: [],
    attachments: [],
    editingEntryId: null,
    isSubmitting: false
  },

  async load(params = {}) {
    this.destroy();
    this._state = {
      documentId: this.normalizeId(params.documentId),
      processInstanceId: this.normalizeId(params.processInstanceId),
      card: null,
      entries: [],
      attachments: [],
      editingEntryId: null,
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
    return `${baseUrl}/wdGestaoProjetos/resources/js/templates/execucao-fases/ef-activity-execution.html`;
  },

  getContainer() {
    return $('#execution-activity-page');
  },

  bindEvents() {
    const ns = this._eventNamespace;
    const container = this.getContainer();

    container.on(`click${ns}`, '[data-action="open-add-entry-modal"]', () => this.openEntryModal());
    container.on(`click${ns}`, '[data-action="edit-entry"]', (event) => {
      this.openEntryModal(String($(event.currentTarget).attr('data-entry-id') || ''));
    });
    container.on(`click${ns}`, '[data-action="delete-entry"]', (event) => {
      this.openDeleteEntryModal(String($(event.currentTarget).attr('data-entry-id') || ''));
    });
    container.on(`click${ns}`, '#ef-exec-entry-history-toggle', () => this.toggleEntryHistory());
    container.on(`click${ns}`, '#ef-exec-dropzone', () => container.find('#ef-exec-attachment-input').trigger('click'));
    container.on(`change${ns}`, '#ef-exec-attachment-input', (event) => {
      this.addAttachments(event.target.files);
      event.target.value = '';
    });
    container.on(`dragover${ns}`, '#ef-exec-dropzone', (event) => {
      event.preventDefault();
      $(event.currentTarget).addClass('border-bevap-green bg-green-50');
    });
    container.on(`dragleave${ns} drop${ns}`, '#ef-exec-dropzone', (event) => {
      event.preventDefault();
      $(event.currentTarget).removeClass('border-bevap-green bg-green-50');
      if (event.type === 'drop') {
        this.addAttachments(event.originalEvent.dataTransfer.files);
      }
    });
    container.on(`click${ns}`, '[data-action="remove-exec-attachment"]', (event) => {
      this.removeAttachment(String($(event.currentTarget).attr('data-attachment-id') || ''));
    });
    container.on(`click${ns}`, '[data-action="save-activity"]', () => this.openSaveModal());
    container.on(`click${ns}`, '[data-action="send-requester"]', () => this.openSendModal());

    $(document).on(`click${ns}`, '[data-action="close-exec-modal"]', () => this.closeModal());
    $(document).on(`click${ns}`, '[data-action="confirm-entry"]', () => this.upsertEntryFromModal());
    $(document).on(`click${ns}`, '[data-action="confirm-delete-entry"]', (event) => {
      this.markEntryDeleted(String($(event.currentTarget).attr('data-entry-id') || ''));
    });
    $(document).on(`click${ns}`, '[data-action="confirm-save-activity"]', () => this.saveActivity());
    $(document).on(`click${ns}`, '[data-action="confirm-send-requester"]', () => this.sendToRequesterValidation());
    $(document).on(`input${ns}`, '#ef-entry-start, #ef-entry-end', (event) => {
      event.currentTarget.value = this.normalizeTimeInputValue(event.currentTarget.value);
    });
  },

  async loadCard() {
    try {
      this.setLoading(true, 'Carregando execucao da atividade...');
      await this.resolveContextIds();

      const cards = await fluigService.searchCard(this._formId, this._state.documentId);
      const card = Array.isArray(cards) ? cards[0] : cards;
      if (!card) {
        this.renderError('Card nao encontrado para a atividade informada.');
        return;
      }

      this._state.card = this.normalizeCard(card);
      this._state.entries = this.parseExecutionEntries(card);
      this._state.attachments = this.parsePersistedAttachments(card.anexosExecucaoAtividade);
      this.render();
    } catch (error) {
      console.error('Erro ao carregar tela de execucao da atividade:', error);
      this.renderError(error && error.message ? error.message : 'Nao foi possivel carregar a execucao da atividade.');
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
      glpiActivityId: this.firstFilledValue(source, ['idGLPIAtividade'])
    };
  },

  render() {
    const card = this._state.card || {};
    this.setText('#ef-exec-activity-name', card.activity || 'Atividade sem nome informado');
    this.setText('#ef-exec-due-date', this.formatDate(card.dueDate) || '-');
    this.setText('#ef-exec-phase-name', card.phase || '-');
    this.setText('#ef-exec-milestone-name', card.milestone || '-');
    this.setText('#ef-exec-project-code', card.projectCode || '-');
    this.setText('#ef-exec-project-title', card.projectTitle || '-');
    this.setText('#ef-exec-project-area', card.projectArea || '-');
    this.setText('#ef-exec-project-sponsor', card.projectSponsor || '-');
    this.setText('#ef-exec-project-priority', card.projectPriority || '-');
    this.setText('#ef-exec-project-requester', card.requesterName || '-');

    this.renderEntries();
    this.renderEffortSummary();
    this.renderAttachmentsList();

    $('#ef-exec-page-alert').addClass('hidden').empty();
    $('#ef-exec-content, #ef-exec-action-footer').removeClass('hidden');
  },

  renderEntries() {
    const list = $('#ef-exec-entry-history');
    const activeEntries = this.getActiveEntries(this._state.entries);

    if (!activeEntries.length) {
      list.empty();
      $('#ef-exec-entry-empty').removeClass('hidden');
      return;
    }

    $('#ef-exec-entry-empty').addClass('hidden');
    list.html(activeEntries.map((entry) => this.getEntryMarkup(entry)).join(''));
  },

  getEntryMarkup(entry) {
    const initials = this.getInitials(entry.authorName);
    const dateLabel = this.formatDate(entry.date);
    const durationLabel = this.formatHoursAndMinutes(Number(entry.durationMinutes) || 0);
    const updatedAt = this.formatDateTime(entry.updatedAt || entry.createdAt);

    return `
      <div class="execution-entry-item rounded-lg border border-gray-200 bg-slate-50 p-4" data-entry-id="${this.escapeHtml(entry.id)}">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bevap-navy text-sm font-semibold text-white">${this.escapeHtml(initials)}</span>
            <div>
              <div class="font-semibold leading-5 text-bevap-navy">${this.escapeHtml(entry.authorName || 'Usuario')}</div>
              <div class="mt-1 text-xs text-gray-500">${this.escapeHtml(dateLabel)} ${this.escapeHtml(entry.start)} - ${this.escapeHtml(entry.end)}</div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">${this.escapeHtml(durationLabel)}</span>
            <span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500">${this.escapeHtml(updatedAt || '-')}</span>
            <button type="button" data-action="edit-entry" data-entry-id="${this.escapeHtml(entry.id)}" title="Editar lancamento" class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50">
              <i class="fa-solid fa-pen text-[10px]" aria-hidden="true"></i>
            </button>
            <button type="button" data-action="delete-entry" data-entry-id="${this.escapeHtml(entry.id)}" title="Excluir lancamento" class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-xs text-red-700 hover:bg-red-100">
              <i class="fa-solid fa-trash text-[10px]" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <p class="mt-2 text-sm text-gray-700">${this.escapeHtml(entry.comment)}</p>
      </div>
    `;
  },

  renderEffortSummary() {
    const usedMinutes = this.sumActiveDurationMinutes(this._state.entries);
    $('#ef-exec-used-hours').text(this.formatHoursAndMinutes(usedMinutes));
  },

  renderAttachmentsList() {
    const list = $('#ef-exec-files-list');
    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];

    $('#ef-exec-files-pending-warning').toggleClass('hidden', !this.hasLocalAttachments());

    if (!items.length) {
      list.html('<div class="text-sm text-gray-500">Nenhum anexo selecionado.</div>');
      return;
    }

    list.html(items.map((attachment) => {
      const fileName = attachment.file ? attachment.file.name : attachment.fileName;
      const sizeLabel = attachment.file ? this.formatAttachmentSize(attachment.file.size || 0) : this.asText(attachment.fileSize);
      const iconClass = this.getAttachmentIconClass(fileName);
      const removeButton = attachment.persisted
        ? '<button type="button" disabled class="text-red-500 opacity-30 cursor-not-allowed" title="Anexo ja salvo"><i class="fa-solid fa-lock" aria-hidden="true"></i></button>'
        : `<button type="button" data-action="remove-exec-attachment" data-attachment-id="${this.escapeHtml(attachment.id)}" class="text-red-500 hover:text-red-700" title="Remover"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>`;

      return `
        <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
          <div class="flex min-w-0 items-center">
            <i class="fa-solid ${this.escapeHtml(iconClass)} mr-3 text-xl" aria-hidden="true"></i>
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-gray-900">${this.escapeHtml(fileName || 'arquivo')}</div>
              <div class="text-xs text-gray-500">${this.escapeHtml(sizeLabel || '')}</div>
            </div>
          </div>
          ${removeButton}
        </div>
      `;
    }).join(''));
  },

  openEntryModal(entryId) {
    const entry = entryId ? this.findEntryById(entryId) : null;
    const editing = Boolean(entry);
    const today = this.getTodayIsoDate();

    $('#modal-root').html(`
      <div id="ef-entry-modal" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-3xl rounded-lg bg-white shadow-xl">
          <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
            <div class="flex items-center gap-3">
              <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <i class="fa-regular fa-clock text-lg" aria-hidden="true"></i>
              </span>
              <div>
                <h3 class="text-lg font-bold text-bevap-navy">${editing ? 'Editar Apontamento de Tempo' : 'Adicionar Apontamento de Tempo'}</h3>
                <p class="text-sm text-gray-500">Informe data, intervalo e comentario da atividade.</p>
              </div>
            </div>
            <button type="button" data-action="close-exec-modal" class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
          <div class="space-y-4 px-6 py-5">
            <div>
              <label for="ef-entry-date" class="mb-2 block text-sm font-medium text-gray-700">Data do Apontamento</label>
              <input id="ef-entry-date" type="date" value="${this.escapeHtml(entry ? entry.date : today)}" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green">
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <label for="ef-entry-start" class="flex items-center gap-2 text-sm font-medium text-bevap-navy">
                  <i class="fa-regular fa-clock text-blue-600" aria-hidden="true"></i>Inicio
                </label>
                <input id="ef-entry-start" type="text" inputmode="numeric" maxlength="5" value="${this.escapeHtml(entry ? entry.start : '')}" class="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="08:00">
              </div>
              <div class="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <label for="ef-entry-end" class="flex items-center gap-2 text-sm font-medium text-bevap-navy">
                  <i class="fa-solid fa-clock-rotate-left text-blue-600" aria-hidden="true"></i>Fim
                </label>
                <input id="ef-entry-end" type="text" inputmode="numeric" maxlength="5" value="${this.escapeHtml(entry ? entry.end : '')}" class="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="10:00">
              </div>
            </div>
            <div>
              <label for="ef-entry-comment" class="mb-2 block text-sm font-medium text-gray-700">Comentario da Atividade</label>
              <textarea id="ef-entry-comment" rows="5" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="Descreva o andamento, decisoes ou impedimentos.">${this.escapeHtml(entry ? entry.comment : '')}</textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
            <button type="button" data-action="close-exec-modal" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="button" data-action="confirm-entry" data-entry-id="${this.escapeHtml(entryId || '')}" class="rounded-lg bg-bevap-navy px-4 py-2 text-sm font-medium text-white hover:opacity-95">
              ${editing ? 'Atualizar Lancamento' : 'Adicionar Lancamento'}
            </button>
          </div>
        </div>
      </div>
    `);
  },

  upsertEntryFromModal() {
    const button = $('[data-action="confirm-entry"]').first();
    const entryId = this.asText(button.attr('data-entry-id'));
    const date = this.asText($('#ef-entry-date').val());
    const start = this.normalizeTimeInputValue($('#ef-entry-start').val());
    const end = this.normalizeTimeInputValue($('#ef-entry-end').val());
    const comment = this.asText($('#ef-entry-comment').val());
    const validation = this.validateEntryInput({ date, start, end, comment });

    if (!validation.valid) {
      this.showToast('Apontamento invalido', validation.message, 'error');
      return;
    }

    const now = new Date().toISOString();
    const existing = entryId ? this.findEntryById(entryId) : null;
    const nextEntry = {
      id: existing ? existing.id : this.createEntryId(),
      rowIndex: existing ? existing.rowIndex : null,
      status: 'active',
      date: date,
      start: start,
      end: end,
      durationMinutes: validation.durationMinutes,
      comment: comment,
      authorId: existing ? existing.authorId : this.getCurrentUserId(),
      authorName: existing ? existing.authorName : this.getCurrentUserName(),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      persisted: Boolean(existing && existing.persisted)
    };

    if (existing) {
      this._state.entries = this._state.entries.map((entry) => entry.id === existing.id ? nextEntry : entry);
    } else {
      this._state.entries.unshift(nextEntry);
    }

    this.closeModal();
    this.renderEntries();
    this.renderEffortSummary();
    this.showToast(existing ? 'Lancamento atualizado' : 'Lancamento adicionado', 'Salve a atividade para gravar no card.', 'success');
  },

  openDeleteEntryModal(entryId) {
    const entry = this.findEntryById(entryId);
    if (!entry) return;

    $('#modal-root').html(`
      <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <i class="fa-solid fa-trash text-xl text-red-600" aria-hidden="true"></i>
            </div>
            <h3 class="text-xl font-bold text-bevap-navy">Excluir Apontamento de Tempo</h3>
          </div>
          <p class="mb-2 text-gray-700">Confirma a exclusao logica deste apontamento?</p>
          <p class="mb-6 text-sm text-gray-600">A linha sera mantida no card com status deleted.</p>
          <div class="flex justify-end gap-3">
            <button type="button" data-action="close-exec-modal" class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="button" data-action="confirm-delete-entry" data-entry-id="${this.escapeHtml(entry.id)}" class="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">Excluir</button>
          </div>
        </div>
      </div>
    `);
  },

  markEntryDeleted(entryId) {
    this._state.entries = this._state.entries.map((entry) => {
      if (entry.id !== entryId) return entry;
      return {
        ...entry,
        status: 'deleted',
        updatedAt: new Date().toISOString()
      };
    });

    this.closeModal();
    this.renderEntries();
    this.renderEffortSummary();
    this.showToast('Lancamento excluido', 'A exclusao sera gravada no proximo salvar ou enviar.', 'info');
  },

  openSaveModal() {
    const pendingText = this.hasLocalAttachments()
      ? '<p class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Existem anexos pendentes. Eles nao serao anexados no Salvar; serao enviados apenas ao enviar para validacao.</p>'
      : '';

    $('#modal-root').html(`
      <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 class="text-xl font-bold text-bevap-navy">Salvar Alteracoes da Atividade</h3>
          <p class="mt-4 text-gray-700">Confirma o salvamento dos apontamentos no card?</p>
          ${pendingText}
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" data-action="close-exec-modal" class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="button" data-action="confirm-save-activity" class="rounded-lg bg-bevap-navy px-4 py-2 font-medium text-white hover:opacity-95">Salvar</button>
          </div>
        </div>
      </div>
    `);
  },

  openSendModal() {
    $('#modal-root').html(`
      <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 class="text-xl font-bold text-bevap-navy">Enviar para Validacao do Solicitante</h3>
          <p class="mt-4 text-gray-700">Os apontamentos serao salvos e os anexos pendentes serao enviados ao processo.</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" data-action="close-exec-modal" class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="button" data-action="confirm-send-requester" class="rounded-lg bg-bevap-green px-4 py-2 font-medium text-white hover:bg-green-700">Enviar</button>
          </div>
        </div>
      </div>
    `);
  },

  async saveActivity(options = {}) {
    if (this._state.isSubmitting) return;

    try {
      this._state.isSubmitting = true;
      this.closeModal();
      this.setLoading(true, 'Salvando apontamentos...');

      const taskFields = this.collectExecutionTaskFields(this._state.entries);
      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        datasetName: this._datasetName,
        taskFields: taskFields
      });

      this.markEntriesPersisted();
      if (!options.silent) {
        this.showToast('Alteracoes salvas', this.hasLocalAttachments() ? 'Apontamentos salvos. Anexos pendentes serao enviados na validacao.' : 'Apontamentos salvos no card.', 'success');
      }
    } catch (error) {
      console.error('Erro ao salvar execucao da atividade:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Nao foi possivel salvar os apontamentos.', 'error');
    } finally {
      this._state.isSubmitting = false;
      this.setLoading(false);
    }
  },

  async sendToRequesterValidation() {
    if (this._state.isSubmitting) return;

    try {
      this._state.isSubmitting = true;
      this.closeModal();
      this.setLoading(true, 'Enviando para validacao...');

      const taskFields = this.collectExecutionTaskFields(this._state.entries);
      const attachments = await this.collectAttachmentsPayload();

      await fluigService.saveAndSendTask({
        id: this._state.processInstanceId,
        numState: 23,
        documentId: this._state.documentId,
        datasetName: this._datasetName,
        attachments: attachments
      }, taskFields);

      this.markEntriesPersisted();
      this.showToast('Atividade enviada', 'A validacao do solicitante foi iniciada.', 'success');
      setTimeout(() => {
        window.location.hash = '#dashboard';
      }, 900);
    } catch (error) {
      console.error('Erro ao enviar execucao da atividade:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Nao foi possivel enviar a atividade.', 'error');
    } finally {
      this._state.isSubmitting = false;
      this.setLoading(false);
    }
  },

  collectExecutionTaskFields(entries) {
    const fields = [];
    const indexedEntries = this.assignRowIndexes(entries);

    indexedEntries.forEach((entry) => {
      const idx = entry.rowIndex;
      fields.push({ name: `executionEntryIdEF___${idx}`, value: this.asText(entry.id) });
      fields.push({ name: `executionEntryStatusEF___${idx}`, value: this.asText(entry.status || 'active') });
      fields.push({ name: `executionEntryDateEF___${idx}`, value: this.asText(entry.date) });
      fields.push({ name: `executionEntryStartEF___${idx}`, value: this.asText(entry.start) });
      fields.push({ name: `executionEntryEndEF___${idx}`, value: this.asText(entry.end) });
      fields.push({ name: `executionEntryDurationEF___${idx}`, value: String(Number(entry.durationMinutes) || 0) });
      fields.push({ name: `executionEntryCommentEF___${idx}`, value: this.asText(entry.comment) });
      fields.push({ name: `executionEntryAuthorIdEF___${idx}`, value: this.asText(entry.authorId) });
      fields.push({ name: `executionEntryAuthorNameEF___${idx}`, value: this.asText(entry.authorName) });
      fields.push({ name: `executionEntryCreatedAtEF___${idx}`, value: this.asText(entry.createdAt) });
      fields.push({ name: `executionEntryUpdatedAtEF___${idx}`, value: this.asText(entry.updatedAt) });
    });

    return fields;
  },

  assignRowIndexes(entries) {
    const rows = Array.isArray(entries) ? entries : [];
    const usedIndexes = {};
    let maxIndex = 0;

    rows.forEach((entry) => {
      const idx = Number(entry && entry.rowIndex);
      if (idx > 0) {
        usedIndexes[idx] = true;
        maxIndex = Math.max(maxIndex, idx);
      }
    });

    rows.forEach((entry) => {
      if (Number(entry.rowIndex) > 0) return;
      do {
        maxIndex += 1;
      } while (usedIndexes[maxIndex]);
      entry.rowIndex = maxIndex;
      usedIndexes[maxIndex] = true;
    });

    return rows;
  },

  markEntriesPersisted() {
    this._state.entries = this.assignRowIndexes(this._state.entries).map((entry) => ({
      ...entry,
      persisted: true
    }));
  },

  parseExecutionEntries(card) {
    const source = card || {};
    const rowsByIndex = {};
    const fieldPattern = /^(executionEntryIdEF|executionEntryStatusEF|executionEntryDateEF|executionEntryStartEF|executionEntryEndEF|executionEntryDurationEF|executionEntryCommentEF|executionEntryAuthorIdEF|executionEntryAuthorNameEF|executionEntryCreatedAtEF|executionEntryUpdatedAtEF)___(\d+)$/;

    Object.keys(source).forEach((fieldName) => {
      const match = fieldName.match(fieldPattern);
      if (!match) return;
      const baseName = match[1];
      const rowIndex = Number(match[2]);
      rowsByIndex[rowIndex] = rowsByIndex[rowIndex] || { rowIndex };
      rowsByIndex[rowIndex][baseName] = source[fieldName];
    });

    return Object.keys(rowsByIndex)
      .map((idx) => {
        const row = rowsByIndex[idx] || {};
        const id = this.asText(row.executionEntryIdEF) || `legacy:${idx}`;
        return {
          id: id,
          rowIndex: Number(row.rowIndex) || Number(idx),
          status: this.asText(row.executionEntryStatusEF) || 'active',
          date: this.asText(row.executionEntryDateEF),
          start: this.asText(row.executionEntryStartEF),
          end: this.asText(row.executionEntryEndEF),
          durationMinutes: Number(row.executionEntryDurationEF) || this.calculateDurationMinutes(row.executionEntryStartEF, row.executionEntryEndEF),
          comment: this.asText(row.executionEntryCommentEF),
          authorId: this.asText(row.executionEntryAuthorIdEF),
          authorName: this.asText(row.executionEntryAuthorNameEF),
          createdAt: this.asText(row.executionEntryCreatedAtEF),
          updatedAt: this.asText(row.executionEntryUpdatedAtEF),
          persisted: true
        };
      })
      .filter((entry) => entry.id || entry.date || entry.start || entry.end || entry.comment)
      .sort((a, b) => (Number(a.rowIndex) || 0) - (Number(b.rowIndex) || 0));
  },

  getActiveEntries(entries) {
    return (Array.isArray(entries) ? entries : []).filter((entry) => this.asText(entry.status).toLowerCase() !== 'deleted');
  },

  sumActiveDurationMinutes(entries) {
    return this.getActiveEntries(entries).reduce((total, entry) => total + (Number(entry.durationMinutes) || 0), 0);
  },

  validateEntryInput(entry) {
    if (!this.asText(entry.date)) {
      return { valid: false, message: 'Informe a data do apontamento.' };
    }

    const start = this.parseTimeInputValue(entry.start);
    const end = this.parseTimeInputValue(entry.end);
    if (!start || !end) {
      return { valid: false, message: 'Informe inicio e fim no formato HH:MM.' };
    }

    const durationMinutes = end.totalMinutes - start.totalMinutes;
    if (durationMinutes <= 0) {
      return { valid: false, message: 'O horario final deve ser maior que o inicial.' };
    }

    if (!this.asText(entry.comment)) {
      return { valid: false, message: 'Descreva o andamento da atividade.' };
    }

    return { valid: true, durationMinutes };
  },

  calculateDurationMinutes(startValue, endValue) {
    const start = this.parseTimeInputValue(startValue);
    const end = this.parseTimeInputValue(endValue);
    if (!start || !end) return 0;
    return Math.max(0, end.totalMinutes - start.totalMinutes);
  },

  parseTimeInputValue(value) {
    const normalized = this.asText(value);
    const match = normalized.match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return {
      hour,
      minute,
      totalMinutes: (hour * 60) + minute,
      label: `${this.padNumber(hour)}:${this.padNumber(minute)}`
    };
  },

  normalizeTimeInputValue(value) {
    const digits = this.asText(value).replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  },

  addAttachments(fileList) {
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

  removeAttachment(id) {
    const current = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    this._state.attachments = current.filter((attachment) => String(attachment && attachment.id) !== String(id));
    this.renderAttachmentsList();
  },

  async collectAttachmentsPayload() {
    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    const localItems = items.filter((attachment) => attachment && attachment.file && !attachment.persisted);
    if (!localItems.length) return [];

    const payload = await Promise.all(localItems.map(async (attachment) => {
      const file = attachment.file;
      const content = await this.readFileAsBase64(file);
      return {
        fileName: this.asText(file && file.name),
        fileContent: this.asText(content),
        fileSize: String(file && file.size ? file.size : '').trim()
      };
    }));

    return payload.filter((item) => item.fileName && item.fileContent);
  },

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = String(event.target && event.target.result ? event.target.result : '');
        resolve(raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw);
      };
      reader.onerror = () => reject(new Error('Falha ao ler anexo'));
      reader.readAsDataURL(file);
    });
  },

  parsePersistedAttachments(rawValue) {
    const raw = this.asText(rawValue);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((attachment, index) => ({
        id: this.asText(attachment.documentId || attachment.id || `persisted:${index}`),
        fileName: this.asText(attachment.fileName || attachment.documentDescription),
        fileSize: this.asText(attachment.fileSize),
        version: this.asText(attachment.version),
        persisted: true
      })).filter((attachment) => attachment.fileName);
    } catch (error) {
      return [];
    }
  },

  hasLocalAttachments() {
    return (Array.isArray(this._state.attachments) ? this._state.attachments : []).some((attachment) => attachment && attachment.file && !attachment.persisted);
  },

  getAttachmentIconClass(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  formatAttachmentSize(size) {
    const numericSize = Number(size) || 0;
    if (!numericSize) return 'Arquivo local';
    const kb = numericSize / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  },

  toggleEntryHistory() {
    const history = $('#ef-exec-entry-history');
    const toggle = $('#ef-exec-entry-history-toggle');
    const nextExpanded = toggle.attr('aria-expanded') === 'false';
    history.toggleClass('hidden', !nextExpanded);
    toggle.attr('aria-expanded', String(nextExpanded));
    toggle.find('i').toggleClass('fa-chevron-up', nextExpanded).toggleClass('fa-chevron-down', !nextExpanded);
    toggle.find('span').text(nextExpanded ? 'Recolher' : 'Expandir');
  },

  findEntryById(entryId) {
    return (Array.isArray(this._state.entries) ? this._state.entries : []).find((entry) => String(entry.id) === String(entryId));
  },

  createEntryId() {
    return `entry:${Date.now()}:${Math.random().toString(16).slice(2)}`;
  },

  getCurrentUserId() {
    if (typeof WCMAPI !== 'undefined' && WCMAPI.getUserCode) {
      return this.asText(WCMAPI.getUserCode());
    }
    return '';
  },

  getCurrentUserName() {
    if (typeof WCMAPI !== 'undefined' && WCMAPI.getUser) {
      return this.asText(WCMAPI.getUser());
    }
    return 'Usuario';
  },

  getTodayIsoDate() {
    const now = new Date();
    return `${now.getFullYear()}-${this.padNumber(now.getMonth() + 1)}-${this.padNumber(now.getDate())}`;
  },

  closeModal() {
    $('#modal-root').empty();
  },

  renderError(message) {
    $('#ef-exec-content, #ef-exec-action-footer').addClass('hidden');
    $('#ef-exec-page-alert')
      .removeClass('hidden')
      .html(`
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          ${this.escapeHtml(message)}
        </div>
      `);
  },

  setLoading(isVisible, label = 'Carregando...') {
    $('#ui-loading-label').text(label);
    $('#ui-loading-overlay').toggleClass('hidden', !isVisible);
  },

  showToast(title, message, type = 'info') {
    const toast = $('#toast');
    const icon = $('#toast-icon');
    const types = {
      success: { border: 'border-emerald-500', icon: 'fa-solid fa-circle-check text-emerald-600' },
      error: { border: 'border-red-500', icon: 'fa-solid fa-circle-xmark text-red-600' },
      info: { border: 'border-blue-500', icon: 'fa-solid fa-circle-info text-blue-600' }
    };
    const selected = types[type] || types.info;

    toast.removeClass('hidden border-emerald-500 border-red-500 border-blue-500').addClass(selected.border);
    icon.removeClass().addClass(`${selected.icon} text-xl`);
    $('#toast-title').text(title);
    $('#toast-message').text(message || '');

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
    }
    this._toastTimer = setTimeout(() => toast.addClass('hidden'), 3500);
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
      if (value) return value;
    }
    return '';
  },

  asText(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  },

  formatDate(value) {
    const text = this.asText(value);
    if (!text) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split('-');
      return `${day}/${month}/${year}`;
    }
    return text;
  },

  formatDateTime(value) {
    const text = this.asText(value);
    if (!text) return '';
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return text;
    return `${this.padNumber(date.getDate())}/${this.padNumber(date.getMonth() + 1)}/${date.getFullYear()} ${this.padNumber(date.getHours())}:${this.padNumber(date.getMinutes())}`;
  },

  formatHoursAndMinutes(totalMinutes) {
    const normalized = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    if (!minutes) return `${hours}h`;
    return `${hours}h ${this.padNumber(minutes)}min`;
  },

  padNumber(value) {
    return String(value).padStart(2, '0');
  },

  getInitials(value) {
    const parts = this.asText(value).split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
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
  window.executionActivityController = executionActivityController;
}
