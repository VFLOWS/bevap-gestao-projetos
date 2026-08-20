var projectFinalController = Object.create(projectTiValidationController || {});

Object.assign(projectFinalController, {
  _eventNamespace: '.projectFinal',
  _screenTitle: 'Execucao de Projeto Finalizada',
  _headerTitle: 'Desenvolvimento - Execucao de Projeto Finalizada',
  _templatePath: '/wdGestaoProjetos/resources/js/templates/desenvolvimento-projetos/dp-project-final.html',
  _activeStageText: 'Execucao de Projeto Finalizada',
  _progressItems: [
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Solicitação aprovada' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Análise TI concluída' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Planejamento do projeto concluído' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Execução do projeto concluída' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Validação do solicitante concluída' },
    { tone: 'green', icon: 'fa-solid fa-check-circle', text: 'Validação do TI concluída' }
  ],
  _extraTabs: ['requester', 'ti'],
  _requesterHistoryField: 'valSolicHistJsonDP',
  _tiHistoryField: 'valTIHistJsonDP',

  createFinalState: function () {
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
      checklistVisited: true,
      validationHistory: [],
      requesterHistory: [],
      requesterComment: '',
      tiHistory: []
    };
  },

  load: async function (params) {
    params = params || {};
    this._state = this.createFinalState();
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
      console.error('Project final template load error:', error);
      $('#page-container').html('<div class="p-6 text-red-600">Falha ao carregar a tela final do projeto.</div>');
    }
  },

  processData: function (row) {
    projectExecutionController.processData.call(this, row);
    this._state.requesterHistory = this.parseJson(this.getValIgnoreCase(row, this._requesterHistoryField)) || [];
    this._state.tiHistory = this.parseJson(this.getValIgnoreCase(row, this._tiHistoryField)) || [];
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
  },

  renderValidationPanels: function () {
    this.renderRequesterHistory();
    this.renderTiHistory();
  },

  renderTiHistory: function () {
    var list = $('#ti-history-list');
    if (!list.length) return;

    var history = Array.isArray(this._state.tiHistory) ? this._state.tiHistory : [];
    if (!history.length) {
      list.html('<div class="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">Nenhum histórico da TI registrado.</div>');
    } else {
      list.html(history.slice().reverse().map(this.getHistoryCardHtml.bind(this)).join(''));
    }
  }
});
