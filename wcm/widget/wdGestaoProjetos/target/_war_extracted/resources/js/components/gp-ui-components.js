/**
 * gpUiComponents — Componentes reutilizáveis (SEM namespace em window)
 *
 * Objetivo:
 * - Centralizar componentes reutilizáveis (Tabs + Sidebar) em um único arquivo.
 * - Evitar criar `window.gpComponents` / `window.qualquerCoisa`.
 *
 * Como funciona (importante):
 * - Este arquivo registra a API em `$(document).data('gpUiComponents')`.
 * - Ou seja: NÃO existe `window.gpUiComponents` e NÃO existe `window.gpComponents`.
 * - Qualquer controller pode acessar a API via jQuery.
 *
 * Dependências:
 * - jQuery (já existe no widget)
 *
 * ------------------------------------------------------------
 * 0) Como obter a API no controller
 * ------------------------------------------------------------
 *
 * No seu controller, após o HTML do template já estar no DOM:
 *
 *   const ui = $(document).data('gpUiComponents');
 *   if (!ui) {
 *     console.warn('gpUiComponents não carregou (ver application.info)');
 *     return;
 *   }
 *
 * Observação:
 * - Garanta a ordem no `application.info`: este arquivo deve carregar ANTES
 *   dos controllers que vão usá-lo.
 *
 * ------------------------------------------------------------
 * 1) Tabs (Guias)
 * ------------------------------------------------------------
 *
 * Objetivo:
 * - Reutilizar o mesmo sistema de guias em múltiplas páginas.
 * - Sem framework: funciona com HTML + data-attributes + event delegation.
 *
 * Convenção de HTML:
 * - Um root com `data-component="tabs"`
 * - Botões/links com `data-tab="<nome>"`
 * - Painéis com `data-tab-panel="<nome>"`
 *
 * Exemplo mínimo (template HTML):
 *
 *   <div data-component="tabs" data-tabs-default="overview">
 *     <div class="border-b">
 *       <button data-tab="overview">Visão Geral</button>
 *       <button data-tab="details">Detalhes</button>
 *     </div>
 *
 *     <div data-tab-panel="overview">...</div>
 *     <div data-tab-panel="details" class="hidden">...</div>
 *   </div>
 *
 * API:
 * - ui.tabs.init(rootEl, options)
 * - ui.tabs.destroy(rootEl)
 * - ui.tabs.setActive(rootEl, tabName, options)
 *
 * init(rootEl, options):
 * - options.defaultTab: tab inicial (se omitido, usa `data-tabs-default` ou a 1ª tab)
 * - options.onChange(tabName): callback quando troca de guia
 * - options.hideNoticeOnOpen: se true, esconde `.tab-notice-badge` ao abrir (default: true)
 *
 * Regra da “bolinha de atenção” (protótipo):
 * - Se o botão da tab tiver um elemento `.tab-notice-badge` dentro dele,
 *   ao abrir a tab o componente adiciona a classe `hidden` nessa bolinha.
 * - Isso faz a bolinha sumir apenas na tab que foi aberta.
 *
 * Customização por atributos no root:
 * - data-tabs-default="<nome>"
 * - data-tabs-active-classes="<classes>" (default: "border-bevap-green text-bevap-green bg-green-50")
 * - data-tabs-inactive-classes="<classes>" (default: "border-transparent text-gray-500")
 * - data-tabs-hidden-class="<classe>" (default: "hidden")
 * - data-tabs-hide-notice-on-open="true|false" (default: true)
 *
 * Boa prática (lifecycle):
 * - Se o controller tem método `destroy()`, chame `ui.tabs.destroy(rootEl)` nele,
 *   para remover handlers (evita leak quando troca de rota).
 *
 * ------------------------------------------------------------
 * 2) Sidebar (cards)
 * ------------------------------------------------------------
 *
 * Atualmente expõe:
 * - ui.sidebar.renderProjectSummary(targetEl, data)
 * - ui.sidebar.renderProgress(targetEl, data)
 *
 * 2.1) Resumo do Projeto
 *
 * HTML (placeholder no template):
 *   <div data-component="project-summary"></div>
 *
 * JS (no controller, após inserir o HTML do template):
 *   const ui = $(document).data('gpUiComponents');
 *   const container = $('#page-container');
 *   const target = container.find('[data-component="project-summary"]').first();
 *
 *   ui.sidebar.renderProjectSummary(target, {
 *     code: 'PRJ-2024-001',
 *     title: 'Implantar SSO corporativo',
 *     requester: 'João Vieira',
 *     area: 'TI',
 *     sponsor: 'Diretoria TI',
 *     attachmentsCount: 2,
 *     priority: {
 *       label: 'Estratégico',
 *       iconClass: 'fa-solid fa-star',
 *       badgeClasses: 'bg-green-100 text-green-800'
 *     },
 *     status: {
 *       label: 'Em Análise',
 *       iconClass: 'fa-solid fa-clock',
 *       badgeClasses: 'bg-yellow-100 text-yellow-800'
 *     }
 *   });
 *
 * Eventos:
 * - O HTML gerado tem botões com `data-action="show-timeline"` e `data-action="show-attachments"`.
 * - Você trata esses cliques no seu controller (event delegation) no `#page-container`.
 *
 * 2.2) Progresso
 *
 * HTML (placeholder):
 *   <div data-component="progress-status"></div>
 *
 * JS:
 *   const target = container.find('[data-component="progress-status"]').first();
 *   ui.sidebar.renderProgress(target, {
 *     items: [
 *       { style: 'success', label: 'Solicitação completa' },
 *       { style: 'warning', label: 'Análise Técnica pendente' },
 *       { style: 'danger',  label: 'Bloqueado por dependência' }
 *     ]
 *   });
 *
 * Campos de item:
 * - style: 'success' | 'warning' | 'danger'
 * - label: texto
 * - iconClass (opcional): classe FontAwesome
 */

(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpUiComponents';
  const $doc = $(document);

  // Evita redefinir se já estiver registrado.
  if ($doc.data(KEY)) return;

  const tabs = {
    init: function (rootEl, options) {
      const $root = $(rootEl);
      if (!$root.length) return;

      const activeClasses = this._getAttr($root, 'data-tabs-active-classes')
        || 'border-bevap-green text-bevap-green bg-green-50';
      const inactiveClasses = this._getAttr($root, 'data-tabs-inactive-classes')
        || 'border-transparent text-gray-500';
      const hiddenClass = this._getAttr($root, 'data-tabs-hidden-class') || 'hidden';

      const defaultTab = (options && options.defaultTab)
        || (this._getAttr($root, 'data-tabs-default') || '');
      const onChange = options && typeof options.onChange === 'function' ? options.onChange : null;

      const hideNoticeOnOpen = (options && typeof options.hideNoticeOnOpen === 'boolean')
        ? options.hideNoticeOnOpen
        : this._getBoolAttr($root, 'data-tabs-hide-notice-on-open', true);

      this.destroy($root);

      const ns = '.gpTabs' + String(Date.now()) + String(Math.floor(Math.random() * 100000));
      $root.data('gpTabsNs', ns);

      const $scroller = $root.find('[data-tabs-scroll]').first();
      const updateScrollArrows = this._createScrollArrowUpdater($root, $scroller);
      $root.data('gpTabsScrollUpdate', updateScrollArrows);

      if ($scroller.length) {
        $scroller.on(`scroll${ns}`, () => {
          updateScrollArrows();
        });

        $(window).on(`resize${ns}`, () => {
          updateScrollArrows();
        });

        // Estado inicial (depois do paint do DOM)
        window.setTimeout(updateScrollArrows, 0);
      }

      $root.on(`click${ns}`, '[data-tab]', (event) => {
        event.preventDefault();
        const tabName = String($(event.currentTarget).attr('data-tab') || '').trim();
        if (!tabName) return;

        this.setActive($root, tabName, { activeClasses, inactiveClasses, hiddenClass, hideNoticeOnOpen });
        if (onChange) onChange(tabName);
      });

      // Setas (scroll horizontal) — somente se existir markup no template.
      $root.on(`click${ns}`, '[data-tabs-scroll-arrow]', (event) => {
        event.preventDefault();
        if (!$scroller.length) return;

        const direction = String($(event.currentTarget).attr('data-tabs-scroll-arrow') || '').trim();
        if (!direction) return;

        const el = $scroller.get(0);
        if (!el) return;

        const delta = Math.max(120, Math.floor(el.clientWidth * 0.8));
        const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);

        const target = direction === 'left'
          ? Math.max(0, el.scrollLeft - delta)
          : Math.min(maxScroll, el.scrollLeft + delta);

        try {
          el.scrollTo({ left: target, behavior: 'smooth' });
        } catch (e) {
          el.scrollLeft = target;
        }

        window.setTimeout(updateScrollArrows, 360);
      });

      const firstTab = String($root.find('[data-tab]').first().attr('data-tab') || '').trim();
      const initial = (defaultTab || firstTab).trim();
      if (initial) {
        this.setActive($root, initial, { activeClasses, inactiveClasses, hiddenClass, hideNoticeOnOpen });
        if (onChange) onChange(initial);
      }
    },

    destroy: function (rootEl) {
      const $root = $(rootEl);
      if (!$root.length) return;

      const ns = $root.data('gpTabsNs');
      if (ns) {
        $root.off(ns);
        $root.find('[data-tabs-scroll]').off(ns);
        $(window).off(ns);
        $root.removeData('gpTabsNs');
      }

      $root.removeData('gpTabsScrollUpdate');
    },

    setActive: function (rootEl, tabName, options) {
      const $root = $(rootEl);
      if (!$root.length) return;

      const activeClasses = (options && options.activeClasses) || 'border-bevap-green text-bevap-green bg-green-50';
      const inactiveClasses = (options && options.inactiveClasses) || 'border-transparent text-gray-500';
      const hiddenClass = (options && options.hiddenClass) || 'hidden';
      const hideNoticeOnOpen = options && options.hideNoticeOnOpen !== undefined ? Boolean(options.hideNoticeOnOpen) : true;

      const activeClassList = activeClasses.split(' ').filter(Boolean);
      const inactiveClassList = inactiveClasses.split(' ').filter(Boolean);

      $root.find('[data-tab]').each((_, el) => {
        const $btn = $(el);
        const name = String($btn.attr('data-tab') || '').trim();

        $btn.removeClass(activeClasses).removeClass(inactiveClasses);

        if (name === tabName) {
          $btn.addClass(activeClassList.join(' '));

          // Regra do protótipo: abriu a tab, some o badge.
          if (hideNoticeOnOpen) {
            $btn.find('.tab-notice-badge').addClass(hiddenClass);
          }
        } else {
          $btn.addClass(inactiveClassList.join(' '));
        }
      });

      $root.find('[data-tab-panel]').each((_, el) => {
        const $panel = $(el);
        const name = String($panel.attr('data-tab-panel') || '').trim();
        if (name === tabName) {
          $panel.removeClass(hiddenClass);
        } else {
          $panel.addClass(hiddenClass);
        }
      });

      // Se houver scroller, tenta manter a tab ativa visível.
      const $scroller = $root.find('[data-tabs-scroll]').first();
      if ($scroller.length) {
        const $activeBtn = $root.find(`[data-tab="${tabName}"]`).first();
        const activeEl = $activeBtn.get(0);
        if (activeEl && typeof activeEl.scrollIntoView === 'function') {
          try {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } catch (e) {
            // silencioso
          }
        }

        const updateScrollArrows = $root.data('gpTabsScrollUpdate');
        if (typeof updateScrollArrows === 'function') {
          window.setTimeout(updateScrollArrows, 360);
        }
      }
    },

    _createScrollArrowUpdater: function ($root, $scroller) {
      const getButton = (direction) => {
        return $root.find(`[data-tabs-scroll-arrow="${direction}"]`).first();
      };

      return function () {
        if (!$scroller || !$scroller.length) return;
        const el = $scroller.get(0);
        if (!el) return;

        const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
        const hasOverflow = maxScroll > 2;
        const atStart = el.scrollLeft <= 2;
        const atEnd = el.scrollLeft >= maxScroll - 2;

        const $left = getButton('left');
        const $right = getButton('right');

        if ($left.length) {
          $left.toggleClass('opacity-0', !hasOverflow || atStart);
          $left.toggleClass('pointer-events-none', !hasOverflow || atStart);
        }

        if ($right.length) {
          $right.toggleClass('opacity-0', !hasOverflow || atEnd);
          $right.toggleClass('pointer-events-none', !hasOverflow || atEnd);
        }
      };
    },

    _getAttr: function ($root, name) {
      const val = ($root.attr(name) || '').trim();
      return val || null;
    },

    _getBoolAttr: function ($root, name, defaultValue) {
      const raw = ($root.attr(name) || '').trim().toLowerCase();
      if (!raw) return Boolean(defaultValue);
      if (raw === 'true' || raw === '1' || raw === 'yes') return true;
      if (raw === 'false' || raw === '0' || raw === 'no') return false;
      return Boolean(defaultValue);
    }
  };

  const sidebar = {
    renderProjectSummary: function (targetEl, data) {
      const $target = $(targetEl);
      if (!$target.length) return;

      const d = data || {};
      const code = d.code || 'N/A';
      const title = d.title || '—';
      const requester = d.requester || '—';
      const area = d.area || '—';
      const sponsor = d.sponsor || '—';

      const priority = d.priority || { label: '—', iconClass: 'fa-solid fa-star', badgeClasses: 'bg-gray-100 text-gray-800' };
      const status = d.status || { label: '—', iconClass: 'fa-solid fa-clock', badgeClasses: 'bg-gray-100 text-gray-800' };

      const html = `
        <div class="bg-white rounded-lg shadow-md p-5" data-gp-component="project-summary">
          <h3 class="font-montserrat font-bold text-lg text-bevap-navy mb-4 flex items-center">
            <i class="fa-solid fa-project-diagram mr-2 text-bevap-gold"></i>
            Resumo do Projeto
          </h3>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between pb-2 border-b">
              <span class="text-gray-600">Código</span>
              <span class="font-mono font-semibold text-bevap-navy">${this._escape(code)}</span>
            </div>
            <div class="pb-2 border-b">
              <span class="text-gray-600">Título</span>
              <p class="font-medium text-gray-900 mt-1">${this._escape(title)}</p>
            </div>
            <div class="flex items-center justify-between pb-2 border-b">
              <span class="text-gray-600">Solicitante</span>
              <span class="font-medium text-gray-900">${this._escape(requester)}</span>
            </div>
            <div class="flex items-center justify-between pb-2 border-b">
              <span class="text-gray-600">Área</span>
              <span class="font-medium text-gray-900">${this._escape(area)}</span>
            </div>
            <div class="flex items-center justify-between pb-2 border-b">
              <span class="text-gray-600">Patrocinador</span>
              <span class="font-medium text-gray-900">${this._escape(sponsor)}</span>
            </div>
            <div class="flex items-center justify-between pb-2 border-b">
              <span class="text-gray-600">Prioridade</span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs ${this._escape(priority.badgeClasses || '')} font-medium">
                <i class="${this._escape(priority.iconClass || 'fa-solid fa-star')} mr-1"></i> ${this._escape(priority.label || '—')}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Status</span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs ${this._escape(status.badgeClasses || '')} font-medium">
                <i class="${this._escape(status.iconClass || 'fa-solid fa-clock')} mr-1"></i> ${this._escape(status.label || '—')}
              </span>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t space-y-2">
            <button data-action="show-timeline" class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-bevap-navy border border-bevap-navy rounded-lg hover:bg-gray-50 transition-colors">
              <i class="fa-solid fa-timeline mr-2"></i> Linha do Tempo
            </button>
            <button data-action="show-attachments" class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-bevap-green border border-bevap-green rounded-lg hover:bg-green-50 transition-colors">
              <i class="fa-solid fa-paperclip mr-2"></i> Ver Anexos (${Number(d.attachmentsCount || 0)})
            </button>
          </div>
        </div>
      `;

      $target.html(html);
    },

    renderProgress: function (targetEl, data) {
      const $target = $(targetEl);
      if (!$target.length) return;

      const d = data || {};
      const items = Array.isArray(d.items) ? d.items : [];

      const itemHtml = items.map((item) => {
        const style = (item && item.style) || 'success';
        const iconClass = (item && item.iconClass) || (style === 'success'
          ? 'fa-solid fa-check-circle'
          : style === 'danger'
            ? 'fa-solid fa-times-circle'
            : 'fa-solid fa-exclamation-circle');

        const textClass = style === 'success'
          ? 'text-green-600'
          : style === 'danger'
            ? 'text-red-600'
            : 'text-yellow-600';

        return `
          <div class="flex items-center ${textClass}">
            <i class="${this._escape(iconClass)} mr-2"></i>
            <span>${this._escape(item && item.label ? item.label : '—')}</span>
          </div>
        `;
      }).join('');

      const html = `
        <div class="bg-white rounded-lg shadow-md p-5" data-gp-component="progress-status">
          <h3 class="font-montserrat font-bold text-lg text-bevap-navy mb-4 flex items-center">
            <i class="fa-solid fa-tasks mr-2 text-bevap-green"></i>
            Progresso
          </h3>
          <div class="space-y-2 text-sm">
            ${itemHtml || '<div class="text-sm text-gray-600">Sem itens de progresso.</div>'}
          </div>
        </div>
      `;

      $target.html(html);
    },

    _escape: function (value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  $doc.data(KEY, { tabs, sidebar });
})();
