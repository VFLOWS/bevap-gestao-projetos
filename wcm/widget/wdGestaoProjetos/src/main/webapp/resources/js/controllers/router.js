const router = {
  _lastHash: null,
  _isRouting: false,
  _currentController: null,
  _headerEventNamespace: '.routerHeader',

  init: function () {
    this._lastHash = window.location.hash;
    this.bindHeaderEvents();

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
        projectReadonlyView: {
          controller: projectReadonlyViewController,
          title: 'Visualização do Projeto',
          breadcrumb: ['Projetos', 'Visualização'],
          handler: () => projectReadonlyViewController.load(params)
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
        dpStartDeliveryErrorTreatment: {
          controller: dpStartDeliveryErrorTreatmentController,
          title: 'TI - Tratar Erro Iniciar Entrega Projeto',
          breadcrumb: ['TI', 'Erro Iniciar Entrega'],
          handler: () => dpStartDeliveryErrorTreatmentController.load(params)
        },
        epGlpiErrorTreatment: {
          controller: epGlpiErrorTreatmentController,
          title: 'Entrega - Tratar Erro Integracao GLPI',
          breadcrumb: ['Entrega', 'Erro Integracao GLPI'],
          handler: () => epGlpiErrorTreatmentController.load(params)
        },
        epDeliveryPlanning: {
          controller: epDeliveryPlanningController,
          title: 'Planejamento da Entrega do Projeto',
          breadcrumb: ['Entrega', 'Planejamento da Entrega'],
          handler: () => epDeliveryPlanningController.load(params)
        },
        epUserTraining: {
          controller: epUserTrainingController,
          title: 'Treinamento dos Usuarios da Entrega',
          breadcrumb: ['Entrega', 'Treinamento dos Usuarios'],
          handler: () => epUserTrainingController.load(params)
        },
        epFinalGoLiveValidation: {
          controller: epFinalGoLiveValidationController,
          title: 'TI - Validacao Final do Projeto para GO Live',
          breadcrumb: ['Entrega', 'Validacao Final GO Live'],
          handler: () => epFinalGoLiveValidationController.load(params)
        },
        epGoLiveExecution: {
          controller: epGoLiveExecutionController,
          title: 'TI - Realizar GO Live em Producao',
          breadcrumb: ['Entrega', 'Realizar GO Live'],
          handler: () => epGoLiveExecutionController.load(params)
        },
        epRequesterGoLiveValidation: {
          controller: epRequesterGoLiveValidationController,
          title: 'Solicitante - Validar GO Live em Producao',
          breadcrumb: ['Entrega', 'Validar GO Live'],
          handler: () => epRequesterGoLiveValidationController.load(params)
        },
        epProjectClosureDocumentation: {
          controller: epProjectClosureDocumentationController,
          title: 'TI - Anexar Documentacao de Encerramento do Projeto',
          breadcrumb: ['Entrega', 'Encerramento'],
          handler: () => epProjectClosureDocumentationController.load(params)
        },
        efGlpiErrorTreatment: {
          controller: efGlpiErrorTreatmentController,
          title: 'Execucao de Fases - Tratar Erro Integracao GLPI',
          breadcrumb: ['Execucao de Fases', 'Erro Integracao GLPI'],
          handler: () => efGlpiErrorTreatmentController.load(params)
        },
        executionActivityWaiting: {
          controller: executionActivityWaitingController,
          title: 'Aguardando Execução da Atividade',
          breadcrumb: ['Execução de Fases', 'Aguardando Execução'],
          handler: () => executionActivityWaitingController.load(params)
        },
        executionActivity: {
          controller: executionActivityController,
          title: 'Execução da Atividade',
          breadcrumb: ['Execução de Fases', 'Execução da Atividade'],
          handler: () => executionActivityController.load(params)
        },
        executionActivityRequesterValidation: {
          controller: executionActivityRequesterValidationController,
          title: 'Solicitante - Validação da Atividade',
          breadcrumb: ['Execução de Fases', 'Validação do Solicitante'],
          handler: () => executionActivityRequesterValidationController.load(params)
        },
        executionActivityTiValidation: {
          controller: executionActivityTiValidationController,
          title: 'TI - Validação da Atividade',
          breadcrumb: ['Execução de Fases', 'Validação TI'],
          handler: () => executionActivityTiValidationController.load(params)
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
          title: 'Desenvolvimento - Execução de Projeto',
          breadcrumb: ['Desenvolvimento', 'Execução de Projeto'],
          handler: () => projectExecutionController.load(params)
        },
        projectRequesterValidation: {
          controller: projectRequesterValidationController,
          title: 'Desenvolvimento - Validação do Solicitante',
          breadcrumb: ['Desenvolvimento', 'Validação do Solicitante'],
          handler: () => projectRequesterValidationController.load(params)
        },
        projectTiValidation: {
          controller: projectTiValidationController,
          title: 'Desenvolvimento - Validação TI',
          breadcrumb: ['Desenvolvimento', 'Validação TI'],
          handler: () => projectTiValidationController.load(params)
        },
        projectFinal: {
          controller: projectFinalController,
          title: 'Desenvolvimento - Execução de Projeto Finalizada',
          breadcrumb: ['Desenvolvimento', 'Execução de Projeto Finalizada'],
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
      route.page = page;
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

    this.updateBackButton(route);
  },

  bindHeaderEvents: function () {
    const ns = this._headerEventNamespace;
    $(document)
      .off(`click${ns}`, '[data-action="gp-open-fluig-home-modal"]')
      .on(`click${ns}`, '[data-action="gp-open-fluig-home-modal"]', (event) => {
        event.preventDefault();
        this.openFluigHomeModal();
      });

    $(document)
      .off(`keydown${ns}`, '[data-action="gp-open-fluig-home-modal"]')
      .on(`keydown${ns}`, '[data-action="gp-open-fluig-home-modal"]', (event) => {
        const key = event.key || event.which;
        if (key !== 'Enter' && key !== ' ' && key !== 13 && key !== 32) return;
        event.preventDefault();
        this.openFluigHomeModal();
      });

    $(document)
      .off(`click${ns}`, '[data-action="gp-back-dashboard"]')
      .on(`click${ns}`, '[data-action="gp-back-dashboard"]', (event) => {
        event.preventDefault();
        this.openBackDashboardModal();
      });

    $(document)
      .off(`click${ns}`, '[data-action="gp-cancel-back-dashboard"]')
      .on(`click${ns}`, '[data-action="gp-cancel-back-dashboard"]', (event) => {
        event.preventDefault();
        this.closeBackDashboardModal();
      });

    $(document)
      .off(`click${ns}`, '[data-action="gp-confirm-back-dashboard"]')
      .on(`click${ns}`, '[data-action="gp-confirm-back-dashboard"]', (event) => {
        event.preventDefault();
        this.confirmBackToDashboard();
      });

    $(document)
      .off(`click${ns}`, '[data-component="gp-back-dashboard-modal"]')
      .on(`click${ns}`, '[data-component="gp-back-dashboard-modal"]', (event) => {
        if (event.target !== event.currentTarget) return;
        this.closeBackDashboardModal();
      });

    $(document)
      .off(`click${ns}`, '[data-action="gp-cancel-fluig-home"]')
      .on(`click${ns}`, '[data-action="gp-cancel-fluig-home"]', (event) => {
        event.preventDefault();
        this.closeFluigHomeModal();
      });

    $(document)
      .off(`click${ns}`, '[data-action="gp-confirm-fluig-home"]')
      .on(`click${ns}`, '[data-action="gp-confirm-fluig-home"]', (event) => {
        event.preventDefault();
        this.confirmFluigHome();
      });

    $(document)
      .off(`click${ns}`, '[data-component="gp-fluig-home-modal"]')
      .on(`click${ns}`, '[data-component="gp-fluig-home-modal"]', (event) => {
        if (event.target !== event.currentTarget) return;
        this.closeFluigHomeModal();
      });
  },

  updateBackButton: function (route) {
    const isDashboard = route && route.page === 'dashboard';
    $('[data-action="gp-back-dashboard"]').toggleClass('hidden', Boolean(isDashboard));
  },

  getBackDashboardModal: function () {
    return $('[data-component="gp-back-dashboard-modal"]').first();
  },

  openBackDashboardModal: function () {
    if ((window.location.hash || '#dashboard').replace('#', '').split('?')[0] === 'dashboard') {
      return;
    }
    this.getBackDashboardModal().removeClass('hidden');
  },

  closeBackDashboardModal: function () {
    this.getBackDashboardModal().addClass('hidden');
  },

  confirmBackToDashboard: function () {
    this.closeBackDashboardModal();
    if (window.location.hash === '#dashboard') {
      this.route();
      return;
    }
    window.location.hash = '#dashboard';
  },

  getFluigHomeModal: function () {
    return $('[data-component="gp-fluig-home-modal"]').first();
  },

  openFluigHomeModal: function () {
    const modal = this.getFluigHomeModal();
    const isDashboard = (window.location.hash || '#dashboard').replace('#', '').split('?')[0] === 'dashboard';
    const message = isDashboard
      ? 'Você será redirecionado para a tela inicial do Fluig.'
      : 'Você será redirecionado para a tela inicial do Fluig. Alterações não salvas nesta tela serão perdidas.';

    modal.find('[data-role="gp-fluig-home-message"]').text(message);
    modal.removeClass('hidden');
  },

  closeFluigHomeModal: function () {
    this.getFluigHomeModal().addClass('hidden');
  },

  confirmFluigHome: function () {
    this.closeFluigHomeModal();
    window.location.href = '/portal/p/1/home';
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
