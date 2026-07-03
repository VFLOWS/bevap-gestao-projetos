const epUserTrainingController = {
  _eventNamespace: '.epUserTraining',
  _datasetId: 'dsGetEntregaProjetos',
  _formDatasetName: 'DSFormEntregaProjetos',
  _formName: 'FormEntregaProjetos',
  _approveState: '24',
  _returnState: '24',
  _decisionField: 'decisaoTreinamentoEP',
  _justificationField: 'justifTreinamentoEP',
  _correctionField: 'treinamentoCorrecaoEP',
  _hasTrainingField: 'temTreinamentoEP',
  _toastTimer: null,
  _headerBackup: null,
  _state: {
    documentId: '',
    processInstanceId: '',
    projectSummary: {},
    deliveryPlans: [],
    documents: [],
    existingPlanIndexes: [],
    existingDependencyIndexes: [],
    isSubmitting: false
  },

  load: async function (params) {
    params = params || {};
    this._state.documentId = this.asText(params.documentId);
    this._state.processInstanceId = this.asText(params.processInstanceId);
    this._state.projectSummary = {};
    this._state.deliveryPlans = [];
    this._state.documents = [];
    this._state.existingPlanIndexes = [];
    this._state.existingDependencyIndexes = [];
    this._state.isSubmitting = false;

    try {
      var html = await $.get(this.getTemplateUrl());
      $('#page-container').html(html);
      this.backupAndSetHeader();
      this.bindEvents();
      await this.loadData();
      this.renderAll();
    } catch (error) {
      console.error('[epUserTraining] load error:', error);
      $('#page-container').html('<div class="p-6 text-red-600">Falha ao carregar a tela de treinamento dos usuarios.</div>');
    }
  },

  destroy: function () {
    $('#page-container').off(this._eventNamespace);
    this.restoreHeader();
    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }
  },

  getTemplateUrl: function () {
    return WCMAPI.getServerURL() + '/wdGestaoProjetos/resources/js/templates/entrega-projetos/ep-user-training.html';
  },

  backupAndSetHeader: function () {
    var header = $('#header');
    if (!header.length) return;
    var titleEl = header.find('h1').first();
    var breadcrumbEl = header.find('nav').first();

    if (!this._headerBackup) {
      this._headerBackup = {
        title: titleEl.length ? titleEl.text() : '',
        breadcrumbHtml: breadcrumbEl.length ? breadcrumbEl.html() : ''
      };
    }

    if (titleEl.length) titleEl.text('Treinamento dos Usuarios da Entrega');
    if (breadcrumbEl.length) {
      breadcrumbEl.html([
        '<a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"><i class="fa-solid fa-house text-xs"></i><span>Inicio</span></a>',
        '<span class="text-gray-400">/</span>',
        '<span class="text-gray-300">Planejamento</span>',
        '<span class="text-gray-400">/</span>',
        '<span class="text-gray-300">Execucao do Projeto</span>',
        '<span class="text-gray-400">/</span>',
        '<span class="font-medium text-bevap-gold">Treinamento dos Usuarios</span>'
      ].join(''));
    }
  },

  restoreHeader: function () {
    if (!this._headerBackup) return;
    var header = $('#header');
    if (!header.length) return;
    var titleEl = header.find('h1').first();
    var breadcrumbEl = header.find('nav').first();
    if (titleEl.length) titleEl.text(this._headerBackup.title || '');
    if (breadcrumbEl.length) breadcrumbEl.html(this._headerBackup.breadcrumbHtml || '');
    this._headerBackup = null;
  },

  bindEvents: function () {
    var self = this;
    var container = $('#page-container');
    container.off(this._eventNamespace);

    container.on('click' + this._eventNamespace, '[data-action="save-training-draft"]', function () {
      self.saveDraft();
    });
    container.on('click' + this._eventNamespace, '[data-action="open-return-modal"]', function () {
      self.openReturnModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="close-return-modal"]', function () {
      self.closeReturnModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="confirm-return-modal"]', function () {
      self.confirmReturnModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="open-conclude-modal"]', function () {
      self.openConcludeModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="close-conclude-modal"]', function () {
      self.closeConcludeModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="confirm-conclude-modal"]', function () {
      self.confirmConcludeModal();
    });
    container.on('change' + this._eventNamespace, '.ep-training-status', function () {
      self.updateTrainingField($(this).attr('data-plan-id'), 'trainingSelection', $(this).val());
      self.renderTrainingList();
    });
    container.on('click' + this._eventNamespace, '[data-action="mark-training-realized"]', function () {
      self.markTrainingStatus($(this).attr('data-plan-id'), 'realizado');
    });
    container.on('click' + this._eventNamespace, '[data-action="mark-training-not-realized"]', function () {
      self.markTrainingStatus($(this).attr('data-plan-id'), 'nao_realizado');
    });
    container.on('click' + this._eventNamespace, '[data-action="edit-training"]', function () {
      self.openTrainingEdit($(this).attr('data-plan-id'));
    });
    container.on('click' + this._eventNamespace, '[data-action="cancel-training-edit"]', function () {
      self.cancelTrainingEdit($(this).attr('data-plan-id'));
    });
    container.on('input change' + this._eventNamespace, '.ep-training-date', function () {
      self.updateTrainingField($(this).attr('data-plan-id'), 'trainingDate', $(this).val());
    });
    container.on('input' + this._eventNamespace, '.ep-training-notes', function () {
      self.updateTrainingField($(this).attr('data-plan-id'), 'trainingNotes', $(this).val());
    });
    container.on('input' + this._eventNamespace, '.ep-training-justif', function () {
      self.updateTrainingField($(this).attr('data-plan-id'), 'trainingJustification', $(this).val());
    });
    container.on('click' + this._eventNamespace, '.ep-training-dropzone', function () {
      $(this).closest('.ep-training-attachments').find('.ep-training-attachments-input').trigger('click');
    });
    container.on('change' + this._eventNamespace, '.ep-training-attachments-input', function () {
      self.addTrainingAttachments($(this).attr('data-plan-id'), this.files);
      this.value = '';
    });
    container.on('click' + this._eventNamespace, '[data-action="remove-training-attachment"]', function () {
      self.removeTrainingAttachment($(this).attr('data-plan-id'), parseInt($(this).attr('data-attachment-index'), 10));
    });
  },

  loadData: async function () {
    var rows = await fluigService.getDatasetRows(this._datasetId, {
      filters: { documentid: this._state.documentId },
      sortFields: ['documentid desc']
    });
    var row = rows && rows.length ? rows[0] : null;
    if (!row) return;
    this._state.projectSummary = this.extractProjectSummary(row);
    this._state.documents = this.parsePersistedAttachments(this.getValIgnoreCase(row, 'anexosEntregaEP'));
    this._state.deliveryPlans = this.extractDeliveryPlans(row);
  },

  renderAll: function () {
    this.renderProjectSummary();
    this.renderProgress();
    this.renderTrainingList();
    this.renderConcludeMessage();
  },

  renderProjectSummary: function () {
    var summary = this._state.projectSummary || {};
    $('#ep-training-project-code').text(summary.code || '-');
    $('#ep-training-project-title').text(summary.title || '-');
    $('#ep-training-project-requester').text(summary.requester || '-');
  },

  renderProgress: function () {
    $('#ep-training-progress-list').html([
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Execucao do projeto concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Validacao do solicitante concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Validacao do TI concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Planejamento GO Live concluido</span></div>',
      '<div class="flex items-center text-bevap-gold"><i class="fa-solid fa-clock mr-2"></i><span>Treinamento dos usuarios em validacao</span></div>'
    ].join(''));
  },

  renderConcludeMessage: function () {
    var summary = this._state.projectSummary || {};
    $('#ep-training-conclude-message').html('Voce esta confirmando a conclusao dos treinamentos dos usuarios do projeto <strong>' + this.escapeHtml((summary.code || '-') + ' - ' + (summary.title || '-')) + '</strong>.');
  },

  renderTrainingList: function () {
    var self = this;
    var trainings = this.getTrainingPlans();
    $('#ep-training-empty').toggleClass('hidden', trainings.length > 0);
    $('#ep-training-list').html(trainings.map(function (training) {
      return self.getTrainingCardHtml(training);
    }).join(''));
  },

  getTrainingCardHtml: function (training) {
    var status = this.asText(training.trainingStatus);
    var selection = this.asText(training.trainingSelection || status);
    var isEditing = !!training.trainingEditing;
    var displayStatus = status;
    var isRealized = status === 'realizado';
    var isNotRealized = status === 'nao_realizado';
    var isResolved = isRealized || isNotRealized;
    var canEdit = isResolved && !isEditing;
    var shouldShowDecision = !isResolved || isEditing;
    var cardClasses = isRealized
      ? 'rounded-xl border border-emerald-200 bg-white p-5 shadow-sm'
      : isNotRealized
        ? 'rounded-xl border border-red-200 bg-white p-5 shadow-sm'
        : 'rounded-xl border border-amber-200 bg-white p-5 shadow-sm';
    var panelClasses = isRealized
      ? 'mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4'
      : isNotRealized
        ? 'mt-4 rounded-xl border border-red-200 bg-red-50 p-4'
        : 'mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4';
    var contentClasses = isRealized
      ? 'mt-4 rounded-xl border border-emerald-200 bg-white p-4 space-y-4'
      : isNotRealized
        ? 'mt-4 rounded-xl border border-red-200 bg-white p-4 space-y-4'
        : 'mt-4 rounded-xl border border-amber-200 bg-white p-4 space-y-4';
    var inputClasses = isRealized
      ? 'w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm'
      : isNotRealized
        ? 'w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm'
        : 'w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm';
    var headerActions = canEdit
      ? '<button type="button" data-action="edit-training" data-plan-id="' + this.escapeHtml(training.id) + '" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700" title="Editar treinamento" aria-label="Editar treinamento"><i class="fa-solid fa-pen text-sm"></i></button>'
      : '';
    var realizedDateMeta = isRealized && !isEditing
      ? '<span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 md:ml-auto"><i class="fa-solid fa-calendar-check mr-1 text-gray-500"></i>Data Realizacao: ' + this.escapeHtml(this.formatBrDateTime(training.trainingDate) || '-') + '</span>'
      : '';
    var decisionOptions = shouldShowDecision ? [
      '    <div>',
      '      <label class="mb-2 block text-sm text-gray-600">Treinamento <span class="font-semibold text-red-500">*</span></label>',
      '      <div class="flex flex-wrap gap-4">',
      '        <label class="inline-flex items-center gap-2 text-sm text-gray-700"><input type="radio" class="ep-training-status h-4 w-4 border-gray-300 text-bevap-green focus:ring-bevap-green" name="ep-training-status-' + this.escapeHtml(training.id) + '" data-plan-id="' + this.escapeHtml(training.id) + '" value="realizado"' + (selection === 'realizado' ? ' checked' : '') + '><span>Realizado</span></label>',
      '        <label class="inline-flex items-center gap-2 text-sm text-gray-700"><input type="radio" class="ep-training-status h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500" name="ep-training-status-' + this.escapeHtml(training.id) + '" data-plan-id="' + this.escapeHtml(training.id) + '" value="nao_realizado"' + (selection === 'nao_realizado' ? ' checked' : '') + '><span>Nao Realizado</span></label>',
      '      </div>',
      '    </div>'
    ].join('') : '';
    var actionSection = '';
    if (shouldShowDecision && selection === 'realizado') {
      actionSection = [
        '    <div><label class="mb-1 block text-sm text-gray-600">Data da Realizacao <span class="font-semibold text-red-500">*</span></label><input type="datetime-local" value="' + this.escapeHtml(training.trainingDate || '') + '" data-plan-id="' + this.escapeHtml(training.id) + '" class="ep-training-date ' + inputClasses + '"></div>',
        '    <div class="flex items-end"><button type="button" data-action="mark-training-realized" data-plan-id="' + this.escapeHtml(training.id) + '" class="w-full rounded-lg bg-bevap-green px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"><i class="fa-solid fa-check mr-2"></i>Confirmar Realizacao</button></div>'
      ].join('');
    } else if (shouldShowDecision && selection === 'nao_realizado') {
      actionSection = [
        '    <div><label class="mb-1 block text-sm text-gray-600">Justificativa <span class="font-semibold text-red-500">*</span></label><textarea data-plan-id="' + this.escapeHtml(training.id) + '" class="ep-training-justif ' + inputClasses + '" rows="3" placeholder="Descreva o motivo quando o treinamento nao for realizado.">' + this.escapeHtml(training.trainingJustification || '') + '</textarea></div>',
        '    <div class="flex items-end"><button type="button" data-action="mark-training-not-realized" data-plan-id="' + this.escapeHtml(training.id) + '" class="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"><i class="fa-solid fa-ban mr-2"></i>Marcar como Nao Realizado</button></div>'
      ].join('');
    } else if (isNotRealized && !isEditing) {
      actionSection = '    <div><label class="mb-1 block text-sm text-gray-600">Justificativa</label><textarea class="' + inputClasses + '" rows="3" readonly>' + this.escapeHtml(training.trainingJustification || '') + '</textarea></div>';
    }
    var editActions = isEditing
      ? '    <div class="flex flex-wrap justify-end gap-3"><button type="button" data-action="cancel-training-edit" data-plan-id="' + this.escapeHtml(training.id) + '" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancelar</button></div>'
      : '';
    var notesAttrs = isResolved && !isEditing ? ' readonly' : '';
    var attachmentItems = (training.attachments || []).map((attachment, index) => this.getAttachmentItemHtml(training.id, attachment, index)).join('');
    return [
      '<div class="' + cardClasses + '" data-plan-id="' + this.escapeHtml(training.id) + '">',
      '  <div class="flex items-start justify-between gap-4">',
      '    <div class="min-w-0 flex-1">',
      '      <div class="flex items-center gap-3">',
      '        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl ' + (isRealized ? 'bg-emerald-100 text-emerald-700' : isNotRealized ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700') + '"><i class="fa-solid fa-chalkboard-user text-base"></i></span>',
      '        <div class="min-w-0 flex-1">',
      '          <h3 class="text-base font-montserrat font-semibold text-bevap-navy">' + this.escapeHtml(training.title || 'Treinamento') + '</h3>',
      '          <p class="mt-1 text-sm text-gray-500">Responsavel: ' + this.escapeHtml(training.responsible || '-') + '</p>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="flex items-center gap-2">' + this.getStatusBadgeHtml(displayStatus) + headerActions + '</div>',
      '  </div>',
      '  <div class="mt-4 flex flex-wrap items-center gap-2 text-[13px]">',
      '    <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Planejado: ' + this.escapeHtml(this.formatBrDate(training.executionDate) || '-') + '</span>',
      '    <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>' + this.escapeHtml(training.trainingHours || '-') + '</span>',
      '    <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #7c3aed; border-color: #7c3aed;"><i class="fa-solid fa-users mr-1 text-violet-100"></i>' + this.escapeHtml(String((training.participants || []).length)) + ' participantes</span>',
      '    ' + realizedDateMeta,
      '  </div>',
      '  <div class="' + panelClasses + '">',
      '    <div class="mb-3"><label class="text-sm font-medium text-bevap-navy">Participantes</label></div>',
      '    <div class="flex flex-wrap gap-2">' + this.getParticipantsHtml(training.participants) + '</div>',
      '  </div>',
      '  <div class="' + contentClasses + '">',
      decisionOptions,
      actionSection,
      '    <div><label class="mb-1 block text-sm text-gray-600">Observacoes</label><textarea data-plan-id="' + this.escapeHtml(training.id) + '" class="ep-training-notes ' + inputClasses + '" rows="3" placeholder="Registre como o treinamento ocorreu, principais pontos e observacoes."' + notesAttrs + '>' + this.escapeHtml(training.trainingNotes || '') + '</textarea></div>',
      editActions,
      '    <div>',
      '      <label class="mb-3 block text-sm text-gray-600">Anexar Documentos do Treinamento</label>',
      '      <div class="ep-training-attachments" data-plan-id="' + this.escapeHtml(training.id) + '">',
      '        <input type="file" multiple class="ep-training-attachments-input hidden" data-plan-id="' + this.escapeHtml(training.id) + '" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg">',
      '        <div class="ep-training-dropzone cursor-pointer rounded-lg border-2 border-dashed ' + (isRealized ? 'border-emerald-300 bg-white' : isNotRealized ? 'border-red-300 bg-white' : 'border-amber-300 bg-white') + ' p-6 text-center transition-colors hover:border-bevap-green">',
      '          <i class="fa-solid fa-cloud-arrow-up mb-2 text-2xl ' + (isRealized ? 'text-emerald-400' : isNotRealized ? 'text-red-400' : 'text-amber-400') + '"></i>',
      '          <p class="text-sm text-gray-600">Arraste arquivos ou clique para selecionar</p>',
      '          <p class="mt-1 text-xs text-gray-500">PDF, DOC, XLS, PPT (max. 10MB)</p>',
      '        </div>',
      '        <div class="mt-3 space-y-3">' + (attachmentItems || '<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Nenhum documento anexado.</div>') + '</div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  },

  getAttachmentItemHtml: function (planId, attachment, index) {
    var fileName = attachment && attachment.file ? attachment.file.name : this.asText(attachment && (attachment.fileName || attachment.name));
    var fileSize = attachment && attachment.file ? attachment.file.size : this.asText(attachment && (attachment.fileSize || attachment.size));
    var removeButton = attachment && attachment.persisted
      ? '<button type="button" disabled class="text-red-500 opacity-30 cursor-not-allowed" title="Anexo ja salvo"><i class="fa-solid fa-lock"></i></button>'
      : '<button type="button" data-action="remove-training-attachment" data-plan-id="' + this.escapeHtml(planId) + '" data-attachment-index="' + index + '" class="text-gray-400 transition-colors hover:text-red-500" title="Remover"><i class="fa-solid fa-trash"></i></button>';
    return [
      '<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">',
      '  <div class="flex min-w-0 items-center gap-3"><i class="fa-solid ' + this.escapeHtml(this.getAttachmentIconClass(fileName)) + ' text-xl"></i><div class="min-w-0"><div class="truncate text-sm font-medium text-gray-900">' + this.escapeHtml(fileName || '-') + '</div><div class="text-xs text-gray-500">' + this.escapeHtml(this.formatFileSize(fileSize)) + '</div></div></div>',
      '  ' + removeButton,
      '</div>'
    ].join('');
  },

  getParticipantsHtml: function (participants) {
    var self = this;
    return (participants || []).map(function (participant) {
      return '<span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">' + self.escapeHtml(participant) + '</span>';
    }).join('');
  },

  getStatusBadgeHtml: function (status) {
    if (status === 'realizado') {
      return '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check text-green-600"></i><span>Realizado</span></span>';
    }
    if (status === 'nao_realizado') {
      return '<span class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"><i class="fa-solid fa-ban text-red-600"></i><span>Nao Realizado</span></span>';
    }
    return '<span class="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700"><i class="fa-solid fa-clock text-yellow-600"></i><span>Pendente</span></span>';
  },

  getTrainingPlans: function () {
    return (this._state.deliveryPlans || []).filter((plan) => this.normalizePlan(plan).type === 'treinamento');
  },

  updateTrainingField: function (planId, fieldName, value) {
    for (var i = 0; i < this._state.deliveryPlans.length; i += 1) {
      if (this.asText(this._state.deliveryPlans[i].id) === this.asText(planId)) {
        this._state.deliveryPlans[i][fieldName] = this.asText(value);
        return;
      }
    }
  },

  markTrainingStatus: function (planId, status) {
    var plan = this.findPlanById(planId);
    if (!plan) return;
    var normalized = this.normalizePlan(plan);
    if (status === 'realizado') {
      if (!this.asText(normalized.trainingDate)) {
        this.showToast('Informe data e hora', 'Selecione a data da realizacao antes de confirmar o treinamento.', 'warning');
        return;
      }
      plan.trainingStatus = 'realizado';
      plan.trainingSelection = 'realizado';
      plan.trainingJustification = '';
      plan.trainingEditing = false;
    } else if (status === 'nao_realizado') {
      if (!this.asText(normalized.trainingJustification)) {
        this.showToast('Informe a justificativa', 'Descreva o motivo antes de marcar o treinamento como nao realizado.', 'warning');
        return;
      }
      plan.trainingStatus = 'nao_realizado';
      plan.trainingSelection = 'nao_realizado';
      plan.trainingDate = '';
      plan.trainingEditing = false;
    }
    this.renderTrainingList();
  },

  openTrainingEdit: function (planId) {
    var plan = this.findPlanById(planId);
    if (!plan) return;
    plan.trainingEditing = true;
    plan.trainingSelection = this.asText(plan.trainingStatus);
    this.renderTrainingList();
  },

  cancelTrainingEdit: function (planId) {
    var plan = this.findPlanById(planId);
    if (!plan) return;
    plan.trainingEditing = false;
    plan.trainingSelection = this.asText(plan.trainingStatus);
    this.renderTrainingList();
  },

  addTrainingAttachments: function (planId, files) {
    var plan = this.findPlanById(planId);
    if (!plan) return;
    var list = Array.prototype.slice.call(files || []);
    if (!Array.isArray(plan.attachments)) plan.attachments = [];
    for (var i = 0; i < list.length; i += 1) {
      plan.attachments.push({
        id: 'local:' + Date.now() + ':' + Math.random().toString(16).slice(2),
        file: list[i],
        name: list[i].name || '',
        size: list[i].size || 0,
        type: list[i].type || '',
        persisted: false
      });
    }
    this.renderTrainingList();
  },

  removeTrainingAttachment: function (planId, attachmentIndex) {
    var plan = this.findPlanById(planId);
    if (!plan || !Array.isArray(plan.attachments)) return;
    plan.attachments = plan.attachments.filter(function (_, index) {
      return index !== attachmentIndex;
    });
    this.renderTrainingList();
  },

  findPlanById: function (planId) {
    for (var i = 0; i < this._state.deliveryPlans.length; i += 1) {
      if (this.asText(this._state.deliveryPlans[i].id) === this.asText(planId)) {
        return this._state.deliveryPlans[i];
      }
    }
    return null;
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;
    try {
      await this.persistDecision('', '');
      try {
        sessionStorage.setItem('gpDashboardFeedback', JSON.stringify({
          title: 'Rascunho salvo',
          message: 'As informacoes dos treinamentos foram salvas com sucesso.',
          type: 'success'
        }));
      } catch (storageError) {}
      location.hash = '#dashboard';
    } catch (error) {
      console.error('[epUserTraining] saveDraft error:', error);
      this.showToast('Erro ao salvar', this.asText(error && error.message) || 'Nao foi possivel salvar o rascunho.', 'error');
    }
  },

  openReturnModal: function () {
    $('#ep-training-return-modal').removeClass('hidden').addClass('flex');
  },

  closeReturnModal: function () {
    $('#ep-training-return-modal').addClass('hidden').removeClass('flex');
  },

  confirmReturnModal: async function () {
    if (this._state.isSubmitting) return;
    var reasonField = $('#ep-training-return-reason');
    var reason = this.asText(reasonField.val());
    if (!reason) {
      this.showToast('Motivo', 'Informe o motivo do novo planejamento.', 'warning');
      reasonField.trigger('focus');
      return;
    }
    this.closeReturnModal();
    try {
      await this.submitDecision('correcao', reason, this._returnState, 'Novo planejamento solicitado com sucesso.', 'Treinamento devolvido para novo planejamento via Widget');
      reasonField.val('');
    } catch (error) {
      console.error('[epUserTraining] confirmReturnModal error:', error);
      this.showToast('Erro ao devolver', this.asText(error && error.message) || 'Nao foi possivel solicitar um novo planejamento.', 'error');
    }
  },

  openConcludeModal: function () {
    var validation = this.validateBeforeApprove();
    if (!validation.valid) {
      this.showToast('Treinamentos pendentes', validation.message, 'warning');
      return;
    }
    $('#ep-training-conclude-modal').removeClass('hidden').addClass('flex');
  },

  closeConcludeModal: function () {
    $('#ep-training-conclude-modal').addClass('hidden').removeClass('flex');
  },

  confirmConcludeModal: async function () {
    if (this._state.isSubmitting) return;
    this.closeConcludeModal();
    try {
      await this.submitDecision('aprovado', '', this._approveState, 'Treinamentos concluidos com sucesso.', 'Treinamentos concluidos via Widget');
    } catch (error) {
      console.error('[epUserTraining] confirmConcludeModal error:', error);
      this.showToast('Erro ao concluir', this.asText(error && error.message) || 'Nao foi possivel concluir os treinamentos.', 'error');
    }
  },

  validateBeforeApprove: function () {
    var trainings = this.getTrainingPlans();
    if (!trainings.length) {
      return { valid: false, message: 'Nenhum treinamento foi encontrado para esta etapa.' };
    }
    for (var i = 0; i < trainings.length; i += 1) {
      var training = this.normalizePlan(trainings[i]);
      var label = this.asText(training.title) || ('Treinamento ' + (i + 1));
      if (!this.asText(training.trainingStatus)) {
        return { valid: false, message: 'Defina o resultado de ' + label + '.' };
      }
      if (training.trainingStatus === 'realizado' && !this.asText(training.trainingDate)) {
        return { valid: false, message: 'Informe a data de realizacao de ' + label + '.' };
      }
      if (training.trainingStatus === 'nao_realizado' && !this.asText(training.trainingJustification)) {
        return { valid: false, message: 'Informe a justificativa de ' + label + '.' };
      }
    }
    return { valid: true, message: '' };
  },

  submitDecision: async function (decisionValue, justificationValue, nextState, successMessage, comments) {
    if (this._state.isSubmitting) return;
    var documentId = this.asText(this._state.documentId);
    if (!documentId) throw new Error('documentId nao informado.');

    this._state.isSubmitting = true;
    var loading = modalLoadingService.show({
      title: 'Registrando treinamento',
      message: 'Aguarde enquanto a tarefa e enviada ao Fluig...'
    });

    try {
      await loading.waitForPaint();
      loading.updateMessage('Localizando processo da entrega...');
      var processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(documentId);
      loading.updateMessage('Preparando anexos do treinamento...');
      var attachments = await this.collectAttachmentsPayload();
      loading.updateMessage('Enviando movimentacao para o Fluig...');
      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: this.asText(nextState),
        documentId: documentId,
        datasetName: this._formDatasetName,
        comments: this.asText(comments),
        attachments: attachments
      }, this.collectTaskFields(decisionValue, justificationValue, true));
      var finalSuccessMessage = this.asText(successMessage) || 'Movimentacao registrada com sucesso.';
      loading.hide();
      if (window.gpActionFeedback && typeof window.gpActionFeedback.showProcessSuccess === 'function') {
        window.gpActionFeedback.showProcessSuccess({
          controller: this,
          processInstanceId: processInstanceId,
          documentId: documentId,
          title: 'Acao concluida!',
          message: finalSuccessMessage,
          nextStep: 'Acompanhe a proxima etapa da entrega pelo dashboard.'
        });
      } else {
        this.showToast('Sucesso', finalSuccessMessage, 'success');
      }
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  persistDecision: async function (decisionValue, justificationValue) {
    var documentId = this.asText(this._state.documentId);
    if (!documentId) throw new Error('documentId nao informado.');
    await fluigService.saveDraft({
      mode: 'updateCardDraft',
      documentId: documentId,
      taskFields: this.collectTaskFields(decisionValue, justificationValue, false)
    });
  },

  collectTaskFields: function (decisionValue, justificationValue, includePendingAttachments) {
    var fields = [];
    this.addClearChildTableFields(fields);

    var dependencyIdx = 1;
    (this._state.deliveryPlans || []).forEach((plan, index) => {
      var idx = index + 1;
      var normalized = this.normalizePlan(plan);
      fields.push({ name: 'deliveryPlanIdEP___' + idx, value: normalized.id });
      fields.push({ name: 'deliveryPlanTypeEP___' + idx, value: normalized.type });
      fields.push({ name: 'deliveryPlanTitleEP___' + idx, value: normalized.title });
      fields.push({ name: 'deliveryPlanResponsibleEP___' + idx, value: normalized.responsible });
      fields.push({ name: 'deliveryPlanExecutionDateEP___' + idx, value: normalized.executionDate });
      fields.push({ name: 'deliveryPlanStageEP___' + idx, value: normalized.stage });
      fields.push({ name: 'deliveryGoLiveStatusEP___' + idx, value: normalized.goLiveStatus });
      fields.push({ name: 'deliveryPlanTrainingHoursEP___' + idx, value: normalized.trainingHours });
      fields.push({ name: 'deliveryPlanDescriptionEP___' + idx, value: normalized.description });
      fields.push({ name: 'deliveryPlanParticipantsEP___' + idx, value: normalized.participants.join(', ') });
      fields.push({ name: 'deliveryTrainStatusEP___' + idx, value: normalized.trainingStatus });
      fields.push({ name: 'deliveryTrainDateEP___' + idx, value: normalized.trainingDate });
      fields.push({ name: 'deliveryTrainNotesEP___' + idx, value: normalized.trainingNotes });
      fields.push({ name: 'deliveryTrainJustifEP___' + idx, value: normalized.trainingJustification });

      (normalized.dependencies || []).forEach((dependency) => {
        if (!this.asText(dependency)) return;
        fields.push({ name: 'deliveryDependencyPlanIdEP___' + dependencyIdx, value: normalized.id });
        fields.push({ name: 'deliveryDependencyTextEP___' + dependencyIdx, value: this.asText(dependency) });
        dependencyIdx += 1;
      });
    });

    fields.push(
      { name: this._decisionField, value: this.asText(decisionValue) },
      { name: this._justificationField, value: this.asText(justificationValue) },
      { name: this._correctionField, value: this.asText(decisionValue) === 'correcao' ? 'true' : 'false' },
      { name: this._hasTrainingField, value: this.hasTrainingPlans() ? 'true' : 'false' },
      { name: 'anexosEntregaEP', value: JSON.stringify(this.buildAttachmentMetadata(this._state.documents || [], 'documentos', includePendingAttachments)) },
      { name: 'anexosTreinamentoEP', value: JSON.stringify(this.buildTrainingAttachmentMetadata(includePendingAttachments)) }
    );

    return fields;
  },

  addClearChildTableFields: function (fields) {
    var planFields = [
      'deliveryPlanIdEP',
      'deliveryPlanTypeEP',
      'deliveryPlanTitleEP',
      'deliveryPlanResponsibleEP',
      'deliveryPlanExecutionDateEP',
      'deliveryPlanStageEP',
      'deliveryGoLiveStatusEP',
      'deliveryPlanTrainingHoursEP',
      'deliveryPlanDescriptionEP',
      'deliveryPlanParticipantsEP',
      'deliveryTrainStatusEP',
      'deliveryTrainDateEP',
      'deliveryTrainNotesEP',
      'deliveryTrainJustifEP'
    ];
    var dependencyFields = ['deliveryDependencyPlanIdEP', 'deliveryDependencyTextEP'];

    this.addClearFieldsForIndexes(fields, planFields, this._state.existingPlanIndexes);
    this.addClearFieldsForIndexes(fields, dependencyFields, this._state.existingDependencyIndexes);
  },

  addClearFieldsForIndexes: function (fields, fieldNames, indexes) {
    (indexes || []).forEach(function (idx) {
      (fieldNames || []).forEach(function (fieldName) {
        fields.push({ name: fieldName + '___' + idx, value: '' });
      });
    });
  },

  buildTrainingAttachmentMetadata: function (includePendingAttachments) {
    var items = [];
    var self = this;
    this.getTrainingPlans().forEach(function (plan) {
      (plan.attachments || []).forEach(function (attachment) {
        if (!includePendingAttachments && attachment && attachment.file && !attachment.persisted) return;
        var item = self.buildAttachmentItem(attachment, 'treinamento', self.asText(plan.id));
        if (item) items.push(item);
      });
    });
    return items;
  },

  buildAttachmentMetadata: function (items, scope, includePendingAttachments) {
    var self = this;
    return (items || []).map(function (attachment) {
      if (!includePendingAttachments && attachment && attachment.file && !attachment.persisted) return null;
      return self.buildAttachmentItem(attachment, scope, '');
    }).filter(Boolean);
  },

  buildAttachmentItem: function (attachment, scope, planId) {
    attachment = attachment || {};
    var file = attachment.file;
    var fileName = this.asText(file ? file.name : (attachment.fileName || attachment.name));
    if (!fileName) return null;
    var documentId = this.asText(attachment.documentId);
    if (!documentId && this.asText(attachment.id).indexOf('local:') !== 0) {
      documentId = this.asText(attachment.id);
    }
    var item = {
      documentId: documentId,
      fileName: fileName,
      fileSize: this.asText(file ? file.size : (attachment.fileSize || attachment.size)),
      version: this.asText(attachment.version),
      createdAt: this.asText(attachment.createdAt),
      scope: this.asText(scope)
    };
    if (planId) item.planId = this.asText(planId);
    if (file && !attachment.persisted) item.pending = true;
    return item;
  },

  collectAttachmentsPayload: async function () {
    var items = [];
    this.getTrainingPlans().forEach(function (plan) {
      items = items.concat(Array.isArray(plan.attachments) ? plan.attachments : []);
    });
    var localItems = items.filter(function (attachment) {
      return attachment && attachment.file && !attachment.persisted;
    });
    if (!localItems.length) return [];
    var self = this;
    var payload = await Promise.all(localItems.map(async function (attachment) {
      var content = await self.readFileAsBase64(attachment.file);
      return {
        fileName: self.asText(attachment.file && attachment.file.name),
        fileContent: self.asText(content),
        fileSize: String(attachment.file && attachment.file.size ? attachment.file.size : '').trim()
      };
    }));
    return payload.filter(function (item) {
      return item.fileName && item.fileContent;
    });
  },

  readFileAsBase64: function (file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (event) {
        var raw = String(event.target && event.target.result ? event.target.result : '');
        resolve(raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw);
      };
      reader.onerror = function () { reject(new Error('Falha ao ler anexo')); };
      reader.readAsDataURL(file);
    });
  },

  extractProjectSummary: function (row) {
    return {
      code: this.firstDefinedValue([this.getValIgnoreCase(row, 'codigoglpi'), this.getValIgnoreCase(row, 'codigoprojeto'), this.getValIgnoreCase(row, 'documentid')]),
      title: this.firstDefinedValue([this.getValIgnoreCase(row, 'titulodoprojetoNS'), this.getValIgnoreCase(row, 'titulodoprojeto')]),
      requester: this.firstDefinedValue([this.getValIgnoreCase(row, 'solicitanteNomeNS'), this.getValIgnoreCase(row, 'solicitanteNome')])
    };
  },

  extractDeliveryPlans: function (row) {
    var planRows = this.extractTableRows(row, 'tblDeliveryPlanningEP', [
      'deliveryPlanIdEP',
      'deliveryPlanTypeEP',
      'deliveryPlanTitleEP',
      'deliveryPlanResponsibleEP',
      'deliveryPlanExecutionDateEP',
      'deliveryPlanStageEP',
      'deliveryGoLiveStatusEP',
      'deliveryPlanTrainingHoursEP',
      'deliveryPlanDescriptionEP',
      'deliveryPlanParticipantsEP',
      'deliveryTrainStatusEP',
      'deliveryTrainDateEP',
      'deliveryTrainNotesEP',
      'deliveryTrainJustifEP'
    ]);
    var dependencyRows = this.extractTableRows(row, 'tblDeliveryPlanDependenciesEP', [
      'deliveryDependencyPlanIdEP',
      'deliveryDependencyTextEP'
    ]);
    var dependenciesByPlan = {};
    var attachmentsByPlan = {};
    var self = this;
    var persistedTrainingRows = this.parsePersistedAttachments(this.getValIgnoreCase(row, 'anexosTreinamentoEP'));

    this._state.existingPlanIndexes = planRows.map(function (item) { return item.__rowIndex; });
    this._state.existingDependencyIndexes = dependencyRows.map(function (item) { return item.__rowIndex; });

    dependencyRows.forEach(function (dependency) {
      var planId = self.asText(dependency.deliveryDependencyPlanIdEP);
      var text = self.asText(dependency.deliveryDependencyTextEP);
      if (!planId || !text) return;
      if (!dependenciesByPlan[planId]) dependenciesByPlan[planId] = [];
      dependenciesByPlan[planId].push(text);
    });

    persistedTrainingRows.forEach(function (attachment) {
      var planId = self.asText(attachment.planId);
      if (!planId) return;
      if (!attachmentsByPlan[planId]) attachmentsByPlan[planId] = [];
      attachmentsByPlan[planId].push(attachment);
    });

    return planRows.map(function (plan) {
      var id = self.asText(plan.deliveryPlanIdEP);
      return self.normalizePlan({
        id: id,
        type: plan.deliveryPlanTypeEP,
        title: plan.deliveryPlanTitleEP,
        responsible: plan.deliveryPlanResponsibleEP,
        executionDate: plan.deliveryPlanExecutionDateEP,
        stage: plan.deliveryPlanStageEP,
        goLiveStatus: plan.deliveryGoLiveStatusEP,
        trainingHours: plan.deliveryPlanTrainingHoursEP,
        description: plan.deliveryPlanDescriptionEP,
        participants: self.splitParticipants(plan.deliveryPlanParticipantsEP),
        trainingStatus: plan.deliveryTrainStatusEP,
        trainingDate: plan.deliveryTrainDateEP,
        trainingNotes: plan.deliveryTrainNotesEP,
        trainingJustification: plan.deliveryTrainJustifEP,
        dependencies: dependenciesByPlan[id] || [''],
        attachments: attachmentsByPlan[id] || []
      });
    }).filter(function (plan) {
      return self.asText(plan.id) || self.asText(plan.title) || self.asText(plan.responsible);
    });
  },

  normalizePlan: function (plan) {
    plan = plan || {};
    return {
      id: this.asText(plan.id),
      type: this.asText(plan.type) === 'treinamento' ? 'treinamento' : 'planejamento',
      title: this.asText(plan.title),
      responsible: this.asText(plan.responsible),
      executionDate: this.asText(plan.executionDate),
      stage: this.asText(plan.stage) || (this.asText(plan.type) === 'treinamento' ? '' : 'pre-go-live'),
      goLiveStatus: this.asText(plan.goLiveStatus) || (this.asText(plan.type) === 'treinamento' ? '' : 'planejado'),
      trainingHours: this.asText(plan.trainingHours),
      description: this.asText(plan.description),
      participants: Array.isArray(plan.participants) ? plan.participants.map((value) => this.asText(value)).filter(Boolean) : [],
      trainingStatus: this.asText(plan.trainingStatus),
      trainingSelection: this.asText(plan.trainingSelection || plan.trainingStatus),
      trainingDate: this.asText(plan.trainingDate),
      trainingNotes: this.asText(plan.trainingNotes),
      trainingJustification: this.asText(plan.trainingJustification),
      dependencies: Array.isArray(plan.dependencies) && plan.dependencies.length ? plan.dependencies.map((value) => this.asText(value)) : [''],
      attachments: Array.isArray(plan.attachments) ? plan.attachments : []
    };
  },

  hasTrainingPlans: function () {
    return this.getTrainingPlans().length > 0;
  },

  splitParticipants: function (value) {
    return this.asText(value).split(',').map((item) => this.asText(item)).filter(Boolean);
  },

  parsePersistedAttachments: function (rawValue) {
    var parsed = this.parseJson(rawValue);
    if (!Array.isArray(parsed)) return [];
    var self = this;
    return parsed.map(function (attachment, index) {
      return {
        id: self.asText(attachment.documentId || attachment.id || ('persisted:' + index)),
        documentId: self.asText(attachment.documentId || attachment.id),
        name: self.asText(attachment.fileName || attachment.documentDescription),
        fileName: self.asText(attachment.fileName || attachment.documentDescription),
        size: self.asText(attachment.fileSize),
        fileSize: self.asText(attachment.fileSize),
        version: self.asText(attachment.version),
        createdAt: self.asText(attachment.createdAt),
        planId: self.asText(attachment.planId),
        scope: self.asText(attachment.scope),
        persisted: true
      };
    }).filter(function (attachment) {
      return attachment.fileName;
    });
  },

  extractTableRows: function (row, tableName, fieldNames) {
    var indexedRows = this.extractIndexedRows(row, fieldNames);
    if (indexedRows.length) return indexedRows;
    var tableRows = this.parseJson(this.getValIgnoreCase(row, tableName));
    if (!Array.isArray(tableRows)) return [];
    return tableRows.map(function (item, index) {
      var normalized = { __rowIndex: String(index + 1) };
      (fieldNames || []).forEach(function (fieldName) {
        normalized[fieldName] = item && item[fieldName];
      });
      return normalized;
    });
  },

  extractIndexedRows: function (row, fieldNames) {
    var grouped = {};
    var lowerFields = (fieldNames || []).map((fieldName) => String(fieldName).toLowerCase());
    Object.keys(row || {}).forEach(function (key) {
      var match = String(key).match(/^(.*)___(\d+)$/);
      if (!match) return;
      var base = match[1];
      var rowIndex = match[2];
      if (lowerFields.indexOf(base.toLowerCase()) === -1) return;
      if (!grouped[rowIndex]) grouped[rowIndex] = { __rowIndex: rowIndex };
      grouped[rowIndex][base] = row[key];
    });
    return Object.keys(grouped).sort(function (a, b) { return Number(a) - Number(b); }).map(function (key) {
      return grouped[key];
    });
  },

  getValIgnoreCase: function (obj, fieldName) {
    if (!obj || !fieldName) return '';
    var target = String(fieldName).toLowerCase();
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i += 1) {
      if (String(keys[i]).toLowerCase() === target) return obj[keys[i]];
    }
    return '';
  },

  firstDefinedValue: function (values) {
    for (var i = 0; i < (values || []).length; i += 1) {
      var text = this.asText(values[i]);
      if (text) return text;
    }
    return '';
  },

  parseJson: function (value) {
    var text = this.asText(value);
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  },

  formatBrDate: function (value) {
    var text = this.asText(value);
    if (!text) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
    var match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return text;
    return match[3] + '/' + match[2] + '/' + match[1];
  },

  formatBrDateTime: function (value) {
    var text = this.asText(value);
    if (!text) return '';
    var match = text.match(/^(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?/);
    if (!match) return this.formatBrDate(text);
    var date = match[3] + '/' + match[2] + '/' + match[1];
    var time = match[4] && match[5] ? ' ' + match[4] + ':' + match[5] : '';
    return date + time;
  },

  formatFileSize: function (bytes) {
    var size = Number(bytes);
    if (!isFinite(size) || size <= 0) return '';
    var kb = size / 1024;
    if (kb < 1024) return kb.toFixed(0) + ' KB';
    var mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  },

  getAttachmentIconClass: function (fileName) {
    var ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  showToast: function (title, message, type) {
    var config = {
      success: { border: 'border-emerald-500', icon: 'fa-solid fa-circle-check text-emerald-600' },
      error: { border: 'border-red-500', icon: 'fa-solid fa-circle-xmark text-red-600' },
      warning: { border: 'border-amber-500', icon: 'fa-solid fa-triangle-exclamation text-amber-600' },
      info: { border: 'border-blue-500', icon: 'fa-solid fa-circle-info text-blue-600' }
    };
    var selected = config[type] || config.info;
    $('#toast').attr('class', 'fixed right-4 top-24 z-[70] max-w-sm rounded-lg border-l-4 bg-white px-4 py-3 shadow-xl ' + selected.border).removeClass('hidden');
    $('#toast-icon').attr('class', selected.icon + ' text-xl');
    $('#toast-title').text(title || 'Informacao');
    $('#toast-message').text(message || '');
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(function () {
      $('#toast').addClass('hidden');
    }, 3200);
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  },

  escapeHtml: function (value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
