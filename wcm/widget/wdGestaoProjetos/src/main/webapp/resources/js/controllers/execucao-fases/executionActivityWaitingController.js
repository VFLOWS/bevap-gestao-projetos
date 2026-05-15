const executionActivityWaitingController = {
  _formId: '113669',
  _datasetId: 'dsGetExecucaoAtividade',
  _datasetName: 'formExecucaoAtividade',
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
      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields: this.getExecutionDatasetFields(),
        filters: {
          documentid: this._state.documentId,
          sqlLimit: 1
        }
      });
      const card = Array.isArray(rows) ? rows[0] : rows;

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

  getExecutionDatasetFields() {
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
      'dependenciastecnicasAPTI',
      'dependenciasNS',
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
      dependencies: this.resolveDependencies(source)
    };
  },

  renderCard(card) {
    this.setText('#ef-activity-name', card.activity || 'Atividade sem nome informado');
    this.setText('#ef-responsible', card.activityResponsible || 'Nao informado');
    this.setText('#ef-due-date', this.formatDate(card.dueDate) || '-');
    this.setText('#ef-phase-name', card.phase || '-');
    this.setText('#ef-phase-responsible', card.phaseResponsible || '-');
    this.setText('#ef-phase-effort', this.formatEffort(card.phaseEffort) || '-');
    this.setText('#ef-milestone-name', card.milestone || '-');
    this.setText('#ef-milestone-period', card.milestonePeriod || '-');
    this.setText('#ef-activity-effort', this.formatEffort(card.activityEffort) || '-');
    this.setText('#ef-project-code', card.projectCode || '-');
    this.setText('#ef-project-title', card.projectTitle || '-');
    this.setText('#ef-project-area', card.projectArea || '-');
    this.setText('#ef-project-sponsor', card.projectSponsor || '-');
    this.setText('#ef-project-priority', card.projectPriority || '-');
    this.setText('#ef-project-requester', card.requesterName || '-');
    this.setText('#ef-project-responsible', card.activityResponsible || card.phaseResponsible || '-');

    $('#ef-responsible-badge').toggleClass('hidden', !this.asText(card.activityResponsible));
    $('#ef-effort-badge').toggleClass('hidden', !this.asText(card.activityEffort));
    $('#ef-phase-responsible-row').toggleClass('hidden', !this.asText(card.phaseResponsible));
    $('#ef-phase-effort-row').toggleClass('hidden', !this.asText(card.phaseEffort));
    $('#ef-milestone-period-row').toggleClass('hidden', !this.asText(card.milestonePeriod));

    this.renderDependencies(card.dependencies);

    $('#ef-page-alert').addClass('hidden').empty();
    $('#ef-content, #ef-action-footer').removeClass('hidden');
  },

  renderDependencies(dependencies) {
    const items = Array.isArray(dependencies) ? dependencies.filter(Boolean) : [];
    const block = $('#ef-dependencies-block');
    const list = $('#ef-dependencies-list');

    if (!items.length) {
      block.addClass('hidden');
      list.empty();
      return;
    }

    list.html(items.map((dependency) => `
      <div class="flex items-center gap-2 text-sm text-gray-700">
        <i class="fa-solid fa-triangle-exclamation text-yellow-500" aria-hidden="true"></i>
        <span>${this.escapeHtml(dependency)}</span>
      </div>
    `).join(''));
    block.removeClass('hidden');
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
    const toastTitle = $('#toast-title');
    const toastMessage = $('#toast-message');
    const toastIcon = $('#toast-icon');
    const isError = type === 'error';
    const selected = isError
      ? {
        border: 'border-red-500',
        icon: 'fa-solid fa-circle-xmark text-xl text-red-600',
        title: 'Erro'
      }
      : {
        border: 'border-emerald-500',
        icon: 'fa-solid fa-circle-check text-xl text-emerald-600',
        title: 'Sucesso'
      };

    toast
      .removeClass('hidden border-emerald-500 border-red-500 border-blue-500')
      .addClass(selected.border);
    toastIcon.removeClass().addClass(selected.icon);
    toastTitle.text(selected.title);
    toastMessage.text(message);

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

    if (!rows.length) {
      return {};
    }

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

    if (!rows.length) {
      return {};
    }

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

    if (!rows.length) {
      return {};
    }

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

    rows.forEach((row) => {
      this.pushUnique(dependencies, row.externalDependencyDescriDP);
    });

    this.parseDependencyText(source.dependenciastecnicasAPTI).forEach((item) => {
      this.pushUnique(dependencies, item);
    });

    this.parseDependencyText(source.dependenciasNS).forEach((item) => {
      this.pushUnique(dependencies, item);
    });

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
      if (!match || !allowed[match[1]]) {
        return;
      }

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
    const rows = this.parseTableJson(source && source[tableName]);
    if (rows.length) {
      return rows;
    }

    return this.extractIndexedRows(source, fallbackFieldNames);
  },

  parseTableJson(value) {
    if (Array.isArray(value)) {
      return value;
    }

    const text = this.asText(value);
    if (!text) {
      return [];
    }

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  parseDependencyText(value) {
    const text = this.asText(value);
    if (!text) {
      return [];
    }

    return text
      .split(/\r?\n|;/)
      .map((item) => this.asText(item).replace(/^[-*\s]+/, ''))
      .filter(Boolean);
  },

  pushUnique(list, value) {
    const text = this.asText(value);
    if (!text) {
      return;
    }

    const key = this.normalizeLookup(text);
    const exists = list.some((item) => this.normalizeLookup(item) === key);
    if (!exists) {
      list.push(text);
    }
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

    if (String(value).trim().toLowerCase() === 'null') {
      return '';
    }

    return String(value).trim();
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

  joinDateRange(startDate, endDate) {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);

    if (start && end) {
      return `${start} a ${end}`;
    }

    return start || end || '';
  },

  formatEffort(value) {
    const text = this.asText(value);
    if (!text) {
      return '';
    }

    if (/[a-zA-Z]/.test(text)) {
      return text;
    }

    return `${text}h`;
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
