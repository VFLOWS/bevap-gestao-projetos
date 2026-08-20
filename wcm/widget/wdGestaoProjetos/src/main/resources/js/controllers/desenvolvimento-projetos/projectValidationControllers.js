function createProjectValidationController(config) {
  var baseController = projectExecutionController || {};
  var controller = Object.create(baseController);

  function createBaseState() {
    return {
      documentId: '',
      estadoProcesso: '',
      datasetId: 'dsGetDesenvolvimentoProjetos',
      formName: '',
      activeTab: 'phases',
      projectSummary: {},
      projectDeadline: '',
      milestoneTaskSummaryRows: [],
      milestoneTaskRowIndexById: {},
      phases: [],
      milestones: [],
      risks: [],
      raciRows: [],
      communicationPlanRows: [],
      validationComment: '',
      validationDescription: '',
      validationCategory: '',
      validationAgreement: false,
      validationChecklist: [],
      checklistVisited: false,
      validationHistory: [],
      requesterHistory: [],
      requesterComment: ''
    };
  }

  function getCurrentUserInfo() {
    return {
      userId: typeof WCMAPI !== 'undefined' ? String(WCMAPI.user || '').trim() : '',
      userName: typeof WCMAPI !== 'undefined' ? String(WCMAPI.userLogin || '').trim() : ''
    };
  }

  Object.assign(controller, {
    _eventNamespace: config.eventNamespace,
    _decisionField: config.decisionField,
    _commentField: config.commentField,
    _descriptionField: config.descriptionField,
    _categoryField: config.categoryField,
    _checklistField: config.checklistField,
    _agreementField: config.agreementField,
    _historyField: config.historyField,
    _requesterHistoryField: config.requesterHistoryField || '',
    _requesterCommentField: config.requesterCommentField || '',
    _executionCorrectionField: config.executionCorrectionField || 'execFasesAtividadesCorrecao',
    _allNextState: String(config.nextState || ''),
    _screenTitle: config.screenTitle,
    _headerTitle: config.headerTitle,
    _breadcrumb: config.breadcrumb || [],
    _templatePath: config.templatePath,
    _activeStageText: config.activeStageText,
    _macroProgressCurrentLabel: config.macroProgressCurrentLabel,
    _progressItems: config.progressItems || [],
    _extraTabs: config.extraTabs || [],
    _historyTitle: config.historyTitle || '',
    _historyEmptyText: config.historyEmptyText || 'Nenhum histórico disponível.',
    _checklistItems: config.checklistItems || [],
    _state: createBaseState(),
    _collapsedPhases: {},
    _collapsedMilestones: {},

    load: async function (params) {
      params = params || {};
      this._state = createBaseState();
      this._collapsedPhases = {};
      this._collapsedMilestones = {};
      this._state.documentId = this.asText(params.documentId);
      this._state.estadoProcesso = this.asText(params.estadoProcesso);
      this._state.datasetId = this.asText(params.datasetId) || 'dsGetDesenvolvimentoProjetos';
      this._state.formName = this.asText(params.formName);
      this._state.activeTab = 'phases';

      try {
        var html = await $.get(this.getTemplateUrl());
        $('#page-container').html(html);
        this.backupAndSetHeader();
        this.bindEvents();
        await this.loadProjectData();
        this.applyDefaultCollapseState();
        this.renderExecutionBoard();
        this.updateProjectSummary();
        this.renderMacroProgress();
        this.renderValidationPanels();
        this.toggleTab(this._state.activeTab);
        this.updateTabArrows();
        var self = this;
        window.requestAnimationFrame(function () {
          self.updateTabArrows();
        });
        window.setTimeout(function () {
          self.updateTabArrows();
        }, 180);
      } catch (error) {
        console.error('Project validation template load error:', error);
        $('#page-container').html('<div class="p-6 text-red-600">Falha ao carregar a tela de validação do projeto.</div>');
      }
    },

    getTemplateUrl: function () {
      return WCMAPI.getServerURL() + this._templatePath;
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

      if (titleEl.length) titleEl.text(this._headerTitle);
      if (breadcrumbEl.length) {
        var items = this._breadcrumb.map(function (item) {
          return '<span class="text-gray-400">/</span><span class="text-gray-300">' + item + '</span>';
        }).join('');
        breadcrumbEl.html(
          '<a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"><i class="fa-solid fa-house text-xs"></i><span>Inicio</span></a>' +
          items +
          '<span class="text-gray-400">/</span><span class="text-bevap-gold font-medium">' + this._screenTitle + '</span>'
        );
      }
    },

    processData: function (row) {
      baseController.processData.call(this, row);
      this._state.validationComment = this.asText(this.getValIgnoreCase(row, this._commentField));
      this._state.validationDescription = this.asText(this.getValIgnoreCase(row, this._descriptionField));
      this._state.validationCategory = this.asText(this.getValIgnoreCase(row, this._categoryField));
      this._state.validationAgreement = this.normalizeBoolean(this.getValIgnoreCase(row, this._agreementField));
      this._state.validationChecklist = this.parseChecklistState(this.getValIgnoreCase(row, this._checklistField), this._checklistItems.length);
      this._state.validationHistory = this.parseJson(this.getValIgnoreCase(row, this._historyField)) || [];
      this._state.requesterHistory = this._requesterHistoryField ? (this.parseJson(this.getValIgnoreCase(row, this._requesterHistoryField)) || []) : [];
      this._state.requesterComment = this._requesterCommentField ? this.asText(this.getValIgnoreCase(row, this._requesterCommentField)) : '';
    },

    bindEvents: function () {
      var self = this;
      var container = $('#page-container');
      container.off(this._eventNamespace);

      ['phases', 'milestones', 'risks', 'raci'].concat(this._extraTabs).forEach(function (tab) {
        container.on('click' + self._eventNamespace, '#tab-execution-' + tab, function () {
          self.toggleTab(tab);
        });
      });

      container.on('scroll' + this._eventNamespace, '#execution-tabs-scroll', function () {
        self.updateTabArrows();
      });
      container.on('click' + this._eventNamespace, '#execution-tabs-left-arrow', function () {
        self.scrollTabsToStart();
      });
      container.on('click' + this._eventNamespace, '#execution-tabs-right-arrow', function () {
        self.scrollTabsToEnd();
      });
      container.on('click' + this._eventNamespace, '[data-phase-toggle]', function () {
        self.togglePhaseCollapse($(this).attr('data-phase-toggle'));
      });
      container.on('click' + this._eventNamespace, '[data-milestone-toggle]', function () {
        self.toggleMilestoneCollapse($(this).attr('data-milestone-toggle'));
      });
      container.on('change' + this._eventNamespace, '.validation-checklist-item', function () {
        self.updateChecklistProgress();
      });
      container.on('click' + this._eventNamespace, '[data-action="open-non-continuity-modal"]', function () {
        self.openModal('modal-non-continuity');
      });
      container.on('click' + this._eventNamespace, '[data-action="open-correction-modal"]', function () {
        self.openModal('modal-correction');
      });
      container.on('click' + this._eventNamespace, '[data-action="open-approve-modal"]', function () {
        self.openModal('modal-approve');
      });
      container.on('click' + this._eventNamespace, '[data-action="close-modal"]', function () {
        self.closeModal($(this).attr('data-modal-id'));
      });
      container.on('click' + this._eventNamespace, '#modal-non-continuity, #modal-correction, #modal-approve', function (event) {
        if (event.target && event.target.id === event.currentTarget.id) {
          self.closeModal(event.currentTarget.id);
        }
      });
      container.on('click' + this._eventNamespace, '[data-action="confirm-non-continuity"]', function () {
        self.confirmDecision({
          modalId: 'modal-non-continuity',
          decisionValue: 'cancelar',
          descriptionSelector: '#decision-description-input',
          categorySelector: '#decision-category-input',
          successMessage: 'Não continuidade registrada com sucesso.',
          comments: 'Validação do projeto encerrada via Widget'
        });
      });
      container.on('click' + this._eventNamespace, '[data-action="confirm-correction"]', function () {
        self.confirmDecision({
          modalId: 'modal-correction',
          decisionValue: 'correcao',
          descriptionSelector: '#correction-description-input',
          successMessage: 'Novo planejamento solicitado com sucesso.',
          comments: 'Projeto devolvido para correção via Widget'
        });
      });
      container.on('click' + this._eventNamespace, '[data-action="confirm-approve"]', function () {
        self.confirmDecision({
          modalId: 'modal-approve',
          decisionValue: 'aprovado',
          successMessage: 'Validação registrada com sucesso.',
          comments: 'Projeto validado via Widget'
        });
      });
    },

    renderExecutionBoard: function () {
      this.renderPhasesPanel();
      this.renderMilestonesPanel();
      this.renderRisksPanel();
      this.renderRaciPanel();
    },

    renderValidationPanels: function () {
      $('#validation-feedback-text').val(this._state.validationComment || '');
      $('#validation-agreement-checkbox').prop('checked', !!this._state.validationAgreement);
      this.renderChecklistState();
      this.renderRequesterHistory();
      this.updateChecklistProgress();
    },

    renderRequesterHistory: function () {
      var list = $('#requester-history-list');
      if (!list.length) return;

      var history = Array.isArray(this._state.requesterHistory) ? this._state.requesterHistory : [];
      if (!history.length) {
        list.html('<div class="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">' + this.escapeHtml(this._historyEmptyText) + '</div>');
      } else {
        list.html(history.slice().reverse().map(this.getHistoryCardHtml.bind(this)).join(''));
      }

      $('#requester-comment-display').text(this._state.requesterComment || 'Nenhum comentário do solicitante registrado.');
    },

    getHistoryCardHtml: function (entry) {
      var decision = this.asText(entry && entry.decision);
      var decisionLabel = decision === 'aprovado' ? 'Aprovado' : decision === 'correcao' ? 'Novo planejamento solicitado' : decision === 'cancelar' ? 'Não continuidade' : 'Registro';
      if (decision === 'correcao') {
        decisionLabel = 'Novo planejamento solicitado';
      }
      var badgeClass = decision === 'aprovado'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : decision === 'correcao'
          ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
          : 'border-red-200 bg-red-50 text-red-700';
      var userName = this.asText(entry && entry.userName) || 'Usuário';
      var initials = userName.split(/\s+/).map(function (part) { return part.charAt(0); }).join('').slice(0, 2).toUpperCase() || 'US';
      var description = this.asText(entry && entry.description);
      var comment = this.asText(entry && entry.comment);
      var category = this.asText(entry && entry.category);
      var dateLabel = this.formatHistoryDate(entry && entry.createdAt);
      var summary = comment || description || 'Sem observações registradas.';
      var extra = category ? '<div class="mt-2 text-xs text-gray-500">Categoria: ' + this.escapeHtml(category) + '</div>' : '';

      return [
        '<div class="rounded-xl border border-gray-200 bg-slate-50 p-4">',
        '  <div class="flex items-start justify-between gap-3">',
        '    <div class="flex items-center gap-3">',
        '      <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bevap-navy text-sm font-semibold text-white">' + this.escapeHtml(initials) + '</span>',
        '      <div><div class="font-semibold leading-5 text-bevap-navy">' + this.escapeHtml(userName) + '</div><div class="mt-1 text-xs text-gray-500">' + this.escapeHtml(decisionLabel) + '</div></div>',
        '    </div>',
        '    <div class="flex items-center gap-2"><span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ' + badgeClass + '">' + this.escapeHtml(decisionLabel) + '</span><div class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500">' + this.escapeHtml(dateLabel) + '</div></div>',
        '  </div>',
        '  <p class="mt-2 text-sm text-gray-700">' + this.escapeHtml(summary) + '</p>',
        extra,
        '</div>'
      ].join('');
    },

    renderChecklistState: function () {
      var savedItems = Array.isArray(this._state.validationChecklist) ? this._state.validationChecklist : [];
      $('.validation-checklist-item').each(function (index, checkbox) {
        checkbox.checked = !!savedItems[index];
      });
    },

    updateChecklistProgress: function () {
      var checkboxes = $('.validation-checklist-item');
      var total = checkboxes.length;
      var checked = checkboxes.filter(':checked').length;
      var percent = total ? Math.round((checked / total) * 100) : 0;
      $('#validation-checklist-percentage').text(percent + '%');
      $('#validation-checklist-progress').css('width', percent + '%');
      $('#execution-checklist-notice').toggleClass('hidden', this._state.checklistVisited || percent === 100 || total === 0);
    },

    applyDefaultCollapseState: function () {
      var self = this;
      (this._state.phases || []).forEach(function (phase) {
        self._collapsedPhases[phase.key] = true;
      });
      (this._state.milestones || []).forEach(function (milestone, index) {
        self._collapsedMilestones[milestone.id || String(index)] = true;
      });
    },

    toggleTab: function (tabName) {
      var availableTabs = ['phases', 'milestones', 'risks', 'raci'].concat(this._extraTabs);
      this._state.activeTab = this.asText(tabName) || 'phases';
      if (this._state.activeTab === 'checklist') {
        this._state.checklistVisited = true;
      }
      availableTabs.forEach(function (tab) {
        var active = tab === tabName;
        $('#tab-execution-' + tab)
          .toggleClass('border-bevap-green bg-green-50 text-bevap-green', active)
          .toggleClass('border-transparent text-gray-500 hover:text-gray-700', !active);
        $('#tab-content-execution-' + tab).toggleClass('hidden', !active);
      });
      this.updateChecklistProgress();
      this.updateTabArrows();
    },

    updateProjectSummary: function () {
      baseController.updateProjectSummary.call(this);
      $('#project-state').text(this._activeStageText);
    },

    renderMacroProgress: function () {
      $('#macro-progress-list').html([
        '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Solicitação aprovada</span></div>',
        '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Análise TI concluída</span></div>',
        '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Planejamento do projeto concluído</span></div>',
        '<div class="flex items-center text-bevap-gold"><i class="fa-solid fa-clock mr-2"></i><span>' + this.escapeHtml(this._macroProgressCurrentLabel) + '</span></div>'
      ].join(''));
    },

    openModal: function (modalId) {
      if (!modalId) return;
      $('#' + modalId).removeClass('hidden');
    },

    renderMacroProgress: function () {
      var items = Array.isArray(this._progressItems) ? this._progressItems : [];
      $('#macro-progress-list').html(items.map(function (item) {
        var tone = item && item.tone ? item.tone : 'gray';
        var icon = item && item.icon ? item.icon : 'fa-regular fa-circle';
        var text = item && item.text ? item.text : '';
        var toneClass = tone === 'green'
          ? 'text-green-600'
          : tone === 'amber'
            ? 'text-amber-600'
            : tone === 'indigo'
              ? 'text-indigo-600'
              : 'text-gray-400';
        return '<div class="flex items-center ' + toneClass + '"><i class="' + icon + ' mr-2"></i><span>' + this.escapeHtml(text) + '</span></div>';
      }.bind(this)).join(''));
    },

    closeModal: function (modalId) {
      if (!modalId) return;
      $('#' + modalId).addClass('hidden');
    },

    confirmDecision: async function (config) {
      if (!this.isAgreementChecked()) {
        this.showToast('Marque "Li e concordo" para continuar.', 'error');
        $('#validation-agreement-checkbox').trigger('focus');
        return;
      }

      var description = this.asText($(config.descriptionSelector || '').val());
      var category = this.asText($(config.categorySelector || '').val());
      if (config.descriptionSelector && !description) {
        this.showToast('Preencha a descrição antes de continuar.', 'error');
        $(config.descriptionSelector).trigger('focus');
        return;
      }
      if (config.categorySelector && !category) {
        this.showToast('Selecione a categoria antes de continuar.', 'error');
        $(config.categorySelector).trigger('focus');
        return;
      }

      if (config.decisionValue === 'correcao') {
        config.successMessage = 'Novo planejamento solicitado com sucesso.';
        config.comments = 'Projeto devolvido para novo planejamento via Widget';
      }

      this.closeModal(config.modalId);
      try {
        await this.submitValidationDecision({
          decisionValue: config.decisionValue,
          descriptionValue: description,
          categoryValue: category,
          nextState: this._allNextState,
          successMessage: config.successMessage,
          comments: config.comments
        });
        if (config.descriptionSelector) $(config.descriptionSelector).val('');
        if (config.categorySelector) $(config.categorySelector).val('');
      } catch (error) {
        console.error('confirmDecision error:', error);
        this.showToast(this.asText(error && error.message) || 'Não foi possível concluir a validação.', 'error');
      }
    },

    submitValidationDecision: async function (config) {
      var documentId = this.asText(this._state.documentId);
      if (!documentId) {
        throw new Error('documentId não informado.');
      }

      var processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(documentId);
      var taskFields = this.collectValidationTaskFields(config);
      var legacyLoading = typeof FLUIGC !== 'undefined' ? FLUIGC.loading($('#page-container')) : null;
      if (legacyLoading) legacyLoading.show();

      try {
        await fluigService.saveAndSendTask({
          id: processInstanceId,
          numState: this.asText(config && config.nextState),
          documentId: documentId,
          datasetName: this.asText(this._state.formName) || 'DSFormDesenvolvimentoProjetos_1778522207146',
          comments: this.asText(config && config.comments) || ''
        }, taskFields);

        this.showToast(this.asText(config && config.successMessage) || 'Movimentação realizada com sucesso.', 'success');
        setTimeout(function () {
          location.hash = '#dashboard';
        }, 800);
      } finally {
        if (legacyLoading) legacyLoading.hide();
      }
    },

    collectValidationTaskFields: function (config) {
      var comment = this.asText($('#validation-feedback-text').val());
      var checklist = this.collectChecklistState();
      var decision = this.asText(config && config.decisionValue);
      var history = this.appendHistoryEntry(this._state.validationHistory, {
        decision: decision,
        comment: comment,
        description: this.asText(config && config.descriptionValue),
        category: this.asText(config && config.categoryValue)
      });

      return [
        { name: this._decisionField, value: decision },
        { name: this._commentField, value: comment },
        { name: this._descriptionField, value: this.asText(config && config.descriptionValue) },
        { name: this._categoryField, value: this.asText(config && config.categoryValue) },
        { name: this._agreementField, value: checklist.agreement ? 'true' : 'false' },
        { name: this._checklistField, value: JSON.stringify(checklist) },
        { name: this._historyField, value: JSON.stringify(history) },
        { name: this._executionCorrectionField, value: decision === 'correcao' ? 'true' : 'false' }
      ];
    },

    collectChecklistState: function () {
      return {
        agreement: this.isAgreementChecked(),
        items: $('.validation-checklist-item').map(function (_, checkbox) {
          return !!checkbox.checked;
        }).get()
      };
    },

    parseChecklistState: function (value, expectedCount) {
      var parsed = this.parseJson(value);
      var items = parsed && Array.isArray(parsed.items) ? parsed.items : [];
      while (items.length < expectedCount) items.push(false);
      return items.slice(0, expectedCount);
    },

    appendHistoryEntry: function (history, data) {
      var items = Array.isArray(history) ? history.slice() : [];
      var userInfo = getCurrentUserInfo();
      items.push({
        decision: this.asText(data && data.decision),
        comment: this.asText(data && data.comment),
        description: this.asText(data && data.description),
        category: this.asText(data && data.category),
        userId: userInfo.userId,
        userName: userInfo.userName,
        createdAt: new Date().toISOString()
      });
      return items;
    },

    isAgreementChecked: function () {
      return $('#validation-agreement-checkbox').is(':checked');
    },

    normalizeBoolean: function (value) {
      var normalized = this.normalizeText(value);
      return normalized === 'true' || normalized === '1' || normalized === 'sim' || normalized === 'yes';
    },

    formatHistoryDate: function (value) {
      var text = this.asText(value);
      if (!text) return '-';
      var date = new Date(text);
      if (isNaN(date.getTime())) return text;
      var day = String(date.getDate()).padStart(2, '0');
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var year = String(date.getFullYear());
      var hours = String(date.getHours()).padStart(2, '0');
      var minutes = String(date.getMinutes()).padStart(2, '0');
      return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
    }
  });

  return controller;
}

var projectRequesterValidationController = createProjectValidationController({
  eventNamespace: '.projectRequesterValidation',
  decisionField: 'ValidacaoSolicitanteDecisao',
  commentField: 'valSolicComentarioDP',
  descriptionField: 'valSolicDescricaoDP',
  categoryField: 'valSolicCategoriaDP',
  checklistField: 'valSolicChecklistDP',
  agreementField: 'valSolicLiConcordoDP',
  historyField: 'valSolicHistJsonDP',
  nextState: '25',
  screenTitle: 'Validação do Solicitante',
  headerTitle: 'Desenvolvimento - Validação do Solicitante',
  breadcrumb: ['Desenvolvimento'],
  templatePath: '/wdGestaoProjetos/resources/js/templates/desenvolvimento-projetos/dp-project-requester-validation.html',
  activeStageText: 'Validação do Solicitante',
  macroProgressCurrentLabel: 'Validação do solicitante em andamento',
  progressItems: [
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Solicitação aprovada' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Análise TI concluída' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Planejamento do projeto concluído' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Execução do projeto concluída' },
    { tone: 'amber', icon: 'fa-solid fa-user-check', text: 'Validação do solicitante em andamento' },
    { tone: 'gray', icon: 'fa-regular fa-circle', text: 'Validação do TI' }
  ],
  extraTabs: ['checklist'],
  checklistItems: [
    'Os marcos executados atendem ao planejamento aprovado',
    'As tarefas vinculadas aos marcos possuem evidências suficientes',
    'Os riscos e status refletem o momento real do projeto',
    'O projeto está pronto para seguir para a validação técnica'
  ]
});

var projectTiValidationController = createProjectValidationController({
  eventNamespace: '.projectTiValidation',
  decisionField: 'ValidacaoTIDecisao',
  commentField: 'valTIComentarioDP',
  descriptionField: 'valTIDescricaoDP',
  categoryField: 'valTICategoriaDP',
  checklistField: 'valTIChecklistDP',
  agreementField: 'valTILiConcordoDP',
  historyField: 'valTIHistJsonDP',
  requesterHistoryField: 'valSolicHistJsonDP',
  requesterCommentField: 'valSolicComentarioDP',
  nextState: '34',
  screenTitle: 'Validação TI',
  headerTitle: 'Desenvolvimento - Validação TI',
  breadcrumb: ['Desenvolvimento'],
  templatePath: '/wdGestaoProjetos/resources/js/templates/desenvolvimento-projetos/dp-project-ti-validation.html',
  activeStageText: 'Validação TI',
  macroProgressCurrentLabel: 'Validação TI em andamento',
  progressItems: [
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Solicitação aprovada' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Análise TI concluída' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Planejamento do projeto concluído' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Execução do projeto concluída' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Validação do solicitante concluída' },
    { tone: 'indigo', icon: 'fa-solid fa-shield-halved', text: 'Validação do TI em andamento' }
  ],
  extraTabs: ['requester', 'checklist'],
  historyTitle: 'Validação do Solicitante',
  historyEmptyText: 'Nenhum histórico do solicitante registrado.',
  checklistItems: [
    'As entregas técnicas do projeto estão aderentes ao escopo aprovado',
    'Evidências, riscos e documentação suportam a validação técnica',
    'Checklist técnico, segurança e pendências estão concluídos',
    'O projeto está apto para conclusão no fluxo técnico'
  ]
});
