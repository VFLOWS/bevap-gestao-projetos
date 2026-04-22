const solicitationDetailController = {
  _eventNamespace: '.solicitationDetail',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _datasetFields: [
    'documentid',
    'estadoProcesso',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'patrocinadorNS',
    'solicitanteNomeNS',
    'solicitanteColleagueIdNS',
    'prioridadeNS',
    'anexosNS'
  ],
  _uiComponentsKey: 'gpUiComponents',
  _approvalTabComponentsKey: 'gpApprovalTabComponents',
  _headerBackup: null,
  _toastTimer: null,
  _state: {
    documentId: '',
    processInstanceId: '',
    row: null
  },

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();
    this._state.documentId = this.asText(params.documentId || params.documentid);
    this._state.processInstanceId = this.asText(params.processInstanceId || params.processinstanceid);

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.bindEvents();
        this.renderSidebarSkeleton();
        this.loadSolicitation();
      })
      .fail((error) => {
        console.error('[solicitationDetail] Template load error:', error);
        container.html('<div class="p-6 text-red-600">Nao foi possivel carregar o detalhamento da solicitacao.</div>');
      });
  },

  destroy: function () {
    this.unbindEvents();
    this.restoreHeader();

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }

    this._state.documentId = '';
    this._state.processInstanceId = '';
    this._state.row = null;
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-solicitation-detail.html`;
  },

  getContainer: function () {
    return $('#page-container');
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
      titleEl.text('Minha Solicitacao');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Minha Solicitacao</span>
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

  bindEvents: function () {
    const container = this.getContainer();
    const ns = this._eventNamespace;

    this.unbindEvents();

    container.on(`click${ns}`, '[data-action="back-dashboard"]', (event) => {
      event.preventDefault();
      location.hash = '#dashboard';
    });

    container.on(`click${ns}`, '[data-action="show-attachments"]', async (event) => {
      event.preventDefault();
      await this.scrollToAttachments();
    });

    container.on(`click${ns}`, '[data-action="show-timeline"]', (event) => {
      event.preventDefault();
      this.showToast('A linha do tempo ainda nao foi implementada nesta tela.', 'warning');
    });
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
  },

  getUiComponents: function () {
    if (typeof $ === 'undefined') return null;
    const ui = $(document).data(this._uiComponentsKey);
    return ui && typeof ui === 'object' ? ui : null;
  },

  getApprovalTabComponents: function () {
    if (typeof $ === 'undefined') return null;
    const components = $(document).data(this._approvalTabComponentsKey);
    return components && typeof components === 'object' ? components : null;
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

    return String(value).trim();
  },

  parseJsonArray: function (value) {
    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  parseEstadoProcessoActivity: function (estadoProcesso) {
    const text = this.asText(estadoProcesso);
    if (!text) return null;

    const matchDash = text.match(/^\s*(\d+)\s*-/);
    const matchAny = matchDash || text.match(/(\d+)/);
    if (!matchAny) return null;

    const parsed = parseInt(matchAny[1], 10);
    return Number.isFinite(parsed) ? parsed : null;
  },

  getPriorityInfo: function (priority) {
    const normalized = this.asText(priority)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.indexOf('critico') !== -1) {
      return {
        label: 'Critico',
        iconClass: 'fa-solid fa-circle-exclamation',
        badgeClasses: 'bg-red-100 text-red-700'
      };
    }

    if (normalized.indexOf('operacional') !== -1) {
      return {
        label: 'Operacional',
        iconClass: 'fa-solid fa-circle',
        badgeClasses: 'bg-blue-100 text-blue-700'
      };
    }

    return {
      label: 'Estrategico',
      iconClass: 'fa-solid fa-star',
      badgeClasses: 'bg-green-100 text-green-800'
    };
  },

  getStatusInfo: function (estadoProcesso) {
    const activity = this.parseEstadoProcessoActivity(estadoProcesso);
    const mapping = {
      0: { label: 'Rascunho', iconClass: 'fa-solid fa-pen-to-square', badgeClasses: 'bg-slate-100 text-slate-700' },
      4: { label: 'Rascunho', iconClass: 'fa-solid fa-pen-to-square', badgeClasses: 'bg-slate-100 text-slate-700' },
      5: { label: 'Em avaliacao TI', iconClass: 'fa-solid fa-microscope', badgeClasses: 'bg-blue-100 text-blue-700' },
      15: { label: 'Em correcao', iconClass: 'fa-solid fa-rotate-left', badgeClasses: 'bg-yellow-100 text-yellow-700' },
      19: { label: 'Superior imediato', iconClass: 'fa-solid fa-user-check', badgeClasses: 'bg-indigo-100 text-indigo-700' },
      26: { label: 'Triagem tecnica', iconClass: 'fa-solid fa-laptop-code', badgeClasses: 'bg-cyan-100 text-cyan-700' },
      36: { label: 'Comite', iconClass: 'fa-solid fa-users', badgeClasses: 'bg-purple-100 text-purple-700' },
      38: { label: 'Proposta comercial', iconClass: 'fa-solid fa-file-signature', badgeClasses: 'bg-amber-100 text-amber-700' },
      40: { label: 'Aprovacao da proposta', iconClass: 'fa-solid fa-thumbs-up', badgeClasses: 'bg-lime-100 text-lime-700' },
      54: { label: 'Aprovacao GCC', iconClass: 'fa-solid fa-coins', badgeClasses: 'bg-orange-100 text-orange-700' },
      61: { label: 'Comite de custo', iconClass: 'fa-solid fa-scale-balanced', badgeClasses: 'bg-fuchsia-100 text-fuchsia-700' },
      66: { label: 'Contratacao', iconClass: 'fa-solid fa-cart-shopping', badgeClasses: 'bg-emerald-100 text-emerald-700' },
      72: { label: 'Finalizado', iconClass: 'fa-solid fa-circle-check', badgeClasses: 'bg-green-100 text-green-700' }
    };

    if (activity === 24 || activity === 47 || activity === 59) {
      return {
        label: 'Cancelado',
        iconClass: 'fa-solid fa-ban',
        badgeClasses: 'bg-red-100 text-red-700'
      };
    }

    if (activity && mapping[activity]) {
      return mapping[activity];
    }

    return {
      label: this.asText(estadoProcesso) || 'Solicitacao enviada',
      iconClass: 'fa-solid fa-clock',
      badgeClasses: 'bg-slate-100 text-slate-700'
    };
  },

  renderSidebarSkeleton: function () {
    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    const ui = this.getUiComponents();

    if (!summaryTarget.length || !ui || !ui.sidebar) {
      return;
    }

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: 'N/A',
      title: 'Carregando...',
      requester: 'N/A',
      showRequester: true,
      area: 'N/A',
      sponsor: 'N/A',
      attachmentsCount: 0,
      priority: { label: '-', iconClass: 'fa-solid fa-star', badgeClasses: 'bg-gray-100 text-gray-800' },
      status: { label: 'Carregando', iconClass: 'fa-solid fa-clock', badgeClasses: 'bg-gray-100 text-gray-800' }
    });
  },

  loadSolicitation: async function () {
    const detailTarget = this.getContainer().find('[data-component="solicitation-detail-content"]').first();

    try {
      if (!this._state.documentId && this._state.processInstanceId) {
        this._state.documentId = await fluigService.resolveDocumentIdByProcessInstanceId(this._state.processInstanceId);
      }

      if (!this._state.processInstanceId && this._state.documentId) {
        this._state.processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(this._state.documentId);
      }

      if (!this._state.documentId) {
        throw new Error('Nao foi possivel identificar a solicitacao para detalhamento.');
      }

      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields: this._datasetFields,
        filters: {
          documentid: this._state.documentId
        }
      });

      const row = rows && rows.length ? rows[0] : null;
      if (!row) {
        throw new Error('Nenhum dado da solicitacao foi encontrado.');
      }

      this._state.row = row;
      await this.renderSolicitationHistory();
      await this.renderSidebar(row);
    } catch (error) {
      console.error('[solicitationDetail] Error loading solicitation:', error);

      if (detailTarget.length) {
        detailTarget.html(`
          <div class="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700">
            ${this.escapeHtml(error && error.message ? error.message : 'Nao foi possivel carregar a solicitacao.')}
          </div>
        `);
      }

      this.showToast('Nao foi possivel carregar o detalhamento da solicitacao.', 'error');
    }
  },

  renderSolicitationHistory: async function () {
    const target = this.getContainer().find('[data-component="solicitation-detail-content"]').first();
    const components = this.getApprovalTabComponents();
    const component = components && components.solicitationHistory;

    if (!target.length) return;

    if (!component || typeof component.render !== 'function') {
      target.html('<div class="text-sm text-red-600">Componente de detalhamento indisponivel.</div>');
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteudo...</div>');

    if (typeof component.renderInto === 'function') {
      await component.renderInto(target, { documentId: this._state.documentId });
      return;
    }

    const html = await component.render({ documentId: this._state.documentId });
    target.html(html);

    if (typeof component.mountAttachments === 'function') {
      component.mountAttachments(target, { documentId: this._state.documentId });
    }
  },

  renderSidebar: async function (row) {
    const summaryTarget = this.getContainer().find('[data-component="project-summary"]').first();
    const ui = this.getUiComponents();
    if (!summaryTarget.length || !ui || !ui.sidebar) return;

    const projectCode = await fluigService.resolveProjectSummaryCode({
      documentId: this._state.documentId,
      processInstanceId: this._state.processInstanceId
    }) || 'N/A';

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: projectCode,
      title: this.asText(row.titulodoprojetoNS) || 'Projeto sem titulo',
      requester: this.asText(row.solicitanteNomeNS) || 'N/A',
      showRequester: true,
      area: this.asText(row.areaUnidadeNS) || 'N/A',
      sponsor: this.asText(row.patrocinadorNS) || 'N/A',
      attachmentsCount: this.parseJsonArray(row.anexosNS).length,
      priority: this.getPriorityInfo(row.prioridadeNS),
      status: this.getStatusInfo(row.estadoProcesso),
      customRows: [
        {
          label: 'ID Fluig',
          value: this.asText(this._state.processInstanceId) || 'N/A'
        }
      ]
    });
  },

  scrollToAttachments: async function () {
    await this.renderSolicitationHistory();

    const target = this.getContainer().find('[data-gp-attachments]').first();
    if (!target.length) {
      this.showToast('Nenhum anexo foi localizado nesta solicitacao.', 'warning');
      return;
    }

    const el = target.get(0);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    const root = this.getContainer();
    const toast = root.find('#solicitation-detail-toast');
    const messageEl = root.find('#solicitation-detail-toast-message');
    const icon = toast.find('i').first();
    if (!toast.length || !messageEl.length || !icon.length) return;

    const styleMap = {
      success: { iconClass: 'fa-check-circle text-bevap-green', borderClass: 'border-bevap-green' },
      error: { iconClass: 'fa-triangle-exclamation text-red-500', borderClass: 'border-red-500' },
      warning: { iconClass: 'fa-circle-exclamation text-yellow-500', borderClass: 'border-yellow-500' }
    };
    const presentation = styleMap[type || 'success'] || styleMap.success;

    messageEl.text(message || 'Acao realizada com sucesso.');
    icon.attr('class', `fa-solid ${presentation.iconClass} text-xl mr-3`);
    toast.attr('class', `hidden fixed top-20 right-4 bg-white shadow-lg rounded-lg p-4 z-50 border-l-4 ${presentation.borderClass}`);
    toast.removeClass('hidden');

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
    }

    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
      this._toastTimer = null;
    }, 3000);
  }
};
