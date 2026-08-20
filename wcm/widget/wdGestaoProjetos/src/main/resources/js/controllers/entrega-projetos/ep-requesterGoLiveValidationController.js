const epRequesterGoLiveValidationController = {
  _eventNamespace: '.epRequesterGoLiveValidation',
  _datasetId: 'dsGetEntregaProjetos',
  _formDatasetName: 'DSFormEntregaProjetos',
  _nextState: '44',
  _toastTimer: null,
  _headerBackup: null,
  _state: {
    documentId: '',
    processInstanceId: '',
    projectSummary: {},
    documents: [],
    finalHistory: [],
    goLiveHistory: [],
    requesterHistory: [],
    currentTab: 'overview',
    isSubmitting: false
  },

  load: async function (params) {
    params = params || {};
    this._state.documentId = this.asText(params.documentId);
    this._state.processInstanceId = this.asText(params.processInstanceId);
    this._state.projectSummary = {};
    this._state.documents = [];
    this._state.finalHistory = [];
    this._state.goLiveHistory = [];
    this._state.requesterHistory = [];
    this._state.currentTab = 'overview';
    this._state.isSubmitting = false;

    try {
      var html = await $.get(this.getTemplateUrl());
      $('#page-container').html(html);
      this.backupAndSetHeader();
      this.bindEvents();
      await this.loadData();
      this.renderAll();
    } catch (error) {
      console.error('[epRequesterGoLiveValidation] load error:', error);
      $('#page-container').html('<div class="p-6 text-red-600">Falha ao carregar a validacao do GO Live pelo solicitante.</div>');
    }
  },

  destroy: function () {
    $('#page-container').off(this._eventNamespace);
    this.restoreHeader();
    if (this._toastTimer) clearTimeout(this._toastTimer);
  },

  getTemplateUrl: function () {
    return WCMAPI.getServerURL() + '/wdGestaoProjetos/resources/js/templates/entrega-projetos/ep-requester-go-live-validation.html';
  },

  backupAndSetHeader: function () {
    var header = $('#header');
    if (!header.length) return;
    var title = header.find('h1').first();
    var breadcrumb = header.find('nav').first();
    if (!this._headerBackup) this._headerBackup = { title: title.text(), breadcrumbHtml: breadcrumb.html() };
    title.text('Solicitante - Validar GO Live em Producao');
    breadcrumb.html([
      '<a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white"><i class="fa-solid fa-house text-xs"></i><span>Inicio</span></a>',
      '<span class="text-gray-400">/</span><span class="text-gray-300">Entrega</span>',
      '<span class="text-gray-400">/</span><span class="font-medium text-bevap-gold">Validar GO Live</span>'
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

    container.on('click' + this._eventNamespace, '#ep-solic-overview-tab', function () { self.setTab('overview'); });
    container.on('click' + this._eventNamespace, '#ep-solic-final-history-tab', function () { self.setTab('final-history'); });
    container.on('click' + this._eventNamespace, '#ep-solic-ti-history-tab', function () { self.setTab('ti-history'); });
    container.on('click' + this._eventNamespace, '#ep-solic-documents-tab, [data-action="open-solic-documents"]', function () { self.setTab('documents'); });
    container.on('change' + this._eventNamespace, '#ep-solic-documents-input', function () { self.addDocuments(this.files); this.value = ''; });
    container.on('dragover' + this._eventNamespace, '#ep-solic-documents-dropzone', function (event) {
      event.preventDefault();
      $(this).addClass('border-bevap-green bg-green-50');
    });
    container.on('dragleave' + this._eventNamespace + ' drop' + this._eventNamespace, '#ep-solic-documents-dropzone', function (event) {
      event.preventDefault();
      $(this).removeClass('border-bevap-green bg-green-50');
      if (event.type === 'drop') self.addDocuments(event.originalEvent.dataTransfer.files);
    });
    container.on('click' + this._eventNamespace, '[data-action="remove-solic-document"]', function () {
      self._state.documents.splice(parseInt($(this).attr('data-document-index'), 10), 1);
      self.renderDocuments();
    });
    container.on('click' + this._eventNamespace, '[data-action="save-solic-draft"]', function () { self.saveDraft(); });
    container.on('click' + this._eventNamespace, '[data-action="open-solic-return"]', function () { self.openModal('#ep-solic-return-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="close-solic-return"]', function () { self.closeModal('#ep-solic-return-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="confirm-solic-return"]', function () { self.confirmReturn(); });
    container.on('click' + this._eventNamespace, '[data-action="open-solic-cancel"]', function () { self.openModal('#ep-solic-cancel-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="close-solic-cancel"]', function () { self.closeModal('#ep-solic-cancel-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="confirm-solic-cancel"]', function () { self.confirmCancel(); });
    container.on('click' + this._eventNamespace, '[data-action="open-solic-approve"]', function () { self.openApproveModal(); });
    container.on('click' + this._eventNamespace, '[data-action="close-solic-approve"]', function () { self.closeModal('#ep-solic-approve-modal'); });
    container.on('click' + this._eventNamespace, '[data-action="confirm-solic-approve"]', function () { self.submitDecision('aprovado', '', '', 'Validacao do solicitante concluida via Widget'); });
  },

  loadData: async function () {
    var rows = await fluigService.getDatasetRows(this._datasetId, { filters: { documentid: this._state.documentId } });
    var row = rows && rows.length ? rows[0] : null;
    if (!row) return;
    this._state.projectSummary = this.extractProjectSummary(row);
    this._state.documents = this.parsePersistedAttachments(this.getValIgnoreCase(row, 'anexosSolicGoLiveEP'));
    this._state.finalHistory = this.getHistoryWithFallback(row, {
      historyField: 'histValFinalEP',
      decisionField: 'decisaoValFinalEP',
      commentField: 'comentValFinalEP',
      descriptionField: 'justifValFinalEP',
      categoryField: 'categoriaCancelValFinalEP',
      userName: 'TI'
    });
    this._state.goLiveHistory = this.getHistoryWithFallback(row, {
      historyField: 'histGoLiveTiEP',
      decisionField: 'decisaoGoLiveTiEP',
      commentField: 'comentGoLiveTiEP',
      descriptionField: 'justifGoLiveTiEP',
      categoryField: 'catCancelGoLiveTiEP',
      userName: 'TI'
    });
    this._state.requesterHistory = this.getHistoryWithFallback(row, {
      historyField: 'histSolicGoLiveEP',
      decisionField: 'decisaoSolicGoLiveEP',
      commentField: 'comentSolicGoLiveEP',
      descriptionField: 'justifSolicGoLiveEP',
      categoryField: 'catCancelSolicGoLiveEP',
      userName: 'Solicitante'
    });
    $('#ep-solic-opinion').val(this.asText(this.getValIgnoreCase(row, 'comentSolicGoLiveEP')));
    $('#ep-solic-agreement').prop('checked', this.asText(this.getValIgnoreCase(row, 'confirmaSolicGoLiveEP')) === 'true');
  },

  renderAll: function () {
    this.renderProjectSummary();
    this.renderProgress();
    this.renderHistoryTabs();
    this.renderDocuments();
    this.updateTabs();
  },

  renderProjectSummary: function () {
    var summary = this._state.projectSummary || {};
    $('#ep-solic-project-code').text(summary.code || '-');
    $('#ep-solic-project-title').text(summary.title || '-');
    $('#ep-solic-project-requester').text(summary.requester || '-');
    $('#ep-solic-approve-message').html('Voce esta confirmando a validacao do GO Live em producao para o projeto <strong>' + this.escapeHtml((summary.code || '-') + ' - ' + (summary.title || '-')) + '</strong>.');
  },

  renderProgress: function () {
    $('#ep-solic-progress-list').html([
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Execucao do projeto concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Validacao do solicitante concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Validacao do TI concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Planejamento GO Live concluido</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Treinamento dos usuarios concluido</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Validação Final TI concluida</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>TI - Realizar GO Live concluido</span></div>',
      '<div class="flex items-center text-bevap-gold"><i class="fa-solid fa-clock mr-2"></i><span>Solicitante - Validar GO Live em Producao</span></div>'
    ].join(''));
  },

  renderHistoryTabs: function () {
    $('#ep-solic-final-history-list').html(this.getHistoryListHtml(this._state.finalHistory, 'Validado'));
    $('#ep-solic-ti-history-list').html(this.getHistoryListHtml(this._state.goLiveHistory, 'Concluido'));
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
    $('#ep-solic-documents-list').html(this.getDocumentsHtml());
  },

  getDocumentsHtml: function () {
    var self = this;
    return (this._state.documents || []).map(function (doc, index) {
      var remove = doc.persisted ? '<i class="fa-solid fa-lock text-gray-300"></i>' : '<button type="button" data-action="remove-solic-document" data-document-index="' + index + '" class="text-gray-400 hover:text-red-500" title="Remover"><i class="fa-solid fa-trash"></i></button>';
      return self.getDocumentHtml(doc, remove);
    }).join('') || this.getEmptyDocumentsHtml();
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
    this._state.currentTab = ['final-history', 'ti-history', 'documents'].indexOf(tab) >= 0 ? tab : 'overview';
    this.updateTabs();
  },

  updateTabs: function () {
    var current = this._state.currentTab;
    var tabs = [
      { name: 'overview', tab: '#ep-solic-overview-tab', content: '#ep-solic-overview-content' },
      { name: 'final-history', tab: '#ep-solic-final-history-tab', content: '#ep-solic-final-history-content' },
      { name: 'ti-history', tab: '#ep-solic-ti-history-tab', content: '#ep-solic-ti-history-content' },
      { name: 'documents', tab: '#ep-solic-documents-tab', content: '#ep-solic-documents-content' }
    ];
    tabs.forEach(function (item) {
      var active = item.name === current;
      $(item.tab).attr('class', active ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green' : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700');
      $(item.content).toggleClass('hidden', !active);
    });
  },

  openApproveModal: function () {
    var validation = this.validateRequiredConfirmation();
    if (!validation.valid) return this.showToast('Validação Pendente', validation.message, 'warning');
    this.openModal('#ep-solic-approve-modal');
  },

  confirmReturn: function () {
    var required = this.validateRequiredConfirmation();
    if (!required.valid) return this.showToast('Validação Pendente', required.message, 'warning');
    var reason = this.asText($('#ep-solic-return-reason').val());
    if (!reason) return this.showToast('Informe o motivo', 'Descreva o motivo do novo planejamento.', 'warning');
    this.closeModal('#ep-solic-return-modal');
    this.submitDecision('correcao', reason, '', 'Solicitante devolveu GO Live para novo planejamento via Widget');
  },

  confirmCancel: function () {
    var required = this.validateRequiredConfirmation();
    if (!required.valid) return this.showToast('Validação Pendente', required.message, 'warning');
    var category = this.asText($('#ep-solic-cancel-category').val());
    var reason = this.asText($('#ep-solic-cancel-reason').val());
    if (!category) return this.showToast('Informe a categoria', 'Selecione a categoria da nao continuidade.', 'warning');
    if (!reason) return this.showToast('Informe o motivo', 'Descreva o motivo da nao continuidade.', 'warning');
    this.closeModal('#ep-solic-cancel-modal');
    this.submitDecision('cancelado', reason, category, 'Nao continuidade registrada pelo solicitante via Widget');
  },

  validateRequiredConfirmation: function () {
    if (!this.asText($('#ep-solic-opinion').val())) return { valid: false, message: 'Informe o comentario final do solicitante.' };
    if (!$('#ep-solic-agreement').is(':checked')) return { valid: false, message: 'Marque a confirmacao da validacao do GO Live.' };
    return { valid: true, message: '' };
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;
    try {
      await fluigService.saveDraft({ mode: 'updateCardDraft', documentId: this._state.documentId, taskFields: this.collectTaskFields('', '', '', false) });
      try { sessionStorage.setItem('gpDashboardFeedback', JSON.stringify({ title: 'Rascunho salvo', message: 'A validacao do GO Live foi salva com sucesso.', type: 'success' })); } catch (ignore) {}
      location.hash = '#dashboard';
    } catch (error) {
      console.error('[epRequesterGoLiveValidation] saveDraft error:', error);
      this.showToast('Erro ao salvar', this.asText(error && error.message) || 'Nao foi possivel salvar o rascunho.', 'error');
    }
  },

  submitDecision: async function (decision, reason, category, comments) {
    if (this._state.isSubmitting) return;
    var required = this.validateRequiredConfirmation();
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
      this.showToast('Sucesso', 'Validacao registrada com sucesso.', 'success');
      setTimeout(function () { location.hash = '#dashboard'; }, 800);
    } catch (error) {
      console.error('[epRequesterGoLiveValidation] submitDecision error:', error);
      this.showToast('Erro ao enviar', this.asText(error && error.message) || 'Nao foi possivel movimentar o processo.', 'error');
    } finally {
      this._state.isSubmitting = false;
      if (loading) loading.hide();
    }
  },

  collectTaskFields: function (decision, reason, category, includePending) {
    return [
      { name: 'decisaoSolicGoLiveEP', value: this.asText(decision) },
      { name: 'comentSolicGoLiveEP', value: this.asText($('#ep-solic-opinion').val()) },
      { name: 'confirmaSolicGoLiveEP', value: $('#ep-solic-agreement').is(':checked') ? 'true' : 'false' },
      { name: 'justifSolicGoLiveEP', value: this.asText(reason) },
      { name: 'catCancelSolicGoLiveEP', value: this.asText(category) },
      { name: 'anexosSolicGoLiveEP', value: JSON.stringify(this.buildAttachmentMetadata(includePending)) },
      { name: 'histSolicGoLiveEP', value: JSON.stringify(this.buildHistory(decision, reason, category, includePending)) }
    ];
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
        scope: 'solic-go-live',
        pending: !!(doc.file && !doc.persisted)
      };
    }).filter(Boolean);
  },

  buildHistory: function (decision, reason, category, appendEntry) {
    var history = this.normalizeHistory(this._state.requesterHistory);
    if (!appendEntry || !this.asText(decision)) return history;
    history.push({
      decision: this.asText(decision),
      comment: this.asText($('#ep-solic-opinion').val()),
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

  extractProjectSummary: function (row) {
    return {
      code: this.firstDefinedValue([this.getValIgnoreCase(row, 'codigoglpi'), this.getValIgnoreCase(row, 'codigoprojeto'), this.getValIgnoreCase(row, 'documentid')]),
      title: this.firstDefinedValue([this.getValIgnoreCase(row, 'titulodoprojetoNS'), this.getValIgnoreCase(row, 'titulodoprojeto')]),
      requester: this.firstDefinedValue([this.getValIgnoreCase(row, 'solicitanteNomeNS'), this.getValIgnoreCase(row, 'solicitanteNome')])
    };
  },

  parsePersistedAttachments: function (raw) {
    var parsed = this.parseJson(raw);
    var self = this;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function (doc, index) {
      return { id: self.asText(doc.documentId || doc.id || ('persisted:' + index)), documentId: self.asText(doc.documentId || doc.id), name: self.asText(doc.fileName || doc.name), fileName: self.asText(doc.fileName || doc.name), size: self.asText(doc.fileSize || doc.size), fileSize: self.asText(doc.fileSize || doc.size), version: self.asText(doc.version), createdAt: self.asText(doc.createdAt), scope: self.asText(doc.scope), persisted: true };
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

  openModal: function (selector) { $(selector).removeClass('hidden').addClass('flex'); },
  closeModal: function (selector) { $(selector).addClass('hidden').removeClass('flex'); },
  parseJson: function (value) { try { return JSON.parse(this.asText(value)); } catch (ignore) { return null; } },
  getValIgnoreCase: function (obj, field) { var target = String(field).toLowerCase(); var keys = Object.keys(obj || {}); for (var i = 0; i < keys.length; i += 1) if (keys[i].toLowerCase() === target) return obj[keys[i]]; return ''; },
  firstDefinedValue: function (values) { for (var i = 0; i < values.length; i += 1) if (this.asText(values[i])) return this.asText(values[i]); return ''; },
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
