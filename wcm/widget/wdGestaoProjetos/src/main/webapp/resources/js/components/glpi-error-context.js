var gpGlpiErrorContext = {
  render: async function (options) {
    var config = options || {};
    var container = $('#page-container');
    var contextController = config.contextController || null;
    var contextLoaded = false;

    if (contextController && typeof contextController.load === 'function') {
      try {
        await Promise.resolve(contextController.load(this.buildContextParams(config)));
        contextLoaded = true;
      } catch (error) {
        console.error('[gpGlpiErrorContext] erro ao carregar tela de contexto:', error);
      }
    }

    if (!contextLoaded) {
      container.html(this.getFallbackContextHtml(config));
    }

    this.prepareReadonlyContext(container, config);

    try {
      var errorHtml = await $.get(config.errorTemplateUrl);
      this.appendErrorTreatment(container, errorHtml);
    } catch (error) {
      console.error('[gpGlpiErrorContext] erro ao carregar bloco de erro:', error);
      this.appendErrorTreatment(container, this.getErrorFallbackHtml());
    }

    return contextLoaded ? contextController : null;
  },

	  renderReadonlyView: async function (options) {
	    var config = options || {};
	    var container = $('#page-container');
	    var contextController = config.contextController || null;
	    var contextLoaded = false;

    this.destroyReadonlyTabsScroll(container);

    if (contextController && typeof contextController.load === 'function') {
      try {
        await Promise.resolve(contextController.load(this.buildReadonlyViewParams(config)));
        contextLoaded = true;
      } catch (error) {
        console.error('[gpGlpiErrorContext] erro ao carregar visualizacao do projeto:', error);
      }
    }

    if (!contextLoaded) {
      container.html(this.getReadonlyViewFallbackHtml(config));
	    }

	    this.prepareReadonlyViewContext(container, config);
	    return contextLoaded ? contextController : null;
	  },

  appendErrorTreatment: function (container, errorHtml) {
    var fragment = $('<div></div>').append($.parseHTML(errorHtml, document, true));
    var main = fragment.find('main').first();
    var footer = fragment.find('footer#footer').first();
    var toast = fragment.find('#toast').first();
    var panel = this.buildInlineErrorPanel(main.length ? main : fragment);
    var target = this.resolveContentTarget(container);

    if (!target.length) {
      target = container;
    }

    target.append(panel);

    if (footer.length) {
      footer.detach();
      container.append(footer);
    }

    if (toast.length) {
      toast.detach();
      container.append(toast);
    }
  },

  resolveContentTarget: function (container) {
    var contentSection = container.find('#content-section').first();
    if (contentSection.length) {
      return contentSection;
    }

    var wideContentColumn = container.find('[class]').filter(function () {
      return String(this.className || '').split(/\s+/).indexOf('lg:col-span-2') !== -1;
    }).first();

    if (wideContentColumn.length) {
      return wideContentColumn;
    }

    return container.find('main').first();
  },

  buildInlineErrorPanel: function (source) {
    var alert = source.children('.mb-6').first().detach();
    var originalCard = source.children('.bg-white').first();
    var panel = $('<div data-component="gp-glpi-error-treatment" class="bg-white rounded-lg shadow-md overflow-hidden mt-6"></div>');

    if (originalCard.length) {
      var header = originalCard.children('.border-b').first().detach();
      var body = originalCard.children('.p-6').first().detach();

      if (!body.length) {
        body = $('<div class="p-6 space-y-6"></div>');
        body.append(originalCard.children().detach());
      }

      if (alert.length) {
        alert.removeClass('mb-6').addClass('mb-0');
        body.prepend(alert);
      }

      panel.append(header);
      panel.append(body);
      return panel;
    }

    panel.append('<div class="p-6 space-y-6"></div>');
    panel.children('.p-6').first().append(source.children().detach());
    return panel;
  },

  buildContextParams: function (config) {
    var params = Object.assign({}, config.params || {});
    var activity = this.parseActivity(config.contextActivity);
    var label = this.asText(config.contextLabel);

    params.glpiErrorReadonlyContext = true;
    params.readOnly = true;

    if (activity !== null) {
      params.activity = activity;
      params.currentActivity = activity;
      params.currentState = activity;
      params.numState = activity;
      params.estadoProcesso = label ? activity + ' - ' + label : String(activity);
    }

    return params;
  },

  buildReadonlyViewParams: function (config) {
    var params = Object.assign({}, config.params || {});
    var activity = this.parseActivity(config.contextActivity);
    var label = this.asText(config.contextLabel);

    params.projectReadonlyView = true;
    params.readOnly = true;
    params.viewOnly = true;

    if (activity !== null) {
      params.activity = activity;
      params.currentActivity = activity;
      params.currentState = activity;
      params.numState = activity;
      params.estadoProcesso = label ? activity + ' - ' + label : String(activity);
    }

    return params;
  },

  prepareReadonlyContext: function (container, config) {
    var root = container.children();

    container.find('footer').remove();
    container.find('#toast, [data-component="toast"]').remove();

    this.freezeControls(root);
  },

	  prepareReadonlyViewContext: function (container, config) {
	    var root = container.children();

	    this.prepareReadonlyContext(container, config);
	    this.removeReadonlyViewCurrentContent(container, config || {});
	    this.removeReadonlyViewActions(root);
	    this.revealReadonlyStepContent(container, config || {});
	    this.ensureReadonlyTabsScroll(container);
	    this.activateFirstVisibleReadonlyPanel(container);
	    this.freezeControls(root);
	    this.insertReadonlyPhaseSwitcher(container, config || {});
	    this.bindReadonlyPhaseSwitcher(container);
	    this.bindReadonlyTabsScroll(container);
	    this.bindReadonlyLocalTabs(container);
	  },

  freezeControls: function (root) {
    var blockedActionPattern = /(save|salvar|submit|send|enviar|confirm|aprovar|approve|reject|reprovar|cancel|cancelar|start|iniciar|finish|finalizar|return|voltar|add|adicionar|remove|remover|delete|excluir|edit|editar|upload|attach|anexar|import|gerar|generate)/i;

    root.find('input, textarea').each(function () {
      var element = $(this);
      element.prop('readonly', true);
      element.prop('disabled', true);
      element.attr('tabindex', '-1');
      element.addClass('bg-gray-100 cursor-not-allowed');
    });

    root.find('select, button[type="submit"], input[type="file"], input[type="checkbox"], input[type="radio"]').each(function () {
      var element = $(this);
      element.prop('disabled', true);
      element.attr('tabindex', '-1');
      element.addClass('opacity-70 cursor-not-allowed');
    });

    root.find('[contenteditable="true"]').attr('contenteditable', 'false').addClass('bg-gray-100 cursor-not-allowed');
    root.find('.tag-input-filter-dropdown, .tag-input-options, .autocomplete-suggestions').remove();

    root.find('button, a, [role="button"]').each(function () {
      var element = $(this);
      var action = String(element.attr('data-action') || '');
      var isNavigation = element.is('[data-step-target], [data-tab], [data-phase-toggle], [data-milestone-toggle], [data-section-toggle]')
        || action === 'next-step'
        || action === 'prev-step'
        || action.indexOf('close-') === 0
        || action.indexOf('open-') === 0
        || String(element.attr('id') || '').indexOf('tabs-') !== -1;

      if (isNavigation) {
        return;
      }

      if (blockedActionPattern.test(action) || blockedActionPattern.test(element.text())) {
        element.prop('disabled', true);
        element.attr('aria-disabled', 'true');
        element.attr('tabindex', '-1');
        element.addClass('opacity-60 cursor-not-allowed pointer-events-none');
      }
    });

    root.find('form')
      .off('submit.gpGlpiReadonly')
      .on('submit.gpGlpiReadonly', function (event) {
        event.preventDefault();
        return false;
      });
  },

  removeReadonlyViewCurrentContent: function (container, config) {
    var self = this;
    var hiddenTabs = config.hiddenTabs || [];
    var hiddenSelectors = config.hiddenSelectors || [];
    var hiddenBlocks = config.hiddenBlocks || [];

    hiddenTabs.forEach(function (tabName) {
      self.removeReadonlyTab(container, tabName);
    });

    hiddenSelectors.forEach(function (selector) {
      if (!selector) return;
      container.find(selector).remove();
    });

    hiddenBlocks.forEach(function (selector) {
      if (!selector) return;
      container.find(selector).each(function () {
        var block = $(this).closest('[data-readonly-block], section, .rounded-lg.bg-white, .bg-white.rounded-lg').first();
        if (block.length) {
          block.remove();
          return;
        }

        $(this).remove();
      });
    });

    container.find('[id$="-modal"], [id^="modal-"], .modal').remove();
    container.find('.tab-notice-badge, [id$="-notice"], [id$="-arrow-notice"]').remove();
  },

  removeReadonlyTab: function (container, tabName) {
    var finalName = this.asText(tabName);
    if (!finalName) return;

    if (finalName.charAt(0) === '#') {
      container.find(finalName).remove();
      return;
    }

    var selectors = [
      '[data-tab="' + finalName + '"]',
      '[data-tab-panel="' + finalName + '"]',
      '#tab-' + finalName,
      '#tab-content-' + finalName,
      '#tab-execution-' + finalName,
      '#tab-content-execution-' + finalName,
      '#tab-requester-' + finalName,
      '#tab-content-requester-' + finalName,
      '#tab-ti-' + finalName,
      '#tab-content-ti-' + finalName,
      '#tab-delivery-' + finalName,
      '#tab-content-delivery-' + finalName,
      '#ep-' + finalName + '-tab',
      '#ep-' + finalName + '-content',
      '#ep-golive-' + finalName + '-tab',
      '#ep-golive-' + finalName + '-content',
      '#ep-closure-' + finalName + '-tab',
      '#ep-closure-' + finalName + '-content'
    ];

    selectors.forEach(function (selector) {
      container.find(selector).remove();
    });
  },

  removeReadonlyViewActions: function (root) {
    var self = this;

    root.find('button, a, label[for]').each(function () {
      var element = $(this);

      if (self.isReadonlyNavigationElement(element)) {
        return;
      }

      if (element.is('label[for]')) {
        var targetId = String(element.attr('for') || '');
        var target = targetId ? $('#' + targetId) : $();
        if (target.is('input[type="file"]')) {
          element.remove();
        }
        return;
      }

      if (element.is('button') || element.attr('data-action') || element.attr('onclick') || element.attr('href') === '#') {
        element.remove();
      }
    });

    root.find('input[type="file"]').remove();
    root.find('#dropzone, [id$="-dropzone"], [data-dropzone]').remove();
  },

  isReadonlyNavigationElement: function (element) {
    var id = String(element.attr('id') || '');

    return element.is('[data-tab], [data-tabs-scroll-arrow], [data-step-target], [data-phase-toggle], [data-milestone-toggle], [data-section-toggle]')
      || id.indexOf('tab-') === 0
      || id.indexOf('tabs-') !== -1
      || /-tab$/.test(id)
      || /-tabs-(left|right)-arrow$/.test(id)
      || /tabs-(left|right)-arrow$/.test(id);
  },

	  revealReadonlyStepContent: function (container, config) {
	    if (!config.showAllSteps) {
	      return;
	    }

    container.find('.step-content, [id^="step-"]').removeClass('hidden');
    container.find('#stepper, #current-step').remove();
    container.find('#prev-btn, #next-btn, [data-action="prev-step"], [data-action="next-step"]').remove();

    if (config.showAllDeliveryPanels) {
	      container.find('#tab-content-delivery-go-live, #tab-content-delivery-summary').removeClass('hidden');
	    }
	  },

	  insertReadonlyPhaseSwitcher: function (container, config) {
	    var phases = config.phaseNavigation && Array.isArray(config.phaseNavigation.phases)
	      ? config.phaseNavigation.phases.filter(function (phase) {
	        return phase && phase.url && (phase.available || phase.active);
	      })
	      : [];
	    var host = this.resolveReadonlyPhaseSwitcherHost(container);

	    container.find('[data-component="gp-readonly-phase-switcher"]').remove();

	    if (phases.length <= 1 || !host.length) {
	      return;
	    }

	    var html = [
	      '<div data-component="gp-readonly-phase-switcher" class="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">',
	      '  <div class="grid divide-x divide-gray-200" style="grid-template-columns: repeat(' + phases.length + ', minmax(0, 1fr));">',
	      phases.map(function (phase) {
	        var active = Boolean(phase.active);
	        var classes = active
	          ? 'bg-green-50 text-bevap-green'
	          : 'bg-white text-bevap-navy hover:bg-slate-50 hover:text-bevap-green';
	        var attrs = active
	          ? 'aria-disabled="false"'
	          : 'data-readonly-phase-target="' + this.escapeHtml(phase.url) + '"';

	        return [
	          '<button type="button" ' + attrs + ' class="flex min-w-0 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ' + classes + '">',
	          '  <i class="' + this.escapeHtml(phase.iconClass || 'fa-solid fa-layer-group') + ' text-xs"></i>',
	          '  <span class="truncate">' + this.escapeHtml(phase.label) + '</span>',
	          '</button>'
	        ].join('');
	      }, this).join(''),
	      '  </div>',
	      '</div>'
	    ].join('');

	    host.prepend(html);
	  },

	  resolveReadonlyPhaseSwitcherHost: function (container) {
	    var contentSection = container.find('#content-section').first();
	    if (contentSection.length) {
	      return contentSection;
	    }

	    var main = container.find('main').first();
	    var searchRoot = main.length ? main : container;
	    var wideContentColumn = searchRoot.find('[class]').filter(function () {
	      return String(this.className || '').split(/\s+/).indexOf('lg:col-span-2') !== -1;
	    }).first();

	    if (wideContentColumn.length) {
	      return wideContentColumn;
	    }

	    return main.length ? main : container;
	  },

	  bindReadonlyPhaseSwitcher: function (container) {
	    var finalContainer = container && container.length ? container : $('#page-container');
	    var ns = '.gpReadonlyPhaseSwitcher';

	    finalContainer.off(ns);
	    finalContainer.on('click' + ns, '[data-readonly-phase-target]', function (event) {
	      event.preventDefault();
	      var target = gpGlpiErrorContext.asText($(event.currentTarget).attr('data-readonly-phase-target'));
	      if (target) {
	        if (window.projectReadonlyViewController
	          && typeof window.projectReadonlyViewController.showCachedPhase === 'function'
	          && window.projectReadonlyViewController.showCachedPhase(target)) {
	          return;
	        }

	        if (window.projectReadonlyViewController
	          && typeof window.projectReadonlyViewController.loadPhaseOnDemand === 'function') {
	          window.projectReadonlyViewController.loadPhaseOnDemand(target);
	          return;
	        }

	        window.location.hash = target;
	      }
	    });
	  },

	  activateFirstVisibleReadonlyPanel: function (container) {
    var self = this;

    container.find('[data-component="tabs"]').each(function () {
      var root = $(this);
      var firstTab = root.find('[data-tab]').first();
      var tabName = firstTab.attr('data-tab');

      if (firstTab.length && tabName && typeof ui !== 'undefined' && ui.tabs) {
        ui.tabs.setActive(root, tabName, { hideNoticeOnOpen: false });
      }
    });

    this.getReadonlyTabGroups().forEach(function (group) {
      self.activateFirstVisibleReadonlyGroup(container, group);
    });
  },

  getReadonlyTabGroups: function () {
    return [
      {
        buttons: '[id^="tab-execution-"]',
        panels: '[id^="tab-content-execution-"]',
        tabPrefix: 'tab-execution-',
        panelPrefix: 'tab-content-execution-'
      },
      {
        buttons: '[id^="tab-requester-"]',
        panels: '[id^="tab-content-requester-"]',
        tabPrefix: 'tab-requester-',
        panelPrefix: 'tab-content-requester-'
      },
      {
        buttons: '[id^="tab-ti-"]',
        panels: '[id^="tab-content-ti-"]',
        tabPrefix: 'tab-ti-',
        panelPrefix: 'tab-content-ti-'
      },
      {
        buttons: '[id^="ep-golive-"][id$="-tab"]',
        panels: '[id^="ep-golive-"][id$="-content"]',
        tabPrefix: 'ep-golive-',
        panelPrefix: 'ep-golive-',
        tabSuffix: '-tab'
      },
      {
        buttons: '[id^="ep-closure-"][id$="-tab"]',
        panels: '[id^="ep-closure-"][id$="-content"]',
        tabPrefix: 'ep-closure-',
        panelPrefix: 'ep-closure-',
        tabSuffix: '-tab'
      },
      {
        buttons: '[id^="tab-delivery-"]',
        panels: '[id^="tab-content-delivery-"]',
        tabPrefix: 'tab-delivery-',
        panelPrefix: 'tab-content-delivery-'
      }
    ];
  },

  activateFirstVisibleReadonlyGroup: function (container, group) {
    var panels = container.find(group.panels);
    if (!panels.length) return;

    var visiblePanels = panels.filter(function () {
      return !$(this).hasClass('hidden');
    });

    if (visiblePanels.length) return;

    var firstPanel = panels.first();
    var panelId = String(firstPanel.attr('id') || '');
    var suffix = panelId;

    if (group.panelPrefix && panelId.indexOf(group.panelPrefix) === 0) {
      suffix = panelId.substring(group.panelPrefix.length);
    }

    panels.addClass('hidden');
    firstPanel.removeClass('hidden');

    container.find(group.buttons)
      .removeClass('border-bevap-green bg-green-50 text-bevap-green')
      .addClass('border-transparent text-gray-500 hover:text-gray-700');

    var buttonId = group.tabPrefix + suffix.replace(/-content$/, '') + (group.tabSuffix || '');
    var activeButton = container.find('#' + buttonId).first();

    if (activeButton.length) {
      activeButton
        .addClass('border-bevap-green bg-green-50 text-bevap-green')
        .removeClass('border-transparent text-gray-500 hover:text-gray-700');
    }
  },

  bindReadonlyLocalTabs: function (container) {
    var self = this;
    var finalContainer = container && container.length ? container : $('#page-container');
    var ns = '.gpReadonlyLocalTabs';
    var uiApi = typeof $ !== 'undefined' ? $(document).data('gpUiComponents') : null;

    finalContainer.off(ns);

    finalContainer.find('[data-component="tabs"]').each(function () {
      var root = $(this);
      var alreadyInitialized = Boolean(root.data('gpTabsNs'));
      if (!alreadyInitialized && uiApi && uiApi.tabs && typeof uiApi.tabs.init === 'function') {
        uiApi.tabs.init(root, { hideNoticeOnOpen: false });
      }
    });

    this.getReadonlyTabGroups().forEach(function (group) {
      finalContainer.on('click' + ns, group.buttons, function (event) {
        event.preventDefault();
        self.activateReadonlyGroupByButton(finalContainer, group, $(event.currentTarget));
      });
    });
  },

  activateReadonlyGroupByButton: function (container, group, button) {
    var finalButton = button && button.length ? button : $();
    var buttonId = String(finalButton.attr('id') || '');
    if (!buttonId) return;

    var suffix = buttonId;
    if (group.tabPrefix && suffix.indexOf(group.tabPrefix) === 0) {
      suffix = suffix.substring(group.tabPrefix.length);
    }

    if (group.tabSuffix && suffix.slice(-group.tabSuffix.length) === group.tabSuffix) {
      suffix = suffix.substring(0, suffix.length - group.tabSuffix.length);
    }

    var panelId = group.panelPrefix + suffix + (group.tabSuffix ? '-content' : '');
    var panel = container.find('#' + panelId).first();
    if (!panel.length) return;

    container.find(group.panels).addClass('hidden');
    panel.removeClass('hidden');

    container.find(group.buttons)
      .removeClass('border-bevap-green bg-green-50 text-bevap-green')
      .addClass('border-transparent text-gray-500 hover:text-gray-700');

    finalButton
      .addClass('border-bevap-green bg-green-50 text-bevap-green')
      .removeClass('border-transparent text-gray-500 hover:text-gray-700');
  },

  ensureReadonlyTabsScroll: function (container) {
    var self = this;

    container.find('[data-component="tabs"]').each(function () {
      var root = $(this);
      var scroller = root.find('[data-tabs-scroll]').first();

      if (!scroller.length) {
        var firstTab = root.find('[data-tab]').first();
        if (!firstTab.length) return;

        scroller = firstTab.parent();
        if (!scroller.length) return;

        scroller.attr('data-tabs-scroll', '');
      }

      scroller.addClass('flex overflow-x-auto scroll-smooth pr-14 pl-14 md:pl-0 md:pr-2');
      scroller.find('[data-tab]').addClass('whitespace-nowrap');

      var wrapper = scroller.parent();
      if (!wrapper.hasClass('relative')) {
        scroller.wrap('<div class="relative"></div>');
        wrapper = scroller.parent();
      }

      if (!root.find('[data-tabs-scroll-arrow="left"]').length) {
        wrapper.append(self.getReadonlyTabsScrollArrowHtml('left'));
      }

      if (!root.find('[data-tabs-scroll-arrow="right"]').length) {
        wrapper.append(self.getReadonlyTabsScrollArrowHtml('right'));
      }
    });
  },

  getReadonlyTabsScrollArrowHtml: function (direction) {
    var isLeft = direction === 'left';
    var sideClass = isLeft
      ? 'left-0 justify-start rounded-r-full rounded-l-md bg-gradient-to-r pl-2'
      : 'right-0 justify-end rounded-l-full rounded-r-md bg-gradient-to-l pr-2';
    var icon = isLeft ? 'left' : 'right';
    var label = isLeft ? 'Rolar abas para esquerda' : 'Rolar abas para direita';

    return [
      '<button type="button" data-tabs-scroll-arrow="' + direction + '" aria-label="' + label + '" class="absolute ' + sideClass + ' top-0 bottom-0 w-24 border-0 from-white via-white/80 to-transparent shadow-none text-bevap-navy opacity-0 pointer-events-none transition-opacity duration-300 flex items-center">',
      '  <span class="flex items-center gap-0 text-base leading-none">',
      '    <i class="fa-solid fa-chevron-' + icon + '"></i>',
      '    <i class="fa-solid fa-chevron-' + icon + '"></i>',
      '  </span>',
      '</button>'
    ].join('');
  },

	  bindReadonlyTabsScroll: function (container) {
	    var self = this;
	    var finalContainer = container && container.length ? container : $('#page-container');
	    var ns = '.gpReadonlyTabsScroll';

	    this.destroyReadonlyTabsScroll(finalContainer);

    finalContainer.on('click' + ns, '[data-tabs-scroll-arrow]', function (event) {
      event.preventDefault();

      var button = $(event.currentTarget);
      var root = button.closest('[data-component="tabs"]');
      var scroller = root.find('[data-tabs-scroll]').first();
      var el = scroller.get(0);
      var direction = String(button.attr('data-tabs-scroll-arrow') || '').trim();

      if (!el || !direction) return;

      var maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      var delta = Math.max(120, Math.floor(el.clientWidth * 0.8));
      var target = direction === 'left'
        ? Math.max(0, el.scrollLeft - delta)
        : Math.min(maxScroll, el.scrollLeft + delta);

      try {
        el.scrollTo({ left: target, behavior: 'smooth' });
      } catch (error) {
        el.scrollLeft = target;
      }

      window.setTimeout(function () {
        self.updateReadonlyTabsScrollArrows(root);
      }, 360);
    });

	    finalContainer.find('[data-tabs-scroll]').each(function () {
	      var scroller = $(this);
	      scroller.on('scroll' + ns, function () {
	        self.updateReadonlyTabsScrollArrows(scroller.closest('[data-component="tabs"]'));
	      });
	    });

	    this.getLegacyReadonlyScrollGroups(finalContainer).forEach(function (group) {
	      var scroller = group.scroller;
	      var el = scroller.get(0);
	      if (!el) return;

	      scroller.on('scroll' + ns, function () {
	        self.updateReadonlyLegacyScrollArrows(group);
	      });

	      group.left.on('click' + ns, function (event) {
	        event.preventDefault();
	        self.scrollReadonlyLegacyTabs(group, -1);
	      });

	      group.right.on('click' + ns, function (event) {
	        event.preventDefault();
	        self.scrollReadonlyLegacyTabs(group, 1);
	      });
	    });

	    $(window).on('resize' + ns, function () {
	      finalContainer.find('[data-component="tabs"]').each(function () {
	        self.updateReadonlyTabsScrollArrows($(this));
	      });

	      self.getLegacyReadonlyScrollGroups(finalContainer).forEach(function (group) {
	        self.updateReadonlyLegacyScrollArrows(group);
	      });
	    });

	    window.setTimeout(function () {
	      finalContainer.find('[data-component="tabs"]').each(function () {
	        self.updateReadonlyTabsScrollArrows($(this));
	      });

	      self.getLegacyReadonlyScrollGroups(finalContainer).forEach(function (group) {
	        self.updateReadonlyLegacyScrollArrows(group);
	      });
	    }, 0);
	  },

  getLegacyReadonlyScrollGroups: function (container) {
    var finalContainer = container && container.length ? container : $('#page-container');
    var definitions = [
      { scroller: '#execution-tabs-scroll', left: '#execution-tabs-left-arrow', right: '#execution-tabs-right-arrow' },
      { scroller: '#requester-panel-tabs-scroll', left: '#requester-panel-tabs-left-arrow', right: '#requester-panel-tabs-right-arrow' },
      { scroller: '#ti-panel-tabs-scroll', left: '#ti-panel-tabs-left-arrow', right: '#ti-panel-tabs-right-arrow' },
      { scroller: '#ep-closure-tabs-scroll', left: '#ep-closure-tabs-left-arrow', right: '#ep-closure-tabs-right-arrow' }
    ];

    return definitions.map(function (definition) {
      return {
        scroller: finalContainer.find(definition.scroller).first(),
        left: finalContainer.find(definition.left).first(),
        right: finalContainer.find(definition.right).first()
      };
    }).filter(function (group) {
      return group.scroller.length && group.left.length && group.right.length;
    });
  },

  scrollReadonlyLegacyTabs: function (group, direction) {
    var el = group && group.scroller ? group.scroller.get(0) : null;
    if (!el) return;

    var maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    var delta = Math.max(120, Math.floor(el.clientWidth * 0.8));
    var target = direction < 0
      ? Math.max(0, el.scrollLeft - delta)
      : Math.min(maxScroll, el.scrollLeft + delta);

    try {
      el.scrollTo({ left: target, behavior: 'smooth' });
    } catch (error) {
      el.scrollLeft = target;
    }

    var self = this;
    window.setTimeout(function () {
      self.updateReadonlyLegacyScrollArrows(group);
    }, 360);
  },

  updateReadonlyLegacyScrollArrows: function (group) {
    var el = group && group.scroller ? group.scroller.get(0) : null;
    if (!el || !group.left || !group.right) return;

    var maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    var hasOverflow = maxScroll > 2;
    var canScrollLeft = hasOverflow && el.scrollLeft > 2;
    var canScrollRight = hasOverflow && el.scrollLeft < maxScroll - 2;

    group.left
      .toggleClass('opacity-0 pointer-events-none', !canScrollLeft)
      .toggleClass('opacity-100 pointer-events-auto', canScrollLeft);

    group.right
      .toggleClass('opacity-0 pointer-events-none', !canScrollRight)
      .toggleClass('opacity-100 pointer-events-auto', canScrollRight);
  },

  updateReadonlyTabsScrollArrows: function (root) {
    var finalRoot = root && root.length ? root : $();
    var scroller = finalRoot.find('[data-tabs-scroll]').first();
    var el = scroller.get(0);
    var leftArrow = finalRoot.find('[data-tabs-scroll-arrow="left"]').first();
    var rightArrow = finalRoot.find('[data-tabs-scroll-arrow="right"]').first();

    if (!el || !leftArrow.length || !rightArrow.length) return;

    var maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    var hasOverflow = maxScroll > 2;
    var canScrollLeft = hasOverflow && el.scrollLeft > 2;
    var canScrollRight = hasOverflow && el.scrollLeft < maxScroll - 2;

    leftArrow
      .toggleClass('opacity-0 pointer-events-none', !canScrollLeft)
      .toggleClass('opacity-100 pointer-events-auto', canScrollLeft);

    rightArrow
      .toggleClass('opacity-0 pointer-events-none', !canScrollRight)
      .toggleClass('opacity-100 pointer-events-auto', canScrollRight);
  },

	  destroyReadonlyTabsScroll: function (container) {
	    var finalContainer = container && container.length ? container : $('#page-container');

	    finalContainer.off('.gpReadonlyTabsScroll');
	    finalContainer.find('[data-tabs-scroll], #execution-tabs-scroll, #requester-panel-tabs-scroll, #ti-panel-tabs-scroll, #ep-closure-tabs-scroll').off('.gpReadonlyTabsScroll');
	    finalContainer.find('#execution-tabs-left-arrow, #execution-tabs-right-arrow, #requester-panel-tabs-left-arrow, #requester-panel-tabs-right-arrow, #ti-panel-tabs-left-arrow, #ti-panel-tabs-right-arrow, #ep-closure-tabs-left-arrow, #ep-closure-tabs-right-arrow').off('.gpReadonlyTabsScroll');
	    $(window).off('resize.gpReadonlyTabsScroll');
	  },

  getReadonlyViewFallbackHtml: function (config) {
    var label = this.asText(config.contextLabel) || 'processo';
    return [
      '<main class="max-w-5xl mx-auto p-4 sm:p-6">',
      '  <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">',
      '    <div class="flex items-start gap-3">',
      '      <i class="fa-solid fa-triangle-exclamation mt-1"></i>',
      '      <div>',
      '        <p class="font-semibold">Não foi possível carregar a visualização.</p>',
      '        <p class="text-sm">A etapa de referencia seria ' + this.escapeHtml(label) + '.</p>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</main>'
    ].join('');
  },

  getFallbackContextHtml: function (config) {
    var label = this.asText(config.contextLabel) || 'etapa anterior';
    return [
      '<main class="max-w-5xl mx-auto p-4 sm:p-6">',
      '  <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">',
      '    <div class="flex items-start gap-3">',
      '      <i class="fa-solid fa-triangle-exclamation mt-1"></i>',
      '      <div>',
      '        <p class="font-semibold">Nao foi possivel carregar a tela de contexto.</p>',
      '        <p class="text-sm">A etapa de referencia seria ' + this.escapeHtml(label) + '. O tratamento do erro continua disponivel abaixo.</p>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</main>'
    ].join('');
  },

  getErrorFallbackHtml: function () {
    return [
      '<main>',
      '  <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">',
      '    <div class="flex items-start">',
      '      <i class="fa-solid fa-triangle-exclamation text-red-600 mt-0.5 mr-3"></i>',
      '      <div class="text-sm text-red-800">',
      '        <p class="font-medium mb-1">Tratamento de erro indisponivel</p>',
      '        <p>Nao foi possivel carregar o bloco de tratamento do erro.</p>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="bg-white rounded-lg shadow-md overflow-hidden">',
      '    <div class="border-b border-gray-200 bg-gray-50">',
      '      <nav class="flex">',
      '        <button type="button" class="px-6 py-4 text-sm font-medium border-b-2 border-red-500 text-red-700">',
      '          <i class="fa-solid fa-screwdriver-wrench mr-2"></i>Tratar Erro',
      '        </button>',
      '      </nav>',
      '    </div>',
      '    <div class="p-6 space-y-6">',
      '      <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">',
      '        Recarregue a pagina ou retorne ao dashboard para tentar abrir a pendencia novamente.',
      '      </div>',
      '    </div>',
      '  </div>',
      '</main>'
    ].join('');
  },

  resolveCurrentActivity: function (params) {
    var finalParams = params && typeof params === 'object' ? params : {};
    var values = [
      finalParams.activity,
      finalParams.currentActivity,
      finalParams.currentState,
      finalParams.numState,
      finalParams.state,
      finalParams.estadoProcesso,
      finalParams.processState
    ];

    for (var index = 0; index < values.length; index += 1) {
      var parsed = this.parseActivity(values[index]);
      if (parsed !== null) {
        return parsed;
      }
    }

    var rawHash = window && window.location ? String(window.location.hash || '') : '';
    var match = rawHash.match(/(?:activity|currentActivity|currentState|numState|state|estadoProcesso|processState)=([^&]+)/i);
    return match ? this.parseActivity(decodeURIComponent(match[1])) : null;
  },

  isForcedGlpiTestRow: function (row) {
    var source = row || {};
    var values = [
      source.forcarErroGLPI,
      source.forcarerroglpi,
      source.FORCARERROGLPI
    ];

    for (var index = 0; index < values.length; index += 1) {
      if (this.asText(values[index]) === '1') {
        return true;
      }
    }

    return false;
  },

  getForcedGlpiTestMessage: function () {
    return 'Erro GLPI forcado para teste (forcarErroGLPI=1).';
  },

  parseActivity: function (value) {
    var text = this.asText(value);
    if (!text) {
      return null;
    }

    var matchDash = text.match(/^\s*(\d+)\s*-/);
    var matchAny = matchDash || text.match(/(\d+)/);
    if (!matchAny || !matchAny[1]) {
      return null;
    }

    var parsed = parseInt(matchAny[1], 10);
    return isNaN(parsed) ? null : parsed;
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

    return String(value).trim();
  },

  escapeHtml: function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

var projectReadonlyViewController = {
  _state: {
    contextController: null,
    phaseViewCache: {},
    phaseDatasetCache: {},
    phaseDatasetPromises: {},
    originalGetDatasetRows: null,
    phaseNavigation: null,
    activePhaseUrl: '',
    preloadingPhases: false,
    loadingPhaseUrl: ''
  },

	  load: async function (params) {
	    this.destroy();

	    var finalParams = params && typeof params === 'object' ? params : {};
	    var config = this.resolveContextConfig(finalParams);

    if (!config || !config.controller) {
      $('#page-container').html(this.getUnavailableHtml(finalParams));
	      return;
	    }

	    var resolvedPhaseNavigation = await this.resolvePhaseNavigation(finalParams, config);
	    config.phaseNavigation = resolvedPhaseNavigation;
	    var initialPhase = this.resolveInitialPhase(resolvedPhaseNavigation);
	    if (initialPhase && initialPhase.url) {
	      finalParams = this.parseRouteParams(initialPhase.url);
	      config = this.resolveContextConfig(finalParams) || config;
	      config.phaseNavigation = this.clonePhaseNavigation(resolvedPhaseNavigation, initialPhase.type);
	    }

	    this._state.phaseNavigation = config.phaseNavigation || null;

	    this._state.contextController = await gpGlpiErrorContext.renderReadonlyView({
	      params: finalParams,
	      contextController: config.controller,
	      contextActivity: config.activity,
	      contextLabel: config.label,
	      processType: config.processType,
	      phaseNavigation: config.phaseNavigation,
	      currentActivity: gpGlpiErrorContext.resolveCurrentActivity(finalParams),
      hiddenTabs: config.hiddenTabs || [],
      hiddenSelectors: config.hiddenSelectors || [],
      hiddenBlocks: config.hiddenBlocks || [],
      showAllSteps: Boolean(config.showAllSteps),
      showAllDeliveryPanels: Boolean(config.showAllDeliveryPanels)
	    });
	    this.cacheRenderedActivePhase(config.phaseNavigation);
	  },

  destroy: function () {
    var contextController = this._state.contextController;

	    if (gpGlpiErrorContext && typeof gpGlpiErrorContext.destroyReadonlyTabsScroll === 'function') {
	      gpGlpiErrorContext.destroyReadonlyTabsScroll($('#page-container'));
	    }
	    $('#page-container').off('.gpReadonlyLocalTabs .gpReadonlyPhaseSwitcher');

	    this.destroyContextController(contextController);
	    this.restorePhaseDatasetCache();

	    this._state.contextController = null;
	    this._state.phaseViewCache = {};
	    this._state.phaseDatasetCache = {};
	    this._state.phaseDatasetPromises = {};
	    this._state.phaseNavigation = null;
	    this._state.activePhaseUrl = '';
	    this._state.preloadingPhases = false;
	    this._state.loadingPhaseUrl = '';
	  },

	  preloadPhaseViews: async function (params, config) {
	    var navigation = config && config.phaseNavigation;
	    var phases = navigation && Array.isArray(navigation.phases)
	      ? navigation.phases.filter(function (phase) { return phase && phase.available && phase.url; })
	      : [];
	    var activePhase = phases.filter(function (phase) { return phase.active; })[0] || phases[0];

	    if (!activePhase || !phases.length) {
	      return false;
	    }

	    this._state.phaseViewCache = {};
	    this._state.phaseDatasetCache = {};
	    this._state.phaseDatasetPromises = {};
	    this._state.preloadingPhases = true;
	    this.installPhaseDatasetCache();

	    try {
	      await this.prefetchPhaseDatasets(phases);

	      for (var index = 0; index < phases.length; index += 1) {
	        await this.renderPhaseToCache(phases[index], navigation);
	      }

	      this._state.preloadingPhases = false;
	      return this.showCachedPhase(activePhase.url, { updateHash: false });
	    } catch (error) {
	      this._state.preloadingPhases = false;
	      this._state.phaseViewCache = {};
	      console.error('[projectReadonlyView] Erro ao carregar fases em cache:', error);
	      return false;
	    }
	  },

	  installPhaseDatasetCache: function () {
	    var self = this;
	    if (typeof fluigService === 'undefined' || !fluigService.getDatasetRows || this._state.originalGetDatasetRows) {
	      return;
	    }

	    this._state.originalGetDatasetRows = fluigService.getDatasetRows;
	    fluigService.getDatasetRows = function (datasetId, options) {
	      return self.getCachedDatasetRows(datasetId, options || {});
	    };
	  },

	  restorePhaseDatasetCache: function () {
	    if (typeof fluigService === 'undefined' || !this._state.originalGetDatasetRows) {
	      return;
	    }

	    fluigService.getDatasetRows = this._state.originalGetDatasetRows;
	    this._state.originalGetDatasetRows = null;
	  },

	  getCachedDatasetRows: function (datasetId, options) {
	    var exactKey = this.buildDatasetCacheKey(datasetId, options || {});
	    var broadKey = this.buildDatasetCacheKey(datasetId, Object.assign({}, options || {}, {
	      fields: null,
	      sortFields: null
	    }));
	    var broadRows = this._state.phaseDatasetCache[broadKey];

	    if (this._state.phaseDatasetCache[exactKey]) {
	      return Promise.resolve(this.cloneRows(this._state.phaseDatasetCache[exactKey]));
	    }

	    if (broadRows && (!options.fields || !options.fields.length || !options.sortFields || !options.sortFields.length)) {
	      return Promise.resolve(this.projectRows(broadRows, options.fields));
	    }

	    if (this._state.phaseDatasetPromises[exactKey]) {
	      return this._state.phaseDatasetPromises[exactKey].then(function (rows) {
	        return rows;
	      });
	    }

	    return this.fetchAndCacheDatasetRows(datasetId, options || {});
	  },

	  fetchAndCacheDatasetRows: function (datasetId, options) {
	    var self = this;
	    var exactKey = this.buildDatasetCacheKey(datasetId, options || {});
	    var broadKey = this.buildDatasetCacheKey(datasetId, Object.assign({}, options || {}, {
	      fields: null,
	      sortFields: null
	    }));
	    var fetcher = this._state.originalGetDatasetRows || (typeof fluigService !== 'undefined' && fluigService.getDatasetRows);

	    if (!fetcher) {
	      return Promise.resolve([]);
	    }

	    var promise = Promise.resolve(fetcher.call(fluigService, datasetId, options || {}))
	      .then(function (rows) {
	        var finalRows = Array.isArray(rows) ? rows : [];
	        self._state.phaseDatasetCache[exactKey] = self.cloneRows(finalRows);

	        if (!options.fields || !options.fields.length) {
	          self._state.phaseDatasetCache[broadKey] = self.cloneRows(finalRows);
	        }

	        return self.cloneRows(finalRows);
	      })
	      .finally(function () {
	        delete self._state.phaseDatasetPromises[exactKey];
	      });

	    this._state.phaseDatasetPromises[exactKey] = promise;
	    return promise;
	  },

	  prefetchPhaseDatasets: async function (phases) {
	    var self = this;
	    var requests = [];
	    var seen = {};

	    (phases || []).forEach(function (phase) {
	      var phaseUrl = self.normalizePhaseCacheKey(phase && phase.url);
	      var phaseParams = self.parseRouteParams(phaseUrl);
	      var datasetId = gpGlpiErrorContext.asText(phaseParams.datasetId);
	      var documentId = gpGlpiErrorContext.asText(phaseParams.documentId || phaseParams.documentid);

	      if (!datasetId || !documentId) {
	        return;
	      }

	      var key = self.buildDatasetCacheKey(datasetId, {
	        filters: { documentid: documentId }
	      });

	      if (seen[key]) {
	        return;
	      }

	      seen[key] = true;
	      requests.push(self.fetchAndCacheDatasetRows(datasetId, {
	        filters: { documentid: documentId }
	      }));
	    });

	    await Promise.all(requests);
	  },

	  buildDatasetCacheKey: function (datasetId, options) {
	    var finalOptions = options || {};
	    return [
	      gpGlpiErrorContext.asText(datasetId),
	      this.stableStringify(finalOptions.fields || null),
	      this.stableStringify(finalOptions.filters || null),
	      this.stableStringify(finalOptions.sortFields || null)
	    ].join('|');
	  },

	  stableStringify: function (value) {
	    if (value === null || value === undefined) {
	      return '';
	    }

	    if (Array.isArray(value)) {
	      return '[' + value.map((item) => this.stableStringify(item)).join(',') + ']';
	    }

	    if (typeof value === 'object') {
	      return '{' + Object.keys(value).sort().map((key) => {
	        return key + ':' + this.stableStringify(value[key]);
	      }).join(',') + '}';
	    }

	    return String(value);
	  },

	  cloneRows: function (rows) {
	    return (Array.isArray(rows) ? rows : []).map(function (row) {
	      return row && typeof row === 'object' ? Object.assign({}, row) : row;
	    });
	  },

	  projectRows: function (rows, fields) {
	    var finalRows = this.cloneRows(rows);
	    if (!Array.isArray(fields) || !fields.length) {
	      return Promise.resolve(finalRows);
	    }

	    return Promise.resolve(finalRows.map(function (row) {
	      var projected = {};
	      fields.forEach(function (field) {
	        projected[field] = row ? row[field] : undefined;
	      });
	      return projected;
	    }));
	  },

	  renderPhaseToCache: async function (phase, navigation) {
	    var phaseUrl = this.normalizePhaseCacheKey(phase && phase.url);
	    var phaseParams = this.parseRouteParams(phaseUrl);
	    var phaseConfig = this.resolveContextConfig(phaseParams);
	    var contextController = null;

	    if (!phaseUrl || !phaseConfig || !phaseConfig.controller) {
	      return;
	    }

	    phaseConfig.phaseNavigation = this.clonePhaseNavigation(navigation, phase.type);

	    contextController = await gpGlpiErrorContext.renderReadonlyView({
	      params: phaseParams,
	      contextController: phaseConfig.controller,
	      contextActivity: phaseConfig.activity,
	      contextLabel: phaseConfig.label,
	      processType: phaseConfig.processType,
	      phaseNavigation: phaseConfig.phaseNavigation,
	      currentActivity: gpGlpiErrorContext.resolveCurrentActivity(phaseParams),
	      hiddenTabs: phaseConfig.hiddenTabs || [],
	      hiddenSelectors: phaseConfig.hiddenSelectors || [],
	      hiddenBlocks: phaseConfig.hiddenBlocks || [],
	      showAllSteps: Boolean(phaseConfig.showAllSteps),
	      showAllDeliveryPanels: Boolean(phaseConfig.showAllDeliveryPanels)
	    });

	    this._state.phaseViewCache[phaseUrl] = {
	      html: $('#page-container').html(),
	      phaseType: phase.type,
	      label: phase.label
	    };

	    this.destroyContextController(contextController);
	  },

	  showCachedPhase: function (target, options) {
	    if (this._state.preloadingPhases) {
	      return false;
	    }

	    var key = this.normalizePhaseCacheKey(target);
	    var cached = key ? this._state.phaseViewCache[key] : null;
	    var updateHash = !options || options.updateHash !== false;

	    if (!cached || !cached.html) {
	      return false;
	    }

	    $('#page-container').html(cached.html);
	    this._state.activePhaseUrl = key;
	    this._state.phaseNavigation = this.clonePhaseNavigation(this._state.phaseNavigation, cached.phaseType);
	    this.bindCachedReadonlyView();

	    if (updateHash && window.history && typeof window.history.replaceState === 'function') {
	      window.history.replaceState(null, document.title, '#' + key);
	    }

	    return true;
	  },

	  loadPhaseOnDemand: async function (target) {
	    var key = this.normalizePhaseCacheKey(target);
	    var phase = this.findPhaseByUrl(key);
	    var loader = null;

	    if (!key || !phase || !phase.available) {
	      window.location.hash = key || target;
	      return false;
	    }

	    if (this._state.loadingPhaseUrl === key) {
	      return false;
	    }

	    this.cacheRenderedActivePhase(this._state.phaseNavigation);
	    this._state.loadingPhaseUrl = key;
	    loader = this.showPhaseLoadingModal(phase);

	    try {
	      this.destroyContextController(this._state.contextController);
	      this._state.contextController = null;

	      await this.renderPhaseToCache(phase, this._state.phaseNavigation);
	      return this.showCachedPhase(key);
	    } catch (error) {
	      console.error('[projectReadonlyView] Erro ao carregar fase sob demanda:', error);
	      window.location.hash = key;
	      return false;
	    } finally {
	      this._state.loadingPhaseUrl = '';
	      if (loader && typeof loader.hide === 'function') {
	        loader.hide();
	      }
	    }
	  },

	  cacheRenderedActivePhase: function (navigation) {
	    var key = this.normalizePhaseCacheKey(this._state.activePhaseUrl);
	    var activePhase = key ? this.findPhaseByUrl(key) : this.getActivePhase(navigation || this._state.phaseNavigation);

	    if (!key && activePhase) {
	      key = this.normalizePhaseCacheKey(activePhase.url);
	    }

	    if (!key || !activePhase) {
	      return;
	    }

	    this._state.phaseViewCache[key] = {
	      html: $('#page-container').html(),
	      phaseType: activePhase.type,
	      label: activePhase.label
	    };
	    this._state.activePhaseUrl = key;
	  },

	  getActivePhase: function (navigation) {
	    var phases = navigation && Array.isArray(navigation.phases) ? navigation.phases : [];
	    return phases.filter(function (phase) { return phase && phase.active; })[0] || null;
	  },

	  resolveInitialPhase: function (navigation) {
	    var phases = navigation && Array.isArray(navigation.phases) ? navigation.phases : [];
	    var available = phases.filter(function (phase) {
	      return phase && phase.available && phase.url;
	    });
	    var preferredOrder = ['entrega', 'desenvolvimento', 'solicitacao'];

	    for (var index = 0; index < preferredOrder.length; index += 1) {
	      var preferred = available.filter(function (phase) {
	        return phase.type === preferredOrder[index];
	      })[0];

	      if (preferred) {
	        return preferred;
	      }
	    }

	    return this.getActivePhase(navigation);
	  },

	  findPhaseByUrl: function (target) {
	    var key = this.normalizePhaseCacheKey(target);
	    var phases = this._state.phaseNavigation && Array.isArray(this._state.phaseNavigation.phases)
	      ? this._state.phaseNavigation.phases
	      : [];

	    return phases.filter((phase) => this.normalizePhaseCacheKey(phase && phase.url) === key)[0] || null;
	  },

	  showPhaseLoadingModal: function (phase) {
	    var message = this.getPhaseLoadingMessage(phase);

	    if (typeof modalLoadingService !== 'undefined' && modalLoadingService && typeof modalLoadingService.show === 'function') {
	      return modalLoadingService.show({
	        title: message,
	        message: 'Aguarde enquanto os dados do projeto são carregados.'
	      });
	    }

	    $('#page-container').append(
	      '<div data-component="readonly-phase-loading" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">' +
	      '  <div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">' +
	      '    <div class="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-bevap-green"></div>' +
	      '    <h3 class="text-xl font-montserrat font-bold text-bevap-navy">' + gpGlpiErrorContext.escapeHtml(message) + '</h3>' +
	      '  </div>' +
	      '</div>'
	    );

	    return {
	      hide: function () {
	        $('[data-component="readonly-phase-loading"]').remove();
	      }
	    };
	  },

	  getPhaseLoadingMessage: function (phase) {
	    var type = gpGlpiErrorContext.asText(phase && phase.type);

	    if (type === 'desenvolvimento') {
	      return 'Carregando Informações da Execução';
	    }

	    if (type === 'entrega') {
	      return 'Carregando Informações do Go-Live';
	    }

	    return 'Carregando Informações da Análise';
	  },

	  bindCachedReadonlyView: function () {
	    var container = $('#page-container');

	    gpGlpiErrorContext.bindReadonlyPhaseSwitcher(container);
	    gpGlpiErrorContext.bindReadonlyTabsScroll(container);

	    if (typeof gpGlpiErrorContext.bindReadonlyLocalTabs === 'function') {
	      gpGlpiErrorContext.bindReadonlyLocalTabs(container);
	    }
	  },

	  destroyContextController: function (contextController) {
	    if (contextController && typeof contextController.destroy === 'function') {
	      try {
	        contextController.destroy();
	      } catch (error) {
	        console.error('[projectReadonlyView] Context destroy error:', error);
	      }
	    }
	  },

	  normalizePhaseCacheKey: function (target) {
	    var text = gpGlpiErrorContext.asText(target);
	    return text.charAt(0) === '#' ? text.substring(1) : text;
	  },

	  parseRouteParams: function (route) {
	    var text = this.normalizePhaseCacheKey(route);
	    var queryIndex = text.indexOf('?');
	    var query = queryIndex >= 0 ? text.substring(queryIndex + 1) : '';
	    var params = {};

	    if (!query) {
	      return params;
	    }

	    new URLSearchParams(query).forEach(function (value, key) {
	      params[key] = value;
	    });

	    return params;
	  },

	  clonePhaseNavigation: function (navigation, activeType) {
	    var source = navigation && Array.isArray(navigation.phases) ? navigation.phases : [];

	    return {
	      scope: navigation ? navigation.scope : '',
	      phases: source.map(function (phase) {
	        return Object.assign({}, phase, {
	          active: phase.type === activeType
	        });
	      })
	    };
	  },

	  resolveContextConfig: function (params) {
	    var processType = this.detectProcessType(params.processType || params.processName);
	    var activity = gpGlpiErrorContext.parseActivity(params.activity || params.estadoProcesso || params.processState);
    if (activity === null && typeof fluigService !== 'undefined' && fluigService.resolveProjectProcessActivity) {
      activity = fluigService.resolveProjectProcessActivity(
        processType,
        params.estadoProcesso || params.processState,
        params.statusValue || params.STATUS || params.status
      );
    }
    var label = this.getActivityLabel(processType, activity, params.estadoProcesso || params.processState);
    var map = this.getContextMap(processType);
    var config = activity !== null && map[activity] ? Object.assign({}, map[activity]) : null;

    if (!config) {
      config = this.getFallbackContextConfig(processType, activity);
    }

    if (!config) {
      return null;
    }

    config.processType = processType;
    config.activity = config.activity === undefined ? activity : config.activity;
	    config.label = config.label || label;
	    return config;
	  },

	  resolvePhaseNavigation: async function (params, config) {
	    var currentProcessType = this.detectProcessType(config && config.processType);
	    var phaseScope = this.resolvePhaseScope(params, currentProcessType);
	    var phaseTypes = this.getPhaseTypesForScope(phaseScope);

	    if (phaseTypes.length <= 1) {
	      return null;
	    }

	    var currentRow = await this.resolveReadonlyPhaseRow(currentProcessType, {
	      documentId: params.documentId || params.documentid,
	      processInstanceId: params.processInstanceId || params.processinstanceid,
	      projectCode: params.phaseProjectCode,
	      projectTitle: params.phaseProjectTitle
	    });
	    var projectCode = gpGlpiErrorContext.asText(params.phaseProjectCode || (currentRow && currentRow.codigoglpi));
	    var projectTitle = gpGlpiErrorContext.asText(params.phaseProjectTitle || (currentRow && currentRow.titulodoprojetoNS));
	    var self = this;
	    var phaseRows = await Promise.all(phaseTypes.map(function (phaseType) {
	      if (phaseType === currentProcessType) {
	        return Promise.resolve(currentRow);
	      }

	      return self.resolveReadonlyPhaseRow(phaseType, {
	        projectCode: projectCode,
	        projectTitle: projectTitle
	      });
	    }));

	    var phases = phaseTypes.map(function (phaseType, index) {
	      return self.buildReadonlyPhaseItem({
	        phaseType: phaseType,
	        row: phaseRows[index],
	        active: phaseType === currentProcessType,
	        phaseScope: phaseScope,
	        projectCode: projectCode,
	        projectTitle: projectTitle
	      });
	    });

	    return {
	      scope: phaseScope,
	      phases: phases
	    };
	  },

	  resolvePhaseScope: function (params, processType) {
	    var explicitScope = this.detectProcessType(params && (params.maxPhase || params.phaseMax || params.phaseScope || params.phaseOrigin));
	    if (explicitScope === 'entrega' || explicitScope === 'desenvolvimento' || explicitScope === 'solicitacao') {
	      return explicitScope;
	    }

	    if (processType === 'entrega' || processType === 'desenvolvimento' || processType === 'solicitacao') {
	      return processType;
	    }

	    return '';
	  },

	  getPhaseTypesForScope: function (scope) {
	    var orderedTypes = ['solicitacao', 'desenvolvimento', 'entrega'];
	    var scopeIndex = orderedTypes.indexOf(scope);

	    return scopeIndex >= 0 ? orderedTypes.slice(0, scopeIndex + 1) : [];
	  },

	  resolveReadonlyPhaseRow: async function (processType, options) {
	    var definition = typeof fluigService !== 'undefined' && fluigService.getProjectProcessDefinition
	      ? fluigService.getProjectProcessDefinition(processType)
	      : null;
	    var finalOptions = options || {};
	    var fields = ['documentid', 'NUM_PROCES', 'estadoProcesso', 'STATUS', 'codigoglpi', 'titulodoprojetoNS'];
	    var rows = [];

	    if (!definition || !definition.datasetId || typeof fluigService === 'undefined' || !fluigService.getDatasetRows) {
	      return null;
	    }

	    if (gpGlpiErrorContext.asText(finalOptions.documentId)) {
	      rows = await this.fetchReadonlyPhaseRows(definition.datasetId, fields, {
	        documentid: gpGlpiErrorContext.asText(finalOptions.documentId)
	      });
	    }

	    if ((!rows || !rows.length) && gpGlpiErrorContext.asText(finalOptions.processInstanceId)) {
	      rows = await this.fetchReadonlyPhaseRows(definition.datasetId, fields, {
	        NUM_PROCES: gpGlpiErrorContext.asText(finalOptions.processInstanceId)
	      });
	    }

	    if ((!rows || !rows.length) && gpGlpiErrorContext.asText(finalOptions.projectCode)) {
	      rows = await this.fetchReadonlyPhaseRows(definition.datasetId, fields, {
	        codigoglpi: gpGlpiErrorContext.asText(finalOptions.projectCode)
	      });
	    }

	    if ((!rows || !rows.length) && gpGlpiErrorContext.asText(finalOptions.projectTitle)) {
	      rows = await this.fetchReadonlyPhaseRows(definition.datasetId, fields, {
	        titulodoprojetoNS: gpGlpiErrorContext.asText(finalOptions.projectTitle)
	      });
	    }

	    return rows && rows.length ? rows[0] : null;
	  },

	  fetchReadonlyPhaseRows: async function (datasetId, fields, filters) {
	    try {
	      return await fluigService.getDatasetRows(datasetId, {
	        fields: fields,
	        filters: filters,
	        sortFields: ['documentid desc']
	      });
	    } catch (error) {
	      console.warn('[projectReadonlyView] Nao foi possivel resolver fase readonly:', datasetId, filters, error);
	      return [];
	    }
	  },

	  buildReadonlyPhaseItem: function (options) {
	    var phaseType = options.phaseType;
	    var row = options.row || null;
	    var processContext = row && typeof fluigService !== 'undefined' && fluigService.buildProjectProcessContext
	      ? fluigService.buildProjectProcessContext(phaseType, row)
	      : null;
	    var activity = processContext ? processContext.activity : null;
	    var statusValue = row ? gpGlpiErrorContext.asText(row.STATUS || row.status) : '';
	    var params = new URLSearchParams();

	    if (phaseType === 'solicitacao' && gpGlpiErrorContext.asText(options.phaseScope)) {
	      activity = 72;
	    }

	    if (row) {
	      params.set('documentId', gpGlpiErrorContext.asText(row.documentid));
	      params.set('processInstanceId', gpGlpiErrorContext.asText(row.NUM_PROCES));
	      params.set('estadoProcesso', gpGlpiErrorContext.asText(row.estadoProcesso));
	      if (activity !== null && activity !== undefined) {
	        params.set('activity', String(activity));
	      }
	      params.set('processType', phaseType);
	      params.set('processName', processContext ? processContext.processName : '');
	      params.set('datasetId', processContext ? processContext.datasetId : '');
	      params.set('formName', processContext ? processContext.formName : '');
	      params.set('statusValue', statusValue);
	      params.set('viewOnly', '1');
	      params.set('phaseScope', options.phaseScope);
	      params.set('maxPhase', options.phaseScope);
	      if (gpGlpiErrorContext.asText(options.projectCode)) {
	        params.set('phaseProjectCode', gpGlpiErrorContext.asText(options.projectCode));
	      }
	      if (gpGlpiErrorContext.asText(options.projectTitle)) {
	        params.set('phaseProjectTitle', gpGlpiErrorContext.asText(options.projectTitle));
	      }
	    }

	    return {
	      type: phaseType,
	      label: this.getPhaseLabel(phaseType),
	      iconClass: this.getPhaseIcon(phaseType),
	      active: Boolean(options.active),
	      available: Boolean(row),
	      url: row ? 'projectReadonlyView?' + params.toString() : ''
	    };
	  },

	  getPhaseLabel: function (phaseType) {
	    if (phaseType === 'desenvolvimento') return 'Execução';
	    if (phaseType === 'entrega') return 'Go-Live';
	    return 'Análise';
	  },

	  getPhaseIcon: function (phaseType) {
	    if (phaseType === 'desenvolvimento') return 'fa-solid fa-spinner';
	    if (phaseType === 'entrega') return 'fa-solid fa-rocket';
	    return 'fa-solid fa-magnifying-glass-chart';
	  },

	  getContextMap: function (processType) {
    if (processType === 'desenvolvimento') {
      return {
        0: { controller: projectPlanningController, activity: 14, label: 'Planejamento do Projeto', showAllSteps: true },
        4: { controller: projectPlanningController, activity: 14, label: 'Planejamento do Projeto', showAllSteps: true },
        14: { controller: projectPlanningController, activity: 14, label: 'Planejamento do Projeto', showAllSteps: true },
        18: { controller: projectExecutionController, activity: 18, label: 'Execucao do Projeto' },
        23: { controller: projectRequesterValidationController, activity: 23, label: 'Validacao do Solicitante', hiddenTabs: ['checklist'], hiddenBlocks: ['#validation-feedback-text'] },
        32: { controller: projectTiValidationController, activity: 32, label: 'Validacao TI', hiddenTabs: ['checklist'], hiddenBlocks: ['#validation-feedback-text'] },
        38: { controller: projectFinalController, activity: 38, label: 'Execucao de Projeto Finalizada' },
        46: { controller: projectPlanningController, activity: 14, label: 'Planejamento do Projeto', showAllSteps: true },
        47: { controller: projectPlanningController, activity: 14, label: 'Planejamento do Projeto', showAllSteps: true },
        52: { controller: projectTiValidationController, activity: 32, label: 'Validacao TI' },
        56: { controller: projectFinalController, activity: 38, label: 'Execucao de Projeto Finalizada' },
        72: { controller: projectFinalController, activity: 38, label: 'Execucao de Projeto Finalizada' }
      };
    }

    if (processType === 'execucaoFases') {
      return {
        12: { controller: executionActivityWaitingController, activity: 14, label: 'Aguardando Execucao da Atividade' },
        14: { controller: executionActivityWaitingController, activity: 14, label: 'Aguardando Execucao da Atividade' },
        18: { controller: executionActivityController, activity: 18, label: 'Execucao da Atividade' },
        23: { controller: executionActivityRequesterValidationController, activity: 23, label: 'Validacao do Solicitante', hiddenTabs: ['checklist'], hiddenBlocks: ['#requester-feedback-text'] },
        32: { controller: executionActivityTiValidationController, activity: 32, label: 'Validacao TI', hiddenTabs: ['checklist'], hiddenBlocks: ['#ti-feedback-text'] },
        36: { controller: executionActivityTiValidationController, activity: 32, label: 'Validacao TI' },
        41: { controller: executionActivityTiValidationController, activity: 32, label: 'Atividade Finalizada' },
        46: { controller: executionActivityWaitingController, activity: 14, label: 'Aguardando Execucao da Atividade' },
        52: { controller: executionActivityTiValidationController, activity: 32, label: 'Validacao TI' }
      };
    }

    if (processType === 'entrega') {
      return {
        12: { controller: epDeliveryPlanningController, activity: 18, label: 'Planejamento da Entrega', showAllSteps: true, showAllDeliveryPanels: true },
        14: { controller: epDeliveryPlanningController, activity: 18, label: 'Planejamento da Entrega', showAllSteps: true, showAllDeliveryPanels: true },
        18: { controller: epDeliveryPlanningController, activity: 18, label: 'Planejamento da Entrega', showAllSteps: true, showAllDeliveryPanels: true },
        22: { controller: epUserTrainingController, activity: 22, label: 'Treinamento dos Usuarios' },
        27: { controller: epFinalGoLiveValidationController, activity: 27, label: 'Validação Final GO Live', hiddenBlocks: ['#ep-final-opinion'] },
        35: { controller: epGoLiveExecutionController, activity: 35, label: 'GO Live em Producao', hiddenTabs: ['documents'], hiddenBlocks: ['#ep-golive-opinion'] },
        42: { controller: epRequesterGoLiveValidationController, activity: 42, label: 'Validacao do GO Live', hiddenBlocks: ['#ep-solic-opinion'] },
        46: { controller: epProjectClosureDocumentationController, activity: 46, label: 'Documentacao de Encerramento', hiddenBlocks: ['#ep-closure-opinion'] },
        50: { controller: epProjectClosureDocumentationController, activity: 46, label: 'Documentacao de Encerramento' },
        51: { controller: epProjectClosureDocumentationController, activity: 46, label: 'Documentacao de Encerramento' },
        56: { controller: epProjectClosureDocumentationController, activity: 46, label: 'Projeto Finalizado' }
      };
    }

    return {
      0: { controller: newSolicitationController, activity: 4, label: 'Solicitacao', showAllSteps: true },
      4: { controller: newSolicitationController, activity: 4, label: 'Solicitacao', showAllSteps: true },
      5: { controller: newSolicitationController, activity: 4, label: 'Solicitacao', showAllSteps: true },
      15: { controller: correctionController, activity: 15, label: 'Correcao do Solicitante', showAllSteps: true },
      19: { controller: immediateApprovalController, activity: 19, label: 'Aprovacao do Superior Imediato', hiddenTabs: ['impacto', 'checklist'] },
      26: { controller: technicalTriageController, activity: 26, label: 'Triagem Tecnica TI', hiddenTabs: ['decisao', 'checklist'] },
      28: { controller: technicalTriageController, activity: 26, label: 'Triagem Tecnica TI' },
      36: { controller: committeeApprovalController, activity: 36, label: 'Aprovacao Comite', hiddenTabs: ['business-case', 'risk-compliance', 'documents'] },
      38: { controller: commercialProposalController, activity: 38, label: 'Proposta Comercial', hiddenTabs: ['fornecedor', 'proposta', 'checklist'] },
      40: { controller: requesterProposalApprovalController, activity: 40, label: 'Aprovacao da Proposta pelo Solicitante' },
      54: { controller: gccCostApprovalController, activity: 54, label: 'Aprovacao GCC', hiddenTabs: ['financeiro'] },
      61: { controller: committeeCostApprovalController, activity: 61, label: 'Aprovacao de Custo pelo Comite', hiddenTabs: ['custo-orcamento'] },
      66: { controller: purchaseContractingController, activity: 66, label: 'Contratacao', hiddenTabs: ['contratacao', 'compliance', 'financeiro'] },
      72: { controller: solicitationDetailController, activity: 72, label: 'Solicitacao Finalizada' },
      74: { controller: technicalTriageController, activity: 26, label: 'Triagem Tecnica TI' }
    };
  },

  getFallbackContextConfig: function (processType, activity) {
    if (processType === 'desenvolvimento') {
      return { controller: projectPlanningController, activity: activity || 14, label: 'Desenvolvimento do Projeto', showAllSteps: true };
    }

    if (processType === 'execucaoFases') {
      return { controller: executionActivityWaitingController, activity: activity || 14, label: 'Execucao de Fases' };
    }

    if (processType === 'entrega') {
      return { controller: epDeliveryPlanningController, activity: activity || 18, label: 'Entrega do Projeto', showAllSteps: true, showAllDeliveryPanels: true };
    }

    return { controller: solicitationDetailController, activity: activity || 72, label: 'Solicitacao' };
  },

  detectProcessType: function (value) {
    if (typeof fluigService !== 'undefined' && fluigService.detectProjectProcessType) {
      return fluigService.detectProjectProcessType(value);
    }

    var text = gpGlpiErrorContext.asText(value).toLowerCase();
    if (text.indexOf('desenvolvimento') !== -1) return 'desenvolvimento';
    if (text.indexOf('execucao') !== -1 || text.indexOf('execu') !== -1) return 'execucaoFases';
    if (text.indexOf('entrega') !== -1) return 'entrega';
    return 'solicitacao';
  },

  getActivityLabel: function (processType, activity, fallback) {
    if (typeof fluigService !== 'undefined' && fluigService.getProjectProcessStateLabel) {
      return fluigService.getProjectProcessStateLabel({
        processType: processType,
        activity: activity,
        estadoProcesso: fallback
      });
    }

    return gpGlpiErrorContext.asText(fallback) || 'Visualização do Projeto';
  },

  getUnavailableHtml: function (params) {
    var documentId = gpGlpiErrorContext.asText(params && params.documentId);
    return [
      '<main class="max-w-5xl mx-auto p-4 sm:p-6">',
      '  <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">',
      '    <p class="font-semibold">Visualização indisponível.</p>',
      '    <p class="text-sm">Não foi possível identificar a tela de leitura para o projeto ' + gpGlpiErrorContext.escapeHtml(documentId || '-') + '.</p>',
      '  </div>',
      '</main>'
    ].join('');
  },

  getLoadingHtml: function () {
    return [
      '<main class="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">',
      '  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-md">',
      '    <div class="flex items-center gap-3 text-sm text-gray-600">',
      '      <i class="fa-solid fa-spinner fa-spin text-bevap-green"></i>',
      '      <span>Carregando visualizações do projeto...</span>',
      '    </div>',
      '  </div>',
      '</main>'
    ].join('');
  }
};

window.gpGlpiErrorContext = gpGlpiErrorContext;
window.projectReadonlyViewController = projectReadonlyViewController;
