var projectExecutionController = {
  _eventNamespace: '.projectExecution',
  _returnToPlanningState: '14',
  _concludeExecutionState: '20',
  _executionDecisionField: 'decisaoExecucaoProjetoDP',
  _executionJustificationField: 'justificativaExecucaoProjetoDP',
  _headerBackup: null,
  _collapsedPhases: {},
  _collapsedMilestones: {},

  _state: {
    documentId: '',
    estadoProcesso: '',
    datasetId: 'dsGetDesenvolvimentoProjetos',
    formName: '',
    activeTab: 'phases',
    projectSummary: {},
    projectDeadline: '',
    phases: [],
    milestones: [],
    risks: [],
    raciRows: [],
    communicationPlanRows: []
  },

  load: async function (params) {
    params = params || {};
    this._state.documentId = this.asText(params.documentId);
    this._state.estadoProcesso = this.asText(params.estadoProcesso);
    this._state.datasetId = this.asText(params.datasetId) || 'dsGetDesenvolvimentoProjetos';
    this._state.formName = this.asText(params.formName);

    try {
      var html = await $.get(this.getTemplateUrl());
      $('#page-container').html(html);
      this.backupAndSetHeader();
      this.bindEvents();
      await this.loadProjectData();
      this.renderExecutionBoard();
      this.updateProjectSummary();
      this.renderMacroProgress();
      this.toggleTab(this._state.activeTab);
      this.updateTabArrows();
    } catch (error) {
      console.error('Project execution template load error:', error);
      $('#page-container').html('<div class="p-6 text-red-600">Falha ao carregar a tela de execução do projeto.</div>');
    }
  },

  destroy: function () {
    $('#page-container').off(this._eventNamespace);
    this.restoreHeader();
  },

  getTemplateUrl: function () {
    return WCMAPI.getServerURL() + '/wdGestaoProjetos/resources/js/templates/desenvolvimento-projetos/dp-project-execution.html';
  },

  bindEvents: function () {
    var self = this;
    var container = $('#page-container');
    container.off(this._eventNamespace);

    ['phases', 'milestones', 'risks', 'raci'].forEach(function (tab) {
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
    container.on('click' + this._eventNamespace, '[data-action="return-planning"]', function () {
      self.openReturnModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="save-draft"]', function () {
      self.saveDraft();
    });
    container.on('click' + this._eventNamespace, '[data-action="conclude-execution"]', function () {
      self.openConcludeModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="close-return-modal"]', function () {
      self.closeReturnModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="confirm-return-modal"]', function () {
      self.confirmReturnModal();
    });
    container.on('click' + this._eventNamespace, '#return-modal', function (event) {
      if (event.target && event.target.id === 'return-modal') self.closeReturnModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="close-conclude-modal"]', function () {
      self.closeConcludeModal();
    });
    container.on('click' + this._eventNamespace, '[data-action="confirm-conclude-modal"]', function () {
      self.confirmConcludeModal();
    });
    container.on('click' + this._eventNamespace, '#conclude-modal', function (event) {
      if (event.target && event.target.id === 'conclude-modal') self.closeConcludeModal();
    });
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

    if (titleEl.length) titleEl.text('Desenvolvimento - Execução do Projeto');
    if (breadcrumbEl.length) {
      breadcrumbEl.html([
        '<a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"><i class="fa-solid fa-house text-xs"></i><span>Início</span></a>',
        '<span class="text-gray-400">/</span>',
        '<span class="text-gray-300">Portfólio</span>',
        '<span class="text-gray-400">/</span>',
        '<span class="text-bevap-gold font-medium">Execução do Projeto</span>'
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

  resetState: function () {
    this._state.projectSummary = {};
    this._state.projectDeadline = '';
    this._state.phases = [];
    this._state.milestones = [];
    this._state.risks = [];
    this._state.raciRows = [];
    this._state.communicationPlanRows = [];
    this._collapsedPhases = {};
    this._collapsedMilestones = {};
  },

  loadProjectData: async function () {
    if (!this._state.documentId) return;
    this.resetState();

    try {
      var rows = await fluigService.getDatasetRows(this._state.datasetId, {
        filters: { documentid: this._state.documentId }
      });
      var row = rows && rows.length ? rows[0] : null;
      if (!row) {
        this.showToast('Nenhum dado encontrado para este projeto.', 'warning');
        return;
      }
      this.processData(row);
    } catch (error) {
      console.error('loadProjectData error:', error);
      this.showToast('Erro ao carregar dados de execução.', 'error');
    }
  },

  processData: function (row) {
    this._state.projectSummary = this.extractProjectSummary(row);

    var payload = this.parseJson(this.getValIgnoreCase(row, 'projectPlanningJsonDP'));
    if (payload && payload.wbs && Array.isArray(payload.wbs.phases)) {
      this.processPayload(row, payload);
    } else {
      this.processFallback(row);
    }

    this._state.projectDeadline = this.resolveProjectDeadline(this._state.milestones);
  },

  processPayload: function (row, payload) {
    var self = this;
    var phases = Array.isArray(payload.wbs && payload.wbs.phases) ? payload.wbs.phases.slice() : [];
    var milestones = Array.isArray(payload.milestones && payload.milestones.items) ? payload.milestones.items.slice() : [];
    var risks = Array.isArray(payload.risks && payload.risks.items) ? payload.risks.items.slice() : [];
    var raciRows = Array.isArray(payload.raci && payload.raci.rows) ? payload.raci.rows.slice() : [];
    var communicationRows = Array.isArray(payload.communicationPlan && payload.communicationPlan.items) ? payload.communicationPlan.items.slice() : [];
    var doneStatusMap = this.buildTaskStatusMap(this.extractIndexedRows(row, [
      'milestoneTaskSummaryTextDP',
      'milestoneTaskSummaryDueDateDP',
      'milestoneTaskSummaryPhaseDP',
      'milestoneTaskSummaryMarcoDP',
      'milestoneTaskSummaryStartedDP'
    ]));

    phases.sort(function (a, b) {
      return (parseInt(a && a.order, 10) || 0) - (parseInt(b && b.order, 10) || 0);
    });

    this._state.phases = phases.map(function (phase, phaseIndex) {
      return self.normalizePhaseFromPayload(phase, phaseIndex, milestones);
    });
    this._state.milestones = milestones.map(function (milestone, index) {
      return self.normalizeMilestoneFromPayload(milestone, index, doneStatusMap);
    });
    this._state.risks = risks.map(function (risk, index) {
      return self.normalizeRisk(risk, index);
    });
    this._state.raciRows = raciRows.map(function (row) {
      return self.normalizeRaciRow(row);
    });
    this._state.communicationPlanRows = communicationRows.map(function (row, index) {
      return self.normalizeCommunicationPlanRow(row, index);
    });
  },

  processFallback: function (row) {
    var self = this;
    var phaseRows = this.extractIndexedRows(row, [
      'wbsPhaseIdDP', 'wbsPhaseOrderDP', 'wbsPhaseNameDP', 'wbsPhaseResponsibleDP', 'wbsPhaseEffortHoursDP', 'wbsPhaseDurationDaysDP', 'wbsPhaseNotesDP'
    ]);
    var taskRows = this.extractIndexedRows(row, [
      'wbsTaskIdDP', 'wbsTaskPhaseIdDP', 'wbsTaskOrderDP', 'wbsTaskNameDP', 'wbsTaskResponsibleDP', 'wbsTaskEffortHoursDP', 'wbsTaskDurationDaysDP'
    ]);
    var milestoneRows = this.extractIndexedRows(row, [
      'milestoneIdDP', 'milestoneNameDP', 'milestoneStartDateDP', 'milestoneEndDateDP'
    ]);
    var criteriaRows = this.extractIndexedRows(row, [
      'milestoneCriteriaMilestoneIdDP', 'milestoneCriteriaTextDP'
    ]);
    var summaryRows = this.extractIndexedRows(row, [
      'milestoneTaskSummaryTextDP', 'milestoneTaskSummaryDueDateDP', 'milestoneTaskSummaryPhaseDP', 'milestoneTaskSummaryMarcoDP', 'milestoneTaskSummaryStartedDP'
    ]);
    var riskRows = this.extractIndexedRows(row, [
      'riskIdDP', 'riskDescriptionDP', 'riskProbabilityDP', 'riskImpactDP', 'riskMitigationDP', 'riskPlanBDP'
    ]);
    var communicationRows = this.extractIndexedRows(row, [
      'commAudienceDP', 'commChannelDP', 'commFrequencyDP'
    ]);

    var taskLookup = {};
    taskRows.forEach(function (task) {
      var phaseId = self.asText(task.wbsTaskPhaseIdDP);
      if (!taskLookup[phaseId]) taskLookup[phaseId] = [];
      taskLookup[phaseId].push(task);
    });

    var criteriaByMilestone = this.groupCriteriaByMilestoneName(milestoneRows, criteriaRows);
    var doneStatusMap = this.buildTaskStatusMap(summaryRows);

    phaseRows.sort(function (a, b) {
      return (parseInt(a.wbsPhaseOrderDP, 10) || 0) - (parseInt(b.wbsPhaseOrderDP, 10) || 0);
    });

    this._state.phases = phaseRows.map(function (phaseRow, index) {
      return self.normalizePhaseFromFieldRows(phaseRow, index, taskLookup[self.asText(phaseRow.wbsPhaseIdDP)] || []);
    });

    this._state.milestones = milestoneRows.map(function (milestoneRow, index) {
      var name = self.asText(milestoneRow.milestoneNameDP) || ('Marco ' + (index + 1));
      var tasks = summaryRows.filter(function (taskRow) {
        return self.asText(taskRow.milestoneTaskSummaryMarcoDP) === name;
      }).map(function (taskRow, taskIndex) {
        var taskName = self.asText(taskRow.milestoneTaskSummaryTextDP) || ('Tarefa ' + (taskIndex + 1));
        var key = self.buildTaskStatusKey(taskRow.milestoneTaskSummaryPhaseDP, name, taskName, taskRow.milestoneTaskSummaryDueDateDP);
        return {
          taskName: taskName,
          phaseName: self.asText(taskRow.milestoneTaskSummaryPhaseDP),
          responsible: self.resolveTaskResponsible(self.asText(taskRow.milestoneTaskSummaryPhaseDP), taskName),
          date: self.formatDisplayDate(taskRow.milestoneTaskSummaryDueDateDP),
          status: doneStatusMap[key] ? 'concluido' : self.getMockTaskExecutionStatus(taskIndex)
        };
      });

      return {
        id: self.asText(milestoneRow.milestoneIdDP) || ('milestone-' + (index + 1)),
        name: name,
        period: self.joinDateRange(milestoneRow.milestoneStartDateDP, milestoneRow.milestoneEndDateDP),
        owner: self.resolveMilestoneOwner(tasks),
        status: self.resolveMilestoneStatus(tasks),
        criteria: criteriaByMilestone[name] || [],
        tasks: tasks
      };
    });

    this._state.risks = riskRows.map(function (riskRow, index) {
      return self.normalizeRisk({
        id: riskRow.riskIdDP,
        description: riskRow.riskDescriptionDP,
        probability: riskRow.riskProbabilityDP,
        impact: riskRow.riskImpactDP,
        mitigation: riskRow.riskMitigationDP,
        planB: riskRow.riskPlanBDP
      }, index);
    });

    this._state.raciRows = this.parseRaciFallbackRows(row);
    this._state.communicationPlanRows = communicationRows.map(function (rowItem, index) {
      return self.normalizeCommunicationPlanRow({
        audience: rowItem.commAudienceDP,
        channel: rowItem.commChannelDP,
        frequency: rowItem.commFrequencyDP
      }, index);
    });
  },

  normalizePhaseFromPayload: function (phase, phaseIndex, milestones) {
    var self = this;
    var phaseKey = this.asText(phase.id) || ('phase-' + (phaseIndex + 1));
    var phaseName = this.asText(phase.name) || ('Fase ' + (phaseIndex + 1));
    var tasks = Array.isArray(phase.tasks) ? phase.tasks.map(function (task, taskIndex) {
      return {
        id: self.asText(task.id) || ('task-' + phaseKey + '-' + (taskIndex + 1)),
        name: self.asText(task.name) || ('Tarefa ' + (taskIndex + 1)),
        responsible: self.firstDefinedValue([task.responsible, phase.responsible]) || 'Não definido',
        totalHours: self.toNumber(task.effortHours),
        durationDays: self.toNumber(task.durationDays),
        dependency: Array.isArray(task.dependencies) && task.dependencies.length ? task.dependencies[0] : '',
        dependencies: Array.isArray(task.dependencies) ? task.dependencies : []
      };
    }) : [];

    return {
      key: phaseKey,
      name: phaseName,
      responsible: this.asText(phase.responsible) || 'Não definido',
      effortHours: this.asText(phase.effortHours),
      durationDays: this.asText(phase.durationDays),
      notes: this.asText(phase.notes) || 'Levantamento de requisitos, consolidação documental e preparação da base funcional para a execução.',
      dependencies: this.collectPhaseDependencies(phase, tasks, milestones, phaseName),
      tasks: tasks
    };
  },

  normalizePhaseFromFieldRows: function (phaseRow, index, taskRows) {
    var self = this;
    var phaseKey = this.asText(phaseRow.wbsPhaseIdDP) || ('phase-' + (index + 1));
    var tasks = (taskRows || []).map(function (taskRow, taskIndex) {
      return {
        id: self.asText(taskRow.wbsTaskIdDP) || ('task-' + phaseKey + '-' + (taskIndex + 1)),
        name: self.asText(taskRow.wbsTaskNameDP) || ('Tarefa ' + (taskIndex + 1)),
        responsible: self.firstDefinedValue([taskRow.wbsTaskResponsibleDP, phaseRow.wbsPhaseResponsibleDP]) || 'Não definido',
        totalHours: self.toNumber(taskRow.wbsTaskEffortHoursDP),
        durationDays: self.toNumber(taskRow.wbsTaskDurationDaysDP),
        dependency: '',
        dependencies: []
      };
    });

    return {
      key: phaseKey,
      name: this.asText(phaseRow.wbsPhaseNameDP) || ('Fase ' + (index + 1)),
      responsible: this.asText(phaseRow.wbsPhaseResponsibleDP) || 'Não definido',
      effortHours: this.asText(phaseRow.wbsPhaseEffortHoursDP),
      durationDays: this.asText(phaseRow.wbsPhaseDurationDaysDP),
      notes: this.asText(phaseRow.wbsPhaseNotesDP) || 'Levantamento de requisitos, consolidação documental e preparação da base funcional para a execução.',
      dependencies: [],
      tasks: tasks
    };
  },

  normalizeMilestoneFromPayload: function (milestone, index, doneStatusMap) {
    var self = this;
    var tasks = Array.isArray(milestone && milestone.tasks) ? milestone.tasks.map(function (task, taskIndex) {
      var taskName = self.firstDefinedValue([task.taskName, task.task, task.taskLabel, task.name]) || ('Tarefa ' + (taskIndex + 1));
      var statusKey = self.buildTaskStatusKey(task.phaseName, milestone.name, taskName, task.dueDate);
      return {
        taskName: taskName,
        phaseName: self.asText(task.phaseName),
        responsible: self.asText(task.responsible) || self.resolveTaskResponsible(self.asText(task.phaseName), taskName),
        date: self.formatDisplayDate(task.dueDate),
        status: self.firstDefinedValue([task.status, doneStatusMap[statusKey] ? 'concluido' : '']) || self.getMockTaskExecutionStatus(taskIndex)
      };
    }) : [];

    return {
      id: this.asText(milestone && milestone.id) || ('milestone-' + (index + 1)),
      name: this.asText(milestone && milestone.name) || ('Marco ' + (index + 1)),
      period: this.firstDefinedValue([milestone && milestone.period, this.joinDateRange(milestone && milestone.startDate, milestone && milestone.endDate)]),
      owner: this.firstDefinedValue([milestone && milestone.owner, milestone && milestone.responsible, this.resolveMilestoneOwner(tasks)]) || 'Não definido',
      status: this.firstDefinedValue([milestone && milestone.status, this.resolveMilestoneStatus(tasks)]) || 'planejado',
      criteria: Array.isArray(milestone && milestone.criteria) ? milestone.criteria : [],
      tasks: tasks
    };
  },

  normalizeRisk: function (risk, index) {
    var severity = this.firstDefinedValue([risk && risk.severity, risk && risk.level]) || 'Médio';
    return {
      id: this.asText(risk && risk.id) || ('risk-' + (index + 1)),
      title: this.firstDefinedValue([risk && risk.title, risk && risk.description]) || ('Risco ' + (index + 1)),
      severity: severity,
      probability: this.firstDefinedValue([risk && risk.probability]) || '-',
      impact: this.firstDefinedValue([risk && risk.impact]) || '-',
      mitigation: this.firstDefinedValue([risk && risk.mitigation]) || '-',
      fallback: this.firstDefinedValue([risk && risk.fallback, risk && risk.planB]) || '-',
      owner: this.firstDefinedValue([risk && risk.owner, risk && risk.responsible]) || '-'
    };
  },

  normalizeRaciRow: function (row) {
    return {
      milestone: this.firstDefinedValue([row && row.milestone, row && row.phase]) || '-',
      responsible: this.normalizeStakeholderField(this.firstDefinedValue([row && row.responsible, row && row.r])),
      approver: this.normalizeStakeholderField(this.firstDefinedValue([row && row.approver, row && row.a])),
      consulted: this.normalizeStakeholderField(this.firstDefinedValue([row && row.consulted, row && row.c])),
      informed: this.normalizeStakeholderField(this.firstDefinedValue([row && row.informed, row && row.i]))
    };
  },

  normalizeCommunicationPlanRow: function (row, index) {
    return {
      id: this.asText(row && row.id) || ('comm-' + (index + 1)),
      audience: this.normalizeStakeholderField(row && row.audience),
      channel: this.asText(row && row.channel),
      frequency: this.asText(row && row.frequency)
    };
  },

  renderExecutionBoard: function () {
    this.renderPhasesPanel();
    this.renderMilestonesPanel();
    this.renderRisksPanel();
    this.renderRaciPanel();
  },

  renderPhasesPanel: function () {
    var self = this;
    var phases = this._state.phases || [];
    if (!phases.length) {
      $('#execution-phases-list').html('<div class="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">Nenhuma fase definida no planejamento.</div>');
      return;
    }
    $('#execution-phases-list').html(phases.map(function (phase) {
      return self.getPhaseCardHtml(phase);
    }).join(''));
  },

  renderMilestonesPanel: function () {
    var self = this;
    var milestones = this._state.milestones || [];
    if (!milestones.length) {
      $('#execution-milestones-list').html('<div class="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">Nenhum marco encontrado.</div>');
      return;
    }
    $('#execution-milestones-list').html(milestones.map(function (milestone, index) {
      return self.getMilestoneCardHtml(milestone, index);
    }).join(''));
  },

  renderRisksPanel: function () {
    var self = this;
    var risks = this._state.risks || [];
    if (!risks.length) {
      $('#execution-risks-list').html('<div class="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">Nenhum risco cadastrado.</div>');
      return;
    }
    $('#execution-risks-list').html(risks.map(function (risk) {
      return self.getRiskCardHtml(risk);
    }).join(''));
  },

  renderRaciPanel: function () {
    var self = this;
    var rows = this._state.raciRows || [];
    var communicationRows = this._state.communicationPlanRows || [];

    $('#execution-raci-body').html(rows.length ? rows.map(function (row) {
      return '<tr><td class="px-4 py-3 align-top"><div class="font-medium text-bevap-navy">' + self.escapeHtml(row.milestone) + '</div></td><td class="px-4 py-3 align-top text-gray-700">' + self.escapeHtml(row.responsible || '-') + '</td><td class="px-4 py-3 align-top text-gray-700">' + self.escapeHtml(row.approver || '-') + '</td><td class="px-4 py-3 align-top text-gray-700">' + self.escapeHtml(row.consulted || '-') + '</td><td class="px-4 py-3 align-top text-gray-700">' + self.escapeHtml(row.informed || '-') + '</td></tr>';
    }).join('') : '<tr><td colspan="5" class="px-4 py-4 text-sm text-gray-500">Nenhuma matriz RACI cadastrada.</td></tr>');

    $('#execution-communication-body').html(communicationRows.length ? communicationRows.map(function (row) {
      return '<tr><td class="px-4 py-3 text-gray-700">' + self.escapeHtml(row.audience || '-') + '</td><td class="px-4 py-3 text-gray-700">' + self.escapeHtml(row.channel || '-') + '</td><td class="px-4 py-3 text-gray-700">' + self.escapeHtml(row.frequency || '-') + '</td></tr>';
    }).join('') : '<tr><td colspan="3" class="px-4 py-4 text-sm text-gray-500">Nenhum item de comunicação cadastrado.</td></tr>');
  },

  getPhaseCardHtml: function (phase) {
    var self = this;
    var isCollapsed = this._collapsedPhases[phase.key] === true;
    var durationLabel = this.asText(phase.durationDays) ? (this.asText(phase.durationDays) + ' dias') : '10 dias';
    var effortLabel = this.asText(phase.effortHours) ? (this.asText(phase.effortHours) + 'h') : '72h';

    return [
      '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">',
      '  <div class="flex items-start gap-3">',
      '    <span class="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shrink-0"><i class="fa-solid fa-layer-group text-base"></i></span>',
      '    <div class="min-w-0 flex-1 pt-0.5">',
      '      <h3 class="text-base font-montserrat font-semibold text-bevap-navy">FASE: ' + this.escapeHtml(phase.name) + '</h3>',
      '      <p class="mt-1 text-sm leading-6 text-gray-600">' + this.escapeHtml(phase.notes) + '</p>',
      '    </div>',
      '  </div>',
      '  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">',
      '    <div class="flex flex-wrap gap-2 text-[13px]">',
      '      <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1" style="color: #dbeafe;"></i>Responsável: ' + this.escapeHtml(phase.responsible) + '</span>',
      '      <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Duração: ' + this.escapeHtml(durationLabel) + '</span>',
      '      <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>Esforço Total: ' + this.escapeHtml(effortLabel) + '</span>',
      '    </div>',
      '    <button type="button" data-phase-toggle="' + this.escapeHtml(phase.key) + '" class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"><i class="fa-solid ' + (isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up') + ' mr-2 text-gray-400"></i>' + (isCollapsed ? 'Expandir' : 'Recolher') + '</button>',
      '  </div>',
      '  <div class="' + (isCollapsed ? 'hidden' : 'block') + '">',
      '    <div class="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">',
      '      <div class="flex items-center gap-3 text-sm font-semibold text-gray-900">',
      '        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-200 text-yellow-700 shrink-0"><i class="fa-solid fa-link text-xs"></i></span>',
      '        <span>Dependências da Fase</span>',
      '      </div>',
      '      <div class="mt-3 space-y-2 pl-12">',
      phase.dependencies.length ? phase.dependencies.map(function (dependency) { return self.getPhaseDependencyHtml(dependency); }).join('') : '<div class="text-sm text-gray-500">Nenhuma dependência registrada para esta fase.</div>',
      '      </div>',
      '    </div>',
      '    <div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-4">',
      '      <div class="mb-3 flex items-center justify-between gap-3">',
      '        <div><h4 class="text-sm font-montserrat font-semibold text-gray-900">Tarefas da Fase</h4><p class="text-xs text-gray-500">Relação de tarefas planejadas com esforço e duração.</p></div>',
      '        <span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">' + phase.tasks.length + ' tarefas</span>',
      '      </div>',
      '      <div class="space-y-3">',
      phase.tasks.length ? phase.tasks.map(function (task) { return self.getPhaseTaskHtml(task); }).join('') : '<div class="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">Nenhuma tarefa prevista para esta fase.</div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  },

  getPhaseDependencyHtml: function (dependency) {
    return '<div class="flex items-start gap-3 text-sm text-gray-700"><span class="mt-2 inline-flex h-2.5 w-2.5 rounded-full bg-yellow-700 shrink-0"></span><span class="font-medium text-gray-700">' + this.escapeHtml(dependency) + '</span></div>';
  },

  getPhaseTaskHtml: function (task) {
    var durationLabel = task.durationDays ? (task.durationDays + ' dias') : '-';
    return [
      '<div class="rounded-xl border border-gray-200 bg-white p-4">',
      '  <div class="flex items-start justify-between gap-3">',
      '    <div class="min-w-0 flex-1">',
      '      <div class="text-sm font-semibold text-bevap-navy">' + this.escapeHtml(task.name) + '</div>',
      '      <div class="mt-2 flex flex-wrap gap-2 text-[13px]">',
      '        <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user mr-1" style="color: #dbeafe;"></i>Responsável: ' + this.escapeHtml(task.responsible) + '</span>',
      '        <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>' + this.escapeHtml((task.totalHours || 0) + 'h') + '</span>',
      '        <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>' + this.escapeHtml(durationLabel) + '</span>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600"><span class="font-medium text-gray-700">Dependência:</span> ' + this.escapeHtml(task.dependency || '-') + '</div>',
      '</div>'
    ].join('');
  },

  getMilestoneCardHtml: function (milestone, index) {
    var self = this;
    var isCollapsed = this._collapsedMilestones[milestone.id || index] === true;
    var status = this.getMilestoneStatusMeta(milestone.status);
    return [
      '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">',
      '  <div class="flex items-start justify-between gap-4">',
      '    <div class="min-w-0 flex-1">',
      '      <div class="flex items-center gap-3">',
      '        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700 shrink-0"><i class="fa-solid fa-flag-checkered text-base"></i></span>',
      '        <div class="min-w-0 flex-1"><h3 class="text-base font-montserrat font-semibold text-bevap-navy">Marco: ' + this.escapeHtml(milestone.name) + '</h3></div>',
      '      </div>',
      '    </div>',
      '    <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ' + status.badge + '"><i class="' + status.icon + '"></i><span>' + status.label + '</span></span>',
      '  </div>',
      '  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">',
      '    <div class="flex flex-wrap gap-2 text-[13px]">',
      '      <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1" style="color: #dbeafe;"></i>Responsável: ' + this.escapeHtml(milestone.owner) + '</span>',
      '      <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-alt mr-1 text-red-100"></i>' + this.escapeHtml(milestone.period || '-') + '</span>',
      '    </div>',
      '    <button type="button" data-milestone-toggle="' + this.escapeHtml(milestone.id || String(index)) + '" class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"><i class="fa-solid ' + (isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up') + ' mr-2 text-gray-400"></i>' + (isCollapsed ? 'Expandir' : 'Recolher') + '</button>',
      '  </div>',
      '  <div class="' + (isCollapsed ? 'hidden' : 'block') + '">',
      '    <div class="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">',
      '      <div class="mb-1.5 flex items-center gap-2"><i class="fa-solid fa-check-double text-sm text-blue-700"></i><h4 class="text-sm font-montserrat font-semibold text-gray-900">Critérios de Aceite</h4></div>',
      '      <div class="space-y-0.5">',
      milestone.criteria.length ? milestone.criteria.map(function (item) {
        return '<div class="flex items-start gap-1 rounded-lg bg-blue-50 px-3 py-1 text-sm leading-snug text-gray-700"><i class="fa-solid fa-check mt-0.5 text-[10px] text-bevap-green"></i><span>' + self.escapeHtml(item) + '</span></div>';
      }).join('') : '<div class="text-sm text-gray-500">Nenhum critério definido.</div>',
      '      </div>',
      '    </div>',
      '    <div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-4">',
      '      <div class="mb-3 flex items-center justify-between gap-3">',
      '        <div><h4 class="text-sm font-montserrat font-semibold text-gray-900">Tarefas do Marco</h4><p class="text-xs text-gray-500">Tarefas relacionadas no planejamento para compor esta entrega.</p></div>',
      '        <span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">' + milestone.tasks.length + ' tarefas</span>',
      '      </div>',
      '      <div class="space-y-3">',
      milestone.tasks.length ? milestone.tasks.map(function (task) { return self.getMilestoneTaskHtml(task); }).join('') : '<div class="text-sm text-gray-500">Nenhuma tarefa vinculada ao marco.</div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  },

  getMilestoneTaskHtml: function (task) {
    var status = this.getTaskExecutionStatusMeta(task.status);
    return [
      '<div class="rounded-xl border border-gray-200 bg-white p-4">',
      '  <div class="flex items-start justify-between gap-3">',
      '    <div class="min-w-0 flex-1">',
      '      <span class="inline-flex items-center gap-2 text-sm font-semibold text-bevap-navy"><span>' + this.escapeHtml(task.taskName) + '</span><i class="fa-solid fa-link text-[11px] shrink-0"></i></span>',
      '      <div class="mt-2 flex flex-wrap gap-2 text-[13px]">',
      '        <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1 text-blue-100"></i>Responsável: ' + this.escapeHtml(task.responsible || '-') + '</span>',
      '        <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-solid fa-layer-group mr-1 text-green-200"></i>Fase: ' + this.escapeHtml(task.phaseName || '-') + '</span>',
      '        <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>' + this.escapeHtml(task.date || '-') + '</span>',
      '      </div>',
      '    </div>',
      '    <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ' + status.badge + '"><i class="' + status.icon + '"></i><span>' + status.label + '</span></span>',
      '  </div>',
      '</div>'
    ].join('');
  },

  getRiskCardHtml: function (risk) {
    var severity = this.normalizeText(risk.severity);
    var accent = severity.indexOf('alto') !== -1 ? 'border-red-300 bg-white' : severity.indexOf('medio') !== -1 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50';
    var badge = severity.indexOf('alto') !== -1 ? 'bg-red-200 text-red-900' : severity.indexOf('medio') !== -1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
    var metaText = severity.indexOf('alto') !== -1 ? 'text-red-800' : severity.indexOf('medio') !== -1 ? 'text-yellow-700' : 'text-green-700';
    var icon = severity.indexOf('alto') !== -1 ? 'text-red-600' : severity.indexOf('medio') !== -1 ? 'text-yellow-600' : 'text-green-600';

    return [
      '<div class="rounded-xl border p-5 shadow-sm ' + accent + '">',
      '  <div class="flex items-start justify-between gap-3">',
      '    <div class="min-w-0 flex-1">',
      '      <div class="flex items-center gap-2"><i class="fa-solid fa-triangle-exclamation text-sm ' + icon + '"></i><h4 class="text-base font-montserrat font-semibold text-bevap-navy">' + this.escapeHtml(risk.title) + '</h4></div>',
      '      <div class="mt-2 text-sm ' + metaText + '">Probabilidade: ' + this.escapeHtml(risk.probability) + ' | Impacto: ' + this.escapeHtml(risk.impact) + '</div>',
      '    </div>',
      '    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ' + badge + '">' + this.escapeHtml(risk.severity) + '</span>',
      '  </div>',
      '  <div class="mt-3 text-sm text-gray-600"><span class="font-medium text-gray-700">Responsável:</span> ' + this.escapeHtml(risk.owner) + '</div>',
      '  <div class="mt-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700"><strong>Mitigação:</strong> ' + this.escapeHtml(risk.mitigation) + '</div>',
      '  <div class="mt-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700"><strong>Plano B:</strong> ' + this.escapeHtml(risk.fallback) + '</div>',
      '</div>'
    ].join('');
  },

  updateProjectSummary: function () {
    var summary = this._state.projectSummary || {};
    $('#project-code').text(summary.code || '-');
    $('#project-title').text(summary.title || '-');
    $('#project-area').text(summary.area || '-');
    $('#project-sponsor').text(summary.sponsor || '-');
    $('#project-requester').text(summary.requester || '-');
    $('#project-deadline').text(this._state.projectDeadline || '-');
    $('#project-state').text(summary.state || 'Execução em andamento');
  },

  renderMacroProgress: function () {
    $('#macro-progress-list').html([
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>SolicitaÃ§Ã£o aprovada</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>AnÃ¡lise TI concluÃ­da</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Planejamento do projeto concluÃ­do</span></div>',
      '<div class="flex items-center text-bevap-gold"><i class="fa-solid fa-clock mr-2"></i><span>ExecuÃ§Ã£o do projeto em andamento</span></div>'
    ].join(''));
    return;

    var phases = this._state.phases || [];
    var milestones = this._state.milestones || [];
    var completed = milestones.filter(function (milestone) {
      return String(milestone.status || '').toLowerCase().indexOf('conclu') !== -1;
    }).length;
    var progress = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;

    $('#execution-progress-text').text(progress + '%');
    $('#execution-progress-bar').css('width', progress + '%');
    $('#completed-phases-count').text(completed + ' de ' + phases.length);
    $('#qa-ready-count').text(completed + ' de ' + phases.length + ' fases');
    $('#macro-progress-list').html([
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Solicitação aprovada</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Análise TI concluída</span></div>',
      '<div class="flex items-center text-green-600"><i class="fa-solid fa-check-circle mr-2"></i><span>Planejamento do projeto concluído</span></div>',
      '<div class="flex items-center text-bevap-gold"><i class="fa-solid fa-clock mr-2"></i><span>Execução do projeto em andamento</span></div>'
    ].join(''));
  },

  extractProjectSummary: function (row) {
    return {
      code: this.firstDefinedValue([this.getValIgnoreCase(row, 'codigoglpi'), this.getValIgnoreCase(row, 'codigoprojeto')]),
      title: this.firstDefinedValue([this.getValIgnoreCase(row, 'titulodoprojetoNS'), this.getValIgnoreCase(row, 'titulodoprojeto')]),
      area: this.firstDefinedValue([this.getValIgnoreCase(row, 'areaUnidadeNS'), this.getValIgnoreCase(row, 'areaUnidade')]),
      sponsor: this.firstDefinedValue([this.getValIgnoreCase(row, 'patrocinadorNS'), this.getValIgnoreCase(row, 'patrocinador')]),
      requester: this.firstDefinedValue([this.getValIgnoreCase(row, 'solicitanteNomeNS'), this.getValIgnoreCase(row, 'solicitanteNome')]),
      state: this.firstDefinedValue([this.getValIgnoreCase(row, 'estadoProcesso'), this.getValIgnoreCase(row, 'estado')]) || 'Execução em andamento'
    };
  },

  resolveProjectDeadline: function (milestones) {
    var lastDate = '';
    (milestones || []).forEach(function (milestone) {
      var period = milestone.period || '';
      if (!period) return;
      var parts = period.split(' - ');
      lastDate = parts.length > 1 ? parts[1] : period;
    });
    return lastDate || '';
  },

  collectPhaseDependencies: function (phase, tasks, milestones, phaseName) {
    var dependencies = [];
    function pushIfMissing(value) {
      var text = String(value || '').trim();
      if (text && dependencies.indexOf(text) === -1) dependencies.push(text);
    }

    (Array.isArray(phase && phase.dependencies) ? phase.dependencies : []).forEach(pushIfMissing);
    (tasks || []).forEach(function (task) {
      (Array.isArray(task.dependencies) ? task.dependencies : []).forEach(pushIfMissing);
    });
    (milestones || []).forEach(function (milestone) {
      (Array.isArray(milestone && milestone.tasks) ? milestone.tasks : []).forEach(function (task) {
        if (String(task.phaseName || '').trim() !== phaseName) return;
        (Array.isArray(task.dependencies) ? task.dependencies : []).forEach(pushIfMissing);
      });
    });
    return dependencies;
  },

  resolveTaskResponsible: function (phaseName, taskName) {
    var phases = this._state.phases || [];
    for (var i = 0; i < phases.length; i++) {
      if (this.asText(phases[i].name) !== this.asText(phaseName)) continue;
      for (var j = 0; j < phases[i].tasks.length; j++) {
        if (this.asText(phases[i].tasks[j].name) === this.asText(taskName)) return phases[i].tasks[j].responsible;
      }
      return phases[i].responsible;
    }
    return '-';
  },

  resolveMilestoneOwner: function (tasks) {
    return tasks && tasks.length ? this.asText(tasks[0].responsible) || 'Não definido' : 'Não definido';
  },

  resolveMilestoneStatus: function (tasks) {
    if (!tasks.length) return 'planejado';
    var doneCount = tasks.filter(function (task) { return task.status === 'concluido'; }).length;
    if (doneCount === tasks.length) return 'concluido';
    if (doneCount > 0) return 'em_andamento';
    return 'planejado';
  },

  getMockTaskExecutionStatus: function (index) {
    if (index === 0) return 'em_execucao';
    if (index === 1) return 'validacao_ti';
    if (index === 2) return 'validacao_solicitante';
    return 'aguardando_execucao';
  },

  getMilestoneStatusMeta: function (status) {
    var normalized = this.normalizeText(status);
    if (normalized.indexOf('conclu') !== -1) return { label: 'Concluído', badge: 'border-green-200 bg-green-50 text-green-700', icon: 'fa-solid fa-circle-check text-green-600' };
    if (normalized.indexOf('andamento') !== -1 || normalized.indexOf('execucao') !== -1) return { label: 'Em andamento', badge: 'border-yellow-200 bg-yellow-50 text-yellow-700', icon: 'fa-solid fa-hourglass-half text-yellow-600' };
    return { label: 'Planejado', badge: 'border-gray-200 bg-gray-50 text-gray-700', icon: 'fa-regular fa-circle text-gray-500' };
  },

  getTaskExecutionStatusMeta: function (status) {
    var normalized = this.normalizeText(status);
    if (normalized.indexOf('conclu') !== -1) return { label: 'Concluído', badge: 'border-green-200 bg-green-50 text-green-700', icon: 'fa-solid fa-circle-check text-green-600' };
    if (normalized.indexOf('validacao_ti') !== -1 || normalized.indexOf('validacao ti') !== -1) return { label: 'Validação do TI', badge: 'border-indigo-200 bg-indigo-50 text-indigo-700', icon: 'fa-solid fa-shield-halved text-indigo-600' };
    if (normalized.indexOf('validacao_solicitante') !== -1 || normalized.indexOf('solicitante') !== -1) return { label: 'Validação do Solicitante', badge: 'border-yellow-200 bg-yellow-50 text-yellow-700', icon: 'fa-solid fa-user-check text-yellow-600' };
    if (normalized.indexOf('execucao') !== -1) return { label: 'Em Execução', badge: 'border-blue-200 bg-blue-50 text-blue-700', icon: 'fa-solid fa-play text-blue-600' };
    return { label: 'Aguardando Execução', badge: 'border-gray-200 bg-gray-50 text-gray-700', icon: 'fa-regular fa-clock text-gray-500' };
  },

  toggleTab: function (tabName) {
    this._state.activeTab = this.asText(tabName) || 'phases';
    ['phases', 'milestones', 'risks', 'raci'].forEach(function (tab) {
      var active = tab === tabName;
      $('#tab-execution-' + tab)
        .toggleClass('border-bevap-green bg-green-50 text-bevap-green', active)
        .toggleClass('border-transparent text-gray-500 hover:text-gray-700', !active);
      $('#tab-content-execution-' + tab).toggleClass('hidden', !active);
    });
  },

  updateTabArrows: function () {
    var scroller = document.getElementById('execution-tabs-scroll');
    var leftArrow = document.getElementById('execution-tabs-left-arrow');
    var rightArrow = document.getElementById('execution-tabs-right-arrow');
    if (!scroller || !leftArrow || !rightArrow) return;

    var maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    var hasOverflow = maxScroll > 2;
    var atStart = scroller.scrollLeft <= 2;
    var atEnd = scroller.scrollLeft >= maxScroll - 2;

    leftArrow.classList.toggle('opacity-0', !hasOverflow || atStart);
    leftArrow.classList.toggle('pointer-events-none', !hasOverflow || atStart);
    rightArrow.classList.toggle('opacity-0', !hasOverflow || atEnd);
    rightArrow.classList.toggle('pointer-events-none', !hasOverflow || atEnd);
  },

  scrollTabsToStart: function () {
    var scroller = document.getElementById('execution-tabs-scroll');
    if (!scroller) return;
    scroller.scrollTo({ left: 0, behavior: 'smooth' });
    var self = this;
    window.setTimeout(function () { self.updateTabArrows(); }, 360);
  },

  scrollTabsToEnd: function () {
    var scroller = document.getElementById('execution-tabs-scroll');
    if (!scroller) return;
    scroller.scrollTo({ left: scroller.scrollWidth - scroller.clientWidth, behavior: 'smooth' });
    var self = this;
    window.setTimeout(function () { self.updateTabArrows(); }, 360);
  },

  togglePhaseCollapse: function (phaseKey) {
    this._collapsedPhases[phaseKey] = !this._collapsedPhases[phaseKey];
    this.renderPhasesPanel();
  },

  toggleMilestoneCollapse: function (milestoneKey) {
    this._collapsedMilestones[milestoneKey] = !this._collapsedMilestones[milestoneKey];
    this.renderMilestonesPanel();
  },

  openReturnModal: function () {
    $('#return-modal').removeClass('hidden');
  },

  closeReturnModal: function () {
    $('#return-modal').addClass('hidden');
  },

  confirmReturnModal: async function () {
    var reason = $('#return-reason');
    if (!reason.val() || !String(reason.val()).trim()) {
      this.showToast('Descreva o motivo para retornar ao planejamento.', 'error');
      reason.trigger('focus');
      return;
    }
    this.closeReturnModal();
    try {
      await this.submitExecutionDecision({
        decisionValue: 'correcao',
        justificationValue: reason.val(),
        nextState: this._returnToPlanningState,
        successMessage: 'Novo planejamento solicitado com sucesso.',
        comments: 'Execucao devolvida para novo planejamento via Widget'
      });
      reason.val('');
    } catch (error) {
      console.error('confirmReturnModal error:', error);
      this.showToast(this.asText(error && error.message) || 'Nao foi possivel solicitar um novo planejamento.', 'error');
    }
  },

  openConcludeModal: function () {
    $('#conclude-modal').removeClass('hidden');
  },

  closeConcludeModal: function () {
    $('#conclude-modal').addClass('hidden');
  },

  confirmConcludeModal: async function () {
    this.closeConcludeModal();
    try {
      await this.submitExecutionDecision({
        decisionValue: 'concluido',
        justificationValue: '',
        nextState: this._concludeExecutionState,
        successMessage: 'Execucao concluida e enviada para a proxima etapa.',
        comments: 'Execucao concluida via Widget'
      });
    } catch (error) {
      console.error('confirmConcludeModal error:', error);
      this.showToast(this.asText(error && error.message) || 'Nao foi possivel concluir a execucao.', 'error');
    }
  },

  saveDraft: function () {
    var self = this;
    (async function () {
      try {
        await self.persistExecutionDecision({
          decisionValue: '',
          justificationValue: ''
        });
        self.showToast('Rascunho salvo.', 'success');
      } catch (error) {
        console.error('saveDraft error:', error);
        self.showToast(self.asText(error && error.message) || 'Nao foi possivel salvar o rascunho.', 'error');
      }
    })();
  },

  submitExecutionDecision: async function (config) {
    var documentId = this.asText(this._state.documentId);
    if (!documentId) {
      throw new Error('documentId nao informado.');
    }

    var processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(documentId);
    var taskFields = this.collectExecutionTaskFields(config && config.decisionValue, config && config.justificationValue);
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

      this.showToast(this.asText(config && config.successMessage) || 'Movimentacao realizada com sucesso.', 'success');

      setTimeout(function () {
        location.hash = '#dashboard';
      }, 800);
    } finally {
      if (legacyLoading) legacyLoading.hide();
    }
  },

  persistExecutionDecision: async function (config) {
    var documentId = this.asText(this._state.documentId);
    if (!documentId) {
      throw new Error('documentId nao informado.');
    }

    await fluigService.saveDraft({
      mode: 'updateCardDraft',
      documentId: documentId,
      taskFields: this.collectExecutionTaskFields(config && config.decisionValue, config && config.justificationValue)
    });
  },

  collectExecutionTaskFields: function (decisionValue, justificationValue) {
    return [
      { name: this._executionDecisionField, value: this.asText(decisionValue) },
      { name: this._executionJustificationField, value: this.asText(justificationValue) }
    ];
  },

  parseRaciFallbackRows: function (row) {
    var parsed = this.parseJson(this.getValIgnoreCase(row, 'raciJsonDP'));
    var rows = parsed && Array.isArray(parsed.rows) ? parsed.rows : [];
    var self = this;
    return rows.map(function (raciRow) {
      return self.normalizeRaciRow(raciRow);
    });
  },

  groupCriteriaByMilestoneName: function (milestoneRows, criteriaRows) {
    var self = this;
    var milestoneNameById = {};
    var grouped = {};

    (milestoneRows || []).forEach(function (milestone) {
      var id = self.asText(milestone.milestoneIdDP);
      var name = self.asText(milestone.milestoneNameDP);
      if (id && name) milestoneNameById[id] = name;
    });

    (criteriaRows || []).forEach(function (criteria) {
      var milestoneId = self.asText(criteria.milestoneCriteriaMilestoneIdDP);
      var text = self.asText(criteria.milestoneCriteriaTextDP);
      var name = milestoneNameById[milestoneId] || milestoneId;
      if (!name || !text) return;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(text);
    });

    return grouped;
  },

  buildTaskStatusMap: function (taskRows) {
    var self = this;
    var map = {};
    (taskRows || []).forEach(function (row) {
      var key = self.buildTaskStatusKey(
        row.milestoneTaskSummaryPhaseDP,
        row.milestoneTaskSummaryMarcoDP,
        row.milestoneTaskSummaryTextDP,
        row.milestoneTaskSummaryDueDateDP
      );
      var started = self.normalizeText(row.milestoneTaskSummaryStartedDP);
      map[key] = started === 'true' || started === '1' || started === 'sim' || started === 'yes';
    });
    return map;
  },

  buildTaskStatusKey: function (phaseName, milestoneName, taskName, dueDate) {
    return [this.normalizeText(phaseName), this.normalizeText(milestoneName), this.normalizeText(taskName), this.normalizeText(dueDate)].join('||');
  },

  extractIndexedRows: function (row, fieldNames) {
    var grouped = {};
    var allowedFields = Array.isArray(fieldNames) ? fieldNames.map(function (field) { return field.toLowerCase(); }) : [];
    var keys = row && typeof row === 'object' ? Object.keys(row) : [];

    keys.forEach(function (key) {
      var match = key.match(/^(.+?)___(\d+)$/);
      if (!match) return;
      var fieldName = match[1].toLowerCase();
      var index = match[2];
      var originalIndex = allowedFields.indexOf(fieldName);
      if (originalIndex === -1) return;
      if (!grouped[index]) grouped[index] = {};
      grouped[index][fieldNames[originalIndex]] = row[key];
    });

    return Object.keys(grouped).sort(function (a, b) {
      return parseInt(a, 10) - parseInt(b, 10);
    }).map(function (index) {
      return grouped[index];
    });
  },

  getValIgnoreCase: function (obj, key) {
    if (!obj) return '';
    var foundKey = Object.keys(obj).find(function (candidate) {
      return String(candidate).toLowerCase() === String(key).toLowerCase();
    });
    return foundKey ? obj[foundKey] : '';
  },

  firstDefinedValue: function (values) {
    for (var i = 0; i < values.length; i++) {
      var value = this.asText(values[i]);
      if (value) return value;
    }
    return '';
  },

  normalizeStakeholderField: function (value) {
    if (Array.isArray(value)) {
      return value.map(this.asText.bind(this)).filter(Boolean).join(', ');
    }
    return this.asText(value);
  },

  parseJson: function (value) {
    var text = this.asText(value);
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      console.warn('JSON parse error:', error);
      return null;
    }
  },

  joinDateRange: function (startDate, endDate) {
    var start = this.formatDisplayDate(startDate);
    var end = this.formatDisplayDate(endDate);
    if (start && end) return start + ' - ' + end;
    return start || end || '';
  },

  formatDisplayDate: function (value) {
    var text = this.asText(value);
    if (!text) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.slice(8, 10) + '/' + text.slice(5, 7) + '/' + text.slice(0, 4);
    var date = new Date(text);
    if (!isNaN(date.getTime())) return this.formatDateObject(date);
    return text;
  },

  formatDateObject: function (date) {
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = String(date.getFullYear());
    return day + '/' + month + '/' + year;
  },

  toNumber: function (value) {
    var number = Number(value);
    return isNaN(number) ? 0 : number;
  },

  normalizeText: function (value) {
    return this.asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

  asText: function (value) {
    if (value == null || value === 'null') return '';
    return String(value).trim();
  },

  escapeHtml: function (value) {
    return this.asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  showToast: function (message, type) {
    var toast = $('#toast');
    if (toast.length) {
      var iconClass = type === 'error' ? 'fa-solid fa-circle-xmark text-red-600' : type === 'success' ? 'fa-solid fa-circle-check text-emerald-600' : 'fa-solid fa-circle-info text-blue-600';
      var borderClass = type === 'error' ? 'border-red-500' : type === 'success' ? 'border-emerald-500' : 'border-blue-500';
      $('#toast-icon').attr('class', iconClass + ' text-xl');
      $('#toast-title').text(type === 'error' ? 'Atenção' : 'Informação');
      $('#toast-message').text(message);
      toast.attr('class', 'fixed top-24 right-4 z-[70] max-w-sm rounded-lg border-l-4 bg-white px-4 py-3 shadow-xl ' + borderClass);
      window.clearTimeout(window.__projectExecutionToastTimeout);
      window.__projectExecutionToastTimeout = window.setTimeout(function () {
        toast.addClass('hidden');
      }, 3200);
      return;
    }

    if (typeof FLUIGC !== 'undefined' && FLUIGC.toast) {
      FLUIGC.toast({ title: '', message: message, type: type || 'warning' });
      return;
    }

    alert(message);
  }
};
