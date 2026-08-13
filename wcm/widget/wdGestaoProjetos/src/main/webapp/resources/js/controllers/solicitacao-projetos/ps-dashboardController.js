const dashboardController = {
  _eventNamespace: '.dashboard',
  _viniciusColleagueId: '14cdc0c0-a710-4412-81dd-d94fe3abe00a',
  // Para testes: informe aqui o colleagueId que o usuario Vinicius deve simular.
  //_viniciusTestColleagueId: '14cdc0c0-a710-4412-81dd-d94fe3abe00a',
  _viniciusTestColleagueId: '81f76887-1ace-47f7-b47d-acb1466925a5',
  _dashboardProcessTypes: ['solicitacao', 'desenvolvimento', 'execucaoFases', 'entrega'],
  _dashboardMainProcessTypes: ['solicitacao', 'desenvolvimento', 'entrega'],
  _dashboardFields: [
    'documentid',
    'NUM_PROCES',
    'titulodoprojetoNS',
    'codigoglpi',
    'prioridadeNS',
    'estadoProcesso',
    'STATUS',
    'solicitanteColleagueIdNS',
    'aprovadorSuperiorImedNS',
    'execucaoProjetoTITT',
    'fornecedorRecomendadoTITT',
    'tipoContratacaoTITT',
    'tipoContratacaoCRC',
    'ultimaAlteracaoProcesso'
  ],
  _dashboardBaseFields: [
    'documentid',
    'titulodoprojetoNS',
    'codigoglpi',
    'prioridadeNS',
    'estadoProcesso',
    'STATUS',
    'solicitanteColleagueIdNS',
    'aprovadorSuperiorImedNS',
    'execucaoProjetoTITT',
    'fornecedorRecomendadoTITT',
    'tipoContratacaoTITT',
    'tipoContratacaoCRC'
  ],
  _approvalActivities: {
    solicitacao: [19, 36, 40, 54, 61],
    desenvolvimento: [23, 32],
    execucaoFases: [23, 32],
    entrega: [27, 42]
  },
  _goLiveActivities: {
    entrega: [14, 18, 22, 27, 35, 42, 46, 50, 51]
  },
  _finalActivities: {
    solicitacao: [72],
    desenvolvimento: [38, 41, 72],
    execucaoFases: [41],
    entrega: [56]
  },
  _progressByActivity: {
    solicitacao: {
      0: 5,
      4: 5,
      5: 8,
      15: 10,
      19: 12,
      26: 16,
      28: 18,
      29: 18,
      36: 22,
      38: 24,
      40: 26,
      53: 29,
      54: 27,
      61: 28,
      66: 29,
      72: 30,
      74: 29
    },
    desenvolvimento: {
      0: 32,
      4: 32,
      12: 34,
      14: 35,
      16: 38,
      18: 48,
      23: 58,
      25: 58,
      32: 65,
      34: 65,
      36: 68,
      38: 70,
      41: 70,
      46: 36,
      47: 38,
      52: 68,
      55: 72,
      56: 72,
      72: 70
    },
    execucaoFases: {
      0: 58,
      12: 59,
      14: 60,
      18: 68,
      23: 75,
      25: 75,
      32: 78,
      34: 78,
      36: 79,
      41: 80,
      46: 60,
      52: 79
    },
    entrega: {
      0: 80,
      12: 81,
      14: 81,
      18: 84,
      22: 88,
      27: 91,
      35: 95,
      42: 97,
      46: 99,
      50: 99,
      51: 99,
      56: 100
    }
  },
  _pipelineColumns: [
    { key: 'backlog', label: 'Backlog' },
    { key: 'approval', label: 'Em Análise' },
    { key: 'execution', label: 'Em Execução' },
    { key: 'golive', label: 'Em Go-Live' },
    { key: 'completed', label: 'Concluídos' },
    { key: 'cancelled', label: 'Cancelados' }
  ],
  _state: {
    allProjects: [],
    filteredProjects: [],
    accessContext: null,
    filters: {}
  },
  _chartInstances: {},
  _chartRenderToken: 0,
  _colleagueNameCache: {},

  load: async function () {
    const container = $('#page-container');

    try {
      const html = await $.get(this.getTemplateUrl());
      container.html(html);
      this.resetState();
      this.bindEvents();
      this.showDeferredFeedback();
      await this.loadDashboardData();
    } catch (error) {
      console.error('Dashboard template load error:', error);
      container.html('<div class="p-6 text-red-600">Failed to load dashboard.</div>');
    }
  },

  destroy: function () {
    this.destroyDashboardCharts();
    this.unbindEvents();
  },

  resetState: function () {
    this.destroyDashboardCharts();
    this._chartRenderToken = 0;
    this._colleagueNameCache = {};
    this._state = {
      allProjects: [],
      filteredProjects: [],
      accessContext: null,
      filters: {}
    };
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-dashboard.html`;
  },

  loadDashboardData: async function () {
    this.renderDashboardLoading();

    try {
      const rows = await this.fetchDashboardProcessRows();
      const accessContext = await this.resolveCurrentUserAccessContext();
      const normalizedProjects = this.normalizeDashboardProjects(rows);
      await this.hydrateProjectResponsibleLabels(normalizedProjects);
      await this.hydrateSubstituteAccessContext(normalizedProjects, accessContext);
      const projects = this.applyActionPermission(
        normalizedProjects,
        accessContext
      );

      this._state.allProjects = projects;
      this._state.accessContext = accessContext;

      this.renderWelcomeUser(accessContext);
      this.applyFiltersAndRender();
      this.renderTimeline(projects);
      this.renderSidebar(projects, accessContext);
    } catch (error) {
      console.error('Dashboard load error:', error);
      this.renderDashboardError();
    }
  },

  fetchDashboardProcessRows: async function () {
    if (typeof fluigService === 'undefined' || !fluigService.getProjectProcessDefinitions || !fluigService.getDatasetRows) {
      return [];
    }

    const definitions = fluigService.getProjectProcessDefinitions();
    const configuredTypes = this._dashboardProcessTypes && this._dashboardProcessTypes.length
      ? this._dashboardProcessTypes
      : Object.keys(definitions || {});
    const processTypes = configuredTypes.filter((processType) => !!(definitions || {})[processType]);
    const results = await Promise.all(processTypes.map((processType) => {
      const definition = definitions[processType];
      return this.fetchDashboardRowsByProcess(definition).catch((error) => {
        console.warn('[dashboard] Nao foi possivel carregar processo no dashboard:', processType, error);
        return [];
      });
    }));

    return results.reduce((acc, rows) => acc.concat(rows || []), []);
  },

  fetchDashboardRowsByProcess: async function (definition) {
    if (!definition || !definition.datasetId) {
      return [];
    }

    try {
      const rows = await fluigService.getDatasetRows(definition.datasetId, {
        fields: this._dashboardFields
      });
      if (!rows || !rows.length || this.hasDashboardDatasetErrorRows(rows)) {
        console.warn('[dashboard] Carga completa sem linhas validas, tentando campos base:', definition.datasetId);
        return this.fetchDashboardRowsByProcessBase(definition);
      }
      return (rows || []).map((row) => fluigService.buildProjectProcessContext(definition.type, row));
    } catch (error) {
      console.warn('[dashboard] Carga completa falhou, tentando campos base:', definition.datasetId, error);
      return this.fetchDashboardRowsByProcessBase(definition);
    }
  },

  fetchDashboardRowsByProcessBase: async function (definition) {
    const rows = await fluigService.getDatasetRows(definition.datasetId, {
      fields: this._dashboardBaseFields
    });

    return (rows || []).map((row) => fluigService.buildProjectProcessContext(definition.type, row));
  },

  hasDashboardDatasetErrorRows: function (rows) {
    return (rows || []).some((row) => {
      const keys = Object.keys(row || {});
      return keys.length === 1 && this.normalizeForCompare(keys[0]) === 'erro';
    });
  },

  normalizeDashboardProjects: function (rows) {
    const projects = (rows || [])
      .map((row, index) => this.normalizeDashboardProject(row, index))
      .filter((project) => !this.shouldIgnoreSuccessfulHandoffProject(project));

    projects.sort((a, b) => {
      const dateA = a.lastChangedAt ? a.lastChangedAt.getTime() : 0;
      const dateB = b.lastChangedAt ? b.lastChangedAt.getTime() : 0;

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      const docA = parseInt(a.documentId, 10);
      const docB = parseInt(b.documentId, 10);
      const hasDocA = Number.isFinite(docA);
      const hasDocB = Number.isFinite(docB);

      if (hasDocA && hasDocB && docA !== docB) {
        return docB - docA;
      }

      return b._sourceIndex - a._sourceIndex;
    });

    return projects;
  },

  normalizeDashboardProject: function (row, index) {
    const processContext = fluigService.buildProjectProcessContext(row.processType || row.processName, row);
    const requesterId = this.asText(row.solicitanteColleagueIdNS);
    const superiorId = this.asText(row.aprovadorSuperiorImedNS);
    const processType = processContext.processType;
    const activity = processContext.activity;
    const statusValue = this.asText(row.STATUS || row.status);
    const stateLabel = this.getProcessStateLabel(processContext);
    const category = this.resolveProjectCategory(processType, activity, statusValue);
    const type = this.resolveProjectType(row);
    const lastChangedRaw = this.firstText([
      row.ultimaAlteracaoProcesso,
      row.dataHoraAtualizacao,
      row.dataHoraCriacao,
      row['metadata#lastUpdateDate'],
      row['metadata#creationDate']
    ]);
    const lastChangedAt = this.parseDashboardDate(lastChangedRaw);
    const progress = this.resolveProjectProgress(processType, activity, category);

    return {
      raw: row,
      projectCode: this.asText(row.codigoglpi) || this.asText(row.NUM_PROCES) || this.asText(row.documentid) || '-',
      processInstanceId: this.asText(row.NUM_PROCES),
      title: this.asText(row.titulodoprojetoNS) || 'Projeto sem titulo',
      documentId: this.asText(row.documentid),
      priority: this.asText(row.prioridadeNS) || 'Sem prioridade',
      priorityKey: this.normalizeForCompare(row.prioridadeNS),
      processState: this.asText(row.estadoProcesso),
      processType: processType,
      processLabel: this.getProcessLabel(processType),
      processName: processContext.processName,
      datasetId: processContext.datasetId,
      formName: processContext.formName,
      activity: activity,
      statusValue: statusValue,
      statusLabel: this.getCategoryLabel(category),
      stateLabel: stateLabel,
      type: type,
      typeKey: this.normalizeForCompare(type),
      category: category,
      progress: progress,
      requesterId: requesterId,
      superiorId: superiorId,
      currentResponsible: this.resolveResponsibleByActivity(
        processType,
        activity,
        requesterId,
        superiorId
      ),
      currentResponsibleLabel: '',
      isApprovalStage: this.isApprovalActivity(processType, activity),
      isGoLiveStage: this.isGoLiveActivity(processType, activity),
      isTerminal: category === 'completed' || category === 'cancelled',
      lastChangedRaw: lastChangedRaw,
      lastChangedAt: lastChangedAt,
      _sourceIndex: index
    };
  },

  shouldListDashboardProject: function (project) {
    const processType = this.asText(project && project.processType);
    return this._dashboardMainProcessTypes.indexOf(processType) !== -1;
  },

  getDashboardMainProjects: function (projects) {
    return (projects || []).filter((project) => this.shouldListDashboardProject(project));
  },

  applyFiltersAndRender: function () {
    const filters = this.readFiltersFromDom();
    const projects = this.filterProjects(this.getDashboardMainProjects(this._state.allProjects), filters);

    this._state.filters = filters;
    this._state.filteredProjects = projects;

    this.renderKpis(projects);
    this.renderPipeline(projects);
    this.renderDashboardTable(projects);
    this.renderGraphSummary(projects);
  },

  readFiltersFromDom: function () {
    return {
      status: this.asText($('#filterStatus').val()),
      priority: this.normalizeForCompare($('#filterPriority').val()),
      type: this.normalizeForCompare($('#filterType').val()),
      period: this.asText($('#filterPeriod').val())
    };
  },

  filterProjects: function (projects, filters) {
    const finalFilters = filters || {};
    return (projects || []).filter((project) => {
      if (finalFilters.status && project.category !== finalFilters.status) {
        return false;
      }

      if (finalFilters.priority && project.priorityKey !== finalFilters.priority) {
        return false;
      }

      if (finalFilters.type && project.typeKey !== finalFilters.type) {
        return false;
      }

      if (finalFilters.period && !this.isProjectInsidePeriod(project, finalFilters.period)) {
        return false;
      }

      return true;
    });
  },

  isProjectInsidePeriod: function (project, period) {
    const date = project && project.lastChangedAt;
    if (!date) {
      return false;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const days = diffMs / dayMs;

    if (period === 'month') {
      return days <= 31;
    }

    if (period === 'quarter') {
      return days <= 92;
    }

    if (period === 'year') {
      return days <= 366;
    }

    return true;
  },

  resolveProjectCategory: function (processType, activity, statusValue) {
    const finalActivity = parseInt(activity, 10);

    if (this.isCancelledProject(processType, activity, statusValue)) {
      return 'cancelled';
    }

    if (this.isCompletedProject(processType, activity, statusValue)) {
      return 'completed';
    }

    if (processType === 'solicitacao' && [0, 4].indexOf(finalActivity) !== -1) {
      return 'backlog';
    }

    if (processType === 'solicitacao') {
      return 'approval';
    }

    if (processType === 'desenvolvimento') {
      return 'execution';
    }

    if (processType === 'entrega') {
      return 'golive';
    }

    return 'execution';
  },

  isCompletedProject: function (processType, activity, statusValue) {
    const status = this.asText(statusValue).toLowerCase();
    const finalActivity = parseInt(activity, 10);

    if (processType !== 'entrega') {
      return false;
    }

    if (status === '2' || status === 'finalizado' || status === 'concluido' || status === 'concluido(a)') {
      return true;
    }

    const finalActivities = this._finalActivities[processType] || [];
    return finalActivities.indexOf(finalActivity) !== -1;
  },

  shouldIgnoreSuccessfulHandoffProject: function (project) {
    if (!project || project.processType === 'entrega') {
      return false;
    }

    if (project.category === 'cancelled') {
      return false;
    }

    const status = this.asText(project.statusValue).toLowerCase();
    const activity = parseInt(project.activity, 10);
    const finalActivities = this._finalActivities[project.processType] || [];

    return status === '2'
      || status === 'finalizado'
      || status === 'concluido'
      || status === 'concluido(a)'
      || finalActivities.indexOf(activity) !== -1;
  },

  isCancelledProject: function (processType, activity, statusValue) {
    const status = this.asText(statusValue).toLowerCase();
    const finalActivity = parseInt(activity, 10);

    if (status === '1' || status === 'cancelado' || status === 'cancelada') {
      return true;
    }

    if (typeof fluigService === 'undefined' || !fluigService.getProjectCancelledActivities) {
      return false;
    }

    return fluigService.getProjectCancelledActivities(processType).indexOf(finalActivity) !== -1;
  },

  isApprovalActivity: function (processType, activity) {
    return processType === 'solicitacao';
  },

  isGoLiveActivity: function (processType, activity) {
    return processType === 'entrega';
  },

  resolveProjectProgress: function (processType, activity, category) {
    if (category === 'completed') {
      return 100;
    }

    if (category === 'cancelled') {
      return null;
    }

    const finalActivity = parseInt(activity, 10);
    const progressMap = this._progressByActivity[processType] || {};
    const progress = progressMap[finalActivity];

    if (typeof progress === 'number') {
      return progress;
    }

    if (processType === 'entrega') return 82;
    if (processType === 'execucaoFases') return 62;
    if (processType === 'desenvolvimento') return 35;
    return 10;
  },

  resolveProjectType: function (row) {
    const rawType = this.firstText([
      row.tipoContratacaoTITT,
      row.tipoContratacaoCRC
    ]);
    const executionType = this.asText(row.execucaoProjetoTITT);
    const supplier = this.asText(row.fornecedorRecomendadoTITT);
    const combined = this.normalizeForCompare([rawType, executionType, supplier].join(' '));

    if (combined.indexOf('extern') !== -1 || combined.indexOf('fornecedor') !== -1 || supplier) {
      return 'Externo';
    }

    if (combined.indexOf('intern') !== -1) {
      return 'Interno';
    }

    return 'Não informado';
  },

  getProcessStateLabel: function (context) {
    if (typeof fluigService === 'undefined' || !fluigService.getProjectProcessStateLabel) {
      return this.asText(context && context.estadoProcesso) || 'Etapa não informada';
    }

    return fluigService.getProjectProcessStateLabel({
      processType: context.processType,
      processName: context.processName,
      estadoProcesso: context.estadoProcesso,
      activity: context.activity
    });
  },

  getProcessLabel: function (processType) {
    const labels = {
      solicitacao: 'Solicitação',
      desenvolvimento: 'Desenvolvimento',
      execucaoFases: 'Execução de Fases',
      entrega: 'Entrega'
    };

    return labels[processType] || 'Processo';
  },

  getCategoryLabel: function (category) {
    const labels = {
      backlog: 'Backlog',
      approval: 'Em Análise',
      execution: 'Em Execução',
      golive: 'Em Go-Live',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };

    return labels[category] || 'Em Execução';
  },

  getCategoryStyle: function (category) {
    const styles = {
      backlog: {
        badge: 'bg-slate-100 text-slate-700',
        count: 'bg-slate-500 text-white',
        progress: 'bg-slate-500',
        icon: 'fa-solid fa-inbox',
        iconBg: 'bg-slate-100',
        iconText: 'text-slate-600'
      },
      approval: {
        badge: 'bg-bevap-gold/20 text-bevap-gold',
        count: 'bg-bevap-gold text-white',
        progress: 'bg-bevap-gold',
        icon: 'fa-solid fa-clock',
        iconBg: 'bg-bevap-gold/10',
        iconText: 'text-bevap-gold'
      },
      execution: {
        badge: 'bg-bevap-navy/10 text-bevap-navy',
        count: 'bg-bevap-navy text-white',
        progress: 'bg-bevap-navy',
        icon: 'fa-solid fa-spinner',
        iconBg: 'bg-bevap-navy/10',
        iconText: 'text-bevap-navy'
      },
      golive: {
        badge: 'bg-purple-100 text-purple-700',
        count: 'bg-purple-600 text-white',
        progress: 'bg-purple-600',
        icon: 'fa-solid fa-rocket',
        iconBg: 'bg-purple-100',
        iconText: 'text-purple-600'
      },
      completed: {
        badge: 'bg-emerald-100 text-emerald-700',
        count: 'bg-emerald-600 text-white',
        progress: 'bg-emerald-600',
        icon: 'fa-solid fa-check-circle',
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600'
      },
      cancelled: {
        badge: 'bg-red-100 text-red-700',
        count: 'bg-red-600 text-white',
        progress: 'bg-red-600',
        icon: 'fa-solid fa-times-circle',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600'
      }
    };

    return styles[category] || styles.execution;
  },

  renderDashboardLoading: function () {
    this.renderKpiPlaceholders();
    this.renderPipelineLoading();
    this.renderDashboardTableLoading();
    this.renderGraphSummary([]);
    this.renderTimelineLoading();
    this.renderSidebarLoading();
  },

  renderDashboardError: function () {
    const errorHtml = '<div class="bg-red-50 rounded-lg p-3 text-sm text-red-700 border border-red-200">Nao foi possivel carregar os dados do dashboard.</div>';
    this.renderKpiPlaceholders();
    this._pipelineColumns.forEach((column) => {
      $(`#pipeline-count-${column.key}`).text('0');
      $(`#pipeline-list-${column.key}`).html(errorHtml);
    });
    $('#dashboard-table-body').html('<tr><td colspan="6" class="py-6 px-4 text-center text-red-700">Nao foi possivel carregar os projetos.</td></tr>');
    this.destroyDashboardCharts();
    $('#dashboard-chart-summary').html(errorHtml);
    $('#dashboard-timeline-list').html(errorHtml);
    this.renderSidebarError();
  },

  renderKpiPlaceholders: function () {
    $('#kpi-total-projects, #kpi-backlog, #kpi-approval, #kpi-execution, #kpi-golive, #kpi-completed, #kpi-cancelled').text('--');
  },

  renderKpis: function (projects) {
    const counts = this.calculateCategoryCounts(projects);
    $('#kpi-total-projects').text(projects.length);
    $('#kpi-backlog').text(counts.backlog || 0);
    $('#kpi-approval').text(counts.approval || 0);
    $('#kpi-execution').text(counts.execution || 0);
    $('#kpi-golive').text(counts.golive || 0);
    $('#kpi-completed').text(counts.completed || 0);
    $('#kpi-cancelled').text(counts.cancelled || 0);
  },

  calculateCategoryCounts: function (projects) {
    return (projects || []).reduce((acc, project) => {
      const category = project.category || 'execution';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {
      backlog: 0,
      approval: 0,
      execution: 0,
      golive: 0,
      completed: 0,
      cancelled: 0
    });
  },

  renderPipelineLoading: function () {
    this._pipelineColumns.forEach((column) => {
      $(`#pipeline-count-${column.key}`).text('0');
      $(`#pipeline-list-${column.key}`).html(`
        <div class="bg-white rounded-lg p-3 text-sm text-slate-500 border border-slate-200">
          Carregando projetos...
        </div>
      `);
    });
  },

  renderPipeline: function (projects) {
    const grouped = this.groupProjectsByCategory(projects);

    this._pipelineColumns.forEach((column) => {
      const items = grouped[column.key] || [];
      const list = $(`#pipeline-list-${column.key}`);
      $(`#pipeline-count-${column.key}`).text(items.length);

      if (!items.length) {
        list.html(`
          <div class="bg-white rounded-lg p-3 text-sm text-slate-500 border border-slate-200">
            Nenhum projeto nesta etapa.
          </div>
        `);
        return;
      }

      list.html(items.map((project) => this.getPipelineCardHtml(project)).join(''));
    });
  },

  groupProjectsByCategory: function (projects) {
    return (projects || []).reduce((acc, project) => {
      const category = project.category || 'execution';
      if (!acc[category]) acc[category] = [];
      acc[category].push(project);
      return acc;
    }, {});
  },

  getPipelineCardHtml: function (project) {
    const priorityInfo = this.getPriorityInfo(project.priority);
    const typeInfo = this.getTypeInfo(project.type);
    const categoryStyle = this.getCategoryStyle(project.category);
    const opacityClass = project.category === 'cancelled' ? ' opacity-70' : '';
    const progressHtml = this.getProjectProgressHtml(project, categoryStyle);
    const terminalDateHtml = this.getTerminalDateHtml(project);
    const responsibleHtml = this.getPipelineResponsibleHtml(project);

    return `
      <div ${this.getProjectReadonlyDataAttrs(project)} role="button" tabindex="0" class="pipeline-card bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-pointer hover:border-bevap-navy/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-bevap-navy/30 transition-all${opacityClass}">
        <div class="flex items-start justify-between mb-2 gap-2">
          <span class="min-w-0 truncate whitespace-nowrap text-xs font-mono text-slate-500">${this.escapeHtml(project.projectCode)}</span>
          <span class="${priorityInfo.badgeClasses} shrink-0 text-xs px-2 py-0.5 rounded-full font-medium">${this.escapeHtml(priorityInfo.label)}</span>
        </div>
        <h4 class="dashboard-pipeline-card-title text-sm font-semibold text-bevap-navy mb-2">${this.escapeHtml(project.title)}</h4>
        <div class="flex items-center justify-between text-xs gap-2 mb-2">
          <span class="${typeInfo.badgeClasses} px-2 py-0.5 rounded font-medium">${this.escapeHtml(typeInfo.label)}</span>
          <span class="text-slate-600 text-right">${this.escapeHtml(project.processLabel)}</span>
        </div>
        <p class="dashboard-pipeline-card-state text-xs text-slate-600 mb-2">${this.escapeHtml(project.stateLabel)}</p>
        ${responsibleHtml}
        ${progressHtml}
        ${terminalDateHtml}
      </div>
    `;
  },

  getPipelineResponsibleHtml: function (project) {
    const responsibleLabel = this.asText(project && project.currentResponsibleLabel);
    if (!responsibleLabel) {
      return '';
    }

    return `
      <p class="dashboard-pipeline-card-responsible text-xs text-slate-600 mb-2">
        <span class="font-medium text-slate-700">Respons\u00e1vel:</span>
        ${this.escapeHtml(responsibleLabel)}
      </p>
    `;
  },

  getProjectProgressHtml: function (project, categoryStyle) {
    if (project.progress === null || project.progress === undefined) {
      return '';
    }

    const progress = Math.max(0, Math.min(100, parseInt(project.progress, 10) || 0));
    return `
      <div class="w-full bg-slate-200 rounded-full h-1.5 mb-1">
        <div class="${categoryStyle.progress} h-1.5 rounded-full" style="width: ${progress}%"></div>
      </div>
      <div class="text-xs text-slate-600">
        <span>${progress}%</span>
      </div>
    `;
  },

  getTerminalDateHtml: function (project) {
    if (project.category !== 'completed' && project.category !== 'cancelled') {
      return '';
    }

    const isCompleted = project.category === 'completed';
    const icon = isCompleted ? 'fa-check' : 'fa-times';
    const color = isCompleted ? 'text-emerald-600' : 'text-red-600';
    const fallback = isCompleted ? 'Data não informada' : 'Data não informada';
    const dateText = project.lastChangedAt ? this.formatDate(project.lastChangedAt) : fallback;

    return `
      <div class="flex items-center justify-between text-xs mt-2">
        <span class="text-slate-600">${this.escapeHtml(project.statusLabel)}</span>
        <span class="${color}"><i class="fa-solid ${icon} mr-1"></i>${this.escapeHtml(dateText)}</span>
      </div>
    `;
  },

  renderDashboardTableLoading: function () {
    $('#dashboard-table-body').html('<tr><td colspan="6" class="py-6 px-4 text-center text-slate-500">Carregando projetos...</td></tr>');
  },

  renderDashboardTable: function (projects) {
    const body = $('#dashboard-table-body');
    if (!body.length) return;

    if (!projects.length) {
      body.html('<tr><td colspan="6" class="py-6 px-4 text-center text-slate-500">Nenhum projeto encontrado para os filtros.</td></tr>');
      return;
    }

    body.html(projects.map((project) => {
      const categoryStyle = this.getCategoryStyle(project.category);
      const priorityInfo = this.getPriorityInfo(project.priority);
      const typeInfo = this.getTypeInfo(project.type);
      const progress = project.progress === null || project.progress === undefined ? '-' : `${project.progress}%`;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 table-row">
          <td class="py-3 px-4">
            <button type="button" ${this.getProjectReadonlyDataAttrs(project)} class="font-mono text-bevap-navy hover:underline focus:outline-none focus:ring-2 focus:ring-bevap-navy/30 rounded">
              ${this.escapeHtml(project.projectCode)}
            </button>
          </td>
          <td class="py-3 px-4 font-medium text-bevap-navy">${this.escapeHtml(project.title)}</td>
          <td class="py-3 px-4"><span class="${categoryStyle.badge} px-2 py-1 rounded-full text-xs font-medium">${this.escapeHtml(project.statusLabel)}</span></td>
          <td class="py-3 px-4"><span class="${priorityInfo.badgeClasses} px-2 py-1 rounded text-xs font-medium">${this.escapeHtml(priorityInfo.label)}</span></td>
          <td class="py-3 px-4"><span class="${typeInfo.badgeClasses} px-2 py-1 rounded text-xs font-medium">${this.escapeHtml(typeInfo.label)}</span></td>
          <td class="py-3 px-4"><span class="text-slate-600 font-medium">${this.escapeHtml(progress)}</span></td>
        </tr>
      `;
    }).join(''));
  },

  renderLegacyGraphSummary: function (projects) {
    const target = $('#dashboard-chart-summary');
    if (!target.length) return;

    const counts = this.calculateCategoryCounts(projects || []);
    const priorityCounts = this.countBy(projects, (project) => this.getPriorityInfo(project.priority).label);
    const typeCounts = this.countBy(projects, (project) => this.getTypeInfo(project.type).label);
    target.html([
      this.getSummaryCardHtml('Status', [
        ['Backlog', counts.backlog],
        ['Em Análise', counts.approval],
        ['Em Execução', counts.execution],
        ['Em Go-Live', counts.golive],
        ['Concluídos', counts.completed],
        ['Cancelados', counts.cancelled]
      ]),
      this.getSummaryCardHtml('Prioridade', Object.keys(priorityCounts).map((key) => [key, priorityCounts[key]])),
      this.getSummaryCardHtml('Tipo', Object.keys(typeCounts).map((key) => [key, typeCounts[key]]))
    ].join(''));
  },

  getSummaryCardHtml: function (title, rows) {
    const finalRows = rows && rows.length ? rows : [['Sem dados', 0]];
    return `
      <div class="bg-white rounded-lg p-3 border border-slate-200">
        <h4 class="text-sm font-semibold text-bevap-navy mb-3">${this.escapeHtml(title)}</h4>
        <div class="space-y-2">
          ${finalRows.map((row) => `
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-600">${this.escapeHtml(row[0])}</span>
              <span class="font-semibold text-bevap-navy">${this.escapeHtml(row[1])}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderGraphSummary: function (projects) {
    const target = $('#dashboard-chart-summary');
    if (!target.length) return;

    this.renderDashboardChartCanvases();
    this.renderDashboardCharts(projects || []);
  },

  renderDashboardChartCanvases: function () {
    const target = $('#dashboard-chart-summary');
    if (!target.length || target.find('#statusChart').length) return;

    target.html(`
      <div class="dashboard-chart-card bg-white rounded-lg p-3 border border-slate-200">
        <h4 class="text-sm font-semibold text-bevap-navy mb-3">Status</h4>
        <canvas id="statusChart" class="dashboard-chart-canvas"></canvas>
      </div>
      <div class="dashboard-chart-card bg-white rounded-lg p-3 border border-slate-200">
        <h4 class="text-sm font-semibold text-bevap-navy mb-3">Prioridade</h4>
        <canvas id="priorityChart" class="dashboard-chart-canvas"></canvas>
      </div>
      <div class="dashboard-chart-card bg-white rounded-lg p-3 border border-slate-200">
        <h4 class="text-sm font-semibold text-bevap-navy mb-3">Tipo</h4>
        <canvas id="typeChart" class="dashboard-chart-canvas"></canvas>
      </div>
    `);
  },

  renderDashboardCharts: function (projects) {
    const renderToken = ++this._chartRenderToken;

    this.ensureChartLibrary()
      .then(() => {
        if (renderToken !== this._chartRenderToken) return;
        this.upsertDashboardCharts(projects || []);
      })
      .catch((error) => {
        console.warn('[dashboard] Nao foi possivel carregar Chart.js:', error);
        this.destroyDashboardCharts();
        $('#dashboard-chart-summary').html(`
          <div class="bg-red-50 rounded-lg p-3 text-sm text-red-700 border border-red-200">
            Nao foi possivel carregar os graficos.
          </div>
        `);
      });
  },

  ensureChartLibrary: function () {
    if (typeof Chart !== 'undefined') {
      return Promise.resolve();
    }

    if (window.gpChartJsPromise) {
      return window.gpChartJsPromise;
    }

    window.gpChartJsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-gp-chartjs="true"], script[src*="chart.js"]');

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar Chart.js')), { once: true });

        setTimeout(() => {
          if (typeof Chart !== 'undefined') {
            resolve();
          }
        }, 0);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.dataset.gpChartjs = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar Chart.js'));
      document.head.appendChild(script);
    });

    return window.gpChartJsPromise;
  },

  upsertDashboardCharts: function (projects) {
    if (typeof Chart === 'undefined') return;

    const chartData = this.getDashboardChartData(projects || []);

    this.upsertDashboardChart('statusChart', {
      type: 'doughnut',
      data: {
        labels: ['Backlog', 'An\u00e1lise', 'Execu\u00e7\u00e3o', 'Go-Live', 'Conclu\u00eddo', 'Cancelado'],
        datasets: [{
          data: chartData.status,
          backgroundColor: ['#64748B', '#F1B434', '#3D567E', '#9333EA', '#10B981', '#EF4444'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: this.getDoughnutChartOptions()
    });

    this.upsertDashboardChart('priorityChart', {
      type: 'bar',
      data: {
        labels: chartData.priorityLabels,
        datasets: [{
          label: 'Quantidade',
          data: chartData.priority,
          backgroundColor: ['#EF4444', '#10B981', '#3D567E', '#CBD5E1'],
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: this.getHorizontalBarChartOptions(chartData.priorityMax)
    });

    this.upsertDashboardChart('typeChart', {
      type: 'pie',
      data: {
        labels: chartData.typeLabels,
        datasets: [{
          data: chartData.type,
          backgroundColor: ['#10B981', '#F1B434', '#CBD5E1'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: this.getDoughnutChartOptions()
    });

    this.resizeDashboardCharts();
  },

  upsertDashboardChart: function (canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    const current = this._chartInstances[canvasId];
    if (current) {
      current.data = config.data;
      current.options = config.options;
      current.update();
      return;
    }

    this._chartInstances[canvasId] = new Chart(canvas, config);
  },

  getDashboardChartData: function (projects) {
    const counts = this.calculateCategoryCounts(projects || []);
    const priorityCounts = this.getDashboardPriorityCounts(projects || []);
    const typeCounts = this.getDashboardTypeCounts(projects || []);

    return {
      status: [
        counts.backlog || 0,
        counts.approval || 0,
        counts.execution || 0,
        counts.golive || 0,
        counts.completed || 0,
        counts.cancelled || 0
      ],
      priorityLabels: ['Cr\u00edtico', 'Estrat\u00e9gico', 'Operacional', 'N\u00e3o informado'],
      priority: [
        priorityCounts.critical,
        priorityCounts.strategic,
        priorityCounts.operational,
        priorityCounts.uninformed
      ],
      priorityMax: Math.max(1, priorityCounts.critical, priorityCounts.strategic, priorityCounts.operational, priorityCounts.uninformed),
      typeLabels: ['Interno', 'Externo', 'N\u00e3o informado'],
      type: [
        typeCounts.internal,
        typeCounts.external,
        typeCounts.uninformed
      ]
    };
  },

  getDashboardPriorityCounts: function (projects) {
    return (projects || []).reduce((acc, project) => {
      const label = this.getPriorityInfo(project.priority).label;
      const normalized = this.normalizeForCompare(label);

      if (normalized.indexOf('critico') !== -1) {
        acc.critical += 1;
      } else if (normalized.indexOf('estrategico') !== -1) {
        acc.strategic += 1;
      } else if (normalized.indexOf('operacional') !== -1) {
        acc.operational += 1;
      } else {
        acc.uninformed += 1;
      }

      return acc;
    }, {
      critical: 0,
      strategic: 0,
      operational: 0,
      uninformed: 0
    });
  },

  getDashboardTypeCounts: function (projects) {
    return (projects || []).reduce((acc, project) => {
      const label = this.getTypeInfo(project.type).label;
      const normalized = this.normalizeForCompare(label);

      if (normalized === 'interno') {
        acc.internal += 1;
      } else if (normalized === 'externo') {
        acc.external += 1;
      } else {
        acc.uninformed += 1;
      }

      return acc;
    }, {
      internal: 0,
      external: 0,
      uninformed: 0
    });
  },

  getDoughnutChartOptions: function () {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { size: 10, family: "'Inter', sans-serif" },
            color: '#64748b',
            padding: 6,
            boxWidth: 8
          }
        }
      }
    };
  },

  getHorizontalBarChartOptions: function (maxValue) {
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          suggestedMax: Math.max(1, maxValue || 1),
          ticks: {
            precision: 0,
            color: '#64748b',
            font: { size: 10 }
          },
          grid: {
            color: '#e2e8f0'
          }
        },
        y: {
          ticks: {
            color: '#64748b',
            font: { size: 10 }
          }
        }
      }
    };
  },

  resizeDashboardCharts: function () {
    Object.keys(this._chartInstances || {}).forEach((key) => {
      const chart = this._chartInstances[key];
      if (chart && chart.resize) {
        chart.resize();
      }
    });
  },

  destroyDashboardCharts: function () {
    Object.keys(this._chartInstances || {}).forEach((key) => {
      const chart = this._chartInstances[key];
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
    this._chartInstances = {};
  },

  renderTimelineLoading: function () {
    $('#dashboard-timeline-list').html('<div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-500">Carregando linha do tempo...</div>');
  },

  renderTimeline: function (projects) {
    const target = $('#dashboard-timeline-list');
    if (!target.length) return;

    const items = (projects || [])
      .slice()
      .sort((a, b) => {
        const dateA = a.lastChangedAt ? a.lastChangedAt.getTime() : 0;
        const dateB = b.lastChangedAt ? b.lastChangedAt.getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return (parseInt(b.documentId, 10) || 0) - (parseInt(a.documentId, 10) || 0);
      })
      .slice(0, 3);

    if (!items.length) {
      target.html('<div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-500">Nenhuma alteracao encontrada.</div>');
      return;
    }

    target.html(items.map((project, index) => this.getTimelineItemHtml(project, index, items.length)).join(''));
  },

  getTimelineItemHtml: function (project, index, total) {
    const entry = this.getTimelineEntry(project);
    const categoryStyle = this.getCategoryStyle(entry.category);
    const connector = index < total - 1 ? '<div class="w-0.5 h-full bg-slate-200 mt-2"></div>' : '';

    return `
      <div class="flex gap-4">
        <div class="flex flex-col items-center">
          <div class="w-10 h-10 ${categoryStyle.iconBg} rounded-full flex items-center justify-center">
            <i class="${entry.iconClass} ${categoryStyle.iconText}"></i>
          </div>
          ${connector}
        </div>
        <div class="flex-1 pb-4">
          <div class="flex items-start justify-between mb-1 gap-3">
            <h4 class="font-semibold text-bevap-navy">${this.escapeHtml(entry.title)}</h4>
            <span class="text-xs text-slate-500 whitespace-nowrap">${this.escapeHtml(this.formatRelativeTime(project.lastChangedAt))}</span>
          </div>
          <p class="text-sm text-slate-600">${this.escapeHtml(entry.message)}</p>
        </div>
      </div>
    `;
  },

  getTimelineEntry: function (project) {
    const stateLabel = this.getShortStateLabel(project.stateLabel);
    const projectTitle = project.title || 'Projeto sem titulo';
    const code = project.projectCode || '-';

    if (project.category === 'completed') {
      return {
        category: 'completed',
        iconClass: 'fa-solid fa-check',
        title: 'Processo concluido',
        message: `${code} - ${projectTitle} concluido em ${project.processLabel}`
      };
    }

    if (project.category === 'cancelled') {
      return {
        category: 'cancelled',
        iconClass: 'fa-solid fa-times',
        title: 'Processo cancelado',
        message: `${code} - ${projectTitle} cancelado em ${project.processLabel}`
      };
    }

    if (project.processType === 'entrega' && parseInt(project.activity, 10) === 42) {
      return {
        category: 'golive',
        iconClass: 'fa-solid fa-rocket',
        title: 'Go-Live realizado',
        message: `${code} - ${projectTitle} entrou em producao`
      };
    }

    const approvalMessage = this.getApprovalCompletionMessage(project);
    if (approvalMessage) {
      return {
        category: 'approval',
        iconClass: 'fa-solid fa-check',
        title: 'Análise concluída',
        message: approvalMessage
      };
    }

    if (project.processType === 'solicitacao' && [0, 4, 5].indexOf(parseInt(project.activity, 10)) !== -1) {
      return {
        category: 'execution',
        iconClass: 'fa-solid fa-plus',
        title: 'Nova solicitacao',
        message: `${code} - ${projectTitle} criado`
      };
    }

    return {
      category: project.category,
      iconClass: this.getCategoryStyle(project.category).icon,
      title: 'Etapa realizada',
      message: `${code} - ${projectTitle} avancou para ${stateLabel}`
    };
  },

  getApprovalCompletionMessage: function (project) {
    const title = project.title || 'Projeto sem titulo';
    const code = project.projectCode || '-';
    const activity = parseInt(project.activity, 10);
    const messages = {
      solicitacao: {
        26: 'aprovado pelo superior imediato',
        53: 'aprovado pelo Comite',
        54: 'teve a proposta aprovada pelo solicitante',
        61: 'aprovado pelo gerente do centro de custo',
        66: 'aprovado pelo Comite de custo'
      },
      desenvolvimento: {
        32: 'validado pelo solicitante',
        36: 'validado pela TI',
        55: 'validado pela TI'
      },
      execucaoFases: {
        32: 'atividade validada pelo solicitante',
        36: 'atividade validada pela TI',
        41: 'atividade validada pela TI'
      },
      entrega: {
        35: 'aprovado para GO Live pelo TI',
        46: 'GO Live validado pelo solicitante'
      }
    };
    const processMessages = messages[project.processType] || {};
    const suffix = processMessages[activity];

    if (!suffix) {
      return '';
    }

    return `${code} - ${title} ${suffix}`;
  },

  renderSidebarLoading: function () {
    this.updatePendencyCount(0);
    $('#my-activities-count').text('0');
    $('#required-corrections-count').text('0');
    this.getPendenciesListElement().html('<div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-500">Carregando pendencias...</div>');
    $('#my-activities-list').html('<div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-500">Carregando atividades...</div>');
    $('#required-corrections-list').html('<div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-500">Carregando correcoes...</div>');
  },

  renderSidebarError: function () {
    const errorHtml = '<div class="bg-red-50 rounded-lg p-3 text-sm text-red-700 border border-red-200">Nao foi possivel carregar esta lista.</div>';
    this.updatePendencyCount(0);
    $('#my-activities-count').text('0');
    $('#required-corrections-count').text('0');
    this.getPendenciesListElement().html(errorHtml);
    $('#my-activities-list').html(errorHtml);
    $('#required-corrections-list').html(errorHtml);
  },

  renderSidebar: function (projects, accessContext) {
    const visible = (projects || []).filter((project) => this.canCurrentUserSeePendency(project, accessContext || {}));
    const activeVisible = visible.filter((project) => !project.isTerminal);
    const corrections = activeVisible.filter((project) => project.processType === 'solicitacao' && parseInt(project.activity, 10) === 15);
    const pendingApprovals = activeVisible.filter((project) => {
      return project.canAct && corrections.indexOf(project) === -1;
    });
    const myActivities = activeVisible.filter((project) => {
      return !project.canAct && corrections.indexOf(project) === -1;
    });

    this.renderPendencies(pendingApprovals);
    this.renderSidebarProjectList({
      selector: '#my-activities-list',
      countSelector: '#my-activities-count',
      projects: myActivities,
      emptyText: 'Nenhuma atividade acompanhada.',
      mode: 'activity'
    });
    this.renderSidebarProjectList({
      selector: '#required-corrections-list',
      countSelector: '#required-corrections-count',
      projects: corrections,
      emptyText: 'Nenhuma correcao requerida.',
      mode: 'correction'
    });
  },

  renderSidebarProjectList: function (options) {
    const list = $(options.selector);
    const projects = options.projects || [];
    $(options.countSelector).text(projects.length);

    if (!projects.length) {
      list.html(`
        <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-500 border border-slate-200">
          ${this.escapeHtml(options.emptyText)}
        </div>
      `);
      return;
    }

    list.html(projects.map((project) => this.getSidebarCardHtml(project, options.mode)).join(''));
  },

  renderPendencies: function (pendencies) {
    this.updatePendencyCount(pendencies.length);
    this.renderSidebarProjectList({
      selector: '#pending-approvals-list',
      countSelector: '#pending-approvals-count',
      projects: pendencies,
      emptyText: 'Nenhuma pendencia encontrada.',
      mode: 'pending'
    });
  },

  getSidebarCardHtml: function (project, mode) {
    const priorityInfo = this.getPriorityInfo(project.priority);
    const actionConfig = this.getDashboardProjectActionConfig(project);
    const showActionButton = mode !== 'activity' && actionConfig && actionConfig.route;
    const isCorrection = mode === 'correction';
    const cardClasses = isCorrection
      ? 'bg-red-50 rounded-lg p-3 border-l-4 border-red-500'
      : 'bg-slate-50 rounded-lg p-3 border-l-4 ' + this.getPriorityBorderClass(project.priority);
    const buttonClasses = isCorrection
      ? 'w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg font-medium transition-colors'
      : 'w-full bg-bevap-green hover:bg-bevap-green/90 text-white text-sm py-2 rounded-lg font-medium transition-colors';
    const buttonLabel = isCorrection ? 'Corrigir' : (actionConfig.label || 'Abrir');

    return `
      <div class="${cardClasses}">
        <div class="flex items-start justify-between mb-2 gap-2">
          <span class="text-xs font-mono text-slate-500">${this.escapeHtml(project.projectCode)}</span>
          <span class="text-xs font-medium ${priorityInfo.textClass}">${this.escapeHtml(priorityInfo.label)}</span>
        </div>
        <p class="text-sm font-medium text-bevap-navy mb-2">${this.escapeHtml(project.title)}</p>
        <p class="text-xs text-slate-600 mb-2">${this.escapeHtml(project.processLabel)} - ${this.escapeHtml(project.stateLabel)}</p>
        ${this.getSidebarProgressHtml(project)}
        ${showActionButton ? `
          <button type="button" ${this.getProjectActionDataAttrs(project, actionConfig)} class="${buttonClasses}">
            ${this.escapeHtml(buttonLabel)}
          </button>
        ` : ''}
      </div>
    `;
  },

  getSidebarProgressHtml: function (project) {
    if (project.progress === null || project.progress === undefined) {
      return '';
    }

    const categoryStyle = this.getCategoryStyle(project.category);
    const progress = Math.max(0, Math.min(100, parseInt(project.progress, 10) || 0));
    return `
      <div class="w-full bg-slate-200 rounded-full h-1.5 mb-3">
        <div class="${categoryStyle.progress} h-1.5 rounded-full" style="width: ${progress}%"></div>
      </div>
    `;
  },

  renderWelcomeUser: function (accessContext) {
    const name = this.asText(accessContext && accessContext.userName)
      || this.asText(accessContext && accessContext.userId)
      || 'Usuario';

    $('#dashboard-welcome-user').text(name);
  },

  getCurrentUserId: function () {
    if (typeof WCMAPI !== 'undefined' && WCMAPI.getUserCode) {
      return this.asText(WCMAPI.getUserCode());
    }

    if (typeof WCMAPI !== 'undefined' && WCMAPI.user) {
      return this.asText(WCMAPI.user);
    }

    return '';
  },

  getEffectiveCurrentUserId: function () {
    const currentUserId = this.getCurrentUserId();
    const testUserId = this.asText(this._viniciusTestColleagueId);

    if (currentUserId === this._viniciusColleagueId && testUserId) {
      return testUserId;
    }

    return currentUserId;
  },

  getCurrentUserGroupIds: async function (userId) {
    const finalUserId = this.asText(userId);
    if (!finalUserId || typeof fluigService === 'undefined' || !fluigService.getDatasetRows) {
      return [];
    }

    try {
      const rows = await fluigService.getDatasetRows('colleagueGroup', {
        filters: {
          'colleagueGroupPK.colleagueId': finalUserId
        }
      });

      return (rows || [])
        .map((row) => this.asText(
          row['colleagueGroupPK.groupId']
          || row.groupId
          || row.GROUPID
          || row['groupId']
        ))
        .filter(Boolean);
    } catch (error) {
      console.warn('[dashboard] Nao foi possivel consultar grupos do usuario logado:', error);
      return [];
    }
  },

  getColleagueNameById: async function (userId) {
    const finalUserId = this.asText(userId);
    if (!finalUserId || typeof fluigService === 'undefined' || !fluigService.getDatasetRows) {
      return '';
    }

    try {
      const rows = await fluigService.getDatasetRows('colleague', {
        filters: {
          'colleaguePK.colleagueId': finalUserId
        }
      });
      const row = rows && rows.length ? rows[0] : null;
      return this.asText(row && (
        row.colleagueName
        || row.COLLEAGUENAME
        || row.name
        || row.NOME
      ));
    } catch (error) {
      console.warn('[dashboard] Nao foi possivel consultar nome do usuario logado:', error);
      return '';
    }
  },

  hydrateProjectResponsibleLabels: async function (projects) {
    const finalProjects = projects || [];
    const userIds = {};

    finalProjects.forEach((project) => {
      const responsible = this.asText(project && project.currentResponsible);
      const groupId = this.parseResponsibleGroupId(responsible);

      if (!responsible) {
        project.currentResponsibleLabel = '';
        return;
      }

      if (groupId) {
        project.currentResponsibleLabel = this.formatResponsibleGroupLabel(groupId);
        return;
      }

      if (!this._colleagueNameCache[responsible]) {
        userIds[responsible] = true;
      }
    });

    await Promise.all(Object.keys(userIds).map(async (userId) => {
      const name = await this.getColleagueNameById(userId);
      this._colleagueNameCache[userId] = name || userId;
    }));

    finalProjects.forEach((project) => {
      const responsible = this.asText(project && project.currentResponsible);

      if (!responsible || project.currentResponsibleLabel) {
        return;
      }

      project.currentResponsibleLabel = this._colleagueNameCache[responsible] || responsible;
    });
  },

  formatResponsibleGroupLabel: function (groupId) {
    const finalGroupId = this.asText(groupId);
    if (!finalGroupId) {
      return 'Grupo n\u00e3o informado';
    }

    const labels = {
      TI: 'Grupo TI',
      COMITE_GP: 'Grupo COMITE_GP',
      COMPRAS: 'Grupo COMPRAS'
    };

    return labels[finalGroupId] || `Grupo ${finalGroupId}`;
  },

  resolveCurrentUserAccessContext: async function () {
    const originalUserId = this.getCurrentUserId();
    const effectiveUserId = this.getEffectiveCurrentUserId();
    const groups = await this.getCurrentUserGroupIds(effectiveUserId);
    const effectiveUserName = await this.getColleagueNameById(effectiveUserId);

    return {
      originalUserId: originalUserId,
      userId: effectiveUserId,
      userName: effectiveUserName || effectiveUserId,
      groups: groups,
      substituteOfByProcess: {}
    };
  },

  hydrateSubstituteAccessContext: async function (projects, accessContext) {
    const currentUserId = this.asText(accessContext && accessContext.userId);
    const owners = this.getDirectResponsibleUserIds(projects);
    const ownersByProcess = {};

    if (!currentUserId || owners.length === 0) {
      accessContext.substituteOfByProcess = ownersByProcess;
      return;
    }

    await Promise.all(owners.map(async (userId) => {
      const rows = await this.getSubstitutesByUser(userId);

      (rows || []).forEach((substitute) => {
        if (this.normalizeAccessText(substitute.substituteId) !== this.normalizeAccessText(currentUserId)) {
          return;
        }

        const processes = substitute.processes && substitute.processes.length
          ? substitute.processes
          : ['*'];

        processes.forEach((processName) => {
          const key = this.asText(processName) || '*';
          ownersByProcess[key] = ownersByProcess[key] || {};
          ownersByProcess[key][this.asText(userId)] = true;
        });
      });
    }));

    accessContext.substituteOfByProcess = ownersByProcess;
  },

  getDirectResponsibleUserIds: function (projects) {
    const seen = {};
    const userIds = [];

    (projects || []).forEach((project) => {
      const responsible = this.asText(project && project.currentResponsible);

      if (!responsible || this.parseResponsibleGroupId(responsible) || seen[responsible]) {
        return;
      }

      seen[responsible] = true;
      userIds.push(responsible);
    });

    return userIds;
  },

  getSubstitutesByUser: async function (userId) {
    if (!userId || typeof fluigService === 'undefined' || !fluigService.getDatasetRows) {
      return [];
    }

    try {
      const rows = await fluigService.getDatasetRows('dsGetSubstitutosUsuario', {
        filters: { colleagueId: userId }
      });
      const row = rows && rows.length ? rows[0] : null;
      const raw = this.asText(row && row.rawResponse);
      const parsed = raw ? JSON.parse(raw) : null;
      const content = parsed && Array.isArray(parsed.content) ? parsed.content : [];

      return content.map((item) => ({
        substituteId: this.asText(item && item.substituteId),
        processes: this.extractSubstituteProcessNames(item)
      }));
    } catch (error) {
      console.warn('[dashboard] Nao foi possivel consultar substitutos do usuario:', userId, error);
      return [];
    }
  },

  extractSubstituteProcessNames: function (substitute) {
    const processes = substitute && Array.isArray(substitute.processes) ? substitute.processes : [];
    return processes.map((item) => this.asText(item && item.process)).filter(Boolean);
  },

  normalizeAccessText: function (value) {
    return this.asText(value).toLowerCase();
  },

  isUserInGroup: function (groupId, groups) {
    const target = this.normalizeAccessText(groupId);
    return (groups || []).some((group) => this.normalizeAccessText(group) === target);
  },

  isProjectManager: function (accessContext) {
    return this.isUserInGroup('GESTOR_GPROJETOS', accessContext && accessContext.groups);
  },

  parseResponsibleGroupId: function (responsible) {
    const text = this.asText(responsible);
    const match = text.match(/^Pool:Group:(.+)$/i);
    return match && match[1] ? this.asText(match[1]) : '';
  },

  canCurrentUserSeePendency: function (project, accessContext) {
    if (this.isProjectManager(accessContext)) {
      return true;
    }

    if (project.processType === 'desenvolvimento') {
      return this.canSeeDevelopmentPendency(project, accessContext);
    }

    if (project.processType === 'execucaoFases') {
      return this.canSeeExecutionPendency(project, accessContext);
    }

    if (project.processType === 'entrega') {
      return this.canSeeDeliveryPendency(project, accessContext);
    }

    if (project.processType && project.processType !== 'solicitacao') {
      return false;
    }

    const userId = accessContext && accessContext.userId;
    const activity = parseInt(project && project.activity, 10);

    if (this.normalizeAccessText(project && project.requesterId) === this.normalizeAccessText(userId)) {
      return true;
    }

    if (this.isUserInGroup('TI', accessContext && accessContext.groups)) {
      return true;
    }

    if (
      this.normalizeAccessText(project && project.superiorId) === this.normalizeAccessText(userId)
      && !isNaN(activity)
      && activity >= 5
    ) {
      return true;
    }

    if (
      this.isUserInGroup('COMITE_GP', accessContext && accessContext.groups)
      && [36, 61, 66].indexOf(activity) !== -1
    ) {
      return true;
    }

    if (
      this.isUserInGroup('COMPRAS', accessContext && accessContext.groups)
      && activity === 66
    ) {
      return true;
    }

    return this.canCurrentUserActOnPendency(project, accessContext);
  },

  isCurrentRequester: function (project, accessContext) {
    return this.normalizeAccessText(project && project.requesterId)
      === this.normalizeAccessText(accessContext && accessContext.userId);
  },

  isCurrentCoringaUser: function (accessContext) {
    const target = this.normalizeAccessText(this._viniciusColleagueId);
    const userId = this.normalizeAccessText(accessContext && accessContext.userId);
    const originalUserId = this.normalizeAccessText(accessContext && accessContext.originalUserId);

    return !!target && (userId === target || originalUserId === target);
  },

  isCurrentTiUser: function (accessContext) {
    return this.isUserInGroup('TI', accessContext && accessContext.groups)
      || this.isCurrentCoringaUser(accessContext);
  },

  canSeeDevelopmentPendency: function (project, accessContext) {
    const activity = parseInt(project && project.activity, 10);

    if (this.isCurrentTiUser(accessContext)) {
      return [14, 18, 23, 32, 38, 46, 47, 52, 56, 72].indexOf(activity) !== -1;
    }

    return this.isCurrentRequester(project, accessContext)
      && [23, 32, 38, 72].indexOf(activity) !== -1
      || this.canCurrentUserActOnPendency(project, accessContext);
  },

  canSeeExecutionPendency: function (project, accessContext) {
    const activity = parseInt(project && project.activity, 10);

    if (this.isCurrentTiUser(accessContext)) {
      return [12, 14, 18, 23, 32, 36, 41, 46, 52].indexOf(activity) !== -1;
    }

    return this.isCurrentRequester(project, accessContext)
      && [12, 23, 32, 36, 41].indexOf(activity) !== -1
      || this.canCurrentUserActOnPendency(project, accessContext);
  },

  canSeeDeliveryPendency: function (project, accessContext) {
    const activity = parseInt(project && project.activity, 10);

    if (this.isCurrentTiUser(accessContext)) {
      return [14, 18, 22, 27, 35, 42, 46, 50, 51, 56].indexOf(activity) !== -1;
    }

    return this.isCurrentRequester(project, accessContext)
      && [42, 56].indexOf(activity) !== -1
      || this.canCurrentUserActOnPendency(project, accessContext);
  },

  canCurrentUserActOnPendency: function (project, accessContext) {
    if (this.isProjectManager(accessContext)) {
      return true;
    }

    const responsible = this.asText(project.currentResponsible);
    if (!responsible) return false;

    const groupId = this.parseResponsibleGroupId(responsible);
    if (groupId) {
      if (this.normalizeAccessText(groupId) === 'ti') {
        return this.isCurrentTiUser(accessContext);
      }

      return this.isUserInGroup(groupId, accessContext && accessContext.groups);
    }

    return this.normalizeAccessText(responsible) === this.normalizeAccessText(accessContext && accessContext.userId)
      || this.normalizeAccessText(responsible) === this.normalizeAccessText(accessContext && accessContext.originalUserId)
      || this.canCurrentUserActAsSubstitute(responsible, project, accessContext);
  },

  canCurrentUserActAsSubstitute: function (responsible, project, accessContext) {
    const ownersByProcess = accessContext && accessContext.substituteOfByProcess;
    const responsibleKey = this.asText(responsible);
    const processName = this.asText(project && project.processName);

    if (!responsibleKey || !ownersByProcess) {
      return false;
    }

    return !!(
      ownersByProcess['*'] && ownersByProcess['*'][responsibleKey]
      || ownersByProcess[processName] && ownersByProcess[processName][responsibleKey]
    );
  },

  applyActionPermission: function (projects, accessContext) {
    return (projects || []).map((project) => Object.assign({}, project, {
      canAct: this.canCurrentUserActOnPendency(project, accessContext || {})
    }));
  },

  buildGroupResponsible: function (groupId) {
    const finalGroupId = this.asText(groupId);
    return finalGroupId ? `Pool:Group:${finalGroupId}` : '';
  },

  resolveResponsibleByActivity: function (processType, activity, requesterId, superiorId) {
    const finalActivity = parseInt(activity, 10);

    if (processType === 'desenvolvimento') {
      if (finalActivity === 23) {
        return this.asText(requesterId);
      }

      if ([14, 18, 32, 46, 47, 52, 56].indexOf(finalActivity) !== -1) {
        return this.buildGroupResponsible('TI');
      }

      return '';
    }

    if (processType === 'execucaoFases') {
      if (finalActivity === 23) {
        return this.asText(requesterId);
      }

      if ([14, 18, 32, 46, 52].indexOf(finalActivity) !== -1) {
        return this.buildGroupResponsible('TI');
      }

      return '';
    }

    if (processType === 'entrega') {
      if (finalActivity === 42) {
        return this.asText(requesterId);
      }

      if ([14, 18, 22, 27, 35, 46, 50, 51].indexOf(finalActivity) !== -1) {
        return this.buildGroupResponsible('TI');
      }

      return '';
    }

    if (processType !== 'solicitacao') {
      return '';
    }

    if ([0, 4, 15, 40].indexOf(finalActivity) !== -1) {
      return this.asText(requesterId);
    }

    if ([5, 26, 28, 38, 74].indexOf(finalActivity) !== -1) {
      return this.buildGroupResponsible('TI');
    }

    if ([19, 54].indexOf(finalActivity) !== -1) {
      return this.asText(superiorId);
    }

    if ([36, 61].indexOf(finalActivity) !== -1) {
      return this.buildGroupResponsible('COMITE_GP');
    }

    if (finalActivity === 66) {
      return this.buildGroupResponsible('COMPRAS');
    }

    return '';
  },

  getDashboardProjectActionConfig: function (project) {
    if (!project) {
      return { enabled: false, route: '', label: 'Indisponivel' };
    }

    if (project.category === 'completed' && project.processType === 'desenvolvimento') {
      return {
        enabled: true,
        route: 'projectFinal',
        label: 'Visualizar Encerramento'
      };
    }

    if ((project.category === 'completed' || project.category === 'cancelled') && project.processType === 'solicitacao') {
      return {
        enabled: true,
        route: 'solicitationDetail',
        label: 'Visualizar'
      };
    }

    if (!project.isTerminal && project.canAct === false) {
      return {
        enabled: false,
        route: '',
        label: 'Indisponivel'
      };
    }

    return this.getPendencyActionConfig(project);
  },

  getPendencyActionConfig: function (project) {
    if (typeof fluigService === 'undefined' || !fluigService.getProjectProcessActionConfig) {
      return { enabled: false, route: '', label: 'Indisponivel' };
    }

    return fluigService.getProjectProcessActionConfig({
      processType: project.processType,
      processName: project.processName,
      estadoProcesso: project.processState,
      activity: project.activity
    });
  },

  getProjectActionDataAttrs: function (project, actionConfig) {
    return [
      'data-action="open-dashboard-project"',
      `data-document-id="${this.escapeHtml(project.documentId)}"`,
      `data-process-instance-id="${this.escapeHtml(project.processInstanceId)}"`,
      `data-estado-processo="${this.escapeHtml(project.processState)}"`,
      `data-activity="${this.escapeHtml(project.activity)}"`,
      `data-process-type="${this.escapeHtml(project.processType)}"`,
      `data-process-name="${this.escapeHtml(project.processName)}"`,
      `data-dataset-id="${this.escapeHtml(project.datasetId)}"`,
      `data-form-name="${this.escapeHtml(project.formName)}"`,
      `data-target-route="${this.escapeHtml(actionConfig.route)}"`
    ].join(' ');
  },

  getProjectReadonlyDataAttrs: function (project) {
    return [
      'data-action="open-dashboard-project-view"',
      `data-document-id="${this.escapeHtml(project.documentId)}"`,
      `data-process-instance-id="${this.escapeHtml(project.processInstanceId)}"`,
      `data-estado-processo="${this.escapeHtml(project.processState)}"`,
      `data-activity="${this.escapeHtml(project.activity)}"`,
      `data-process-type="${this.escapeHtml(project.processType)}"`,
      `data-process-name="${this.escapeHtml(project.processName)}"`,
      `data-dataset-id="${this.escapeHtml(project.datasetId)}"`,
      `data-form-name="${this.escapeHtml(project.formName)}"`,
      `data-status-value="${this.escapeHtml(project.statusValue)}"`,
      `data-category="${this.escapeHtml(project.category)}"`,
      'data-view-only="1"',
      'data-target-route="projectReadonlyView"'
    ].join(' ');
  },

  openProjectFromElement: function (element) {
    const trigger = $(element);
    const targetRoute = this.asText(trigger.data('target-route'));
    if (!targetRoute) {
      return;
    }

    const params = new URLSearchParams();
    const fields = [
      ['documentId', trigger.data('document-id')],
      ['processInstanceId', trigger.data('process-instance-id')],
      ['estadoProcesso', trigger.data('estado-processo')],
      ['activity', trigger.data('activity')],
      ['processType', trigger.data('process-type')],
      ['processName', trigger.data('process-name')],
      ['datasetId', trigger.data('dataset-id')],
      ['formName', trigger.data('form-name')],
      ['statusValue', trigger.data('status-value')],
      ['category', trigger.data('category')],
      ['viewOnly', trigger.data('view-only')]
    ];

    fields.forEach((pair) => {
      const value = this.asText(pair[1]);
      if (value) {
        params.set(pair[0], value);
      }
    });

    const queryString = params.toString();
    location.hash = queryString ? `#${targetRoute}?${queryString}` : `#${targetRoute}`;
  },

  getPendenciesListElement: function () {
    return $('#pending-approvals-list');
  },

  updatePendencyCount: function (count) {
    $('#pending-approvals-count').text(count);
  },

  showDeferredFeedback: function () {
    let payload = null;

    try {
      const raw = sessionStorage.getItem('gpDashboardFeedback');
      if (!raw) return;
      sessionStorage.removeItem('gpDashboardFeedback');
      payload = JSON.parse(raw);
    } catch (error) {
      sessionStorage.removeItem('gpDashboardFeedback');
      return;
    }

    this.showFeedbackToast(payload || {});
  },

  showFeedbackToast: function (payload) {
    const container = $('#page-container');
    if (!container.length) return;

    const type = this.asText(payload.type) || 'success';
    const config = {
      success: { icon: 'fa-solid fa-check-circle text-bevap-green', border: 'border-bevap-green' },
      error: { icon: 'fa-solid fa-times-circle text-red-500', border: 'border-red-500' },
      warning: { icon: 'fa-solid fa-exclamation-triangle text-bevap-gold', border: 'border-bevap-gold' },
      info: { icon: 'fa-solid fa-info-circle text-blue-500', border: 'border-blue-500' }
    }[type] || { icon: 'fa-solid fa-info-circle text-blue-500', border: 'border-blue-500' };

    let toast = $('#dashboard-feedback-toast');
    if (!toast.length) {
      container.append(`
        <div id="dashboard-feedback-toast" class="hidden fixed top-4 right-4 bg-white border-l-4 rounded-lg shadow-lg p-4 z-50 max-w-sm transform transition-all duration-300 opacity-0 translate-x-4">
          <div class="flex items-start">
            <i id="dashboard-feedback-icon" class="mr-3 mt-1"></i>
            <div>
              <h4 id="dashboard-feedback-title" class="font-semibold text-gray-900"></h4>
              <p id="dashboard-feedback-message" class="text-sm text-gray-600 mt-1"></p>
            </div>
          </div>
        </div>
      `);
      toast = $('#dashboard-feedback-toast');
    }

    toast
      .removeClass('border-bevap-green border-red-500 border-bevap-gold border-blue-500')
      .addClass(config.border);
    toast.find('#dashboard-feedback-icon').attr('class', `${config.icon} mr-3 mt-1`);
    toast.find('#dashboard-feedback-title').text(this.asText(payload.title) || 'Rascunho salvo');
    toast.find('#dashboard-feedback-message').text(this.asText(payload.message) || 'As alteracoes foram salvas com sucesso.');

    toast.removeClass('hidden');
    const animate = window.requestAnimationFrame || function (callback) { return setTimeout(callback, 0); };
    animate(() => {
      toast.removeClass('opacity-0 translate-x-4');
    });

    setTimeout(() => {
      toast.addClass('opacity-0 translate-x-4');
      setTimeout(() => toast.addClass('hidden'), 300);
    }, 5000);
  },

  getPriorityInfoLegacy: function (priority) {
    const normalized = this.normalizeForCompare(priority);

    if (normalized === 'critico' || normalized.indexOf('critico') !== -1) {
      return {
        label: 'Crítico',
        badgeClasses: 'bg-red-100 text-red-700',
        textClass: 'text-red-600',
        borderClass: 'border-red-500'
      };
    }

    if (normalized === 'estrategico' || normalized.indexOf('estrategico') !== -1) {
      return {
        label: 'Estratégico',
        badgeClasses: 'bg-emerald-100 text-emerald-700',
        textClass: 'text-emerald-600',
        borderClass: 'border-emerald-500'
      };
    }

    if (normalized === 'operacional' || normalized.indexOf('operacional') !== -1) {
      return {
        label: 'Operacional',
        badgeClasses: 'bg-bevap-navy/10 text-bevap-navy',
        textClass: 'text-bevap-navy',
        borderClass: 'border-bevap-navy'
      };
    }

    return {
      label: this.asText(priority) || 'Sem prioridade',
      badgeClasses: 'bg-slate-100 text-slate-700',
      textClass: 'text-slate-600',
      borderClass: 'border-slate-300'
    };
  },

  getPriorityInfo: function (priority) {
    const normalized = this.normalizeForCompare(priority);

    if (normalized === 'critico' || normalized.indexOf('critico') !== -1) {
      return {
        label: 'Cr\u00edtico',
        badgeClasses: 'bg-red-100 text-red-700',
        textClass: 'text-red-600',
        borderClass: 'border-red-500'
      };
    }

    if (normalized === 'estrategico' || normalized.indexOf('estrategico') !== -1) {
      return {
        label: 'Estrat\u00e9gico',
        badgeClasses: 'bg-emerald-100 text-emerald-700',
        textClass: 'text-emerald-600',
        borderClass: 'border-emerald-500'
      };
    }

    if (normalized === 'operacional' || normalized.indexOf('operacional') !== -1) {
      return {
        label: 'Operacional',
        badgeClasses: 'bg-bevap-navy/10 text-bevap-navy',
        textClass: 'text-bevap-navy',
        borderClass: 'border-bevap-navy'
      };
    }

    return {
      label: this.asText(priority) || 'Sem prioridade',
      badgeClasses: 'bg-slate-100 text-slate-700',
      textClass: 'text-slate-600',
      borderClass: 'border-slate-300'
    };
  },

  getPriorityBorderClass: function (priority) {
    return this.getPriorityInfo(priority).borderClass;
  },

  getTypeInfo: function (type) {
    const label = this.asText(type) || 'Não informado';
    const normalized = this.normalizeForCompare(label);

    if (normalized === 'externo') {
      return {
        label: 'Externo',
        badgeClasses: 'bg-bevap-gold/20 text-bevap-gold'
      };
    }

    if (normalized === 'interno') {
      return {
        label: 'Interno',
        badgeClasses: 'bg-emerald-100 text-emerald-700'
      };
    }

    return {
      label: label,
      badgeClasses: 'bg-slate-100 text-slate-700'
    };
  },

  getShortStateLabel: function (value) {
    const text = this.asText(value);
    if (!text) return 'Etapa';

    if (text.length <= 34) {
      return text;
    }

    return text.slice(0, 31) + '...';
  },

  countBy: function (items, getter) {
    return (items || []).reduce((acc, item) => {
      const key = this.asText(getter(item)) || 'Não informado';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  },

  firstText: function (values) {
    for (let i = 0; i < values.length; i++) {
      const text = this.asText(values[i]);
      if (text) return text;
    }
    return '';
  },

  parseDashboardDate: function (value) {
    const text = this.asText(value);
    if (!text) return null;

    const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*-\s*|\s+)?(.*)$/);
    if (brMatch) {
      const day = parseInt(brMatch[1], 10);
      const month = parseInt(brMatch[2], 10) - 1;
      const year = parseInt(brMatch[3], 10);
      const time = this.parseTimeParts(brMatch[4]);
      const parsed = new Date(year, month, day, time.hours, time.minutes, time.seconds);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T])?(.*)$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const time = this.parseTimeParts(isoMatch[4]);
      const parsed = new Date(year, month, day, time.hours, time.minutes, time.seconds);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const fallback = new Date(text);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  },

  parseTimeParts: function (value) {
    const text = this.asText(value);
    if (!text) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const colonMatch = text.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (colonMatch) {
      return {
        hours: parseInt(colonMatch[1], 10) || 0,
        minutes: parseInt(colonMatch[2], 10) || 0,
        seconds: parseInt(colonMatch[3], 10) || 0
      };
    }

    const digits = text.replace(/\D/g, '').slice(0, 6).padStart(6, '0');
    return {
      hours: parseInt(digits.slice(0, 2), 10) || 0,
      minutes: parseInt(digits.slice(2, 4), 10) || 0,
      seconds: parseInt(digits.slice(4, 6), 10) || 0
    };
  },

  formatDate: function (date) {
    if (!date) return '';
    return [
      this.pad2(date.getDate()),
      this.pad2(date.getMonth() + 1),
      date.getFullYear()
    ].join('/');
  },

  formatRelativeTime: function (date) {
    if (!date) {
      return 'Horario nao informado';
    }

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const minutes = Math.floor(diffMs / (60 * 1000));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `Ha ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Ha ${hours} h`;

    return `${this.formatDate(date)} ${this.pad2(date.getHours())}:${this.pad2(date.getMinutes())}`;
  },

  pad2: function (value) {
    const text = String(value);
    return text.length < 2 ? `0${text}` : text;
  },

  normalizeForCompare: function (value) {
    return this.asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

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

  bindEvents: function () {
    const container = $('#page-container');
    this.unbindEvents();

    container.on(`click${this._eventNamespace}`, 'a[href="nova-solicitacao.html"]', (event) => {
      event.preventDefault();
      location.hash = '#newSolicitation';
    });

    container.on(`click${this._eventNamespace}`, '.tab-button', (event) => {
      event.preventDefault();
      this.activateTab($(event.currentTarget).data('tab'));
    });

    container.on(`click${this._eventNamespace}`, '#applyFilters', (event) => {
      event.preventDefault();
      this.applyFiltersAndRender();
    });

    container.on(`change${this._eventNamespace}`, '#filterStatus, #filterPriority, #filterType, #filterPeriod', () => {
      this.applyFiltersAndRender();
    });

    container.on(`click${this._eventNamespace}`, '#clearFilters', (event) => {
      event.preventDefault();
      $('#filterStatus, #filterPriority, #filterType, #filterPeriod').val('');
      this.applyFiltersAndRender();
    });

    container.on(`click${this._eventNamespace}`, '[data-action="show-all-pendencies"]', (event) => {
      event.preventDefault();
      $('#filterStatus').val('');
      this.applyFiltersAndRender();
      this.activateTab('pipeline-view');
      const tabs = $('#content-tabs');
      if (tabs.length && tabs.get(0).scrollIntoView) {
        tabs.get(0).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    container.on(`click${this._eventNamespace}`, '[data-action="open-dashboard-project"]', (event) => {
      event.preventDefault();
      this.openProjectFromElement(event.currentTarget);
    });

    container.on(`click${this._eventNamespace}`, '[data-action="open-dashboard-project-view"]', (event) => {
      event.preventDefault();
      this.openProjectFromElement(event.currentTarget);
    });

    container.on(`keydown${this._eventNamespace}`, '[data-action="open-dashboard-project-view"]', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      this.openProjectFromElement(event.currentTarget);
    });
  },

  activateTab: function (tabId) {
    const targetTab = this.asText(tabId) || 'pipeline-view';
    const tabs = ['pipeline-view', 'table-view', 'graphics-view'];

    tabs.forEach((tab) => {
      const isActive = tab === targetTab;
      $(`#${tab}`).toggleClass('hidden', !isActive);
      $(`.tab-button[data-tab="${tab}"]`)
        .toggleClass('border-bevap-green text-bevap-green', isActive)
        .toggleClass('border-transparent text-slate-600', !isActive);
    });

    if (targetTab === 'graphics-view') {
      this.renderGraphSummary(this._state.filteredProjects || []);
      setTimeout(() => this.resizeDashboardCharts(), 0);
    }
  },

  unbindEvents: function () {
    $('#page-container').off(this._eventNamespace);
  }
};
