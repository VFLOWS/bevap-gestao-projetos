(function (window, $) {
  if (!window || !$) return;

  const MODAL_ID = 'gp-action-feedback-modal';

  function asText(value) {
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  }

  function fixMojibake(value) {
    let text = asText(value);
    if (!text) return '';

    const pairs = [
      ['\u00c3\u00a7', '\u00e7'], ['\u00c3\u0087', '\u00c7'],
      ['\u00c3\u00a3', '\u00e3'], ['\u00c3\u0095', '\u00d5'],
      ['\u00c3\u00b5', '\u00f5'], ['\u00c3\u0095', '\u00d5'],
      ['\u00c3\u00a1', '\u00e1'], ['\u00c3\u0081', '\u00c1'],
      ['\u00c3\u00a0', '\u00e0'], ['\u00c3\u0080', '\u00c0'],
      ['\u00c3\u00a2', '\u00e2'], ['\u00c3\u0082', '\u00c2'],
      ['\u00c3\u00a9', '\u00e9'], ['\u00c3\u0089', '\u00c9'],
      ['\u00c3\u00aa', '\u00ea'], ['\u00c3\u008a', '\u00ca'],
      ['\u00c3\u00ad', '\u00ed'], ['\u00c3\u008d', '\u00cd'],
      ['\u00c3\u00b3', '\u00f3'], ['\u00c3\u0093', '\u00d3'],
      ['\u00c3\u00ba', '\u00fa'], ['\u00c3\u009a', '\u00da'],
      ['\u00c3\u00bc', '\u00fc'], ['\u00c2\u00ba', '\u00ba'],
      ['\u00c2\u00aa', '\u00aa'], ['\u00e2\u0080\u0093', '-'],
      ['\u00e2\u0080\u0094', '-']
    ];

    pairs.forEach((pair) => {
      text = text.split(pair[0]).join(pair[1]);
    });

    return text;
  }

  function getContext(controller, options) {
    const state = controller && controller._state ? controller._state : {};
    return {
      documentId: asText(
        options && options.documentId
          ? options.documentId
          : state.documentId || controller && controller._currentDocumentId
      ),
      processInstanceId: asText(
        options && options.processInstanceId
          ? options.processInstanceId
          : state.processInstanceId || controller && controller._currentProcessInstanceId
      ),
      projectYear: asText(options && options.projectYear ? options.projectYear : state.projectYear)
    };
  }

  function buildProjectCode(context, options) {
    const explicitCode = asText(options && options.projectCode);
    if (explicitCode) return explicitCode;

    if (window.fluigService && typeof window.fluigService.buildProjectCode === 'function') {
      return window.fluigService.buildProjectCode(context.processInstanceId, context.projectYear);
    }

    return context.processInstanceId ? `PRJ-${context.processInstanceId}` : '';
  }

  function ensureModal() {
    let modal = $(`#${MODAL_ID}`);
    if (modal.length) return modal;

    modal = $(`
      <div id="${MODAL_ID}" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div id="gp-action-feedback-icon-wrap" class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i id="gp-action-feedback-icon" class="fa-solid text-white text-4xl"></i>
          </div>
          <h2 id="gp-action-feedback-title" class="text-3xl font-montserrat font-bold text-bevap-navy mb-3"></h2>
          <p id="gp-action-feedback-message" class="text-gray-600 mb-6"></p>

          <div id="gp-action-feedback-project-card" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
            <div class="flex items-center mb-2">
              <i class="fa-solid fa-hashtag text-bevap-green mr-2"></i>
              <span class="font-semibold text-sm text-gray-700">C&oacute;digo do Projeto</span>
            </div>
            <div id="gp-action-feedback-project-code" class="font-mono text-lg font-semibold text-bevap-navy">N/A</div>
          </div>

          <div id="gp-action-feedback-next-card" class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div class="flex items-center mb-2">
              <i class="fa-solid fa-circle-info text-bevap-gold mr-2"></i>
              <span class="font-semibold text-sm text-gray-700">Pr&oacute;ximo Passo</span>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <i class="fa-solid fa-arrow-right text-bevap-green mr-2"></i>
              <span id="gp-action-feedback-next-step"></span>
            </div>
          </div>

          <div id="gp-action-feedback-missing-card" class="hidden bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <ul id="gp-action-feedback-missing-list" class="list-disc list-inside text-sm text-red-700 space-y-1"></ul>
          </div>

          <div id="gp-action-feedback-success-actions" class="space-y-3">
            <button type="button" data-gp-feedback-action="view-request" class="w-full px-6 py-3 bg-bevap-green text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-md">
              <i class="fa-solid fa-eye mr-2"></i>
              Ver Solicita&ccedil;&atilde;o
            </button>
            <button type="button" data-gp-feedback-action="go-home" class="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all">
              Voltar ao In&iacute;cio
            </button>
          </div>

          <button id="gp-action-feedback-close-action" type="button" data-gp-feedback-action="close" class="hidden w-full px-6 py-3 bg-bevap-green text-white rounded-lg font-medium hover:bg-green-700 transition-all">
            Entendi, vou corrigir
          </button>
        </div>
      </div>
    `);

    $('body').append(modal);

    modal.on('click', '[data-gp-feedback-action="close"]', () => {
      modal.addClass('hidden');
    });

    modal.on('click', '[data-gp-feedback-action="go-home"]', () => {
      modal.addClass('hidden');
      window.location.hash = '#dashboard';
    });

    modal.on('click', '[data-gp-feedback-action="view-request"]', () => {
      const primaryRoute = asText(modal.data('primaryRoute'));
      if (primaryRoute) {
        modal.addClass('hidden');
        window.location.hash = primaryRoute;
        return;
      }

      const documentId = asText(modal.data('documentId'));
      const processInstanceId = asText(modal.data('processInstanceId'));
      const params = new URLSearchParams();

      if (documentId) params.set('documentId', documentId);
      if (processInstanceId) params.set('processInstanceId', processInstanceId);

      modal.addClass('hidden');
      window.location.hash = params.toString()
        ? `#solicitationDetail?${params.toString()}`
        : '#dashboard';
    });

    return modal;
  }

  function configureSuccessActions(modal, options) {
    const finalOptions = options || {};
    const primaryButton = modal.find('[data-gp-feedback-action="view-request"]');
    const secondaryButton = modal.find('[data-gp-feedback-action="go-home"]');
    const primaryLabel = asText(finalOptions.primaryActionLabel) || 'Ver Solicita\u00e7\u00e3o';
    const secondaryLabel = asText(finalOptions.secondaryActionLabel) || 'Voltar ao In\u00edcio';
    const primaryRoute = asText(finalOptions.primaryRoute);
    const showPrimary = finalOptions.showPrimaryAction === undefined
      ? true
      : finalOptions.showPrimaryAction !== false;

    modal.data('primaryRoute', primaryRoute);
    primaryButton.toggleClass('hidden', !showPrimary);
    primaryButton.contents().filter(function () {
      return this.nodeType === 3;
    }).remove();
    primaryButton.append(document.createTextNode(' ' + fixMojibake(primaryLabel)));
    secondaryButton.text(fixMojibake(secondaryLabel));
  }

  function setVisual(modal, type) {
    const isError = type === 'error';
    const isWarning = type === 'warning';
    const wrap = modal.find('#gp-action-feedback-icon-wrap');
    const icon = modal.find('#gp-action-feedback-icon');

    wrap
      .removeClass('bg-bevap-green bg-red-600 bg-bevap-gold')
      .addClass(isError ? 'bg-red-600' : (isWarning ? 'bg-bevap-gold' : 'bg-bevap-green'));

    icon
      .removeClass('fa-check fa-triangle-exclamation fa-exclamation-circle')
      .addClass(isError ? 'fa-triangle-exclamation' : (isWarning ? 'fa-exclamation-circle' : 'fa-check'));
  }

  const NEXT_STEP_BY_DECISION = {
    'decisaoAvaliarProjeto:aprovado': 'Superior Imediato - Aprovar Projeto',
    'decisaoAvaliarProjeto:correcao': 'Solicitante - Corrigir Solicita\u00e7\u00e3o',
    'decisaoAvaliarProjeto:cancelado': 'Processo cancelado',

    'decisaoSuperiorImediato:aprovado': 'TI - Triagem T\u00e9cnica',
    'decisaoSuperiorImediato:correcao': 'Solicitante - Corrigir Solicita\u00e7\u00e3o',
    'decisaoSuperiorImediato:cancelado': 'Processo cancelado',

    'decisaoTIPC:aprovado': 'Solicitante - Aprovar Proposta',

    'decisaoPropostaSAP:aprovado': 'Gerente do Centro de Custo - Aprovar Custo Projeto',
    'decisaoPropostaSAP:correcao': 'TI - Triagem T\u00e9cnica',
    'decisaoPropostaSAP:cancelado': 'Processo cancelado',

    'decisaocomite1:aprovado': 'Iniciar Projeto - TOTVS FLUIG',
    'decisaocomite1:correcao': 'TI - Triagem T\u00e9cnica',
    'decisaocomite1:cancelado': 'Processo cancelado',

    'decisaoGCC:aprovado': 'Comite - Aprovar Custo Projeto',
    'decisaoGCC:correcao': 'TI - Triagem T\u00e9cnica',
    'decisaoGCC:reprovado': 'Processo cancelado',

    'decisaocomite2:aprovado': 'Compras - Realizar Contrata\u00e7\u00e3o',
    'decisaocomite2:correcao': 'TI - Triagem T\u00e9cnica',
    'decisaocomite2:cancelado': 'Processo cancelado',

    'decisaoCRC:aprovado': 'Iniciar Projeto - TOTVS FLUIG',
    'decisaoCRC:correcao': 'TI - Triagem T\u00e9cnica',

    'decisaoCorrecao:aprovado': 'TI - Avaliar Projeto',
    'decisaoCorrecao:cancelado': 'Processo cancelado'
  };

  function inferNextStep(decisionValue) {
    const decision = asText(decisionValue).toLowerCase();
    if (decision === 'correcao') return 'Corre\u00e7\u00e3o da solicita\u00e7\u00e3o';
    if (decision === 'cancelado' || decision === 'reprovado') return 'Processo cancelado';
    return 'Pr\u00f3xima etapa do fluxo';
  }

  function resolveNextStep(config, options) {
    const explicit = asText(options && options.nextStep) || asText(config && config.nextStep);
    if (explicit) return explicit;

    const decisionField = asText(config && config.decisionField);
    const decisionValue = asText(config && config.decisionValue).toLowerCase();
    const mapped = decisionField && decisionValue
      ? NEXT_STEP_BY_DECISION[`${decisionField}:${decisionValue}`]
      : '';

    return mapped || inferNextStep(decisionValue);
  }

  const api = {
    showSuccess: function (options) {
      const modal = ensureModal();
      const context = getContext(options && options.controller, options || {});
      const projectCode = buildProjectCode(context, options || {});
      const nextStep = fixMojibake(asText(options && options.nextStep) || 'Pr\u00f3xima etapa do fluxo');

      modal.data('documentId', context.documentId);
      modal.data('processInstanceId', context.processInstanceId);
      setVisual(modal, 'success');
      configureSuccessActions(modal, options || {});

      modal.find('#gp-action-feedback-title').text(fixMojibake(asText(options && options.title) || 'A\u00e7\u00e3o conclu\u00edda!'));
      modal.find('#gp-action-feedback-message').text(fixMojibake(asText(options && options.message) || 'A solicita\u00e7\u00e3o foi movimentada com sucesso.'));
      modal.find('#gp-action-feedback-project-code').text(projectCode || 'N/A');
      modal.find('#gp-action-feedback-next-step').text(nextStep);
      modal.find('#gp-action-feedback-project-card').toggleClass('hidden', !projectCode);
      modal.find('#gp-action-feedback-next-card').toggleClass('hidden', !nextStep);
      modal.find('#gp-action-feedback-missing-card').addClass('hidden');
      modal.find('#gp-action-feedback-success-actions').removeClass('hidden');
      modal.find('#gp-action-feedback-close-action').addClass('hidden');
      modal.removeClass('hidden');
    },

    showProcessSuccess: function (options) {
      const finalOptions = options || {};
      this.showSuccess(Object.assign({
        title: 'A\u00e7\u00e3o conclu\u00edda!',
        message: 'A movimenta\u00e7\u00e3o foi registrada com sucesso.',
        nextStep: 'Acompanhe a pr\u00f3xima etapa pelo dashboard.',
        showPrimaryAction: !!asText(finalOptions.primaryRoute),
        secondaryActionLabel: 'Voltar ao In\u00edcio'
      }, finalOptions));
    },

    showActionSuccess: function (controller, config, options) {
      const decisionValue = asText(config && config.decisionValue);
      const action = asText(config && (config.actionLabel || config.action || config.successMessage));
      const title = asText(options && options.title) || (decisionValue === 'correcao'
        ? 'Corre\u00e7\u00e3o solicitada!'
        : (decisionValue === 'cancelado' || decisionValue === 'reprovado' ? 'N\u00e3o continuidade registrada!' : 'A\u00e7\u00e3o conclu\u00edda!'));

      this.showSuccess(Object.assign({}, options || {}, {
        controller: controller,
        title: title,
        message: asText(options && options.message) || asText(config && config.successMessage) || (action ? `${action} registrada com sucesso.` : 'A solicita\u00e7\u00e3o foi movimentada com sucesso.'),
        nextStep: resolveNextStep(config, options)
      }));
    },

    showError: function (options) {
      const modal = ensureModal();
      const context = getContext(options && options.controller, options || {});

      modal.data('documentId', context.documentId);
      modal.data('processInstanceId', context.processInstanceId);
      setVisual(modal, 'error');

      modal.find('#gp-action-feedback-title').text(fixMojibake(asText(options && options.title) || 'Erro ao enviar'));
      modal.find('#gp-action-feedback-message').text(fixMojibake(asText(options && options.message) || 'N\u00e3o foi poss\u00edvel concluir a a\u00e7\u00e3o. Verifique os dados e tente novamente.'));
      modal.find('#gp-action-feedback-project-card').addClass('hidden');
      modal.find('#gp-action-feedback-next-card').addClass('hidden');
      modal.find('#gp-action-feedback-missing-card').addClass('hidden');
      modal.find('#gp-action-feedback-success-actions').addClass('hidden');
      modal.find('#gp-action-feedback-close-action').removeClass('hidden');
      modal.removeClass('hidden');
    },

    showValidation: function (options) {
      const modal = ensureModal();
      const context = getContext(options && options.controller, options || {});
      const fields = Array.isArray(options && options.missingFields) ? options.missingFields : [];
      const list = modal.find('#gp-action-feedback-missing-list');

      modal.data('documentId', context.documentId);
      modal.data('processInstanceId', context.processInstanceId);
      setVisual(modal, 'warning');

      list.empty();
      fields.map(fixMojibake).filter(Boolean).forEach((field) => {
        $('<li></li>').text(field).appendTo(list);
      });

      modal.find('#gp-action-feedback-title').text(fixMojibake(asText(options && options.title) || 'Campos obrigat\u00f3rios'));
      modal.find('#gp-action-feedback-message').text(fixMojibake(asText(options && options.message) || 'Preencha os campos obrigat\u00f3rios antes de continuar.'));
      modal.find('#gp-action-feedback-project-card').addClass('hidden');
      modal.find('#gp-action-feedback-next-card').addClass('hidden');
      modal.find('#gp-action-feedback-missing-card').toggleClass('hidden', !fields.length);
      modal.find('#gp-action-feedback-success-actions').addClass('hidden');
      modal.find('#gp-action-feedback-close-action').removeClass('hidden');
      modal.removeClass('hidden');
    },

    showLegacy: function (controller, title, message, type) {
      const finalType = asText(type) || 'info';
      if (finalType === 'error') {
        this.showError({ controller: controller, title: title, message: message });
        return true;
      }

      if (finalType === 'warning') {
        this.showValidation({
          controller: controller,
          title: title,
          message: message,
          missingFields: []
        });
        return true;
      }

      return false;
    }
  };

  window.gpActionFeedback = api;
})(window, window.jQuery);
