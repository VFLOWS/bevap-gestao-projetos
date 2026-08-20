var projectPlanningController = {
  _eventNamespace: '.projectPlanning',
  _projectFields: ['documentid', 'titulodoprojetoNS', 'areaUnidadeNS', 'solicitanteNomeNS', 'patrocinadorNS', 'prioridadeNS', 'estadoProcesso', 'projectPlanningJsonDP', 'documentsJsonDP', 'execucaoProjetoTITT', 'execFasesAtividadesCorrecao', 'milestoneTaskCancelProcDP'],

  _nextStateAfterPlanning: '16',

  _headerBackup: null,
  _globalsBackup: null,
  _pendingDeleteAction: null,
  _toastTimeoutId: null,

  _raciMatrixData: [],
  _raciRemovedStakeholdersByPhase: new Map(), // Mantido para compatibilidade, mesmo sendo manual agora
  _teamAllocationData: [],
  _communicationPlanData: [],

  _state: {
    documentId: '',
    estadoProcesso: '',
    processType: '',
    processName: '',
    datasetId: '',
    formName: '',
    currentStep: 1,
    totalSteps: 5,
    employeeOptions: [], // Trocamos o _responsibleOptions por este estado carregado dinamicamente
    isExecutionCorrection: false,
    lockedTaskKeys: new Set(),
    lockedMilestoneIds: new Set(),
    stepLabels: {
      1: 'EAP/WBS',
      2: 'Cronograma',
      3: 'Riscos',
      4: 'RACI',
      5: 'Documentos'
    }
  },

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

      // Carrega os funcionários no load
      await this.loadEmployeeOptions();

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

  // ---------------------------
  // Integração de Funcionários (dsBuscaFunc)
  // ---------------------------
  loadEmployeeOptions: async function () {
    let rows = [];
    try {
      rows = await fluigService.getDatasetRows('dsBuscaFunc', {
        fields: ['CHAPA', 'CHAPANOMEFUNCIONARIO', 'NOMEFUNCAO', 'NOMESECAO']
      });
    } catch (error) {
      try {
        rows = await fluigService.getDataset('dsBuscaFunc');
      } catch (e) {
        console.warn('Dataset dsBuscaFunc não encontrado. Utilizando array vazio.', e);
      }
    }

    this._state.employeeOptions = (Array.isArray(rows) ? rows : []).map((row) => {
      const chapa = this.asText(row.CHAPA || row.chapa);
      const rawName = this.asText(row.CHAPANOMEFUNCIONARIO || row.chapanomefuncionario || row.NOME || row.nome);
      const normalizedName = this.normalizeEmployeeName(rawName);

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
    let text = this.asText(value);
    if (!text) return '';
    const dashIndex = text.indexOf('-');
    if (dashIndex >= 0) text = text.slice(dashIndex + 1);

    text = text.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!text) return '';
    return text.replace(/(^|\s)(\S)/g, (match, separator, letter) => separator + letter.toUpperCase());
  },

  getNextPersistentTaskSequenceId: function () {
    if (!Number.isFinite(this._state.wbsTaskSeqRuntime)) {
      const baseValue = parseInt(this.asText($('input[name="milestoneTaskSeqCtrlDP"]').val()), 10);
      this._state.wbsTaskSeqRuntime = isNaN(baseValue) ? 0 : baseValue;
    }
    this._state.wbsTaskSeqRuntime += 1;
    return String(this._state.wbsTaskSeqRuntime);
  },

  ensurePersistentTaskId: function (rawId) {
    const text = this.asText(rawId);
    if (/^\d+$/.test(text)) {
      const numericValue = parseInt(text, 10);
      if (!Number.isFinite(this._state.wbsTaskSeqRuntime) || numericValue > this._state.wbsTaskSeqRuntime) {
        this._state.wbsTaskSeqRuntime = numericValue;
      }
      return text;
    }
    return this.getNextPersistentTaskSequenceId();
  },

  initAllTagFilters: function (containerElement) {
    if (typeof TagInputFilter === 'undefined') return;
    const $container = $(containerElement || document);

    // 1. Inputs Single (Responsável da WBS / Dependências)
    $container.find('.single-resp-mount').each((_, mount) => {
      if (mount._filterReady) {
        this.refreshResponsibleTagFilter(mount);
        return;
      }
      if (!mount.id) mount.id = `single-resp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      const hiddenInput = $(mount).next('.responsible-input');
      const initialVal = hiddenInput.val();

      const filter = new TagInputFilter(`#${mount.id}`, {
        placeholder: 'Pesquisar responsável...',
        data: this._state.employeeOptions,
        labelField: 'NOME_NORMALIZADO',
        valueField: 'CHAPA',
        columns: [
          { header: 'Chapa', field: 'CHAPA', width: 'w-1/4' },
          { header: 'Nome', field: 'NOME_NORMALIZADO', width: 'w-3/4' }
        ],
        singleSelection: true,
        onItemAdded: (item) => {
          hiddenInput.val(item.NOME_NORMALIZADO).trigger('change');
          this.onWbsChanged();
        },
        onItemRemoved: () => {
          hiddenInput.val('').trigger('change');
          this.onWbsChanged();
        }
      });

      mount._filterInstance = filter;
      this.refreshResponsibleTagFilter(mount);
      mount._filterReady = true;
    });

    // 2. Inputs Múltiplos para RACI (como se fosse um search engine para os chips)
    $container.find('.raci-tag-mount').each((_, mount) => {
      if (mount._filterReady) return;
      if (!mount.id) mount.id = `raci-resp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      const index = $(mount).data('index');
      const field = $(mount).data('field');

      const filter = new TagInputFilter(`#${mount.id}`, {
        placeholder: 'Adicionar pessoa...',
        data: this._state.employeeOptions,
        labelField: 'NOME_NORMALIZADO',
        valueField: 'CHAPA',
        columns: [
          { header: 'Chapa', field: 'CHAPA', width: 'w-1/4' },
          { header: 'Nome', field: 'NOME_NORMALIZADO', width: 'w-3/4' }
        ],
        singleSelection: true, // usamos true mas limpamos em seguida para gerar a UX de chips
        onItemAdded: (item) => {
          this.addRaciStakeholder(index, field, item.NOME_NORMALIZADO);
          setTimeout(() => { if (filter.removeAll) filter.removeAll(); }, 10);
        }
      });
      mount._filterReady = true;
    });

    // 3. Inputs Múltiplos para Plano de Comunicação
    $container.find('.comm-tag-mount').each((_, mount) => {
      if (mount._filterReady) return;
      if (!mount.id) mount.id = `comm-resp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      const index = $(mount).data('index');

      const filter = new TagInputFilter(`#${mount.id}`, {
        placeholder: 'Adicionar público...',
        data: this._state.employeeOptions,
        labelField: 'NOME_NORMALIZADO',
        valueField: 'CHAPA',
        columns: [
          { header: 'Chapa', field: 'CHAPA', width: 'w-1/4' },
          { header: 'Nome', field: 'NOME_NORMALIZADO', width: 'w-3/4' }
        ],
        singleSelection: true,
        onItemAdded: (item) => {
          this.addCommunicationAudience(index, item.NOME_NORMALIZADO);
          setTimeout(() => { if (filter.removeAll) filter.removeAll(); }, 10);
        }
      });
      mount._filterReady = true;
    });
  },

  refreshResponsibleTagFilter: function (mount) {
    if (!mount || !mount._filterInstance) return;
    const hiddenInput = $(mount).next('.responsible-input');
    const initialVal = this.asText(hiddenInput.val());
    if (!initialVal) return;
    const normalizedInitialValue = this.normalizeEmployeeName(initialVal);
    if (!normalizedInitialValue) return;
    const found = this._state.employeeOptions.find(e => e.NOME_NORMALIZADO === normalizedInitialValue);
    mount._filterInstance.setSelectedItems([{
      value: found ? found.CHAPA : `legacy:${normalizedInitialValue}`,
      label: found ? found.NOME_NORMALIZADO : normalizedInitialValue
    }]);
  },

  refreshAllResponsibleTagFilters: function (containerElement) {
    const $container = $(containerElement || document);
    $container.find('.single-resp-mount').each((_, mount) => this.refreshResponsibleTagFilter(mount));
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

    $(document).on(`input${this._eventNamespace} change${this._eventNamespace}`, '#wbs-container input, #wbs-container textarea, #wbs-container select', () => {
      this.onWbsChanged();
    });

    $(document).on(`input${this._eventNamespace} change${this._eventNamespace}`, '#milestones-container input, #milestones-container select', () => {
      this.updateMilestoneTimeline();
      this.syncRaciWithMilestones(); // RACI agora segue o cronograma
    });

    $('#page-container').on(`click${this._eventNamespace}`, '[data-action="show-timeline"]', (event) => {
      event.preventDefault();
      this.showTimeline();
    });

    $('#page-container').on(`click${this._eventNamespace}`, '[data-action="show-attachments"]', (event) => {
      event.preventDefault();
      this.showAttachments();
    });

    $('#page-container').on(`click${this._eventNamespace}`, '#dp-dropzone', (event) => {
      event.preventDefault();
      $('#dp-attachment-input').trigger('click');
    });

    $('#page-container').on(`change${this._eventNamespace}`, '#dp-attachment-input', (event) => {
      this.addAttachments(event.target.files);
      event.target.value = '';
    });

    $('#page-container').on(`click${this._eventNamespace}`, '[data-action="remove-dp-attachment"]', (event) => {
      const id = $(event.currentTarget).data('attachment-id');
      this.removeAttachment(id);
    });
  },

  unbindEvents: function () {
    $(document).off(this._eventNamespace);
    $('#page-container').off(this._eventNamespace);
  },

  initializeUi: function () {
    this.goToStep(1);
    this.initAllTagFilters(document);

    this.initializeMilestoneDatePickers(document);

    if (!document.querySelector('#communication-plan-body tr')) {
      this.addCommunicationPlanRow();
    }

    this._raciMatrixData = [];
    this._raciRemovedStakeholdersByPhase = new Map();
    this._teamAllocationData = [];

    this.renderRaciAndResources();
    this.refreshMilestoneConfiguration();

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
      } catch (error) { }
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
    const requester = this.asText(row && row.solicitanteNomeNS) || '-';
    const sponsor = this.asText(row && row.patrocinadorNS) || '-';
    const priority = this.asText(row && row.prioridadeNS) || '-';
    const executionType = this.asText(row && row.execucaoProjetoTITT);

    const ui = $(document).data('gpUiComponents');
    const summaryTarget = $('#page-container').find('[data-component="project-summary"]').first();
    const progressTarget = $('#page-container').find('[data-component="progress-status"]').first();

    if (ui && ui.sidebar) {
      if (summaryTarget.length) {
        ui.sidebar.renderProjectSummary(summaryTarget, {
          code: projectCode || documentId || '-',
          title: title,
          requester: requester,
          area: area,
          sponsor: sponsor,
          showArea: true,
          showSponsor: true,
          attachmentsCount: 0,
          showAttachmentsCount: false,
          priority: {
            label: this.getPriorityLabel(priority) || 'N/A',
            iconClass: 'fa-solid fa-star',
            badgeClasses: this.getPriorityBadgeClasses(priority)
          },
          customRows: [
            {
              variant: 'badge',
              label: 'Tipo',
              value: this.getExecutionTypeLabel(executionType) || 'N/A',
              iconClass: 'fa-solid fa-arrow-up-right-from-square',
              badgeClasses: this.getExecutionTypeBadgeClasses(executionType)
            }
          ],
          showStatus: false
        });
      }

      if (progressTarget.length) {
        ui.sidebar.renderProgress(progressTarget, {
          items: this.getProgressItems()
        });

        const progressCard = progressTarget.find('[data-gp-component="progress-status"]');

        if (progressCard.length) {
          progressCard.removeClass('bg-white rounded-lg shadow-md p-5');

          const titleEl = progressCard.find('h3');
          titleEl.html('<i class="fa-solid fa-list-check mr-2 text-bevap-navy"></i> Progresso');

          const masterCardHtml = `
            <div class="bg-white rounded-lg shadow-md p-5">
              <div class="mb-5 pb-5 border-b border-gray-200">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold text-gray-600">Progresso do Plano</span>
                  <span id="plan-progress-text" class="text-sm font-bold text-bevap-green">0%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div id="plan-progress-bar" class="bg-bevap-green h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
              <div id="progress-list-container"></div>
            </div>
          `;

          progressTarget.html(masterCardHtml);
          progressTarget.find('#progress-list-container').append(progressCard);

          this.updatePlanProgress();
        }
      }
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
        fields: [
          'documentid',
          'projectPlanningJsonDP',
          'documentsJsonDP',
          'raciJsonDP',
          'chkEapWbsDP',
          'chkMilestonesDP',
          'chkRisksDP',
          'chkRaciDP',
          'chkDocsDP',
          'execFasesAtividadesCorrecao',
          'milestoneTaskCancelProcDP',
          
        ],
        filters: {
          documentid: documentId,
          sqlLimit: 1
        }
      });

      const row = rows && rows.length ? rows[0] : null;
      if (!row) {
        return;
      }

      const payload = this.buildPlanningPayloadFromStoredRow(row);
      if (!payload) {
        return;
      }

      this._state.isExecutionCorrection = this.normalizeBoolean(row && row.execFasesAtividadesCorrecao);
      this._state.cancelledMilestoneProcesses = this.parseJson(row && row.milestoneTaskCancelProcDP) || [];
      this.loadStoredAttachments(row && row.documentsJsonDP);
      this.prepareCorrectionLocks(payload, row);
      this.applyPlanningPayload(payload);
      this.showToast('Rascunho carregado.', 'info');
    } catch (error) {
      console.error('[projectPlanningController] loadPlanningDraft error:', error);
      this.showToast(`Falha ao carregar rascunho: ${this.asText(error && (error.message || error)) || 'erro'}`, 'warning');
    }
  },

  buildPlanningPayloadFromStoredRow: function (row) {
    const payload = this.parseJson(row && row.projectPlanningJsonDP) || this.createEmptyPlanningPayload();
    const currentChecklist = payload.checklist || {};

    payload.checklist = {
      eapWbs: this.asText(row && row.chkEapWbsDP) ? this.normalizeBoolean(row && row.chkEapWbsDP) : !!currentChecklist.eapWbs,
      milestones: this.asText(row && row.chkMilestonesDP) ? this.normalizeBoolean(row && row.chkMilestonesDP) : !!currentChecklist.milestones,
      risks: this.asText(row && row.chkRisksDP) ? this.normalizeBoolean(row && row.chkRisksDP) : !!currentChecklist.risks,
      raci: this.asText(row && row.chkRaciDP) ? this.normalizeBoolean(row && row.chkRaciDP) : !!currentChecklist.raci,
      docs: this.asText(row && row.chkDocsDP) ? this.normalizeBoolean(row && row.chkDocsDP) : !!currentChecklist.docs
    };

    const phaseRows = this.parseJson(row && row.tblWbsPhasesDP);
    const taskRows = this.parseJson(row && row.tblWbsTasksDP);
    const milestoneRows = this.parseJson(row && row.tblMilestonesDP);
    const criteriaRows = this.parseJson(row && row.tblMilestoneCriteriaDP);
    const milestoneTaskRows = this.parseJson(row && row.tblMilestoneTasksDP);
    const summaryRows = this.parseJson(row && row.tblMilestoneTasksSummaryDP);
    const riskRows = this.parseJson(row && row.tblRisksDP);
    const dependencyRows = this.parseJson(row && row.tblExternalDependenciesDP);
    const communicationRows = this.parseJson(row && row.tblCommunicationPlanDP);
    const allocationRows = this.parseJson(row && row.tblTeamAllocationDP);
    const raciJson = this.parseJson(row && row.raciJsonDP);

    const storedWbs = this.buildStoredWbsPayload(phaseRows, taskRows, payload.wbs);
    const storedMilestones = this.buildStoredMilestonesPayload(milestoneRows, criteriaRows, milestoneTaskRows, summaryRows, storedWbs, payload.milestones);
    const storedRisks = this.buildStoredRisksPayload(riskRows, payload.risks);
    const storedDependencies = this.buildStoredDependenciesPayload(dependencyRows, payload.externalDependencies);
    const storedCommunication = this.buildStoredCommunicationPayload(communicationRows, payload.communicationPlan);
    const storedAllocation = this.buildStoredAllocationPayload(allocationRows, payload.teamAllocation);
    const storedRaci = this.buildStoredRaciPayload(raciJson, payload.raci);

    payload.wbs = storedWbs;
    payload.milestones = storedMilestones;
    payload.risks = storedRisks;
    payload.externalDependencies = storedDependencies;
    payload.communicationPlan = storedCommunication;
    payload.teamAllocation = storedAllocation;
    payload.raci = storedRaci;

    return payload;
  },

  createEmptyPlanningPayload: function () {
    return {
      meta: {
        documentId: this.asText(this._state.documentId),
        savedAt: '',
        version: 1
      },
      checklist: {
        eapWbs: false,
        milestones: false,
        risks: false,
        raci: false,
        docs: false
      },
      wbs: {
        phases: [],
        summary: {
          totalEffortHours: 0,
          totalDurationDays: 0
        }
      },
      milestones: { items: [] },
      risks: { items: [] },
      externalDependencies: { items: [] },
      communicationPlan: { items: [] },
      raci: { rows: [], removedStakeholdersByPhase: {} },
      teamAllocation: { items: [] }
    };
  },

  buildStoredWbsPayload: function (phaseRows, taskRows, existingWbs) {
    const phases = Array.isArray(phaseRows) ? phaseRows.slice() : [];
    const tasks = Array.isArray(taskRows) ? taskRows.slice() : [];
    if (!phases.length && !tasks.length) {
      return existingWbs && typeof existingWbs === 'object' ? existingWbs : this.createEmptyPlanningPayload().wbs;
    }
    const taskMap = new Map();
    const existingPhaseMap = new Map();

    (((existingWbs || {}).phases) || []).forEach((phase) => {
      existingPhaseMap.set(this.asText(phase && phase.id), phase || {});
    });

    tasks.forEach((task) => {
      const phaseId = this.asText(task && task.wbsTaskPhaseIdDP);
      if (!taskMap.has(phaseId)) taskMap.set(phaseId, []);
      taskMap.get(phaseId).push(task);
    });

    phases.sort((left, right) => (parseInt(left && left.wbsPhaseOrderDP, 10) || 0) - (parseInt(right && right.wbsPhaseOrderDP, 10) || 0));

    const normalizedPhases = phases.map((phase, phaseIndex) => {
      const phaseId = this.asText(phase && phase.wbsPhaseIdDP) || `phase-${phaseIndex + 1}`;
      const existingPhase = existingPhaseMap.get(phaseId) || {};
      const normalizedTasks = (taskMap.get(phaseId) || []).sort((left, right) => {
        return (parseInt(left && left.wbsTaskOrderDP, 10) || 0) - (parseInt(right && right.wbsTaskOrderDP, 10) || 0);
      }).map((task, taskIndex) => {
        const taskId = this.ensurePersistentTaskId(this.asText(task && task.wbsTaskIdDP));
        const existingTask = ((existingPhase.tasks) || []).find((item) => this.asText(item && item.id) === taskId)
          || ((existingPhase.tasks) || []).find((item) => this.asText(item && item.name) === this.asText(task && task.wbsTaskNameDP))
          || {};
        return {
          id: taskId,
          order: parseInt(task && task.wbsTaskOrderDP, 10) || (taskIndex + 1),
          name: this.asText(task && task.wbsTaskNameDP),
          responsible: this.asText(task && task.wbsTaskResponsibleDP),
          effortHours: this.parseNumber(task && task.wbsTaskEffortHoursDP),
          durationDays: this.parseNumber(task && task.wbsTaskDurationDaysDP),
          dependencies: Array.isArray(existingTask.dependencies) ? existingTask.dependencies : []
        };
      });

      return {
        id: phaseId,
        order: parseInt(phase && phase.wbsPhaseOrderDP, 10) || (phaseIndex + 1),
        name: this.asText(phase && phase.wbsPhaseNameDP),
        responsible: this.asText(phase && phase.wbsPhaseResponsibleDP),
        effortHours: this.parseNumber(phase && phase.wbsPhaseEffortHoursDP),
        durationDays: this.parseNumber(phase && phase.wbsPhaseDurationDaysDP),
        notes: this.asText(phase && phase.wbsPhaseNotesDP) || this.asText(existingPhase.notes),
        dependencies: Array.isArray(existingPhase.dependencies) ? existingPhase.dependencies : [],
        tasks: normalizedTasks
      };
    });

    return {
      phases: normalizedPhases,
      summary: {
        totalEffortHours: normalizedPhases.reduce((sum, phase) => sum + this.parseNumber(phase.effortHours), 0),
        totalDurationDays: normalizedPhases.reduce((sum, phase) => sum + this.parseNumber(phase.durationDays), 0)
      }
    };
  },

  buildStoredMilestonesPayload: function (milestoneRows, criteriaRows, milestoneTaskRows, summaryRows, wbsPayload, existingMilestones) {
    const milestones = Array.isArray(milestoneRows) ? milestoneRows.slice() : [];
    const criteria = Array.isArray(criteriaRows) ? criteriaRows.slice() : [];
    const milestoneTasks = Array.isArray(milestoneTaskRows) ? milestoneTaskRows.slice() : [];
    const summaries = Array.isArray(summaryRows) ? summaryRows.slice() : [];
    if (!milestones.length && !criteria.length && !milestoneTasks.length && !summaries.length) {
      return existingMilestones && typeof existingMilestones === 'object' ? existingMilestones : { items: [] };
    }
    const phaseNameByTask = new Map();

    (((wbsPayload || {}).phases) || []).forEach((phase) => {
      (phase.tasks || []).forEach((task) => {
        phaseNameByTask.set(this.buildMilestoneTaskIdentityKey({
          milestoneId: '',
          taskName: task.name,
          dueDate: ''
        }), this.asText(phase.name));
      });
    });

    const criteriaByMilestoneId = new Map();
    criteria.forEach((item) => {
      const milestoneId = this.asText(item && item.milestoneCriteriaMilestoneIdDP);
      if (!criteriaByMilestoneId.has(milestoneId)) criteriaByMilestoneId.set(milestoneId, []);
      const text = this.asText(item && item.milestoneCriteriaTextDP);
      if (text) criteriaByMilestoneId.get(milestoneId).push(text);
    });

    const summaryByIdentity = new Map();
    summaries.forEach((item) => {
      const identityKey = this.buildMilestoneTaskIdentityKey({
        milestoneId: '',
        taskName: item && item.milestoneTaskSummaryTextDP,
        dueDate: item && item.milestoneTaskSummaryDueDateDP
      });
      const list = summaryByIdentity.get(identityKey) || [];
      list.push(item);
      summaryByIdentity.set(identityKey, list);
    });

    return {
      items: milestones.map((milestone, milestoneIndex) => {
        const milestoneId = this.asText(milestone && milestone.milestoneIdDP) || `milestone-${milestoneIndex + 1}`;
        const tasks = milestoneTasks
          .filter((task) => this.asText(task && task.milestoneTaskMilestoneIdDP) === milestoneId)
          .map((task) => {
            const identityKey = this.buildMilestoneTaskIdentityKey({
              milestoneId: '',
              taskName: task && task.milestoneTaskTextDP,
              dueDate: task && task.milestoneTaskDueDateDP
            });
            const summary = (summaryByIdentity.get(identityKey) || []).find((item) => {
              return this.asText(item && item.milestoneTaskSummaryMarcoDP) === this.asText(milestone && milestone.milestoneNameDP);
            }) || {};
            const taskName = this.asText(task && task.milestoneTaskTextDP);
            const phaseName = this.asText(summary && summary.milestoneTaskSummaryPhaseDP) || phaseNameByTask.get(this.buildMilestoneTaskIdentityKey({
              milestoneId: '',
              taskName: taskName,
              dueDate: ''
            })) || '';

            return {
              taskId: this.asText(task && task.milestoneTaskIdDP) || this.asText(summary && summary.milestoneTaskSummaryIdDP),
              taskKey: phaseName && taskName ? `${phaseName}:::${taskName}` : '',
              phaseName: phaseName,
              task: taskName,
              taskLabel: taskName,
              dueDate: this.asText(task && task.milestoneTaskDueDateDP),
              process: this.asText(task && task.milestoneTaskProcessDP) || this.asText(summary && summary.milestoneTaskSummaryProcessDP),
              documentId: this.asText(task && task.milestoneTaskDocIdDP) || this.asText(summary && summary.milestoneTaskSummaryDocIdDP),
              status: this.asText(task && task.milestoneTaskStatusDP) || this.asText(summary && summary.milestoneTaskSummaryStatusDP),
              started: this.asText(task && task.milestoneTaskStartedDP) || this.asText(summary && summary.milestoneTaskSummaryStartedDP)
            };
          });

        return {
          id: milestoneId,
          order: milestoneIndex + 1,
          name: this.asText(milestone && milestone.milestoneNameDP),
          period: this.joinMilestonePeriod(
            this.asText(milestone && milestone.milestoneStartDateDP),
            this.asText(milestone && milestone.milestoneEndDateDP)
          ),
          startDate: this.asText(milestone && milestone.milestoneStartDateDP),
          endDate: this.asText(milestone && milestone.milestoneEndDateDP),
          criteria: criteriaByMilestoneId.get(milestoneId) || [],
          tasks: tasks
        };
      })
    };
  },

  buildStoredRisksPayload: function (riskRows, existingRisks) {
    if (!Array.isArray(riskRows) || !riskRows.length) {
      return existingRisks && typeof existingRisks === 'object' ? existingRisks : { items: [] };
    }
    const items = Array.isArray(riskRows) ? riskRows.map((risk, index) => ({
      id: this.asText(risk && risk.riskIdDP) || `risk-${index + 1}`,
      title: this.asText(risk && risk.riskDescriptionDP),
      description: this.asText(risk && risk.riskDescriptionDP),
      probability: this.asText(risk && risk.riskProbabilityDP),
      impact: this.asText(risk && risk.riskImpactDP),
      mitigation: this.asText(risk && risk.riskMitigationDP),
      planB: this.asText(risk && risk.riskPlanBDP),
      fallback: this.asText(risk && risk.riskPlanBDP),
      level: this.asText(risk && risk.riskImpactDP)
    })).filter((risk) => risk.title || risk.mitigation || risk.planB) : [];
    return { items };
  },

  buildStoredDependenciesPayload: function (rows, existingDependencies) {
    if (!Array.isArray(rows) || !rows.length) {
      return existingDependencies && typeof existingDependencies === 'object' ? existingDependencies : { items: [] };
    }
    const items = Array.isArray(rows) ? rows.map((item, index) => ({
      id: this.asText(item && item.externalDependencyIdDP) || `dependency-${index + 1}`,
      title: this.asText(item && item.externalDependencyDescriDP),
      description: this.asText(item && item.externalDependencyDescriDP),
      status: this.asText(item && item.externalDependencyStatusDP),
      owner: this.asText(item && item.externalDependencyResponDP),
      responsible: this.asText(item && item.externalDependencyResponDP),
      mitigation: this.asText(item && item.externalDependencyMitiDP),
      fallback: this.asText(item && item.externalDependencyPlanBDP),
      planB: this.asText(item && item.externalDependencyPlanBDP)
    })).filter((item) => item.title || item.mitigation || item.fallback) : [];
    return { items };
  },

  buildStoredCommunicationPayload: function (rows, existingCommunication) {
    if (!Array.isArray(rows) || !rows.length) {
      return existingCommunication && typeof existingCommunication === 'object' ? existingCommunication : { items: [] };
    }
    const items = Array.isArray(rows) ? rows.map((item) => ({
      audience: this.normalizeStakeholderField(item && item.commAudienceDP),
      channel: this.asText(item && item.commChannelDP),
      frequency: this.asText(item && item.commFrequencyDP)
    })).filter((item) => item.audience.length || item.channel || item.frequency) : [];
    return { items };
  },

  buildStoredAllocationPayload: function (rows, existingAllocation) {
    if (!Array.isArray(rows) || !rows.length) {
      return existingAllocation && typeof existingAllocation === 'object' ? existingAllocation : { items: [] };
    }
    const items = Array.isArray(rows) ? rows.map((item) => ({
      member: this.asText(item && item.allocMemberDP),
      profile: this.asText(item && item.allocProfileDP),
      dedication: this.parseNumber(item && item.allocDedicationDP)
    })).filter((item) => item.member || item.profile || item.dedication) : [];
    return { items };
  },

  buildStoredRaciPayload: function (raciJson, existingRaci) {
    const parsed = raciJson && typeof raciJson === 'object' ? raciJson : {};
    if (!Array.isArray(parsed.rows) || !parsed.rows.length) {
      return existingRaci && typeof existingRaci === 'object' ? existingRaci : { rows: [], removedStakeholdersByPhase: {} };
    }
    const rows = Array.isArray(parsed.rows) ? parsed.rows.map((item) => ({
      phase: this.asText(item && item.phase),
      r: this.normalizeStakeholderField(item && item.r),
      a: this.normalizeStakeholderField(item && item.a),
      c: this.normalizeStakeholderField(item && item.c),
      i: this.normalizeStakeholderField(item && item.i)
    })) : [];

    return {
      rows: rows,
      removedStakeholdersByPhase: parsed.removedStakeholdersByPhase || {}
    };
  },

  joinMilestonePeriod: function (startDate, endDate) {
    const start = this.asText(startDate);
    const end = this.asText(endDate);
    if (!start) return '';
    return end && end !== start ? `${start} - ${end}` : start;
  },

  applyPlanningPayload: function (payload) {
    const finalPayload = payload && typeof payload === 'object' ? payload : {};

    // ADICIONA ESTE BLOCO AQUI (Para carregar o Checklist)
    const chk = finalPayload.checklist || {};
    const eapEl = document.getElementById('check-eap-wbs');
    const milesEl = document.getElementById('check-milestones');
    const risksEl = document.getElementById('check-risks');
    const raciEl = document.getElementById('check-raci');
    const docsEl = document.getElementById('check-docs');

    if (eapEl) eapEl.checked = !!chk.eapWbs;
    if (milesEl) milesEl.checked = !!chk.milestones;
    if (risksEl) risksEl.checked = !!chk.risks;
    if (raciEl) raciEl.checked = !!chk.raci;
    if (docsEl) docsEl.checked = !!chk.docs;
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
      phaseEl.dataset.phaseId = this.asText(phase && phase.id);

      const panel = phaseEl.querySelector('.wbs-panel-content');
      const nameInput = phaseEl.querySelector('.wbs-phase-name-input');
      if (nameInput) nameInput.value = this.asText(phase && phase.name);

      const respInput = panel && panel.querySelector('.responsible-input');
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
        this.addSubtask(btn, task);

        const taskEls = phaseEl.querySelectorAll('.subtask-container .wbs-subtask');
        const taskEl = taskEls && taskEls.length ? taskEls[taskEls.length - 1] : null;
        if (!taskEl) return;
        taskEl.dataset.taskId = this.asText(task && task.id);

        const taskNameInput = taskEl.querySelector('.wbs-task-name-input');
        if (taskNameInput) taskNameInput.value = this.asText(task && task.name);

        const taskResp = taskEl.querySelector('.responsible-input');
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
      milestoneEl.dataset.milestoneId = this.asText(milestone && milestone.id);

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
            this.addMilestoneTask(btn, {
              taskId: this.asText(t && (t.taskId || t.id || t.milestoneTaskIdDP)),
              sourceTaskId: this.asText(t && (t.sourceTaskId || t.wbsTaskId)) || this.findWbsTaskIdByIdentity(this.asText(t && t.phaseName), this.asText(t && (t.task || t.taskLabel))),
              taskKey: this.asText(t && t.taskKey),
              phaseName: this.asText(t && t.phaseName),
              task: this.asText(t && (t.task || t.taskLabel)),
              date: this.asText(t && t.dueDate)
            });
            const lastRow = taskList.lastElementChild;
            if (!lastRow) return;
            const taskInput = lastRow.querySelector('.milestone-task-search');
            const dateInput = lastRow.querySelector('input[type="date"]');
            const taskKey = this.asText(t && (t.taskKey || ((t.phaseName && t.task) ? (t.phaseName + ':::' + t.task) : '')));
            if (taskKey) lastRow.dataset.taskKey = taskKey;
        if (taskInput) taskInput.value = this.asText(t && (t.task || t.taskLabel));
        if (dateInput) dateInput.value = this.asText(t && t.dueDate);
            lastRow.dataset.taskId = this.asText(t && (t.taskId || t.id || t.milestoneTaskIdDP));
            lastRow.dataset.sourceTaskId = this.asText(t && (t.sourceTaskId || t.wbsTaskId));
            lastRow.dataset.taskProcess = this.asText(t && (t.process || t.taskProcess || t.parentProcess));
            lastRow.dataset.taskDocumentId = this.asText(t && (t.documentId || t.docId || t.taskDocumentId));
            lastRow.dataset.taskStatus = this.asText(t && t.status);
            lastRow.dataset.taskStarted = this.asText(t && t.started);
          });
        }
      }

      this.initializeMilestoneDatePickers(milestoneEl);
      this.refreshMilestoneTaskSelectOptions();
    });

    this.applyExecutionCorrectionLocks();

    // Risks
    const risks = finalPayload.risks && Array.isArray(finalPayload.risks.items) ? finalPayload.risks.items : [];
    risks.forEach((risk) => {
      this.addRisk();
      const cards = document.querySelectorAll('#risk-matrix-list > .risk-item');
      const card = cards && cards.length ? cards[cards.length - 1] : null;
      if (!card) return;

      this.setRiskCardData(card, {
        title: this.asText(risk && (risk.title || risk.description)),
        level: this.asText(risk && (risk.level || risk.riskLevel)) || 'Alto',
        probability: this.asText(risk && (risk.probability || risk.riskProbability)) || 'Alta',
        impact: this.asText(risk && (risk.impact || risk.riskImpact)) || 'Alto',
        mitigation: this.asText(risk && risk.mitigation),
        fallback: this.asText(risk && (risk.fallback || risk.planB))
      });
      this.renderRiskReadOnlyCard(card);
    });

    // External dependencies
    const extDeps = finalPayload.externalDependencies && Array.isArray(finalPayload.externalDependencies.items)
      ? finalPayload.externalDependencies.items
      : [];
    extDeps.forEach((dep) => {
      this.addExternalDependency();
      const cards = document.querySelectorAll('#external-dependencies-list > .dependency-item');
      const card = cards && cards.length ? cards[cards.length - 1] : null;
      if (!card) return;

      this.setDependencyCardData(card, {
        title: this.asText(dep && (dep.title || dep.description)),
        status: this.asText(dep && dep.status) || 'Pendente',
        owner: this.asText(dep && (dep.owner || dep.responsible)),
        mitigation: this.asText(dep && dep.mitigation),
        fallback: this.asText(dep && (dep.fallback || dep.planB))
      });
      this.renderDependencyReadOnlyCard(card);
    });

    // Communication plan
    this._communicationPlanData = finalPayload.communicationPlan && Array.isArray(finalPayload.communicationPlan.items)
      ? finalPayload.communicationPlan.items
      : [];
    if (!this._communicationPlanData.length) {
      this.addCommunicationPlanRow();
    } else {
      this.renderCommunicationPlanTable();
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

    // re-sync + render
    this.initAllTagFilters(document);
    this.refreshAllResponsibleTagFilters(document);
    window.setTimeout(() => this.refreshAllResponsibleTagFilters(document), 50);
    this.syncTeamAllocationInternal();
    this.refreshMilestoneConfiguration(); // Isso engatilha o syncRaciWithMilestones
    this.renderRaciAndResources();
    this.updateDocumentsPlanSummary();
    this.applyExecutionCorrectionLocks();
  },

  prepareCorrectionLocks: function (payload, row) {
    this._state.lockedTaskKeys = new Set();
    this._state.lockedTaskIds = new Set();
    this._state.lockedMilestoneIds = new Set();
    if (!this._state.isExecutionCorrection) return;

    const lockedIds = new Set();
    const lockedKeys = new Set();
    const tableRows = this.parseJson(row && row.tblMilestoneTasksDP);
    if (Array.isArray(tableRows)) {
      tableRows.forEach((taskRow) => {
        const status = this.normalizeTaskExecutionStatus(taskRow && taskRow.milestoneTaskStatusDP);
        if (status === 'concluido' || status === 'cancelado') {
          const taskId = this.asText(taskRow.milestoneTaskIdDP);
          if (taskId) {
            lockedIds.add(taskId);
            this._state.lockedTaskIds.add(taskId);
          }
          lockedKeys.add(this.buildMilestoneTaskIdentityKey({
            milestoneId: taskRow.milestoneTaskMilestoneIdDP,
            taskName: taskRow.milestoneTaskTextDP,
            dueDate: taskRow.milestoneTaskDueDateDP
          }));
        }
      });
    }

    const summaryRows = this.parseJson(row && row.tblMilestoneTasksSummaryDP);
    if (Array.isArray(summaryRows)) {
      summaryRows.forEach((summaryRow) => {
        const status = this.normalizeTaskExecutionStatus(summaryRow && summaryRow.milestoneTaskSummaryStatusDP);
        if (status === 'concluido' || status === 'cancelado') {
          const taskId = this.asText(summaryRow.milestoneTaskSummaryIdDP);
          if (taskId) {
            lockedIds.add(taskId);
            this._state.lockedTaskIds.add(taskId);
          }
        }
      });
    }

    const milestones = payload && payload.milestones && Array.isArray(payload.milestones.items) ? payload.milestones.items : [];
    milestones.forEach((milestone) => {
      (Array.isArray(milestone.tasks) ? milestone.tasks : []).forEach((task) => {
        const status = this.normalizeTaskExecutionStatus(task.status);
        const taskId = this.asText(task.taskId || task.id || task.milestoneTaskIdDP);
        const identityKey = this.buildMilestoneTaskIdentityKey({
          milestoneId: milestone && milestone.id,
          taskName: task.task || task.taskLabel,
          dueDate: task.dueDate
        });
        if ((taskId && lockedIds.has(taskId)) || (identityKey && lockedKeys.has(identityKey)) || status === 'concluido' || status === 'cancelado') {
          const taskKey = this.asText(task.taskKey || ((task.phaseName && (task.task || task.taskLabel)) ? `${task.phaseName}:::${task.task || task.taskLabel}` : ''));
          if (taskKey) this._state.lockedTaskKeys.add(taskKey);
          if (taskId) this._state.lockedTaskIds.add(taskId);
          task.status = status || 'concluido';
        }
      });
    });
  },

  applyExecutionCorrectionLocks: function () {
    if (!this._state.isExecutionCorrection) return;
    const lockedTaskKeys = this._state.lockedTaskKeys || new Set();
    const lockedTaskIds = this._state.lockedTaskIds || new Set();

    document.querySelectorAll('#wbs-container > .wbs-item').forEach((phaseEl) => {
      phaseEl.querySelectorAll('.subtask-container > .wbs-subtask').forEach((taskEl) => {
        const phaseName = this.asText(phaseEl.querySelector('.wbs-phase-name-input')?.value);
        const taskName = this.asText(taskEl.querySelector('.wbs-task-name-input')?.value);
        const taskKey = `${phaseName}:::${taskName}`;
        const taskId = this.asText(taskEl.dataset.taskId);
        if (!lockedTaskIds.has(taskId) && !lockedTaskKeys.has(taskKey)) return;
        taskEl.dataset.lockedExecution = 'true';
        taskEl.classList.add('opacity-75');
        taskEl.querySelectorAll('input, textarea, button').forEach((el) => {
          el.disabled = true;
          el.classList.add('cursor-not-allowed');
        });
      });
    });

    document.querySelectorAll('#milestones-container > .milestone-card').forEach((milestoneEl, index) => {
      milestoneEl.querySelectorAll('.milestone-task-row').forEach((row) => {
        const taskId = this.asText(row.dataset.taskId);
        const taskKey = this.asText(row.dataset.taskKey);
        if (!lockedTaskIds.has(taskId) && !lockedTaskKeys.has(taskKey)) return;
        row.dataset.lockedExecution = 'true';
        row.classList.add('opacity-75');
        row.querySelectorAll('input, button').forEach((el) => {
          el.disabled = true;
          el.classList.add('cursor-not-allowed');
        });
      });
    });
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
      this.syncRaciWithMilestones();
      this.renderRaciAndResources();
    }
  },

  onWbsChanged: function () {
    this.syncTeamAllocationInternal();
    this.pruneMilestoneTasksWithoutWbsSource();
    this.refreshMilestoneTaskSelectOptions();
    this.updateMilestoneTimeline();

    const step4 = document.getElementById('step-4');
    const isStep4Visible = step4 && !step4.classList.contains('hidden');
    if (isStep4Visible) {
      this.renderTeamAllocationList();
    }

    this.updateDocumentsPlanSummary();
  },

  pruneMilestoneTasksWithoutWbsSource: function () {
    const catalog = this.getMilestoneCatalog().tasks || [];
    const validTaskIds = new Set(catalog.map((task) => this.asText(task && task.id)).filter(Boolean));
    document.querySelectorAll('.milestone-task-row').forEach((row) => {
      const sourceTaskId = this.asText(row.dataset.sourceTaskId);
      if (!sourceTaskId || validTaskIds.has(sourceTaskId)) return;
      this.queueCancelledMilestoneProcess(row);
      row.remove();
    });
    this.updateMilestoneTaskTitles();
  },

  parseMilestonePeriod: function (periodText) {
    const text = this.asText(periodText);
    if (!text) {
      return { startDate: '', endDate: '' };
    }

    const separator = text.includes(' - ')
      ? ' - '
      : text.includes(' até ')
        ? ' até '
        : text.includes(' ate ')
          ? ' ate '
          : null;

    const parts = separator ? text.split(separator).map((value) => this.normalizePeriodDateToIso(value)) : [this.normalizePeriodDateToIso(text)];
    const startDate = this.asText(parts[0]);
    const endDate = this.asText(parts[1] || parts[0]);

    if (!startDate) {
      return { startDate: '', endDate: '' };
    }

    return { startDate, endDate };
  },

  normalizePeriodDateToIso: function (dateValue) {
    const text = this.asText(dateValue);
    if (!text) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
      const [day, month, year] = text.split('/');
      return `${year}-${month}-${day}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
      const [day, month, year] = text.split('-');
      return `${year}-${month}-${day}`;
    }
    return '';
  },

  formatDateBr: function (dateValue) {
    const isoDate = this.normalizePeriodDateToIso(dateValue);
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  },

  getMilestonePrimaryDate: function (periodValue) {
    const period = this.parseMilestonePeriod(periodValue);
    return this.asText(period.endDate || period.startDate);
  },

  formatMilestonePeriodBr: function (periodValue) {
    const period = this.parseMilestonePeriod(periodValue);
    if (!period.startDate) return 'Sem período definido';
    if (!period.endDate || period.endDate === period.startDate) {
      return this.formatDateBr(period.startDate);
    }
    return `${this.formatDateBr(period.startDate)} até ${this.formatDateBr(period.endDate)}`;
  },

  getMilestoneCatalog: function () {
    const phases = [];
    const tasks = [];
    const phaseItems = document.querySelectorAll('#wbs-container > .wbs-item');

    phaseItems.forEach((phaseItem, phaseIndex) => {
      const phaseName = this.asText(phaseItem.querySelector('.wbs-phase-name-input')?.value) || `Fase ${phaseIndex + 1}`;
      phases.push(phaseName);

      phaseItem.querySelectorAll('.subtask-container > .wbs-subtask').forEach((subtask, taskIndex) => {
        const taskName = this.asText(subtask.querySelector('.wbs-task-name-input')?.value) || `Tarefa ${taskIndex + 1}`;
        const taskId = this.asText(subtask.dataset.taskId);
        const key = `${phaseName}:::${taskName}`;
        tasks.push({
          id: taskId,
          key,
          phaseName,
          taskName,
          label: `${phaseName} - ${taskName}`
        });
      });
    });

    return { phases, tasks };
  },

  findWbsTaskIdByIdentity: function (phaseName, taskName) {
    const catalog = this.getMilestoneCatalog().tasks;
    const normalizedPhase = this.normalizeText(phaseName);
    const normalizedTask = this.normalizeText(taskName);
    const match = catalog.find((task) => {
      return this.normalizeText(task.phaseName) === normalizedPhase
        && this.normalizeText(task.taskName) === normalizedTask;
    });
    return this.asText(match && match.id);
  },

  getMilestoneTaskAssignments: function () {
    const assignmentCount = new Map();
    document.querySelectorAll('.milestone-task-row').forEach((row) => {
      const assignmentKey = this.asText(row.dataset.sourceTaskId) || this.asText(row.dataset.taskKey);
      if (!assignmentKey) return;
      assignmentCount.set(assignmentKey, (assignmentCount.get(assignmentKey) || 0) + 1);
    });
    return assignmentCount;
  },

  clearMilestoneTaskMetadata: function (row) {
    if (!row) return;
    row.dataset.taskProcess = '';
    row.dataset.taskDocumentId = '';
    row.dataset.taskStatus = '';
    row.dataset.taskStarted = '';
  },

  getMilestoneTaskRowHTML: function (rowData = {}) {
    const taskDate = this.asText(rowData.date);
    const taskLabel = this.escapeHtml(rowData.taskLabel || '');
    return `
      <div class="milestone-task-row border border-gray-200 rounded-lg bg-white p-4">
        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_190px_auto] gap-3 items-start">
          <div class="w-full min-w-0 relative">
            <label class="block text-sm text-gray-600 mb-1">Descrição da Tarefa</label>
            <div class="relative">
              <input type="text" value="${taskLabel}" class="milestone-task-search w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg text-sm bg-white" placeholder="Pesquisar tarefa...">
              <button type="button" class="milestone-task-clear hidden absolute top-1/2 right-8 -translate-y-1/2 text-red-500 hover:text-red-700 px-1" title="Limpar">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <button type="button" class="milestone-task-toggle absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700 px-1" title="Abrir opções">
                <i class="fa-solid fa-chevron-down text-xs"></i>
              </button>
            </div>
            <div class="milestone-task-dropdown hidden absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto"></div>
            <div class="milestone-task-phase hidden mt-1 text-xs text-gray-500"></div>
          </div>
          <div class="w-full lg:w-auto">
            <label class="block text-sm text-gray-600 mb-1">Data de Entrega</label>
            <input type="date" value="${this.escapeHtml(taskDate)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          </div>
          <div class="flex items-center justify-end space-x-2 shrink-0 pt-6">
            <button type="button" class="milestone-task-handle text-gray-400 hover:text-gray-600 cursor-grab px-1 py-1" title="Mover Tarefa">
              <i class="fa-solid fa-grip-vertical"></i>
            </button>
            <button type="button" class="milestone-task-remove text-red-400 hover:text-red-600 px-1 py-1" title="Remover Tarefa">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindMilestoneTaskRowEvents: function (taskRow) {
    if (!taskRow || taskRow.dataset.eventsReady === 'true') return;

    const taskInput = taskRow.querySelector('.milestone-task-search');
    const clearButton = taskRow.querySelector('.milestone-task-clear');
    const toggleButton = taskRow.querySelector('.milestone-task-toggle');
    const removeButton = taskRow.querySelector('.milestone-task-remove');
    const dateInput = taskRow.querySelector('input[type="date"]');
    if (!taskInput) return;

    const syncMilestones = () => {
      this.refreshMilestoneTaskSelectOptions();
      this.updateMilestoneTimeline();
    };

    taskInput.addEventListener('focus', () => {
      taskRow.dataset.dropdownOpen = 'true';
      this.refreshMilestoneTaskSelectOptions();
    });
    taskInput.addEventListener('input', () => {
      taskRow.dataset.dropdownOpen = 'true';
      syncMilestones();
    });
    taskInput.addEventListener('change', syncMilestones);
    taskInput.addEventListener('blur', () => {
      window.setTimeout(() => {
        taskRow.dataset.dropdownOpen = 'false';
        this.refreshMilestoneTaskSelectOptions();
        this.updateMilestoneTimeline();
      }, 120);
    });

      if (clearButton) {
        clearButton.addEventListener('click', (event) => {
          event.preventDefault();
          this.queueCancelledMilestoneProcess(taskRow);
          taskInput.value = '';
          taskRow.dataset.sourceTaskId = '';
          taskRow.dataset.taskKey = '';
        this.clearMilestoneTaskMetadata(taskRow);
        taskRow.dataset.dropdownOpen = 'false';
        this.refreshMilestoneTaskSelectOptions();
        this.updateMilestoneTimeline();
        taskInput.focus();
      });
    }

    if (toggleButton) {
      toggleButton.addEventListener('click', (event) => {
        event.preventDefault();
        taskRow.dataset.dropdownOpen = taskRow.dataset.dropdownOpen === 'true' ? 'false' : 'true';
        this.refreshMilestoneTaskSelectOptions();
        taskInput.focus();
      });
    }

    if (removeButton) {
      removeButton.addEventListener('click', () => this.removeMilestoneTask(removeButton));
    }

    dateInput?.addEventListener('input', () => this.updateMilestoneTimeline());
    dateInput?.addEventListener('change', () => this.updateMilestoneTimeline());

    taskRow.dataset.eventsReady = 'true';
  },

  refreshMilestoneTaskSelectOptions: function () {
    const tasks = this.getMilestoneCatalog().tasks;
    const assignments = this.getMilestoneTaskAssignments();

    document.querySelectorAll('.milestone-task-row').forEach((row) => {
      const taskInput = row.querySelector('.milestone-task-search');
      const clearButton = row.querySelector('.milestone-task-clear');
      const toggleButton = row.querySelector('.milestone-task-toggle');
      const dropdown = row.querySelector('.milestone-task-dropdown');
      const phaseInfo = row.querySelector('.milestone-task-phase');
      if (!taskInput || !dropdown || !phaseInfo) return;

      const currentTaskId = this.asText(row.dataset.sourceTaskId);
      const currentValue = this.asText(row.dataset.taskKey);
      const searchText = this.asText(taskInput.value);
      const searchLower = searchText.toLowerCase();
      const sortedTasks = [...tasks].sort((a, b) => {
        const phaseCompare = a.phaseName.localeCompare(b.phaseName, 'pt-BR');
        if (phaseCompare !== 0) return phaseCompare;
        return a.taskName.localeCompare(b.taskName, 'pt-BR');
      });

      const availableTasks = sortedTasks.filter((task) => {
        const taskAssignmentKey = this.asText(task.id) || task.key;
        const count = assignments.get(taskAssignmentKey) || 0;
        const isLocked = this._state.isExecutionCorrection
          && ((this._state.lockedTaskIds && this._state.lockedTaskIds.has(this.asText(task.id)))
            || (this._state.lockedTaskKeys && this._state.lockedTaskKeys.has(task.key)));
        const isCurrentTask = (currentTaskId && this.asText(task.id) === currentTaskId) || task.key === currentValue;
        return (!isLocked && count === 0) || isCurrentTask;
      });

      const availableByLabel = new Map(availableTasks.map((task) => [task.label.toLowerCase(), task]));
      const allByLabel = new Map(sortedTasks.map((task) => [task.label.toLowerCase(), task]));
      const selectedTask = sortedTasks.find((task) => {
        return (currentTaskId && this.asText(task.id) === currentTaskId) || task.key === currentValue;
      });
      const typedTask = searchText ? availableByLabel.get(searchLower) : null;
      const unavailableTypedTask = searchText ? allByLabel.get(searchLower) : null;

      if (typedTask) {
        const previousTaskId = this.asText(row.dataset.sourceTaskId);
        const nextTaskId = this.asText(typedTask.id);
        if (previousTaskId && nextTaskId && previousTaskId !== nextTaskId) {
          this.queueCancelledMilestoneProcess(row);
          this.clearMilestoneTaskMetadata(row);
        }
        row.dataset.sourceTaskId = nextTaskId;
        row.dataset.taskKey = typedTask.key;
      } else if (!searchText && selectedTask) {
        row.dataset.sourceTaskId = this.asText(selectedTask.id);
        row.dataset.taskKey = selectedTask.key;
      } else if (searchText && unavailableTypedTask && unavailableTypedTask.key !== currentValue) {
        const lockedTaskIds = this._state.lockedTaskIds || new Set();
        if (lockedTaskIds.has(this.asText(unavailableTypedTask.id)) || (this._state.lockedTaskKeys && this._state.lockedTaskKeys.has(unavailableTypedTask.key))) {
          this.showToast('Esta tarefa nao pode ser usada porque ja foi concluida ou cancelada.', 'warning');
        } else {
          this.showToast('Esta tarefa ja esta vinculada a outro marco.', 'warning');
        }
        row.dataset.sourceTaskId = '';
        row.dataset.taskKey = '';
        taskInput.value = '';
        phaseInfo.classList.add('hidden');
        phaseInfo.textContent = '';
        this.clearMilestoneTaskMetadata(row);
        return;
      } else if (!searchText) {
        row.dataset.sourceTaskId = '';
        row.dataset.taskKey = '';
        this.clearMilestoneTaskMetadata(row);
      }

      const activeTaskId = this.asText(row.dataset.sourceTaskId);
      const activeTaskKey = this.asText(row.dataset.taskKey);
      const activeTask = sortedTasks.find((task) => {
        return (activeTaskId && this.asText(task.id) === activeTaskId) || task.key === activeTaskKey;
      });
      if (activeTask) {
        row.dataset.sourceTaskId = this.asText(activeTask.id);
        row.dataset.taskKey = activeTask.key;
      } else if (currentTaskId || currentValue) {
        row.dataset.sourceTaskId = '';
        row.dataset.taskKey = '';
        taskInput.value = '';
        phaseInfo.classList.add('hidden');
        phaseInfo.textContent = '';
        this.clearMilestoneTaskMetadata(row);
      }
      const isFocused = document.activeElement === taskInput;
      if (activeTask && (!isFocused || typedTask)) {
        taskInput.value = activeTask.taskName;
      }

      const showClearButton = Boolean(this.asText(taskInput.value)) || Boolean(activeTaskKey);
      clearButton?.classList.toggle('hidden', !showClearButton);
      toggleButton?.classList.toggle('hidden', showClearButton);

      if (activeTask) {
        phaseInfo.textContent = `Fase: ${activeTask.phaseName}`;
        phaseInfo.classList.remove('hidden');
      } else {
        phaseInfo.classList.add('hidden');
        phaseInfo.textContent = '';
      }

      const filteredTasks = searchText
        ? availableTasks.filter((task) => task.label.toLowerCase().includes(searchLower))
        : availableTasks;
      const shouldShowDropdown = row.dataset.dropdownOpen === 'true' && (isFocused || Boolean(searchText));

      if (!shouldShowDropdown) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
      }

      if (!filteredTasks.length) {
        dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">Nenhuma tarefa encontrada</div>';
        dropdown.classList.remove('hidden');
        return;
      }

      const tasksByPhase = filteredTasks.reduce((accumulator, task) => {
        if (!accumulator.has(task.phaseName)) {
          accumulator.set(task.phaseName, []);
        }
        accumulator.get(task.phaseName).push(task);
        return accumulator;
      }, new Map());

      dropdown.innerHTML = Array.from(tasksByPhase.entries()).map(([phaseName, phaseTasks]) => `
        <div class="py-1">
          <div class="px-3 py-1 text-sm font-bold text-black bg-gray-50 border-b border-gray-100">${this.escapeHtml(phaseName)}</div>
          ${phaseTasks.map((task) => `
            <button type="button" class="milestone-task-option w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" data-task-id="${this.escapeHtml(task.id)}" data-task-key="${this.escapeHtml(task.key)}" data-task-label="${this.escapeHtml(task.taskName)}">
              ${this.escapeHtml(task.taskName)}
            </button>
          `).join('')}
        </div>
      `).join('');
      dropdown.classList.remove('hidden');

      dropdown.querySelectorAll('.milestone-task-option').forEach((option) => {
        option.addEventListener('mousedown', (event) => event.preventDefault());
        option.addEventListener('click', () => {
          const previousTaskId = this.asText(row.dataset.sourceTaskId);
          const nextTaskId = this.asText(option.getAttribute('data-task-id'));
          if (previousTaskId && nextTaskId && previousTaskId !== nextTaskId) {
            this.queueCancelledMilestoneProcess(row);
            this.clearMilestoneTaskMetadata(row);
          }
          row.dataset.sourceTaskId = nextTaskId;
          row.dataset.taskKey = this.asText(option.getAttribute('data-task-key'));
          taskInput.value = this.asText(option.getAttribute('data-task-label'));
          row.dataset.dropdownOpen = 'false';
          this.refreshMilestoneTaskSelectOptions();
          this.updateMilestoneTimeline();
        });
      });
    });
  },

  updateMilestoneTaskTitles: function () {
    document.querySelectorAll('.milestone-card').forEach((milestoneCard) => {
      const title = milestoneCard.querySelector('.milestone-tasks-title');
      if (!title) return;
      const taskCount = milestoneCard.querySelectorAll('.milestone-task-row').length;
      title.textContent = taskCount > 1 ? 'Tarefas do Marco' : 'Tarefa do Marco';
    });
  },

  collectMilestonesFromDom: function () {
    const container = document.getElementById('milestones-container');
    if (!container) return [];

    return Array.from(container.querySelectorAll(':scope > .milestone-card')).map((milestoneEl, index) => {
      const name = this.asText(milestoneEl.querySelector('.milestone-phase-input')?.value) || `Marco ${index + 1}`;
      const period = this.asText(milestoneEl.querySelector('.milestone-period-input')?.value);
      const parsedPeriod = this.parseMilestonePeriod(period);
      const criteria = Array.from(milestoneEl.querySelectorAll('.milestone-criteria-row input[type="text"]'))
        .map((input) => this.asText(input.value))
        .filter(Boolean);
      const tasks = Array.from(milestoneEl.querySelectorAll('.milestone-task-row')).map((row) => {
        const taskKey = this.asText(row.dataset.taskKey);
        const taskInput = row.querySelector('.milestone-task-search');
        const taskDate = this.asText(row.querySelector('input[type="date"]')?.value);
        const [taskPhase = '', ...taskNameParts] = taskKey.split(':::');
        return {
          taskId: this.asText(row.dataset.sourceTaskId) || this.asText(row.dataset.taskId),
          sourceTaskId: this.asText(row.dataset.sourceTaskId),
          taskKey,
          phaseName: taskPhase,
          task: taskNameParts.join(':::') || this.asText(taskInput?.value),
          dueDate: taskDate,
          process: this.asText(row.dataset.taskProcess),
          documentId: this.asText(row.dataset.taskDocumentId),
          status: this.asText(row.dataset.taskStatus),
          started: this.asText(row.dataset.taskStarted)
        };
      }).filter((task) => task.task || task.dueDate);

      return {
        order: index + 1,
        name,
        period,
        startDate: parsedPeriod.startDate,
        endDate: parsedPeriod.endDate,
        criteria,
        tasks
      };
    });
  },

  getTimelineWhenLabel: function (dateValue) {
    const isoDate = this.normalizePeriodDateToIso(dateValue);
    if (!isoDate) return 'Sem data definida';

    const today = new Date();
    const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const [year, month, day] = isoDate.split('-').map(Number);
    const targetDate = new Date(year, (month || 1) - 1, day || 1);
    const diffInDays = Math.round((targetDate.getTime() - todayAtMidnight.getTime()) / 86400000);

    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === -1) return 'Ontem';
    if (diffInDays === 1) return 'Amanhã';
    if (diffInDays < 0) return `Há ${Math.abs(diffInDays)} dias`;
    return `Em ${diffInDays} dias`;
  },

  refreshMilestoneConfiguration: function () {

    this.initializeMilestoneDatePickers(document);
    this.initMilestoneSortables();
    this.updateMilestoneTaskTitles();
    document.querySelectorAll('.milestone-task-row').forEach((row) => this.bindMilestoneTaskRowEvents(row));
    this.refreshMilestoneTaskSelectOptions();
    this.updateMilestoneTimeline();
    this.syncRaciWithMilestones();
    if (this._state.currentStep === 4) {
      this.renderRaciMatrixTable();
    }
  },

  updateMilestoneTimeline: function () {
    const container = document.getElementById('milestone-timeline-list');
    if (!container) return;

    const milestones = this.collectMilestonesFromDom()
      .filter((item) => item.name || item.startDate || item.endDate)
      .sort((a, b) => {
        const firstDate = this.getMilestonePrimaryDate(a.period);
        const secondDate = this.getMilestonePrimaryDate(b.period);
        if (firstDate && secondDate) return firstDate.localeCompare(secondDate);
        if (firstDate) return -1;
        if (secondDate) return 1;
        return this.asText(a.name).localeCompare(this.asText(b.name), 'pt-BR');
      });

    if (!milestones.length) {
      container.innerHTML = '<div class="text-sm text-gray-600">Adicione marcos com data para visualizar a linha do tempo.</div>';
      return;
    }

    container.innerHTML = milestones.map((item, index) => {
      const currentDate = this.getMilestonePrimaryDate(item.period || item.endDate || item.startDate);
      const hasDate = Boolean(currentDate);
      const isReachedDate = hasDate && new Date(`${currentDate}T00:00:00`) <= new Date();
      const isLastItem = index === milestones.length - 1;
      let iconBg = 'bg-blue-100';
      let iconColor = 'text-blue-600';
      let iconClass = 'fa-solid fa-hourglass-half';

      if (isLastItem) {
        iconBg = 'bg-bevap-green/10';
        iconColor = 'text-bevap-green';
        iconClass = 'fa-solid fa-rocket';
      } else if (isReachedDate) {
        iconBg = 'bg-bevap-gold/10';
        iconColor = 'text-bevap-gold';
        iconClass = 'fa-solid fa-check';
      }

      const whenLabel = this.getTimelineWhenLabel(currentDate);
      const currentDateFormatted = this.formatMilestonePeriodBr(item.period || currentDate);
      const taskCount = item.tasks.length;
      const previewTasks = item.tasks.slice(0, 2).map((task) => task.task).filter(Boolean);
      const taskPreviewText = previewTasks.length ? previewTasks.join(' - ') : 'Sem tarefas vinculadas';
      const descriptionText = `Marco: ${item.name} - ${taskPreviewText}`;
      const extraTasks = taskCount > 2 ? ` (+${taskCount - 2})` : '';
      const criteriaCount = item.criteria.length;
      const criteriaPreview = item.criteria.slice(0, 2);
      const criteriaHtml = criteriaCount === 0
        ? '<p class="mt-2 text-xs text-slate-400">Critérios de aceite: não definidos</p>'
        : `
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span class="text-[11px] uppercase tracking-wide text-slate-500">Aceite</span>
            ${criteriaPreview.map((criteria) => `
              <span class="inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                <i class="fa-solid fa-check-double text-[10px] text-slate-500"></i>
                <span class="truncate max-w-[260px]">${this.escapeHtml(criteria)}</span>
              </span>
            `).join('')}
            ${criteriaCount > 2 ? `<span class="text-xs text-slate-500">+${criteriaCount - 2}</span>` : ''}
          </div>
        `;

      return `
        <div class="flex gap-4">
          <div class="flex flex-col items-center">
            <div class="w-10 h-10 ${iconBg} rounded-full flex items-center justify-center">
              <i class="${iconClass} ${iconColor}"></i>
            </div>
            ${index < milestones.length - 1 ? '<div class="w-0.5 h-full bg-slate-200 mt-2"></div>' : ''}
          </div>
          <div class="flex-1 ${index < milestones.length - 1 ? 'pb-4' : ''}">
            <div class="flex items-start justify-between mb-1">
              <h4 class="font-semibold text-bevap-navy">${this.escapeHtml(item.name)}</h4>
              <span class="text-xs text-slate-500 whitespace-nowrap">${whenLabel}</span>
            </div>
            <p class="text-xs text-slate-500 mb-1">${currentDateFormatted}</p>
            <p class="text-sm text-slate-600">${this.escapeHtml(descriptionText)}${extraTasks}</p>
            ${criteriaHtml}
          </div>
        </div>
      `;
    }).join('');
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
  // Utils de HTML e Inputs (Single)
  // ---------------------------
  getResponsibleSearchFieldHTML: function (value, inputClass = '', dataField = '') {
    return `
      <div class="relative">
        <div class="single-resp-mount w-full"></div>
        <input type="hidden" class="responsible-input ${this.escapeHtml(inputClass)}" data-field="${this.escapeHtml(dataField)}" value="${this.escapeHtml(value || '')}">
      </div>
    `;
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
    phase.dataset.phaseId = '';

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
            ${this.getResponsibleSearchFieldHTML('')}
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
    this.initAllTagFilters(phase);
    this.updateWbsNumbers();

    this.initWbsSortables();
    this.onWbsChanged();
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
    this.onWbsChanged();
  },

  createSubtaskElement: function (taskData, subtaskIndex) {
    const subtask = document.createElement('div');
    subtask.className = 'wbs-subtask border border-gray-200 rounded-lg bg-gray-50 p-4 ml-4';
    subtask.dataset.taskId = this.ensurePersistentTaskId(this.asText(taskData && (taskData.id || taskData.taskId || taskData.wbsTaskIdDP)));

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
          ${this.getResponsibleSearchFieldHTML('')}
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

  addSubtask: function (buttonElement, taskData = {}) {
    const phaseItem = buttonElement.closest('.wbs-item');
    if (!phaseItem) return;

    const container = phaseItem.querySelector('.subtask-container');
    if (!container) return;

    const subtaskIndex = container.children.length + 1;
    const subtask = this.createSubtaskElement(taskData, subtaskIndex);
    container.appendChild(subtask);

    this.initAllTagFilters(subtask);
    this.initTaskSortables(phaseItem);
    this.onWbsChanged();
  },

  removeItem: function (element) {
    const subtask = element.closest('.wbs-subtask');
    if (subtask) {
      this.openDeleteModal('Tem certeza que deseja remover esta tarefa?', () => {
        subtask.remove();
        this.onWbsChanged();
      });
      return;
    }

    const item = element.closest('.wbs-item');
    if (!item) return;

    this.openDeleteModal('Tem certeza que deseja remover esta fase?', () => {
      item.remove();
      this.updateWbsNumbers();
      this.onWbsChanged();
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
    } catch (error) { }

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
      } catch (error) { }
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
    const criteriaButton = milestone.querySelector('button[onclick="addMilestoneCriteria(this)"]');
    const taskButton = milestone.querySelector('button[onclick="addMilestoneTask(this)"]');
    if (criteriaButton) this.addMilestoneCriteria(criteriaButton);
    if (taskButton) this.addMilestoneTask(taskButton);
    this.refreshMilestoneConfiguration();
  },

  getMilestoneCriteriaRowHTML: function (rowData = {}) {
    const criteria = this.escapeHtml(rowData.criteria || '');
    return `
      <div class="milestone-criteria-row flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <i class="fa-solid fa-triangle-exclamation text-yellow-600"></i>
        <input type="text" value="${criteria}" placeholder="Descreva um critério de aceite..." class="field-input flex-1 bg-transparent border-none focus:outline-none text-sm">
        <button type="button" class="milestone-criteria-remove text-red-500 hover:text-red-700" title="Remover Critério">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `;
  },

  addMilestoneCriteria: function (buttonElement, rowData = {}) {
    const milestoneCard = buttonElement.closest('.milestone-card');
    if (!milestoneCard) return;

    const list = milestoneCard.querySelector('.milestone-criteria-list');
    if (!list) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getMilestoneCriteriaRowHTML(rowData);
    const row = wrapper.firstElementChild;
    if (!row) return;

    const removeButton = row.querySelector('.milestone-criteria-remove');
    removeButton?.addEventListener('click', () => {
      if (list.children.length === 1) {
        const input = row.querySelector('input[type="text"]');
        if (input) input.value = '';
        this.refreshMilestoneConfiguration();
        return;
      }
      row.remove();
      this.refreshMilestoneConfiguration();
    });

    list.appendChild(row);
    this.refreshMilestoneConfiguration();
  },

  addMilestoneTask: function (buttonElement, taskData = {}) {
    const milestoneCard = buttonElement.closest('.milestone-card');
    if (!milestoneCard) return;

    const list = milestoneCard.querySelector('.milestone-tasks-list');
    if (!list) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getMilestoneTaskRowHTML(taskData);
    const taskRow = wrapper.firstElementChild;
    if (!taskRow) return;

    if (taskData.phaseName && taskData.task) {
      taskRow.dataset.taskKey = `${taskData.phaseName}:::${taskData.task}`;
    } else if (taskData.taskKey) {
      taskRow.dataset.taskKey = taskData.taskKey;
    }
    taskRow.dataset.taskId = this.asText(taskData.taskId || taskData.id || taskData.milestoneTaskIdDP);
    taskRow.dataset.sourceTaskId = this.asText(taskData.sourceTaskId || taskData.wbsTaskId || taskData.sourceId);
    taskRow.dataset.taskProcess = this.asText(taskData.process || taskData.taskProcess || taskData.parentProcess);
    taskRow.dataset.taskDocumentId = this.asText(taskData.documentId || taskData.docId || taskData.taskDocumentId);
    taskRow.dataset.taskStatus = this.asText(taskData.status);
    taskRow.dataset.taskStarted = this.asText(taskData.started);

    list.appendChild(taskRow);
    this.bindMilestoneTaskRowEvents(taskRow);
    this.refreshMilestoneConfiguration();
  },

  removeMilestoneTask: function (buttonElement) {
    const row = buttonElement.closest('.milestone-task-row');
    if (!row) return;

    const list = row.closest('.milestone-tasks-list');
    if (!list) return;

    this.openDeleteModal('Tem certeza que deseja remover esta tarefa do marco?', () => {
      this.queueCancelledMilestoneProcess(row);
      row.remove();
      this.refreshMilestoneConfiguration();
    });
  },

  removeMilestone: function (element) {
    this.openDeleteModal('Tem certeza que deseja remover este marco?', () => {
      const milestoneCard = element.closest('.milestone-card');
      if (milestoneCard) {
        milestoneCard.remove();
        this.refreshMilestoneConfiguration();
      }
    });
  },

  initMilestoneSortables: function () {
    if (typeof window.Sortable === 'undefined') return;
    const container = document.getElementById('milestones-container');
    if (!container || container.dataset.sortableReady === 'true') return;

    try {
      Sortable.create(container, {
        animation: 150,
        handle: '.milestone-handle',
        draggable: '.milestone-card',
        onEnd: () => this.refreshMilestoneConfiguration()
      });
      container.dataset.sortableReady = 'true';
    } catch (error) { }

    container.querySelectorAll('.milestone-tasks-list').forEach((taskList) => {
      if (taskList.dataset.sortableReady === 'true') return;
      try {
        Sortable.create(taskList, {
          animation: 150,
          handle: '.milestone-task-handle',
          draggable: '.milestone-task-row',
          onEnd: () => this.refreshMilestoneConfiguration()
        });
        taskList.dataset.sortableReady = 'true';
      } catch (error) { }
    });
  },

  getRiskVisual: function (level) {
    if (level === 'Baixo') return { card: 'border border-green-200 rounded-lg p-4 bg-white', title: 'text-green-800', badge: 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded', meta: 'text-sm text-green-700 mb-2' };
    if (level === 'Médio' || level === 'Medio') return { card: 'border border-yellow-200 rounded-lg p-4 bg-yellow-50', title: 'text-yellow-800', badge: 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded', meta: 'text-sm text-yellow-700 mb-2' };
    return { card: 'border border-red-300 rounded-lg p-4 bg-white', title: 'text-red-900', badge: 'px-2 py-1 bg-red-200 text-red-900 text-xs rounded', meta: 'text-sm text-red-800 mb-2' };
  },

  requestRemoveRiskCard: function (buttonElement) {
    const card = buttonElement.closest('.risk-item');
    if (!card) return;
    this.openDeleteModal('Tem certeza que deseja remover este risco?', () => card.remove());
  },

  setRiskCardData: function (card, data) {
    card.dataset.riskTitle = this.asText(data.title);
    card.dataset.riskLevel = this.asText(data.level) || 'Alto';
    card.dataset.riskProbability = this.asText(data.probability) || 'Alta';
    card.dataset.riskImpact = this.asText(data.impact) || 'Alto';
    card.dataset.riskMitigation = this.asText(data.mitigation);
    card.dataset.riskFallback = this.asText(data.fallback);
  },

  hydrateRiskCardData: function (card) {
    if (card.dataset.riskTitle) return;
    const title = this.asText(card.querySelector('h5')?.textContent);
    const level = this.asText(card.querySelector('span')?.textContent) || 'Alto';
    const metaText = this.asText(card.querySelector('div.text-sm')?.textContent);
    const metaMatch = metaText.match(/Probabilidade:\s*([^|]+)\|\s*Impacto:\s*(.+)/i);
    const probability = this.asText(metaMatch && metaMatch[1]) || 'Alta';
    const impact = this.asText(metaMatch && metaMatch[2]) || 'Alto';
    const detailLines = Array.from(card.querySelectorAll('div.text-sm.text-gray-700'));
    const mitigation = this.asText(detailLines[0]?.textContent).replace('Mitigação:', '').trim();
    const fallback = this.asText(detailLines[1]?.textContent).replace('Plano B:', '').trim();
    this.setRiskCardData(card, { title, level, probability, impact, mitigation, fallback });
  },

  renderRiskReadOnlyCard: function (card) {
    const title = this.asText(card.dataset.riskTitle);
    const level = this.asText(card.dataset.riskLevel) || 'Alto';
    const probability = this.asText(card.dataset.riskProbability) || 'Alta';
    const impact = this.asText(card.dataset.riskImpact) || 'Alto';
    const mitigation = this.asText(card.dataset.riskMitigation);
    const fallback = this.asText(card.dataset.riskFallback);
    const riskVisual = this.getRiskVisual(level);

    card.className = `${riskVisual.card} risk-item`;
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <h5 class="font-medium ${riskVisual.title} break-all">${this.escapeHtml(title)}</h5>
        <span class="${riskVisual.badge} shrink-0">${this.escapeHtml(level)}</span>
      </div>
      <div class="${riskVisual.meta} break-all">Probabilidade: ${this.escapeHtml(probability)} | Impacto: ${this.escapeHtml(impact)}</div>
      <div class="text-sm text-gray-700 mb-2 break-all"><strong>Mitigação:</strong> ${this.escapeHtml(mitigation || 'Não informado')}</div>
      <div class="text-sm text-gray-700 break-all"><strong>Plano B:</strong> ${this.escapeHtml(fallback || 'Não informado')}</div>
      <div class="flex justify-end items-center gap-2 mt-2">
        <button type="button" class="risk-edit text-blue-500 hover:text-blue-700" title="Editar risco"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="risk-remove text-red-400 hover:text-red-600" title="Remover risco"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    card.querySelector('.risk-edit')?.addEventListener('click', () => this.startEditRiskCard(card));
    card.querySelector('.risk-remove')?.addEventListener('click', (event) => this.requestRemoveRiskCard(event.currentTarget));
  },

  renderRiskEditCard: function (card) {
    const title = this.asText(card.dataset.riskTitle);
    const level = this.asText(card.dataset.riskLevel) || 'Alto';
    const probability = this.asText(card.dataset.riskProbability) || 'Alta';
    const impact = this.asText(card.dataset.riskImpact) || 'Alto';
    const mitigation = this.asText(card.dataset.riskMitigation);
    const fallback = this.asText(card.dataset.riskFallback);

    card.className = 'border border-gray-200 rounded-lg p-4 bg-white risk-item';
    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <input data-field="risk-title" type="text" value="${this.escapeHtml(title)}" placeholder="Novo risco" class="font-medium text-bevap-navy bg-transparent border-none p-0 focus:outline-none w-full">
        <button type="button" class="risk-remove text-red-400 hover:text-red-600" title="Remover risco"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="space-y-3 text-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="flex items-center gap-2"><span class="text-gray-600 min-w-[84px]">Nível:</span><select data-field="risk-level" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none"><option ${level === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${(level === 'Médio' || level === 'Medio') ? 'selected' : ''}>Médio</option><option ${level === 'Alto' ? 'selected' : ''}>Alto</option></select></div>
          <div class="flex items-center gap-2 text-gray-600"><span class="min-w-[84px]">Probabilidade:</span><select data-field="risk-probability" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none"><option ${probability === 'Baixa' ? 'selected' : ''}>Baixa</option><option ${(probability === 'Média' || probability === 'Media') ? 'selected' : ''}>Média</option><option ${probability === 'Alta' ? 'selected' : ''}>Alta</option></select></div>
          <div class="flex items-center gap-2 text-gray-600"><span class="min-w-[84px]">Impacto:</span><select data-field="risk-impact" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none"><option ${impact === 'Baixo' ? 'selected' : ''}>Baixo</option><option ${(impact === 'Médio' || impact === 'Medio') ? 'selected' : ''}>Médio</option><option ${impact === 'Alto' ? 'selected' : ''}>Alto</option></select></div>
        </div>
        <div class="space-y-1 text-gray-700"><strong class="block">Mitigação:</strong><textarea data-field="risk-mitigation" placeholder="Descreva a mitigação..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">${this.escapeHtml(mitigation)}</textarea></div>
        <div class="space-y-1 text-gray-700"><strong class="block">Plano B:</strong><textarea data-field="risk-fallback" placeholder="Descreva o plano B..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">${this.escapeHtml(fallback)}</textarea></div>
        <button type="button" class="risk-confirm px-3 py-1.5 bg-bevap-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm shrink-0"><i class="fa-solid fa-check mr-1"></i>Confirmar</button>
      </div>
    `;
    card.querySelector('.risk-remove')?.addEventListener('click', (event) => this.requestRemoveRiskCard(event.currentTarget));
    card.querySelector('.risk-confirm')?.addEventListener('click', () => this.confirmRiskCard(card));
  },

  startEditRiskCard: function (card) {
    if (!card) return;
    this.hydrateRiskCardData(card);
    this.renderRiskEditCard(card);
  },

  confirmRiskCard: function (card) {
    if (!card) return;
    const title = this.asText(card.querySelector('[data-field="risk-title"]')?.value);
    const level = this.asText(card.querySelector('[data-field="risk-level"]')?.value) || 'Alto';
    const probability = this.asText(card.querySelector('[data-field="risk-probability"]')?.value) || 'Alta';
    const impact = this.asText(card.querySelector('[data-field="risk-impact"]')?.value) || 'Alto';
    const mitigation = this.asText(card.querySelector('[data-field="risk-mitigation"]')?.value);
    const fallback = this.asText(card.querySelector('[data-field="risk-fallback"]')?.value);
    if (!title) { this.showToast('Preencha a descrição do risco antes de confirmar.', 'warning'); return; }
    this.setRiskCardData(card, { title, level, probability, impact, mitigation, fallback });
    this.renderRiskReadOnlyCard(card);
  },

  addRisk: function () {
    const container = document.getElementById('risk-matrix-list');
    if (!container) return;
    const card = document.createElement('div');
    card.classList.add('risk-item');
    this.setRiskCardData(card, { title: '', level: 'Alto', probability: 'Alta', impact: 'Alto', mitigation: '', fallback: '' });

    // CORREÇÃO: Primeiro anexa no HTML
    container.appendChild(card);

    // Depois renderiza o conteúdo
    this.renderRiskEditCard(card);
  },

  getDependencyStatusBadge: function (status) {
    if (status === 'Concluída' || status === 'Concluida') return '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"><i class="fa-solid fa-check mr-1"></i>Concluída</span>';
    if (status === 'Em andamento') return '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"><i class="fa-solid fa-spinner mr-1"></i>Em andamento</span>';
    if (status === 'Bloqueada') return '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"><i class="fa-solid fa-ban mr-1"></i>Bloqueada</span>';
    return '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"><i class="fa-solid fa-clock mr-1"></i>Pendente</span>';
  },

  requestRemoveDependencyCard: function (buttonElement) {
    const card = buttonElement.closest('.dependency-item');
    if (!card) return;
    this.openDeleteModal('Tem certeza que deseja remover esta dependência?', () => card.remove());
  },

  setDependencyCardData: function (card, data) {
    card.dataset.dependencyTitle = this.asText(data.title);
    card.dataset.dependencyStatus = this.asText(data.status) || 'Pendente';
    card.dataset.dependencyOwner = this.asText(data.owner);
    card.dataset.dependencyMitigation = this.asText(data.mitigation);
    card.dataset.dependencyFallback = this.asText(data.fallback);
  },

  hydrateDependencyCardData: function (card) {
    if (card.dataset.dependencyTitle) return;
    const title = this.asText(card.querySelector('h5')?.textContent);
    const status = this.asText(card.querySelector('span')?.textContent).trim() || 'Pendente';
    const owner = this.asText(card.querySelector('div.text-sm.text-gray-600')?.textContent).replace('Responsável:', '').trim();
    const detailLines = Array.from(card.querySelectorAll('div.text-sm.text-gray-700'));
    const mitigation = this.asText(detailLines[0]?.textContent).replace('Mitigação:', '').trim();
    const fallback = this.asText(detailLines[1]?.textContent).replace('Plano B:', '').trim();
    this.setDependencyCardData(card, { title, status, owner, mitigation, fallback });
  },

  renderDependencyReadOnlyCard: function (card) {
    const title = this.asText(card.dataset.dependencyTitle);
    const status = this.asText(card.dataset.dependencyStatus) || 'Pendente';
    const owner = this.asText(card.dataset.dependencyOwner);
    const mitigation = this.asText(card.dataset.dependencyMitigation);
    const fallback = this.asText(card.dataset.dependencyFallback);

    card.className = 'border border-gray-200 rounded-lg p-4 dependency-item';
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <h5 class="font-medium text-bevap-navy break-all">${this.escapeHtml(title)}</h5>
        ${this.getDependencyStatusBadge(status)}
      </div>
      <div class="text-sm text-gray-600 mb-1 break-all">Responsável: ${this.escapeHtml(owner || 'Não informado')}</div>
      <div class="text-sm text-gray-700 mb-1 break-all"><strong>Mitigação:</strong> ${this.escapeHtml(mitigation || 'Não informado')}</div>
      <div class="text-sm text-gray-700 break-all"><strong>Plano B:</strong> ${this.escapeHtml(fallback || 'Não informado')}</div>
      <div class="flex justify-end items-center gap-2 mt-2">
        <button type="button" class="dependency-edit text-blue-500 hover:text-blue-700" title="Editar dependência"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="dependency-remove text-red-400 hover:text-red-600" title="Remover dependência"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    card.querySelector('.dependency-edit')?.addEventListener('click', () => this.startEditDependencyCard(card));
    card.querySelector('.dependency-remove')?.addEventListener('click', (event) => this.requestRemoveDependencyCard(event.currentTarget));
  },

  renderDependencyEditCard: function (card) {
    const title = this.asText(card.dataset.dependencyTitle);
    const status = this.asText(card.dataset.dependencyStatus) || 'Pendente';
    const owner = this.asText(card.dataset.dependencyOwner);
    const mitigation = this.asText(card.dataset.dependencyMitigation);
    const fallback = this.asText(card.dataset.dependencyFallback);

    card.className = 'border border-gray-200 rounded-lg p-4 dependency-item';
    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <input data-field="dependency-title" type="text" value="${this.escapeHtml(title)}" placeholder="Nova dependência" class="font-medium text-bevap-navy bg-transparent border-none p-0 focus:outline-none w-full">
        <button type="button" class="dependency-remove text-red-400 hover:text-red-600" title="Remover dependência"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="space-y-3 text-sm">
        <div class="flex items-center gap-2"><span class="text-gray-600 min-w-[84px]">Status:</span><select data-field="dependency-status" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none"><option ${status === 'Pendente' ? 'selected' : ''}>Pendente</option><option ${status === 'Em andamento' ? 'selected' : ''}>Em andamento</option><option ${status === 'Bloqueada' ? 'selected' : ''}>Bloqueada</option><option ${(status === 'Concluída' || status === 'Concluida') ? 'selected' : ''}>Concluída</option></select></div>
        <div class="space-y-1 text-gray-600"><span class="block">Responsável:</span>${this.getResponsibleSearchFieldHTML(owner, 'dependency-owner-input', 'dependency-owner')}</div>
        <div class="space-y-1 text-gray-700"><strong class="block">Mitigação:</strong><textarea data-field="dependency-mitigation" placeholder="Descreva a mitigação..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">${this.escapeHtml(mitigation)}</textarea></div>
        <div class="space-y-1 text-gray-700"><strong class="block">Plano B:</strong><textarea data-field="dependency-fallback" placeholder="Descreva o plano B..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">${this.escapeHtml(fallback)}</textarea></div>
        <button type="button" class="dependency-confirm px-3 py-1.5 bg-bevap-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm shrink-0"><i class="fa-solid fa-check mr-1"></i>Confirmar</button>
      </div>
    `;
    this.initAllTagFilters(card);
    card.querySelector('.dependency-remove')?.addEventListener('click', (event) => this.requestRemoveDependencyCard(event.currentTarget));
    card.querySelector('.dependency-confirm')?.addEventListener('click', () => this.confirmDependencyCard(card));
  },

  startEditDependencyCard: function (card) {
    if (!card) return;
    this.hydrateDependencyCardData(card);
    this.renderDependencyEditCard(card);
  },

  confirmDependencyCard: function (card) {
    if (!card) return;
    const title = this.asText(card.querySelector('[data-field="dependency-title"]')?.value);
    const status = this.asText(card.querySelector('[data-field="dependency-status"]')?.value) || 'Pendente';
    const owner = this.asText(card.querySelector('[data-field="dependency-owner"]')?.value);
    const mitigation = this.asText(card.querySelector('[data-field="dependency-mitigation"]')?.value);
    const fallback = this.asText(card.querySelector('[data-field="dependency-fallback"]')?.value);
    if (!title) { this.showToast('Preencha a dependência antes de confirmar.', 'warning'); return; }
    this.setDependencyCardData(card, { title, status, owner, mitigation, fallback });
    this.renderDependencyReadOnlyCard(card);
  },

  addExternalDependency: function () {
    const container = document.getElementById('external-dependencies-list');
    if (!container) return;
    const card = document.createElement('div');
    card.classList.add('dependency-item');
    this.setDependencyCardData(card, { title: '', status: 'Pendente', owner: '', mitigation: '', fallback: '' });

    // CORREÇÃO: Primeiro anexa o card no HTML da página
    container.appendChild(card);

    // Depois injeta o conteúdo interno e INICIALIZA os componentes (TagInputFilter)
    this.renderDependencyEditCard(card);
  },
  // ---------------------------
  // Plano de Comunicação
  // ---------------------------

  addCommunicationPlanRow: function () {
    const body = document.getElementById('communication-plan-body');
    if (!body) return;

    this._communicationPlanData.push({ audience: [], channel: 'E-mail', frequency: 'Semanal' });
    this.renderCommunicationPlanTable();
  },

  addCommunicationAudience: function (index, stakeholderName) {
    const row = this._communicationPlanData[index];
    if (!row) return;
    const selected = stakeholderName?.trim();
    if (!selected) return;
    const current = this.normalizeStakeholderField(row.audience);
    if (!current.includes(selected)) {
      row.audience = [...current, selected];
      this.renderCommunicationPlanTable();
    }
  },

  removeCommunicationAudience: function (index, stakeholderName) {
    const row = this._communicationPlanData[index];
    if (!row) return;
    row.audience = this.normalizeStakeholderField(row.audience).filter((name) => name !== stakeholderName);
    this.renderCommunicationPlanTable();
  },

  renderCommunicationPlanTable: function () {
    const body = document.getElementById('communication-plan-body');
    if (!body) return;

    body.innerHTML = this._communicationPlanData.map((row, index) => {
      const channelOptions = ['E-mail', 'Daily', 'Reunião', 'Teams', 'Comitê']
        .map(o => `<option value="${this.escapeHtml(o)}" ${row.channel === o ? 'selected' : ''}>${this.escapeHtml(o)}</option>`)
        .join('');

      const frequencyOptions = ['Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Sob demanda']
        .map(o => `<option value="${this.escapeHtml(o)}" ${row.frequency === o ? 'selected' : ''}>${this.escapeHtml(o)}</option>`)
        .join('');

      return `
        <tr>
          <td class="px-3 py-2 align-top border-r border-gray-200">
            <div class="comm-tag-mount w-full" data-index="${index}"></div>
            <div class="space-y-1 min-h-[34px] mt-2">
              ${row.audience.length ? row.audience.map(name => `
                <div class="flex items-center justify-between gap-2 px-2 py-1 rounded border border-gray-200 bg-white text-xs text-gray-700">
                  <span class="block text-left whitespace-normal break-words flex-1">${this.escapeHtml(name)}</span>
                  <button type="button" onclick="projectPlanningController.removeCommunicationAudience(${index}, '${this.escapeHtml(name)}')" class="shrink-0 text-red-500 hover:text-red-700">
                    <i class="fa-solid fa-xmark text-[11px]"></i>
                  </button>
                </div>
              `).join('') : '<span class="text-xs text-gray-400">Ninguém adicionado</span>'}
            </div>
          </td>
          <td class="w-36 px-3 py-2 align-top border-r border-gray-200">
            <select onchange="projectPlanningController._communicationPlanData[${index}].channel = this.value" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none">
              ${channelOptions}
            </select>
          </td>
          <td class="w-36 px-3 py-2 align-top border-r border-gray-200">
            <select onchange="projectPlanningController._communicationPlanData[${index}].frequency = this.value" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none">
              ${frequencyOptions}
            </select>
          </td>
          <td class="px-2 py-2 text-center align-top">
            <button onclick="projectPlanningController._communicationPlanData.splice(${index}, 1); projectPlanningController.renderCommunicationPlanTable()" class="text-red-400 hover:text-red-600" title="Remover linha">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    this.initAllTagFilters(body);
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
      const responsible = this.asText(phasePanel?.querySelector('.responsible-input')?.value);
      const effort = this.parseNumber(phasePanel?.querySelector('.wbs-phase-effort')?.value);

      const taskResponsibles = Array.from(phaseItem.querySelectorAll('.wbs-subtask .responsible-input') || [])
        .map((inputEl) => this.asText(inputEl && inputEl.value))
        .filter(Boolean);

      return {
        phaseName,
        responsible,
        effort,
        taskResponsibles: Array.from(new Set(taskResponsibles)),
        responsibles: Array.from(new Set([responsible, ...taskResponsibles].filter(Boolean)))
      };
    });
  },

  getTeamProfileByMember: function (memberName) {
    const normalizedName = this.asText(memberName).toLowerCase();
    if (!normalizedName) return 'TI';
    if (normalizedName.includes('techpartners') || normalizedName.includes('fornecedor')) return 'Fornecedor';
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

  syncRaciWithMilestones: function () {
    const milestones = this.collectMilestonesFromDom();
    const existingRowsMap = new Map(this._raciMatrixData.map(r => [this.getRaciPhaseKey(r.phase), r]));

    this._raciMatrixData = milestones.map((m, index) => {
      const phaseName = this.asText(m.name) || `Marco ${index + 1}`;
      const key = this.getRaciPhaseKey(phaseName);
      if (existingRowsMap.has(key)) {
        return { ...existingRowsMap.get(key), phase: phaseName };
      }
      return { phase: phaseName, r: [], a: [], c: [], i: [] };
    });
  },

  buildWbsSnapshotFromDom: function () {
    const container = document.getElementById('wbs-container');
    const phases = [];
    if (!container) {
      return { phases: [], summary: { totalEffortHours: 0, totalDurationDays: 0 } };
    }

    const summary = { totalEffortHours: 0, totalDurationDays: 0 };

    Array.from(container.querySelectorAll(':scope > .wbs-item')).forEach((phaseEl, index) => {
      const panel = phaseEl.querySelector('.wbs-panel-content');
      const name = this.asText(phaseEl.querySelector('.wbs-phase-name-input')?.value) || `Fase ${index + 1}`;
      const responsible = this.asText(panel?.querySelector('.responsible-input')?.value);
      const effortHours = this.parseNumber(panel?.querySelector('.wbs-phase-effort')?.value);
      const durationDays = this.parseNumber(panel?.querySelector('.wbs-phase-duration')?.value);

      const tasks = [];
      phaseEl.querySelectorAll('.subtask-container .wbs-subtask').forEach((taskEl) => {
        tasks.push({
          responsible: this.asText(taskEl.querySelector('.responsible-input')?.value),
          effortHours: this.parseNumber(taskEl.querySelector('.task-effort')?.value)
        });
      });

      phases.push({
        name,
        responsible,
        effortHours,
        durationDays,
        tasks
      });

      summary.totalEffortHours += effortHours;
      summary.totalDurationDays += durationDays;
    });

    return { phases, summary };
  },

  syncTeamAllocationInternal: function () {
    const wbsSnapshot = this.buildWbsSnapshotFromDom();
    this._teamAllocationData = this.computeTeamAllocationFromWbsPayload(wbsSnapshot);
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

  renderRaciMatrixTable: function () {
    this.syncRaciWithMilestones();

    const body = document.getElementById('raci-matrix-body');
    if (!body) return;

    if (!this._raciMatrixData.length) {
      body.innerHTML = '<div class="text-sm text-gray-500">Adicione ao menos um Marco para gerar a matriz RACI.</div>';
      return;
    }

    body.innerHTML = this._raciMatrixData.map((row, index) => `
      <div class="border border-gray-200 rounded-lg">
        <div class="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <p class="text-base text-gray-700"><span class="font-semibold text-gray-600">Marco:</span> ${this.escapeHtml(row.phase)}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4">
          ${['r', 'a', 'c', 'i'].map(f => `
            <div class="p-2 border-b md:border-b-0 md:border-r border-gray-200 align-top">
              <div class="text-xs font-semibold text-gray-600 mb-1 text-center">${f.toUpperCase()}</div>
              <div class="raci-tag-mount w-full" data-index="${index}" data-field="${f}"></div>
              <div class="space-y-1 min-h-[34px] mt-2">
                ${row[f].length ? row[f].map(name => `
                  <div title="${this.escapeHtml(name)}" class="flex items-center justify-between gap-2 w-full px-2 py-1 rounded-md border border-gray-200 bg-white text-xs text-gray-700">
                    <span class="block text-left whitespace-normal break-words flex-1">${this.escapeHtml(name)}</span>
                    <button type="button" onclick="projectPlanningController.removeRaciStakeholder(${index}, '${f}', '${this.escapeHtml(name)}')" class="shrink-0 text-red-500 hover:text-red-700" title="Remover">
                      <i class="fa-solid fa-xmark text-[11px]"></i>
                    </button>
                  </div>
                `).join('') : '<span class="text-xs text-gray-400">Nenhum selecionado</span>'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    this.initAllTagFilters(body);
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
    this.syncTeamAllocationInternal();

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

  confirmConcludePlanning: async function () {
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

    const legacyLoading = typeof FLUIGC !== 'undefined' ? FLUIGC.loading($('#page-container')) : null;
    if (legacyLoading) legacyLoading.show();

    try {
      const processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(documentId);
      const attachmentsPayload = await this.collectAttachmentsPayload();
      const formDatasetName = this.asText(this._state.formName) || 'DSFormDesenvolvimentoProjetos_1778522207146';

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: this._nextStateAfterPlanning,
        documentId: documentId,
        datasetName: formDatasetName,
        comments: 'Planejamento concluído via Widget',
        attachments: attachmentsPayload
      }, this.collectPlanningTaskFields());

      this.showToast('Planejamento concluído e enviado para execução.', 'success');

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 800);

    } catch (error) {
      console.error('[projectPlanningController] concludePlanning error:', error);
      this.showToast(`Falha ao concluir: ${this.asText(error && (error.message || error)) || 'erro'}`, 'error');
    } finally {
      if (legacyLoading) legacyLoading.hide();
    }
  },

  validatePlanningForConclude: function () {

    const issues = [];
    const payload = this.buildPlanningPayload();
    const phases = payload.wbs && Array.isArray(payload.wbs.phases) ? payload.wbs.phases : [];
    const milestones = payload.milestones && Array.isArray(payload.milestones.items) ? payload.milestones.items : [];
    const communicationItems = payload.communicationPlan && Array.isArray(payload.communicationPlan.items) ? payload.communicationPlan.items : [];

    if (!phases.length) {
      issues.push({ step: 1, message: 'Inclua ao menos uma fase na EAP/WBS.' });
      return issues;
    }

    const allTasks = [];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const phaseLabel = this.asText(phase && phase.name) || `Fase ${i + 1}`;
      const phaseTasks = Array.isArray(phase && phase.tasks) ? phase.tasks : [];

      if (!this.asText(phase && phase.name)) {
        issues.push({ step: 1, message: `Informe a descricao da fase ${i + 1}.` });
        break;
      }
      if (!this.asText(phase && phase.responsible)) {
        issues.push({ step: 1, message: `Informe o responsavel da fase: ${phaseLabel}.` });
        break;
      }
      if (!Number.isFinite(phase && phase.effortHours) || Number(phase.effortHours) <= 0) {
        issues.push({ step: 1, message: `Informe o esforco (h) da fase: ${phaseLabel}.` });
        break;
      }
      if (!Number.isFinite(phase && phase.durationDays) || Number(phase.durationDays) <= 0) {
        issues.push({ step: 1, message: `Informe a duracao (dias) da fase: ${phaseLabel}.` });
        break;
      }
      if (!phaseTasks.length) {
        issues.push({ step: 1, message: `Inclua ao menos uma tarefa na fase: ${phaseLabel}.` });
        break;
      }

      for (let t = 0; t < phaseTasks.length; t++) {
        const task = phaseTasks[t];
        const taskLabel = this.asText(task && task.name) || `Tarefa ${t + 1}`;
        if (!this.asText(task && task.name)) {
          issues.push({ step: 1, message: `Informe a descricao da tarefa ${t + 1} da fase: ${phaseLabel}.` });
          break;
        }
        if (!this.asText(task && task.responsible)) {
          issues.push({ step: 1, message: `Informe o responsavel da tarefa: ${taskLabel} na fase ${phaseLabel}.` });
          break;
        }
        if (!Number.isFinite(task && task.effortHours) || Number(task.effortHours) <= 0) {
          issues.push({ step: 1, message: `Informe o esforco (h) da tarefa: ${taskLabel}.` });
          break;
        }
        if (!Number.isFinite(task && task.durationDays) || Number(task.durationDays) <= 0) {
          issues.push({ step: 1, message: `Informe a duracao (dias) da tarefa: ${taskLabel}.` });
          break;
        }

        allTasks.push({
          id: this.asText(task && task.id),
          phaseName: this.asText(phase && phase.name),
          taskName: this.asText(task && task.name)
        });
      }

      if (issues.length) break;
    }

    if (issues.length) return issues;

    if (!milestones.length) {
      issues.push({ step: 2, message: 'Inclua ao menos um marco no cronograma.' });
      return issues;
    }

    const milestoneTaskIds = new Set();
    const milestoneTaskKeys = new Set();

    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      const milestoneLabel = this.asText(milestone && milestone.name) || `Marco ${i + 1}`;
      const milestoneTasks = Array.isArray(milestone && milestone.tasks) ? milestone.tasks : [];

      if (!this.asText(milestone && milestone.name)) {
        issues.push({ step: 2, message: `Informe o nome do marco ${i + 1}.` });
        break;
      }
      if (!this.asText(milestone && milestone.startDate) || !this.asText(milestone && milestone.endDate)) {
        issues.push({ step: 2, message: `Preencha o periodo completo do marco: ${milestoneLabel}.` });
        break;
      }
      if (!milestoneTasks.length) {
        issues.push({ step: 2, message: `Inclua ao menos uma tarefa no marco: ${milestoneLabel}.` });
        break;
      }

      for (let t = 0; t < milestoneTasks.length; t++) {
        const task = milestoneTasks[t];
        const taskLabel = this.asText(task && (task.task || task.taskLabel)) || `Tarefa ${t + 1}`;
        const taskId = this.asText(task && (task.sourceTaskId || task.taskId || task.id));
        const phaseName = this.asText(task && task.phaseName);
        const taskName = this.asText(task && (task.task || task.taskLabel));

        if (!taskId || !taskName) {
          issues.push({ step: 2, message: `Selecione uma tarefa valida no marco: ${milestoneLabel}.` });
          break;
        }
        if (!this.asText(task && task.dueDate)) {
          issues.push({ step: 2, message: `Preencha a data da tarefa ${taskLabel} no marco ${milestoneLabel}.` });
          break;
        }

        milestoneTaskIds.add(taskId);
        if (phaseName && taskName) {
          milestoneTaskKeys.add(`${phaseName}:::${taskName}`);
        }
      }

      if (issues.length) break;
    }

    if (issues.length) return issues;

    for (let i = 0; i < allTasks.length; i++) {
      const key = `${allTasks[i].phaseName}:::${allTasks[i].taskName}`;
      if (!milestoneTaskIds.has(allTasks[i].id) && !milestoneTaskKeys.has(key)) {
        issues.push({ step: 2, message: `A tarefa ${allTasks[i].taskName} da fase ${allTasks[i].phaseName} precisa estar vinculada a pelo menos um marco.` });
        break;
      }
    }

    if (issues.length) return issues;

    if (!communicationItems.length) {
      issues.push({ step: 4, message: 'Inclua ao menos uma linha no Plano de Comunicacao.' });
      return issues;
    }

    for (let i = 0; i < communicationItems.length; i++) {
      const item = communicationItems[i] || {};
      const audience = this.normalizeStakeholderField(item.audience);
      if (!audience.length) {
        issues.push({ step: 4, message: `Informe o publico da linha ${i + 1} no Plano de Comunicacao.` });
        break;
      }
      if (!this.asText(item.channel)) {
        issues.push({ step: 4, message: `Informe o canal da linha ${i + 1} no Plano de Comunicacao.` });
        break;
      }
      if (!this.asText(item.frequency)) {
        issues.push({ step: 4, message: `Informe a frequencia da linha ${i + 1} no Plano de Comunicacao.` });
        break;
      }
    }

    if (issues.length) return issues;

    this.syncRaciWithMilestones();

    if (!this._raciMatrixData.length) {
      issues.push({ step: 4, message: 'Preencha a matriz RACI para os marcos do cronograma.' });
      return issues;
    }

    for (let i = 0; i < this._raciMatrixData.length; i++) {
      const row = this._raciMatrixData[i];
      const phaseName = this.asText(row && row.phase) || `Marco ${i + 1}`;
      const r = this.normalizeStakeholderField(row && row.r);
      const a = this.normalizeStakeholderField(row && row.a);

      if (!r.length) {
        issues.push({ step: 4, message: `Defina ao menos um "R" na matriz RACI para o Marco: ${phaseName}.` });
        break;
      }
      if (!a.length) {
        issues.push({ step: 4, message: `Defina ao menos um "A" na matriz RACI para o Marco: ${phaseName}.` });
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
      } catch (error) { }
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

    await fluigService.saveDraft({
      mode: 'updateCardDraft',
      documentId: documentId,
      taskFields: this.collectPlanningTaskFields()
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
      // ADICIONA ESTE BLOCO AQUI
      checklist: {
        eapWbs: document.getElementById('check-eap-wbs')?.checked || false,
        milestones: document.getElementById('check-milestones')?.checked || false,
        risks: document.getElementById('check-risks')?.checked || false,
        raci: document.getElementById('check-raci')?.checked || false,
        docs: document.getElementById('check-docs')?.checked || false
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
        const phaseId = this.asText(phaseEl.dataset.phaseId) || `phase-${index + 1}`;
        const phaseName = this.asText(phaseEl.querySelector('.wbs-phase-name-input')?.value);
        const phaseResponsible = this.asText(phasePanel?.querySelector('.responsible-input')?.value);
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
          const taskId = this.ensurePersistentTaskId(this.asText(taskEl.dataset.taskId));
          taskEl.dataset.taskId = taskId;
          const taskName = this.asText(taskEl.querySelector('.wbs-task-name-input')?.value);
          const taskResponsible = this.asText(taskEl.querySelector('.responsible-input')?.value);
          const taskEffortHours = this.parseNumber(taskEl.querySelector('.task-effort')?.value);
          const taskDurationDays = this.parseNumber(taskEl.querySelector('.task-duration')?.value);

          const taskDependencies = [];
          taskEl.querySelectorAll('.dependency-field > .dependency-list .field-input').forEach((depInput) => {
            const text = this.asText(depInput && depInput.value);
            if (text) taskDependencies.push(text);
          });

          tasks.push({
            id: taskId,
            order: taskIndex + 1,
            name: taskName,
            responsible: taskResponsible,
            effortHours: taskEffortHours,
            durationDays: taskDurationDays,
            dependencies: taskDependencies
          });
        });

        payload.wbs.phases.push({
          id: phaseId,
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
        const milestoneId = this.asText(milestoneEl.dataset.milestoneId) || `milestone-${index + 1}`;
        const name = this.asText(milestoneEl.querySelector('.milestone-phase-input')?.value);
        const period = this.asText(milestoneEl.querySelector('.milestone-period-input')?.value);

        const parsedPeriod = this.parseMilestonePeriod(period);

        const criteria = [];
        milestoneEl.querySelectorAll('.milestone-criteria-row input').forEach((input) => {
          const text = this.asText(input && input.value);
          if (text) criteria.push(text);
        });

        const tasks = [];
        milestoneEl.querySelectorAll('.milestone-task-row').forEach((row) => {
          const taskKey = this.asText(row.dataset.taskKey);
          const taskLabel = this.asText(row.querySelector('.milestone-task-search')?.value);
          const dueDate = this.asText(row.querySelector('input[type="date"]')?.value);
          const [phaseName = '', ...taskNameParts] = taskKey.split(':::');
          const taskName = taskNameParts.join(':::') || taskLabel;
          if (taskKey || taskName || dueDate) {
            tasks.push({
              taskId: this.asText(row.dataset.sourceTaskId) || this.asText(row.dataset.taskId),
              sourceTaskId: this.asText(row.dataset.sourceTaskId),
              taskKey,
              phaseName,
              task: taskName,
              taskLabel,
              dueDate,
              process: this.asText(row.dataset.taskProcess),
              documentId: this.asText(row.dataset.taskDocumentId),
              status: this.asText(row.dataset.taskStatus),
              started: this.asText(row.dataset.taskStarted)
            });
          }
        });

        payload.milestones.items.push({
          id: milestoneId,
          order: index + 1,
          name,
          period,
          startDate: parsedPeriod.startDate,
          endDate: parsedPeriod.endDate,
          criteria,
          tasks
        });
      });
    }

    // Risks
    const risksContainer = document.getElementById('risk-matrix-list');
    if (risksContainer) {
      const riskCards = Array.from(risksContainer.querySelectorAll(':scope > .risk-item'));
      riskCards.forEach((cardEl, index) => {
        const title = this.asText(cardEl.querySelector('[data-field="risk-title"]')?.value || cardEl.dataset.riskTitle);
        const level = this.asText(cardEl.querySelector('[data-field="risk-level"]')?.value || cardEl.dataset.riskLevel) || 'Alto';
        const probability = this.asText(cardEl.querySelector('[data-field="risk-probability"]')?.value || cardEl.dataset.riskProbability) || 'Alta';
        const impact = this.asText(cardEl.querySelector('[data-field="risk-impact"]')?.value || cardEl.dataset.riskImpact) || 'Alto';
        const mitigation = this.asText(cardEl.querySelector('[data-field="risk-mitigation"]')?.value || cardEl.dataset.riskMitigation);
        const fallback = this.asText(cardEl.querySelector('[data-field="risk-fallback"]')?.value || cardEl.dataset.riskFallback);

        if (title || mitigation || fallback) {
          payload.risks.items.push({
            id: `risk-${index + 1}`,
            title,
            level,
            probability,
            impact,
            mitigation,
            fallback,
            description: title,
            probabilityImpact: [probability, impact].filter(Boolean).join(' | '),
            planB: fallback
          });
        }
      });
    }

    // External dependencies
    const depsContainer = document.getElementById('external-dependencies-list');
    if (depsContainer) {
      const depCards = Array.from(depsContainer.querySelectorAll(':scope > .dependency-item'));
      depCards.forEach((cardEl, index) => {
        const title = this.asText(cardEl.querySelector('[data-field="dependency-title"]')?.value || cardEl.dataset.dependencyTitle);
        const status = this.asText(cardEl.querySelector('[data-field="dependency-status"]')?.value || cardEl.dataset.dependencyStatus) || 'Pendente';
        const owner = this.asText(cardEl.querySelector('[data-field="dependency-owner"]')?.value || cardEl.dataset.dependencyOwner);
        const mitigation = this.asText(cardEl.querySelector('[data-field="dependency-mitigation"]')?.value || cardEl.dataset.dependencyMitigation);
        const fallback = this.asText(cardEl.querySelector('[data-field="dependency-fallback"]')?.value || cardEl.dataset.dependencyFallback);

        if (title || owner || mitigation || fallback) {
          payload.externalDependencies.items.push({
            id: `external-dep-${index + 1}`,
            title,
            status,
            owner,
            mitigation,
            fallback,
            description: title,
            responsible: owner,
            planB: fallback
          });
        }
      });
    }

    // Communication plan
    payload.communicationPlan.items = this._communicationPlanData;

    payload.wbs.summary.totalEffortHours = Math.max(0, Math.round(payload.wbs.summary.totalEffortHours));
    payload.wbs.summary.totalDurationDays = Math.max(0, Math.round(payload.wbs.summary.totalDurationDays));

    // RACI + Team allocation
    this.syncTeamAllocationInternal();
    this.syncRaciWithMilestones();

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

  collectPlanningTaskFields: function () {
    const payload = this.buildPlanningPayload();
    const milestoneTaskState = this.ensureMilestoneTaskMetadata(payload);
    const fields = [];

    // 1. JSON completos para carregar na widget facilmente
    fields.push({ name: 'projectPlanningJsonDP', value: JSON.stringify(payload) });
    fields.push({ name: 'raciJsonDP', value: JSON.stringify(payload.raci || {}) });
    fields.push({ name: 'documentsJsonDP', value: JSON.stringify((this._state.attachments || []).filter((att) => !att.file).map((att) => ({
      documentId: this.asText(att.documentId || att.id),
      fileName: this.asText(att.fileName || (att.file && att.file.name)),
      version: this.asText(att.version),
      createdAt: this.asText(att.createdAt),
      fileSize: this.asText(att.fileSize || (att.file && att.file.size))
    }))) });
    fields.push({ name: 'milestoneTaskCancelProcDP', value: JSON.stringify(this._state.cancelledMilestoneProcesses || []) });

    // 2. Checklist (Campos booleanos)
    fields.push({ name: 'chkEapWbsDP', value: String(payload.checklist.eapWbs) });
    fields.push({ name: 'chkMilestonesDP', value: String(payload.checklist.milestones) });
    fields.push({ name: 'chkRisksDP', value: String(payload.checklist.risks) });
    fields.push({ name: 'chkRaciDP', value: String(payload.checklist.raci) });
    fields.push({ name: 'chkDocsDP', value: String(payload.checklist.docs) });

    // 3. Fases e Tarefas (WBS)
    let phaseIdx = 1;
    let taskIdx = 1;
    const phases = payload.wbs && Array.isArray(payload.wbs.phases) ? payload.wbs.phases : [];

    phases.forEach(phase => {
      fields.push({ name: `wbsPhaseIdDP___${phaseIdx}`, value: this.asText(phase.id) });
      fields.push({ name: `wbsPhaseOrderDP___${phaseIdx}`, value: this.asText(phase.order) });
      fields.push({ name: `wbsPhaseNameDP___${phaseIdx}`, value: this.asText(phase.name) });
      fields.push({ name: `wbsPhaseResponsibleDP___${phaseIdx}`, value: this.asText(phase.responsible) });
      fields.push({ name: `wbsPhaseEffortHoursDP___${phaseIdx}`, value: this.asText(phase.effortHours) });
      fields.push({ name: `wbsPhaseDurationDaysDP___${phaseIdx}`, value: this.asText(phase.durationDays) });
      fields.push({ name: `wbsPhaseNotesDP___${phaseIdx}`, value: this.asText(phase.notes) });

      const tasks = Array.isArray(phase.tasks) ? phase.tasks : [];
      tasks.forEach(task => {
        fields.push({ name: `wbsTaskIdDP___${taskIdx}`, value: this.asText(task.id) });
        fields.push({ name: `wbsTaskPhaseIdDP___${taskIdx}`, value: this.asText(phase.id) });
        fields.push({ name: `wbsTaskOrderDP___${taskIdx}`, value: this.asText(task.order) });
        fields.push({ name: `wbsTaskNameDP___${taskIdx}`, value: this.asText(task.name) });
        fields.push({ name: `wbsTaskResponsibleDP___${taskIdx}`, value: this.asText(task.responsible) });
        fields.push({ name: `wbsTaskEffortHoursDP___${taskIdx}`, value: this.asText(task.effortHours) });
        fields.push({ name: `wbsTaskDurationDaysDP___${taskIdx}`, value: this.asText(task.durationDays) });
        taskIdx++;
      });
      phaseIdx++;
    });

    // 4. Marcos (Milestones), Critérios e Tarefas do Marco
    let milestoneIdx = 1;
    let criteriaIdx = 1;
    let mTaskIdx = 1;
    let mTaskSummaryIdx = 1;
    const milestones = payload.milestones && Array.isArray(payload.milestones.items) ? payload.milestones.items : [];

    milestones.forEach(m => {
      fields.push({ name: `milestoneIdDP___${milestoneIdx}`, value: this.asText(m.id) });
      fields.push({ name: `milestoneNameDP___${milestoneIdx}`, value: this.asText(m.name) });
      fields.push({ name: `milestoneStartDateDP___${milestoneIdx}`, value: this.asText(m.startDate) });
      fields.push({ name: `milestoneEndDateDP___${milestoneIdx}`, value: this.asText(m.endDate) });

      const criteria = Array.isArray(m.criteria) ? m.criteria : [];
      criteria.forEach(c => {
        fields.push({ name: `milestoneCriteriaMilestoneIdDP___${criteriaIdx}`, value: this.asText(m.id) });
        fields.push({ name: `milestoneCriteriaTextDP___${criteriaIdx}`, value: this.asText(c) });
        criteriaIdx++;
      });

      const mTasks = Array.isArray(m.tasks) ? m.tasks : [];
      mTasks.forEach(t => {
        const taskId = this.asText(t.taskId);

        fields.push({ name: `milestoneTaskIdDP___${mTaskIdx}`, value: taskId });
        fields.push({ name: `milestoneTaskMilestoneIdDP___${mTaskIdx}`, value: this.asText(m.id) });
        fields.push({ name: `milestoneTaskTextDP___${mTaskIdx}`, value: this.asText(t.task || t.taskLabel) });
        fields.push({ name: `milestoneTaskDueDateDP___${mTaskIdx}`, value: this.asText(t.dueDate) });
        fields.push({ name: `milestoneTaskProcessDP___${mTaskIdx}`, value: this.asText(t.process) });
        fields.push({ name: `milestoneTaskDocIdDP___${mTaskIdx}`, value: this.asText(t.documentId) });
        fields.push({ name: `milestoneTaskStatusDP___${mTaskIdx}`, value: this.asText(t.status) });
        fields.push({ name: `milestoneTaskStartedDP___${mTaskIdx}`, value: this.asText(t.started) || 'false' });

        // Snapshot consolidado: 1 linha por tarefa de marco com fase + marco de destino.
        fields.push({ name: `milestoneTaskSummaryIdDP___${mTaskSummaryIdx}`, value: taskId });
        fields.push({ name: `milestoneTaskSummaryTextDP___${mTaskSummaryIdx}`, value: this.asText(t.task || t.taskLabel) });
        fields.push({ name: `milestoneTaskSummaryDueDateDP___${mTaskSummaryIdx}`, value: this.asText(t.dueDate) });
        fields.push({ name: `milestoneTaskSummaryPhaseDP___${mTaskSummaryIdx}`, value: this.asText(t.phaseName) });
        fields.push({ name: `milestoneTaskSummaryMarcoDP___${mTaskSummaryIdx}`, value: this.asText(m.name) });
        fields.push({ name: `milestoneTaskSummaryProcessDP___${mTaskSummaryIdx}`, value: this.asText(t.process) });
        fields.push({ name: `milestoneTaskSummaryDocIdDP___${mTaskSummaryIdx}`, value: this.asText(t.documentId) });
        fields.push({ name: `milestoneTaskSummaryEstProcDP___${mTaskSummaryIdx}`, value: this.asText(t.estadoProcesso) });
        fields.push({ name: `milestoneTaskSummaryStatusDP___${mTaskSummaryIdx}`, value: this.asText(t.status) });
        fields.push({ name: `milestoneTaskSummaryStartedDP___${mTaskSummaryIdx}`, value: this.asText(t.started) || 'false' });

        mTaskIdx++;
        mTaskSummaryIdx++;
      });
      milestoneIdx++;
    });

    fields.push({ name: 'milestoneTaskSeqCtrlDP', value: String(Math.max(milestoneTaskState.maxId, this._state.wbsTaskSeqRuntime || 0)) });

    // 5. Matriz de Riscos
    let riskIdx = 1;
    const risks = payload.risks && Array.isArray(payload.risks.items) ? payload.risks.items : [];
    risks.forEach(r => {
      fields.push({ name: `riskIdDP___${riskIdx}`, value: this.asText(r.id) });
      fields.push({ name: `riskDescriptionDP___${riskIdx}`, value: this.asText(r.description) });
      fields.push({ name: `riskProbabilityDP___${riskIdx}`, value: this.asText(r.probability) });
      fields.push({ name: `riskImpactDP___${riskIdx}`, value: this.asText(r.impact) });
      fields.push({ name: `riskMitigationDP___${riskIdx}`, value: this.asText(r.mitigation) });
      fields.push({ name: `riskPlanBDP___${riskIdx}`, value: this.asText(r.planB) });
      riskIdx++;
    });

    // 6. Dependências Externas (Adicionado o 'Status')
    let extDepIdx = 1;
    const deps = payload.externalDependencies && Array.isArray(payload.externalDependencies.items) ? payload.externalDependencies.items : [];
    deps.forEach(d => {
      fields.push({ name: `externalDependencyIdDP___${extDepIdx}`, value: this.asText(d.id) });
      fields.push({ name: `externalDependencyDescriDP___${extDepIdx}`, value: this.asText(d.description) });
      fields.push({ name: `externalDependencyStatusDP___${extDepIdx}`, value: this.asText(d.status) }); // <--- CORREÇÃO AQUI
      fields.push({ name: `externalDependencyResponDP___${extDepIdx}`, value: this.asText(d.responsible) });
      fields.push({ name: `externalDependencyMitiDP___${extDepIdx}`, value: this.asText(d.mitigation) });
      fields.push({ name: `externalDependencyPlanBDP___${extDepIdx}`, value: this.asText(d.planB) });
      extDepIdx++;
    });

    // 7. Plano de Comunicação
    let commIdx = 1;
    const comms = payload.communicationPlan && Array.isArray(payload.communicationPlan.items) ? payload.communicationPlan.items : [];
    comms.forEach(c => {
      // Salva os públicos separados por vírgula
      fields.push({ name: `commAudienceDP___${commIdx}`, value: Array.isArray(c.audience) ? c.audience.join(', ') : this.asText(c.audience) });
      fields.push({ name: `commChannelDP___${commIdx}`, value: this.asText(c.channel) });
      fields.push({ name: `commFrequencyDP___${commIdx}`, value: this.asText(c.frequency) });
      commIdx++;
    });

    // 8. Alocação de Equipe
    let allocIdx = 1;
    const allocs = payload.teamAllocation && Array.isArray(payload.teamAllocation.items) ? payload.teamAllocation.items : [];
    allocs.forEach(a => {
      fields.push({ name: `allocMemberDP___${allocIdx}`, value: this.asText(a.member) });
      fields.push({ name: `allocProfileDP___${allocIdx}`, value: this.asText(a.profile) });
      fields.push({ name: `allocDedicationDP___${allocIdx}`, value: String(a.dedication) });
      allocIdx++;
    });

    return fields;
  },

  getExistingMilestoneTaskSummaryState: function () {
    const state = {
      byKey: {},
      maxId: 0
    };

    const controlValue = parseInt(this.asText($('input[name="milestoneTaskSeqCtrlDP"]').val()), 10);
    if (!isNaN(controlValue) && controlValue > state.maxId) {
      state.maxId = controlValue;
    }

    $('input[name^="milestoneTaskSummaryIdDP___"]').each((_, input) => {
      const name = this.asText(input && input.name);
      const match = name.match(/___(\d+)$/);
      if (!match) return;

      const rowIndex = match[1];
      const summaryId = parseInt(this.asText($(input).val()), 10);
      if (!isNaN(summaryId) && summaryId > state.maxId) {
        state.maxId = summaryId;
      }

      const identityKey = this.buildMilestoneTaskSummaryIdentityKey({
        phaseName: $(`input[name="milestoneTaskSummaryPhaseDP___${rowIndex}"]`).val(),
        milestoneName: $(`input[name="milestoneTaskSummaryMarcoDP___${rowIndex}"]`).val(),
        taskName: $(`input[name="milestoneTaskSummaryTextDP___${rowIndex}"]`).val(),
        dueDate: $(`input[name="milestoneTaskSummaryDueDateDP___${rowIndex}"]`).val()
      });
      if (!identityKey) return;

      state.byKey[identityKey] = {
        id: isNaN(summaryId) ? '' : summaryId,
        process: this.asText($(`input[name="milestoneTaskSummaryProcessDP___${rowIndex}"]`).val()),
        estadoProcesso: this.asText($(`input[name="milestoneTaskSummaryEstProcDP___${rowIndex}"]`).val()),
        started: this.asText($(`input[name="milestoneTaskSummaryStartedDP___${rowIndex}"]`).val())
      };
    });

    return state;
  },

  ensureMilestoneTaskMetadata: function (payload) {
    const state = this.getExistingMilestoneTaskState(payload);
    let nextId = state.maxId;
    const milestones = payload && payload.milestones && Array.isArray(payload.milestones.items)
      ? payload.milestones.items
      : [];

    milestones.forEach((milestone) => {
      const tasks = Array.isArray(milestone.tasks) ? milestone.tasks : [];
      tasks.forEach((task) => {
        const key = this.buildMilestoneTaskIdentityKey({
          milestoneId: milestone.id,
          taskName: task.task || task.taskLabel,
          dueDate: task.dueDate
        });
        const sourceTaskId = this.asText(task.sourceTaskId || task.wbsTaskId);
        const currentId = this.asText(task.taskId || task.id || task.milestoneTaskIdDP || sourceTaskId);
        const existing = (currentId && state.byId[currentId]) || state.byKey[key] || null;
        const taskId = currentId || (existing && existing.id) || String(++nextId);

        task.taskId = taskId;
        task.sourceTaskId = sourceTaskId || taskId;
        task.process = this.asText(task.process || task.taskProcess || task.parentProcess || (existing && existing.process));
        task.documentId = this.asText(task.documentId || task.docId || task.taskDocumentId || (existing && existing.documentId));
        task.status = this.normalizeTaskExecutionStatus(task.status || (existing && existing.status));
        task.started = this.asText(task.started || (existing && existing.started)) || 'false';
      });
    });

    state.maxId = Math.max(state.maxId, nextId);
    return state;
  },

  getExistingMilestoneTaskState: function (payload) {
    const state = {
      byId: {},
      byKey: {},
      maxId: 0
    };

    const controlValue = parseInt(this.asText($('input[name="milestoneTaskSeqCtrlDP"]').val()), 10);
    if (!isNaN(controlValue) && controlValue > state.maxId) state.maxId = controlValue;

    const remember = (item) => {
      const id = this.asText(item && (item.id || item.taskId || item.milestoneTaskIdDP));
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId) && numericId > state.maxId) state.maxId = numericId;

      const normalized = {
        id,
        process: this.asText(item && (item.process || item.taskProcess || item.parentProcess || item.milestoneTaskProcessDP)),
        documentId: this.asText(item && (item.documentId || item.docId || item.taskDocumentId || item.milestoneTaskDocIdDP)),
        status: this.normalizeTaskExecutionStatus(item && (item.status || item.milestoneTaskStatusDP)),
        started: this.asText(item && (item.started || item.milestoneTaskStartedDP))
      };

      const key = this.buildMilestoneTaskIdentityKey(item || {});
      if (id) state.byId[id] = normalized;
      if (key) state.byKey[key] = normalized;
    };

    $('input[name^="milestoneTaskIdDP___"]').each((_, input) => {
      const match = this.asText(input && input.name).match(/___(\d+)$/);
      if (!match) return;
      const idx = match[1];
      remember({
        id: $(input).val(),
        milestoneId: $(`input[name="milestoneTaskMilestoneIdDP___${idx}"]`).val(),
        taskName: $(`input[name="milestoneTaskTextDP___${idx}"]`).val(),
        dueDate: $(`input[name="milestoneTaskDueDateDP___${idx}"]`).val(),
        process: $(`input[name="milestoneTaskProcessDP___${idx}"]`).val(),
        documentId: $(`input[name="milestoneTaskDocIdDP___${idx}"]`).val(),
        status: $(`input[name="milestoneTaskStatusDP___${idx}"]`).val(),
        started: $(`input[name="milestoneTaskStartedDP___${idx}"]`).val()
      });
    });

    const milestones = payload && payload.milestones && Array.isArray(payload.milestones.items)
      ? payload.milestones.items
      : [];
    milestones.forEach((milestone) => {
      (Array.isArray(milestone.tasks) ? milestone.tasks : []).forEach((task) => {
        remember({
          id: task.taskId || task.id || task.milestoneTaskIdDP,
          milestoneId: milestone.id,
          taskName: task.task || task.taskLabel,
          dueDate: task.dueDate,
          process: task.process || task.taskProcess || task.parentProcess,
          documentId: task.documentId || task.docId || task.taskDocumentId,
          status: task.status,
          started: task.started
        });
      });
    });

    return state;
  },

  buildMilestoneTaskIdentityKey: function (task) {
    const milestoneId = this.asText(task && (task.milestoneId || task.milestoneTaskMilestoneIdDP));
    const taskName = this.asText(task && (task.taskName || task.task || task.taskLabel || task.milestoneTaskTextDP));
    const dueDate = this.asText(task && (task.dueDate || task.milestoneTaskDueDateDP));
    if (!milestoneId && !taskName && !dueDate) return '';
    return [
      this.normalizeText(milestoneId),
      this.normalizeText(taskName),
      this.normalizeText(dueDate)
    ].join('||');
  },

  buildMilestoneTaskSummaryIdentityKey: function (task) {
    const taskName = this.asText(task && (task.taskName || task.task || task.taskLabel));
    const phaseName = this.asText(task && task.phaseName);
    const milestoneName = this.asText(task && task.milestoneName);
    const dueDate = this.asText(task && task.dueDate);
    if (!taskName && !phaseName && !milestoneName && !dueDate) return '';
    return [
      this.normalizeText(phaseName),
      this.normalizeText(milestoneName),
      this.normalizeText(taskName),
      this.normalizeText(dueDate)
    ].join('||');
  },
  normalizeText: function (value) {
    return this.asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  },

  normalizeBoolean: function (value) {
    const normalized = this.normalizeText(value);
    return normalized === 'true' || normalized === '1' || normalized === 'sim' || normalized === 'yes';
  },

  normalizeTaskExecutionStatus: function (status) {
    const normalized = this.normalizeText(status);
    if (!normalized) return '';
    if (normalized.indexOf('conclu') !== -1 || normalized === '2') return 'concluido';
    if (normalized.indexOf('cancel') !== -1 || normalized === '1') return 'cancelado';
    if (normalized.indexOf('andamento') !== -1 || normalized.indexOf('execucao') !== -1 || normalized === '0') return 'em_andamento';
    return '';
  },

  parseJson: function (value) {
    const raw = this.asText(value);
    if (!raw || raw === 'null') return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  },

  showTimeline: function () {
    this.showToast('Abrindo histórico do projeto...', 'info');
  },

  showAttachments: function () {
    this.showToast('Abrindo visualização de anexos...', 'info');
  },

  getPriorityLabel: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'Critico';
    if (normalized.indexOf('estrategico') !== -1) return 'Estrategico';
    if (normalized.indexOf('operacional') !== -1) return 'Operacional';
    return this.asText(priority);
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitação aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Análise TI concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Impacto na área concluído', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Triagem técnica (Externo)', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Proposta Comercial Aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Realizar contratação concluído', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Planejamento do projeto pendente', iconClass: 'fa-solid fa-clock' }
    ];
  },

  getPriorityBadgeClasses: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'bg-red-100 text-red-800';
    if (normalized.indexOf('estrategico') !== -1) return 'bg-yellow-100 text-yellow-800';
    if (normalized.indexOf('operacional') !== -1) return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-800';
  },

  getExecutionTypeLabel: function (value) {
    const raw = this.asText(value);
    const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('extern') !== -1) return 'Externo';
    if (normalized.indexOf('intern') !== -1) return 'Interno';
    return raw || 'N/A';
  },

  getExecutionTypeBadgeClasses: function (value) {
    const normalized = this.asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('extern') !== -1) return 'bg-purple-100 text-purple-800';
    if (normalized.indexOf('intern') !== -1) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
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
  },

  addAttachments: function (fileList) {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    if (!this._state.attachments) this._state.attachments = [];

    files.forEach((file) => {
      this._state.attachments.push({
        id: `local:${Date.now()}:${Math.random().toString(16).slice(2)}`,
        file: file
      });
    });
    this.renderAttachmentsList();
  },

  removeAttachment: function (id) {
    if (!this._state.attachments) return;
    this._state.attachments = this._state.attachments.filter((att) => String(att.id) !== String(id));
    this.renderAttachmentsList();
  },

  formatAttachmentSize: function (bytes) {
    const size = Number(bytes);
    if (!isFinite(size) || size <= 0) return '';
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  },

  loadStoredAttachments: function (rawValue) {
    const items = this.parseJson(rawValue);
    this._state.attachments = Array.isArray(items) ? items.map((att, index) => ({
      id: this.asText(att && att.documentId) || `stored:${index + 1}`,
      documentId: this.asText(att && att.documentId),
      fileName: this.asText(att && att.fileName),
      version: this.asText(att && att.version),
      createdAt: this.asText(att && att.createdAt),
      fileSize: this.asText(att && att.fileSize)
    })).filter((att) => att.documentId || att.fileName) : [];
    this.renderAttachmentsList();
  },

  queueCancelledMilestoneProcess: function (row) {
    if (!this._state.isExecutionCorrection || !row) return;
    const processId = this.asText(row.dataset.taskProcess);
    const started = this.asText(row.dataset.taskStarted).toLowerCase() === 'true';
    if (!processId || !started) return;
    if (!Array.isArray(this._state.cancelledMilestoneProcesses)) {
      this._state.cancelledMilestoneProcesses = [];
    }
    if (this._state.cancelledMilestoneProcesses.indexOf(processId) === -1) {
      this._state.cancelledMilestoneProcesses.push(processId);
    }
  },

  getAttachmentIconClass: function (fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  renderAttachmentsList: function () {
    const list = document.getElementById('dp-attachment-list');
    if (!list) return;

    const items = this._state.attachments || [];
    if (!items.length) {
      list.innerHTML = '<div class="text-sm text-gray-500">Nenhum anexo selecionado.</div>';
      return;
    }

    list.innerHTML = items.map((att) => {
      const safeName = this.escapeHtml(att.file ? (att.file.name || '') : (att.fileName || 'arquivo'));
      const sizeLabel = att.file ? this.escapeHtml(this.formatAttachmentSize(att.file.size || 0)) : '';
      const iconClass = this.escapeHtml(this.getAttachmentIconClass(safeName));
      const safeId = this.escapeHtml(att.id);

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid ${iconClass} text-xl mr-3"></i>
            <div class="min-w-0 text-left">
              <div class="font-medium text-sm text-gray-900 truncate">${safeName}</div>
              <div class="text-xs text-gray-500">${sizeLabel || ''}</div>
            </div>
          </div>
          <button type="button" data-action="remove-dp-attachment" data-attachment-id="${safeId}" class="text-red-500 hover:text-red-700" title="Remover">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');
  },

  readFileAsBase64: function (file) {
    return new Promise((resolve, reject) => {
      if (!(file instanceof Blob)) {
        reject(new Error('Arquivo invalido para leitura de anexo'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = String(event.target.result || '');
        const base64 = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Falha ao ler anexo'));
      reader.readAsDataURL(file);
    });
  },

  collectAttachmentsPayload: async function () {
    const items = this._state.attachments || [];
    if (!items.length) return [];

    const newFiles = items.filter((att) => att && att.file instanceof Blob);
    if (!newFiles.length) return [];

    const payload = await Promise.all(newFiles.map(async (att) => {
      const content = await this.readFileAsBase64(att.file);
      return {
        fileName: this.asText(att.file.name),
        fileContent: this.asText(content),
        fileSize: String(att.file.size || '').trim()
      };
    }));
    return payload;
  }

};

