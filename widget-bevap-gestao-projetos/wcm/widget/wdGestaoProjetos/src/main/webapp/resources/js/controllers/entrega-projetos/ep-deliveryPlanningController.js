const epDeliveryPlanningController = {
  _eventNamespace: '.epDeliveryPlanning',
  _nextState: '20',
  _datasetId: 'dsGetEntregaProjetos',
  _formName: 'FormEntregaProjetos',
  _formDatasetName: 'DSFormEntregaProjetos',
  _headerBackup: null,
  _toastTimer: null,
  _collapsedMilestones: {},
  _state: {
    documentId: '',
    processInstanceId: '',
    activeStep: 1,
    activeInfoTab: 'go-live',
    projectSummary: {},
    deliveryPlans: [],
    documents: [],
    milestones: [],
    employeeOptions: [],
    existingPlanIndexes: [],
    existingDependencyIndexes: [],
    existingDocumentIndexes: [],
    summaryAlertSeen: false,
    isSubmitting: false
  },

  load: async function (params) {
    params = params || {};
    this._state.documentId = this.asText(params.documentId);
    this._state.processInstanceId = this.asText(params.processInstanceId);
    this._state.activeStep = 1;
    this._state.activeInfoTab = 'go-live';
    this._state.deliveryPlans = [];
    this._state.documents = [];
    this._state.milestones = [];
    this._state.existingPlanIndexes = [];
    this._state.existingDependencyIndexes = [];
    this._state.existingDocumentIndexes = [];
    this._state.summaryAlertSeen = false;
    this._collapsedMilestones = {};

    try {
      var html = await $.get(this.getTemplateUrl());
      $('#page-container').html(html);
      this.backupAndSetHeader();
      this.bindEvents();
      await this.loadEmployeeOptions();
      await this.loadDeliveryData();
      this.renderAll();
    } catch (error) {
      console.error('[epDeliveryPlanning] template load error:', error);
      $('#page-container').html('<div class="p-6 text-red-600">Falha ao carregar a tela de planejamento da entrega.</div>');
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
    return WCMAPI.getServerURL() + '/wdGestaoProjetos/resources/js/templates/entrega-projetos/ep-delivery-planning.html';
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

    if (titleEl.length) titleEl.text('Planejamento da Entrega do Projeto');
    if (breadcrumbEl.length) {
      breadcrumbEl.html([
        '<a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"><i class="fa-solid fa-house text-xs"></i><span>In\u00edcio</span></a>',
        '<span class="text-gray-400">/</span>',
        '<span class="text-gray-300">Planejamento</span>',
        '<span class="text-gray-400">/</span>',
        '<span class="text-gray-300">Execu\u00e7\u00e3o do Projeto</span>',
        '<span class="text-gray-400">/</span>',
        '<span class="font-medium text-bevap-gold">Planejamento da Entrega</span>'
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

    container.on('click' + this._eventNamespace, '[data-step-target]', function () {
      self.goToStep(parseInt($(this).attr('data-step-target'), 10) || 1);
    });
    container.on('click' + this._eventNamespace, '[data-action="next-step"]', function () {
      self.goToStep(Math.min(2, self._state.activeStep + 1));
    });
    container.on('click' + this._eventNamespace, '[data-action="prev-step"]', function () {
      self.goToStep(Math.max(1, self._state.activeStep - 1));
    });
    container.on('click' + this._eventNamespace, '#tab-delivery-go-live', function () {
      self.setInfoTab('go-live');
    });
    container.on('click' + this._eventNamespace, '#tab-delivery-summary', function () {
      self.setInfoTab('summary');
    });
    container.on('click' + this._eventNamespace, '[data-action="add-delivery-phase"]', function () {
      self.addDeliveryPlan();
    });
    container.on('click' + this._eventNamespace, '[data-action="remove-delivery-phase"]', function () {
      var index = parseInt($(this).closest('.delivery-phase-item').attr('data-index'), 10);
      self.removeDeliveryPlan(index);
    });
    container.on('change' + this._eventNamespace, '.delivery-training-flag', function () {
      var index = parseInt($(this).closest('.delivery-phase-item').attr('data-index'), 10);
      self.syncPlanFromDom(index);
      self._state.deliveryPlans[index].type = $(this).is(':checked') ? 'treinamento' : 'planejamento';
      self.renderDeliveryPlans();
    });
    container.on('input change' + this._eventNamespace, '#delivery-plan-container input, #delivery-plan-container textarea, #delivery-plan-container select', function () {
      var index = parseInt($(this).closest('.delivery-phase-item').attr('data-index'), 10);
      self.syncPlanFromDom(index);
    });
    container.on('click' + this._eventNamespace, '[data-action="add-dependency"]', function () {
      var index = parseInt($(this).closest('.delivery-phase-item').attr('data-index'), 10);
      self.syncPlanFromDom(index);
      self._state.deliveryPlans[index].dependencies.push('');
      self.renderDeliveryPlans();
    });
    container.on('click' + this._eventNamespace, '[data-action="remove-dependency"]', function () {
      var planIndex = parseInt($(this).closest('.delivery-phase-item').attr('data-index'), 10);
      var depIndex = parseInt($(this).attr('data-dependency-index'), 10);
      self.syncPlanFromDom(planIndex);
      self._state.deliveryPlans[planIndex].dependencies.splice(depIndex, 1);
      if (!self._state.deliveryPlans[planIndex].dependencies.length) self._state.deliveryPlans[planIndex].dependencies.push('');
      self.renderDeliveryPlans();
    });
    container.on('click' + this._eventNamespace, '[data-action="remove-participant"]', function () {
      var planIndex = parseInt($(this).closest('.delivery-phase-item').attr('data-index'), 10);
      $(this).closest('.delivery-selected-participant').remove();
      self.syncPlanFromDom(planIndex);
    });
    container.on('click' + this._eventNamespace, '.delivery-attachments-dropzone', function () {
      $(this).closest('.delivery-attachments-field').find('.delivery-attachments-input').trigger('click');
    });
    container.on('change' + this._eventNamespace, '.delivery-attachments-input', function () {
      var planIndex = parseInt($(this).closest('.delivery-phase-item').attr('data-index'), 10);
      self.addTrainingAttachments(planIndex, this.files);
      this.value = '';
    });
    container.on('click' + this._eventNamespace, '[data-action="remove-training-attachment"]', function () {
      var planIndex = parseInt($(this).closest('.delivery-phase-item').attr('data-index'), 10);
      var attIndex = parseInt($(this).closest('.delivery-attachment-item').attr('data-attachment-index'), 10);
      self.removeTrainingAttachment(planIndex, attIndex);
    });
    container.on('change' + this._eventNamespace, '#delivery-documents-input', function () {
      self.addDocumentsFromFiles(this.files);
      this.value = '';
    });
    container.on('dragover' + this._eventNamespace, '#delivery-documents-dropzone', function (event) {
      event.preventDefault();
      $(this).addClass('border-bevap-green bg-green-50');
    });
    container.on('dragleave' + this._eventNamespace + ' drop' + this._eventNamespace, '#delivery-documents-dropzone', function (event) {
      event.preventDefault();
      $(this).removeClass('border-bevap-green bg-green-50');
      if (event.type === 'drop') {
        self.addDocumentsFromFiles(event.originalEvent.dataTransfer.files);
      }
    });
    container.on('click' + this._eventNamespace, '[data-action="remove-document"]', function () {
      var index = parseInt($(this).attr('data-document-index'), 10);
      self._state.documents.splice(index, 1);
      self.renderDocuments();
    });
    container.on('click' + this._eventNamespace, '[data-milestone-toggle]', function () {
      var key = $(this).attr('data-milestone-toggle');
      self._collapsedMilestones[key] = self._collapsedMilestones[key] !== true;
      self.renderMilestones();
    });
    container.on('click' + this._eventNamespace, '[data-action="save-delivery-plan"]', function () {
      self.saveDraft();
    });
    container.on('click' + this._eventNamespace, '[data-action="conclude-delivery-plan"]', function () {
      self.openConcludeModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="close-conclude-modal"]', function () {
      self.closeConcludeModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="confirm-conclude-modal"]', function () {
      self.confirmConclude();
    });
  },

  loadDeliveryData: async function () {
    if (!this._state.documentId) return;
    var rows = await fluigService.getDatasetRows(this._datasetId, {
      filters: { documentid: this._state.documentId }
    });
    var row = rows && rows.length ? rows[0] : null;
    if (!row) return;

    this._state.projectSummary = this.extractProjectSummary(row);
    this._state.deliveryPlans = this.extractDeliveryPlans(row);
    this._state.documents = this.extractDeliveryDocuments(row);
    this._state.milestones = this.extractMilestones(row);
  },

  renderAll: function () {
    this.renderDeliveryPlans();
    this.renderDocuments();
    this.renderProjectSummary();
    this.renderProgress();
    this.updateStepUi();
    this.updateInfoTabs();
    this.renderMilestones();
  },

  renderDeliveryPlans: function () {
    var self = this;
    var plans = this._state.deliveryPlans || [];
    $('#delivery-empty-state').toggleClass('hidden', plans.length > 0);
    $('#delivery-plan-container').html(plans.map(function (plan, index) {
      return self.getDeliveryPlanHtml(self.normalizePlan(plan), index);
    }).join(''));
    this.initResponsibleTagFilters();
    this.initParticipantTagFilters();
  },

  getDeliveryPlanHtml: function (plan, index) {
    return [
      '<div class="delivery-phase-item overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" data-index="' + index + '">',
      '  <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">',
      '    <div class="w-full min-w-0"><div class="flex items-center gap-2"><span class="text-gray-500">' + (index + 1) + '.</span>' + this.getRequiredMarkHtml() + '<input type="text" value="' + this.escapeHtml(plan.title) + '" class="delivery-phase-title w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700" placeholder="Informe o t\u00edtulo do planejamento"></div></div>',
      '    <div class="flex shrink-0 items-center space-x-2 pl-3"><button type="button" class="text-red-400 hover:text-red-600" data-action="remove-delivery-phase" title="Remover planejamento"><i class="fa-solid fa-trash"></i></button><button type="button" class="cursor-grab text-gray-400 hover:text-gray-600" title="Mover"><i class="fa-solid fa-grip-vertical"></i></button></div>',
      '  </div>',
      '  <div class="delivery-phase-content p-4">',
      this.getPlanBodyHtml(plan, index),
      '  </div>',
      '</div>'
    ].join('');
  },

  getPlanBodyHtml: function (plan, index) {
    var isTraining = plan.type === 'treinamento';
    if (isTraining) {
      return [
        '<div class="grid grid-cols-1 gap-4 md:grid-cols-2">',
        this.getTrainingCheckboxHtml(true),
        '<div class="md:col-span-2"><div class="grid grid-cols-1 gap-4 md:grid-cols-3">',
        this.getTextFieldHtml('Respons\u00e1vel Treinamento', 'delivery-responsible', plan.responsible, 'Pesquisar respons\u00e1vel...'),
        this.getTextFieldHtml('Data Treinamento', 'delivery-date', plan.executionDate, 'Selecione a data'),
        this.getTextFieldHtml('Horas Treinamento', 'delivery-hours', plan.trainingHours, 'Informe a quantidade de horas', 'number'),
        '</div></div></div>',
        this.getParticipantsFieldHtml(plan.participants || [], index),
        '<div class="mt-4"><label class="mb-1 block text-sm text-gray-600">Descri\u00e7\u00e3o ' + this.getRequiredMarkHtml() + '</label><textarea class="delivery-description w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows="3" placeholder="Descreva o treinamento...">' + this.escapeHtml(plan.description) + '</textarea></div>'
      ].join('');
    }

    return [
      '<div class="grid grid-cols-1 gap-4 md:grid-cols-2">',
      this.getTrainingCheckboxHtml(false),
      this.getTextFieldHtml('Respons\u00e1vel', 'delivery-responsible', plan.responsible, 'Pesquisar respons\u00e1vel...'),
      this.getTextFieldHtml('Data Execu\u00e7\u00e3o', 'delivery-date', plan.executionDate, 'Selecione a data'),
      '</div>',
      this.getDependenciesHtml(plan.dependencies || [''], index),
      '<div class="mt-4"><label class="mb-1 block text-sm text-gray-600">Descri\u00e7\u00e3o ' + this.getRequiredMarkHtml() + '</label><textarea class="delivery-description w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows="3" placeholder="Descreva o planejamento da entrega...">' + this.escapeHtml(plan.description) + '</textarea></div>'
    ].join('');
  },

  getTrainingCheckboxHtml: function (checked) {
    return '<div class="md:col-span-2"><label class="inline-flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" class="delivery-training-flag h-4 w-4 rounded border-gray-300 text-bevap-green focus:ring-bevap-green"' + (checked ? ' checked' : '') + '><span class="font-medium text-gray-700">Planejar Treinamento</span></label></div>';
  },

  getTextFieldHtml: function (label, className, value, placeholder, type) {
    return '<div><label class="mb-1 block text-sm text-gray-600">' + this.escapeHtml(label) + ' ' + this.getRequiredMarkHtml() + '</label><input type="' + this.escapeHtml(type || 'text') + '" value="' + this.escapeHtml(value) + '" class="' + this.escapeHtml(className) + ' w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="' + this.escapeHtml(placeholder || '') + '"></div>';
  },

  getDependenciesHtml: function (dependencies) {
    var self = this;
    var rows = (dependencies && dependencies.length ? dependencies : ['']).map(function (dependency, index) {
      return '<div class="delivery-dependency-row flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3"><i class="fa-solid fa-triangle-exclamation text-yellow-600"></i><input type="text" value="' + self.escapeHtml(dependency) + '" class="delivery-dependency-input field-input flex-1 border-none bg-transparent text-sm focus:outline-none" placeholder="Descreva uma depend\u00eancia..."><button type="button" data-action="remove-dependency" data-dependency-index="' + index + '" class="text-red-500 hover:text-red-700" title="Remover depend\u00eancia"><i class="fa-solid fa-times"></i></button></div>';
    }).join('');
    return '<div class="delivery-dependency-field mt-4"><div class="mb-1"><label class="block text-sm text-gray-600">Depend\u00eancias ' + this.getRequiredMarkHtml() + '</label></div><div class="delivery-dependency-list mb-3 space-y-2">' + rows + '</div><button type="button" class="text-sm font-medium text-bevap-green hover:text-green-700" data-action="add-dependency"><i class="fa-solid fa-plus mr-1"></i> Adicionar Depend\u00eancia</button></div>';
  },

  addDeliveryPlan: function () {
    this._state.deliveryPlans.push(this.normalizePlan({
      id: this.createPlanId()
    }));
    this.renderDeliveryPlans();
  },

  removeDeliveryPlan: function (index) {
    if (isNaN(index)) return;
    this._state.deliveryPlans.splice(index, 1);
    this.renderDeliveryPlans();
  },

  syncPlanFromDom: function (index) {
    if (isNaN(index) || !this._state.deliveryPlans[index]) return;
    var item = $('#delivery-plan-container .delivery-phase-item[data-index="' + index + '"]');
    if (!item.length) return;
    var isTraining = item.find('.delivery-training-flag').is(':checked');
    var plan = {
      id: this.asText(this._state.deliveryPlans[index].id) || this.createPlanId(),
      type: isTraining ? 'treinamento' : 'planejamento',
      title: this.asText(item.find('.delivery-phase-title').val()),
      responsible: this.asText(item.find('.delivery-responsible').val()),
      executionDate: this.asText(item.find('.delivery-date').val()),
      stage: isTraining ? '' : this.asText(item.find('.delivery-stage').val()) || 'pre-go-live',
      goLiveStatus: this.asText(this._state.deliveryPlans[index].goLiveStatus),
      trainingHours: this.asText(item.find('.delivery-hours').val()),
      description: this.asText(item.find('.delivery-description').val()),
      dependencies: item.find('.delivery-dependency-input').map((_, el) => this.asText($(el).val())).get(),
      participants: item.find('.delivery-selected-participant').map((_, el) => this.asText($(el).attr('data-value'))).get(),
      trainingStatus: this.asText(this._state.deliveryPlans[index].trainingStatus),
      trainingDate: this.asText(this._state.deliveryPlans[index].trainingDate),
      trainingNotes: this.asText(this._state.deliveryPlans[index].trainingNotes),
      trainingJustification: this.asText(this._state.deliveryPlans[index].trainingJustification),
      attachments: Array.isArray(this._state.deliveryPlans[index].attachments) ? this._state.deliveryPlans[index].attachments : []
    };
    if (!plan.dependencies.length) plan.dependencies = [''];
    this._state.deliveryPlans[index] = this.normalizePlan(plan);
  },

  syncAllPlansFromDom: function () {
    for (var i = 0; i < this._state.deliveryPlans.length; i += 1) {
      this.syncPlanFromDom(i);
    }
  },

  normalizePlan: function (plan) {
    plan = plan || {};
    return {
      id: this.asText(plan.id) || this.createPlanId(),
      type: this.asText(plan.type) === 'treinamento' ? 'treinamento' : 'planejamento',
      title: this.asText(plan.title),
      responsible: this.asText(plan.responsible),
      executionDate: this.asText(plan.executionDate),
      stage: this.asText(plan.stage) || (this.asText(plan.type) === 'treinamento' ? '' : 'pre-go-live'),
      goLiveStatus: this.asText(plan.goLiveStatus) || (this.asText(plan.type) === 'treinamento' ? '' : 'planejado'),
      trainingHours: this.asText(plan.trainingHours),
      description: this.asText(plan.description),
      dependencies: Array.isArray(plan.dependencies) && plan.dependencies.length ? plan.dependencies.map((value) => this.asText(value)) : [''],
      participants: Array.isArray(plan.participants) ? plan.participants.map((value) => this.asText(value)).filter(Boolean) : [],
      trainingStatus: this.asText(plan.trainingStatus),
      trainingDate: this.asText(plan.trainingDate),
      trainingNotes: this.asText(plan.trainingNotes),
      trainingJustification: this.asText(plan.trainingJustification),
      attachments: Array.isArray(plan.attachments) ? plan.attachments : []
    };
  },

  getRequiredMarkHtml: function () {
    return '<span class="font-semibold text-red-500">*</span>';
  },

  validateBeforeSubmit: function () {
    var plans = (this._state.deliveryPlans || []).map((plan) => this.normalizePlan(plan));
    if (!plans.length) {
      return { valid: false, message: 'Inclua pelo menos um planejamento completo antes de concluir.' };
    }

    var hasCompletePlan = false;
    for (var i = 0; i < plans.length; i += 1) {
      var validation = this.validatePlan(plans[i], i + 1);
      if (validation.started && !validation.valid) return validation;
      if (validation.valid) hasCompletePlan = true;
    }

    if (!hasCompletePlan) {
      return { valid: false, message: 'Preencha todos os campos obrigatorios de pelo menos um planejamento.' };
    }
    return { valid: true, message: '' };
  },

  validatePlan: function (plan, number) {
    var dependencies = (plan.dependencies || []).map((value) => this.asText(value)).filter(Boolean);
    var started = this.isPlanStarted(plan);
    var prefix = 'Planejamento ' + number + ': ';
    var required = [
      { value: plan.title, label: 'titulo' },
      { value: plan.responsible, label: 'responsavel' },
      { value: plan.executionDate, label: 'data' },
      { value: plan.description, label: 'descricao' }
    ];

    if (plan.type === 'treinamento') {
      required.push({ value: plan.trainingHours, label: 'horas do treinamento' });
      if (!plan.participants || !plan.participants.length) {
        return { valid: false, started: started, message: prefix + 'informe pelo menos um participante.' };
      }
    } else if (!dependencies.length) {
      return { valid: false, started: started, message: prefix + 'informe pelo menos uma dependencia.' };
    }

    for (var i = 0; i < required.length; i += 1) {
      if (!this.asText(required[i].value)) {
        return { valid: false, started: started, message: prefix + 'preencha ' + required[i].label + '.' };
      }
    }

    return { valid: true, started: started, message: '' };
  },

  isPlanStarted: function (plan) {
    return !!(
      this.asText(plan.title)
      || this.asText(plan.responsible)
      || this.asText(plan.executionDate)
      || this.asText(plan.trainingHours)
      || this.asText(plan.description)
      || (plan.dependencies || []).some((value) => this.asText(value))
      || (plan.participants || []).length
      || (plan.attachments || []).length
    );
  },

  addDocumentsFromFiles: function (files) {
    var list = Array.prototype.slice.call(files || []);
    for (var i = 0; i < list.length; i += 1) {
      this._state.documents.push({
        name: list[i].name || '',
        size: list[i].size || 0,
        type: list[i].type || ''
      });
    }
    this.renderDocuments();
  },

  addTrainingAttachments: function (planIndex, files) {
    if (isNaN(planIndex) || !this._state.deliveryPlans[planIndex]) return;
    this.syncPlanFromDom(planIndex);
    var list = Array.prototype.slice.call(files || []);
    var plan = this.normalizePlan(this._state.deliveryPlans[planIndex]);
    plan.attachments = Array.isArray(plan.attachments) ? plan.attachments.slice() : [];
    for (var i = 0; i < list.length; i += 1) {
      plan.attachments.push({
        id: 'local:' + Date.now() + ':' + Math.random().toString(16).slice(2),
        name: list[i].name || '',
        size: list[i].size || 0,
        type: list[i].type || '',
        file: list[i],
        persisted: false
      });
    }
    this._state.deliveryPlans[planIndex] = plan;
    this.renderDeliveryPlans();
  },

  removeTrainingAttachment: function (planIndex, attachmentIndex) {
    if (isNaN(planIndex) || isNaN(attachmentIndex) || !this._state.deliveryPlans[planIndex]) return;
    this.syncPlanFromDom(planIndex);
    var plan = this.normalizePlan(this._state.deliveryPlans[planIndex]);
    plan.attachments = (plan.attachments || []).filter(function (_, index) {
      return index !== attachmentIndex;
    });
    this._state.deliveryPlans[planIndex] = plan;
    this.renderDeliveryPlans();
  },

  renderDocuments: function () {
    var self = this;
    var docs = this._state.documents || [];
    $('#delivery-documents-list').html(docs.length ? docs.map(function (doc, index) {
      return [
        '<div class="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3">',
        '  <div class="flex items-center justify-between gap-3">',
        '    <div class="flex items-center gap-3"><i class="fa-solid fa-file-lines text-bevap-navy"></i><div><div class="text-sm font-medium text-gray-900">' + self.escapeHtml(doc.name || '-') + '</div><div class="text-xs text-gray-500">' + self.escapeHtml(self.formatFileSize(doc.size)) + '</div></div></div>',
        '    <button type="button" data-action="remove-document" data-document-index="' + index + '" class="text-gray-400 transition-colors hover:text-red-500"><i class="fa-solid fa-trash"></i></button>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('') : '<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Nenhum documento anexado.</div>');
  },

  setInfoTab: function (tab) {
    this._state.activeInfoTab = tab === 'summary' ? 'summary' : 'go-live';
    if (this._state.activeInfoTab === 'summary') this._state.summaryAlertSeen = true;
    this.updateInfoTabs();
    if (this._state.activeInfoTab === 'summary') this.renderMilestones();
  },

  updateInfoTabs: function () {
    var isGoLive = this._state.activeInfoTab !== 'summary';
    $('#tab-delivery-go-live').toggleClass('border-bevap-green bg-green-50 text-bevap-green', isGoLive).toggleClass('border-transparent text-gray-500', !isGoLive);
    $('#tab-delivery-summary').toggleClass('border-bevap-green bg-green-50 text-bevap-green', !isGoLive).toggleClass('border-transparent text-gray-500', isGoLive);
    $('#tab-delivery-summary-alert').toggleClass('hidden', !isGoLive || this._state.summaryAlertSeen);
    $('#tab-content-delivery-go-live').toggleClass('hidden', !isGoLive);
    $('#tab-content-delivery-summary').toggleClass('hidden', isGoLive);
  },

  goToStep: function (step) {
    this._state.activeStep = step === 2 ? 2 : 1;
    this.updateStepUi();
  },

  updateStepUi: function () {
    var step = this._state.activeStep;
    $('#delivery-step-1').toggleClass('hidden', step !== 1);
    $('#delivery-step-2').toggleClass('hidden', step !== 2);
    $('[data-action="prev-step"]').prop('disabled', step === 1);
    $('#delivery-next-step-btn').toggleClass('hidden', step === 2);
    $('#next-btn-label').text(step === 1 ? 'Pr\u00f3ximo: Documentos' : 'Pr\u00f3ximo');
    $('#step-indicator-1').toggleClass('bg-bevap-green text-white', step === 1).toggleClass('bg-gray-300 text-gray-600', step !== 1);
    $('#step-indicator-2').toggleClass('bg-bevap-green text-white', step === 2).toggleClass('bg-gray-300 text-gray-600', step !== 2);
    $('#step-label-1').toggleClass('text-bevap-green font-medium', step === 1).toggleClass('text-gray-600', step !== 1);
    $('#step-label-2').toggleClass('text-bevap-green font-medium', step === 2).toggleClass('text-gray-600', step !== 2);
  },

  renderProjectSummary: function () {
    var summary = this._state.projectSummary || {};
    $('#project-code').text(summary.code || '-');
    $('#project-title').text(summary.title || '-');
    $('#project-requester').text(summary.requester || '-');
    $('#delivery-conclude-message').html('Voc\u00ea est\u00e1 concluindo o planejamento da entrega do projeto <strong>' + this.escapeHtml((summary.code || '-') + ' \u2022 ' + (summary.title || '-')) + '</strong>.');
  },

  renderProgress: function () {
    $('#delivery-progress-list').html([
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Execu\u00e7\u00e3o do projeto conclu\u00edda</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Valida\u00e7\u00e3o do solicitante conclu\u00edda</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Valida\u00e7\u00e3o do TI conclu\u00edda</span></div>',
      '<div class="flex items-center text-bevap-gold"><i class="fa-solid fa-clock mr-2"></i><span>Planejamento da entrega em andamento</span></div>'
    ].join(''));
  },

  renderMilestones: function () {
    var self = this;
    var list = this._state.milestones || [];
    if (!list.length) {
      $('#delivery-related-milestones-list').html('<div class="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">Nenhum marco relacionado encontrado.</div>');
      return;
    }
    $('#delivery-related-milestones-list').html(list.map(function (milestone, index) {
      return self.getMilestoneHtml(milestone, index);
    }).join(''));
  },

  getMilestoneHtml: function (milestone, index) {
    var self = this;
    var key = milestone.id || String(index);
    var isCollapsed = this._collapsedMilestones[key] === true;
    var status = this.getStatusMeta(milestone.status);
    return [
      '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">',
      '  <div class="flex items-start justify-between gap-4">',
      '    <div class="min-w-0 flex-1"><div class="flex items-center gap-3"><span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700"><i class="fa-solid fa-flag-checkered text-base"></i></span><div class="min-w-0 flex-1"><h3 class="text-base font-montserrat font-semibold text-bevap-navy">Marco: ' + this.escapeHtml(milestone.name) + '</h3></div></div></div>',
      '    <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ' + status.badge + '"><i class="' + status.icon + '"></i><span>' + status.label + '</span></span>',
      '  </div>',
      '  <div class="mt-4 flex flex-wrap gap-2 text-[13px]"><span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1 text-blue-100"></i>Respons\u00e1vel: ' + this.escapeHtml(milestone.owner || '-') + '</span><span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-alt mr-1 text-red-100"></i>' + this.escapeHtml(milestone.period || '-') + '</span></div>',
      '  <div class="mt-3 flex items-center justify-end"><button type="button" data-milestone-toggle="' + this.escapeHtml(key) + '" class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"><i class="fa-solid ' + (isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up') + ' mr-2 text-gray-400"></i>' + (isCollapsed ? 'Expandir' : 'Recolher') + '</button></div>',
      '  <div class="' + (isCollapsed ? 'hidden' : 'block') + '">',
      '    <div class="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><div class="mb-1.5 flex items-center gap-2"><i class="fa-solid fa-check-double text-sm text-blue-700"></i><h4 class="text-sm font-montserrat font-semibold text-gray-900">Crit\u00e9rios de Aceite</h4></div><div class="space-y-0.5">' + (milestone.criteria.length ? milestone.criteria.map(function (item) { return '<div class="flex items-start gap-1 rounded-lg bg-blue-50 px-3 py-1 text-sm leading-snug text-gray-700"><i class="fa-solid fa-check mt-0.5 text-[10px] text-bevap-green"></i><span>' + self.escapeHtml(item) + '</span></div>'; }).join('') : '<div class="text-sm text-gray-500">Nenhum crit\u00e9rio definido.</div>') + '</div></div>',
      '    <div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-4"><div class="mb-3 flex items-center justify-between gap-3"><div><h4 class="text-sm font-montserrat font-semibold text-gray-900">Tarefas do Marco</h4><p class="text-xs text-gray-500">Tarefas relacionadas no planejamento para compor esta entrega.</p></div><span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">' + milestone.tasks.length + ' tarefas</span></div><div class="space-y-3">' + (milestone.tasks.length ? milestone.tasks.map(function (task) { return self.getMilestoneTaskHtml(task); }).join('') : '<div class="text-sm text-gray-500">Nenhuma tarefa vinculada ao marco.</div>') + '</div></div>',
      '  </div>',
      '</div>'
    ].join('');
  },

  getMilestoneTaskHtml: function (task) {
    var status = this.getStatusMeta(task.status);
    var href = this.getExecutionActivityHref(task);
    var title = href
      ? '<a href="' + this.escapeHtml(href) + '" class="inline-flex items-center gap-2 text-sm font-semibold text-bevap-navy transition-colors hover:text-blue-700 hover:underline"><span>' + this.escapeHtml(task.taskName || '-') + '</span><i class="fa-solid fa-link text-[11px] shrink-0"></i></a>'
      : '<span class="inline-flex items-center gap-2 text-sm font-semibold text-bevap-navy"><span>' + this.escapeHtml(task.taskName || '-') + '</span></span>';
    return [
      '<div class="rounded-xl border border-gray-200 bg-white p-4">',
      '  <div class="flex items-start justify-between gap-3">',
      '    <div class="min-w-0 flex-1">' + title + '<div class="mt-2 flex flex-wrap gap-2 text-[13px]"><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1 text-blue-100"></i>Respons\u00e1vel: ' + this.escapeHtml(task.responsible || '-') + '</span><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-solid fa-layer-group mr-1 text-green-200"></i>Fase: ' + this.escapeHtml(task.phaseName || '-') + '</span><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>' + this.escapeHtml(task.date || '-') + '</span></div></div>',
      '    <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ' + status.badge + '"><i class="' + status.icon + '"></i><span>' + status.label + '</span></span>',
      '  </div>',
      '</div>'
    ].join('');
  },

  saveDraft: async function () {
    try {
      this.syncAllPlansFromDom();
      await this.persist(false);
      try {
        sessionStorage.setItem('gpDashboardFeedback', JSON.stringify({
          title: 'Rascunho salvo',
          message: 'As informacoes do planejamento da entrega foram salvas.',
          type: 'success'
        }));
      } catch (storageError) {}
      location.hash = '#dashboard';
    } catch (error) {
      console.error('[epDeliveryPlanning] saveDraft error:', error);
      this.showToast('Erro ao salvar', this.asText(error && error.message) || 'N\u00e3o foi poss\u00edvel salvar o rascunho.', 'error');
    }
  },

  openConcludeModal: function () {
    $('#delivery-conclude-modal').removeClass('hidden').addClass('flex');
  },

  closeConcludeModal: function () {
    $('#delivery-conclude-modal').addClass('hidden').removeClass('flex');
  },

  confirmConclude: async function () {
    if (this._state.isSubmitting) return;
    this.closeConcludeModal();
    this._state.isSubmitting = true;
    try {
      this.syncAllPlansFromDom();
      var validation = this.validateBeforeSubmit();
      if (!validation.valid) {
        this.goToStep(1);
        this.showToast('Campos obrigatorios', validation.message, 'warning');
        return;
      }
      await this.submit();
      this.showToast('Planejamento conclu\u00eddo', 'O planejamento da entrega foi consolidado com sucesso.', 'success');
      setTimeout(function () { location.hash = '#dashboard'; }, 700);
    } catch (error) {
      console.error('[epDeliveryPlanning] conclude error:', error);
      this.showToast('Erro ao concluir', this.asText(error && error.message) || 'N\u00e3o foi poss\u00edvel concluir o planejamento.', 'error');
    } finally {
      this._state.isSubmitting = false;
    }
  },

  persist: async function (concluded) {
    var documentId = this.asText(this._state.documentId);
    if (!documentId) throw new Error('documentId n\u00e3o informado.');
    await fluigService.saveDraft({
      mode: 'updateCardDraft',
      documentId: documentId,
      taskFields: this.collectTaskFields(concluded)
    });
  },


  collectTaskFields: function (concluded) {
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
      fields.push({ name: 'deliveryGoLiveStatusEP___' + idx, value: normalized.type === 'treinamento' ? '' : 'planejado' });
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
      { name: 'decisaoPlanejamentoEntregaEP', value: concluded ? 'concluido' : '' },
      { name: 'justifPlanEntregaEP', value: '' },
      { name: 'temTreinamentoEP', value: this.hasTrainingPlans() ? 'true' : 'false' },
      { name: 'anexosEntregaEP', value: JSON.stringify(this.buildDeliveryAttachmentMetadata(concluded)) },
      { name: 'anexosTreinamentoEP', value: JSON.stringify(this.buildTrainingAttachmentMetadata(concluded)) }
    );

    return fields;
  },

  buildDeliveryAttachmentMetadata: function (includePending) {
    var self = this;
    return (this._state.documents || []).map(function (doc) {
      if (!includePending && doc && doc.file && !doc.persisted) return null;
      return self.buildAttachmentMetadataItem(doc, {
        scope: 'documentos'
      });
    }).filter(Boolean);
  },

  buildTrainingAttachmentMetadata: function (includePending) {
    var self = this;
    var items = [];
    (this._state.deliveryPlans || []).forEach(function (plan) {
      var normalized = self.normalizePlan(plan);
      (normalized.attachments || []).forEach(function (doc) {
        if (!includePending && doc && doc.file && !doc.persisted) return;
        var item = self.buildAttachmentMetadataItem(doc, {
          scope: 'treinamento',
          planId: normalized.id
        });
        if (item) items.push(item);
      });
    });
    return items;
  },

  hasTrainingPlans: function () {
    return (this._state.deliveryPlans || []).some((plan) => this.normalizePlan(plan).type === 'treinamento');
  },

  buildAttachmentMetadataItem: function (attachment, extra) {
    attachment = attachment || {};
    extra = extra || {};
    var file = attachment.file;
    var fileName = this.asText(file ? file.name : (attachment.fileName || attachment.name));
    if (!fileName) return null;
    var documentId = this.asText(attachment.documentId);
    if (!documentId && this.asText(attachment.id).indexOf('local:') !== 0 && this.asText(attachment.id).indexOf('draft:') !== 0) {
      documentId = this.asText(attachment.id);
    }
    var item = {
      documentId: documentId,
      fileName: fileName,
      fileSize: this.asText(file ? file.size : (attachment.fileSize || attachment.size)),
      version: this.asText(attachment.version),
      createdAt: this.asText(attachment.createdAt),
      scope: this.asText(extra.scope || attachment.scope)
    };
    if (extra.planId) item.planId = this.asText(extra.planId);
    if (file && !attachment.persisted) item.pending = true;
    return item;
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

  extractDeliveryPlans: function (row) {
    var planRows = this.extractIndexedRows(row, [
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
    var dependencyRows = this.extractIndexedRows(row, [
      'deliveryDependencyPlanIdEP',
      'deliveryDependencyTextEP'
    ]);
    var dependenciesByPlan = {};
    var self = this;

    this._state.existingPlanIndexes = planRows.map(function (item) { return item.__rowIndex; });
    this._state.existingDependencyIndexes = dependencyRows.map(function (item) { return item.__rowIndex; });

    dependencyRows.forEach(function (dependency) {
      var planId = self.asText(dependency.deliveryDependencyPlanIdEP);
      var text = self.asText(dependency.deliveryDependencyTextEP);
      if (!planId || !text) return;
      if (!dependenciesByPlan[planId]) dependenciesByPlan[planId] = [];
      dependenciesByPlan[planId].push(text);
    });

    return planRows.map(function (plan) {
      var id = self.asText(plan.deliveryPlanIdEP) || self.createPlanId();
      var normalized = self.normalizePlan({
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
        dependencies: dependenciesByPlan[id] || ['']
      });
      return normalized.title || normalized.responsible || normalized.description ? normalized : null;
    }).filter(Boolean);
  },

  extractDeliveryDocuments: function (row) {
    this._state.existingDocumentIndexes = [];
    return this.parsePersistedAttachments(this.getValIgnoreCase(row, 'anexosEntregaEP'));
  },

  splitParticipants: function (value) {
    return this.asText(value).split(',').map((item) => this.asText(item)).filter(Boolean);
  },

  createPlanId: function () {
    var maxId = 0;
    (this._state.deliveryPlans || []).forEach((plan) => {
      var numericId = parseInt(this.asText(plan && plan.id).replace(/\D/g, ''), 10);
      if (!isNaN(numericId) && numericId > maxId) maxId = numericId;
    });
    return 'EP' + String(maxId + 1);
  },

  extractProjectSummary: function (row) {
    return {
      code: this.firstDefinedValue([this.getValIgnoreCase(row, 'codigoglpi'), this.getValIgnoreCase(row, 'codigoprojeto'), this.getValIgnoreCase(row, 'documentid')]),
      title: this.firstDefinedValue([this.getValIgnoreCase(row, 'titulodoprojetoNS'), this.getValIgnoreCase(row, 'titulodoprojeto')]),
      requester: this.firstDefinedValue([this.getValIgnoreCase(row, 'solicitanteNomeNS'), this.getValIgnoreCase(row, 'solicitanteNome')])
    };
  },

  extractMilestones: function (row) {
    var payload = this.parseJson(this.getValIgnoreCase(row, 'projectPlanningJsonDP'));
    var summaryRows = this.extractIndexedRows(row, [
      'milestoneTaskSummaryIdDP',
      'milestoneTaskSummaryTextDP',
      'milestoneTaskSummaryDueDateDP',
      'milestoneTaskSummaryPhaseDP',
      'milestoneTaskSummaryMarcoDP',
      'milestoneTaskSummaryProcessDP',
      'milestoneTaskSummaryDocIdDP',
      'milestoneTaskSummaryEstProcDP',
      'milestoneTaskSummaryStatusDP'
    ]);
    var milestoneRows = payload && payload.milestones && Array.isArray(payload.milestones.items)
      ? payload.milestones.items
      : this.extractIndexedRows(row, ['milestoneIdDP', 'milestoneNameDP', 'milestoneStartDateDP', 'milestoneEndDateDP']);
    var criteriaRows = payload && payload.milestones && Array.isArray(payload.milestones.criteria)
      ? payload.milestones.criteria
      : this.extractIndexedRows(row, ['milestoneCriteriaMilestoneIdDP', 'milestoneCriteriaTextDP']);
    var responsibleLookup = this.buildTaskResponsibleLookup(row, payload);
    var criteriaByMilestone = this.groupCriteriaByMilestone(milestoneRows, criteriaRows);
    var tasksByMilestone = this.groupSummaryTasksByMilestone(summaryRows, responsibleLookup);
    var self = this;

    return milestoneRows.map(function (milestone, index) {
      var id = self.firstDefinedValue([milestone.id, milestone.milestoneIdDP, String(index + 1)]);
      var name = self.firstDefinedValue([milestone.name, milestone.milestoneNameDP, 'Marco ' + (index + 1)]);
      var period = self.firstDefinedValue([
        milestone.period,
        self.joinPeriod(milestone.startDate || milestone.milestoneStartDateDP, milestone.endDate || milestone.milestoneEndDateDP)
      ]);
      return {
        id: id,
        name: name,
        period: period,
        owner: self.firstDefinedValue([milestone.owner, milestone.responsible, milestone.responsavel, (tasksByMilestone[name] || [])[0] && (tasksByMilestone[name] || [])[0].responsible, '-']),
        status: self.firstDefinedValue([milestone.status, 'concluido']),
        criteria: criteriaByMilestone[id] || criteriaByMilestone[name] || [],
        tasks: tasksByMilestone[name] || []
      };
    });
  },

  groupCriteriaByMilestone: function (milestones, criteriaRows) {
    var self = this;
    var nameById = {};
    (milestones || []).forEach(function (milestone, index) {
      var id = self.firstDefinedValue([milestone.id, milestone.milestoneIdDP, String(index + 1)]);
      var name = self.firstDefinedValue([milestone.name, milestone.milestoneNameDP]);
      if (id && name) nameById[id] = name;
    });
    var grouped = {};
    (criteriaRows || []).forEach(function (criteria) {
      var id = self.firstDefinedValue([criteria.milestoneId, criteria.milestoneCriteriaMilestoneIdDP]);
      var name = nameById[id] || id;
      var text = self.firstDefinedValue([criteria.text, criteria.milestoneCriteriaTextDP]);
      if (!name || !text) return;
      if (!grouped[name]) grouped[name] = [];
      if (!grouped[id]) grouped[id] = grouped[name];
      grouped[name].push(text);
    });
    return grouped;
  },

  groupSummaryTasksByMilestone: function (rows, responsibleLookup) {
    var self = this;
    var grouped = {};
    (rows || []).forEach(function (row) {
      var milestoneName = self.asText(row.milestoneTaskSummaryMarcoDP);
      var phaseName = self.asText(row.milestoneTaskSummaryPhaseDP);
      var taskName = self.asText(row.milestoneTaskSummaryTextDP);
      if (!milestoneName) return;
      if (!grouped[milestoneName]) grouped[milestoneName] = [];
      grouped[milestoneName].push({
        taskName: taskName,
        date: self.asText(row.milestoneTaskSummaryDueDateDP),
        phaseName: phaseName,
        responsible: self.resolveTaskResponsibleFromLookup(responsibleLookup, phaseName, taskName),
        status: self.asText(row.milestoneTaskSummaryStatusDP) || 'concluido',
        process: self.asText(row.milestoneTaskSummaryProcessDP),
        documentId: self.asText(row.milestoneTaskSummaryDocIdDP),
        estadoProcesso: self.asText(row.milestoneTaskSummaryEstProcDP)
      });
    });
    return grouped;
  },

  getExecutionActivityHref: function (task) {
    var route = this.getExecutionActivityRouteByState(task && task.estadoProcesso);
    var documentId = this.asText(task && task.documentId);
    var processInstanceId = this.asText(task && task.process);
    if (!route || (!documentId && !processInstanceId)) return '';
    var params = [];
    if (documentId) params.push('documentId=' + encodeURIComponent(documentId));
    if (processInstanceId) params.push('processInstanceId=' + encodeURIComponent(processInstanceId));
    return '#' + route + '?' + params.join('&');
  },

  getExecutionActivityRouteByState: function (estadoProcesso) {
    var stateCode = this.extractStateCode(estadoProcesso);
    if (stateCode === '14') return 'executionActivityWaiting';
    if (stateCode === '18') return 'executionActivity';
    if (stateCode === '23') return 'executionActivityRequesterValidation';
    if (stateCode === '32') return 'executionActivityTiValidation';
    return '';
  },

  getStatusMeta: function (status) {
    var normalized = this.normalizeText(status);
    if (normalized.indexOf('conclu') !== -1 || normalized === 'finalizado') return { label: 'Conclu\u00eddo', badge: 'border-green-200 bg-green-50 text-green-700', icon: 'fa-solid fa-circle-check text-green-600' };
    if (normalized.indexOf('execu') !== -1 || normalized.indexOf('andamento') !== -1) return { label: 'Em Execu\u00e7\u00e3o', badge: 'border-blue-200 bg-blue-50 text-blue-700', icon: 'fa-solid fa-play text-blue-600' };
    if (normalized.indexOf('validacao') !== -1 || normalized.indexOf('validacao') !== -1) return { label: 'Valida\u00e7\u00e3o', badge: 'border-yellow-200 bg-yellow-50 text-yellow-700', icon: 'fa-solid fa-user-check text-yellow-600' };
    return { label: 'Planejado', badge: 'border-gray-200 bg-gray-50 text-gray-700', icon: 'fa-regular fa-circle text-gray-500' };
  },

  extractIndexedRows: function (row, fieldNames) {
    var indexes = {};
    (fieldNames || []).forEach(function (fieldName) {
      Object.keys(row || {}).forEach(function (key) {
        if (key.indexOf(fieldName + '___') === 0) {
          indexes[key.split('___')[1]] = true;
        }
      });
    });
    return Object.keys(indexes).sort(function (a, b) { return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0); }).map(function (idx) {
      var item = { __rowIndex: idx };
      (fieldNames || []).forEach(function (fieldName) {
        item[fieldName] = row[fieldName + '___' + idx];
      });
      return item;
    });
  },

  getValIgnoreCase: function (obj, fieldName) {
    if (!obj || !fieldName) return '';
    if (obj[fieldName] !== undefined) return obj[fieldName];
    var target = String(fieldName).toLowerCase();
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i += 1) {
      if (String(keys[i]).toLowerCase() === target) return obj[keys[i]];
    }
    return '';
  },

  firstDefinedValue: function (values) {
    for (var i = 0; i < values.length; i += 1) {
      var value = this.asText(values[i]);
      if (value) return value;
    }
    return '';
  },

  parseJson: function (value) {
    try {
      return value ? JSON.parse(String(value)) : null;
    } catch (e) {
      return null;
    }
  },

  parseJsonArray: function (value) {
    var parsed = this.parseJson(value);
    return Array.isArray(parsed) ? parsed : [];
  },

  joinPeriod: function (start, end) {
    var first = this.asText(start);
    var last = this.asText(end);
    if (first && last) return first + ' at\u00e9 ' + last;
    return first || last || '';
  },

  extractStateCode: function (value) {
    var match = this.asText(value).match(/(\d+)/);
    return match && match[1] ? match[1] : '';
  },

  formatFileSize: function (size) {
    var bytes = parseInt(size, 10);
    if (!bytes || isNaN(bytes)) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  loadEmployeeOptions: async function () {
    var rows = [];
    try {
      rows = await fluigService.getDatasetRows('dsBuscaFunc', {
        fields: ['CHAPA', 'CHAPANOMEFUNCIONARIO', 'NOMEFUNCAO', 'NOMESECAO']
      });
    } catch (error) {
      try {
        rows = await fluigService.getDataset('dsBuscaFunc');
      } catch (fallbackError) {
        console.warn('[epDeliveryPlanning] dsBuscaFunc nao encontrado.', fallbackError);
      }
    }

    this._state.employeeOptions = (Array.isArray(rows) ? rows : []).map((row) => {
      var chapa = this.asText(row.CHAPA || row.chapa);
      var rawName = this.asText(row.CHAPANOMEFUNCIONARIO || row.chapanomefuncionario || row.NOME || row.nome);
      var normalizedName = this.normalizeEmployeeName(rawName);
      if (!normalizedName) return null;
      return {
        CHAPA: chapa || normalizedName,
        CHAPANOMEFUNCIONARIO: rawName,
        NOME_NORMALIZADO: normalizedName,
        NOMEFUNCAO: this.asText(row.NOMEFUNCAO || row.nomefuncao),
        NOMESECAO: this.asText(row.NOMESECAO || row.nomesecao)
      };
    }).filter(Boolean);
  },

  normalizeEmployeeName: function (value) {
    var text = this.asText(value);
    var dashIndex = text.indexOf('-');
    if (dashIndex >= 0) text = text.slice(dashIndex + 1);
    text = text.replace(/\s+/g, ' ').trim().toLowerCase();
    return text.replace(/(^|\s)(\S)/g, function (match, separator, letter) {
      return separator + letter.toUpperCase();
    });
  },

  initResponsibleTagFilters: function () {
    if (typeof TagInputFilter === 'undefined') return;
    var self = this;
    $('#delivery-plan-container .delivery-responsible-mount').each(function (_, mount) {
      if (mount._filterReady) return;
      if (!mount.id) mount.id = 'ep-resp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      var hiddenInput = $(mount).next('.delivery-responsible');
      var filter = new TagInputFilter('#' + mount.id, {
        placeholder: 'Pesquisar responsavel...',
        data: self._state.employeeOptions,
        labelField: 'NOME_NORMALIZADO',
        valueField: 'CHAPA',
        columns: [{ header: 'Nome', field: 'NOME_NORMALIZADO', width: 'flex-1' }],
        portalDropdown: true,
        compact: true,
        singleSelection: true,
        onItemAdded: function (item) {
          hiddenInput.val(item.NOME_NORMALIZADO).trigger('change');
        },
        onItemRemoved: function () {
          hiddenInput.val('').trigger('change');
        }
      });
      var initialValue = self.normalizeEmployeeName(hiddenInput.val());
      if (initialValue && typeof filter.setSelectedItems === 'function') {
        var found = self._state.employeeOptions.find(function (item) {
          return item.NOME_NORMALIZADO === initialValue;
        });
        filter.setSelectedItems([{
          value: found ? found.CHAPA : 'legacy:' + initialValue,
          label: found ? found.NOME_NORMALIZADO : initialValue
        }]);
      }
      mount._filterReady = true;
      mount._filterInstance = filter;
    });
  },

  initParticipantTagFilters: function () {
    if (typeof TagInputFilter === 'undefined') return;
    var self = this;
    $('#delivery-plan-container .delivery-participant-mount').each(function (_, mount) {
      if (mount._filterReady) return;
      if (!mount.id) mount.id = 'ep-part-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      var field = $(mount).closest('.delivery-participant-field');
      var filter = new TagInputFilter('#' + mount.id, {
        placeholder: 'Pesquisar e adicionar participante...',
        data: self._state.employeeOptions,
        labelField: 'NOME_NORMALIZADO',
        valueField: 'CHAPA',
        columns: [{ header: 'Nome', field: 'NOME_NORMALIZADO', width: 'flex-1' }],
        portalDropdown: true,
        compact: true,
        singleSelection: true,
        onItemAdded: function (item) {
          var value = self.asText(item && item.NOME_NORMALIZADO);
          var selectedList = field.find('.delivery-participant-selected-list').first();
          var exists = selectedList.find('.delivery-selected-participant').filter(function (_, chip) {
            return self.asText($(chip).attr('data-value')) === value;
          }).length > 0;
          if (value && !exists) selectedList.append(self.getParticipantChipHtml(value));
          var planIndex = parseInt(field.closest('.delivery-phase-item').attr('data-index'), 10);
          self.syncPlanFromDom(planIndex);
          setTimeout(function () {
            if (filter.removeAll) filter.removeAll();
          }, 10);
        }
      });
      mount._filterReady = true;
      mount._filterInstance = filter;
    });
  },

  getPlanBodyHtml: function (plan, index) {
    var isTraining = plan.type === 'treinamento';
    if (isTraining) {
      return [
        '<div class="grid grid-cols-1 gap-4 md:grid-cols-2">',
        this.getTrainingCheckboxHtml(true),
        '<div class="md:col-span-2"><div class="grid grid-cols-1 gap-4 md:grid-cols-3">',
        this.getResponsibleFieldHtml('Respons\u00e1vel Treinamento', plan.responsible, index),
        this.getTextFieldHtml('Data Treinamento', 'delivery-date', this.toIsoDate(plan.executionDate), 'Selecione a data', 'date'),
        this.getTextFieldHtml('Horas Treinamento', 'delivery-hours', plan.trainingHours, 'Informe a quantidade de horas', 'number'),
        '</div></div></div>',
        this.getParticipantsFieldHtml(plan.participants || [], index),
        '<div class="mt-4"><label class="mb-1 block text-sm text-gray-600">Descri\u00e7\u00e3o ' + this.getRequiredMarkHtml() + '</label><textarea class="delivery-description w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows="3" placeholder="Descreva o treinamento...">' + this.escapeHtml(plan.description) + '</textarea></div>',
        this.getTrainingAttachmentsHtml(plan.attachments || [])
      ].join('');
    }

    return [
      this.getTrainingCheckboxHtml(false),
      '<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">',
      this.getResponsibleFieldHtml('Respons\u00e1vel', plan.responsible, index),
      this.getTextFieldHtml('Data Execu\u00e7\u00e3o', 'delivery-date', this.toIsoDate(plan.executionDate), 'Selecione a data', 'date'),
      this.getStageFieldHtml(plan.stage),
      '</div>',
      this.getDependenciesHtml(plan.dependencies || ['']),
      '<div class="mt-4"><label class="mb-1 block text-sm text-gray-600">Descri\u00e7\u00e3o ' + this.getRequiredMarkHtml() + '</label><textarea class="delivery-description w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows="3" placeholder="Descreva o planejamento da entrega...">' + this.escapeHtml(plan.description) + '</textarea></div>'
    ].join('');
  },

  getResponsibleFieldHtml: function (label, value, index) {
    return [
      '<div>',
      '<label class="mb-1 block text-sm text-gray-600">' + this.escapeHtml(label) + ' ' + this.getRequiredMarkHtml() + '</label>',
      '<div class="delivery-responsible-mount" data-index="' + this.escapeHtml(index) + '"></div>',
      '<input type="hidden" class="delivery-responsible" value="' + this.escapeHtml(value) + '">',
      '</div>'
    ].join('');
  },

  getStageFieldHtml: function (stage) {
    var selected = this.asText(stage) || 'pre-go-live';
    return [
      '<div>',
      '<label class="mb-1 block text-sm text-gray-600">Est\u00e1gio ' + this.getRequiredMarkHtml() + '</label>',
      '<select class="delivery-stage w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">',
      '<option value="pre-go-live"' + (selected === 'pre-go-live' ? ' selected' : '') + '>Pr\u00e9-Go Live</option>',
      '<option value="durante-go-live"' + (selected === 'durante-go-live' ? ' selected' : '') + '>Durante o Go Live</option>',
      '<option value="pos-go-live"' + (selected === 'pos-go-live' ? ' selected' : '') + '>P\u00f3s-Go Live</option>',
      '</select>',
      '</div>'
    ].join('');
  },

  getParticipantsFieldHtml: function (participants, index) {
    var self = this;
    var chips = (Array.isArray(participants) ? participants : []).map(function (value) {
      return self.getParticipantChipHtml(value);
    }).join('');
    return [
      '<div class="delivery-participant-field mt-4" data-index="' + this.escapeHtml(index) + '">',
      '<div class="mb-1"><label class="block text-sm text-gray-600">Participantes ' + this.getRequiredMarkHtml() + '</label></div>',
      '<div class="delivery-participant-mount"></div>',
      '<div class="delivery-participant-selected-list mt-3 flex flex-wrap gap-2">' + chips + '</div>',
      '</div>'
    ].join('');
  },

  getParticipantChipHtml: function (value) {
    return [
      '<div class="delivery-selected-participant inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5" data-value="' + this.escapeHtml(value || '') + '">',
      '<span class="truncate text-xs text-gray-700">' + this.escapeHtml(value || '') + '</span>',
      '<button type="button" class="text-xs text-red-500 hover:text-red-700" data-action="remove-participant" title="Remover participante"><i class="fa-solid fa-times"></i></button>',
      '</div>'
    ].join('');
  },

  getTrainingAttachmentsHtml: function (attachments) {
    var self = this;
    var items = (Array.isArray(attachments) ? attachments : []).map(function (file, index) {
      return self.getTrainingAttachmentItemHtml(file, index);
    }).join('');
    return [
      '<div class="mt-4">',
      '<label class="mb-3 block text-sm text-gray-600">Anexar Documentos do Treinamento</label>',
      '<div class="delivery-attachments-field">',
      '<input type="file" multiple class="delivery-attachments-input hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg">',
      '<div class="delivery-attachments-dropzone cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-bevap-green">',
      '<i class="fa-solid fa-cloud-upload-alt mb-3 text-4xl text-gray-400"></i>',
      '<p class="mb-2 text-gray-600">Arraste arquivos ou clique para selecionar</p>',
      '<p class="text-sm text-gray-500">PDF, DOC, XLS (m\u00e1x. 10MB)</p>',
      '</div>',
      '<div class="delivery-attachments-list mt-4 space-y-2">' + items + '</div>',
      '</div>',
      '</div>'
    ].join('');
  },

  getTrainingAttachmentItemHtml: function (fileData, index) {
    var fileName = fileData && fileData.file ? fileData.file.name : this.asText(fileData && (fileData.name || fileData.fileName));
    var size = fileData && fileData.file ? fileData.file.size : this.asText(fileData && (fileData.size || fileData.fileSize));
    var remove = fileData && fileData.persisted
      ? '<button type="button" disabled class="text-red-500 opacity-30 cursor-not-allowed" title="Anexo ja salvo"><i class="fa-solid fa-lock"></i></button>'
      : '<button type="button" class="text-red-500 hover:text-red-700" data-action="remove-training-attachment" title="Remover anexo"><i class="fa-solid fa-trash"></i></button>';
    return [
      '<div class="delivery-attachment-item flex items-center justify-between rounded-lg bg-gray-50 p-3" data-attachment-index="' + this.escapeHtml(index) + '">',
      '<div class="flex min-w-0 items-center">',
      '<i class="fa-solid fa-file text-red-500 mr-3"></i>',
      '<div class="min-w-0"><p class="truncate text-sm font-medium text-gray-700">' + this.escapeHtml(fileName) + '</p><p class="text-xs text-gray-500">' + this.escapeHtml(this.formatFileSize(size) || 'Arquivo anexado') + '</p></div>',
      '</div>',
      remove,
      '</div>'
    ].join('');
  },

  getDependenciesHtml: function (dependencies) {
    var self = this;
    var rows = (dependencies && dependencies.length ? dependencies : ['']).map(function (dependency, index) {
      return [
        '<div class="delivery-dependency-row flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">',
        '<i class="fa-solid fa-triangle-exclamation text-yellow-600"></i>',
        '<input type="text" value="' + self.escapeHtml(dependency) + '" class="delivery-dependency-input field-input flex-1 border-none bg-transparent text-sm focus:outline-none" placeholder="Descreva uma depend\u00eancia...">',
        '<button type="button" data-action="remove-dependency" data-dependency-index="' + index + '" class="text-red-500 hover:text-red-700" title="Remover depend\u00eancia"><i class="fa-solid fa-times"></i></button>',
        '</div>'
      ].join('');
    }).join('');
    return '<div class="delivery-dependency-field mt-4"><div class="mb-1"><label class="block text-sm text-gray-600">Depend\u00eancias ' + this.getRequiredMarkHtml() + '</label></div><div class="delivery-dependency-list mb-3 space-y-2">' + rows + '</div><button type="button" class="text-sm font-medium text-bevap-green hover:text-green-700" data-action="add-dependency"><i class="fa-solid fa-plus mr-1"></i> Adicionar Depend\u00eancia</button></div>';
  },

  addDocumentsFromFiles: function (files) {
    var list = Array.prototype.slice.call(files || []);
    for (var i = 0; i < list.length; i += 1) {
      this._state.documents.push({
        id: 'local:' + Date.now() + ':' + Math.random().toString(16).slice(2),
        name: list[i].name || '',
        size: list[i].size || 0,
        type: list[i].type || '',
        file: list[i],
        persisted: false
      });
    }
    this.renderDocuments();
  },

  renderDocuments: function () {
    var self = this;
    var docs = this._state.documents || [];
    $('#delivery-documents-list').html(docs.length ? docs.map(function (doc, index) {
      var name = doc.file ? doc.file.name : (doc.name || doc.fileName);
      var size = doc.file ? doc.file.size : (doc.size || doc.fileSize);
      var remove = doc.persisted
        ? '<button type="button" disabled class="text-red-500 opacity-30 cursor-not-allowed" title="Anexo ja salvo"><i class="fa-solid fa-lock"></i></button>'
        : '<button type="button" data-action="remove-document" data-document-index="' + index + '" class="text-gray-400 transition-colors hover:text-red-500" title="Remover"><i class="fa-solid fa-trash"></i></button>';
      return [
        '<div class="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3">',
        '<div class="flex items-center justify-between gap-3">',
        '<div class="flex min-w-0 items-center gap-3"><i class="fa-solid ' + self.escapeHtml(self.getAttachmentIconClass(name)) + ' text-xl"></i><div class="min-w-0"><div class="truncate text-sm font-medium text-gray-900">' + self.escapeHtml(name || '-') + '</div><div class="text-xs text-gray-500">' + self.escapeHtml(self.formatFileSize(size)) + '</div></div></div>',
        remove,
        '</div>',
        '</div>'
      ].join('');
    }).join('') : '<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Nenhum documento anexado.</div>');
  },

  submit: async function () {
    var documentId = this.asText(this._state.documentId);
    if (!documentId) throw new Error('documentId nao informado.');
    var processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(documentId);
    var attachments = await this.collectAttachmentsPayload();
    var taskFields = this.collectTaskFields(true);

    this.logSaveAndSendPayload({
      processInstanceId: processInstanceId,
      documentId: documentId,
      numState: this._nextState,
      datasetName: this._formDatasetName,
      attachments: attachments
    }, taskFields);

    await fluigService.saveAndSendTask({
      id: processInstanceId,
      numState: this._nextState,
      documentId: documentId,
      datasetName: this._formDatasetName,
      comments: 'Planejamento da entrega concluido via Widget',
      attachments: attachments
    }, taskFields);
  },

  logSaveAndSendPayload: function (movementData, taskFields) {
    try {
      console.group('[epDeliveryPlanning] saveAndSendTask payload');
      console.log('state', {
        documentId: this._state.documentId,
        processInstanceId: this._state.processInstanceId,
        nextState: this._nextState,
        datasetId: this._datasetId,
        formName: this._formName,
        formDatasetName: this._formDatasetName
      });
      console.log('movementData', movementData);
      console.log('attachments', movementData && movementData.attachments ? movementData.attachments : []);
      console.log('taskFields.length', Array.isArray(taskFields) ? taskFields.length : 0);
      console.table(Array.isArray(taskFields) ? taskFields.map(function (field) {
        return {
          name: field && field.name,
          value: field && field.value
        };
      }) : []);
      console.log('deliveryPlans', this._state.deliveryPlans);
      console.log('documents', this._state.documents);
      console.groupEnd();
    } catch (error) {
      console.warn('[epDeliveryPlanning] nao foi possivel logar payload do saveAndSendTask', error);
    }
  },

  collectAttachmentsPayload: async function () {
    var items = Array.isArray(this._state.documents) ? this._state.documents.slice() : [];
    (this._state.deliveryPlans || []).forEach(function (plan) {
      if (Array.isArray(plan && plan.attachments)) {
        items = items.concat(plan.attachments);
      }
    });
    var localItems = items.filter(function (item) {
      return item && item.file && !item.persisted;
    });
    if (!localItems.length) return [];
    var self = this;
    var payload = await Promise.all(localItems.map(async function (item) {
      var content = await self.readFileAsBase64(item.file);
      return {
        fileName: self.asText(item.file && item.file.name),
        fileContent: self.asText(content),
        fileSize: String(item.file && item.file.size ? item.file.size : '').trim()
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

  hasLocalAttachments: function () {
    return (Array.isArray(this._state.documents) ? this._state.documents : []).some(function (item) {
      return item && item.file && !item.persisted;
    });
  },

  getAttachmentIconClass: function (fileName) {
    var ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
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
    var persistedTrainingRows = this.parsePersistedAttachments(this.getValIgnoreCase(row, 'anexosTreinamentoEP'));
    var self = this;

    this._state.existingPlanIndexes = planRows.map(function (item) { return item.__rowIndex; });
    this._state.existingDependencyIndexes = dependencyRows.map(function (item) { return item.__rowIndex; });

    dependencyRows.forEach(function (dependency) {
      var planId = self.asText(dependency.deliveryDependencyPlanIdEP);
      var text = self.asText(dependency.deliveryDependencyTextEP);
      if (!planId || !text) return;
      if (!dependenciesByPlan[planId]) dependenciesByPlan[planId] = [];
      dependenciesByPlan[planId].push(text);
    });

    persistedTrainingRows.forEach(function (doc) {
      var planId = self.asText(doc.planId);
      if (!planId) return;
      if (!attachmentsByPlan[planId]) attachmentsByPlan[planId] = [];
      attachmentsByPlan[planId].push({
        id: doc.id,
        documentId: doc.documentId,
        name: doc.name,
        fileName: doc.name,
        size: doc.size,
        fileSize: doc.size,
        type: doc.type,
        version: doc.version,
        createdAt: doc.createdAt,
        planId: doc.planId,
        persisted: true
      });
    });

    return planRows.map(function (plan) {
      var id = self.asText(plan.deliveryPlanIdEP) || self.createPlanId();
      var normalized = self.normalizePlan({
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
      return normalized.title || normalized.responsible || normalized.description ? normalized : null;
    }).filter(Boolean);
  },

  extractDeliveryDocuments: function (row) {
    this._state.existingDocumentIndexes = [];
    return this.parsePersistedAttachments(this.getValIgnoreCase(row, 'anexosEntregaEP'));
  },

  parsePersistedAttachments: function (rawValue) {
    var parsed = this.parseJson(rawValue);
    if (!Array.isArray(parsed)) return [];
    var self = this;
    return parsed.map(function (attachment, index) {
      return {
        id: self.asText(attachment.documentId || attachment.id || 'persisted:' + index),
        documentId: self.asText(attachment.documentId || attachment.id),
        name: self.asText(attachment.fileName || attachment.documentDescription),
        fileName: self.asText(attachment.fileName || attachment.documentDescription),
        size: self.asText(attachment.fileSize),
        fileSize: self.asText(attachment.fileSize),
        type: '',
        version: self.asText(attachment.version),
        createdAt: self.asText(attachment.createdAt),
        planId: self.asText(attachment.planId),
        scope: self.asText(attachment.scope),
        persisted: true
      };
    }).filter(function (attachment) {
      return attachment.name;
    });
  },

  findAttachmentByName: function (attachments, fileName) {
    var normalized = this.normalizeLookupKey(fileName);
    if (!normalized) return null;
    for (var i = 0; i < (attachments || []).length; i += 1) {
      if (this.normalizeLookupKey(attachments[i] && attachments[i].name) === normalized) return attachments[i];
    }
    return null;
  },

  extractMilestones: function (row) {
    var payload = this.parseJson(this.getValIgnoreCase(row, 'projectPlanningJsonDP'));
    var summaryRows = this.extractTableRows(row, 'tblMilestoneTasksSummaryDP', [
      'milestoneTaskSummaryIdDP',
      'milestoneTaskSummaryTextDP',
      'milestoneTaskSummaryDueDateDP',
      'milestoneTaskSummaryPhaseDP',
      'milestoneTaskSummaryMarcoDP',
      'milestoneTaskSummaryProcessDP',
      'milestoneTaskSummaryDocIdDP',
      'milestoneTaskSummaryEstProcDP',
      'milestoneTaskSummaryStatusDP',
      'milestoneTaskSummaryStartedDP'
    ]);
    var milestoneRows = payload && payload.milestones && Array.isArray(payload.milestones.items)
      ? payload.milestones.items
      : this.extractTableRows(row, 'tblMilestonesDP', ['milestoneIdDP', 'milestoneNameDP', 'milestoneStartDateDP', 'milestoneEndDateDP']);
    var criteriaRows = payload && payload.milestones && Array.isArray(payload.milestones.criteria)
      ? payload.milestones.criteria
      : this.extractTableRows(row, 'tblMilestoneCriteriaDP', ['milestoneCriteriaMilestoneIdDP', 'milestoneCriteriaTextDP']);
    var responsibleLookup = this.buildTaskResponsibleLookup(row, payload);
    var criteriaByMilestone = this.groupCriteriaByMilestone(milestoneRows, criteriaRows);
    var tasksByMilestone = this.groupSummaryTasksByMilestone(summaryRows, responsibleLookup);
    var self = this;

    return (milestoneRows || []).map(function (milestone, index) {
      var id = self.firstDefinedValue([milestone.id, milestone.milestoneIdDP, String(index + 1)]);
      var name = self.firstDefinedValue([milestone.name, milestone.milestoneNameDP, 'Marco ' + (index + 1)]);
      var period = self.firstDefinedValue([
        milestone.period,
        self.joinPeriod(milestone.startDate || milestone.milestoneStartDateDP, milestone.endDate || milestone.milestoneEndDateDP)
      ]);
      return {
        id: id,
        name: name,
        period: period,
        owner: self.firstDefinedValue([milestone.owner, milestone.responsible, milestone.responsavel, (tasksByMilestone[name] || [])[0] && (tasksByMilestone[name] || [])[0].responsible, '-']),
        status: self.firstDefinedValue([milestone.status, 'concluido']),
        criteria: criteriaByMilestone[id] || criteriaByMilestone[name] || [],
        tasks: tasksByMilestone[name] || []
      };
    });
  },

  buildTaskResponsibleLookup: function (row, payload) {
    var lookup = { tasks: {}, phases: {} };
    var self = this;
    var payloadPhases = payload && payload.wbs && Array.isArray(payload.wbs.phases) ? payload.wbs.phases : [];
    var phaseRows = payloadPhases.length ? [] : this.extractTableRows(row, 'tblWbsPhasesDP', [
      'wbsPhaseIdDP',
      'wbsPhaseNameDP',
      'wbsPhaseResponsibleDP'
    ]);
    var taskRows = payloadPhases.length ? [] : this.extractTableRows(row, 'tblWbsTasksDP', [
      'wbsTaskPhaseIdDP',
      'wbsTaskNameDP',
      'wbsTaskResponsibleDP'
    ]);
    var phaseNameById = {};

    payloadPhases.forEach(function (phase) {
      var phaseName = self.asText(phase && phase.name);
      var phaseResponsible = self.asText(phase && phase.responsible);
      if (phaseName && phaseResponsible) lookup.phases[self.normalizeLookupKey(phaseName)] = phaseResponsible;
      (Array.isArray(phase && phase.tasks) ? phase.tasks : []).forEach(function (task) {
        var taskName = self.asText(task && task.name);
        var responsible = self.firstDefinedValue([task && task.responsible, phaseResponsible]);
        if (phaseName && taskName && responsible) {
          lookup.tasks[self.normalizeLookupKey(phaseName) + '::' + self.normalizeLookupKey(taskName)] = responsible;
        }
      });
    });

    phaseRows.forEach(function (phase) {
      var id = self.asText(phase.wbsPhaseIdDP);
      var name = self.asText(phase.wbsPhaseNameDP);
      var responsible = self.asText(phase.wbsPhaseResponsibleDP);
      if (id && name) phaseNameById[id] = name;
      if (name && responsible) lookup.phases[self.normalizeLookupKey(name)] = responsible;
    });

    taskRows.forEach(function (task) {
      var phaseName = phaseNameById[self.asText(task.wbsTaskPhaseIdDP)] || '';
      var taskName = self.asText(task.wbsTaskNameDP);
      var responsible = self.asText(task.wbsTaskResponsibleDP) || lookup.phases[self.normalizeLookupKey(phaseName)] || '';
      if (phaseName && taskName && responsible) {
        lookup.tasks[self.normalizeLookupKey(phaseName) + '::' + self.normalizeLookupKey(taskName)] = responsible;
      }
    });

    return lookup;
  },

  resolveTaskResponsibleFromLookup: function (lookup, phaseName, taskName) {
    var normalizedPhase = this.normalizeLookupKey(phaseName);
    var normalizedTask = this.normalizeLookupKey(taskName);
    return this.asText(lookup && lookup.tasks && lookup.tasks[normalizedPhase + '::' + normalizedTask])
      || this.asText(lookup && lookup.phases && lookup.phases[normalizedPhase])
      || '-';
  },

  normalizeLookupKey: function (value) {
    return this.normalizeText(value).replace(/\s+/g, ' ').trim();
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

  toIsoDate: function (value) {
    var text = this.asText(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    var br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return br[3] + '-' + br[2] + '-' + br[1];
    return text;
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
    $('#toast-title').text(title || 'Informa\u00e7\u00e3o');
    $('#toast-message').text(message || '');
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(function () {
      $('#toast').addClass('hidden');
    }, 3200);
  },

  normalizeText: function (value) {
    return this.asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
