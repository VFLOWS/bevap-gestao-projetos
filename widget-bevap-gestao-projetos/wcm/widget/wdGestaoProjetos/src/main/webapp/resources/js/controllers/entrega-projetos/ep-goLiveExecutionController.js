const epGoLiveExecutionController = {
  _eventNamespace: '.epGoLiveExecution',
  _datasetId: 'dsGetEntregaProjetos',
  _formDatasetName: 'DSFormEntregaProjetos',
  _nextState: '37',
  _editableStage: 'durante-go-live',
  _toastTimer: null,
  _headerBackup: null,
  _state: {
    documentId: '',
    processInstanceId: '',
    projectSummary: {},
    deliveryPlans: [],
    documents: [],
    finalHistory: [],
    goLiveHistory: [],
    existingPlanIndexes: [],
    existingDependencyIndexes: [],
    currentTab: 'overview',
    pendingStatusChange: null,
    isSubmitting: false
  },

  load: async function (params) {
    params = params || {};
    this._state.documentId = this.asText(params.documentId);
    this._state.processInstanceId = this.asText(params.processInstanceId);
    this._state.projectSummary = {};
    this._state.deliveryPlans = [];
    this._state.documents = [];
    this._state.finalHistory = [];
    this._state.goLiveHistory = [];
    this._state.existingPlanIndexes = [];
    this._state.existingDependencyIndexes = [];
    this._state.currentTab = 'overview';
    this._state.pendingStatusChange = null;
    this._state.isSubmitting = false;

    try {
      var html = await $.get(this.getTemplateUrl());
      $('#page-container').html(html);
      this.backupAndSetHeader();
      this.bindEvents();
      await this.loadData();
      this.renderAll();
    } catch (error) {
      console.error('[epGoLiveExecution] load error:', error);
      $('#page-container').html('<div class="p-6 text-red-600">Falha ao carregar a tela de GO Live.</div>');
    }
  },

  destroy: function () {
    $('#page-container').off(this._eventNamespace);
    this.restoreHeader();
    if (this._toastTimer) clearTimeout(this._toastTimer);
  },

  getTemplateUrl: function () {
    return WCMAPI.getServerURL() + '/wdGestaoProjetos/resources/js/templates/entrega-projetos/ep-go-live-execution.html';
  },

  backupAndSetHeader: function () {
    var header = $('#header');
    if (!header.length) return;
    var title = header.find('h1').first();
    var breadcrumb = header.find('nav').first();
    if (!this._headerBackup) this._headerBackup = { title: title.text(), breadcrumbHtml: breadcrumb.html() };
    title.text('TI - Realizar GO Live em Producao');
    breadcrumb.html([
      '<a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white"><i class="fa-solid fa-house text-xs"></i><span>Inicio</span></a>',
      '<span class="text-gray-400">/</span><span class="text-gray-300">Entrega</span>',
      '<span class="text-gray-400">/</span><span class="font-medium text-bevap-gold">Realizar GO Live</span>'
    ].join(''));
  },

  restoreHeader: function () {
    if (!this._headerBackup) return;
    var header = $('#header');
    header.find('h1').first().text(this._headerBackup.title || '');
    header.find('nav').first().html(this._headerBackup.breadcrumbHtml || '');
    this._headerBackup = null;
  },

  bindEvents: function () {
    var self = this;
    var container = $('#page-container');
    container.off(this._eventNamespace);

    container.on('click' + this._eventNamespace, '#ep-golive-overview-tab', function () { self.setTab('overview'); });
    container.on('click' + this._eventNamespace, '#ep-golive-validation-tab', function () { self.setTab('validation'); });
    container.on('click' + this._eventNamespace, '#ep-golive-documents-tab, [data-action="open-golive-documents"]', function () { self.setTab('documents'); });
    container.on('click' + this._eventNamespace, '[data-action="set-golive-plan-status"]', function () {
      self.openStatusModal($(this).attr('data-plan-id'), $(this).attr('data-status'));
    });
    container.on('click' + this._eventNamespace, '[data-action="edit-golive-plan-status"]', function () {
      var plan = self.findPlanById($(this).attr('data-plan-id'));
      if (!plan || plan.stage !== self._editableStage) return;
      plan.isEditingStatus = true;
      self.renderPlanningCards();
    });
    container.on('click' + this._eventNamespace, '[data-action="close-golive-status"]', function () { self.closeModal('#ep-golive-status-modal'); self._state.pendingStatusChange = null; });
    container.on('click' + this._eventNamespace, '[data-action="confirm-golive-status"]', function () { self.confirmStatusChange(); });
    container.on('change' + this._eventNamespace, '#ep-golive-documents-input', function () { self.addDocuments(this.files); this.value = ''; });
    container.on('dragover' + this._eventNamespace, '#ep-golive-documents-dropzone', function (event) {
      event.preventDefault();
      $(this).addClass('border-bevap-green bg-green-50');
    });
    container.on('dragleave' + this._eventNamespace + ' drop' + this._eventNamespace, '#ep-golive-documents-dropzone', function (event) {
      event.preventDefault();
      $(this).removeClass('border-bevap-green bg-green-50');
      if (event.type === 'drop') self.addDocuments(event.originalEvent.dataTransfer.files);
    });
    container.on('click' + this._eventNamespace, '[data-action="remove-golive-document"]', function () {
      self._state.documents.splice(parseInt($(this).attr('data-document-index'), 10), 1);
      self.renderDocuments();
    });
    container.on('click' + this._eventNamespace, '[data-action="save-golive-draft"]', function () { self.saveDraft(); });
    container.on('click' + this._eventNamespace, '[data-action="open-golive-return"]', function () { self.openModal('#ep-golive-return-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="close-golive-return"]', function () { self.closeModal('#ep-golive-return-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="confirm-golive-return"]', function () { self.confirmReturn(); });
    container.on('click' + this._eventNamespace, '[data-action="open-golive-cancel"]', function () { self.openModal('#ep-golive-cancel-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="close-golive-cancel"]', function () { self.closeModal('#ep-golive-cancel-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="confirm-golive-cancel"]', function () { self.confirmCancel(); });
    container.on('click' + this._eventNamespace, '[data-action="open-golive-approve"]', function () { self.openApproveModal(); });
    container.on('click' + this._eventNamespace, '[data-action="close-golive-approve"]', function () { self.closeModal('#ep-golive-approve-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="confirm-golive-approve"]', function () { self.submitDecision('aprovado', '', '', 'GO Live concluido via Widget'); });
  },

  loadData: async function () {
    var rows = await fluigService.getDatasetRows(this._datasetId, { filters: { documentid: this._state.documentId } });
    var row = rows && rows.length ? rows[0] : null;
    if (!row) return;
    this._state.projectSummary = this.extractProjectSummary(row);
    this._state.deliveryPlans = this.extractDeliveryPlans(row);
    this._state.documents = this.parsePersistedAttachments(this.getValIgnoreCase(row, 'anexosGoLiveTiEP'));
    this._state.finalHistory = this.getHistoryWithFallback(row, {
      historyField: 'histValFinalEP',
      decisionField: 'decisaoValFinalEP',
      commentField: 'comentValFinalEP',
      descriptionField: 'justifValFinalEP',
      categoryField: 'categoriaCancelValFinalEP',
      userName: 'TI'
    });
    this._state.goLiveHistory = this.normalizeHistory(this.parseJson(this.getValIgnoreCase(row, 'histGoLiveTiEP')));
    $('#ep-golive-opinion').val(this.asText(this.getValIgnoreCase(row, 'comentGoLiveTiEP')));
    $('#ep-golive-agreement').prop('checked', this.asText(this.getValIgnoreCase(row, 'confirmaGoLiveTiEP')) === 'true');
  },

  renderAll: function () {
    this.renderProjectSummary();
    this.renderProgress();
    this.renderPlanningCards();
    this.renderFinalHistory();
    this.renderDocuments();
    this.updateTabs();
  },

  renderProjectSummary: function () {
    var summary = this._state.projectSummary || {};
    $('#ep-golive-project-code').text(summary.code || '-');
    $('#ep-golive-project-title').text(summary.title || '-');
    $('#ep-golive-project-requester').text(summary.requester || '-');
    $('#ep-golive-approve-message').html('Voce esta confirmando a conclusao da execucao do GO Live para o projeto <strong>' + this.escapeHtml((summary.code || '-') + ' - ' + (summary.title || '-')) + '</strong>.');
  },

  renderProgress: function () {
    $('#ep-golive-progress-list').html([
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Execucao do projeto concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Validacao do solicitante concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Validacao do TI concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Planejamento GO Live concluido</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Treinamento dos usuarios concluido</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Validação Final TI concluida</span></div>',
      '<div class="flex items-center text-bevap-gold"><i class="fa-solid fa-clock mr-2"></i><span>TI - Realizar GO Live</span></div>'
    ].join(''));
  },

  renderPlanningCards: function () {
    var self = this;
    $('#ep-golive-planning-list').html((this._state.deliveryPlans || []).map(function (plan) {
      return plan.type === 'treinamento' ? self.getTrainingCardHtml(plan) : self.getPlanningCardHtml(plan);
    }).join('') || '<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">Nenhum planejamento encontrado.</div>');
  },

  getPlanningCardHtml: function (plan) {
    var stage = this.getStageMeta(plan.stage);
    var status = this.asText(plan.goLiveStatus) || 'planejado';
    var resolved = status === 'realizado' || status === 'nao_realizado';
    var editableStage = plan.stage === this._editableStage;
    var showButtons = editableStage && (!resolved || plan.isEditingStatus);
    var edit = editableStage && resolved && !plan.isEditingStatus
      ? '<button type="button" data-action="edit-golive-plan-status" data-plan-id="' + this.escapeHtml(plan.id) + '" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700" title="Editar status"><i class="fa-solid fa-pen text-sm"></i></button>'
      : '';
    var realizedButtonClasses = status === 'realizado' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50 hover:text-green-700';
    var notRealizedButtonClasses = status === 'nao_realizado' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-red-50 hover:text-red-700';
    var buttons = showButtons ? [
      '<span class="ml-auto inline-flex overflow-hidden rounded-full border border-gray-200 bg-gray-50 shadow-sm">',
      '<button type="button" data-action="set-golive-plan-status" data-plan-id="' + this.escapeHtml(plan.id) + '" data-status="realizado" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ' + realizedButtonClasses + '"><i class="fa-solid fa-circle-check"></i>Realizado</button>',
      '<button type="button" data-action="set-golive-plan-status" data-plan-id="' + this.escapeHtml(plan.id) + '" data-status="nao_realizado" class="inline-flex items-center gap-1.5 border-l border-gray-200 px-3 py-1.5 text-xs font-medium ' + notRealizedButtonClasses + '"><i class="fa-solid fa-ban"></i>Nao Realizado</button>',
      '</span>'
    ].join('') : '';
    return [
      '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">',
      '<div class="flex items-start justify-between gap-4"><div class="flex min-w-0 items-center gap-3"><span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><i class="fa-solid fa-rocket"></i></span><div><h3 class="text-base font-montserrat font-semibold text-bevap-navy">' + this.escapeHtml(plan.title) + '</h3><p class="mt-1 text-sm text-gray-500">Responsavel: ' + this.escapeHtml(plan.responsible || '-') + '</p></div></div><div class="flex items-center gap-2">' + this.getPlanningStatusBadge(status) + edit + '</div></div>',
      '<div class="mt-4 flex flex-wrap items-center gap-2 text-[13px]"><span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color:#dc2626;border-color:#dc2626"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Planejado: ' + this.escapeHtml(this.formatBrDate(plan.executionDate) || '-') + '</span><span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="' + stage.style + '"><i class="' + stage.icon + ' mr-1"></i>' + this.escapeHtml(stage.label) + '</span>' + buttons + '</div>',
      '<div class="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"><span class="font-semibold text-bevap-navy">Descricao:</span> ' + this.escapeHtml(plan.description || '-') + '</div>',
      '<div class="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4"><div class="mb-3 flex items-center justify-between"><label class="text-sm font-medium text-bevap-navy">Dependencias</label><span class="text-xs text-gray-600">' + (plan.dependencies || []).filter(Boolean).length + ' itens</span></div><div class="space-y-2">' + this.getDependenciesHtml(plan.dependencies) + '</div></div>',
      '</div>'
    ].join('');
  },

  getTrainingCardHtml: function (plan) {
    var status = this.asText(plan.trainingStatus);
    var statusText = status === 'realizado'
      ? '<div class="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"><span class="font-semibold text-bevap-navy">Data realizada:</span> ' + this.escapeHtml(this.formatBrDateTime(plan.trainingDate) || '-') + '</div>'
      : '<div class="rounded-lg border border-dashed border-amber-300 bg-white px-4 py-3 text-sm text-amber-800"><span class="font-semibold">Resultado:</span> treinamento nao realizado.</div>';
    return [
      '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">',
      '<div class="flex items-start justify-between gap-4"><div class="flex min-w-0 items-center gap-3"><span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><i class="fa-solid fa-chalkboard-user"></i></span><div><h3 class="text-base font-montserrat font-semibold text-bevap-navy">' + this.escapeHtml(plan.title) + '</h3><p class="mt-1 text-sm text-gray-500">Responsavel: ' + this.escapeHtml(plan.responsible || '-') + '</p></div></div>' + this.getTrainingStatusBadge(status) + '</div>',
      '<div class="mt-4 flex flex-wrap gap-2 text-[13px]"><span class="rounded-full border px-3 py-1.5 text-white" style="background-color:#dc2626;border-color:#dc2626">Planejado: ' + this.escapeHtml(this.formatBrDate(plan.executionDate) || '-') + '</span><span class="rounded-full border px-3 py-1.5 text-white" style="background-color:#16a34a;border-color:#16a34a">' + this.escapeHtml(plan.trainingHours || '-') + '</span><span class="rounded-full border px-3 py-1.5 text-white" style="background-color:#7c3aed;border-color:#7c3aed">' + (plan.participants || []).length + ' participantes</span></div>',
      '<div class="mt-4">' + statusText + '</div>',
      '<div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><label class="mb-3 block text-sm font-medium text-bevap-navy">Participantes</label><div class="flex flex-wrap gap-2">' + this.getParticipantsHtml(plan.participants) + '</div></div>',
      '<div class="mt-4"><label class="mb-1 block text-sm text-gray-600">Observacoes</label><textarea class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" rows="3" readonly>' + this.escapeHtml(plan.trainingNotes || plan.trainingJustification || '') + '</textarea></div>',
      '<div class="mt-4"><label class="mb-3 block text-sm text-gray-600">Documentos do Treinamento</label><div class="space-y-3">' + this.getReadonlyDocumentsHtml(plan.attachments) + '</div></div>',
      '</div>'
    ].join('');
  },

  renderFinalHistory: function () {
    $('#ep-golive-final-history-list').html(this.getHistoryListHtml(this._state.finalHistory, 'Validado'));
  },

  getHistoryListHtml: function (history, approvedLabel) {
    var items = this.normalizeHistory(history);
    if (!items.length) return '<div class="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">Nenhum historico registrado.</div>';
    var self = this;
    return items.slice().reverse().map(function (entry) { return self.getHistoryCardHtml(entry, approvedLabel); }).join('');
  },

  getHistoryCardHtml: function (entry, approvedLabel) {
    var decision = this.asText(entry && entry.decision);
    var meta = this.getDecisionMeta(decision, approvedLabel || 'Aprovado');
    var userName = this.asText(entry && entry.userName) || 'Usuario';
    var initials = userName.split(/\s+/).map(function (part) { return part.charAt(0); }).join('').slice(0, 2).toUpperCase() || 'US';
    var comment = this.asText(entry && entry.comment);
    var description = this.asText(entry && entry.description);
    var category = this.asText(entry && entry.category);
    var extra = category ? '<div class="mt-2 text-xs text-gray-500">Categoria: ' + this.escapeHtml(category) + '</div>' : '';
    return [
      '<div class="rounded-xl border border-gray-200 bg-slate-50 p-4">',
      '<div class="flex items-start justify-between gap-3">',
      '<div class="flex items-center gap-3"><span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bevap-navy text-sm font-semibold text-white">' + this.escapeHtml(initials) + '</span><div><div class="font-semibold leading-5 text-bevap-navy">' + this.escapeHtml(userName) + '</div><div class="mt-1 text-xs text-gray-500">' + this.escapeHtml(meta.subtitle) + '</div></div></div>',
      '<div class="flex items-center gap-2"><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ' + meta.badgeClass + '">' + this.escapeHtml(meta.label) + '</span><div class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500">' + this.escapeHtml(this.formatHistoryDate(entry && entry.createdAt)) + '</div></div>',
      '</div>',
      '<p class="mt-2 text-sm text-gray-700">' + this.escapeHtml(comment || description || 'Sem observacoes registradas.') + '</p>',
      description && comment ? '<div class="mt-2 text-xs text-gray-500">Motivo: ' + this.escapeHtml(description) + '</div>' : '',
      extra,
      '</div>'
    ].join('');
  },

  getDecisionMeta: function (decision, approvedLabel) {
    if (decision === 'aprovado') return { label: approvedLabel, subtitle: approvedLabel, badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    if (decision === 'correcao') return { label: 'Novo planejamento', subtitle: 'Novo planejamento solicitado', badgeClass: 'border-yellow-200 bg-yellow-50 text-yellow-700' };
    if (decision === 'cancelado') return { label: 'Nao continuidade', subtitle: 'Nao continuidade', badgeClass: 'border-red-200 bg-red-50 text-red-700' };
    return { label: 'Registro', subtitle: 'Registro', badgeClass: 'border-gray-200 bg-white text-gray-700' };
  },

  renderDocuments: function () {
    $('#ep-golive-documents-list').html(this.getDocumentsHtml());
  },

  getDocumentsHtml: function () {
    var self = this;
    return (this._state.documents || []).map(function (doc, index) {
      var remove = doc.persisted ? '<i class="fa-solid fa-lock text-gray-300"></i>' : '<button type="button" data-action="remove-golive-document" data-document-index="' + index + '" class="text-gray-400 hover:text-red-500" title="Remover"><i class="fa-solid fa-trash"></i></button>';
      return self.getDocumentHtml(doc, remove);
    }).join('') || this.getEmptyDocumentsHtml();
  },

  getReadonlyDocumentsHtml: function (documents) {
    var self = this;
    return (documents || []).map(function (doc) { return self.getDocumentHtml(doc, ''); }).join('') || this.getEmptyDocumentsHtml();
  },

  getDocumentHtml: function (doc, action) {
    var name = doc && doc.file ? doc.file.name : this.asText(doc && (doc.name || doc.fileName));
    var size = doc && doc.file ? doc.file.size : this.asText(doc && (doc.size || doc.fileSize));
    return '<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"><div class="flex min-w-0 items-center gap-3"><i class="fa-solid ' + this.escapeHtml(this.getAttachmentIconClass(name)) + ' text-xl"></i><div class="min-w-0"><div class="truncate text-sm font-medium text-gray-900">' + this.escapeHtml(name || '-') + '</div><div class="text-xs text-gray-500">' + this.escapeHtml(this.formatFileSize(size)) + '</div></div></div>' + (action || '') + '</div>';
  },

  getEmptyDocumentsHtml: function () {
    return '<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Nenhum documento anexado.</div>';
  },

  setTab: function (tab) {
    this._state.currentTab = tab === 'validation' || tab === 'documents' ? tab : 'overview';
    this.updateTabs();
  },

  updateTabs: function () {
    var current = this._state.currentTab;
    var tabs = [
      { name: 'overview', tab: '#ep-golive-overview-tab', content: '#ep-golive-overview-content' },
      { name: 'validation', tab: '#ep-golive-validation-tab', content: '#ep-golive-validation-content' },
      { name: 'documents', tab: '#ep-golive-documents-tab', content: '#ep-golive-documents-content' }
    ];
    tabs.forEach(function (item) {
      var active = item.name === current;
      $(item.tab).attr('class', active ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green' : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700');
      $(item.content).toggleClass('hidden', !active);
    });
  },

  openStatusModal: function (planId, status) {
    var plan = this.findPlanById(planId);
    if (!plan || plan.type === 'treinamento' || plan.stage !== this._editableStage) return;
    this._state.pendingStatusChange = { planId: planId, status: status };
    var realized = status === 'realizado';
    $('#ep-golive-status-title').text(realized ? 'Confirmar Planejamento Realizado' : 'Confirmar Planejamento Nao Realizado');
    $('#ep-golive-status-message').text('Deseja atualizar "' + (plan.title || 'Planejamento') + '" para o status ' + (realized ? 'Realizado' : 'Nao Realizado') + '?');
    this.openModal('#ep-golive-status-modal');
  },

  confirmStatusChange: function () {
    var pending = this._state.pendingStatusChange;
    var plan = pending ? this.findPlanById(pending.planId) : null;
    if (plan) {
      plan.goLiveStatus = pending.status;
      plan.isEditingStatus = false;
    }
    this._state.pendingStatusChange = null;
    this.closeModal('#ep-golive-status-modal');
    this.renderPlanningCards();
    this.showToast('Status atualizado', 'O resultado do planejamento foi atualizado com sucesso.', 'success');
  },

  openApproveModal: function () {
    var validation = this.validateBeforeApprove();
    if (!validation.valid) return this.showToast('Validação Pendente', validation.message, 'warning');
    this.openModal('#ep-golive-approve-modal');
  },

  confirmReturn: function () {
    var required = this.validateRequiredConfirmation();
    if (!required.valid) return this.showToast('Validação Pendente', required.message, 'warning');
    var reason = this.asText($('#ep-golive-return-reason').val());
    if (!reason) return this.showToast('Informe o motivo', 'Descreva o motivo do novo planejamento.', 'warning');
    this.closeModal('#ep-golive-return-modal');
    this.submitDecision('correcao', reason, '', 'GO Live devolvido para novo planejamento via Widget');
  },

  confirmCancel: function () {
    var required = this.validateRequiredConfirmation();
    if (!required.valid) return this.showToast('Validação Pendente', required.message, 'warning');
    var category = this.asText($('#ep-golive-cancel-category').val());
    var reason = this.asText($('#ep-golive-cancel-reason').val());
    if (!category) return this.showToast('Informe a categoria', 'Selecione a categoria da nao continuidade.', 'warning');
    if (!reason) return this.showToast('Informe o motivo', 'Descreva o motivo da nao continuidade.', 'warning');
    this.closeModal('#ep-golive-cancel-modal');
    this.submitDecision('cancelado', reason, category, 'Nao continuidade do GO Live registrada via Widget');
  },

  validateRequiredConfirmation: function () {
    if (!this.asText($('#ep-golive-opinion').val())) return { valid: false, message: 'Informe o comentario final da TI.' };
    if (!$('#ep-golive-agreement').is(':checked')) return { valid: false, message: 'Marque a confirmacao da execucao tecnica do GO Live.' };
    return { valid: true, message: '' };
  },

  validateBeforeApprove: function () {
    var required = this.validateRequiredConfirmation();
    if (!required.valid) return required;
    var editableStage = this._editableStage;
    var plans = (this._state.deliveryPlans || []).filter(function (plan) { return plan.type !== 'treinamento' && plan.stage === editableStage; });
    for (var i = 0; i < plans.length; i += 1) {
      if (plans[i].goLiveStatus !== 'realizado' && plans[i].goLiveStatus !== 'nao_realizado') {
        return { valid: false, message: 'Defina o resultado de ' + (plans[i].title || ('Planejamento ' + (i + 1))) + '.' };
      }
    }
    return { valid: true, message: '' };
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;
    try {
      await fluigService.saveDraft({ mode: 'updateCardDraft', documentId: this._state.documentId, taskFields: this.collectTaskFields('', '', '', false) });
      try { sessionStorage.setItem('gpDashboardFeedback', JSON.stringify({ title: 'Rascunho salvo', message: 'O GO Live foi salvo com sucesso.', type: 'success' })); } catch (ignore) {}
      location.hash = '#dashboard';
    } catch (error) {
      console.error('[epGoLiveExecution] saveDraft error:', error);
      this.showToast('Erro ao salvar', this.asText(error && error.message) || 'Nao foi possivel salvar o rascunho.', 'error');
    }
  },

  submitDecision: async function (decision, reason, category, comments) {
    if (this._state.isSubmitting) return;
    var required = decision === 'aprovado' ? this.validateBeforeApprove() : this.validateRequiredConfirmation();
    if (!required.valid) return this.showToast('Validação Pendente', required.message, 'warning');
    this._state.isSubmitting = true;
    var loading = typeof FLUIGC !== 'undefined' ? FLUIGC.loading($('#page-container')) : null;
    if (loading) loading.show();
    try {
      var processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(this._state.documentId);
      var attachments = await this.collectAttachmentsPayload();
      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: this._nextState,
        documentId: this._state.documentId,
        datasetName: this._formDatasetName,
        comments: comments,
        attachments: attachments
      }, this.collectTaskFields(decision, reason, category, true));
      this.showToast('Sucesso', 'GO Live registrado com sucesso.', 'success');
      setTimeout(function () { location.hash = '#dashboard'; }, 800);
    } catch (error) {
      console.error('[epGoLiveExecution] submitDecision error:', error);
      this.showToast('Erro ao enviar', this.asText(error && error.message) || 'Nao foi possivel movimentar o processo.', 'error');
    } finally {
      this._state.isSubmitting = false;
      if (loading) loading.hide();
    }
  },

  collectTaskFields: function (decision, reason, category, includePending) {
    var fields = [];
    this.addClearChildTableFields(fields);
    var dependencyIndex = 1;
    var self = this;
    (this._state.deliveryPlans || []).forEach(function (plan, index) {
      var idx = index + 1;
      fields.push({ name: 'deliveryPlanIdEP___' + idx, value: plan.id });
      fields.push({ name: 'deliveryPlanTypeEP___' + idx, value: plan.type });
      fields.push({ name: 'deliveryPlanTitleEP___' + idx, value: plan.title });
      fields.push({ name: 'deliveryPlanResponsibleEP___' + idx, value: plan.responsible });
      fields.push({ name: 'deliveryPlanExecutionDateEP___' + idx, value: plan.executionDate });
      fields.push({ name: 'deliveryPlanStageEP___' + idx, value: plan.stage });
      fields.push({ name: 'deliveryGoLiveStatusEP___' + idx, value: plan.goLiveStatus });
      fields.push({ name: 'deliveryPlanTrainingHoursEP___' + idx, value: plan.trainingHours });
      fields.push({ name: 'deliveryPlanDescriptionEP___' + idx, value: plan.description });
      fields.push({ name: 'deliveryPlanParticipantsEP___' + idx, value: (plan.participants || []).join(', ') });
      fields.push({ name: 'deliveryTrainStatusEP___' + idx, value: plan.trainingStatus });
      fields.push({ name: 'deliveryTrainDateEP___' + idx, value: plan.trainingDate });
      fields.push({ name: 'deliveryTrainNotesEP___' + idx, value: plan.trainingNotes });
      fields.push({ name: 'deliveryTrainJustifEP___' + idx, value: plan.trainingJustification });
      (plan.dependencies || []).forEach(function (dependency) {
        if (!self.asText(dependency)) return;
        fields.push({ name: 'deliveryDependencyPlanIdEP___' + dependencyIndex, value: plan.id });
        fields.push({ name: 'deliveryDependencyTextEP___' + dependencyIndex, value: self.asText(dependency) });
        dependencyIndex += 1;
      });
    });
    fields.push(
      { name: 'decisaoGoLiveTiEP', value: this.asText(decision) },
      { name: 'comentGoLiveTiEP', value: this.asText($('#ep-golive-opinion').val()) },
      { name: 'confirmaGoLiveTiEP', value: $('#ep-golive-agreement').is(':checked') ? 'true' : 'false' },
      { name: 'justifGoLiveTiEP', value: this.asText(reason) },
      { name: 'catCancelGoLiveTiEP', value: this.asText(category) },
      { name: 'anexosGoLiveTiEP', value: JSON.stringify(this.buildAttachmentMetadata(includePending)) },
      { name: 'histGoLiveTiEP', value: JSON.stringify(this.buildHistory(decision, reason, category, includePending)) }
    );
    return fields;
  },

  addClearChildTableFields: function (fields) {
    var planFields = ['deliveryPlanIdEP', 'deliveryPlanTypeEP', 'deliveryPlanTitleEP', 'deliveryPlanResponsibleEP', 'deliveryPlanExecutionDateEP', 'deliveryPlanStageEP', 'deliveryGoLiveStatusEP', 'deliveryPlanTrainingHoursEP', 'deliveryPlanDescriptionEP', 'deliveryPlanParticipantsEP', 'deliveryTrainStatusEP', 'deliveryTrainDateEP', 'deliveryTrainNotesEP', 'deliveryTrainJustifEP'];
    var dependencyFields = ['deliveryDependencyPlanIdEP', 'deliveryDependencyTextEP'];
    this.addClearFields(fields, planFields, this._state.existingPlanIndexes);
    this.addClearFields(fields, dependencyFields, this._state.existingDependencyIndexes);
  },

  addClearFields: function (fields, names, indexes) {
    (indexes || []).forEach(function (idx) { (names || []).forEach(function (name) { fields.push({ name: name + '___' + idx, value: '' }); }); });
  },

  addDocuments: function (files) {
    var self = this;
    Array.prototype.slice.call(files || []).forEach(function (file) {
      self._state.documents.push({ id: 'local:' + Date.now() + ':' + Math.random().toString(16).slice(2), file: file, name: file.name, size: file.size, persisted: false });
    });
    this.renderDocuments();
  },

  buildAttachmentMetadata: function (includePending) {
    var self = this;
    return (this._state.documents || []).map(function (doc) {
      if (!includePending && doc.file && !doc.persisted) return null;
      var fileName = self.asText(doc.file ? doc.file.name : (doc.fileName || doc.name));
      if (!fileName) return null;
      return {
        documentId: self.asText(doc.documentId),
        fileName: fileName,
        fileSize: self.asText(doc.file ? doc.file.size : (doc.fileSize || doc.size)),
        version: self.asText(doc.version),
        createdAt: self.asText(doc.createdAt),
        scope: 'go-live-ti',
        pending: !!(doc.file && !doc.persisted)
      };
    }).filter(Boolean);
  },

  buildHistory: function (decision, reason, category, appendEntry) {
    var history = this.normalizeHistory(this._state.goLiveHistory);
    if (!appendEntry || !this.asText(decision)) return history;
    history.push({
      decision: this.asText(decision),
      comment: this.asText($('#ep-golive-opinion').val()),
      description: this.asText(reason),
      category: this.asText(category),
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      createdAt: new Date().toISOString()
    });
    return history;
  },

  collectAttachmentsPayload: async function () {
    var self = this;
    var docs = (this._state.documents || []).filter(function (doc) { return doc.file && !doc.persisted; });
    return Promise.all(docs.map(async function (doc) {
      return { fileName: doc.file.name, fileContent: await self.readFileAsBase64(doc.file), fileSize: String(doc.file.size || '') };
    }));
  },

  readFileAsBase64: function (file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (event) { var raw = String(event.target.result || ''); resolve(raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw); };
      reader.onerror = function () { reject(new Error('Falha ao ler anexo')); };
      reader.readAsDataURL(file);
    });
  },

  extractDeliveryPlans: function (row) {
    var fields = ['deliveryPlanIdEP', 'deliveryPlanTypeEP', 'deliveryPlanTitleEP', 'deliveryPlanResponsibleEP', 'deliveryPlanExecutionDateEP', 'deliveryPlanStageEP', 'deliveryGoLiveStatusEP', 'deliveryPlanTrainingHoursEP', 'deliveryPlanDescriptionEP', 'deliveryPlanParticipantsEP', 'deliveryTrainStatusEP', 'deliveryTrainDateEP', 'deliveryTrainNotesEP', 'deliveryTrainJustifEP'];
    var planRows = this.extractTableRows(row, 'tblDeliveryPlanningEP', fields);
    var dependencyRows = this.extractTableRows(row, 'tblDeliveryPlanDependenciesEP', ['deliveryDependencyPlanIdEP', 'deliveryDependencyTextEP']);
    var dependencies = {};
    var trainingAttachments = {};
    var self = this;
    this._state.existingPlanIndexes = planRows.map(function (item) { return item.__rowIndex; });
    this._state.existingDependencyIndexes = dependencyRows.map(function (item) { return item.__rowIndex; });
    dependencyRows.forEach(function (item) {
      var id = self.asText(item.deliveryDependencyPlanIdEP);
      if (!dependencies[id]) dependencies[id] = [];
      if (self.asText(item.deliveryDependencyTextEP)) dependencies[id].push(self.asText(item.deliveryDependencyTextEP));
    });
    this.parsePersistedAttachments(this.getValIgnoreCase(row, 'anexosTreinamentoEP')).forEach(function (doc) {
      if (!trainingAttachments[doc.planId]) trainingAttachments[doc.planId] = [];
      trainingAttachments[doc.planId].push(doc);
    });
    return planRows.map(function (item) {
      var id = self.asText(item.deliveryPlanIdEP);
      var type = self.asText(item.deliveryPlanTypeEP) === 'treinamento' ? 'treinamento' : 'planejamento';
      return {
        id: id,
        type: type,
        title: self.asText(item.deliveryPlanTitleEP),
        responsible: self.asText(item.deliveryPlanResponsibleEP),
        executionDate: self.asText(item.deliveryPlanExecutionDateEP),
        stage: type === 'treinamento' ? '' : (self.asText(item.deliveryPlanStageEP) || 'pre-go-live'),
        goLiveStatus: type === 'treinamento' ? '' : (self.asText(item.deliveryGoLiveStatusEP) || 'planejado'),
        trainingHours: self.asText(item.deliveryPlanTrainingHoursEP),
        description: self.asText(item.deliveryPlanDescriptionEP),
        participants: self.splitParticipants(item.deliveryPlanParticipantsEP),
        trainingStatus: self.asText(item.deliveryTrainStatusEP),
        trainingDate: self.asText(item.deliveryTrainDateEP),
        trainingNotes: self.asText(item.deliveryTrainNotesEP),
        trainingJustification: self.asText(item.deliveryTrainJustifEP),
        dependencies: dependencies[id] || [],
        attachments: trainingAttachments[id] || [],
        isEditingStatus: false
      };
    }).filter(function (plan) { return plan.id || plan.title; });
  },

  extractProjectSummary: function (row) {
    return {
      code: this.firstDefinedValue([this.getValIgnoreCase(row, 'codigoglpi'), this.getValIgnoreCase(row, 'codigoprojeto'), this.getValIgnoreCase(row, 'documentid')]),
      title: this.firstDefinedValue([this.getValIgnoreCase(row, 'titulodoprojetoNS'), this.getValIgnoreCase(row, 'titulodoprojeto')]),
      requester: this.firstDefinedValue([this.getValIgnoreCase(row, 'solicitanteNomeNS'), this.getValIgnoreCase(row, 'solicitanteNome')])
    };
  },

  extractTableRows: function (row, tableName, fields) {
    var grouped = {};
    var lowerFields = fields.map(function (field) { return field.toLowerCase(); });
    Object.keys(row || {}).forEach(function (key) {
      var match = String(key).match(/^(.*)___(\d+)$/);
      if (!match || lowerFields.indexOf(match[1].toLowerCase()) === -1) return;
      if (!grouped[match[2]]) grouped[match[2]] = { __rowIndex: match[2] };
      grouped[match[2]][match[1]] = row[key];
    });
    var rows = Object.keys(grouped).sort(function (a, b) { return Number(a) - Number(b); }).map(function (key) { return grouped[key]; });
    if (rows.length) return rows;
    var parsed = this.parseJson(this.getValIgnoreCase(row, tableName));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function (item, index) { var result = { __rowIndex: String(index + 1) }; fields.forEach(function (field) { result[field] = item && item[field]; }); return result; });
  },

  parsePersistedAttachments: function (raw) {
    var parsed = this.parseJson(raw);
    var self = this;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function (doc, index) {
      return { id: self.asText(doc.documentId || doc.id || ('persisted:' + index)), documentId: self.asText(doc.documentId || doc.id), name: self.asText(doc.fileName || doc.name), fileName: self.asText(doc.fileName || doc.name), size: self.asText(doc.fileSize || doc.size), fileSize: self.asText(doc.fileSize || doc.size), version: self.asText(doc.version), createdAt: self.asText(doc.createdAt), planId: self.asText(doc.planId), scope: self.asText(doc.scope), persisted: true };
    }).filter(function (doc) { return doc.fileName; });
  },

  normalizeHistory: function (value) {
    if (!Array.isArray(value)) return [];
    var self = this;
    return value.map(function (entry) {
      return {
        decision: self.asText(entry && entry.decision),
        comment: self.asText(entry && entry.comment),
        description: self.asText(entry && (entry.description || entry.reason)),
        category: self.asText(entry && entry.category),
        userId: self.asText(entry && entry.userId),
        userName: self.asText(entry && entry.userName),
        createdAt: self.asText(entry && entry.createdAt)
      };
    }).filter(function (entry) { return entry.decision || entry.comment || entry.description; });
  },

  getHistoryWithFallback: function (row, config) {
    var history = this.normalizeHistory(this.parseJson(this.getValIgnoreCase(row, config.historyField)));
    if (history.length) return history;
    var decision = this.asText(this.getValIgnoreCase(row, config.decisionField));
    var comment = this.asText(this.getValIgnoreCase(row, config.commentField));
    var description = this.asText(this.getValIgnoreCase(row, config.descriptionField));
    var category = this.asText(this.getValIgnoreCase(row, config.categoryField));
    if (!decision && !comment && !description && !category) return [];
    return [{
      decision: decision,
      comment: comment,
      description: description,
      category: category,
      userId: '',
      userName: this.asText(config.userName) || 'Usuario',
      createdAt: ''
    }];
  },

  findPlanById: function (id) {
    for (var i = 0; i < this._state.deliveryPlans.length; i += 1) if (this.asText(this._state.deliveryPlans[i].id) === this.asText(id)) return this._state.deliveryPlans[i];
    return null;
  },

  getStageMeta: function (stage) {
    var map = {
      'pre-go-live': { label: 'Pre-Go Live', style: 'background-color:#1d4ed8;border-color:#1d4ed8', icon: 'fa-solid fa-flag-checkered text-blue-100' },
      'durante-go-live': { label: 'Durante o Go Live', style: 'background-color:#ea580c;border-color:#ea580c', icon: 'fa-solid fa-bolt text-orange-100' },
      'pos-go-live': { label: 'Pos-Go Live', style: 'background-color:#7c3aed;border-color:#7c3aed', icon: 'fa-solid fa-chart-line text-violet-100' }
    };
    return map[stage] || map['pre-go-live'];
  },

  getPlanningStatusBadge: function (status) {
    if (status === 'realizado') return '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check"></i>Planejamento Realizado</span>';
    if (status === 'nao_realizado') return '<span class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"><i class="fa-solid fa-ban"></i>Planejamento Nao Realizado</span>';
    return '<span class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><i class="fa-solid fa-calendar-check"></i>Planejado</span>';
  },

  getTrainingStatusBadge: function (status) {
    if (status === 'realizado') return '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check"></i>Realizado</span>';
    if (status === 'nao_realizado') return '<span class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"><i class="fa-solid fa-ban"></i>Nao Realizado</span>';
    return '<span class="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700"><i class="fa-solid fa-clock"></i>Pendente</span>';
  },

  getDependenciesHtml: function (items) {
    var self = this;
    return (items || []).filter(Boolean).map(function (item) { return '<div class="flex items-start gap-2 p-1 text-sm text-gray-700"><i class="fa-solid fa-triangle-exclamation mt-0.5 text-yellow-600"></i><span>' + self.escapeHtml(item) + '</span></div>'; }).join('') || '<span class="text-sm text-gray-500">Nenhuma dependencia.</span>';
  },

  getParticipantsHtml: function (items) {
    var self = this;
    return (items || []).map(function (item) { return '<span class="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">' + self.escapeHtml(item) + '</span>'; }).join('') || '<span class="text-sm text-gray-500">Nenhum participante.</span>';
  },

  openModal: function (selector) { $(selector).removeClass('hidden').addClass('flex'); },
  closeModal: function (selector) { $(selector).addClass('hidden').removeClass('flex'); },
  splitParticipants: function (value) { var self = this; return this.asText(value).split(',').map(function (item) { return self.asText(item); }).filter(Boolean); },
  parseJson: function (value) { try { return JSON.parse(this.asText(value)); } catch (ignore) { return null; } },
  getValIgnoreCase: function (obj, field) { var target = String(field).toLowerCase(); var keys = Object.keys(obj || {}); for (var i = 0; i < keys.length; i += 1) if (keys[i].toLowerCase() === target) return obj[keys[i]]; return ''; },
  firstDefinedValue: function (values) { for (var i = 0; i < values.length; i += 1) if (this.asText(values[i])) return this.asText(values[i]); return ''; },
  formatBrDate: function (value) { var text = this.asText(value); var match = text.match(/^(\d{4})-(\d{2})-(\d{2})/); return match ? match[3] + '/' + match[2] + '/' + match[1] : text; },
  formatBrDateTime: function (value) { var text = this.asText(value); var match = text.match(/^(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?/); return match ? match[3] + '/' + match[2] + '/' + match[1] + (match[4] && match[5] ? ' ' + match[4] + ':' + match[5] : '') : text; },
  formatHistoryDate: function (value) { var text = this.asText(value); if (!text) return '-'; var date = new Date(text); if (isNaN(date.getTime())) return text; return String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + date.getFullYear() + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0'); },
  formatFileSize: function (bytes) { var size = Number(bytes); if (!isFinite(size) || size <= 0) return ''; return size < 1048576 ? Math.round(size / 1024) + ' KB' : (size / 1048576).toFixed(1) + ' MB'; },
  getAttachmentIconClass: function (name) { var ext = String(name || '').split('.').pop().toLowerCase(); if (ext === 'pdf') return 'fa-file-pdf text-red-500'; if (['xls', 'xlsx'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600'; if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600'; return 'fa-file text-gray-500'; },
  getCurrentUserId: function () { if (typeof WCMAPI !== 'undefined' && WCMAPI.getUserCode) return this.asText(WCMAPI.getUserCode()); if (typeof WCMAPI !== 'undefined' && WCMAPI.user) return this.asText(WCMAPI.user); return ''; },
  getCurrentUserName: function () { if (typeof WCMAPI !== 'undefined' && WCMAPI.getUser) return this.asText(WCMAPI.getUser()); if (typeof WCMAPI !== 'undefined' && WCMAPI.userLogin) return this.asText(WCMAPI.userLogin); return 'Usuario'; },
  asText: function (value) { return value === null || value === undefined || value === 'null' ? '' : String(value).trim(); },
  escapeHtml: function (value) { return String(value === null || value === undefined ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); },

  showToast: function (title, message, type) {
    var config = { success: ['border-emerald-500', 'fa-circle-check text-emerald-600'], error: ['border-red-500', 'fa-circle-xmark text-red-600'], warning: ['border-amber-500', 'fa-triangle-exclamation text-amber-600'], info: ['border-blue-500', 'fa-circle-info text-blue-600'] };
    var selected = config[type] || config.info;
    $('#toast').attr('class', 'fixed right-4 top-24 z-[70] max-w-sm rounded-lg border-l-4 bg-white px-4 py-3 shadow-xl ' + selected[0]).removeClass('hidden');
    $('#toast-icon').attr('class', 'fa-solid ' + selected[1] + ' text-xl');
    $('#toast-title').text(title || 'Informacao');
    $('#toast-message').text(message || '');
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(function () { $('#toast').addClass('hidden'); }, 3200);
  }
};
