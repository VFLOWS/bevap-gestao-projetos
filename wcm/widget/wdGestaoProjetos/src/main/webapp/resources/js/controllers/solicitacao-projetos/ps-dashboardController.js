const dashboardController = {
  _eventNamespace: '.dashboard',
  _viniciusColleagueId: '14cdc0c0-a710-4412-81dd-d94fe3abe00a',
  // Para testes: informe aqui o colleagueId que o usuario Vinicius deve simular.
  //_viniciusTestColleagueId: '14cdc0c0-a710-4412-81dd-d94fe3abe00a',
  _viniciusTestColleagueId: '81f76887-1ace-47f7-b47d-acb1466925a5',
  _pendencySharedFields: [
    'titulodoprojetoNS',
    'documentid',
    'prioridadeNS',
    'estadoProcesso'
  ],
  _pendencySolicitationFields: [
    'titulodoprojetoNS',
    'documentid',
    'prioridadeNS',
    'estadoProcesso',
    'STATUS',
    'solicitanteColleagueIdNS',
    'aprovadorSuperiorImedNS'
  ],
  _pendencyControlledProcessFields: [
    'titulodoprojetoNS',
    'documentid',
    'prioridadeNS',
    'estadoProcesso',
    'solicitanteColleagueIdNS'
  ],

  load: async function () {
    const container = $('#page-container');

    try {
      const html = await $.get(this.getTemplateUrl());
      container.html(html);
      this.bindEvents();
      this.showDeferredFeedback();
      await this.loadPendencies();
    } catch (error) {
      console.error('Dashboard template load error:', error);
      container.html('<div class="p-6 text-red-600">Failed to load dashboard.</div>');
    }
  },

  destroy: function () {
    this.unbindEvents();
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-dashboard.html`;
  },

  loadPendencies: async function () {
    const list = this.getPendenciesListElement();

    if (!list.length) {
      return;
    }

    this.renderPendenciesLoading();

    try {
      const rows = await this.fetchDashboardProcessRows();

      const accessContext = await this.resolveCurrentUserAccessContext();
      this.renderWelcomeUser(accessContext);
      const pendencies = this.applyActionPermission(
        this.filterPendenciesByCurrentUser(this.normalizePendencies(rows), accessContext),
        accessContext
      );

      this.renderPendencies(pendencies);
    } catch (error) {
      console.error('Dashboard pendencies load error:', error);
      this.renderPendenciesError();
    }
  },

  fetchDashboardProcessRows: async function () {
    if (typeof fluigService === 'undefined' || !fluigService.getProjectProcessDefinitions || !fluigService.getDatasetRows) {
      return [];
    }

    const definitions = fluigService.getProjectProcessDefinitions();
    const processTypes = Object.keys(definitions || {});
    const results = await Promise.all(processTypes.map((processType) => {
      const definition = definitions[processType];
      let fields = this._pendencySharedFields;
      if (processType === 'solicitacao') {
        fields = this._pendencySolicitationFields;
      } else if (processType === 'desenvolvimento' || processType === 'execucaoFases') {
        fields = this._pendencyControlledProcessFields;
      }

      return this.fetchDashboardRowsByProcess(definition, fields).catch((error) => {
        console.warn('[dashboard] Nao foi possivel carregar processo no dashboard:', processType, error);
        return [];
      });
    }));

    return results.reduce((acc, rows) => acc.concat(rows || []), []);
  },

  fetchDashboardRowsByProcess: async function (definition, fields) {
    if (!definition || !definition.datasetId) {
      return [];
    }

    try {
      const rows = await fluigService.getDatasetRows(definition.datasetId, {
        fields: fields
      });
      return (rows || []).map((row) => fluigService.buildProjectProcessContext(definition.type, row));
    } catch (error) {
      const fallbackFields = this._pendencySharedFields;
      const rows = await fluigService.getDatasetRows(definition.datasetId, {
        fields: fallbackFields
      });
      return (rows || []).map((row) => fluigService.buildProjectProcessContext(definition.type, row));
    }
  },

  normalizePendencies: function (rows) {
    const pendencies = (rows || []).map((row, index) => {
      const processContext = fluigService.buildProjectProcessContext(row.processType || row.processName, row);

      const requesterId = this.asText(row.solicitanteColleagueIdNS);
      const superiorId = this.asText(row.aprovadorSuperiorImedNS);

      return {
        projectCode: this.asText(row.codigoglpi) || this.asText(row.documentid) || '-',
        title: this.asText(row.titulodoprojetoNS),
        documentId: this.asText(row.documentid),
        priority: this.asText(row.prioridadeNS),
        processState: this.asText(row.estadoProcesso),
        processType: processContext.processType,
        processLabel: processContext.processLabel,
        processName: processContext.processName,
        datasetId: processContext.datasetId,
        formName: processContext.formName,
        activity: processContext.activity,
        requesterId: requesterId,
        superiorId: superiorId,
        currentResponsible: this.resolveResponsibleByActivity(
          processContext.processType,
          processContext.activity,
          requesterId,
          superiorId
        ),
        isTerminal: this.isTerminalPendency(processContext),
        _sourceIndex: index
      };
    });

    // Newest first: prefer higher documentId, fallback to latest dataset row.
    pendencies.sort((a, b) => {
      const docA = parseInt(a.documentId, 10);
      const docB = parseInt(b.documentId, 10);
      const hasDocA = Number.isFinite(docA);
      const hasDocB = Number.isFinite(docB);

      if (hasDocA && hasDocB && docA !== docB) {
        return docB - docA;
      }

      return b._sourceIndex - a._sourceIndex;
    });

    return pendencies;
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

  resolveCurrentUserAccessContext: async function () {
    const originalUserId = this.getCurrentUserId();
    const effectiveUserId = this.getEffectiveCurrentUserId();
    const groups = await this.getCurrentUserGroupIds(effectiveUserId);
    const effectiveUserName = await this.getColleagueNameById(effectiveUserId);

    return {
      originalUserId: originalUserId,
      userId: effectiveUserId,
      userName: effectiveUserName || effectiveUserId,
      groups: groups
    };
  },

  renderWelcomeUser: function (accessContext) {
    const name = this.asText(accessContext && accessContext.userName)
      || this.asText(accessContext && accessContext.userId)
      || 'Usuario';

    $('#dashboard-welcome-user').text(name);
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

  canCurrentUserSeePendency: function (pendency, accessContext) {
    if (this.isProjectManager(accessContext)) {
      return true;
    }

    if (pendency.processType === 'desenvolvimento') {
      return this.canSeeDevelopmentPendency(pendency, accessContext);
    }

    if (pendency.processType === 'execucaoFases') {
      return this.canSeeExecutionPendency(pendency, accessContext);
    }

    if (pendency.processType && pendency.processType !== 'solicitacao') {
      return false;
    }

    const userId = accessContext && accessContext.userId;
    const activity = parseInt(pendency && pendency.activity, 10);

    if (this.normalizeAccessText(pendency && pendency.requesterId) === this.normalizeAccessText(userId)) {
      return true;
    }

    if (this.isUserInGroup('TI', accessContext && accessContext.groups)) {
      return true;
    }

    if (
      this.normalizeAccessText(pendency && pendency.superiorId) === this.normalizeAccessText(userId)
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

    return this.canCurrentUserActOnPendency(pendency, accessContext);
  },

  isCurrentRequester: function (pendency, accessContext) {
    return this.normalizeAccessText(pendency && pendency.requesterId)
      === this.normalizeAccessText(accessContext && accessContext.userId);
  },

  isCurrentTiUser: function (accessContext) {
    return this.isUserInGroup('TI', accessContext && accessContext.groups);
  },

  canSeeDevelopmentPendency: function (pendency, accessContext) {
    const activity = parseInt(pendency && pendency.activity, 10);

    if (this.isCurrentTiUser(accessContext)) {
      return [14, 18, 23, 32, 46, 47, 52, 56].indexOf(activity) !== -1;
    }

    return this.isCurrentRequester(pendency, accessContext)
      && [23, 32].indexOf(activity) !== -1;
  },

  canSeeExecutionPendency: function (pendency, accessContext) {
    const activity = parseInt(pendency && pendency.activity, 10);

    if (this.isCurrentTiUser(accessContext)) {
      return [14, 18, 23, 32, 46, 52].indexOf(activity) !== -1;
    }

    return this.isCurrentRequester(pendency, accessContext)
      && [23, 32].indexOf(activity) !== -1;
  },

  canCurrentUserActOnPendency: function (pendency, accessContext) {
    if (this.isProjectManager(accessContext)) {
      return true;
    }

    const responsible = this.asText(pendency.currentResponsible);
    if (!responsible) return false;

    const groupId = this.parseResponsibleGroupId(responsible);
    if (groupId) {
      return this.isUserInGroup(groupId, accessContext && accessContext.groups);
    }

    return this.normalizeAccessText(responsible) === this.normalizeAccessText(accessContext && accessContext.userId);
  },

  filterPendenciesByCurrentUser: function (pendencies, accessContext) {
    return (pendencies || []).filter((pendency) => this.canCurrentUserSeePendency(pendency, accessContext || {}));
  },

  applyActionPermission: function (pendencies, accessContext) {
    return (pendencies || []).map((pendency) => Object.assign({}, pendency, {
      canAct: this.canCurrentUserActOnPendency(pendency, accessContext || {})
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

  isTerminalPendency: function (pendency) {
    const activity = parseInt(pendency && pendency.activity, 10);
    const processType = pendency && pendency.processType;

    if (isNaN(activity) || typeof fluigService === 'undefined' || !fluigService.getProjectCancelledActivities) {
      return false;
    }

    if (activity === 72) {
      return true;
    }

    return fluigService.getProjectCancelledActivities(processType).indexOf(activity) !== -1;
  },

  renderPendenciesLoading: function () {
    this.updatePendencyCount(0);
    this.getPendenciesListElement().html(`
      <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-500">
        Carregando pendências...
      </div>
    `);
  },

  renderPendenciesError: function () {
    this.updatePendencyCount(0);
    this.getPendenciesListElement().html(`
      <div class="bg-red-50 rounded-lg p-3 text-sm text-red-700 border border-red-200">
        Não foi possível carregar as pendências no momento.
      </div>
    `);
  },

  renderPendencies: function (pendencies) {
    const list = this.getPendenciesListElement();

    this.updatePendencyCount(pendencies.length);

    if (!pendencies.length) {
      list.html(`
        <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-500 border border-slate-200">
          Nenhuma pendência encontrada.
        </div>
      `);
      return;
    }

    const cards = pendencies.map((pendency) => {
      const priorityInfo = this.getPriorityInfo(pendency.priority);
      const style = priorityInfo.style;
      const priority = priorityInfo.label;
      const title = pendency.title || 'Projeto sem título';
      const subtitle = this.getPendencySubtitle(pendency);
      const currentResponsible = pendency.currentResponsible || '';
      const actionConfig = this.getPendencyActionConfig(pendency);
      const buttonLabel = actionConfig.label || 'Abrir';
      const showActionButton = actionConfig.hideButton !== true && !pendency.isTerminal;
      const canAct = actionConfig.enabled && pendency.canAct !== false;
      const borderStyleAttr = style.borderStyle ? ` style="${style.borderStyle}"` : '';
      const buttonClasses = canAct
        ? 'w-full bg-bevap-green hover:bg-bevap-green/90 text-white text-sm py-2 rounded-lg font-medium transition-colors'
        : 'w-full bg-slate-200 text-slate-500 text-sm py-2 rounded-lg font-medium cursor-not-allowed';
      const actionHtml = showActionButton
        ? `
          <button
            data-action="open-pendency"
            data-document-id="${this.escapeHtml(pendency.documentId)}"
            data-estado-processo="${this.escapeHtml(pendency.processState)}"
            data-process-type="${this.escapeHtml(pendency.processType)}"
            data-process-name="${this.escapeHtml(pendency.processName)}"
            data-dataset-id="${this.escapeHtml(pendency.datasetId)}"
            data-form-name="${this.escapeHtml(pendency.formName)}"
            data-target-route="${this.escapeHtml(actionConfig.route)}"
            ${canAct ? '' : 'disabled'}
            class="${buttonClasses}"
          >
            ${this.escapeHtml(buttonLabel)}
          </button>
        `
        : '';
      const responsibleHtml = currentResponsible
        ? `
          <p class="text-xs text-slate-500 ${showActionButton ? 'mb-3' : 'mb-0'}">
            <span class="font-medium text-slate-600">Responsável:</span>
            ${this.escapeHtml(currentResponsible)}
          </p>
        `
        : '';

      return `
        <div class="bg-slate-50 rounded-lg p-3 border-l-4 ${style.borderClass}"${borderStyleAttr}>
          <input type="hidden" name="pendingDocumentId" value="${this.escapeHtml(pendency.documentId)}">
          <input type="hidden" name="pendingProcessState" value="${this.escapeHtml(pendency.processState)}">
          <div class="flex items-start justify-between mb-2 gap-3">
            <span class="text-xs font-mono text-slate-500">${this.escapeHtml(pendency.projectCode)}</span>
            <span class="text-xs font-medium ${style.textClass}">${this.escapeHtml(priority)}</span>
          </div>
          <p class="text-sm font-medium text-bevap-navy mb-2">${this.escapeHtml(title)}</p>
          <p class="text-xs text-slate-600 ${responsibleHtml || actionHtml ? 'mb-1' : 'mb-0'}">${this.escapeHtml(subtitle)}</p>
          ${responsibleHtml}
          ${actionHtml}
        </div>
      `;
    });

    list.html(cards.join(''));
  },

  getPendencySubtitle: function (pendency) {
    return fluigService.getProjectProcessStateLabel({
      processType: pendency.processType,
      processName: pendency.processName,
      estadoProcesso: pendency.processState,
      activity: pendency.activity
    });
  },

  getPendencyActionConfig: function (pendency) {
    return fluigService.getProjectProcessActionConfig({
      processType: pendency.processType,
      processName: pendency.processName,
      estadoProcesso: pendency.processState,
      activity: pendency.activity
    });
  },

  parseEstadoProcessoActivity: function (estadoProcesso) {
    return fluigService.parseProjectProcessActivity(estadoProcesso);
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
    toast.find('#dashboard-feedback-message').text(this.asText(payload.message) || 'As alterações foram salvas com sucesso.');

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

  getPriorityInfo: function (priority) {
    const normalized = this.asText(priority)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized === 'critico' || normalized.indexOf('critico') !== -1) {
      return {
        label: 'Crítico',
        style: {
          borderClass: 'border-red-500',
          textClass: 'text-red-600'
        }
      };
    }

    if (normalized === 'estrategico' || normalized.indexOf('estrategico') !== -1) {
      return {
        label: 'Estratégico',
        style: {
          borderClass: 'border-bevap-gold',
          textClass: 'text-bevap-gold'
        }
      };
    }

    if (normalized === 'operacional' || normalized.indexOf('operacional') !== -1) {
      return {
        label: 'Operacional',
        style: {
          borderClass: '',
          textClass: 'text-slate-600',
          borderStyle: 'border-color: rgb(11 46 74 / var(--tw-border-opacity, 1));'
        }
      };
    }

    const label = this.asText(priority) || 'Sem prioridade';
    return {
      label,
      style: {
        borderClass: 'border-slate-300',
        textClass: 'text-slate-600'
      }
    };
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

    container.on(`click${this._eventNamespace}`, 'a[href="ux-avaliar-projeto.html"]', (event) => {
      event.preventDefault();
      location.hash = '#evaluateProject';
    });

    container.on(`click${this._eventNamespace}`, '[data-action="open-pendency"]', (event) => {
      event.preventDefault();

      const button = $(event.currentTarget);
      const documentId = button.data('document-id');
      const processState = button.data('estado-processo');
      const processType = String(button.data('process-type') || '').trim();
      const processName = String(button.data('process-name') || '').trim();
      const datasetId = String(button.data('dataset-id') || '').trim();
      const formName = String(button.data('form-name') || '').trim();
      const targetRoute = String(button.data('target-route') || '').trim();

      if (!targetRoute) {
        return;
      }

      const params = new URLSearchParams();

      if (documentId) {
        params.set('documentId', String(documentId));
      }

      if (processState) {
        params.set('estadoProcesso', String(processState));
      }

      if (processType) {
        params.set('processType', processType);
      }

      if (processName) {
        params.set('processName', processName);
      }

      if (datasetId) {
        params.set('datasetId', datasetId);
      }

      if (formName) {
        params.set('formName', formName);
      }

      const queryString = params.toString();
      location.hash = queryString ? `#${targetRoute}?${queryString}` : `#${targetRoute}`;
    });
  },

  unbindEvents: function () {
    $('#page-container').off(this._eventNamespace);
  }
};
