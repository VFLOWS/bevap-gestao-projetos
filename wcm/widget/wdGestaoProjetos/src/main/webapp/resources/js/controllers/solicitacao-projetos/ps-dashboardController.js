const dashboardController = {
  _eventNamespace: '.dashboard',
  _pendenciesDatasetId: 'dsGetSolicitacaoProjetos',
  _pendenciesFields: ['titulodoprojetoNS', 'documentid', 'prioridadeNS', 'estadoProcesso'],

  load: async function () {
    const container = $('#page-container');

    try {
      const html = await $.get(this.getTemplateUrl());
      container.html(html);
      this.bindEvents();
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
      console.group('[loadPendencies] iniciando');
      console.log('[loadPendencies] dataset id :', this._pendenciesDatasetId);
      console.log('[loadPendencies] fields     :', JSON.stringify(this._pendenciesFields));
      console.groupEnd();

      const rows = await fluigService.getDatasetRows(this._pendenciesDatasetId, {
        fields: this._pendenciesFields
      });

      console.group('[loadPendencies] rows recebidos');
      console.log('[loadPendencies] rows.length :', rows ? rows.length : 'null/undefined');
      console.log('[loadPendencies] rows[0]     :', rows && rows.length ? JSON.stringify(rows[0]) : 'vazio');
      console.log('[loadPendencies] todas rows  :', JSON.stringify(rows));
      console.groupEnd();

      const pendencies = this.normalizePendencies(rows);

      console.group('[loadPendencies] pendencias normalizadas');
      console.log('[loadPendencies] pendencies.length :', pendencies.length);
      console.log('[loadPendencies] pendencies        :', JSON.stringify(pendencies));
      console.groupEnd();

      this.renderPendencies(pendencies);
    } catch (error) {
      console.error('Dashboard pendencies load error:', error);
      this.renderPendenciesError();
    }
  },

  normalizePendencies: function (rows) {
    const pendencies = (rows || []).map((row, index) => {
      return {
        projectCode: 'PRJ-2026-018',
        title: this.asText(row.titulodoprojetoNS),
        documentId: this.asText(row.documentid),
        priority: this.asText(row.prioridadeNS),
        processState: this.asText(row.estadoProcesso),
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
      const subtitle = this.getPendencySubtitle(pendency.processState);
      const actionConfig = this.getPendencyActionConfig(pendency.processState);
      const buttonLabel = actionConfig.route === 'immediateApproval'
        ? 'Abrir Aprovacao'
        : actionConfig.route === 'technicalTriage'
          ? 'Abrir Triagem'
        : actionConfig.route === 'committeeApproval'
          ? 'Abrir Comitê'
        : actionConfig.route === 'correction'
          ? 'Corrigir Agora'
        : actionConfig.route === 'newSolicitation'
          ? 'Continuar Rascunho'
        : actionConfig.enabled
          ? 'Avaliar Agora'
          : 'Indisponivel';
      const borderStyleAttr = style.borderStyle ? ` style="${style.borderStyle}"` : '';
      const buttonClasses = actionConfig.enabled
        ? 'w-full bg-bevap-green hover:bg-bevap-green/90 text-white text-sm py-2 rounded-lg font-medium transition-colors'
        : 'w-full bg-slate-200 text-slate-500 text-sm py-2 rounded-lg font-medium cursor-not-allowed';

      return `
        <div class="bg-slate-50 rounded-lg p-3 border-l-4 ${style.borderClass}"${borderStyleAttr}>
          <input type="hidden" name="pendingDocumentId" value="${this.escapeHtml(pendency.documentId)}">
          <input type="hidden" name="pendingProcessState" value="${this.escapeHtml(pendency.processState)}">
          <div class="flex items-start justify-between mb-2 gap-3">
            <span class="text-xs font-mono text-slate-500">${this.escapeHtml(pendency.projectCode)}</span>
            <span class="text-xs font-medium ${style.textClass}">${this.escapeHtml(priority)}</span>
          </div>
          <p class="text-sm font-medium text-bevap-navy mb-2">${this.escapeHtml(title)}</p>
          <p class="text-xs text-slate-600 mb-3">${this.escapeHtml(subtitle)}</p>
          <button
            data-action="open-pendency"
            data-document-id="${this.escapeHtml(pendency.documentId)}"
            data-estado-processo="${this.escapeHtml(pendency.processState)}"
            data-target-route="${this.escapeHtml(actionConfig.route)}"
            ${actionConfig.enabled ? '' : 'disabled'}
            class="${buttonClasses}"
          >
            ${this.escapeHtml(buttonLabel)}
          </button>
        </div>
      `;
    });

    list.html(cards.join(''));
  },

  getPendencySubtitle: function (estadoProcesso) {
    const raw = this.asText(estadoProcesso);
    const activity = this.parseEstadoProcessoActivity(raw);

    const mapping = {
      0: 'Rascunho da Nova Solicitacao',
      4: 'Rascunho da Nova Solicitacao',
      5: 'Aguardando TI Avaliar Projeto',
      15: 'Aguardando Correção do Solicitante',
      19: 'Aguardando Aprovação do Superior Imediato',
      26: 'Aguardando Triagem Tecnica TI',
      28: 'Erro de Integracao GLPI',
      29: 'Integracao GLPI',
      36: 'Aguardando Aprovação Comite',
      38: 'Aguardando TI Anexar Proposta Comercial',
      40: 'Aguardando Solicitante Aprovar Proposta',
      53: 'Integracao Iniciar Projeto',
      54: 'Aguardando Aprovacao Gerente do Centro de Custo',
      61: 'Aguardando Comite Aprovar Custo do Projeto',
      66: 'Aguardando Compras Realizar Contratação',
      72: 'Finalizado',
      74: 'Erro de Integracao Iniciar Projeto'
    };

    if (activity === 24 || activity === 47 || activity === 59) {
      return 'Cancelado';
    }

    if (activity && mapping[activity]) {
      return mapping[activity];
    }

    if (raw) {
      return raw;
    }

    return 'Pendência disponível para avaliação';
  },

  getPendencyActionConfig: function (estadoProcesso) {
    const activity = this.parseEstadoProcessoActivity(estadoProcesso);

    if (activity === 0 || activity === 4) {
      return {
        enabled: true,
        route: 'newSolicitation',
        label: 'Continuar Rascunho'
      };
    }

    if (activity === 5) {
      return {
        enabled: true,
        route: 'evaluateProject',
        label: 'Avaliar Agora'
      };
    }

    if (activity === 15) {
      return {
        enabled: true,
        route: 'correction',
        label: 'Corrigir Agora'
      };
    }

    if (activity === 19) {
      return {
        enabled: true,
        route: 'immediateApproval',
        label: 'Abrir AprovaÃ§Ã£o'
      };
    }

    if (activity === 26) {
      return {
        enabled: true,
        route: 'technicalTriage',
        label: 'Abrir Triagem'
      };
    }

    if (activity === 36) {
      return {
        enabled: true,
        route: 'committeeApproval',
        label: 'Abrir Comitê'
      };
    }

    return {
      enabled: false,
      route: '',
      label: 'IndisponÃ­vel'
    };
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

  getPendenciesListElement: function () {
    return $('#pending-approvals-list');
  },

  updatePendencyCount: function (count) {
    $('#pending-approvals-count').text(count);
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

      const queryString = params.toString();
      location.hash = queryString ? `#${targetRoute}?${queryString}` : `#${targetRoute}`;
    });
  },

  unbindEvents: function () {
    $('#page-container').off(this._eventNamespace);
  }
};
