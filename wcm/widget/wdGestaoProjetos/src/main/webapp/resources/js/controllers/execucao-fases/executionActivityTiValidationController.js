const executionActivityTiValidationController = {
  _formId: '113669',
  _datasetId: 'dsGetExecucaoAtividade',
  _datasetName: 'formExecucaoAtividade',
  _eventNamespace: '.executionActivityTiValidation',
  _nextState: 34,
  _toastTimer: null,
  _state: {
    documentId: null,
    processInstanceId: null,
    card: null,
    entries: [],
    attachments: [],
    requesterHistory: [],
    tiHistory: [],
    isSubmitting: false,
    activeTab: 'detail',
    checklistVisited: false
  },

  async load(params = {}) {
    this.destroy();
    this._state = {
      documentId: this.normalizeId(params.documentId),
      processInstanceId: this.normalizeId(params.processInstanceId),
      card: null,
      entries: [],
      attachments: [],
      requesterHistory: [],
      tiHistory: [],
      isSubmitting: false,
      activeTab: 'detail',
      checklistVisited: false
    };

    const container = $('#page-container');
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
    return `${baseUrl}/wdGestaoProjetos/resources/js/templates/execucao-fases/ef-activity-ti-validation.html`;
  },

  getContainer() {
    return $('#execution-activity-ti-validation-page');
  },

  bindEvents() {
    const ns = this._eventNamespace;
    const container = this.getContainer();

    container.on(`click${ns}`, '#tab-ti-detail', () => this.toggleTab('detail'));
    container.on(`click${ns}`, '#tab-ti-requester', () => this.toggleTab('requester'));
    container.on(`click${ns}`, '#tab-ti-history', () => this.toggleTab('history'));
    container.on(`click${ns}`, '#tab-ti-checklist', () => this.toggleTab('checklist'));
    container.on(`scroll${ns}`, '#ti-panel-tabs-scroll', () => this.updateTabArrows());
    container.on(`click${ns}`, '#ti-panel-tabs-left-arrow', () => this.scrollTabsToStart());
    container.on(`click${ns}`, '#ti-panel-tabs-right-arrow', () => this.scrollTabsToEnd());
    container.on(`change${ns}`, '.ti-checklist-item, #ti-agreement-checkbox', () => this.updateChecklistProgress());
    container.on(`click${ns}`, '[data-action="approve-ti"]', () => this.openApproveModal());
    container.on(`click${ns}`, '[data-action="return-corrections"]', () => this.openCorrectionModal());
    container.on(`click${ns}`, '[data-action="stop-flow"]', () => this.openStopModal());

    $(document).on(`click${ns}`, '[data-action="close-ti-modal"]', () => this.closeModal());
    $(document).on(`click${ns}`, '[data-action="confirm-approve-ti"]', () => this.submitDecision({
      decision: 'validado',
      requireChecklist: true,
      requireAgreement: true,
      successMessage: 'Validacao tecnica registrada.',
      comments: 'Atividade validada pela TI via Widget'
    }));
    $(document).on(`click${ns}`, '[data-action="confirm-return-corrections"]', () => this.submitDecision({
      decision: 'devolver_correcao',
      descriptionSelector: '#return-reason',
      successMessage: 'Atividade devolvida para correcao.',
      comments: 'Atividade devolvida para correcao pela TI via Widget'
    }));
    $(document).on(`click${ns}`, '[data-action="confirm-stop-flow"]', () => this.submitDecision({
      decision: 'nao_continuidade',
      descriptionSelector: '#discontinue-reason',
      categorySelector: '#discontinue-category',
      successMessage: 'Nao continuidade registrada.',
      comments: 'Nao continuidade da atividade registrada pela TI via Widget'
    }));
  },

  async loadCard() {
    try {
      this.setLoading(true, 'Carregando validacao TI...');
      await this.resolveContextIds();

      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields: this.getDatasetFields(),
        filters: {
          documentid: this._state.documentId,
          sqlLimit: 1
        }
      });
      const card = Array.isArray(rows) ? rows[0] : rows;
      if (!card) {
        this.renderError('Card nao encontrado para a atividade informada.');
        return;
      }

      this._state.card = this.normalizeCard(card);
      this._state.entries = this.parseExecutionEntries(card);
      this._state.attachments = this.parsePersistedAttachments(card.anexosExecucaoAtividade);
      this._state.requesterHistory = this.parseRequesterValidationHistory(card);
      this._state.tiHistory = this.parseTiValidationHistory(card);
      this.render();
    } catch (error) {
      console.error('Erro ao carregar validacao TI:', error);
      this.renderError(error && error.message ? error.message : 'Nao foi possivel carregar a validacao TI.');
    } finally {
      this.setLoading(false);
    }
  },

  getDatasetFields() {
    return [
      'documentid',
      'milestoneTaskSummaryTextDP',
      'milestoneTaskSummaryDueDateDP',
      'milestoneTaskSummaryPhaseDP',
      'milestoneTaskSummaryMarcoDP',
      'milestoneTaskSummaryProcessDP',
      'codigoglpi',
      'titulodoprojetoNS',
      'areaUnidadeNS',
      'patrocinadorNS',
      'prioridadeNS',
      'solicitanteNomeNS',
      'idGLPIAtividade',
      'dependenciastecnicasAPTI',
      'dependenciasNS',
      'anexosExecucaoAtividade',
      'validacaoSolicitante',
      'validacaoSolicitanteComentario',
      'validacaoSolicitanteDescricao',
      'validacaoSolicitanteCategoria',
      'validacaoSolicitanteChecklist',
      'validacaoSolicitanteLiConcordo',
      'validacaoSolicitanteHistJson',
      'decisaoTiValidacaoAtividade',
      'validacaoTiComentarioAtividade',
      'validacaoTiDescricaoAtividade',
      'validacaoTiCategoriaAtividade',
      'validacaoTiChecklistAtividade',
      'validacaoTiLiConcordoAtividade',
      'tblRequesterValidationHistoryEF.requesterValidationIdEF',
      'tblRequesterValidationHistoryEF.requesterValidationDecisionEF',
      'tblRequesterValidationHistoryEF.requesterValidationCommentEF',
      'tblRequesterValidationHistoryEF.requesterValidationDescEF',
      'tblRequesterValidationHistoryEF.requesterValidationCategoryEF',
      'tblRequesterValidationHistoryEF.requesterValidationUserIdEF',
      'tblRequesterValidationHistoryEF.requesterValidationUserNameEF',
      'tblRequesterValidationHistoryEF.requesterValidationCreatedAtEF',
      'tblTiValidationHistoryEF.tiValidationIdEF',
      'tblTiValidationHistoryEF.tiValidationDecisionEF',
      'tblTiValidationHistoryEF.tiValidationCommentEF',
      'tblTiValidationHistoryEF.tiValidationDescriptionEF',
      'tblTiValidationHistoryEF.tiValidationCategoryEF',
      'tblTiValidationHistoryEF.tiValidationUserIdEF',
      'tblTiValidationHistoryEF.tiValidationUserNameEF',
      'tblTiValidationHistoryEF.tiValidationCreatedAtEF',
      'tblExecutionTimeEntriesEF.executionEntryIdEF',
      'tblExecutionTimeEntriesEF.executionEntryStatusEF',
      'tblExecutionTimeEntriesEF.executionEntryDateEF',
      'tblExecutionTimeEntriesEF.executionEntryStartEF',
      'tblExecutionTimeEntriesEF.executionEntryEndEF',
      'tblExecutionTimeEntriesEF.executionEntryDurationEF',
      'tblExecutionTimeEntriesEF.executionEntryCommentEF',
      'tblExecutionTimeEntriesEF.executionEntryAuthorIdEF',
      'tblExecutionTimeEntriesEF.executionEntryAuthorNameEF',
      'tblExecutionTimeEntriesEF.executionEntryCreatedAtEF',
      'tblExecutionTimeEntriesEF.executionEntryUpdatedAtEF',
      'tblWbsTasksDP.wbsTaskIdDP',
      'tblWbsTasksDP.wbsTaskPhaseIdDP',
      'tblWbsTasksDP.wbsTaskOrderDP',
      'tblWbsTasksDP.wbsTaskNameDP',
      'tblWbsTasksDP.wbsTaskResponsibleDP',
      'tblWbsTasksDP.wbsTaskEffortHoursDP',
      'tblWbsTasksDP.wbsTaskDurationDaysDP',
      'tblWbsPhasesDP.wbsPhaseIdDP',
      'tblWbsPhasesDP.wbsPhaseOrderDP',
      'tblWbsPhasesDP.wbsPhaseNameDP',
      'tblWbsPhasesDP.wbsPhaseResponsibleDP',
      'tblWbsPhasesDP.wbsPhaseEffortHoursDP',
      'tblWbsPhasesDP.wbsPhaseDurationDaysDP',
      'tblWbsPhasesDP.wbsPhaseNotesDP',
      'tblMilestonesDP.milestoneIdDP',
      'tblMilestonesDP.milestoneNameDP',
      'tblMilestonesDP.milestoneStartDateDP',
      'tblMilestonesDP.milestoneEndDateDP',
      'tblExternalDependenciesDP.externalDependencyIdDP',
      'tblExternalDependenciesDP.externalDependencyDescriDP',
      'tblExternalDependenciesDP.externalDependencyStatusDP',
      'tblExternalDependenciesDP.externalDependencyResponDP',
      'tblExternalDependenciesDP.externalDependencyMitiDP',
      'tblExternalDependenciesDP.externalDependencyPlanBDP'
    ];
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
    const activity = this.firstFilledValue(source, ['milestoneTaskSummaryTextDP']);
    const phase = this.firstFilledValue(source, ['milestoneTaskSummaryPhaseDP']);
    const milestone = this.firstFilledValue(source, ['milestoneTaskSummaryMarcoDP']);
    const taskDetails = this.resolveTaskDetails(source, activity);
    const phaseDetails = this.resolvePhaseDetails(source, phase, taskDetails.phaseId);
    const milestoneDetails = this.resolveMilestoneDetails(source, milestone);

    return {
      documentId: this.firstFilledValue(source, ['documentid', 'documentId', 'cardId']),
      activity: activity,
      dueDate: this.firstFilledValue(source, ['milestoneTaskSummaryDueDateDP']),
      phase: phase,
      phaseResponsible: phaseDetails.responsible,
      phaseEffort: phaseDetails.effortHours,
      milestone: milestone,
      milestonePeriod: milestoneDetails.period,
      parentProcess: this.firstFilledValue(source, ['milestoneTaskSummaryProcessDP']),
      activityResponsible: taskDetails.responsible,
      activityEffort: taskDetails.effortHours,
      projectCode: this.firstFilledValue(source, ['codigoglpi']),
      projectTitle: this.firstFilledValue(source, ['titulodoprojetoNS']),
      projectArea: this.firstFilledValue(source, ['areaUnidadeNS']),
      projectSponsor: this.firstFilledValue(source, ['patrocinadorNS']),
      projectPriority: this.firstFilledValue(source, ['prioridadeNS']),
      requesterName: this.firstFilledValue(source, ['solicitanteNomeNS']),
      glpiActivityId: this.firstFilledValue(source, ['idGLPIAtividade']),
      tiDecision: this.firstFilledValue(source, ['decisaoTiValidacaoAtividade']),
      tiComment: this.firstFilledValue(source, ['validacaoTiComentarioAtividade']),
      tiChecklist: this.parseChecklistState(source.validacaoTiChecklistAtividade),
      tiAgreement: this.normalizeBoolean(source.validacaoTiLiConcordoAtividade),
      dependencies: this.resolveDependencies(source)
    };
  },

  render() {
    const card = this._state.card || {};
    this.setText('#ef-ti-activity-name', card.activity || 'Atividade sem nome informado');
    this.setText('#ef-ti-responsible', card.activityResponsible || 'Nao informado');
    this.setText('#ef-ti-due-date', this.formatDate(card.dueDate) || '-');
    this.setText('#ef-ti-phase-name', card.phase || '-');
    this.setText('#ef-ti-phase-responsible', card.phaseResponsible || '-');
    this.setText('#ef-ti-phase-effort', this.formatEffort(card.phaseEffort) || '-');
    this.setText('#ef-ti-milestone-name', card.milestone || '-');
    this.setText('#ef-ti-milestone-period', card.milestonePeriod || '-');
    this.setText('#ef-ti-estimated-effort', this.formatEffort(card.activityEffort) || '-');
    this.setText('#ef-ti-estimated-hours', this.formatEffort(card.activityEffort) || '-');
    this.setText('#ef-ti-project-code', card.projectCode || '-');
    this.setText('#ef-ti-project-title', card.projectTitle || '-');
    this.setText('#ef-ti-project-area', card.projectArea || '-');
    this.setText('#ef-ti-project-requester', card.requesterName || '-');
    this.setText('#ef-ti-project-responsible', card.activityResponsible || card.phaseResponsible || '-');
    $('#ti-feedback-text').val(card.tiComment || '');
    $('#ti-agreement-checkbox').prop('checked', !!card.tiAgreement);

    $('#ef-ti-responsible-badge').toggleClass('hidden', !this.asText(card.activityResponsible));
    $('#ef-ti-effort-badge').toggleClass('hidden', !this.asText(card.activityEffort));
    $('#ef-ti-estimated-summary').toggleClass('hidden', !this.asText(card.activityEffort));
    $('#ef-ti-phase-responsible-row').toggleClass('hidden', !this.asText(card.phaseResponsible));
    $('#ef-ti-phase-effort-row').toggleClass('hidden', !this.asText(card.phaseEffort));
    $('#ef-ti-milestone-period-row').toggleClass('hidden', !this.asText(card.milestonePeriod));

    this.renderDependencies(card.dependencies);
    this.renderEntries();
    this.renderEffortSummary();
    this.renderAttachmentsList();
    this.renderHistory('#ti-requester-validation-history', this._state.requesterHistory, 'Nenhuma validacao do solicitante registrada.');
    this.renderHistory('#ti-validation-history', this._state.tiHistory, 'Nenhum parecer tecnico anterior registrado.');
    this.renderChecklistState();
    this.toggleTab(this._state.activeTab || 'detail');

    $('#ef-ti-page-alert').addClass('hidden').empty();
    $('#ef-ti-content, #ef-ti-action-footer').removeClass('hidden');
    setTimeout(() => this.updateTabArrows(), 0);
  },

  renderDependencies(dependencies) {
    const items = Array.isArray(dependencies) ? dependencies.filter(Boolean) : [];
    const block = $('#ef-ti-dependencies-block');
    const list = $('#ef-ti-dependencies-list');
    if (!items.length) {
      block.addClass('hidden');
      list.empty();
      return;
    }
    list.html(items.map((dependency) => `
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-circle text-[8px] text-yellow-700" aria-hidden="true"></i>
        <span class="font-medium text-gray-700">${this.escapeHtml(dependency)}</span>
      </div>
    `).join(''));
    block.removeClass('hidden');
  },

  renderEntries() {
    const list = $('#ti-entry-history');
    const activeEntries = this.getActiveEntries(this._state.entries);
    if (!activeEntries.length) {
      list.html('<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Nenhum lancamento registrado.</div>');
      return;
    }
    list.html(activeEntries.map((entry) => this.getEntryMarkup(entry)).join(''));
  },

  getEntryMarkup(entry) {
    const initials = this.getInitials(entry.authorName);
    const durationLabel = this.formatHoursAndMinutes(Number(entry.durationMinutes) || 0);
    return `
      <div class="rounded-xl border border-gray-200 bg-slate-50 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bevap-navy text-sm font-semibold text-white">${this.escapeHtml(initials)}</span>
            <div>
              <div class="font-semibold leading-5 text-bevap-navy">${this.escapeHtml(entry.authorName || 'Usuario')}</div>
              <div class="mt-1 text-xs text-gray-500">${this.escapeHtml(this.formatDate(entry.date))} ${this.escapeHtml(entry.start)} - ${this.escapeHtml(entry.end)}</div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">${this.escapeHtml(durationLabel)}</span>
            <span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500">${this.escapeHtml(this.formatDateTime(entry.updatedAt || entry.createdAt) || '-')}</span>
          </div>
        </div>
        <p class="mt-2 text-sm text-gray-700">${this.escapeHtml(entry.comment || 'Sem comentario.')}</p>
      </div>
    `;
  },

  renderEffortSummary() {
    const usedMinutes = this.sumActiveDurationMinutes(this._state.entries);
    const estimatedMinutes = this.parseEffortMinutes(this._state.card && this._state.card.activityEffort);
    const remainingMinutes = estimatedMinutes ? Math.max(0, estimatedMinutes - usedMinutes) : 0;
    $('#ef-ti-used-hours').text(this.formatHoursAndMinutes(usedMinutes));
    if (estimatedMinutes) {
      $('#ef-ti-estimated-hours').text(this.formatHoursAndMinutes(estimatedMinutes));
      $('#ef-ti-remaining-hours').text(this.formatHoursAndMinutes(remainingMinutes));
      $('#ef-ti-remaining-summary').removeClass('hidden');
    }
  },

  renderAttachmentsList() {
    const list = $('#ti-files-list');
    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    if (!items.length) {
      list.html('<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Nenhum anexo registrado.</div>');
      return;
    }
    list.html(items.map((attachment) => {
      const iconClass = this.getAttachmentIconClass(attachment.fileName);
      return `
        <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
          <div class="flex min-w-0 items-center">
            <i class="fa-solid ${this.escapeHtml(iconClass)} mr-3 text-xl" aria-hidden="true"></i>
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-gray-900">${this.escapeHtml(attachment.fileName || 'arquivo')}</div>
              <div class="text-xs text-gray-500">${this.escapeHtml(attachment.fileSize || '')}</div>
            </div>
          </div>
          <span class="text-xs text-gray-400">Salvo</span>
        </div>
      `;
    }).join(''));
  },

  renderHistory(selector, history, emptyText) {
    const list = $(selector);
    const rows = Array.isArray(history) ? history : [];
    if (!rows.length) {
      list.html(`<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">${this.escapeHtml(emptyText || 'Nenhum registro encontrado.')}</div>`);
      return;
    }
    list.html(rows.map((entry) => this.getHistoryMarkup(entry)).join(''));
  },

  getHistoryMarkup(entry) {
    const decision = this.asText(entry && entry.decision);
    const label = this.getDecisionLabel(decision);
    const badge = decision === 'validado'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : decision === 'correcao' || decision === 'devolver_correcao'
        ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
        : decision === 'nao_continuidade'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-gray-200 bg-white text-gray-600';
    return `
      <div class="rounded-xl border border-gray-200 bg-slate-50 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="font-semibold text-bevap-navy">${this.escapeHtml(entry.userName || 'Usuario')}</div>
            <div class="mt-1 text-xs text-gray-500">${this.escapeHtml(this.formatDateTime(entry.createdAt) || '-')}</div>
          </div>
          <span class="inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge}">${this.escapeHtml(label)}</span>
        </div>
        <p class="mt-2 text-sm text-gray-700">${this.escapeHtml(entry.comment || entry.description || 'Sem observacoes.')}</p>
      </div>
    `;
  },

  getDecisionLabel(decision) {
    const value = this.asText(decision);
    if (value === 'validado') return 'Validado';
    if (value === 'correcao' || value === 'devolver_correcao') return 'Devolvido para correcao';
    if (value === 'nao_continuidade') return 'Nao continuidade';
    return 'Registro';
  },

  renderChecklistState() {
    const savedItems = this._state.card && Array.isArray(this._state.card.tiChecklist.items)
      ? this._state.card.tiChecklist.items
      : [];
    $('.ti-checklist-item').each(function (index, checkbox) {
      checkbox.checked = !!savedItems[index];
    });
    this.updateChecklistProgress();
  },

  toggleTab(tabName) {
    const finalTab = this.asText(tabName) || 'detail';
    this._state.activeTab = finalTab;
    if (finalTab === 'checklist') {
      this._state.checklistVisited = true;
    }
    ['detail', 'requester', 'history', 'checklist'].forEach((tab) => {
      const active = tab === finalTab;
      $(`#tab-ti-${tab}`)
        .toggleClass('border-bevap-green bg-green-50 text-bevap-green', active)
        .toggleClass('border-transparent text-gray-500 hover:text-gray-700', !active);
      $(`#tab-content-ti-${tab}`).toggleClass('hidden', !active);
    });
    this.updateChecklistProgress();
    this.updateTabArrows();
  },

  updateChecklistProgress() {
    const checkboxes = $('.ti-checklist-item');
    const total = checkboxes.length;
    const checked = checkboxes.filter(':checked').length;
    const percent = this.getChecklistProgress(this.collectChecklistState().items);
    const hasPendingItems = total > 0 && checked < total;
    $('#ti-checklist-percentage').text(`${percent}%`);
    $('#ti-checklist-progress').css('width', `${percent}%`);
    $('#ti-checklist-notice').toggleClass('hidden', !hasPendingItems);
    $('#ti-checklist-arrow-notice').toggleClass('hidden', !hasPendingItems).toggleClass('flex', hasPendingItems);
  },

  getChecklistProgress(items) {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return 0;
    const checked = list.filter(Boolean).length;
    return Math.round((checked / list.length) * 100);
  },

  collectChecklistState() {
    return {
      agreement: $('#ti-agreement-checkbox').is(':checked'),
      items: $('.ti-checklist-item').map(function (_, checkbox) {
        return !!checkbox.checked;
      }).get()
    };
  },

  openApproveModal() {
    const validation = this.validateDecisionInput({
      decision: 'validado',
      agreement: $('#ti-agreement-checkbox').is(':checked'),
      checklist: this.collectChecklistState(),
      requireChecklist: true,
      requireAgreement: true
    });
    if (!validation.valid) {
      this.showToast('Validacao pendente', validation.message, 'error');
      this.toggleTab('checklist');
      return;
    }
    this.openConfirmModal({
      title: 'Confirmar Validacao',
      body: 'Confirma o registro da validacao tecnica da atividade?',
      confirmAction: 'confirm-approve-ti',
      confirmLabel: 'Confirmar',
      confirmClass: 'bg-bevap-green hover:bg-green-700'
    });
  },

  openCorrectionModal() {
    $('#modal-root').html(`
      <div id="ti-modal" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 class="text-xl font-bold text-bevap-navy">Devolver para Correcao</h3>
          <p class="mt-3 text-sm text-gray-600">Descreva os pontos que precisam ser corrigidos antes de uma nova validacao tecnica.</p>
          <textarea id="return-reason" rows="4" placeholder="Motivo da devolucao..." class="mt-4 w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-bevap-green"></textarea>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" data-action="close-ti-modal" class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="button" data-action="confirm-return-corrections" class="rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600">Devolver</button>
          </div>
        </div>
      </div>
    `);
  },

  openStopModal() {
    $('#modal-root').html(`
      <div id="ti-modal" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 class="text-xl font-bold text-bevap-navy">Nao Continuidade da Atividade</h3>
          <p class="mt-3 text-sm text-gray-600">Informe categoria e justificativa para encerrar a atividade.</p>
          <select id="discontinue-category" class="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500">
            <option value="">Selecione a categoria</option>
            <option value="tecnica">Inviabilidade tecnica</option>
            <option value="prioridade">Mudanca de prioridade</option>
            <option value="recurso">Recurso indisponivel</option>
            <option value="risco">Risco elevado</option>
            <option value="escopo">Escopo</option>
            <option value="outros">Outros</option>
          </select>
          <textarea id="discontinue-reason" rows="4" placeholder="Descricao detalhada..." class="mt-3 w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-red-500"></textarea>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" data-action="close-ti-modal" class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="button" data-action="confirm-stop-flow" class="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">Confirmar</button>
          </div>
        </div>
      </div>
    `);
  },

  openConfirmModal(config) {
    $('#modal-root').html(`
      <div id="ti-modal" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 class="text-xl font-bold text-bevap-navy">${this.escapeHtml(config.title)}</h3>
          <p class="mt-4 text-gray-700">${this.escapeHtml(config.body)}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" data-action="close-ti-modal" class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="button" data-action="${this.escapeHtml(config.confirmAction)}" class="rounded-lg px-4 py-2 font-medium text-white ${this.escapeHtml(config.confirmClass)}">${this.escapeHtml(config.confirmLabel)}</button>
          </div>
        </div>
      </div>
    `);
  },

  closeModal() {
    $('#modal-root').empty();
  },

  async submitDecision(config) {
    if (this._state.isSubmitting) return;

    const checklist = this.collectChecklistState();
    const validation = this.validateDecisionInput({
      decision: config.decision,
      agreement: checklist.agreement,
      checklist: checklist,
      description: this.asText($(config.descriptionSelector || '').val()),
      category: this.asText($(config.categorySelector || '').val()),
      requireDescription: !!config.descriptionSelector,
      requireCategory: !!config.categorySelector,
      requireChecklist: !!config.requireChecklist,
      requireAgreement: !!config.requireAgreement
    });
    if (!validation.valid) {
      this.showToast('Validacao pendente', validation.message, 'error');
      if (!validation.checklistOk || !validation.agreementOk) this.toggleTab('checklist');
      return;
    }

    try {
      this._state.isSubmitting = true;
      this.setActionButtonsState(true);
      this.setLoading(true, 'Movimentando atividade...');
      await this.waitForUiTick();

      const taskFields = this.collectTiValidationTaskFields({
        decision: config.decision,
        comment: $('#ti-feedback-text').val(),
        description: validation.description,
        category: validation.category,
        checklist: checklist,
        history: this._state.tiHistory
      });

      await fluigService.saveAndSendTask(this.getMovementTaskData(config.comments), taskFields);

      this.closeModal();
      this.showToast('Sucesso', this.asText(config.successMessage) || 'Movimentacao realizada.', 'success');
      setTimeout(() => {
        window.location.hash = '#dashboard';
      }, 900);
    } catch (error) {
      console.error('Erro ao movimentar validacao TI:', error);
      this.showToast('Erro ao movimentar', error && error.message ? error.message : 'Nao foi possivel movimentar a atividade.', 'error');
    } finally {
      this._state.isSubmitting = false;
      this.setActionButtonsState(false);
      this.setLoading(false);
    }
  },

  getMovementTaskData(comments) {
    return {
      id: this._state.processInstanceId,
      numState: this._nextState,
      documentId: this._state.documentId,
      datasetName: this._datasetName,
      comments: this.asText(comments)
    };
  },

  validateDecisionInput(input) {
    const checklist = input && input.checklist ? input.checklist : { agreement: false, items: [] };
    const items = Array.isArray(checklist.items) ? checklist.items : [];
    const allChecklistDone = items.length > 0 && items.every(Boolean);
    const agreementOk = !!(input && input.agreement);
    const description = this.asText(input && input.description);
    const category = this.asText(input && input.category);

    if (input && input.requireChecklist && !allChecklistDone) {
      return { valid: false, checklistOk: false, agreementOk, message: 'Conclua o checklist da TI antes de continuar.', description, category };
    }
    if (input && input.requireAgreement && !agreementOk) {
      return { valid: false, checklistOk: true, agreementOk: false, message: 'Marque a confirmacao da TI antes de continuar.', description, category };
    }
    if (input && input.requireCategory && !category) {
      return { valid: false, checklistOk: true, agreementOk: true, message: 'Selecione a categoria.', description, category };
    }
    if (input && input.requireDescription && !description) {
      return { valid: false, checklistOk: true, agreementOk: true, message: 'Informe a justificativa.', description, category };
    }
    return { valid: true, checklistOk: true, agreementOk: true, description, category };
  },

  collectTiValidationTaskFields(config) {
    const checklist = config && config.checklist ? config.checklist : { agreement: false, items: [] };
    const historyEntry = this.buildTiValidationHistoryEntry(config || {});
    const rowIndex = this.getNextHistoryIndex(config && config.history);

    return [
      { name: 'decisaoTiValidacaoAtividade', value: this.asText(config && config.decision) },
      { name: 'validacaoTiComentarioAtividade', value: this.asText(config && config.comment) },
      { name: 'validacaoTiDescricaoAtividade', value: this.asText(config && config.description) },
      { name: 'validacaoTiCategoriaAtividade', value: this.asText(config && config.category) },
      { name: 'validacaoTiChecklistAtividade', value: JSON.stringify(checklist) },
      { name: 'validacaoTiLiConcordoAtividade', value: checklist.agreement ? 'true' : 'false' },
      { name: `tiValidationIdEF___${rowIndex}`, value: historyEntry.id },
      { name: `tiValidationDecisionEF___${rowIndex}`, value: historyEntry.decision },
      { name: `tiValidationCommentEF___${rowIndex}`, value: historyEntry.comment },
      { name: `tiValidationDescriptionEF___${rowIndex}`, value: historyEntry.description },
      { name: `tiValidationCategoryEF___${rowIndex}`, value: historyEntry.category },
      { name: `tiValidationUserIdEF___${rowIndex}`, value: historyEntry.userId },
      { name: `tiValidationUserNameEF___${rowIndex}`, value: historyEntry.userName },
      { name: `tiValidationCreatedAtEF___${rowIndex}`, value: historyEntry.createdAt }
    ];
  },

  buildTiValidationHistoryEntry(data) {
    const now = new Date().toISOString();
    return {
      id: this.asText(data && data.id) || this.createHistoryId('ti-validation', now),
      decision: this.asText(data && data.decision),
      comment: this.asText(data && data.comment),
      description: this.asText(data && data.description),
      category: this.asText(data && data.category),
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      createdAt: now
    };
  },

  createHistoryId(prefix, now) {
    const timestamp = this.asText(now) || new Date().toISOString();
    return `${prefix}-${timestamp.replace(/[^0-9]/g, '')}`;
  },

  getNextHistoryIndex(history) {
    const indexes = (Array.isArray(history) ? history : [])
      .map((entry) => Number(entry && entry.rowIndex))
      .filter((index) => Number.isFinite(index) && index > 0);
    if (!indexes.length) return 1;
    return Math.max.apply(null, indexes) + 1;
  },

  parseChecklistState(value) {
    const parsed = this.parseJson(value);
    const items = parsed && Array.isArray(parsed.items) ? parsed.items : [];
    while (items.length < 4) items.push(false);
    return {
      agreement: !!(parsed && parsed.agreement),
      items: items.slice(0, 4)
    };
  },

  parseExecutionEntries(card) {
    const source = card || {};
    const tableRows = this.parseTableJson(source.tblExecutionTimeEntriesEF);
    const rowsByIndex = {};
    tableRows.forEach((row, index) => this.mergeExecutionEntryRow(rowsByIndex, row, row.rowIndex || row.index || index + 1));
    this.extractIndexedRows(source, this.getExecutionEntryFieldNames())
      .forEach((row, index) => this.mergeExecutionEntryRow(rowsByIndex, row, row.rowIndex || index + 1));

    return Object.keys(rowsByIndex)
      .sort((a, b) => Number(a) - Number(b))
      .map((idx) => this.normalizeExecutionEntryRow(rowsByIndex[idx] || {}, idx))
      .filter((entry) => this.hasEntryPayload(entry));
  },

  parseRequesterValidationHistory(card) {
    const source = card || {};
    const rows = this.parseHistoryTable({
      source,
      tableName: 'tblRequesterValidationHistoryEF',
      fieldNames: this.getRequesterValidationHistoryFieldNames(),
      normalize: (row, idx) => this.normalizeRequesterValidationHistoryRow(row, idx),
      hasPayload: (entry) => this.hasHistoryPayload(entry)
    });
    if (rows.length) return rows;
    return this.parseLegacyRequesterValidationHistory(source.validacaoSolicitanteHistJson);
  },

  parseTiValidationHistory(card) {
    const source = card || {};
    return this.parseHistoryTable({
      source,
      tableName: 'tblTiValidationHistoryEF',
      fieldNames: this.getTiValidationHistoryFieldNames(),
      normalize: (row, idx) => this.normalizeTiValidationHistoryRow(row, idx),
      hasPayload: (entry) => this.hasHistoryPayload(entry)
    });
  },

  parseHistoryTable(config) {
    const source = config.source || {};
    const rowsByIndex = {};
    this.parseTableJson(source[config.tableName]).forEach((row, index) => this.mergeHistoryRow(rowsByIndex, row, config.fieldNames, row.rowIndex || row.index || index + 1));
    this.extractIndexedRows(source, config.fieldNames)
      .forEach((row, index) => this.mergeHistoryRow(rowsByIndex, row, config.fieldNames, row.rowIndex || index + 1));

    return Object.keys(rowsByIndex)
      .sort((a, b) => Number(a) - Number(b))
      .map((idx) => config.normalize(rowsByIndex[idx] || {}, idx))
      .filter((entry) => config.hasPayload(entry));
  },

  parseLegacyRequesterValidationHistory(value) {
    const parsed = this.parseJson(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry, index) => ({
        id: this.asText(entry && entry.id) || `legacy:${index + 1}`,
        rowIndex: index + 1,
        decision: this.asText(entry && entry.decision),
        comment: this.asText(entry && entry.comment),
        description: this.asText(entry && entry.description),
        category: this.asText(entry && entry.category),
        userId: this.asText(entry && entry.userId),
        userName: this.asText(entry && entry.userName),
        createdAt: this.asText(entry && entry.createdAt)
      }))
      .filter((entry) => this.hasHistoryPayload(entry));
  },

  getRequesterValidationHistoryFieldNames() {
    return [
      'requesterValidationIdEF',
      'requesterValidationDecisionEF',
      'requesterValidationCommentEF',
      'requesterValidationDescEF',
      'requesterValidationCategoryEF',
      'requesterValidationUserIdEF',
      'requesterValidationUserNameEF',
      'requesterValidationCreatedAtEF'
    ];
  },

  getTiValidationHistoryFieldNames() {
    return [
      'tiValidationIdEF',
      'tiValidationDecisionEF',
      'tiValidationCommentEF',
      'tiValidationDescriptionEF',
      'tiValidationCategoryEF',
      'tiValidationUserIdEF',
      'tiValidationUserNameEF',
      'tiValidationCreatedAtEF'
    ];
  },

  mergeHistoryRow(rowsByIndex, row, fieldNames, fallbackIndex) {
    if (!row) return;
    const rowIndex = Number(row.rowIndex) || Number(fallbackIndex) || 1;
    rowsByIndex[rowIndex] = rowsByIndex[rowIndex] || { rowIndex };
    (fieldNames || []).forEach((fieldName) => {
      const value = row[fieldName];
      if (value !== undefined && value !== null && this.asText(value)) {
        rowsByIndex[rowIndex][fieldName] = value;
      }
    });
  },

  normalizeRequesterValidationHistoryRow(row, idx) {
    const rowIndex = Number(row.rowIndex) || Number(idx);
    return {
      id: this.asText(row.requesterValidationIdEF) || `legacy:${rowIndex}`,
      rowIndex: rowIndex,
      decision: this.asText(row.requesterValidationDecisionEF),
      comment: this.asText(row.requesterValidationCommentEF),
      description: this.asText(row.requesterValidationDescEF),
      category: this.asText(row.requesterValidationCategoryEF),
      userId: this.asText(row.requesterValidationUserIdEF),
      userName: this.asText(row.requesterValidationUserNameEF),
      createdAt: this.asText(row.requesterValidationCreatedAtEF)
    };
  },

  normalizeTiValidationHistoryRow(row, idx) {
    const rowIndex = Number(row.rowIndex) || Number(idx);
    return {
      id: this.asText(row.tiValidationIdEF) || `legacy:${rowIndex}`,
      rowIndex: rowIndex,
      decision: this.asText(row.tiValidationDecisionEF),
      comment: this.asText(row.tiValidationCommentEF),
      description: this.asText(row.tiValidationDescriptionEF),
      category: this.asText(row.tiValidationCategoryEF),
      userId: this.asText(row.tiValidationUserIdEF),
      userName: this.asText(row.tiValidationUserNameEF),
      createdAt: this.asText(row.tiValidationCreatedAtEF)
    };
  },

  hasHistoryPayload(entry) {
    return Boolean(
      this.asText(entry && entry.decision)
      || this.asText(entry && entry.comment)
      || this.asText(entry && entry.description)
      || this.asText(entry && entry.category)
      || this.asText(entry && entry.userName)
      || this.asText(entry && entry.createdAt)
    );
  },

  getExecutionEntryFieldNames() {
    return [
      'executionEntryIdEF',
      'executionEntryStatusEF',
      'executionEntryDateEF',
      'executionEntryStartEF',
      'executionEntryEndEF',
      'executionEntryDurationEF',
      'executionEntryCommentEF',
      'executionEntryAuthorIdEF',
      'executionEntryAuthorNameEF',
      'executionEntryCreatedAtEF',
      'executionEntryUpdatedAtEF'
    ];
  },

  mergeExecutionEntryRow(rowsByIndex, row, fallbackIndex) {
    if (!row) return;
    const rowIndex = Number(row.rowIndex) || Number(fallbackIndex) || 1;
    rowsByIndex[rowIndex] = rowsByIndex[rowIndex] || { rowIndex };
    this.getExecutionEntryFieldNames().forEach((fieldName) => {
      const value = row[fieldName];
      if (value !== undefined && value !== null && this.asText(value)) {
        rowsByIndex[rowIndex][fieldName] = value;
      }
    });
  },

  normalizeExecutionEntryRow(row, idx) {
    const rowIndex = Number(row.rowIndex) || Number(idx);
    return {
      id: this.asText(row.executionEntryIdEF) || `legacy:${rowIndex}`,
      rowIndex: rowIndex,
      status: this.asText(row.executionEntryStatusEF) || 'active',
      date: this.asText(row.executionEntryDateEF),
      start: this.asText(row.executionEntryStartEF),
      end: this.asText(row.executionEntryEndEF),
      durationMinutes: Number(row.executionEntryDurationEF) || this.calculateDurationMinutes(row.executionEntryStartEF, row.executionEntryEndEF),
      comment: this.asText(row.executionEntryCommentEF),
      authorId: this.asText(row.executionEntryAuthorIdEF),
      authorName: this.asText(row.executionEntryAuthorNameEF),
      createdAt: this.asText(row.executionEntryCreatedAtEF),
      updatedAt: this.asText(row.executionEntryUpdatedAtEF)
    };
  },

  hasEntryPayload(entry) {
    return Boolean(
      this.asText(entry && entry.date)
      || this.asText(entry && entry.start)
      || this.asText(entry && entry.end)
      || this.asText(entry && entry.comment)
      || this.asText(entry && entry.authorName)
      || Number(entry && entry.durationMinutes) > 0
    );
  },

  getActiveEntries(entries) {
    return (Array.isArray(entries) ? entries : []).filter((entry) => this.asText(entry.status).toLowerCase() !== 'deleted');
  },

  sumActiveDurationMinutes(entries) {
    return this.getActiveEntries(entries).reduce((total, entry) => total + (Number(entry.durationMinutes) || 0), 0);
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
    return { totalMinutes: (hour * 60) + minute };
  },

  parsePersistedAttachments(rawValue) {
    const parsed = this.parseJson(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((attachment, index) => ({
      id: this.asText(attachment.documentId || attachment.id || `persisted:${index}`),
      fileName: this.asText(attachment.fileName || attachment.documentDescription),
      fileSize: this.asText(attachment.fileSize),
      version: this.asText(attachment.version)
    })).filter((attachment) => attachment.fileName);
  },

  resolveTaskDetails(source, activityName) {
    const rows = this.getTableRows(source, 'tblWbsTasksDP', [
      'wbsTaskIdDP',
      'wbsTaskPhaseIdDP',
      'wbsTaskOrderDP',
      'wbsTaskNameDP',
      'wbsTaskResponsibleDP',
      'wbsTaskEffortHoursDP',
      'wbsTaskDurationDaysDP'
    ]);
    const activityKey = this.normalizeLookup(activityName);
    const matched = rows.find((row) => this.normalizeLookup(row.wbsTaskNameDP) === activityKey)
      || rows.find((row) => {
        const rowKey = this.normalizeLookup(row.wbsTaskNameDP);
        return activityKey && rowKey && (rowKey.indexOf(activityKey) >= 0 || activityKey.indexOf(rowKey) >= 0);
      })
      || {};
    return {
      id: this.asText(matched.wbsTaskIdDP),
      phaseId: this.asText(matched.wbsTaskPhaseIdDP),
      responsible: this.asText(matched.wbsTaskResponsibleDP),
      effortHours: this.asText(matched.wbsTaskEffortHoursDP)
    };
  },

  resolvePhaseDetails(source, phaseName, phaseId) {
    const rows = this.getTableRows(source, 'tblWbsPhasesDP', [
      'wbsPhaseIdDP',
      'wbsPhaseOrderDP',
      'wbsPhaseNameDP',
      'wbsPhaseResponsibleDP',
      'wbsPhaseEffortHoursDP',
      'wbsPhaseDurationDaysDP',
      'wbsPhaseNotesDP'
    ]);
    const finalPhaseId = this.asText(phaseId);
    const phaseKey = this.normalizeLookup(phaseName);
    const matched = rows.find((row) => finalPhaseId && this.asText(row.wbsPhaseIdDP) === finalPhaseId)
      || rows.find((row) => this.normalizeLookup(row.wbsPhaseNameDP) === phaseKey)
      || {};
    return {
      id: this.asText(matched.wbsPhaseIdDP),
      responsible: this.asText(matched.wbsPhaseResponsibleDP),
      effortHours: this.asText(matched.wbsPhaseEffortHoursDP)
    };
  },

  resolveMilestoneDetails(source, milestoneName) {
    const rows = this.getTableRows(source, 'tblMilestonesDP', [
      'milestoneIdDP',
      'milestoneNameDP',
      'milestoneStartDateDP',
      'milestoneEndDateDP'
    ]);
    const milestoneKey = this.normalizeLookup(milestoneName);
    const matched = rows.find((row) => this.normalizeLookup(row.milestoneNameDP) === milestoneKey) || {};
    return {
      id: this.asText(matched.milestoneIdDP),
      period: this.joinDateRange(matched.milestoneStartDateDP, matched.milestoneEndDateDP)
    };
  },

  resolveDependencies(source) {
    const dependencies = [];
    const rows = this.getTableRows(source, 'tblExternalDependenciesDP', [
      'externalDependencyIdDP',
      'externalDependencyDescriDP',
      'externalDependencyStatusDP',
      'externalDependencyResponDP',
      'externalDependencyMitiDP',
      'externalDependencyPlanBDP'
    ]);
    rows.forEach((row) => this.pushUnique(dependencies, row.externalDependencyDescriDP));
    this.parseDependencyText(source.dependenciastecnicasAPTI).forEach((item) => this.pushUnique(dependencies, item));
    this.parseDependencyText(source.dependenciasNS).forEach((item) => this.pushUnique(dependencies, item));
    return dependencies;
  },

  extractIndexedRows(source, fieldNames) {
    const rowsByIndex = {};
    const allowed = {};
    (fieldNames || []).forEach((fieldName) => {
      allowed[fieldName] = true;
    });
    Object.keys(source || {}).forEach((fieldName) => {
      const match = String(fieldName).match(/^(.+)___(\d+)$/);
      if (!match || !allowed[match[1]]) return;
      const baseName = match[1];
      const rowIndex = Number(match[2]);
      rowsByIndex[rowIndex] = rowsByIndex[rowIndex] || { rowIndex };
      rowsByIndex[rowIndex][baseName] = source[fieldName];
    });
    return Object.keys(rowsByIndex)
      .sort((a, b) => Number(a) - Number(b))
      .map((idx) => rowsByIndex[idx]);
  },

  getTableRows(source, tableName, fallbackFieldNames) {
    const rows = this.parseTableJson(source && (source[tableName] || source[String(tableName)]));
    if (rows.length) return rows;
    return this.extractIndexedRows(source, fallbackFieldNames);
  },

  parseTableJson(value) {
    if (Array.isArray(value)) return value;
    const text = this.asText(value);
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  parseJson(value) {
    const text = this.asText(value);
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  },

  parseDependencyText(value) {
    const text = this.asText(value);
    if (!text) return [];
    return text
      .split(/\r?\n|;/)
      .map((item) => this.asText(item).replace(/^[-*\s]+/, ''))
      .filter(Boolean);
  },

  pushUnique(list, value) {
    const text = this.asText(value);
    if (!text) return;
    const key = this.normalizeLookup(text);
    if (!list.some((item) => this.normalizeLookup(item) === key)) {
      list.push(text);
    }
  },

  firstFilledValue(source, fields) {
    for (const field of fields) {
      const value = this.asText(source[field]);
      if (value) return value;
    }
    return '';
  },

  normalizeBoolean(value) {
    const normalized = this.normalizeLookup(value);
    return normalized === 'true' || normalized === '1' || normalized === 'sim' || normalized === 'yes';
  },

  asText(value) {
    if (value === null || value === undefined) return '';
    if (String(value).trim().toLowerCase() === 'null') return '';
    return String(value).trim();
  },

  normalizeId(value) {
    const normalized = this.asText(value);
    return normalized || null;
  },

  normalizeLookup(value) {
    return this.asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  },

  formatDate(value) {
    const text = this.asText(value);
    if (!text) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const parts = text.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return text;
  },

  joinDateRange(startDate, endDate) {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    if (start && end) return `${start} a ${end}`;
    return start || end || '';
  },

  formatEffort(value) {
    const text = this.asText(value);
    if (!text) return '';
    if (/[a-zA-Z]/.test(text)) return text;
    return `${text}h`;
  },

  parseEffortMinutes(value) {
    const text = this.asText(value).toLowerCase().replace(',', '.');
    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 0;
    return Math.round(Number(match[1]) * 60) || 0;
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

  getAttachmentIconClass(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  getCurrentUserId() {
    if (typeof WCMAPI !== 'undefined' && WCMAPI.getUserCode) return this.asText(WCMAPI.getUserCode());
    return '';
  },

  getCurrentUserName() {
    if (typeof WCMAPI !== 'undefined' && WCMAPI.getUser) return this.asText(WCMAPI.getUser());
    return 'Usuario';
  },

  updateTabArrows() {
    const scroller = document.getElementById('ti-panel-tabs-scroll');
    const leftArrow = document.getElementById('ti-panel-tabs-left-arrow');
    const rightArrow = document.getElementById('ti-panel-tabs-right-arrow');
    if (!scroller || !leftArrow || !rightArrow) return;
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const hasOverflow = maxScroll > 2;
    const atStart = scroller.scrollLeft <= 2;
    const atEnd = scroller.scrollLeft >= maxScroll - 2;
    leftArrow.classList.toggle('opacity-0', !hasOverflow || atStart);
    leftArrow.classList.toggle('pointer-events-none', !hasOverflow || atStart);
    rightArrow.classList.toggle('opacity-0', !hasOverflow || atEnd);
    rightArrow.classList.toggle('pointer-events-none', !hasOverflow || atEnd);
  },

  scrollTabsToStart() {
    const scroller = document.getElementById('ti-panel-tabs-scroll');
    if (!scroller) return;
    scroller.scrollTo({ left: 0, behavior: 'smooth' });
    setTimeout(() => this.updateTabArrows(), 360);
  },

  scrollTabsToEnd() {
    const scroller = document.getElementById('ti-panel-tabs-scroll');
    if (!scroller) return;
    scroller.scrollTo({ left: scroller.scrollWidth - scroller.clientWidth, behavior: 'smooth' });
    setTimeout(() => this.updateTabArrows(), 360);
  },

  renderError(message) {
    $('#ef-ti-content, #ef-ti-action-footer').addClass('hidden');
    $('#ef-ti-page-alert').removeClass('hidden').html(`
      <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        ${this.escapeHtml(message)}
      </div>
    `);
  },

  setLoading(isVisible, label = 'Carregando...') {
    $('#ui-loading-label').text(label);
    $('#ui-loading-overlay').toggleClass('hidden', !isVisible);
  },

  setActionButtonsState(isDisabled) {
    $('[data-action="approve-ti"], [data-action="return-corrections"], [data-action="stop-flow"]')
      .prop('disabled', Boolean(isDisabled))
      .toggleClass('opacity-70 cursor-not-allowed', Boolean(isDisabled));
  },

  waitForUiTick() {
    return new Promise((resolve) => setTimeout(resolve, 80));
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
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.addClass('hidden'), 3500);
  },

  setText(selector, value) {
    $(selector).text(this.asText(value));
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
  window.executionActivityTiValidationController = executionActivityTiValidationController;
}
