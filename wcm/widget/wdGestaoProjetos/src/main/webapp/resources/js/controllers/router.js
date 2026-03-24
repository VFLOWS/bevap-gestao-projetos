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
    const loading = FLUIGC.loading(container);
    loading.show();

    try {
      const [page, paramStr] = rawHash.split('?');
      const params = this.parseParams(paramStr);

      window.scrollTo(0, 0);
      $('html, body').stop(true).animate({ scrollTop: 0 }, 300);

      const routes = {
        dashboard: {
          controller: dashboardController,
          handler: () => dashboardController.load(params)
        },
        newSolicitation: {
          controller: newSolicitationController,
          handler: () => newSolicitationController.load(params)
        },
        correction: {
          controller: correctionController,
          handler: () => correctionController.load(params)
        },
        evaluateProject: {
          controller: evaluateProjectController,
          handler: () => evaluateProjectController.load(params)
        },
        immediateApproval: {
          controller: immediateApprovalController,
          handler: () => immediateApprovalController.load(params)
        },
        technicalTriage: {
          controller: technicalTriageController,
          handler: () => technicalTriageController.load(params)
        },
        committeeApproval: {
          controller: committeeApprovalController,
          handler: () => committeeApprovalController.load(params)
        },
        requesterProposalApproval: {
          controller: requesterProposalApprovalController,
          handler: () => requesterProposalApprovalController.load(params)
        }
      };

      const route = routes[page];
      await this.destroyCurrentController();

      if (!route) {
        this.showNotFound();
        return;
      }

      this._currentController = route.controller;
      await Promise.resolve(route.handler());
    } catch (error) {
      console.error('Router error:', error);
      this.showError('An unexpected error occurred.');
    } finally {
      loading.hide();
      this._isRouting = false;
    }
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
