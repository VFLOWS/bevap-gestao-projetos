const router = {
  _lastHash: null,
  _isRouting: false,
  _currentController: null,

  init: function () {
    this._lastHash = window.location.hash;

    $(window).off('hashchange.router').on('hashchange.router', () => {
      if (window.location.hash !== this._lastHash) {
        this._lastHash = window.location.hash;
        this.route();
      }
    });

    this.route();
  },

  route: async function () {
    const rawHash = window.location.hash.replace('#', '');
    if (!rawHash) {
      window.location.hash = '#dashboard';
      return;
    }

    if (this._isRouting) return;
    this._isRouting = true;

    const container = $('#page-container');
    const loading = (function () {
      if (typeof modalLoadingService !== 'undefined' && modalLoadingService.show) {
        return modalLoadingService.show({
          title: 'Aguarde',
          message: 'Carregando a tela...'
        });
      }

      const legacyLoading = FLUIGC.loading(container);
      legacyLoading.show();
      return {
        hide: function () { legacyLoading.hide(); },
        updateMessage: function () {}
      };
    })();

    try {
      const [page, paramStr] = rawHash.split('?');
      const params = this.parseParams(paramStr);

      window.scrollTo(0, 0);
      $('html, body').stop(true).animate({ scrollTop: 0 }, 300);

      const routes = {
        dashboard: {
          controller: dashboardController,
          title: 'Dashboard',
          handler: () => dashboardController.load(params)
        },
        projectPlanning: {
          controller: projectPlanningController,
          title: 'Desenvolvimento - Planejamento do Projeto',
          breadcrumb: ['Desenvolvimento', 'Planejamento do Projeto'],
          handler: () => projectPlanningController.load(params)
        },
        newSolicitation: {
          controller: newSolicitationController,
          title: 'Nova Solicitacao',
          breadcrumb: ['Solicitacoes', 'Nova Solicitacao'],
          handler: () => newSolicitationController.load(params)
        },
        solicitationDetail: {
          controller: solicitationDetailController,
          title: 'Minha Solicitacao',
          breadcrumb: ['Solicitacoes', 'Minha Solicitacao'],
          handler: () => solicitationDetailController.load(params)
        },
        correction: {
          controller: correctionController,
          title: 'Solicitante - Corrigir Solicitacao',
          breadcrumb: ['Solicitacoes', 'Corrigir Solicitacao'],
          handler: () => correctionController.load(params)
        },
        evaluateProject: {
          controller: evaluateProjectController,
          title: 'TI - Avaliar Projeto',
          breadcrumb: ['TI', 'Avaliar Projeto'],
          handler: () => evaluateProjectController.load(params)
        },
        immediateApproval: {
          controller: immediateApprovalController,
          title: 'Gestor Imediato - Aprovar Projeto',
          breadcrumb: ['Aprovacoes', 'Gestor Imediato'],
          handler: () => immediateApprovalController.load(params)
        },
        technicalTriage: {
          controller: technicalTriageController,
          title: 'TI - Triagem Tecnica',
          breadcrumb: ['TI', 'Triagem Tecnica'],
          handler: () => technicalTriageController.load(params)
        },
        committeeApproval: {
          controller: committeeApprovalController,
          title: 'Comite - Aprovar Projeto',
          breadcrumb: ['Aprovacoes', 'Comite'],
          handler: () => committeeApprovalController.load(params)
        },
        commercialProposal: {
          controller: commercialProposalController,
          title: 'TI - Proposta Comercial',
          breadcrumb: ['TI', 'Proposta Comercial'],
          handler: () => commercialProposalController.load(params)
        },
        gccCostApproval: {
          controller: gccCostApprovalController,
          title: 'GCC - Aprovar Custo do Projeto',
          breadcrumb: ['Aprovacoes', 'GCC'],
          handler: () => gccCostApprovalController.load(params)
        },
        committeeCostApproval: {
          controller: committeeCostApprovalController,
          title: 'Comite - Aprovar Custo do Projeto',
          breadcrumb: ['Aprovacoes', 'Comite - Custo'],
          handler: () => committeeCostApprovalController.load(params)
        },
        purchaseContracting: {
          controller: purchaseContractingController,
          title: 'Compras - Realizar Contratacao',
          breadcrumb: ['Compras', 'Realizar Contratacao'],
          handler: () => purchaseContractingController.load(params)
        },
        glpiErrorTreatment: {
          controller: glpiErrorTreatmentController,
          title: 'TI - Tratar Erro Integracao GLPI',
          breadcrumb: ['TI', 'Erro Integracao GLPI'],
          handler: () => glpiErrorTreatmentController.load(params)
        },
        dpGlpiErrorTreatment: {
          controller: dpGlpiErrorTreatmentController,
          title: 'TI - Tratar Erro Integracao GLPI',
          breadcrumb: ['TI', 'Erro Integracao GLPI'],
          handler: () => dpGlpiErrorTreatmentController.load(params)
        },
        dpStartExecErrorTreatment: {
          controller: dpStartExecErrorTreatmentController,
          title: 'TI - Tratar Erro Iniciar Execução',
          breadcrumb: ['TI', 'Erro Iniciar Execução'],
          handler: () => dpStartExecErrorTreatmentController.load(params)
        },
        executionActivityWaiting: {
          controller: executionActivityWaitingController,
          title: 'Aguardando Execucao da Atividade',
          breadcrumb: ['Execucao de Fases', 'Aguardando Execucao'],
          handler: () => executionActivityWaitingController.load(params)
        },
        executionActivity: {
          controller: executionActivityController,
          title: 'Execucao da Atividade',
          breadcrumb: ['Execucao de Fases', 'Execucao da Atividade'],
          handler: () => executionActivityController.load(params)
        },
        requesterProposalApproval: {
          controller: requesterProposalApprovalController,
          title: 'Solicitante - Aprovar Proposta Comercial',
          breadcrumb: ['Solicitacoes', 'Aprovar Proposta Comercial'],
          handler: () => requesterProposalApprovalController.load(params)
        },
        // ADICIONE ESTA NOVA ROTA:
        projectExecution: {
          controller: projectExecutionController,
          title: 'Desenvolvimento - Execução do Projeto',
          breadcrumb: ['Desenvolvimento', 'Execução do Projeto'],
          handler: () => projectExecutionController.load(params)
        },
        projectRequesterValidation: {
          controller: projectRequesterValidationController,
          title: 'Desenvolvimento - Validacao do Solicitante',
          breadcrumb: ['Desenvolvimento', 'Validacao do Solicitante'],
          handler: () => projectRequesterValidationController.load(params)
        },
        projectTiValidation: {
          controller: projectTiValidationController,
          title: 'Desenvolvimento - Validacao TI',
          breadcrumb: ['Desenvolvimento', 'Validacao TI'],
          handler: () => projectTiValidationController.load(params)
        },
        projectFinal: {
          controller: projectFinalController,
          title: 'Desenvolvimento - Execucao de Projeto Finalizada',
          breadcrumb: ['Desenvolvimento', 'Execucao de Projeto Finalizada'],
          handler: () => projectFinalController.load(params)
        },
      };

      const route = routes[page];
      await this.destroyCurrentController();

      if (!route) {
        this.showNotFound();
        return;
      }

      this._currentController = route.controller;
      await Promise.resolve(route.handler());
      this.applyHeader(route);
    } catch (error) {
      console.error('Router error:', error);
      this.showError('An unexpected error occurred.');
    } finally {
      loading.hide();
      this._isRouting = false;
    }
  },

  applyHeader: function (route) {
    const title = (route && route.title) || 'Dashboard';
    const trail = (route && route.breadcrumb && route.breadcrumb.length)
      ? route.breadcrumb
      : [title];
    const header = $('#header');
    const titleEl = header.find('h1').first();
    const breadcrumbEl = header.find('nav').first();

    if (titleEl.length) {
      titleEl.text(title);
    }

    if (breadcrumbEl.length) {
      const trailHtml = trail.map((item, index) => {
        const isLast = index === trail.length - 1;
        const classes = isLast ? 'text-bevap-gold font-medium' : 'text-gray-300';
        return `
          <span class="${classes}">${this.escapeHtml(item)}</span>
          ${isLast ? '' : '<span class="text-gray-400">/</span>'}
        `;
      }).join('');

      breadcrumbEl.html(`
        <a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
          <i class="fa-solid fa-house text-xs"></i>
          <span>Inicio</span>
        </a>
        <span class="text-gray-400">/</span>
        ${trailHtml}
      `);
    }
  },

  escapeHtml: function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  destroyCurrentController: function () {
    if (!this._currentController || typeof this._currentController.destroy !== 'function') {
      this._currentController = null;
      return Promise.resolve();
    }

    const controller = this._currentController;
    this._currentController = null;

    try {
      return Promise.resolve(controller.destroy());
    } catch (error) {
      console.error('Controller destroy error:', error);
      return Promise.resolve();
    }
  },

  parseParams: function (paramStr) {
    if (!paramStr) return {};

    try {
      return Object.fromEntries(new URLSearchParams(paramStr));
    } catch (error) {
      console.warn('URL params parse error:', error);
      return {};
    }
  },

  showNotFound: function () {
    const container = $('#page-container');
    container.html(`
      <div class="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div class="text-6xl mb-4">
          <i class="fas fa-exclamation-triangle text-yellow-500"></i>
        </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">Page not found</h2>
        <p class="text-gray-600 mb-6">The page you are looking for does not exist.</p>
        <a href="#dashboard" class="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 transition-colors">
          Back to dashboard
        </a>
      </div>
    `);
  },

  showError: function (message) {
    const container = $('#page-container');
    container.html(`
      <div class="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div class="text-6xl mb-4">
          <i class="fas fa-exclamation-circle text-red-500"></i>
        </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">An error occurred</h2>
        <p class="text-gray-600 mb-6 text-center">${message || 'Please try again later.'}</p>
        <a href="#dashboard" class="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 transition-colors">
          Back to dashboard
        </a>
      </div>
    `);
  }
};
