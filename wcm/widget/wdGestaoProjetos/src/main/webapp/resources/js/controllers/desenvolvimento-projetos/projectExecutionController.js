var projectExecutionController = {
  _eventNamespace: '.projectExecution',
  _headerBackup: null, // Variável que guarda o estado original do cabeçalho

  _state: {
    documentId: '',
    estadoProcesso: '',
    datasetId: 'dsGetDesenvolvimentoProjetos', // Dataset do formulário
    phaseMilestones: {},   // Dados processados para renderizar o ecrã
    phaseOperationalData: {} // Dados de execução (progresso, status)
  },

  load: async function (params = {}) {
    const container = $('#page-container');
    this._state.documentId = this.asText(params.documentId);
    this._state.estadoProcesso = this.asText(params.estadoProcesso);

    try {
      const html = await $.get(this.getTemplateUrl());
      container.html(html);

      // Aplica a mudança no breadcrumb
      this.backupAndSetHeader();
      this.bindEvents();

      // 1. Carrega e processa o JSON do dataset
      await this.loadProjectData();
      
      // 2. Renderiza a interface
      this.renderAllPhases();
      this.updateSummaryFromPhases();

    } catch (error) {
      console.error('Project execution template load error:', error);
      container.html('<div class="p-6 text-red-600">Falha ao carregar o ecrã de Execução do Projeto.</div>');
    }
  },

  destroy: function () {
    this.unbindEvents();
    // Devolve o breadcrumb ao normal ao sair da tela
    this.restoreHeader();
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/desenvolvimento-projetos/dp-project-execution.html`;
  },

  bindEvents: function () {
    this.unbindEvents();
    
    // Checkboxes das tarefas
    $('#page-container').on(`change${this._eventNamespace}`, '.phase-task-checkbox', (e) => {
      const checkbox = e.currentTarget;
      const phaseId = checkbox.dataset.phaseId;
      const milestoneId = checkbox.dataset.milestoneId;
      const taskId = checkbox.dataset.taskId;
      
      this.toggleTaskStatus(phaseId, milestoneId, taskId, checkbox.checked);
    });
  },

  unbindEvents: function () {
    $('#page-container').off(this._eventNamespace);
  },

  // ---------------------------
  // Manipulação do Cabeçalho (Breadcrumbs)
  // ---------------------------

  backupAndSetHeader: function () {
    const header = $('#header');
    if (!header.length) return;

    const titleEl = header.find('h1').first();
    const breadcrumbEl = header.find('nav').first();

    if (!this._headerBackup) {
      this._headerBackup = {
        title: titleEl.length ? titleEl.text() : '',
        breadcrumbHtml: breadcrumbEl.length ? breadcrumbEl.html() : ''
      };
    }

    if (titleEl.length) {
      titleEl.text('Desenvolvimento - Execução do Projeto');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
          <i class="fa-solid fa-house text-xs"></i>
          <span>Início</span>
        </a>
        <span class="text-gray-400">/</span>
        <span class="text-gray-300">Portfólio</span>
        <span class="text-gray-400">/</span>
        <span class="text-bevap-gold font-medium">Execução do Projeto</span>
      `);
    }
  },

  restoreHeader: function () {
    if (!this._headerBackup) return;

    const header = $('#header');
    if (!header.length) return;

    const titleEl = header.find('h1').first();
    const breadcrumbEl = header.find('nav').first();

    if (titleEl.length) {
      titleEl.text(this._headerBackup.title || '');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(this._headerBackup.breadcrumbHtml || '');
    }

    this._headerBackup = null;
  },

  // ---------------------------
  // Integração e Processamento Pai x Filho
  // ---------------------------

  loadProjectData: async function () {
    const documentId = this._state.documentId;
    if (!documentId) return;

    try {
      const rows = await fluigService.getDatasetRows(this._state.datasetId, {
        constraints: [
          { fieldName: 'documentid', initialValue: documentId, finalValue: documentId, constraintType: 'MUST' },
          { fieldName: 'tablename', initialValue: 'DesenvolvimentoProjetos', finalValue: 'DesenvolvimentoProjetos', constraintType: 'MUST' }
        ]
      });

      const row = rows && rows.length ? rows[0] : null;
      if (!row) {
        this.showToast('Nenhum dado encontrado para este projeto.', 'warning');
        return;
      }

      this.processDataForExecution(row);

    } catch (error) {
      console.error('[projectExecutionController] loadProjectData error:', error);
      this.showToast('Erro ao carregar dados de execução.', 'error');
    }
  },

  processDataForExecution: function (row) {
    this._state.phaseMilestones = {};
    this._state.phaseOperationalData = {};

    let phases = [];
    let summaryTasks = [];
    let criteriaList = [];

    try {
      phases = row.tblWbsPhasesDP && row.tblWbsPhasesDP !== "null" ? JSON.parse(row.tblWbsPhasesDP) : [];
      summaryTasks = row.tblMilestoneTasksSummaryDP && row.tblMilestoneTasksSummaryDP !== "null" ? JSON.parse(row.tblMilestoneTasksSummaryDP) : [];
      criteriaList = row.tblMilestoneCriteriaDP && row.tblMilestoneCriteriaDP !== "null" ? JSON.parse(row.tblMilestoneCriteriaDP) : [];
    } catch (e) {
      console.error("Erro ao fazer parse do JSON Pai x Filho:", e);
    }

    // Ordenar Fases pela ordem definida no planejamento
    phases.sort((a, b) => (parseInt(a.wbsPhaseOrderDP) || 0) - (parseInt(b.wbsPhaseOrderDP) || 0));

    // Agrupar as Tarefas por Fase e por Marco
    phases.forEach((phase, index) => {
      const phaseKey = phase.wbsPhaseIdDP || `phase-${index + 1}`;
      const phaseName = this.asText(phase.wbsPhaseNameDP);
      const phaseResponsible = this.asText(phase.wbsPhaseResponsibleDP);
      
      this._state.phaseOperationalData[phaseKey] = {
        progress: 0,
        status: 'nao_iniciado'
      };

      // Filtrar as tarefas que pertencem a esta fase
      const tasksInThisPhase = summaryTasks.filter(t => this.asText(t.milestoneTaskSummaryPhaseDP) === phaseName);
      
      // Agrupar tarefas pelos nomes dos Marcos
      const milestonesMap = {};
      
      tasksInThisPhase.forEach(task => {
        const marcoChave = this.asText(task.milestoneTaskSummaryMarcoDP) || 'Marco Geral';
        
        if (!milestonesMap[marcoChave]) {
          milestonesMap[marcoChave] = {
            id: `milestone-${marcoChave.replace(/\s+/g, '-').toLowerCase()}`,
            nextMilestoneLabel: marcoChave,
            acceptanceCriteria: criteriaList.map(c => this.asText(c.milestoneCriteriaTextDP)).filter(Boolean),
            tasks: []
          };
        }

        const isDone = (task.milestoneTaskSummaryStartedDP === 'true' || task.milestoneTaskSummaryStartedDP === '1');

        milestonesMap[marcoChave].tasks.push({
          id: `task-${Math.random().toString(36).substr(2, 9)}`,
          name: this.asText(task.milestoneTaskSummaryTextDP),
          responsible: phaseResponsible,
          phaseName: phaseName,
          dueDate: this.asText(task.milestoneTaskSummaryDueDateDP),
          done: isDone,
          activityStatus: isDone ? 'concluida' : 'nao_iniciado'
        });
      });

      // Salva no estado principal
      this._state.phaseMilestones[phaseKey] = Object.values(milestonesMap);
    });
  },

  // ---------------------------
  // Renderização Dinâmica
  // ---------------------------

  renderAllPhases: function () {
    const phasesSection = $('#phases-container');
    phasesSection.empty();

    const phasesKeys = Object.keys(this._state.phaseMilestones);

    if (phasesKeys.length === 0) {
      phasesSection.html('<div class="p-6 text-gray-500 bg-white rounded-lg shadow">Nenhuma fase definida ou planeada.</div>');
      return;
    }

    phasesKeys.forEach((phaseKey, index) => {
      const milestones = this._state.phaseMilestones[phaseKey];
      const phaseName = milestones.length > 0 && milestones[0].tasks.length > 0 ? milestones[0].tasks[0].phaseName : `Fase ${index + 1}`;
      const phaseResp = milestones.length > 0 && milestones[0].tasks.length > 0 ? milestones[0].tasks[0].responsible : 'Não definido';
      
      const phaseHtml = this.getPhaseCardHtml(phaseKey, phaseName, phaseResp, index + 1);
      phasesSection.append(phaseHtml);
      
      this.renderPhaseMilestones(phaseKey);
      this.updatePhaseProgress(phaseKey);
    });
  },

  getPhaseCardHtml: function (phaseKey, phaseName, responsible, order) {
    return `
      <div id="${phaseKey}" data-phase-card class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div class="px-5 py-4 bg-white">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="phase-title text-base sm:text-lg font-montserrat font-bold text-bevap-navy">
                ${order}. ${this.escapeHtml(phaseName)}
              </h3>
              <div class="mt-2 flex flex-wrap items-center gap-2 text-gray-600" style="font-size: 13px;">
                <span class="inline-flex items-center px-2 py-1 rounded-full bg-bevap-navy text-white">
                  <i class="fa-solid fa-user-tie mr-1 text-blue-100"></i>Responsável: ${this.escapeHtml(responsible)}
                </span>
              </div>
            </div>
            <div class="phase-status-badge inline-flex items-center gap-1.5 px-3 py-1 border border-gray-200 bg-gray-50 text-gray-700 text-xs font-semibold rounded-full shrink-0">
              <i class="fa-regular fa-circle text-gray-500"></i><span>Não Iniciada</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Progresso</label>
              <span class="phase-progress-value text-sm font-bold text-bevap-navy">0%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="phase-progress-bar bg-blue-500 h-2.5 rounded-full transition-all" style="width: 0%"></div>
            </div>
          </div>
          <div class="mt-3 border-b border-gray-200"></div>
        </div>
        
        <div class="p-5 space-y-4">
          <div class="phase-acceptance-container"></div>
          
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-semibold text-gray-600 tracking-wide">Tarefas do Marco</span>
            </div>
            <div class="phase-milestones-list space-y-3" data-phase-key="${phaseKey}"></div>
          </div>
        </div>
      </div>
    `;
  },

  renderPhaseMilestones: function (phaseKey) {
    const phaseCard = $(`#${phaseKey}`);
    const container = phaseCard.find('.phase-milestones-list');
    const milestones = this._state.phaseMilestones[phaseKey] || [];

    if (milestones.length === 0) {
      container.html('<div class="text-sm text-gray-500">Nenhuma tarefa associada a este marco.</div>');
      return;
    }

    let milestonesHtml = '';
    milestones.forEach(milestone => {
      milestonesHtml += `
        <div class="bg-gradient-to-br from-slate-50 to-white border border-blue-100 rounded-xl p-3 mb-3">
          <h4 class="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide border-b pb-1 border-blue-100">
            Marco: ${this.escapeHtml(milestone.nextMilestoneLabel)}
          </h4>
          <div class="space-y-3">
            ${milestone.tasks.map(task => this.getTaskHtml(phaseKey, milestone.id, task)).join('')}
          </div>
        </div>
      `;
    });

    container.html(milestonesHtml);
  },

  getTaskHtml: function (phaseKey, milestoneId, task) {
    const statusLabel = task.done ? 'Concluída' : 'Pendente';
    const statusClass = task.done ? 'border-bbf7d0 text-green-800 bg-green-50' : 'border-d1d5db text-gray-600 bg-gray-50';
    
    return `
      <div class="relative rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:shadow transition-shadow">
        <label class="flex items-start gap-3 cursor-pointer">
          <div class="pt-1">
            <input type="checkbox" class="phase-task-checkbox w-4 h-4 text-bevap-green border-gray-300 rounded"
              data-phase-id="${phaseKey}" data-milestone-id="${milestoneId}" data-task-id="${task.id}" ${task.done ? 'checked' : ''}>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-bevap-navy leading-5">${this.escapeHtml(task.name)}</div>
            <div class="mt-2 flex flex-wrap items-center gap-2" style="font-size: 11px;">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-300 bg-gray-100 text-gray-700">
                <i class="fa-solid fa-user mr-1 text-gray-500"></i>${this.escapeHtml(task.responsible)}
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-300 bg-gray-100 text-gray-700">
                <i class="fa-solid fa-calendar-alt mr-1 text-gray-500"></i>${this.escapeHtml(task.dueDate || 'Sem data')}
              </span>
            </div>
          </div>
          <div class="shrink-0 pt-0.5">
             <span class="inline-flex items-center px-2 py-1 rounded-md border text-xs font-semibold ${statusClass}">${statusLabel}</span>
          </div>
        </label>
      </div>
    `;
  },

  toggleTaskStatus: function (phaseKey, milestoneId, taskId, isChecked) {
    const milestones = this._state.phaseMilestones[phaseKey] || [];
    
    milestones.forEach(m => {
      if (m.id === milestoneId) {
        m.tasks.forEach(t => {
          if (t.id === taskId) {
            t.done = isChecked;
            t.activityStatus = isChecked ? 'concluida' : 'em_andamento';
          }
        });
      }
    });

    this.renderPhaseMilestones(phaseKey);
    this.updatePhaseProgress(phaseKey);
    this.updateSummaryFromPhases();
  },

  updatePhaseProgress: function(phaseKey) {
    const phaseCard = $(`#${phaseKey}`);
    const milestones = this._state.phaseMilestones[phaseKey] || [];
    
    const allTasks = milestones.flatMap(m => m.tasks);
    if (allTasks.length === 0) return;

    const completedTasks = allTasks.filter(t => t.done).length;
    const progress = Math.round((completedTasks / allTasks.length) * 100);

    phaseCard.find('.phase-progress-value').text(`${progress}%`);
    phaseCard.find('.phase-progress-bar').css('width', `${progress}%`);

    const badge = phaseCard.find('.phase-status-badge');
    if (progress === 0) {
      badge.attr('class', 'phase-status-badge inline-flex items-center gap-1.5 px-3 py-1 border border-gray-200 bg-gray-50 text-gray-700 text-xs font-semibold rounded-full shrink-0');
      badge.html('<i class="fa-regular fa-circle text-gray-500"></i><span>Não Iniciada</span>');
    } else if (progress === 100) {
      badge.attr('class', 'phase-status-badge inline-flex items-center gap-1.5 px-3 py-1 border border-green-200 bg-green-50 text-green-700 text-xs font-semibold rounded-full shrink-0');
      badge.html('<i class="fa-solid fa-circle-check text-green-600"></i><span>Concluída</span>');
    } else {
      badge.attr('class', 'phase-status-badge inline-flex items-center gap-1.5 px-3 py-1 border border-yellow-200 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full shrink-0');
      badge.html('<i class="fa-solid fa-hourglass-half text-yellow-600"></i><span>Em Andamento</span>');
    }
  },

  updateSummaryFromPhases: function () {
    const phasesKeys = Object.keys(this._state.phaseMilestones);
    if (phasesKeys.length === 0) return;

    let totalProgress = 0;
    let completedCount = 0;

    phasesKeys.forEach(phaseKey => {
      const milestones = this._state.phaseMilestones[phaseKey];
      const tasks = milestones.flatMap(m => m.tasks);
      
      let p = 0;
      if (tasks.length > 0) {
        const done = tasks.filter(t => t.done).length;
        p = (done / tasks.length) * 100;
      }
      totalProgress += p;
      if (p === 100) completedCount++;
    });

    const averageProgress = Math.round(totalProgress / phasesKeys.length);

    $('#execution-progress-text').text(`${averageProgress}%`);
    $('#execution-progress-bar').css('width', `${averageProgress}%`);
    $('#completed-phases-count').text(`${completedCount} de ${phasesKeys.length}`);
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') return '';
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

  showToast: function (message, type = 'info') {
    alert(message);
  }
};