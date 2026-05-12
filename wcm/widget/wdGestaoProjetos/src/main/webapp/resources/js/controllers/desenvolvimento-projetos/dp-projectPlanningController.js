var projectPlanningController = {
  _eventNamespace: '.projectPlanning',
  _projectFields: ['documentid', 'titulodoprojetoNS', 'areaUnidadeNS', 'patrocinadorNS', 'prioridadeNS', 'estadoProcesso', 'projectPlanningJsonDP'],

  _nextStateAfterPlanning: '16',

  _headerBackup: null,
  _globalsBackup: null,
  _pendingDeleteAction: null,
  _toastTimeoutId: null,

  _raciMatrixData: [],
  _raciRemovedStakeholdersByPhase: new Map(),
  _teamAllocationData: [],

  _state: {
    documentId: '',
    estadoProcesso: '',
    processType: '',
    processName: '',
    datasetId: '',
    formName: '',
    currentStep: 1,
    totalSteps: 5,
    stepLabels: {
      1: 'EAP/WBS',
      2: 'Cronograma',
      3: 'Riscos',
      4: 'RACI',
      5: 'Documentos'
    }
  },

  _responsibleOptions: [
    'Ana Costa',
    'TechPartners',
    'Carlos Silva',
    'Mariana Lima',
    'Rafael Souza',
    'Equipe Infraestrutura',
    'Segurança da Informação',
    'PMO Corporativo'
  ],

  load: async function (params = {}) {
    const container = $('#page-container');

    this._state.documentId = this.asText(params.documentId);
    this._state.estadoProcesso = this.asText(params.estadoProcesso);
    this._state.processType = this.asText(params.processType);
    this._state.processName = this.asText(params.processName);
    this._state.datasetId = this.asText(params.datasetId);
    this._state.formName = this.asText(params.formName);
    this._state.currentStep = 1;

    try {
      const html = await $.get(this.getTemplateUrl());
      container.html(html);

      this.backupAndSetHeader();
      await this.ensureLibsLoaded();

      this.registerGlobals();
      this.bindEvents();
      this.initializeUi();

      await this.loadProjectSummary();
      await this.loadPlanningDraft();
    } catch (error) {
      console.error('Project planning template load error:', error);
      container.html('<div class="p-6 text-red-600">Falha ao carregar a tela de Planejamento do Projeto.</div>');
    }
  },

  destroy: function () {
    this.unbindEvents();
    this.unregisterGlobals();
    this.restoreHeader();
    this._pendingDeleteAction = null;

    if (this._toastTimeoutId) {
      clearTimeout(this._toastTimeoutId);
      this._toastTimeoutId = null;
    }
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/desenvolvimento-projetos/dp-project-planning.html`;
  },

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
      titleEl.text('Desenvolvimento - Planejamento do Projeto');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Planejamento do Projeto</span>
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

  ensureLibsLoaded: async function () {
    const tasks = [];

    if (typeof window.Sortable === 'undefined') {
      tasks.push(this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.2/Sortable.min.js', 'gp-sortable'));
    }

    if (typeof window.moment === 'undefined') {
      tasks.push(this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js', 'gp-moment'));
    }

    if (typeof $.fn.daterangepicker === 'undefined') {
      tasks.push(this.loadCssOnce('https://cdnjs.cloudflare.com/ajax/libs/bootstrap-daterangepicker/3.1/daterangepicker.min.css', 'gp-daterangepicker-css'));
      tasks.push(this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/bootstrap-daterangepicker/3.1/daterangepicker.min.js', 'gp-daterangepicker'));
    }

    try {
      await Promise.all(tasks);
    } catch (error) {
      console.warn('[projectPlanningController] Falha ao carregar bibliotecas externas:', error);
    }
  },

  loadScriptOnce: function (src, id) {
    return new Promise((resolve, reject) => {
      if (id && document.getElementById(id)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      if (id) script.id = id;
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
      document.head.appendChild(script);
    });
  },

  loadCssOnce: function (href, id) {
    return new Promise((resolve) => {
      if (id && document.getElementById(id)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      if (id) link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  },

  bindEvents: function () {
    this.unbindEvents();

    // Toggle de painéis (Fases e Marcos): clique no header (exceto inputs/botoes)
    $(document).on(`click${this._eventNamespace}`, (event) => {
      const header = event.target.closest('.panel-toggle-header');
      if (!header) return;
      if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;

      const panelItem = header.closest('.wbs-item, .milestone-card');
      if (!panelItem) return;

      const panelContent = panelItem.querySelector(':scope > .wbs-panel-content')
        || panelItem.querySelector(':scope > .milestone-panel-content');

      if (panelContent) {
        panelContent.classList.toggle('hidden');
      }
    });

    // Fecha dropdowns de responsável quando clica fora
    $(document).on(`click${this._eventNamespace}`, (event) => {
      const target = event.target;
      if (!target) return;
      if (target.closest('.responsible-search-field')) return;

      document.querySelectorAll('.responsible-search-field').forEach((field) => {
        field.dataset.dropdownOpen = 'false';
        this.refreshResponsibleSearchField(field);
      });
    });

    // Fecha dropdowns de RACI quando clica fora
    $(document).on(`click${this._eventNamespace}`, (event) => {
      const target = event.target;
      if (!target) return;
      if (target.closest('.raci-stakeholder-search-field')) return;

      document.querySelectorAll('.raci-stakeholder-search-field').forEach((field) => {
        field.dataset.dropdownOpen = 'false';
        this.refreshRaciStakeholderSearchField(field);
      });
    });

    // Atualiza RACI/Alocação quando a WBS mudar
    $(document).on(`input${this._eventNamespace} change${this._eventNamespace}`, '#wbs-container input, #wbs-container textarea, #wbs-container select', () => {
      this.onWbsChanged();
    });
  },

  unbindEvents: function () {
    $(document).off(this._eventNamespace);
    $('#page-container').off(this._eventNamespace);
  },

  initializeUi: function () {
    this.goToStep(1);
    this.initResponsibleSearchFields(document);

    // Inicializa daterangepicker nos inputs existentes (se a lib estiver disponivel)
    this.initializeMilestoneDatePickers(document);

    // Prepara um estado inicial para o plano de comunicação
    if (!document.querySelector('#communication-plan-body tr')) {
      this.addCommunicationPlanRow();
    }

    // Estado inicial vazio para RACI/Alocação
    this._raciMatrixData = [];
    this._raciRemovedStakeholdersByPhase = new Map();
    this._teamAllocationData = [];
    this.renderRaciAndResources();

    // Ajusta texto do modal de conclusão (placeholder)
    this.setConcludeModalText('-', '-');
  },

  initializeMilestoneDatePickers: function (rootElement) {
    if (!rootElement) return;
    if (typeof $.fn.daterangepicker === 'undefined') return;

    $(rootElement).find('.milestone-period-input').each(function () {
      const input = $(this);
      if (input.data('gp-daterangepicker-ready')) {
        return;
      }

      try {
        input.daterangepicker({
          autoUpdateInput: true,
          locale: {
            format: 'YYYY-MM-DD',
            applyLabel: 'Aplicar',
            cancelLabel: 'Cancelar',
            fromLabel: 'De',
            toLabel: 'Até'
          }
        });

        input.on('apply.daterangepicker', function (ev, picker) {
          const start = picker && picker.startDate ? picker.startDate.format('YYYY-MM-DD') : '';
          const end = picker && picker.endDate ? picker.endDate.format('YYYY-MM-DD') : '';
          input.val(start && end ? `${start} até ${end}` : '');
        });

        input.data('gp-daterangepicker-ready', true);
      } catch (error) {
        // fallback silencioso
      }
    });
  },

  registerGlobals: function () {
    if (this._globalsBackup) return;

    const names = [
      'goToStep',
      'previousStep',
      'nextStep',
      'addPhase',
      'removeItem',
      'addDependencyItem',
      'addSubtask',
      'addMilestone',
      'removeMilestone',
      'addMilestoneCriteria',
      'addMilestoneTask',
      'addRisk',
      'addDependency',
      'addCommunicationPlanRow',
      'openReturnModal',
      'closeReturnModal',
      'submitReturn',
      'openCancelModal',
      'closeCancelModal',
      'submitCancel',
      'concludePlanning',
      'closeConcludeModal',
      'confirmConcludePlanning',
      'openDeleteModal',
      'closeDeleteModal',
      'confirmDelete',
      'saveDraft',
      'showTimeline',
      'showAttachments'
    ];

    this._globalsBackup = {};

    names.forEach((name) => {
      this._globalsBackup[name] = window[name];
    });

    window.goToStep = (step) => this.goToStep(step);
    window.previousStep = () => this.previousStep();
    window.nextStep = () => this.nextStep();

    window.addPhase = () => this.addPhase();
    window.removeItem = (el) => this.removeItem(el);
    window.addDependencyItem = (el) => this.addDependencyItem(el);
    window.addSubtask = (el) => this.addSubtask(el);

    window.addMilestone = () => this.addMilestone();
    window.removeMilestone = (el) => this.removeMilestone(el);
    window.addMilestoneCriteria = (el) => this.addMilestoneCriteria(el);
    window.addMilestoneTask = (el) => this.addMilestoneTask(el);

    window.addRisk = () => this.addRisk();
    window.addDependency = () => this.addExternalDependency();

    window.addCommunicationPlanRow = () => this.addCommunicationPlanRow();

    window.openReturnModal = () => this.openReturnModal();
    window.closeReturnModal = () => this.closeReturnModal();
    window.submitReturn = () => this.submitReturn();

    window.openCancelModal = () => this.openCancelModal();
    window.closeCancelModal = () => this.closeCancelModal();
    window.submitCancel = () => this.submitCancel();

    window.concludePlanning = () => this.openConcludeModal();
    window.closeConcludeModal = () => this.closeConcludeModal();
    window.confirmConcludePlanning = () => this.confirmConcludePlanning();

    window.openDeleteModal = (message, onConfirm) => this.openDeleteModal(message, onConfirm);
    window.closeDeleteModal = () => this.closeDeleteModal();
    window.confirmDelete = () => this.confirmDelete();

    window.saveDraft = () => this.saveDraft();
    window.showTimeline = () => this.showTimeline();
    window.showAttachments = () => this.showAttachments();
  },

  unregisterGlobals: function () {
    if (!this._globalsBackup) return;

    Object.keys(this._globalsBackup).forEach((name) => {
      if (this._globalsBackup[name] === undefined) {
        try {
          delete window[name];
        } catch (error) {
          window[name] = undefined;
        }
      } else {
        window[name] = this._globalsBackup[name];
      }
    });

    this._globalsBackup = null;
  },

  // ---------------------------
  // Project summary
  // ---------------------------

  loadProjectSummary: async function () {
    const documentId = this.asText(this._state.documentId);

    if (!documentId) {
      this.showToast('documentId não informado na rota.', 'warning');
      return;
    }

    let processContext = null;

    try {
      processContext = await fluigService.resolveProjectProcessContext({
        documentId: documentId,
        processType: this._state.processType,
        processName: this._state.processName,
        fields: this._projectFields,
      });
    } catch (error) {
      console.error('[projectPlanningController] Erro resolvendo contexto do processo:', error);
    }

    if (processContext) {
      this._state.processType = this.asText(processContext.processType);
      this._state.processName = this.asText(processContext.processName);
      this._state.datasetId = this.asText(processContext.datasetId);
      this._state.formName = this.asText(processContext.formName);
      this._state.estadoProcesso = this.asText(processContext.estadoProcesso || this._state.estadoProcesso);
    }

    let projectCode = this.asText(processContext && processContext.codigoglpi);
    if (!projectCode) {
      try {
        projectCode = await fluigService.resolveProjectSummaryCode({ documentId });
      } catch (error) {
        projectCode = '';
      }
    }

    const row = processContext;
    const title = this.asText(row && row.titulodoprojetoNS) || '-';
    const area = this.asText(row && row.areaUnidadeNS) || '-';
    const sponsor = this.asText(row && row.patrocinadorNS) || '-';
    const priority = this.asText(row && row.prioridadeNS) || '-';
    const processLabel = this.asText(row && row.processLabel) || fluigService.getProjectProcessLabel(this._state.processType);
    const formName = this.asText(row && row.formName) || this.asText(this._state.formName);

    $('#project-summary-code').text(projectCode || documentId || '-');
    $('#project-summary-title').text(title);
    $('#project-summary-area').text(area);
    $('#project-summary-sponsor').text(sponsor);

    const priorityEl = $('#project-summary-priority');
    if (priorityEl.length) {
      const badge = this.getPriorityBadge(priority);
      priorityEl.attr('class', badge.className).html(badge.html);
    }

    const typeEl = $('#project-summary-type');
    if (typeEl.length) {
      typeEl.text(processLabel && formName ? `${processLabel} - ${formName}` : processLabel || formName || '-');
    }

    this.setConcludeModalText(projectCode || documentId || '-', title);
  },

  // ---------------------------
  // Draft load / apply
  // ---------------------------

  loadPlanningDraft: async function () {
    const documentId = this.asText(this._state.documentId);
    if (!documentId) {
      return;
    }

    const datasetId = this.asText(this._state.datasetId) || 'dsGetDesenvolvimentoProjetos';

    try {
      const rows = await fluigService.getDatasetRows(datasetId, {
        fields: ['documentid', 'projectPlanningJsonDP'],
        filters: {
          documentid: documentId,
          sqlLimit: 1
        }
      });

      const row = rows && rows.length ? rows[0] : null;
      const rawJson = this.asText(row && row.projectPlanningJsonDP);
      if (!rawJson) {
        return;
      }

      let payload = null;
      try {
        payload = JSON.parse(rawJson);
      } catch (error) {
        throw new Error('JSON de planejamento inválido no card');
      }

      this.applyPlanningPayload(payload);
      this.showToast('Rascunho carregado.', 'info');
    } catch (error) {
      console.error('[projectPlanningController] loadPlanningDraft error:', error);
      this.showToast(`Falha ao carregar rascunho: ${this.asText(error && (error.message || error)) || 'erro'}`, 'warning');
    }
  },

  applyPlanningPayload: function (payload) {
    const finalPayload = payload && typeof payload === 'object' ? payload : {};

    // limpa UI
    const wbsContainer = document.getElementById('wbs-container');
    if (wbsContainer) wbsContainer.innerHTML = '';
    const milestonesContainer = document.getElementById('milestones-container');
    if (milestonesContainer) milestonesContainer.innerHTML = '';
    const risksContainer = document.getElementById('risk-matrix-list');
    if (risksContainer) risksContainer.innerHTML = '';
    const depsContainer = document.getElementById('external-dependencies-list');
    if (depsContainer) depsContainer.innerHTML = '';
    const commBody = document.getElementById('communication-plan-body');
    if (commBody) commBody.innerHTML = '';

    // WBS
    const phases = finalPayload.wbs && Array.isArray(finalPayload.wbs.phases) ? finalPayload.wbs.phases : [];
    phases.forEach((phase) => {
      this.addPhase();

      const phaseEls = document.querySelectorAll('#wbs-container > .wbs-item');
      const phaseEl = phaseEls && phaseEls.length ? phaseEls[phaseEls.length - 1] : null;
      if (!phaseEl) return;

      const panel = phaseEl.querySelector('.wbs-panel-content');
      const nameInput = phaseEl.querySelector('.wbs-phase-name-input');
      if (nameInput) nameInput.value = this.asText(phase && phase.name);

      const respInput = panel && panel.querySelector('.responsible-search-input');
      if (respInput) respInput.value = this.asText(phase && phase.responsible);

      const effortInput = panel && panel.querySelector('.wbs-phase-effort');
      if (effortInput) effortInput.value = this.asText(phase && phase.effortHours);

      const durationInput = panel && panel.querySelector('.wbs-phase-duration');
      if (durationInput) durationInput.value = this.asText(phase && phase.durationDays);

      const notesInput = panel && panel.querySelector('textarea');
      if (notesInput) notesInput.value = this.asText(phase && phase.notes);

      // dependencies
      const deps = Array.isArray(phase && phase.dependencies) ? phase.dependencies : [];
      deps.forEach((depText) => {
        const btn = panel && panel.querySelector('button[onclick="addDependencyItem(this)"]');
        if (!btn) return;
        this.addDependencyItem(btn);
        const list = panel.querySelector('.dependency-list');
        const last = list && list.lastElementChild ? list.lastElementChild.querySelector('input') : null;
        if (last) last.value = this.asText(depText);
      });

      // tasks
      const tasks = Array.isArray(phase && phase.tasks) ? phase.tasks : [];
      tasks.forEach((task) => {
        const btn = panel && panel.querySelector('button[onclick="addSubtask(this)"]');
        if (!btn) return;
        this.addSubtask(btn);

        const taskEls = phaseEl.querySelectorAll('.subtask-container .wbs-subtask');
        const taskEl = taskEls && taskEls.length ? taskEls[taskEls.length - 1] : null;
        if (!taskEl) return;

        const taskNameInput = taskEl.querySelector('.wbs-task-name-input');
        if (taskNameInput) taskNameInput.value = this.asText(task && task.name);

        const taskResp = taskEl.querySelector('.responsible-search-input');
        if (taskResp) taskResp.value = this.asText(task && task.responsible);

        const taskEffort = taskEl.querySelector('.task-effort');
        if (taskEffort) taskEffort.value = this.asText(task && task.effortHours);

        const taskDuration = taskEl.querySelector('.task-duration');
        if (taskDuration) taskDuration.value = this.asText(task && task.durationDays);

        const taskDeps = Array.isArray(task && task.dependencies) ? task.dependencies : [];
        taskDeps.forEach((depText) => {
          const depBtn = taskEl.querySelector('button[onclick="addDependencyItem(this)"]');
          if (!depBtn) return;
          this.addDependencyItem(depBtn);
          const list = taskEl.querySelector('.dependency-list');
          const last = list && list.lastElementChild ? list.lastElementChild.querySelector('input') : null;
          if (last) last.value = this.asText(depText);
        });
      });

      this.initResponsibleSearchFields(phaseEl);
    });

    this.updateWbsNumbers();

    // Milestones
    const milestones = finalPayload.milestones && Array.isArray(finalPayload.milestones.items)
      ? finalPayload.milestones.items
      : [];
    milestones.forEach((milestone) => {
      this.addMilestone();

      const milestoneEls = document.querySelectorAll('#milestones-container > .milestone-card');
      const milestoneEl = milestoneEls && milestoneEls.length ? milestoneEls[milestoneEls.length - 1] : null;
      if (!milestoneEl) return;

      const nameInput = milestoneEl.querySelector('.milestone-phase-input');
      const periodInput = milestoneEl.querySelector('.milestone-period-input');
      if (nameInput) nameInput.value = this.asText(milestone && milestone.name);
      if (periodInput) periodInput.value = this.asText(milestone && milestone.period);

      const criteria = Array.isArray(milestone && milestone.criteria) ? milestone.criteria : [];
      const criteriaList = milestoneEl.querySelector('.milestone-criteria-list');
      if (criteriaList) {
        criteriaList.innerHTML = '';
        if (!criteria.length) {
          const btn = milestoneEl.querySelector('button[onclick="addMilestoneCriteria(this)"]');
          if (btn) this.addMilestoneCriteria(btn);
        } else {
          criteria.forEach((crit) => {
            const btn = milestoneEl.querySelector('button[onclick="addMilestoneCriteria(this)"]');
            if (!btn) return;
            this.addMilestoneCriteria(btn);
            const last = criteriaList.lastElementChild ? criteriaList.lastElementChild.querySelector('input') : null;
            if (last) last.value = this.asText(crit);
          });
        }
      }

      const tasks = Array.isArray(milestone && milestone.tasks) ? milestone.tasks : [];
      const taskList = milestoneEl.querySelector('.milestone-tasks-list');
      if (taskList) {
        taskList.innerHTML = '';
        if (!tasks.length) {
          const btn = milestoneEl.querySelector('button[onclick="addMilestoneTask(this)"]');
          if (btn) this.addMilestoneTask(btn);
        } else {
          tasks.forEach((t) => {
            const btn = milestoneEl.querySelector('button[onclick="addMilestoneTask(this)"]');
            if (!btn) return;
            this.addMilestoneTask(btn);
            const lastRow = taskList.lastElementChild;
            if (!lastRow) return;
            const textInput = lastRow.querySelector('input[type="text"]');
            const dateInput = lastRow.querySelector('input[type="date"]');
            if (textInput) textInput.value = this.asText(t && t.task);
            if (dateInput) dateInput.value = this.asText(t && t.dueDate);
          });
        }
      }

      this.initializeMilestoneDatePickers(milestoneEl);
    });

    // Risks (addRisk usa prepend; carrega invertendo para preservar ordem)
    const risks = finalPayload.risks && Array.isArray(finalPayload.risks.items) ? finalPayload.risks.items : [];
    risks.slice().reverse().forEach((risk) => {
      this.addRisk();
      const card = document.querySelector('#risk-matrix-list > div');
      if (!card) return;
      const inputs = card.querySelectorAll('input');
      const textareas = card.querySelectorAll('textarea');
      if (inputs[0]) inputs[0].value = this.asText(risk && risk.description);
      if (inputs[1]) inputs[1].value = this.asText(risk && risk.probabilityImpact);
      if (textareas[0]) textareas[0].value = this.asText(risk && risk.mitigation);
      if (textareas[1]) textareas[1].value = this.asText(risk && risk.planB);
    });

    // External dependencies (addExternalDependency usa prepend; carrega invertendo)
    const extDeps = finalPayload.externalDependencies && Array.isArray(finalPayload.externalDependencies.items)
      ? finalPayload.externalDependencies.items
      : [];
    extDeps.slice().reverse().forEach((dep) => {
      this.addExternalDependency();
      const card = document.querySelector('#external-dependencies-list > div');
      if (!card) return;
      const inputs = card.querySelectorAll('input');
      const textareas = card.querySelectorAll('textarea');
      if (inputs[0]) inputs[0].value = this.asText(dep && dep.description);
      if (inputs[1]) inputs[1].value = this.asText(dep && dep.responsible);
      if (textareas[0]) textareas[0].value = this.asText(dep && dep.mitigation);
      if (textareas[1]) textareas[1].value = this.asText(dep && dep.planB);
    });

    // Communication plan
    const commItems = finalPayload.communicationPlan && Array.isArray(finalPayload.communicationPlan.items)
      ? finalPayload.communicationPlan.items
      : [];
    if (!commItems.length) {
      this.addCommunicationPlanRow();
    } else {
      commItems.forEach((item) => {
        this.addCommunicationPlanRow();
        const rows = commBody ? Array.from(commBody.querySelectorAll('tr')) : [];
        const rowEl = rows.length ? rows[rows.length - 1] : null;
        if (!rowEl) return;
        const audience = rowEl.querySelector('input');
        const selects = Array.from(rowEl.querySelectorAll('select'));
        if (audience) audience.value = this.asText(item && item.audience);
        if (selects[0]) selects[0].value = this.asText(item && item.channel);
        if (selects[1]) selects[1].value = this.asText(item && item.frequency);
      });
    }

    // RACI
    const raciRows = finalPayload.raci && Array.isArray(finalPayload.raci.rows) ? finalPayload.raci.rows : [];
    this._raciMatrixData = raciRows.map((row) => ({
      phase: this.asText(row && row.phase),
      r: this.normalizeStakeholderField(row && row.r),
      a: this.normalizeStakeholderField(row && row.a),
      c: this.normalizeStakeholderField(row && row.c),
      i: this.normalizeStakeholderField(row && row.i)
    }));

    const removed = finalPayload.raci && finalPayload.raci.removedStakeholdersByPhase && typeof finalPayload.raci.removedStakeholdersByPhase === 'object'
      ? finalPayload.raci.removedStakeholdersByPhase
      : {};
    this._raciRemovedStakeholdersByPhase = new Map(
      Object.keys(removed).map((key) => [key, new Set(Array.isArray(removed[key]) ? removed[key] : [])])
    );

    // re-sync + render
    this.syncRaciAndAllocationInternal();
    this.renderRaciAndResources();
    this.updateDocumentsPlanSummary();
  },

  setConcludeModalText: function (projectCode, title) {
    const el = document.getElementById('conclude-modal-text');
    if (!el) return;

    const safeCode = this.escapeHtml(this.asText(projectCode) || '-');
    const safeTitle = this.escapeHtml(this.asText(title) || '-');
    el.innerHTML = `Você está concluindo o planejamento do projeto <strong>${safeCode} • ${safeTitle}</strong>.`;
  },

  getPriorityBadge: function (priority) {
    const normalized = this.asText(priority)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized === 'critico' || normalized.indexOf('critico') !== -1) {
      return {
        className: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium',
        html: '<i class="fa-solid fa-circle-exclamation mr-1"></i> Crítico'
      };
    }

    if (normalized === 'estrategico' || normalized.indexOf('estrategico') !== -1) {
      return {
        className: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium',
        html: '<i class="fa-solid fa-star mr-1"></i> Estratégico'
      };
    }

    if (normalized === 'operacional' || normalized.indexOf('operacional') !== -1) {
      return {
        className: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-800 font-medium',
        html: '<i class="fa-solid fa-briefcase mr-1"></i> Operacional'
      };
    }

    const label = this.escapeHtml(this.asText(priority) || 'Sem prioridade');
    return {
      className: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-800 font-medium',
      html: label
    };
  },

  // ---------------------------
  // Stepper
  // ---------------------------

  goToStep: function (step) {
    const nextStep = parseInt(step, 10);
    if (!Number.isFinite(nextStep)) return;

    if (nextStep < 1 || nextStep > this._state.totalSteps) return;

    const currentStep = this._state.currentStep;
    const current = document.getElementById('step-' + currentStep);
    const next = document.getElementById('step-' + nextStep);

    if (current) current.classList.add('hidden');
    if (next) next.classList.remove('hidden');

    this._state.currentStep = nextStep;

    window.scrollTo({ top: 0, behavior: 'auto' });

    this.updateStepLabel();
    this.updateStepper();
    this.updateNavButtons();
    this.updatePlanProgress();

    if (nextStep === 4) {
      this.renderRaciAndResources();
    }
  },

  onWbsChanged: function () {
    this.syncRaciAndAllocationInternal();

    const step4 = document.getElementById('step-4');
    const isStep4Visible = step4 && !step4.classList.contains('hidden');
    if (isStep4Visible) {
      this.renderRaciAndResources();
    }

    this.updateDocumentsPlanSummary();
  },

  previousStep: function () {
    if (this._state.currentStep <= 1) return;
    this.goToStep(this._state.currentStep - 1);
  },

  nextStep: function () {
    if (this._state.currentStep >= this._state.totalSteps) return;
    this.goToStep(this._state.currentStep + 1);
  },

  updateStepLabel: function () {
    const stepLabel = document.getElementById('current-step');
    if (stepLabel) stepLabel.textContent = `Etapa ${this._state.currentStep}`;
  },

  updateNavButtons: function () {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const nextLabel = document.getElementById('next-btn-label');
    if (!prevBtn || !nextBtn) return;

    prevBtn.disabled = this._state.currentStep === 1;
    nextBtn.disabled = false;

    if (this._state.currentStep < this._state.totalSteps) {
      nextBtn.classList.remove('hidden');
      if (nextLabel) nextLabel.textContent = `Próximo: ${this._state.stepLabels[this._state.currentStep + 1]}`;
    } else {
      nextBtn.classList.add('hidden');
    }
  },

  updateStepper: function () {
    const partial = 35;
    const currentStep = this._state.currentStep;

    for (let i = 1; i <= this._state.totalSteps; i++) {
      const indicator = document.getElementById(`step-indicator-${i}`);
      const label = document.getElementById(`step-label-${i}`);
      if (!indicator) continue;

      if (i <= currentStep) {
        indicator.classList.remove('bg-gray-300', 'text-gray-600');
        indicator.classList.add('bg-bevap-green', 'text-white');
        if (label) {
          label.classList.remove('text-gray-600');
          label.classList.add('text-bevap-green', 'font-medium');
        }
      } else {
        indicator.classList.remove('bg-bevap-green', 'text-white');
        indicator.classList.add('bg-gray-300', 'text-gray-600');
        if (label) {
          label.classList.remove('text-bevap-green', 'font-medium');
          label.classList.add('text-gray-600');
        }
      }

      indicator.textContent = String(i);
    }

    const progressMap = {
      'progress-1-2': 0,
      'progress-2-3': 0,
      'progress-3-4': 0,
      'progress-4-5': 0
    };

    if (currentStep === 1) {
      progressMap['progress-1-2'] = partial;
    } else if (currentStep === 2) {
      progressMap['progress-1-2'] = 100;
      progressMap['progress-2-3'] = partial;
    } else if (currentStep === 3) {
      progressMap['progress-1-2'] = 100;
      progressMap['progress-2-3'] = 100;
      progressMap['progress-3-4'] = partial;
    } else if (currentStep === 4) {
      progressMap['progress-1-2'] = 100;
      progressMap['progress-2-3'] = 100;
      progressMap['progress-3-4'] = 100;
      progressMap['progress-4-5'] = partial;
    } else if (currentStep === 5) {
      progressMap['progress-1-2'] = 100;
      progressMap['progress-2-3'] = 100;
      progressMap['progress-3-4'] = 100;
      progressMap['progress-4-5'] = 100;
    }

    Object.entries(progressMap).forEach(([id, width]) => {
      const bar = document.getElementById(id);
      if (bar) bar.style.width = `${width}%`;
    });
  },

  updatePlanProgress: function () {
    const progressText = document.getElementById('plan-progress-text');
    const progressBar = document.getElementById('plan-progress-bar');
    const percentage = Math.round((this._state.currentStep / this._state.totalSteps) * 100);

    if (progressText) progressText.textContent = `${percentage}%`;
    if (progressBar) progressBar.style.width = `${percentage}%`;

    this.updateDocumentsPlanSummary();
  },

  updateDocumentsPlanSummary: function () {
    const payload = this.buildPlanningPayload();

    const phasesCount = (payload.wbs && Array.isArray(payload.wbs.phases)) ? payload.wbs.phases.length : 0;
    const effortHours = (payload.wbs && payload.wbs.summary && Number.isFinite(payload.wbs.summary.totalEffortHours))
      ? payload.wbs.summary.totalEffortHours
      : 0;
    const durationDays = (payload.wbs && payload.wbs.summary && Number.isFinite(payload.wbs.summary.totalDurationDays))
      ? payload.wbs.summary.totalDurationDays
      : 0;

    const highRisks = (payload.risks && Array.isArray(payload.risks.items))
      ? payload.risks.items.filter((r) => {
          const text = this.asText(r && (r.probabilityImpact || r.probability || r.impact)).toLowerCase();
          return text.indexOf('alta') !== -1 || text.indexOf('high') !== -1;
        }).length
      : 0;

    const phasesEl = document.getElementById('plan-summary-phases');
    const effortEl = document.getElementById('plan-summary-effort');
    const durationEl = document.getElementById('plan-summary-duration');
    const highRisksEl = document.getElementById('plan-summary-high-risks');

    if (phasesEl) phasesEl.textContent = String(phasesCount);
    if (effortEl) effortEl.textContent = String(effortHours);
    if (durationEl) durationEl.textContent = String(durationDays);
    if (highRisksEl) highRisksEl.textContent = String(highRisks);
  },

  // ---------------------------
  // Responsible search field (protótipo)
  // ---------------------------

  refreshResponsibleSearchField: function (fieldElement) {
    if (!fieldElement) return;

    const searchInput = fieldElement.querySelector('.responsible-search-input');
    const clearButton = fieldElement.querySelector('.responsible-search-clear');
    const toggleButton = fieldElement.querySelector('.responsible-search-toggle');
    const dropdown = fieldElement.querySelector('.responsible-search-dropdown');
    if (!searchInput || !dropdown) return;

    const searchText = (searchInput.value || '').trim();
    const searchTextLower = searchText.toLowerCase();

    const exactMatch = this._responsibleOptions.find((name) => name.toLowerCase() === searchTextLower);
    if (exactMatch && (document.activeElement !== searchInput || searchTextLower === exactMatch.toLowerCase())) {
      searchInput.value = exactMatch;
    }

    const hasInputValue = Boolean((searchInput.value || '').trim());
    if (clearButton) {
      clearButton.classList.toggle('hidden', !hasInputValue);
      clearButton.classList.toggle('right-2', hasInputValue);
      clearButton.classList.toggle('right-8', !hasInputValue);
    }
    if (toggleButton) {
      toggleButton.classList.toggle('hidden', hasInputValue);
    }

    const filteredOptions = searchText
      ? this._responsibleOptions.filter((name) => name.toLowerCase().includes(searchTextLower))
      : this._responsibleOptions;

    const isFocused = document.activeElement === searchInput;
    const shouldShowDropdown = fieldElement.dataset.dropdownOpen === 'true' && (isFocused || Boolean(searchText));

    if (!shouldShowDropdown) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      return;
    }

    if (!filteredOptions.length) {
      dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">Nenhum responsável encontrado</div>';
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = filteredOptions
      .map((name) => `
        <button type="button" class="responsible-search-option w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" data-value="${this.escapeHtml(name)}">
          ${this.escapeHtml(name)}
        </button>
      `)
      .join('');

    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.responsible-search-option').forEach((optionElement) => {
      optionElement.addEventListener('mousedown', (event) => event.preventDefault());
      optionElement.addEventListener('click', () => {
        const selectedValue = optionElement.getAttribute('data-value') || '';
        searchInput.value = selectedValue;
        fieldElement.dataset.dropdownOpen = 'false';
        this.refreshResponsibleSearchField(fieldElement);
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  },

  bindResponsibleSearchField: function (fieldElement) {
    if (!fieldElement || fieldElement.dataset.eventsReady === 'true') return;

    const searchInput = fieldElement.querySelector('.responsible-search-input');
    const clearButton = fieldElement.querySelector('.responsible-search-clear');
    const toggleButton = fieldElement.querySelector('.responsible-search-toggle');
    if (!searchInput) return;

    searchInput.addEventListener('focus', () => {
      fieldElement.dataset.dropdownOpen = 'true';
      this.refreshResponsibleSearchField(fieldElement);
    });

    searchInput.addEventListener('input', () => {
      fieldElement.dataset.dropdownOpen = 'true';
      this.refreshResponsibleSearchField(fieldElement);
    });

    searchInput.addEventListener('change', () => this.refreshResponsibleSearchField(fieldElement));

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        fieldElement.dataset.dropdownOpen = 'false';
        this.refreshResponsibleSearchField(fieldElement);
      }, 120);
    });

    if (clearButton) {
      clearButton.addEventListener('click', (event) => {
        event.preventDefault();
        searchInput.value = '';
        fieldElement.dataset.dropdownOpen = 'false';
        this.refreshResponsibleSearchField(fieldElement);
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        searchInput.focus();
      });
    }

    if (toggleButton) {
      toggleButton.addEventListener('click', (event) => {
        event.preventDefault();
        fieldElement.dataset.dropdownOpen = fieldElement.dataset.dropdownOpen === 'true' ? 'false' : 'true';
        this.refreshResponsibleSearchField(fieldElement);
        searchInput.focus();
      });
    }

    fieldElement.dataset.eventsReady = 'true';
    this.refreshResponsibleSearchField(fieldElement);
  },

  initResponsibleSearchFields: function (rootElement) {
    const root = rootElement || document;
    root.querySelectorAll('.responsible-search-field').forEach((fieldElement) => {
      this.bindResponsibleSearchField(fieldElement);
    });
  },

  // ---------------------------
  // WBS
  // ---------------------------

  updateWbsNumbers: function () {
    const container = document.getElementById('wbs-container');
    if (!container) return;

    const items = Array.from(container.querySelectorAll(':scope > .wbs-item'));
    items.forEach((item, index) => {
      const numberEl = item.querySelector('.wbs-number');
      if (numberEl) numberEl.textContent = `${index + 1}.`;
    });
  },

  addPhase: function () {
    const container = document.getElementById('wbs-container');
    if (!container) return;

    const phase = document.createElement('div');
    phase.className = 'wbs-item border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm';

    const nextNumber = (container.querySelectorAll('.wbs-item').length || 0) + 1;

    phase.innerHTML = `
      <div class="panel-toggle-header flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer">
        <div class="w-full min-w-0">
          <div class="flex items-center gap-2">
            <span class="wbs-number text-gray-500">${nextNumber}.</span>
            <input type="text" value="" class="wbs-phase-name-input w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white" placeholder="Informe a Descrição da Fase">
          </div>
        </div>
        <div class="flex items-center space-x-2 pl-3 shrink-0">
          <button onclick="removeItem(this)" class="text-red-400 hover:text-red-600" title="Remover">
            <i class="fa-solid fa-trash"></i>
          </button>
          <button class="text-gray-400 hover:text-gray-600 cursor-grab" title="Mover">
            <i class="fa-solid fa-grip-vertical"></i>
          </button>
        </div>
      </div>
      <div class="wbs-panel-content p-4">
        <div class="grid grid-cols-1 lg:grid-cols-[3fr_1fr_1fr] gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Responsável</label>
            <div class="responsible-search-field relative">
              <div class="relative">
                <input type="text" value="" class="responsible-input responsible-search-input w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg text-sm bg-white" placeholder="Pesquisar responsável...">
                <button type="button" class="responsible-search-clear hidden absolute top-1/2 right-8 -translate-y-1/2 text-red-500 hover:text-red-700 px-1" title="Limpar">
                  <i class="fa-solid fa-xmark"></i>
                </button>
                <button type="button" class="responsible-search-toggle absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700 px-1" title="Abrir opções">
                  <i class="fa-solid fa-chevron-down text-xs"></i>
                </button>
              </div>
              <div class="responsible-search-dropdown hidden absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto"></div>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Esforço (h)</label>
            <input type="number" value="" class="wbs-phase-effort w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Duração (dias)</label>
            <input type="number" value="" class="wbs-phase-duration w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          </div>
        </div>

        <div class="mt-4">
          <div class="mb-1">
            <label class="block text-sm text-gray-600">Dependências</label>
          </div>
          <div class="dependency-field">
            <div class="dependency-list space-y-2 mb-3"></div>
            <button onclick="addDependencyItem(this)" class="text-sm text-bevap-green hover:text-green-700 font-medium">
              <i class="fa-solid fa-plus mr-1"></i> Adicionar Dependência
            </button>
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm text-gray-600 mb-1">Observações</label>
          <textarea class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" placeholder="Descreva detalhes relevantes desta fase..."></textarea>
        </div>

        <div class="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 class="text-sm font-semibold text-bevap-navy mb-3">Painel de Tarefas</h5>
          <div class="subtask-container space-y-3"></div>
          <div class="mt-3">
            <button onclick="addSubtask(this)" class="inline-flex items-center text-bevap-green text-sm hover:underline">
              <i class="fa-solid fa-plus mr-1"></i>
              Adicionar Tarefa
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(phase);
    this.initResponsibleSearchFields(phase);
    this.updateWbsNumbers();

    this.initWbsSortables();
  },

  addDependencyItem: function (buttonElement) {
    const field = buttonElement.closest('.dependency-field');
    if (!field) return;

    const list = field.querySelector('.dependency-list');
    if (!list) return;

    const dependency = document.createElement('div');
    dependency.className = 'flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
    dependency.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation text-yellow-600"></i>
      <input type="text" placeholder="Descreva uma dependência..." class="field-input flex-1 bg-transparent border-none focus:outline-none text-sm">
      <button onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700">
        <i class="fa-solid fa-times"></i>
      </button>
    `;

    list.appendChild(dependency);
  },

  createSubtaskElement: function (taskData, subtaskIndex) {
    const subtask = document.createElement('div');
    subtask.className = 'wbs-subtask border border-gray-200 rounded-lg bg-gray-50 p-4 ml-4';

    const safeName = this.escapeHtml(taskData && taskData.name ? taskData.name : `Tarefa ${subtaskIndex}`);

    subtask.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <div class="w-full">
          <label class="block text-sm text-gray-600 mb-1">Descrição da tarefa</label>
          <input type="text" value="${safeName}" class="wbs-task-name-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white" placeholder="Descrição da tarefa">
        </div>
        <div class="flex items-center space-x-2 pl-3">
          <button class="task-handle text-gray-400 hover:text-gray-600 cursor-grab" title="Mover">
            <i class="fa-solid fa-grip-vertical"></i>
          </button>
          <button onclick="removeItem(this)" class="text-red-400 hover:text-red-600" title="Remover">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[3fr_1fr_1fr] gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Responsável</label>
          <div class="responsible-search-field relative">
            <div class="relative">
              <input type="text" value="" class="responsible-input responsible-search-input w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg text-sm bg-white" placeholder="Pesquisar responsável...">
              <button type="button" class="responsible-search-clear hidden absolute top-1/2 right-8 -translate-y-1/2 text-red-500 hover:text-red-700 px-1" title="Limpar">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <button type="button" class="responsible-search-toggle absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700 px-1" title="Abrir opções">
                <i class="fa-solid fa-chevron-down text-xs"></i>
              </button>
            </div>
            <div class="responsible-search-dropdown hidden absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto"></div>
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Esforço (h)</label>
          <input type="number" value="" min="1" class="task-effort w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Duração (dias)</label>
          <input type="number" value="" min="1" class="task-duration w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
        </div>
      </div>
      <div class="dependency-field mt-4">
        <div class="mb-1">
          <label class="block text-sm text-gray-600">Dependências</label>
        </div>
        <div class="dependency-list space-y-2 mb-3"></div>
        <button onclick="addDependencyItem(this)" class="text-sm text-bevap-green hover:text-green-700 font-medium">
          <i class="fa-solid fa-plus mr-1"></i> Adicionar Dependência
        </button>
      </div>
    `;

    return subtask;
  },

  addSubtask: function (buttonElement) {
    const phaseItem = buttonElement.closest('.wbs-item');
    if (!phaseItem) return;

    const container = phaseItem.querySelector('.subtask-container');
    if (!container) return;

    const subtaskIndex = container.children.length + 1;
    const subtask = this.createSubtaskElement({}, subtaskIndex);
    container.appendChild(subtask);

    this.initResponsibleSearchFields(subtask);
    this.initTaskSortables(phaseItem);
  },

  removeItem: function (element) {
    const subtask = element.closest('.wbs-subtask');
    if (subtask) {
      this.openDeleteModal('Tem certeza que deseja remover esta tarefa?', () => {
        subtask.remove();
      });
      return;
    }

    const item = element.closest('.wbs-item');
    if (!item) return;

    this.openDeleteModal('Tem certeza que deseja remover esta fase?', () => {
      item.remove();
      this.updateWbsNumbers();
    });
  },

  initWbsSortables: function () {
    if (typeof window.Sortable === 'undefined') return;

    const container = document.getElementById('wbs-container');
    if (!container) return;

    if (container.dataset.sortableReady === 'true') return;

    try {
      Sortable.create(container, {
        animation: 150,
        handle: '.fa-grip-vertical',
        draggable: '.wbs-item',
        onEnd: () => this.updateWbsNumbers()
      });
      container.dataset.sortableReady = 'true';
    } catch (error) {}

    // também tenta sortables de tarefas
    Array.from(container.querySelectorAll('.wbs-item')).forEach((item) => this.initTaskSortables(item));
  },

  initTaskSortables: function (phaseItem) {
    if (typeof window.Sortable === 'undefined') return;

    const root = phaseItem && phaseItem.querySelector ? phaseItem : document;
    root.querySelectorAll('.subtask-container').forEach((subtaskContainer) => {
      if (subtaskContainer.dataset.sortableReady === 'true') return;

      try {
        Sortable.create(subtaskContainer, {
          animation: 150,
          handle: '.task-handle',
          draggable: '.wbs-subtask'
        });
        subtaskContainer.dataset.sortableReady = 'true';
      } catch (error) {}
    });
  },

  // ---------------------------
  // Milestones
  // ---------------------------

  addMilestone: function () {
    const container = document.getElementById('milestones-container');
    if (!container) return;

    const milestone = document.createElement('div');
    milestone.className = 'milestone-card border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm';

    milestone.innerHTML = `
      <div class="panel-toggle-header flex items-end justify-between gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer">
        <div class="flex items-end gap-4 flex-1 min-w-0">
          <div class="flex-1 min-w-0">
            <label class="block text-sm text-gray-600 mb-1 cursor-pointer">Marco</label>
            <input type="text" value="" class="milestone-phase-input w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" placeholder="Preencha o marco">
          </div>
          <div class="w-64 shrink-0">
            <label class="block text-sm text-gray-600 mb-1 cursor-pointer">Período do Marco</label>
            <input type="text" value="" class="milestone-period-input w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" placeholder="Selecione um período">
          </div>
        </div>
        <div class="flex items-center gap-2 pl-3 shrink-0 self-end">
          <button onclick="removeMilestone(this)" class="text-red-400 hover:text-red-600 inline-flex items-center justify-center h-9" title="Remover">
            <i class="fa-solid fa-trash"></i>
          </button>
          <button class="milestone-handle text-gray-400 hover:text-gray-600 cursor-grab inline-flex items-center justify-center h-9" title="Mover">
            <i class="fa-solid fa-grip-vertical"></i>
          </button>
        </div>
      </div>
      <div class="milestone-panel-content p-4">
        <div class="milestone-criteria-field">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm text-gray-600">Critérios de Aceite</label>
            <button onclick="addMilestoneCriteria(this)" class="text-sm text-bevap-green hover:text-green-700 font-medium">
              <i class="fa-solid fa-plus mr-1"></i> Adicionar Critério
            </button>
          </div>
          <div class="milestone-criteria-list space-y-2 mb-3"></div>
        </div>
        <div class="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 class="milestone-tasks-title text-sm font-semibold text-bevap-navy mb-3">Tarefa do Marco</h5>
          <div class="milestone-tasks-list space-y-3"></div>
          <div class="mt-3 flex justify-start">
            <button onclick="addMilestoneTask(this)" class="text-sm text-bevap-green hover:text-green-700 font-medium inline-flex items-center gap-1" title="Adicionar Tarefa">
              <i class="fa-solid fa-plus text-xs"></i> Adicionar Tarefa
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(milestone);

    // cria uma linha inicial
    const criteriaButton = milestone.querySelector('button[onclick="addMilestoneCriteria(this)"]');
    const taskButton = milestone.querySelector('button[onclick="addMilestoneTask(this)"]');
    if (criteriaButton) this.addMilestoneCriteria(criteriaButton);
    if (taskButton) this.addMilestoneTask(taskButton);

    this.initializeMilestoneDatePickers(milestone);
    this.initMilestoneSortables();
  },

  addMilestoneCriteria: function (buttonElement) {
    const milestoneCard = buttonElement.closest('.milestone-card');
    if (!milestoneCard) return;

    const list = milestoneCard.querySelector('.milestone-criteria-list');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'milestone-criteria-row flex items-center gap-2';
    row.innerHTML = `
      <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Descreva o critério...">
      <button type="button" class="text-red-400 hover:text-red-600" title="Remover" data-action="remove-criteria">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    row.querySelector('[data-action="remove-criteria"]').addEventListener('click', () => {
      if (list.children.length === 1) {
        const input = row.querySelector('input');
        if (input) input.value = '';
        return;
      }
      row.remove();
    });

    list.appendChild(row);
  },

  addMilestoneTask: function (buttonElement) {
    const milestoneCard = buttonElement.closest('.milestone-card');
    if (!milestoneCard) return;

    const list = milestoneCard.querySelector('.milestone-tasks-list');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'milestone-task-row flex items-center gap-2';
    row.innerHTML = `
      <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Tarefa relacionada ao marco...">
      <input type="date" class="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm">
      <button type="button" class="text-red-400 hover:text-red-600" title="Remover" data-action="remove-task">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    row.querySelector('[data-action="remove-task"]').addEventListener('click', () => {
      if (list.children.length === 1) {
        const inputs = row.querySelectorAll('input');
        if (inputs[0]) inputs[0].value = '';
        if (inputs[1]) inputs[1].value = '';
        return;
      }
      row.remove();
    });

    list.appendChild(row);
  },

  removeMilestone: function (element) {
    this.openDeleteModal('Tem certeza que deseja remover este marco?', () => {
      const milestoneCard = element.closest('.milestone-card');
      if (milestoneCard) {
        milestoneCard.remove();
      }
    });
  },

  initMilestoneSortables: function () {
    if (typeof window.Sortable === 'undefined') return;

    const container = document.getElementById('milestones-container');
    if (!container) return;
    if (container.dataset.sortableReady === 'true') return;

    try {
      Sortable.create(container, {
        animation: 150,
        handle: '.milestone-handle',
        draggable: '.milestone-card'
      });
      container.dataset.sortableReady = 'true';
    } catch (error) {}
  },

  // ---------------------------
  // Riscos e Dependências Externas
  // ---------------------------

  addRisk: function () {
    const container = document.getElementById('risk-matrix-list');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-lg p-4 bg-white';
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h5 class="font-medium text-bevap-navy">Novo risco</h5>
        <button type="button" class="text-red-400 hover:text-red-600" data-action="remove-risk" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div class="grid grid-cols-1 gap-3">
        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Descrição do risco">
        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Probabilidade / Impacto (ex.: Alta/Alto)">
        <textarea class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" placeholder="Mitigação"></textarea>
        <textarea class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" placeholder="Plano B"></textarea>
      </div>
    `;

    card.querySelector('[data-action="remove-risk"]').addEventListener('click', () => {
      this.openDeleteModal('Tem certeza que deseja remover este risco?', () => card.remove());
    });

    container.prepend(card);
  },

  addExternalDependency: function () {
    const container = document.getElementById('external-dependencies-list');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-lg p-4 bg-white';
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h5 class="font-medium text-bevap-navy">Nova dependência</h5>
        <button type="button" class="text-red-400 hover:text-red-600" data-action="remove-dependency" title="Remover">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div class="grid grid-cols-1 gap-3">
        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Descrição da dependência">
        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Responsável">
        <textarea class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" placeholder="Mitigação"></textarea>
        <textarea class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" placeholder="Plano B"></textarea>
      </div>
    `;

    card.querySelector('[data-action="remove-dependency"]').addEventListener('click', () => {
      this.openDeleteModal('Tem certeza que deseja remover esta dependência?', () => card.remove());
    });

    container.prepend(card);
  },

  // ---------------------------
  // Plano de Comunicação
  // ---------------------------

  addCommunicationPlanRow: function () {
    const body = document.getElementById('communication-plan-body');
    if (!body) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-3 py-2 align-top border-r border-gray-200">
        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Público">
      </td>
      <td class="w-36 px-3 py-2 align-top border-r border-gray-200">
        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none">
          <option value="E-mail">E-mail</option>
          <option value="Daily">Daily</option>
          <option value="Reunião">Reunião</option>
          <option value="Teams">Teams</option>
          <option value="Comitê">Comitê</option>
        </select>
      </td>
      <td class="w-36 px-3 py-2 align-top border-r border-gray-200">
        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none">
          <option value="Diária">Diária</option>
          <option value="Semanal" selected>Semanal</option>
          <option value="Quinzenal">Quinzenal</option>
          <option value="Mensal">Mensal</option>
          <option value="Sob demanda">Sob demanda</option>
        </select>
      </td>
      <td class="px-2 py-2 text-center align-top">
        <button type="button" class="text-red-400 hover:text-red-600" title="Remover linha" data-action="remove-comm-row">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;

    row.querySelector('[data-action="remove-comm-row"]').addEventListener('click', () => {
      this.openDeleteModal('Tem certeza que deseja remover esta linha do plano de comunicação?', () => row.remove());
    });

    body.appendChild(row);
  },

  // ---------------------------
  // RACI + Alocação (baseado no protótipo)
  // ---------------------------

  getRaciPhaseKey: function (phaseName) {
    return this.asText(phaseName).toLowerCase();
  },

  normalizeStakeholderField: function (fieldValue) {
    if (Array.isArray(fieldValue)) {
      return fieldValue.map((v) => this.asText(v)).filter(Boolean);
    }
    const text = this.asText(fieldValue);
    return text ? [text] : [];
  },

  getWbsPhaseBaseDataFromDom: function () {
    const phaseItems = Array.from(document.querySelectorAll('#wbs-container > .wbs-item'));
    return phaseItems.map((phaseItem, index) => {
      const phasePanel = phaseItem.querySelector('.wbs-panel-content');
      const phaseName = this.asText(phaseItem.querySelector('.wbs-phase-name-input')?.value) || `Fase ${index + 1}`;
      const responsible = this.asText(phasePanel?.querySelector('.responsible-search-input')?.value);
      const effort = this.parseNumber(phasePanel?.querySelector('.wbs-phase-effort')?.value);

      const taskResponsibles = Array.from(phaseItem.querySelectorAll('.wbs-subtask .responsible-search-input') || [])
        .map((inputEl) => this.asText(inputEl && inputEl.value))
        .filter(Boolean);

      const responsibles = Array.from(new Set([responsible, ...taskResponsibles].filter(Boolean)));
      return { phaseName, responsible, effort, responsibles };
    });
  },

  getTeamProfileByMember: function (memberName) {
    const normalizedName = this.asText(memberName).toLowerCase();
    if (!normalizedName) return 'TI';
    if (normalizedName.includes('techpartners')) return 'Fornecedor';
    if (normalizedName.includes('diretoria') || normalizedName.includes('solicitante') || normalizedName.includes('negócio') || normalizedName.includes('negocio')) {
      return 'Negócio';
    }
    return 'TI';
  },

  toPositiveNumber: function (value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  },

  computeTeamAllocationFromWbsPayload: function (wbs) {
    const phases = wbs && Array.isArray(wbs.phases) ? wbs.phases : [];
    const groupedByPerson = new Map();

    const addEffort = (memberName, effortHours) => {
      const member = this.asText(memberName);
      if (!member) return;
      const current = groupedByPerson.get(member) || {
        member,
        profile: this.getTeamProfileByMember(member),
        effort: 0
      };
      current.effort += this.toPositiveNumber(effortHours);
      groupedByPerson.set(member, current);
    };

    phases.forEach((phase) => {
      const phaseResponsible = this.asText(phase && phase.responsible);
      const phaseEffort = this.toPositiveNumber(phase && phase.effortHours);
      const tasks = Array.isArray(phase && phase.tasks) ? phase.tasks : [];

      if (!tasks.length) {
        addEffort(phaseResponsible, phaseEffort);
        return;
      }

      tasks.forEach((task) => {
        addEffort(this.asText(task && task.responsible), this.toPositiveNumber(task && task.effortHours));
      });
    });

    const allocations = Array.from(groupedByPerson.values());
    if (!allocations.length) return [];
    const maxEffort = Math.max(...allocations.map((item) => item.effort), 1);

    return allocations
      .sort((first, second) => second.effort - first.effort || first.member.localeCompare(second.member, 'pt-BR'))
      .map((item) => ({
        member: item.member,
        profile: item.profile,
        dedication: Math.max(0, Math.min(100, Math.round((item.effort / maxEffort) * 100)))
      }));
  },

  syncRaciMatrixWithWbsPhasesData: function (phasesBase, existingRows, removedStakeholdersByPhase) {
    const phases = Array.isArray(phasesBase) ? phasesBase : [];
    const existing = Array.isArray(existingRows) ? existingRows : [];
    const removedMap = removedStakeholdersByPhase instanceof Map ? removedStakeholdersByPhase : new Map();

    const activePhaseKeys = new Set(phases.map((phase) => this.getRaciPhaseKey(phase.phaseName)));
    const nextRemovedMap = new Map(
      Array.from(removedMap.entries()).filter(([phaseKey]) => activePhaseKeys.has(phaseKey))
    );

    const existingByPhase = new Map(
      existing.map((row) => [
        this.asText(row && row.phase),
        {
          phase: this.asText(row && row.phase),
          r: this.normalizeStakeholderField(row && row.r),
          a: this.normalizeStakeholderField(row && row.a),
          c: this.normalizeStakeholderField(row && row.c),
          i: this.normalizeStakeholderField(row && row.i)
        }
      ])
    );

    const nextRows = phases.map((phase, index) => {
      const phaseName = this.asText(phase && phase.phaseName) || `Fase ${index + 1}`;
      const existingRow = existingByPhase.get(phaseName);
      const defaultR = Array.from(new Set((Array.isArray(phase && phase.responsibles) ? phase.responsibles : [])
        .map((n) => this.asText(n)).filter(Boolean)));

      if (!existingRow) {
        return {
          phase: phaseName,
          r: defaultR,
          a: [],
          c: [],
          i: []
        };
      }

      const phaseKey = this.getRaciPhaseKey(phaseName);
      const removed = nextRemovedMap.get(phaseKey) || new Set();
      const preservedDefaultR = defaultR.filter((name) => !removed.has(name));
      const existingR = this.normalizeStakeholderField(existingRow.r).filter((name) => !removed.has(name));

      return {
        ...existingRow,
        phase: phaseName,
        r: Array.from(new Set([...preservedDefaultR, ...existingR]))
      };
    });

    return { rows: nextRows, removedByPhase: nextRemovedMap };
  },

  buildWbsSnapshotFromDom: function () {
    const container = document.getElementById('wbs-container');
    const phases = [];
    if (!container) {
      return { phases: [] };
    }

    Array.from(container.querySelectorAll(':scope > .wbs-item')).forEach((phaseEl, index) => {
      const panel = phaseEl.querySelector('.wbs-panel-content');
      const name = this.asText(phaseEl.querySelector('.wbs-phase-name-input')?.value) || `Fase ${index + 1}`;
      const responsible = this.asText(panel?.querySelector('.responsible-search-input')?.value);
      const effortHours = this.parseNumber(panel?.querySelector('.wbs-phase-effort')?.value);

      const tasks = [];
      phaseEl.querySelectorAll('.subtask-container .wbs-subtask').forEach((taskEl) => {
        tasks.push({
          responsible: this.asText(taskEl.querySelector('.responsible-search-input')?.value),
          effortHours: this.parseNumber(taskEl.querySelector('.task-effort')?.value)
        });
      });

      phases.push({
        name,
        responsible,
        effortHours,
        tasks
      });
    });

    return { phases };
  },

  syncRaciAndAllocationInternal: function () {
    const phasesBase = this.getWbsPhaseBaseDataFromDom();

    const result = this.syncRaciMatrixWithWbsPhasesData(
      phasesBase,
      this._raciMatrixData,
      this._raciRemovedStakeholdersByPhase
    );

    this._raciMatrixData = result.rows;
    this._raciRemovedStakeholdersByPhase = result.removedByPhase;

    const wbsSnapshot = this.buildWbsSnapshotFromDom();
    this._teamAllocationData = this.computeTeamAllocationFromWbsPayload(wbsSnapshot);
  },

  getAvailableStakeholderOptions: function (selectedNames) {
    const selectedSet = new Set(this.normalizeStakeholderField(selectedNames));
    return (Array.isArray(this._responsibleOptions) ? this._responsibleOptions : []).filter((name) => !selectedSet.has(name));
  },

  getRaciStakeholderSearchFieldHTML: function (index, field) {
    return `
      <div class="raci-stakeholder-search-field relative" data-raci-index="${index}" data-raci-field="${this.escapeHtml(field)}">
        <div class="relative">
          <input type="text" value="" class="raci-stakeholder-search-input w-full px-2.5 py-2 pr-16 border border-gray-300 rounded-lg text-xs bg-white" placeholder="Adicionar...">
          <button type="button" class="raci-stakeholder-search-clear hidden absolute top-1/2 right-7 -translate-y-1/2 text-red-500 hover:text-red-700 px-1" title="Limpar">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <button type="button" class="raci-stakeholder-search-toggle absolute top-1/2 right-1 -translate-y-1/2 text-gray-500 hover:text-gray-700 px-1" title="Abrir opções">
            <i class="fa-solid fa-chevron-down text-[10px]"></i>
          </button>
        </div>
        <div class="raci-stakeholder-search-dropdown hidden absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto"></div>
      </div>
    `;
  },

  getRaciStakeholderChipsHTML: function (index, field, names) {
    if (!Array.isArray(names) || !names.length) {
      return '<span class="text-xs text-gray-400">Nenhum selecionado</span>';
    }

    return names.map((name) => {
      const safeName = this.escapeHtml(name);
      return `
        <div title="${safeName}" class="flex items-center justify-between gap-2 w-full px-2 py-1 rounded-md border border-gray-200 bg-white text-xs text-gray-700">
          <span class="block text-left whitespace-normal break-words flex-1">${safeName}</span>
          <button type="button" class="raci-chip-remove shrink-0 text-red-500 hover:text-red-700" title="Remover" data-index="${index}" data-field="${this.escapeHtml(field)}" data-name="${safeName}">
            <i class="fa-solid fa-xmark text-[11px]"></i>
          </button>
        </div>
      `;
    }).join('');
  },

  renderRaciMatrixTable: function () {
    this.syncRaciAndAllocationInternal();

    const body = document.getElementById('raci-matrix-body');
    if (!body) return;

    if (!this._raciMatrixData.length) {
      body.innerHTML = '<div class="text-sm text-gray-500">Adicione ao menos uma fase na WBS para gerar a matriz RACI.</div>';
      return;
    }

    body.innerHTML = this._raciMatrixData.map((row, index) => `
      <div class="border border-gray-200 rounded-lg">
        <div class="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <p class="text-base text-gray-700"><span class="font-semibold text-gray-600">Fase:</span> ${this.escapeHtml(row.phase)}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4">
          <div class="p-2 border-b md:border-b-0 md:border-r border-gray-200 align-top">
            <div class="text-xs font-semibold text-gray-600 mb-1 text-center">R</div>
            <div class="space-y-1.5">
              ${this.getRaciStakeholderSearchFieldHTML(index, 'r')}
              <div class="space-y-1 min-h-[34px]">
                ${this.getRaciStakeholderChipsHTML(index, 'r', this.normalizeStakeholderField(row.r))}
              </div>
            </div>
          </div>
          <div class="p-2 border-b md:border-b-0 md:border-r border-gray-200 align-top">
            <div class="text-xs font-semibold text-gray-600 mb-1 text-center">A</div>
            <div class="space-y-1.5">
              ${this.getRaciStakeholderSearchFieldHTML(index, 'a')}
              <div class="space-y-1 min-h-[34px]">
                ${this.getRaciStakeholderChipsHTML(index, 'a', this.normalizeStakeholderField(row.a))}
              </div>
            </div>
          </div>
          <div class="p-2 border-b md:border-b-0 md:border-r border-gray-200 align-top">
            <div class="text-xs font-semibold text-gray-600 mb-1 text-center">C</div>
            <div class="space-y-1.5">
              ${this.getRaciStakeholderSearchFieldHTML(index, 'c')}
              <div class="space-y-1 min-h-[34px]">
                ${this.getRaciStakeholderChipsHTML(index, 'c', this.normalizeStakeholderField(row.c))}
              </div>
            </div>
          </div>
          <div class="p-2 align-top">
            <div class="text-xs font-semibold text-gray-600 mb-1 text-center">I</div>
            <div class="space-y-1.5">
              ${this.getRaciStakeholderSearchFieldHTML(index, 'i')}
              <div class="space-y-1 min-h-[34px]">
                ${this.getRaciStakeholderChipsHTML(index, 'i', this.normalizeStakeholderField(row.i))}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    this.initRaciStakeholderSearchFields(body);

    body.querySelectorAll('.raci-chip-remove').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const index = Number(btn.dataset.index);
        const field = this.asText(btn.dataset.field);
        const name = this.asText(btn.dataset.name);
        this.removeRaciStakeholder(index, field, name);
      });
    });
  },

  addRaciStakeholder: function (index, field, stakeholderName) {
    const row = this._raciMatrixData[index];
    if (!row) return;
    const selected = this.asText(stakeholderName);
    if (!selected) return;

    const current = this.normalizeStakeholderField(row[field]);
    if (current.includes(selected)) {
      return;
    }

    if (field === 'r') {
      const phaseKey = this.getRaciPhaseKey(row.phase);
      const removed = this._raciRemovedStakeholdersByPhase.get(phaseKey);
      if (removed && removed.has(selected)) {
        removed.delete(selected);
        if (!removed.size) {
          this._raciRemovedStakeholdersByPhase.delete(phaseKey);
        }
      }
    }

    row[field] = [...current, selected];
    this.renderRaciMatrixTable();
  },

  addRaciStakeholderFromSearch: function (index, field, inputElement) {
    const typedValue = this.asText(inputElement && inputElement.value);
    if (!typedValue) return;
    const row = this._raciMatrixData[index];
    if (!row) return;

    const selectedNames = this.normalizeStakeholderField(row[field]);
    const available = this.getAvailableStakeholderOptions(selectedNames);
    const matched = available.find((name) => name.toLowerCase() === typedValue.toLowerCase());
    if (!matched) {
      this.showToast('Selecione uma pessoa válida da lista.', 'warning');
      return;
    }

    inputElement.value = '';
    this.addRaciStakeholder(index, field, matched);
  },

  removeRaciStakeholder: function (index, field, stakeholderName) {
    const row = this._raciMatrixData[index];
    if (!row) return;

    const selected = this.asText(stakeholderName);
    if (field === 'r' && selected) {
      const phaseKey = this.getRaciPhaseKey(row.phase);
      const removed = this._raciRemovedStakeholdersByPhase.get(phaseKey) || new Set();
      removed.add(selected);
      this._raciRemovedStakeholdersByPhase.set(phaseKey, removed);
    }

    row[field] = this.normalizeStakeholderField(row[field]).filter((name) => name !== selected);
    this.renderRaciMatrixTable();
  },

  refreshRaciStakeholderSearchField: function (fieldElement) {
    if (!fieldElement) return;

    const index = Number(fieldElement.dataset.raciIndex);
    const field = fieldElement.dataset.raciField || '';
    if (Number.isNaN(index) || !field) return;

    const row = this._raciMatrixData[index];
    if (!row) return;

    const searchInput = fieldElement.querySelector('.raci-stakeholder-search-input');
    const clearButton = fieldElement.querySelector('.raci-stakeholder-search-clear');
    const toggleButton = fieldElement.querySelector('.raci-stakeholder-search-toggle');
    const dropdown = fieldElement.querySelector('.raci-stakeholder-search-dropdown');
    if (!searchInput || !dropdown) return;

    const selectedNames = this.normalizeStakeholderField(row[field]);
    const availableOptions = this.getAvailableStakeholderOptions(selectedNames);
    const searchText = (searchInput.value || '').trim();
    const searchLower = searchText.toLowerCase();
    const filtered = searchText
      ? availableOptions.filter((name) => name.toLowerCase().includes(searchLower))
      : availableOptions;

    const hasInputValue = Boolean(searchText);
    if (clearButton) {
      clearButton.classList.toggle('hidden', !hasInputValue);
    }
    if (toggleButton) {
      toggleButton.classList.toggle('hidden', hasInputValue);
    }

    const isFocused = document.activeElement === searchInput;
    const shouldShowDropdown = fieldElement.dataset.dropdownOpen === 'true' && (isFocused || hasInputValue);

    if (!shouldShowDropdown) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      return;
    }

    if (!filtered.length) {
      dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">Nenhuma pessoa encontrada</div>';
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = filtered
      .map((name) => `
        <button type="button" class="raci-stakeholder-option w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" data-value="${this.escapeHtml(name)}">
          ${this.escapeHtml(name)}
        </button>
      `)
      .join('');

    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.raci-stakeholder-option').forEach((optionElement) => {
      optionElement.addEventListener('mousedown', (event) => event.preventDefault());
      optionElement.addEventListener('click', () => {
        const selectedValue = optionElement.getAttribute('data-value') || '';
        if (!selectedValue) return;
        searchInput.value = '';
        fieldElement.dataset.dropdownOpen = 'false';
        this.addRaciStakeholder(index, field, selectedValue);
      });
    });
  },

  bindRaciStakeholderSearchField: function (fieldElement) {
    if (!fieldElement || fieldElement.dataset.eventsReady === 'true') return;

    const index = Number(fieldElement.dataset.raciIndex);
    const field = fieldElement.dataset.raciField || '';
    if (Number.isNaN(index) || !field) return;

    const searchInput = fieldElement.querySelector('.raci-stakeholder-search-input');
    const clearButton = fieldElement.querySelector('.raci-stakeholder-search-clear');
    const toggleButton = fieldElement.querySelector('.raci-stakeholder-search-toggle');
    if (!searchInput) return;

    searchInput.addEventListener('focus', () => {
      fieldElement.dataset.dropdownOpen = 'true';
      this.refreshRaciStakeholderSearchField(fieldElement);
    });

    searchInput.addEventListener('input', () => {
      fieldElement.dataset.dropdownOpen = 'true';
      this.refreshRaciStakeholderSearchField(fieldElement);
    });

    searchInput.addEventListener('change', () => {
      this.addRaciStakeholderFromSearch(index, field, searchInput);
      this.refreshRaciStakeholderSearchField(fieldElement);
    });

    searchInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      this.addRaciStakeholderFromSearch(index, field, searchInput);
      this.refreshRaciStakeholderSearchField(fieldElement);
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        fieldElement.dataset.dropdownOpen = 'false';
        this.refreshRaciStakeholderSearchField(fieldElement);
      }, 120);
    });

    if (clearButton) {
      clearButton.addEventListener('click', (event) => {
        event.preventDefault();
        searchInput.value = '';
        fieldElement.dataset.dropdownOpen = 'false';
        this.refreshRaciStakeholderSearchField(fieldElement);
        searchInput.focus();
      });
    }

    if (toggleButton) {
      toggleButton.addEventListener('click', (event) => {
        event.preventDefault();
        fieldElement.dataset.dropdownOpen = fieldElement.dataset.dropdownOpen === 'true' ? 'false' : 'true';
        this.refreshRaciStakeholderSearchField(fieldElement);
        searchInput.focus();
      });
    }

    fieldElement.dataset.eventsReady = 'true';
    this.refreshRaciStakeholderSearchField(fieldElement);
  },

  initRaciStakeholderSearchFields: function (rootElement) {
    const root = rootElement || document;
    root.querySelectorAll('.raci-stakeholder-search-field').forEach((fieldElement) => {
      this.bindRaciStakeholderSearchField(fieldElement);
    });
  },

  getTeamBadge: function (profile) {
    if (profile === 'Fornecedor') {
      return 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded';
    }
    if (profile === 'Negócio' || profile === 'Negocio') {
      return 'px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded';
    }
    return 'px-2 py-1 bg-bevap-green text-white text-xs rounded';
  },

  renderTeamAllocationList: function () {
    this.syncRaciAndAllocationInternal();

    const container = document.getElementById('team-allocation-list');
    if (!container) return;

    if (!this._teamAllocationData.length) {
      container.innerHTML = '<div class="text-sm text-gray-500">Alocação será calculada automaticamente conforme esforço e responsáveis definidos na WBS.</div>';
      return;
    }

    container.innerHTML = this._teamAllocationData.map((item) => `
      <div class="border border-gray-200 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium text-bevap-navy break-all">${this.escapeHtml(item.member)}</span>
          <span class="${this.getTeamBadge(item.profile)}">${this.escapeHtml(item.profile)}</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">Dedicação:</span>
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div class="bg-bevap-green h-2 rounded-full" style="width: ${Number(item.dedication) || 0}%"></div>
          </div>
          <span class="text-sm font-medium">${Number(item.dedication) || 0}%</span>
        </div>
      </div>
    `).join('');
  },

  renderRaciAndResources: function () {
    this.renderRaciMatrixTable();
    this.renderTeamAllocationList();
  },

  // ---------------------------
  // Modals + Toast
  // ---------------------------

  openReturnModal: function () {
    const modal = document.getElementById('return-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeReturnModal: function () {
    const modal = document.getElementById('return-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitReturn: function () {
    const reason = this.asText($('#return-reason').val());
    if (!reason) {
      this.showToast('Informe o motivo para devolução.', 'warning');
      return;
    }
    this.closeReturnModal();
    this.showToast('Devolução registrada (mock).', 'success');
  },

  openCancelModal: function () {
    const modal = document.getElementById('cancel-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeCancelModal: function () {
    const modal = document.getElementById('cancel-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitCancel: function () {
    const category = this.asText($('#cancel-category').val());
    const justification = this.asText($('#cancel-justification').val());

    if (!category) {
      this.showToast('Selecione a categoria.', 'warning');
      return;
    }

    if (!justification) {
      this.showToast('Informe a justificativa.', 'warning');
      return;
    }

    this.closeCancelModal();
    this.showToast('Cancelamento registrado (mock).', 'success');
  },

  openConcludeModal: function () {
    const modal = document.getElementById('conclude-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeConcludeModal: function () {
    const modal = document.getElementById('conclude-modal');
    if (modal) modal.classList.add('hidden');
  },

  confirmConcludePlanning: function () {
    this.closeConcludeModal();

    const errors = this.validatePlanningForConclude();
    if (errors.length) {
      const first = errors[0];
      if (first && first.step) {
        this.goToStep(first.step);
      }
      this.showToast(first && first.message ? first.message : 'Revise o planejamento antes de concluir.', 'warning');
      return;
    }

    const documentId = this.asText(this._state.documentId);
    if (!documentId) {
      this.showToast('documentId não informado; não foi possível concluir.', 'error');
      return;
    }

    (async () => {
      try {
        await this.persistPlanningJsonDP({ silent: true });

        const processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(documentId);
        await fluigService.saveAndSendTask({
          id: processInstanceId,
          numState: this._nextStateAfterPlanning,
          documentId: documentId
        });

        this.showToast('Planejamento concluído e enviado para execução.', 'success');
      } catch (error) {
        console.error('[projectPlanningController] concludePlanning error:', error);
        this.showToast(`Falha ao concluir: ${this.asText(error && (error.message || error)) || 'erro'}`, 'error');
      }
    })();
  },

  validatePlanningForConclude: function () {
    const issues = [];
    const payload = this.buildPlanningPayload();
    const phases = payload.wbs && Array.isArray(payload.wbs.phases) ? payload.wbs.phases : [];

    if (!phases.length) {
      issues.push({ step: 1, message: 'Inclua ao menos uma fase na EAP/WBS.' });
      return issues;
    }

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const phaseLabel = this.asText(phase && phase.name) || `Fase ${i + 1}`;

      if (!this.asText(phase && phase.name)) {
        issues.push({ step: 1, message: `Informe a descrição da fase ${i + 1}.` });
        break;
      }

      if (!this.asText(phase && phase.responsible)) {
        issues.push({ step: 1, message: `Informe o responsável da fase: ${phaseLabel}.` });
        break;
      }

      if (!Number.isFinite(phase && phase.effortHours) || Number(phase.effortHours) <= 0) {
        issues.push({ step: 1, message: `Informe o esforço (h) da fase: ${phaseLabel}.` });
        break;
      }

      if (!Number.isFinite(phase && phase.durationDays) || Number(phase.durationDays) <= 0) {
        issues.push({ step: 1, message: `Informe a duração (dias) da fase: ${phaseLabel}.` });
        break;
      }
    }

    this.syncRaciAndAllocationInternal();

    for (let i = 0; i < this._raciMatrixData.length; i++) {
      const row = this._raciMatrixData[i];
      const phaseName = this.asText(row && row.phase) || `Fase ${i + 1}`;
      const r = this.normalizeStakeholderField(row && row.r);
      const a = this.normalizeStakeholderField(row && row.a);

      if (!r.length) {
        issues.push({ step: 4, message: `Defina ao menos um "R" na matriz RACI para: ${phaseName}.` });
        break;
      }

      if (!a.length) {
        issues.push({ step: 4, message: `Defina ao menos um "A" na matriz RACI para: ${phaseName}.` });
        break;
      }
    }

    return issues;
  },

  openDeleteModal: function (message, onConfirm) {
    const modal = document.getElementById('delete-modal');
    const messageEl = document.getElementById('delete-modal-message');
    if (!modal || !messageEl) return;

    messageEl.textContent = this.asText(message) || 'Confirmar exclusão?';
    this._pendingDeleteAction = typeof onConfirm === 'function' ? onConfirm : null;
    modal.classList.remove('hidden');
  },

  closeDeleteModal: function () {
    const modal = document.getElementById('delete-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    this._pendingDeleteAction = null;
  },

  confirmDelete: function () {
    if (typeof this._pendingDeleteAction === 'function') {
      try {
        this._pendingDeleteAction();
      } catch (error) {}
    }

    this.closeDeleteModal();
  },

  showToast: function (message, type = 'warning') {
    const toast = document.getElementById('toast');
    const content = document.getElementById('toast-content');
    const icon = document.getElementById('toast-icon');
    const messageEl = document.getElementById('toast-message');

    if (!toast || !content || !icon || !messageEl) return;

    const styles = {
      success: {
        border: 'border-green-500',
        iconClass: 'fa-solid fa-check-circle text-green-600'
      },
      error: {
        border: 'border-red-500',
        iconClass: 'fa-solid fa-circle-xmark text-red-600'
      },
      warning: {
        border: 'border-yellow-500',
        iconClass: 'fa-solid fa-triangle-exclamation text-yellow-600'
      },
      info: {
        border: 'border-blue-500',
        iconClass: 'fa-solid fa-circle-info text-blue-600'
      }
    };

    const config = styles[type] || styles.warning;
    content.classList.remove('border-green-500', 'border-red-500', 'border-yellow-500', 'border-blue-500');
    content.classList.add(config.border);
    icon.className = config.iconClass;
    messageEl.textContent = this.asText(message);

    toast.classList.remove('hidden');

    if (this._toastTimeoutId) {
      clearTimeout(this._toastTimeoutId);
    }

    this._toastTimeoutId = window.setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
  },

  // ---------------------------
  // Footer actions
  // ---------------------------

  saveDraft: function () {
    const documentId = this.asText(this._state.documentId);
    if (!documentId) {
      this.showToast('documentId não informado; não foi possível salvar.', 'error');
      return;
    }

    (async () => {
      try {
        await this.persistPlanningJsonDP({ silent: true });
        this.showToast('Rascunho salvo.', 'success');
      } catch (error) {
        console.error('[projectPlanningController] saveDraft error:', error);
        this.showToast(`Falha ao salvar rascunho: ${this.asText(error && (error.message || error)) || 'erro'}`, 'error');
      }
    })();
  },

  persistPlanningJsonDP: async function ({ silent } = {}) {
    const documentId = this.asText(this._state.documentId);
    if (!documentId) {
      throw new Error('documentId não informado');
    }

    const payload = this.buildPlanningPayload();
    const json = JSON.stringify(payload);

    await fluigService.saveDraft({
      mode: 'updateCardDraft',
      documentId: documentId,
      cardData: {
        projectPlanningJsonDP: json
      }
    });

    if (!silent) {
      return;
    }
  },

  buildPlanningPayload: function () {
    const payload = {
      meta: {
        documentId: this.asText(this._state.documentId),
        savedAt: new Date().toISOString(),
        version: 1
      },
      wbs: {
        phases: [],
        summary: {
          totalEffortHours: 0,
          totalDurationDays: 0
        }
      },
      milestones: {
        items: []
      },
      risks: {
        items: []
      },
      externalDependencies: {
        items: []
      },
      communicationPlan: {
        items: []
      },
      raci: {
        rows: [],
        removedStakeholdersByPhase: {}
      },
      teamAllocation: {
        items: []
      }
    };

    // WBS
    const wbsContainer = document.getElementById('wbs-container');
    if (wbsContainer) {
      const phaseElements = Array.from(wbsContainer.querySelectorAll(':scope > .wbs-item'));

      phaseElements.forEach((phaseEl, index) => {
        const phasePanel = phaseEl.querySelector('.wbs-panel-content');
        const phaseName = this.asText(phaseEl.querySelector('.wbs-phase-name-input')?.value);
        const phaseResponsible = this.asText(phasePanel?.querySelector('.responsible-search-input')?.value);
        const phaseEffortHours = this.parseNumber(phasePanel?.querySelector('.wbs-phase-effort')?.value);
        const phaseDurationDays = this.parseNumber(phasePanel?.querySelector('.wbs-phase-duration')?.value);
        const phaseNotes = this.asText(phasePanel?.querySelector('textarea')?.value);

        const phaseDependencies = [];
        phaseEl.querySelectorAll(':scope > .wbs-panel-content .dependency-field > .dependency-list .field-input').forEach((depInput) => {
          if (depInput && depInput.closest && depInput.closest('.wbs-subtask')) {
            return;
          }
          const text = this.asText(depInput && depInput.value);
          if (text) phaseDependencies.push(text);
        });

        const tasks = [];
        phaseEl.querySelectorAll('.subtask-container .wbs-subtask').forEach((taskEl, taskIndex) => {
          const taskName = this.asText(taskEl.querySelector('.wbs-task-name-input')?.value);
          const taskResponsible = this.asText(taskEl.querySelector('.responsible-search-input')?.value);
          const taskEffortHours = this.parseNumber(taskEl.querySelector('.task-effort')?.value);
          const taskDurationDays = this.parseNumber(taskEl.querySelector('.task-duration')?.value);

          const taskDependencies = [];
          taskEl.querySelectorAll('.dependency-field > .dependency-list .field-input').forEach((depInput) => {
            const text = this.asText(depInput && depInput.value);
            if (text) taskDependencies.push(text);
          });

          tasks.push({
            id: `task-${index + 1}-${taskIndex + 1}`,
            order: taskIndex + 1,
            name: taskName,
            responsible: taskResponsible,
            effortHours: taskEffortHours,
            durationDays: taskDurationDays,
            dependencies: taskDependencies
          });
        });

        payload.wbs.phases.push({
          id: `phase-${index + 1}`,
          order: index + 1,
          name: phaseName,
          responsible: phaseResponsible,
          effortHours: phaseEffortHours,
          durationDays: phaseDurationDays,
          notes: phaseNotes,
          dependencies: phaseDependencies,
          tasks
        });

        payload.wbs.summary.totalEffortHours += phaseEffortHours;
        payload.wbs.summary.totalDurationDays += phaseDurationDays;
      });
    }

    // Milestones
    const milestonesContainer = document.getElementById('milestones-container');
    if (milestonesContainer) {
      const milestoneEls = Array.from(milestonesContainer.querySelectorAll(':scope > .milestone-card'));
      milestoneEls.forEach((milestoneEl, index) => {
        const name = this.asText(milestoneEl.querySelector('.milestone-phase-input')?.value);
        const period = this.asText(milestoneEl.querySelector('.milestone-period-input')?.value);

        let startDate = '';
        let endDate = '';
        const match = period.match(/^\s*(\d{4}-\d{2}-\d{2})\s*(?:ate|até|\-|\u2013)\s*(\d{4}-\d{2}-\d{2})\s*$/i);
        if (match) {
          startDate = match[1];
          endDate = match[2];
        }

        const criteria = [];
        milestoneEl.querySelectorAll('.milestone-criteria-row input').forEach((input) => {
          const text = this.asText(input && input.value);
          if (text) criteria.push(text);
        });

        const tasks = [];
        milestoneEl.querySelectorAll('.milestone-task-row').forEach((row) => {
          const taskText = this.asText(row.querySelector('input[type="text"]')?.value);
          const dueDate = this.asText(row.querySelector('input[type="date"]')?.value);
          if (taskText || dueDate) {
            tasks.push({ task: taskText, dueDate });
          }
        });

        payload.milestones.items.push({
          id: `milestone-${index + 1}`,
          order: index + 1,
          name,
          period,
          startDate,
          endDate,
          criteria,
          tasks
        });
      });
    }

    // Risks
    const risksContainer = document.getElementById('risk-matrix-list');
    if (risksContainer) {
      const riskCards = Array.from(risksContainer.querySelectorAll(':scope > div'));
      riskCards.forEach((cardEl, index) => {
        const inputs = Array.from(cardEl.querySelectorAll('input'));
        const textareas = Array.from(cardEl.querySelectorAll('textarea'));

        const description = this.asText(inputs[0]?.value);
        const probabilityImpact = this.asText(inputs[1]?.value);
        const mitigation = this.asText(textareas[0]?.value);
        const planB = this.asText(textareas[1]?.value);

        if (description || probabilityImpact || mitigation || planB) {
          payload.risks.items.push({
            id: `risk-${index + 1}`,
            description,
            probabilityImpact,
            mitigation,
            planB
          });
        }
      });
    }

    // External dependencies
    const depsContainer = document.getElementById('external-dependencies-list');
    if (depsContainer) {
      const depCards = Array.from(depsContainer.querySelectorAll(':scope > div'));
      depCards.forEach((cardEl, index) => {
        const inputs = Array.from(cardEl.querySelectorAll('input'));
        const textareas = Array.from(cardEl.querySelectorAll('textarea'));

        const description = this.asText(inputs[0]?.value);
        const responsible = this.asText(inputs[1]?.value);
        const mitigation = this.asText(textareas[0]?.value);
        const planB = this.asText(textareas[1]?.value);

        if (description || responsible || mitigation || planB) {
          payload.externalDependencies.items.push({
            id: `external-dep-${index + 1}`,
            description,
            responsible,
            mitigation,
            planB
          });
        }
      });
    }

    // Communication plan
    const commBody = document.getElementById('communication-plan-body');
    if (commBody) {
      const rows = Array.from(commBody.querySelectorAll('tr'));
      rows.forEach((rowEl, index) => {
        const audience = this.asText(rowEl.querySelector('input')?.value);
        const selects = Array.from(rowEl.querySelectorAll('select'));
        const channel = this.asText(selects[0]?.value);
        const frequency = this.asText(selects[1]?.value);

        if (audience || channel || frequency) {
          payload.communicationPlan.items.push({
            id: `comm-${index + 1}`,
            audience,
            channel,
            frequency
          });
        }
      });
    }

    payload.wbs.summary.totalEffortHours = Math.max(0, Math.round(payload.wbs.summary.totalEffortHours));
    payload.wbs.summary.totalDurationDays = Math.max(0, Math.round(payload.wbs.summary.totalDurationDays));

    // RACI + Team allocation
    this.syncRaciAndAllocationInternal();

    payload.raci.rows = this._raciMatrixData.map((row) => ({
      phase: this.asText(row && row.phase),
      r: this.normalizeStakeholderField(row && row.r),
      a: this.normalizeStakeholderField(row && row.a),
      c: this.normalizeStakeholderField(row && row.c),
      i: this.normalizeStakeholderField(row && row.i)
    }));

    const removedObj = {};
    Array.from(this._raciRemovedStakeholdersByPhase.entries()).forEach(([phaseKey, set]) => {
      removedObj[String(phaseKey)] = Array.from(set || []);
    });
    payload.raci.removedStakeholdersByPhase = removedObj;

    payload.teamAllocation.items = Array.isArray(this._teamAllocationData) ? this._teamAllocationData : [];

    return payload;
  },

  showTimeline: function () {
    this.showToast('Abrindo histórico do projeto...', 'info');
  },

  showAttachments: function () {
    this.showToast('Abrindo visualização de anexos...', 'info');
  },

  // ---------------------------
  // Utils
  // ---------------------------

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

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

  parseNumber: function (value) {
    const text = this.asText(value).replace(',', '.');
    const parsed = parseFloat(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }
};
