const dashboardController = {
  _eventNamespace: '.dashboard',

  load: function () {
    const container = $('#page-container');

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.bindEvents();
      })
      .fail((error) => {
        console.error('Dashboard template load error:', error);
        container.html('<div class="p-6 text-red-600">Failed to load dashboard.</div>');
      });
  },

  destroy: function () {
    this.unbindEvents();
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-dashboard.html`;
  },

  bindEvents: function () {
    const container = $('#page-container');
    this.unbindEvents();

    container.on(`click${this._eventNamespace}`, 'a[href="nova-solicitacao.html"]', (event) => {
      event.preventDefault();
      location.hash = '#newSolicitation';
    });
  },

  unbindEvents: function () {
    $('#page-container').off(this._eventNamespace);
  }
};
