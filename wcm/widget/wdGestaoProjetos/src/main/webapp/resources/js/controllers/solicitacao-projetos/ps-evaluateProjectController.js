const evaluateProjectController = {
  _eventNamespace: '.evaluateProject',

  _datasetId: 'dsGetSolicitacaoProjetos',
  _solicitationFields: [
    'documentid',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'centrodecustoNS',
    'patrocinadorNS',
    'objetivodoprojetoNS',
    'problemaOportunidadeNS',
    'beneficiosesperadosNS',
    'alinhadobevapNS',
    'prioridadeNS',
    'escopoinicialNS',
    'foradeescopoNS',
    'dependenciasNS',
    'anexosNS',
    'observacoesadicionaisNS',

   
  ],

  _headerBackup: null,
  _toastTimer: null,
  _tabsRoot: null,
  _uiComponentsKey: 'gpUiComponents',

  _currentDocumentId: null,
  _currentEstadoProcesso: null,

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();

    this._currentDocumentId = params && params.documentId ? String(params.documentId) : null;
    this._currentEstadoProcesso = params && params.estadoProcesso ? String(params.estadoProcesso) : null;

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.renderSidebarComponents();
        this.initializeTabs();
        this.bindEvents();
        this.resetAllFields();
        this.ensureDefaultRiskItem();
        this.updateChecklistProgress();
        this.loadSolicitationFromDataset();
      })
      .fail((error) => {
        console.error('Evaluate project template load error:', error);
        container.html('<div class="p-6 text-red-600">Failed to load evaluate project page.</div>');
      });
  },

  destroy: function () {
    this.unbindEvents();
    this.destroyTabs();
    this.restoreHeader();

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-evaluate-project.html`;
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
      titleEl.text('TI – Avaliar Projeto');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Avaliar</span>
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

    container.on(`click${ns}`, '[data-action="add-risk"]', (event) => {
      event.preventDefault();
      this.addRiskItem();
    });

    container.on(`click${ns}`, '[data-action="remove-risk"]', (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      this.removeRiskItem(button);
    });

    container.on(`change${ns}`, '#tab-content-checklist input[type="checkbox"]', () => {
      this.updateChecklistProgress();
    });

    container.on(`click${ns}`, '[data-action="open-return-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-return');
    });

    container.on(`click${ns}`, '[data-action="open-reject-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-reject');
    });

    container.on(`click${ns}`, '[data-action="open-approve-modal"]', (event) => {
      event.preventDefault();
      this.openModal('approve-modal');
    });

    container.on(`click${ns}`, '[data-action="close-approve-modal"]', (event) => {
      event.preventDefault();
      this.closeModal('approve-modal');
    });

    container.on(`click${ns}`, '[data-action="close-modal"]', (event) => {
      event.preventDefault();
      const modalId = String($(event.currentTarget).attr('data-modal-id') || '').trim();
      if (!modalId) return;
      this.closeModal(modalId);
    });

    container.on(`click${ns}`, '[data-action="confirm-return"]', (event) => {
      event.preventDefault();
      this.closeModal('modal-return');
      this.showToast('Projeto devolvido para correção');
    });

    container.on(`click${ns}`, '[data-action="confirm-reject"]', (event) => {
      event.preventDefault();
      this.closeModal('modal-reject');
      this.showToast('Projeto marcado como não continuidade');
    });

    container.on(`click${ns}`, '[data-action="confirm-approve"]', (event) => {
      event.preventDefault();
      this.closeModal('approve-modal');
      this.showToast('Encaminhado para Aprovação do Projeto');
    });

    container.on(`click${ns}`, '[data-action="save-draft"]', (event) => {
      event.preventDefault();
      this.showToast('Rascunho salvo com sucesso');
    });

    container.on(`click${ns}`, '[data-action="view-attachment"]', (event) => {
      event.preventDefault();
      this.showToast('Abrindo anexo...');
    });

    container.on(`click${ns}`, '[data-action="show-timeline"]', (event) => {
      event.preventDefault();
      this.showToast('Linha do tempo em desenvolvimento');
    });

    container.on(`click${ns}`, '[data-action="show-attachments"]', (event) => {
      event.preventDefault();
      this.showToast('Visualizador de anexos em desenvolvimento');
    });

    container.on(`click${ns}`, '#approve-modal, #modal-return, #modal-reject', (event) => {
      if (event.target !== event.currentTarget) return;
      $(event.currentTarget).addClass('hidden');
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

  initializeTabs: function () {
    const container = this.getContainer();
    const tabsRoot = container.find('[data-component="tabs"]').first();
    if (!tabsRoot.length) return;

    const ui = this.getUiComponents();
    if (!ui || !ui.tabs) return;

    this.destroyTabs();
    this._tabsRoot = tabsRoot;

    ui.tabs.init(tabsRoot, {
      defaultTab: 'solicitacao',
      hideNoticeOnOpen: true,
      onChange: (tabName) => {
        if (tabName === 'checklist') {
          this.updateChecklistProgress();
        }
      }
    });
  },

  destroyTabs: function () {
    if (!this._tabsRoot || !this._tabsRoot.length) {
      this._tabsRoot = null;
      return;
    }

    const ui = this.getUiComponents();
    if (ui && ui.tabs) {
      ui.tabs.destroy(this._tabsRoot);
    }

    this._tabsRoot = null;
  },

  renderSidebarComponents: function () {
    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    const progressTarget = container.find('[data-component="progress-status"]').first();

    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: '—',
      title: '—',
      requester: '—',
      area: '—',
      sponsor: '—',
      attachmentsCount: 0,
      priority: { label: '—', iconClass: 'fa-solid fa-star', badgeClasses: 'bg-gray-100 text-gray-800' },
      status: { label: '—', iconClass: 'fa-solid fa-clock', badgeClasses: 'bg-gray-100 text-gray-800' }
    });

    ui.sidebar.renderProgress(progressTarget, {
      items: [
        { style: 'success', label: 'Solicitação completa', iconClass: 'fa-solid fa-check-circle' },
        { style: 'warning', label: 'Análise Técnica pendente', iconClass: 'fa-solid fa-exclamation-circle' }
      ]
    });
  },

  ensureDefaultRiskItem: function () {
    const container = this.getContainer();
    const riskContainer = container.find('#risks-container');
    if (!riskContainer.length) return;

    if (riskContainer.children().length === 0) {
      this.addRiskItem();
    }
  },

  addRiskItem: function () {
    const container = document.getElementById('risks-container');
    if (!container) return;

    const riskItem = document.createElement('div');
    riskItem.className = 'risk-item grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border border-gray-200 rounded-lg bg-gray-50';
    riskItem.innerHTML = `
      <div class="md:col-span-3">
        <label class="block text-xs font-medium text-gray-600 mb-1">Nível de Risco</label>
        <select class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent transition-all text-sm">
          <option value="" selected disabled>Selecione</option>
          <option value="baixo">Baixo</option>
          <option value="medio">Médio</option>
          <option value="alto">Alto</option>
        </select>
      </div>
      <div class="md:col-span-8">
        <label class="block text-xs font-medium text-gray-600 mb-1">Descrição do Risco</label>
        <textarea rows="2" placeholder="Descreva o risco técnico identificado..." class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent transition-all resize-none text-sm"></textarea>
      </div>
      <div class="md:col-span-1 flex md:justify-end md:pt-6">
        <button type="button" data-action="remove-risk" class="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors" title="Remover risco">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    container.appendChild(riskItem);
  },

  removeRiskItem: function (button) {
    const container = document.getElementById('risks-container');
    const item = button && button.closest ? button.closest('.risk-item') : null;
    if (!container || !item) return;

    if (container.children.length === 1) {
      const select = item.querySelector('select');
      const textarea = item.querySelector('textarea');
      if (select) select.value = '';
      if (textarea) textarea.value = '';
      return;
    }

    item.remove();
  },

  openModal: function (modalId) {
    const modal = this.getContainer().find('#' + modalId);
    if (!modal.length) return;
    modal.removeClass('hidden');
  },

  closeModal: function (modalId) {
    const modal = this.getContainer().find('#' + modalId);
    if (!modal.length) return;
    modal.addClass('hidden');
  },

  showToast: function (message) {
    const root = this.getContainer();
    const toast = root.find('#toast');
    const messageEl = root.find('#toast-message');

    if (!toast.length || !messageEl.length) return;

    messageEl.text(message || 'Ação realizada com sucesso!');

    toast.removeClass('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
      this._toastTimer = null;
    }, 3000);
  },

  updateChecklistProgress: function () {
    const root = document.getElementById('tab-content-checklist');
    if (!root) return;

    const checkboxes = root.querySelectorAll('input[type="checkbox"]');
    const checked = root.querySelectorAll('input[type="checkbox"]:checked').length;
    const percentage = checkboxes.length ? Math.round((checked / checkboxes.length) * 100) : 0;

    const percentageEl = document.getElementById('checklist-percentage');
    if (percentageEl) percentageEl.textContent = percentage + '%';

    const progressEl = document.getElementById('checklist-progress');
    if (progressEl) progressEl.style.width = percentage + '%';
  }
  ,

  resetAllFields: function () {
    const root = this.getContainer();
    if (!root || !root.length) return;

    // Limpa inputs/textarea/select
    root.find('input, textarea, select').each(function () {
      const $el = $(this);
      const type = String($el.attr('type') || '').toLowerCase();

      if (type === 'checkbox' || type === 'radio') {
        $el.prop('checked', false);
        return;
      }

      // Mantém hidden também limpo (value="")
      $el.val('');
    });

    // Limpa containers dinâmicos
    root.find('#risks-container').empty();

    const riscosList = document.getElementById('riscos-iniciais-list');
    if (riscosList) {
      riscosList.innerHTML = '<div class="text-sm text-gray-500">—</div>';
    }

    const stakeholdersList = document.getElementById('stakeholders-list');
    if (stakeholdersList) {
      stakeholdersList.innerHTML = '<div class="text-sm text-gray-500">—</div>';
    }

    this.renderAlinhamentoBevap(null);
    this.autoResizeSolicitacaoTextareas();

    // Zera barra de checklist
    const percentageEl = document.getElementById('checklist-percentage');
    if (percentageEl) percentageEl.textContent = '0%';

    const progressEl = document.getElementById('checklist-progress');
    if (progressEl) progressEl.style.width = '0%';
  },

  loadSolicitationFromDataset: async function () {
    if (!this._currentDocumentId) {
      return;
    }

    try {
      console.group('[evaluateProject] loadSolicitationFromDataset');
      console.log('[evaluateProject] documentId:', this._currentDocumentId);
      console.log('[evaluateProject] estadoProcesso:', this._currentEstadoProcesso);
      console.groupEnd();

      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields: this._solicitationFields,
        filters: {
          documentid: this._currentDocumentId
        }
      });

      const row = rows && rows.length ? rows[0] : null;
      if (!row) {
        return;
      }

      this.fillNsFieldsFromRow(row);
      this.renderSidebarFromRow(row);
    } catch (error) {
      console.error('[evaluateProject] Erro ao carregar solicitacao via dataset:', error);
    }
  },

  fillNsFieldsFromRow: function (row) {
    const setVal = (fieldId, value) => {
      const el = this.getContainer().find('#' + fieldId);
      if (!el.length) return;
      el.val(value === null || value === undefined || value === 'null' ? '' : String(value));
    };

    setVal('documentid', row.documentid);
    setVal('estadoProcesso', row.estadoProcesso);

    setVal('titulodoprojetoNS', row.titulodoprojetoNS);
    setVal('areaUnidadeNS', row.areaUnidadeNS);
    setVal('centrodecustoNS', row.centrodecustoNS);
    setVal('patrocinadorNS', row.patrocinadorNS);
    setVal('objetivodoprojetoNS', row.objetivodoprojetoNS);
    setVal('problemaOportunidadeNS', row.problemaOportunidadeNS);
    setVal('beneficiosesperadosNS', row.beneficiosesperadosNS);
    setVal('escopoinicialNS', row.escopoinicialNS);
    setVal('foradeescopoNS', row.foradeescopoNS);
    setVal('dependenciasNS', row.dependenciasNS);
    setVal('anexosNS', row.anexosNS);

    // Sem lugar visual: salvar em hidden
    setVal('alinhadobevapNS', row.alinhadobevapNS);
    setVal('prioridadeNS', row.prioridadeNS);
    setVal('observacoesadicionaisNS', row.observacoesadicionaisNS);

    // Pai x filho (retorna como JSON string no dataset)
    setVal('tblRiscosIniciaisNS', row.tblRiscosIniciaisNS);
    setVal('tblStakeholdersNS', row.tblStakeholdersNS);
    setVal('tblObjetivosEstrategicosNS', row.tblObjetivosEstrategicosNS);

    this.renderRiscosIniciais(row.tblRiscosIniciaisNS);
    this.renderStakeholders(row.tblStakeholdersNS);

    this.renderAlinhamentoBevap(row.alinhadobevapNS);

    this.autoResizeSolicitacaoTextareas();
  },

  renderSidebarFromRow: function (row) {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    if (!summaryTarget.length) return;

    const priorityLabel = this.getPriorityLabel(row.prioridadeNS);
    const priorityBadgeClasses = this.getPriorityBadgeClasses(row.prioridadeNS);
    const statusLabel = this.getEstadoProcessoLabel(row.estadoProcesso);
    const statusBadgeClasses = 'bg-yellow-100 text-yellow-800';

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: 'PRJ-2026-018',
      title: row.titulodoprojetoNS || '—',
      requester: '—',
      area: row.areaUnidadeNS || '—',
      sponsor: row.patrocinadorNS || '—',
      attachmentsCount: row.anexosNS ? 1 : 0,
      priority: { label: priorityLabel || '—', iconClass: 'fa-solid fa-star', badgeClasses: priorityBadgeClasses || 'bg-gray-100 text-gray-800' },
      status: { label: statusLabel || '—', iconClass: 'fa-solid fa-clock', badgeClasses: statusBadgeClasses }
    });
  },

  getPriorityBadgeClasses: function (priority) {
    const raw = (priority === null || priority === undefined || priority === 'null') ? '' : String(priority);
    const normalized = raw
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.indexOf('critico') !== -1) return 'bg-red-100 text-red-800';
    if (normalized.indexOf('estrategico') !== -1) return 'bg-green-100 text-green-800';
    if (normalized.indexOf('operacional') !== -1) return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-800';
  },

  getEstadoProcessoLabel: function (estadoProcesso) {
    const raw = this.asText(estadoProcesso);
    if (!raw) return '';

    // Ex.: "5 - Analisar TI" => "Analisar TI"
    const withoutPrefix = raw.replace(/^\s*\d+\s*-\s*/i, '').trim();
    return withoutPrefix || raw;
  },

  autoResizeSolicitacaoTextareas: function () {
    const container = this.getContainer();
    if (!container || !container.length) return;

    const root = container.find('#tab-content-solicitacao');
    if (!root.length) return;

    // Apenas textareas readonly (as demais abas possuem campos editáveis)
    root.find('textarea[readonly]').each(function () {
      const el = this;
      if (!el) return;

      // Força o browser a recalcular com base no conteúdo
      el.style.overflow = 'hidden';
      el.style.height = '0px';
      const nextHeight = Math.max(el.scrollHeight, 24);
      el.style.height = nextHeight + 'px';
    });
  },

  getPriorityLabel: function (priority) {
    const raw = (priority === null || priority === undefined || priority === 'null') ? '' : String(priority);
    const normalized = raw
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.indexOf('critico') !== -1) return 'Crítico';
    if (normalized.indexOf('estrategico') !== -1) return 'Estratégico';
    if (normalized.indexOf('operacional') !== -1) return 'Operacional';
    return raw || '';
  }

  ,

  renderRiscosIniciais: function (tblRiscosIniciaisNS) {
    const root = document.getElementById('riscos-iniciais-list');
    if (!root) return;

    const rows = this.parseTableJson(tblRiscosIniciaisNS);
    const risks = rows
      .map((r) => this.asText(r && r.riscoPotencialNS))
      .filter((v) => v);

    if (!risks.length) {
      root.innerHTML = '<div class="text-sm text-gray-500">—</div>';
      return;
    }

    root.innerHTML = risks.map((risk) => {
      return `
        <div class="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <i class="fa-solid fa-triangle-exclamation text-yellow-600 mt-0.5"></i>
          <span class="text-sm text-gray-700">${this.escapeHtml(risk)}</span>
        </div>
      `;
    }).join('');
  },

  renderStakeholders: function (tblStakeholdersNS) {
    const root = document.getElementById('stakeholders-list');
    if (!root) return;

    const rows = this.parseTableJson(tblStakeholdersNS);
    const stakeholders = rows
      .map((r) => this.asText(r && r.valorstakeholdersNS))
      .filter((v) => v);

    if (!stakeholders.length) {
      root.innerHTML = '<div class="text-sm text-gray-500">—</div>';
      return;
    }

    root.innerHTML = stakeholders.map((name) => {
      return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-bevap-navy text-white">
          ${this.escapeHtml(name)}
        </span>
      `;
    }).join('');
  },

  renderAlinhamentoBevap: function (rawValue) {
    const container = this.getContainer();
    if (!container || !container.length) return;

    const banner = container.find('#alinhamento-bevap-banner');
    const icon = container.find('#alinhamento-bevap-icon');
    const text = container.find('#alinhamento-bevap-text');
    const debug = container.find('#alinhadobevapNS_display');

    if (!banner.length || !icon.length || !text.length) return;

    const parsed = this.parseBooleanLike(rawValue);
    const isAligned = parsed === true;

    const applyIconColor = () => {
      // Remove style inline que pode sobrescrever classes
      icon.removeAttr('style');

      // Mantém o mesmo ícone (fa-circle-info), mas força cor no <i> e no <svg>/<path> do FontAwesome
      stripColorClasses(icon);

      const colorClass = isAligned ? 'text-bevap-green' : 'text-red-600';
      const colorValue = this.getComputedColorFromClass(colorClass);
      icon.addClass(colorClass);

      // Também força por style para ganhar de qualquer css residual/inline
      if (colorValue) {
        icon.css('color', colorValue);
      }

      const svg = icon.find('svg.svg-inline--fa');
      if (svg && svg.length) {
        svg.removeAttr('style');
        stripColorClasses(svg);
        svg.addClass(colorClass);

        if (colorValue) {
          svg.css('color', colorValue);
        }

        // Força o desenho usar a cor atual
        svg.attr('fill', 'currentColor');
        svg.find('path, g').each(function () {
          const $node = $(this);
          $node.removeAttr('style');
          $node.attr('fill', 'currentColor');
        });
      }
    };

    if (debug.length) {
      debug.text(this.asText(rawValue) || '—');
    }

    const stripColorClasses = ($el) => {
      if (!$el || !$el.length) return;
      const cls = String($el.attr('class') || '')
        .split(/\s+/)
        .map((c) => c.trim())
        .filter(Boolean);

      const kept = cls.filter((c) => {
        // Remove apenas cores; preserva tamanhos tipo text-sm/text-xs se algum dia aparecer.
        return !/^text-(red|green|yellow|gray|bevap)(-|\/|$)/.test(c);
      });

      $el.attr('class', kept.join(' '));
    };

    // Regra: alinhado=true => verde; qualquer outra coisa => vermelho
    banner
      .removeClass('border-green-200 bg-green-50 border-red-200 bg-red-50 border-gray-200 bg-gray-50')
      .addClass(isAligned ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50');

    applyIconColor();
    // Quando o FontAwesome injeta o SVG depois (autoReplaceSvg='nest'), reaplica a cor.
    window.setTimeout(applyIconColor, 0);
    window.setTimeout(applyIconColor, 50);

    if (isAligned) {
      text.removeClass('text-red-700 text-gray-700').addClass('text-bevap-green');
      text.text('Alinhado aos objetivos estratégicos BEVAP');
      return;
    }

    text.removeClass('text-gray-700 text-bevap-green').addClass('text-red-700');
    text.text('Não alinhado aos objetivos estratégicos BEVAP');
  },

  getComputedColorFromClass: function (className) {
    const cls = String(className || '').trim();
    if (!cls) return '';

    const el = document.createElement('span');
    el.className = cls;
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    el.style.visibility = 'hidden';
    el.textContent = 'x';

    document.body.appendChild(el);
    const color = window.getComputedStyle(el).color || '';
    el.remove();
    return color;
  },

  parseBooleanLike: function (value) {
    if (value === true) return true;
    if (value === false) return false;

    const normalized = this.asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized) return null;

    if (normalized === '1') return true;
    if (normalized === '0') return false;

    if (normalized === 'true') return true;
    if (normalized === 'false') return false;

    if (normalized === 'sim' || normalized === 's') return true;
    if (normalized === 'nao' || normalized === 'n') return false;

    if (normalized.indexOf('nao alinh') !== -1) return false;
    if (normalized.indexOf('nao-alinh') !== -1) return false;
    if (normalized.indexOf('alinhad') !== -1) return true;

    return null;
  },

  parseTableJson: function (value) {
    if (Array.isArray(value)) return value;

    const text = this.asText(value);
    if (!text) return [];
    if (text === 'null') return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[evaluateProject] JSON inválido em tabela pai/filho:', error);
      return [];
    }
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  },

  escapeHtml: function (value) {
    return this.asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
