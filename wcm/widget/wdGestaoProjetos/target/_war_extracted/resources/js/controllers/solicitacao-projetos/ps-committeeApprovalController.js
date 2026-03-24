const committeeApprovalController = {
  _eventNamespace: '.committeeApproval',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _baseFields: [
    'documentid',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'patrocinadorNS',
    'prioridadeNS',
    'estadoProcesso',
    'anexosNS',
    'anexosApoioTITT',
    'beneficiosesperadosNS',
    'tblBeneficiosEsperadosNS.beneficioEsperadoNS',
    'alinhadobevapNS',
    'tblObjetivosEstrategicosNS.descricaoobjetivoNS',
    'dataHoraCAP',
    'anotacoesCAP',
    'anexarAtaReuniaoCAP',
    'tblParticipantesCAP.nomeParticipanteCAP',

    // TITT - Riscos & Dependências (para aba Risco & Compliance)
    'tblRiscosIdentificadosTITT.tituloRiscoTITT',
    'tblRiscosIdentificadosTITT.descricaoRiscoTITT',
    'tblRiscosIdentificadosTITT.mitigacaoRiscoTITT',
    'tblRiscosIdentificadosTITT.nivelRiscoTITT',
    'tblRiscosIdentificadosTITT.impactoRiscoTITT',
    'tblRiscosIdentificadosTITT.probabilidadeRiscoTITT',
    'tblDependenciasTITT.tituloDependenciaTITT',
    'tblDependenciasTITT.statusDependenciaTITT',
    'tblDependenciasTITT.responsavelDependenciaTITT',
    'tblDependenciasTITT.mitigacaoDependenciaTITT',
    'tblRiscosDependenciasTITT.riscoPotencialTITT'
  ],
  _uiComponentsKey: 'gpUiComponents',
  _tabComponentsKey: 'gpApprovalTabComponents',
  _tabsRoot: null,
  _headerBackup: null,
  _toastTimer: null,
  _state: {
    documentId: null,
    estadoProcesso: null,
    processInstanceId: null,
    baseRow: null,
    currentTab: 'solicitacao',
    historyCache: {},
    isSubmitting: false,
    participants: [],
    attachments: []
  },

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();

    this._state.documentId = params && params.documentId ? String(params.documentId) : null;
    this._state.estadoProcesso = params && params.estadoProcesso ? String(params.estadoProcesso) : null;
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : null;

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.renderSidebarSkeleton();
        this.initializeTabs();
        this.bindEvents();
        this.loadReadOnlyTab('solicitacao');
        this.loadBaseContext();
      })
      .fail((error) => {
        console.error('[committeeApproval] Template load error:', error);
        container.html('<div class="p-6 text-red-600">Falha ao carregar a tela do Comitê.</div>');
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

    this._state.documentId = null;
    this._state.estadoProcesso = null;
    this._state.processInstanceId = null;
    this._state.baseRow = null;
    this._state.currentTab = 'solicitacao';
    this._state.historyCache = {};
    this._state.isSubmitting = false;
    this._state.participants = [];
    this._state.attachments = [];
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-committee-approval.html`;
  },

  getContainer: function () {
    return $('#page-container');
  },

  getUiComponents: function () {
    if (typeof $ === 'undefined') return null;
    return $(document).data(this._uiComponentsKey) || null;
  },

  getTabComponents: function () {
    if (typeof $ === 'undefined') return {};
    return $(document).data(this._tabComponentsKey) || {};
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
      titleEl.text('Comitê - Aprovar Projeto');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Comitê</span>
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

  initializeTabs: function () {
    const ui = this.getUiComponents();
    const tabsRoot = this.getContainer().find('[data-component="tabs"]').first();
    if (!ui || !ui.tabs || !tabsRoot.length) return;

    this.destroyTabs();
    this._tabsRoot = tabsRoot;

    ui.tabs.init(tabsRoot, {
      defaultTab: 'solicitacao',
      hideNoticeOnOpen: true,
      onChange: (tabName) => {
        this._state.currentTab = String(tabName || 'solicitacao');
        this.loadReadOnlyTab(this._state.currentTab);
      }
    });
  },

  destroyTabs: function () {
    const ui = this.getUiComponents();
    if (ui && ui.tabs && this._tabsRoot && this._tabsRoot.length) {
      ui.tabs.destroy(this._tabsRoot);
    }

    this._tabsRoot = null;
  },

  bindEvents: function () {
    const container = this.getContainer();
    const ns = this._eventNamespace;
    this.unbindEvents();

    container.on(`click${ns}`, '#toast-close', (event) => {
      event.preventDefault();
      container.find('#toast').addClass('hidden');
      if (this._toastTimer) {
        clearTimeout(this._toastTimer);
        this._toastTimer = null;
      }
    });

    container.on(`click${ns}`, '[data-action="save-draft"]', (event) => {
      event.preventDefault();
      this.saveDraft();
    });

    container.on(`click${ns}`, '[data-action="committee-approve"]', (event) => {
      event.preventDefault();
      this.handleTaskAction({
        action: 'Aprovar Projeto',
        choosedState: 45,
        decisionValue: 'aprovado'
      });
    });

    container.on(`click${ns}`, '[data-action="open-return-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-return');
    });

    container.on(`click${ns}`, '[data-action="open-reject-modal"]', (event) => {
      event.preventDefault();
      this.openModal('modal-reject');
    });

    container.on(`click${ns}`, '[data-action="close-modal"]', (event) => {
      event.preventDefault();
      const modalId = String($(event.currentTarget).attr('data-modal-id') || '').trim();
      if (!modalId) return;
      this.closeModal(modalId);
    });

    container.on(`click${ns}`, '[data-action="confirm-return"]', (event) => {
      event.preventDefault();
      const justification = this.asText(this.getContainer().find('#cap-justification-return').val());
      this.handleTaskAction({
        modalId: 'modal-return',
        action: 'Devolver para Correção',
        choosedState: 45,
        decisionValue: 'correcao',
        justification: justification,
        requireJustification: true
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-reject"]', (event) => {
      event.preventDefault();
      const justification = this.asText(this.getContainer().find('#cap-justification-reject').val());
      this.handleTaskAction({
        modalId: 'modal-reject',
        action: 'Reprovar',
        choosedState: 45,
        decisionValue: 'cancelado',
        justification: justification,
        requireJustification: true
      });
    });

    container.on(`click${ns}`, '#modal-return, #modal-reject', (event) => {
      if (event.target !== event.currentTarget) return;
      $(event.currentTarget).addClass('hidden');
    });

    container.on(`click${ns}`, '#cap-add-participant', (event) => {
      event.preventDefault();
      this.addParticipantFromInput();
    });

    container.on(`keydown${ns}`, '#cap-participant-input', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      this.addParticipantFromInput();
    });

    container.on(`click${ns}`, '[data-action="remove-cap-participant"]', (event) => {
      event.preventDefault();
      const id = String($(event.currentTarget).attr('data-participant-id') || '').trim();
      if (!id) return;
      this.removeParticipant(id);
    });

    container.on(`change${ns}`, '#cap-ata-input', (event) => {
      const input = event.currentTarget;
      const files = input && input.files ? input.files : [];
      this.addAttachments(files);
      try { input.value = ''; } catch (e) {}
    });

    container.on(`click${ns}`, '[data-action="remove-cap-attachment"]', (event) => {
      event.preventDefault();
      const id = String($(event.currentTarget).attr('data-attachment-id') || '').trim();
      if (!id) return;
      this.removeAttachment(id);
    });
  },

  openModal: function (modalId) {
    const id = this.asText(modalId);
    if (!id) return;
    const modal = this.getContainer().find(`#${id}`).first();
    if (!modal.length) return;
    modal.removeClass('hidden');

    if (id === 'modal-return') {
      modal.find('#cap-justification-return').trigger('focus');
    }
    if (id === 'modal-reject') {
      modal.find('#cap-justification-reject').trigger('focus');
    }
  },

  closeModal: function (modalId) {
    const id = this.asText(modalId);
    if (!id) return;
    const modal = this.getContainer().find(`#${id}`).first();
    if (!modal.length) return;
    modal.addClass('hidden');
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho do Comitê...');
      await this.waitForUiPaint();

      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        taskFields: this.collectCommitteeTaskFields()
      });

      this.showToast('Rascunho salvo', 'As alterações foram salvas com sucesso.', 'success');
    } catch (error) {
      console.error('[committeeApproval] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Não foi possível salvar o rascunho.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
  },

  getReadOnlyTabConfig: function (tabName) {
    const configMap = {
      solicitacao: { key: 'solicitationHistory', mount: 'tab-solicitacao-history' },
      'analise-ti': { key: 'tiAnalysisHistory', mount: 'tab-analise-ti-history' },
      impacto: { key: 'areaImpactHistory', mount: 'tab-impacto-history' },
      'triagem-ti': { key: 'tiTriageHistory', mount: 'tab-triagem-ti-history' }
    };

    return configMap[tabName] || null;
  },

  loadReadOnlyTab: async function (tabName) {
    const config = this.getReadOnlyTabConfig(tabName);
    if (!config) return;

    const target = this.getContainer().find(`[data-component="${config.mount}"]`).first();
    if (!target.length) return;

    const components = this.getTabComponents();
    const component = components[config.key];

    if (this._state.historyCache[tabName]) {
      target.html(this._state.historyCache[tabName]);
      this.mountAttachmentsInTab(target, component);
      return;
    }

    if (!component || typeof component.render !== 'function') {
      target.html('<div class="text-sm text-red-600">Componente da aba indisponível.</div>');
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteúdo...</div>');

    try {
      const html = await component.render({ documentId: this._state.documentId });
      this._state.historyCache[tabName] = html;
      target.html(html);
      this.mountAttachmentsInTab(target, component);
    } catch (error) {
      console.error(`[committeeApproval] Error loading tab ${tabName}:`, error);
      target.html('<div class="text-sm text-red-600">Não foi possível carregar esta aba.</div>');
    }
  },

  mountAttachmentsInTab: function (tabRootEl, component) {
    if (!component || typeof component.mountAttachments !== 'function') return;
    try {
      component.mountAttachments(tabRootEl, { documentId: this._state.documentId });
    } catch (error) {
      // silencioso
    }
  },

  loadBaseContext: async function () {
    if (!this._state.documentId) {
      this.showToast('Sem solicitação', 'Nenhum documentId foi informado para esta rota.', 'warning');
      return;
    }

    try {
      const rows = await fluigService.getDatasetRows(this._datasetId, {
        fields: this._baseFields,
        filters: { documentid: this._state.documentId }
      });

      const row = rows && rows.length ? rows[0] : null;
      this._state.baseRow = row;

      if (!row) {
        this.showToast('Não encontrado', 'Não foi possível localizar dados da solicitação.', 'warning');
        return;
      }

      this.renderSidebarFromRow(row);
      this.fillCapFieldsFromRow(row);
      this.renderRiskComplianceFromRow(row);
      this.renderBusinessCaseFromRow(row);
      this.renderDocumentsFromRow(row);
    } catch (error) {
      console.error('[committeeApproval] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Não foi possível carregar os dados do Comitê.', 'error');
    }
  },

  renderBusinessCaseFromRow: function (row) {
    const root = this.getContainer();
    const benefitsGrid = root.find('#cap-benefits-grid').first();
    const alignmentCard = root.find('#cap-alignment-card').first();

    if (!benefitsGrid.length && !alignmentCard.length) return;

    const legacyBenefits = this.parseLegacyRows(this.asText(row && row.beneficiosesperadosNS));
    const benefitsFromIndexedFields = this.collectIndexedFieldValues(row, 'beneficioEsperadoNS');
    const benefitsFromTable = this.parseTableJson(row && row.tblBeneficiosEsperadosNS)
      .map((item) => this.asText(item && item.beneficioEsperadoNS))
      .filter(Boolean);
    const benefits = benefitsFromIndexedFields.length
      ? benefitsFromIndexedFields
      : (benefitsFromTable.length ? benefitsFromTable : legacyBenefits);

    const palette = [
      { bg: 'bg-green-50', border: 'border border-green-200', icon: 'fa-chart-line text-bevap-green', title: 'text-green-900', text: 'text-green-800' },
      { bg: 'bg-blue-50', border: 'border border-blue-200', icon: 'fa-users text-blue-600', title: 'text-blue-900', text: 'text-blue-800' },
      { bg: 'bg-yellow-50', border: 'border border-yellow-200', icon: 'fa-dollar-sign text-bevap-gold', title: 'text-yellow-900', text: 'text-yellow-800' },
      { bg: 'bg-purple-50', border: 'border border-purple-200', icon: 'fa-database text-purple-600', title: 'text-purple-900', text: 'text-purple-800' }
    ];

    if (benefitsGrid.length) {
      if (!benefits.length) {
        benefitsGrid.html('<div class="text-sm text-gray-500 md:col-span-2">Nenhum benefício informado.</div>');
      } else {
        benefitsGrid.html(benefits.map((text, index) => {
          const theme = palette[index % palette.length];
          const title = `Benefício ${index + 1}`;
          return `
            <div class="${this.escapeHtml(theme.bg)} ${this.escapeHtml(theme.border)} rounded-lg p-4">
              <div class="flex items-center mb-2">
                <i class="fa-solid ${this.escapeHtml(theme.icon)} mr-2"></i>
                <span class="font-medium ${this.escapeHtml(theme.title)}">${this.escapeHtml(title)}</span>
              </div>
              <p class="text-sm ${this.escapeHtml(theme.text)} whitespace-pre-line">${this.escapeHtml(text)}</p>
            </div>
          `;
        }).join(''));
      }
    }

    const objectivesFromIndexedFields = this.collectIndexedFieldValues(row, 'descricaoobjetivoNS');
    const objectivesFromTable = this.parseTableJson(row && row.tblObjetivosEstrategicosNS)
      .map((item) => this.asText(item && item.descricaoobjetivoNS))
      .filter(Boolean);
    const objectives = objectivesFromIndexedFields.length ? objectivesFromIndexedFields : objectivesFromTable;
    const isAligned = this.parseBooleanLike(row && row.alinhadobevapNS) === true;

    if (alignmentCard.length) {
      const title = isAligned ? 'Alinhamento estratégico confirmado' : 'Alinhamento estratégico não confirmado';
      const desc = objectives.length
        ? objectives.map((item) => `<li class="text-sm text-blue-200 whitespace-pre-line">${this.escapeHtml(item)}</li>`).join('')
        : '<div class="text-sm text-blue-200">Nenhum objetivo estratégico informado.</div>';

      alignmentCard.html(`
        <div class="flex items-center mb-2">
          <i class="fa-solid fa-target text-bevap-gold mr-2"></i>
          <span class="font-semibold">${this.escapeHtml(title)}</span>
        </div>
        ${objectives.length
          ? `<ul class="list-disc pl-5 space-y-1">${desc}</ul>`
          : desc
        }
      `);
    }
  },

  renderDocumentsFromRow: async function (row) {
    const root = this.getContainer();
    const target = root.find('#cap-documents-attachments').first();
    if (!target.length) return;

    const ui = this.getUiComponents();
    if (!ui || !ui.attachments || typeof ui.attachments.render !== 'function') {
      target.html('<div class="py-2 text-sm text-gray-500">Componente de anexos indisponível.</div>');
      return;
    }

    const items = [];
    const pushNormalized = (raw) => {
      const documentId = this.asText(raw && (raw.documentId || raw.documentID || raw.id));
      const fileName = this.asText(raw && (raw.fileName || raw.filename || raw.name));
      if (!documentId || !fileName) return;

      const rawSize = raw && (raw.fileSize !== undefined ? raw.fileSize : raw.size);
      const fileSize = this.normalizeFileSizeToMb(rawSize);

      items.push({ documentId, fileName, fileSize });
    };

    this.parseJsonArraySafe(row && row.anexosNS).forEach(pushNormalized);
    this.parseJsonArraySafe(row && row.anexosApoioTITT).forEach(pushNormalized);

    const uniqueById = {};
    const merged = items.filter((att) => {
      const key = this.asText(att && att.documentId);
      if (!key) return false;
      if (uniqueById[key]) return false;
      uniqueById[key] = true;
      return true;
    });

    try {
      await ui.attachments.render(target, {
        value: merged,
        emptyHtml: '<div class="py-2 text-sm text-gray-500">Nenhum documento anexado.</div>'
      });
    } catch (error) {
      target.html('<div class="py-2 text-sm text-gray-500">Não foi possível carregar anexos.</div>');
    }
  },

  renderRiskComplianceFromRow: function (row) {
    const root = this.getContainer();
    const matrix = root.find('#committee-risk-matrix').first();
    const list = root.find('#committee-risk-identified').first();
    if (!matrix.length && !list.length) return;

    const risks = this.parseTableJson(row && (row.tblRiscosIdentificadosTITT || row['tblRiscosIdentificadosTITT']))
      .map((item) => {
        return {
          title: this.asText(item && item.tituloRiscoTITT),
          description: this.asText(item && item.descricaoRiscoTITT),
          mitigation: this.asText(item && item.mitigacaoRiscoTITT),
          level: this.asText(item && item.nivelRiscoTITT),
          impact: this.asText(item && item.impactoRiscoTITT),
          probability: this.asText(item && item.probabilidadeRiscoTITT)
        };
      })
      .filter((risk) => risk.title || risk.description || risk.mitigation || risk.level || risk.impact || risk.probability);

    const legacyRisks = this.parseTableJson(row && row.tblRiscosDependenciasTITT)
      .map((item) => this.asText(item && item.riscoPotencialTITT))
      .filter(Boolean);

    const scoreFromLabel = (value) => {
      const normalized = this.asText(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (!normalized) return null;
      if (normalized === 'baixo' || normalized === 'baixa') return 1;
      if (normalized === 'medio' || normalized === 'media') return 2;
      if (normalized === 'alto' || normalized === 'alta') return 5;
      return null;
    };

    const mean = (values) => {
      const nums = Array.isArray(values) ? values.filter((n) => typeof n === 'number' && isFinite(n)) : [];
      if (!nums.length) return null;
      return nums.reduce((acc, n) => acc + n, 0) / nums.length;
    };

    const bucketFromMean = (avg) => {
      if (avg === null || avg === undefined || !isFinite(avg)) {
        return { label: 'Não informado', badgeClasses: 'bg-slate-100 border border-slate-200 text-slate-700', iconClass: 'fa-solid fa-circle-info text-slate-500' };
      }

      const candidates = [
        { score: 1, label: 'Baixo', badgeClasses: 'bg-green-100 border border-green-200 text-green-800', iconClass: 'fa-solid fa-shield text-green-700' },
        { score: 2, label: 'Médio', badgeClasses: 'bg-yellow-100 border border-yellow-300 text-yellow-800', iconClass: 'fa-solid fa-triangle-exclamation text-yellow-600' },
        { score: 5, label: 'Alto', badgeClasses: 'bg-red-100 border border-red-200 text-red-800', iconClass: 'fa-solid fa-triangle-exclamation text-red-700' }
      ];

      let best = candidates[0];
      let bestDiff = Math.abs(avg - best.score);
      for (let i = 1; i < candidates.length; i += 1) {
        const diff = Math.abs(avg - candidates[i].score);
        if (diff < bestDiff) {
          best = candidates[i];
          bestDiff = diff;
        }
      }
      return best;
    };

    const riskAvg = mean(risks.map((r) => scoreFromLabel(r.level)).filter((n) => n !== null));
    const impactAvg = mean(risks.map((r) => scoreFromLabel(r.impact)).filter((n) => n !== null));
    const probAvg = mean(risks.map((r) => scoreFromLabel(r.probability)).filter((n) => n !== null));

    const riskBucket = bucketFromMean(riskAvg);
    const impactBucket = bucketFromMean(impactAvg);
    const probBucket = bucketFromMean(probAvg);

    if (matrix.length) {
      matrix.html(`
        <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${this.escapeHtml(riskBucket.badgeClasses)}">
              <i class="${this.escapeHtml(riskBucket.iconClass)} mr-2"></i>Risco ${this.escapeHtml(riskBucket.label)}
            </span>
            <span class="text-sm text-gray-600">Probabilidade: <span class="font-semibold text-gray-900">${this.escapeHtml(probBucket.label)}</span></span>
            <span class="text-sm text-gray-400">•</span>
            <span class="text-sm text-gray-600">Impacto: <span class="font-semibold text-gray-900">${this.escapeHtml(impactBucket.label)}</span></span>
          </div>
          <span class="text-xs text-gray-500">Visão geral</span>
        </div>
      `);
    }

    if (list.length) {
      if (risks.length) {
        list.html(risks.map((risk) => {
          const levelBucket = bucketFromMean(scoreFromLabel(risk.level));
          const title = this.escapeHtml(risk.title || 'Risco');
          const desc = this.escapeHtml(risk.description);
          const miti = this.escapeHtml(risk.mitigation);

          return `
            <div class="p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="font-medium text-gray-900">${title}</h4>
                <span class="inline-flex items-center px-2 py-1 ${this.escapeHtml(levelBucket.badgeClasses)} text-xs font-medium rounded">${this.escapeHtml(levelBucket.label)}</span>
              </div>
              ${desc ? `<p class="text-sm text-gray-700 mt-2 whitespace-pre-line">${desc}</p>` : ''}
              ${miti ? `<p class="text-xs text-gray-600 mt-2 whitespace-pre-line"><strong>Mitigação:</strong> ${miti}</p>` : ''}
            </div>
          `;
        }).join(''));
      } else if (legacyRisks.length) {
        list.html(legacyRisks.map((text) => {
          return `
            <div class="p-4">
              <div class="flex items-start gap-3">
                <i class="fa-solid fa-triangle-exclamation text-yellow-600 mt-0.5"></i>
                <div class="text-sm text-gray-700 whitespace-pre-line">${this.escapeHtml(text)}</div>
              </div>
            </div>
          `;
        }).join(''));
      } else {
        list.html('<div class="p-4 text-sm text-gray-500">Nenhum risco identificado.</div>');
      }
    }
  },

  renderSidebarSkeleton: function () {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    const progressTarget = container.find('[data-component="progress-status"]').first();

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: 'N/A',
      title: 'N/A',
      requester: 'N/A',
      area: 'N/A',
      sponsor: 'N/A',
      attachmentsCount: 0,
      priority: { label: 'N/A', iconClass: 'fa-solid fa-star', badgeClasses: 'bg-gray-100 text-gray-800' },
      status: { label: 'N/A', iconClass: 'fa-solid fa-clock', badgeClasses: 'bg-gray-100 text-gray-800' }
    });

    ui.sidebar.renderProgress(progressTarget, {
      items: this.getProgressItems()
    });
  },

  renderSidebarFromRow: function (row) {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    const progressTarget = container.find('[data-component="progress-status"]').first();

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: this.asText(row && row.documentid) || 'N/A',
      title: this.asText(row && row.titulodoprojetoNS) || 'N/A',
      requester: 'N/A',
      area: this.asText(row && row.areaUnidadeNS) || 'N/A',
      sponsor: this.asText(row && row.patrocinadorNS) || 'N/A',
      attachmentsCount: this.countAttachments(row && row.anexosNS),
      priority: {
        label: this.getPriorityLabel(row && row.prioridadeNS) || 'N/A',
        iconClass: 'fa-solid fa-star',
        badgeClasses: this.getPriorityBadgeClasses(row && row.prioridadeNS)
      },
      status: {
        label: this.getEstadoProcessoLabel(row && row.estadoProcesso) || 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-yellow-100 text-yellow-800'
      }
    });

    ui.sidebar.renderProgress(progressTarget, {
      items: this.getProgressItems()
    });
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitação recebida', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Análise TI concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Triagem técnica concluída', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Decisão do comitê pendente', iconClass: 'fa-solid fa-exclamation-circle' }
    ];
  },

  getPriorityLabel: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'Crítico';
    if (normalized.indexOf('estrategico') !== -1) return 'Estratégico';
    if (normalized.indexOf('operacional') !== -1) return 'Operacional';
    return this.asText(priority);
  },

  getPriorityBadgeClasses: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'bg-red-100 text-red-800';
    if (normalized.indexOf('estrategico') !== -1) return 'bg-green-100 text-green-800';
    if (normalized.indexOf('operacional') !== -1) return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-800';
  },

  getEstadoProcessoLabel: function (estadoProcesso) {
    const raw = this.asText(estadoProcesso);
    if (!raw) return '';
    return raw.replace(/^\s*\d+\s*-\s*/i, '').trim() || raw;
  },

  countAttachments: function (value) {
    const text = this.asText(value);
    if (!text) return 0;

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.length;
    } catch (error) {}

    return text.split(/\r?\n|;|,/).map((item) => this.asText(item)).filter(Boolean).length;
  },

  fillCapFieldsFromRow: function (row) {
    const root = this.getContainer();

    const dt = this.normalizeDateTimeToInputValue(row && row.dataHoraCAP);
    if (dt) root.find('#cap-datetime').val(dt);

    root.find('#cap-notes').val(this.asText(row.anotacoesCAP));

    const participants = this.parseTableJson(row.tblParticipantesCAP)
      .map((item) => this.asText(item && item.nomeParticipanteCAP))
      .filter(Boolean)
      .map((name) => ({ id: `persisted:${name}:${Math.random().toString(16).slice(2)}`, name }));

    this._state.participants = participants;
    this.renderParticipants();

    // Ata: aqui só renderizamos itens locais (selecionados na tela).
    this._state.attachments = [];
    this.renderAttachmentsList();
  },

  validateCap: function () {
    const root = this.getContainer();
    const missing = [];

    const dt = this.asText(root.find('#cap-datetime').val());
    if (!dt) missing.push('Data/Hora da Reunião');

    const participants = Array.isArray(this._state.participants) ? this._state.participants : [];
    const hasOne = participants.some((p) => p && this.asText(p.name));
    if (!hasOne) missing.push('Participantes (mínimo 1)');

    return missing;
  },

  addParticipantFromInput: function () {
    const root = this.getContainer();
    const input = root.find('#cap-participant-input').first();
    if (!input.length) return;

    const name = this.asText(input.val());
    if (!name) {
      this.showToast('Participante', 'Informe o nome do participante.', 'warning');
      input.trigger('focus');
      return;
    }

    const current = Array.isArray(this._state.participants) ? this._state.participants.slice() : [];
    current.push({
      id: `local:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      name: name
    });
    this._state.participants = current;
    input.val('');
    this.renderParticipants();
  },

  removeParticipant: function (id) {
    const current = Array.isArray(this._state.participants) ? this._state.participants : [];
    this._state.participants = current.filter((p) => String(p && p.id) !== String(id));
    this.renderParticipants();
  },

  renderParticipants: function () {
    const root = this.getContainer();
    const list = root.find('#cap-participants').first();
    if (!list.length) return;

    const items = Array.isArray(this._state.participants) ? this._state.participants : [];
    if (!items.length) {
      list.html('<div class="text-sm text-gray-500">Nenhum participante adicionado.</div>');
      return;
    }

    list.html(items.map((p) => {
      const safeName = this.escapeHtml(p.name);
      const safeId = this.escapeHtml(p.id);
      return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-bevap-navy text-white">
          ${safeName}
          <button type="button" data-action="remove-cap-participant" data-participant-id="${safeId}" class="ml-2 hover:text-red-300" aria-label="Remover participante" title="Remover">
            <i class="fa-solid fa-times text-xs"></i>
          </button>
        </span>
      `;
    }).join(''));
  },

  addAttachments: function (fileList) {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;

    const current = Array.isArray(this._state.attachments) ? this._state.attachments.slice() : [];
    files.forEach((file) => {
      current.push({
        id: `local:${Date.now()}:${Math.random().toString(16).slice(2)}`,
        file: file,
        persisted: false
      });
    });
    this._state.attachments = current;
    this.renderAttachmentsList();
  },

  removeAttachment: function (id) {
    const current = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    this._state.attachments = current.filter((att) => String(att && att.id) !== String(id));
    this.renderAttachmentsList();
  },

  getAttachmentIconClass: function (fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  formatAttachmentSize: function (bytes) {
    const size = Number(bytes);
    if (!isFinite(size) || size <= 0) return '';
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  },

  renderAttachmentsList: function () {
    const root = this.getContainer();
    const list = root.find('#cap-ata-list').first();
    if (!list.length) return;

    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    if (!items.length) {
      list.html('<div class="text-sm text-gray-500">Nenhum anexo selecionado.</div>');
      return;
    }

    list.html(items.map((att) => {
      const safeName = this.escapeHtml(att.file ? (att.file.name || '') : (att.fileName || 'arquivo'));
      const sizeLabel = att.file ? this.escapeHtml(this.formatAttachmentSize(att.file.size || 0)) : '';
      const iconClass = this.escapeHtml(this.getAttachmentIconClass(att.file ? att.file.name : att.fileName));
      const safeId = this.escapeHtml(att.id);

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid ${iconClass} text-xl mr-3"></i>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 truncate">${safeName}</div>
              <div class="text-xs text-gray-500">${sizeLabel || ''}</div>
            </div>
          </div>
          <button type="button" data-action="remove-cap-attachment" data-attachment-id="${safeId}" class="text-red-500 hover:text-red-700" title="Remover">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    }).join(''));
  },

  readFileAsBase64: function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = String(event.target && event.target.result ? event.target.result : '');
        const base64 = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Falha ao ler anexo'));
      reader.readAsDataURL(file);
    });
  },

  collectAttachmentsPayload: async function () {
    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    const localItems = items.filter((att) => att && att.file && !att.persisted);
    if (!localItems.length) return [];

    const payload = await Promise.all(localItems.map(async (att) => {
      const file = att.file;
      const content = await this.readFileAsBase64(file);
      return {
        fileName: this.asText(file && file.name),
        fileContent: this.asText(content),
        fileSize: String(file && file.size ? file.size : '').trim()
      };
    }));

    return payload.filter((item) => item.fileName && item.fileContent);
  },

  collectCommitteeTaskFields: function () {
    const root = this.getContainer();
    const inputDateTime = this.asText(root.find('#cap-datetime').val());

    const cardData = {
      dataHoraCAP: this.formatDateTimeForCard(inputDateTime),
      anotacoesCAP: this.asText(root.find('#cap-notes').val())
    };

    const participants = Array.isArray(this._state.participants) ? this._state.participants : [];
    const names = participants.map((p) => this.asText(p && p.name)).filter(Boolean);
    names.forEach((name, index) => {
      cardData[`nomeParticipanteCAP___${index + 1}`] = name;
    });

    return Object.keys(cardData).map((fieldName) => {
      return { name: fieldName, value: cardData[fieldName] };
    });
  },

  createActionLoading: function () {
    if (typeof modalLoadingService !== 'undefined' && modalLoadingService.show) {
      return modalLoadingService.show({
        title: 'Movendo solicitação',
        message: 'Aguarde enquanto a tarefa é enviada ao Fluig...'
      });
    }

    const legacyLoading = FLUIGC.loading(this.getContainer());
    legacyLoading.show();

    return {
      hide: function () { legacyLoading.hide(); },
      updateMessage: function () {}
    };
  },

  waitForUiPaint: function () {
    return new Promise((resolve) => {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => setTimeout(resolve, 0));
        return;
      }
      setTimeout(resolve, 0);
    });
  },

  resolveProcessInstanceId: async function () {
    if (this._state.processInstanceId) {
      return this._state.processInstanceId;
    }

    if (!this._state.documentId) {
      throw new Error('Não foi possível identificar a solicitação atual');
    }

    const processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(this._state.documentId);
    this._state.processInstanceId = this.asText(processInstanceId);
    return this._state.processInstanceId;
  },

  handleTaskAction: async function (config) {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Validando dados do Comitê...');
      await this.waitForUiPaint();

      const missing = this.validateCap();
      if (missing && missing.length) {
        this.showToast('Campos obrigatórios', `Preencha: ${missing.join(' | ')}`, 'warning');
        return;
      }

      const processInstanceId = await this.resolveProcessInstanceId();
      const choosedState = config && config.choosedState !== null && config.choosedState !== undefined
        ? String(config.choosedState).trim()
        : '';

      if (!choosedState) {
        throw new Error('Número da atividade destino é obrigatório');
      }

      const taskFields = this.collectCommitteeTaskFields();
      const decisionValue = this.asText(config && config.decisionValue);
      const justification = this.asText(config && config.justification);

      if (config && config.requireJustification === true && !justification) {
        this.showToast('Justificativa', 'Informe a justificativa para continuar.', 'warning');
        return;
      }

      if (decisionValue) {
        taskFields.push({ name: 'decisaocomite1', value: decisionValue });
        if (decisionValue === 'aprovado') {
          taskFields.push({ name: 'justificativacomite1', value: '' });
        } else {
          taskFields.push({ name: 'justificativacomite1', value: justification });
        }
      }

      if (config && config.modalId) {
        this.closeModal(config.modalId);
      }
      const attachments = await this.collectAttachmentsPayload();

      loading.updateMessage('Enviando movimentação para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: choosedState,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos',
        comments: `Comitê: ${this.asText(config && config.action)}`,
        attachments: attachments
      }, taskFields);

      this.showToast('Sucesso', `Ação registrada: ${this.asText(config && config.action)}.`, 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[committeeApproval] Error moving task:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Não foi possível movimentar a solicitação.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  showToast: function (title, message, type) {
    const toast = this.getContainer().find('#toast');
    const icon = this.getContainer().find('#toast-icon');
    const toastTitle = this.getContainer().find('#toast-title');
    const toastMessage = this.getContainer().find('#toast-message');
    if (!toast.length || !icon.length || !toastTitle.length || !toastMessage.length) return;

    const config = {
      success: { icon: 'fa-solid fa-check-circle text-bevap-green', border: 'border-bevap-green' },
      error: { icon: 'fa-solid fa-times-circle text-red-500', border: 'border-red-500' },
      warning: { icon: 'fa-solid fa-exclamation-triangle text-bevap-gold', border: 'border-bevap-gold' },
      info: { icon: 'fa-solid fa-info-circle text-blue-500', border: 'border-blue-500' }
    };

    const finalType = config[type] ? type : 'info';
    icon.attr('class', `${config[finalType].icon} text-2xl mr-3`);
    toast.attr('class', `fixed top-20 right-4 z-50 bg-white rounded-lg shadow-xl border-l-4 p-4 max-w-md ${config[finalType].border}`);
    toastTitle.text(title || 'Informação');
    toastMessage.text(message || '');
    toast.removeClass('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
      this._toastTimer = null;
    }, 3500);
  },

  normalizeDateTimeToInputValue: function (rawText) {
    const text = this.asText(rawText);
    if (!text) return '';

    // Already compatible with <input type="datetime-local">
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) {
      return text;
    }

    // ISO-like with a space separator (optionally with seconds)
    const isoSpace = text.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2})?$/);
    if (isoSpace) {
      return `${isoSpace[1]}T${isoSpace[2]}`;
    }

    // BR format: DD/MM/YYYY - HH:mm(:ss)
    const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*|\s+)(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (br) {
      return `${br[3]}-${br[2]}-${br[1]}T${br[4]}:${br[5]}`;
    }

    // Fallback: try Date parsing (handles full ISO timestamps)
    try {
      const parsed = new Date(text);
      if (!isNaN(parsed.getTime())) {
        return this.buildDateTimeLocalValue(parsed);
      }
    } catch (e) {}

    return '';
  },

  formatDateTimeForCard: function (inputValue) {
    const text = this.asText(inputValue);
    if (!text) return '';

    // datetime-local typically returns YYYY-MM-DDTHH:mm
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (iso) {
      const seconds = iso[6] ? iso[6] : '00';
      return `${iso[3]}/${iso[2]}/${iso[1]} - ${iso[4]}:${iso[5]}:${seconds}`;
    }

    // If user agent returns something else, persist as-is
    return text;
  },

  buildDateTimeLocalValue: function (date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const yyyy = String(date.getFullYear());
    const mm = this.pad2(date.getMonth() + 1);
    const dd = this.pad2(date.getDate());
    const hh = this.pad2(date.getHours());
    const mi = this.pad2(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  },

  pad2: function (value) {
    const n = Number(value);
    if (!isFinite(n)) return '00';
    return String(n).padStart(2, '0');
  },

  parseTableJson: function (value) {
    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  parseJsonArraySafe: function (value) {
    if (Array.isArray(value)) return value;
    const text = this.asText(value);
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  parseLegacyRows: function (textValue) {
    const text = this.asText(textValue);
    if (!text) return [];
    return text
      .split(/\r?\n/)
      .map((item) => this.asText(item))
      .filter(Boolean);
  },

  collectIndexedFieldValues: function (row, fieldBaseName) {
    const base = this.asText(fieldBaseName);
    if (!base) return [];

    const data = row && typeof row === 'object' ? row : {};
    const prefix = `${base}___`;
    const items = [];

    Object.keys(data).forEach((key) => {
      if (key.indexOf(prefix) !== 0) return;
      const idx = Number(String(key).slice(prefix.length));
      if (!Number.isInteger(idx) || idx <= 0) return;
      const value = this.asText(data[key]);
      if (!value) return;
      items.push({ idx, value });
    });

    items.sort((a, b) => a.idx - b.idx);
    return items.map((item) => item.value);
  },

  parseBooleanLike: function (value) {
    if (value === true) return true;
    if (value === false) return false;

    const normalized = this.asText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized) return null;
    if (['1', 'true', 'sim', 's', 'yes', 'on'].indexOf(normalized) >= 0) return true;
    if (['0', 'false', 'nao', 'n', 'no', 'off'].indexOf(normalized) >= 0) return false;
    return null;
  },

  normalizeFileSizeToMb: function (rawSize) {
    if (rawSize === null || rawSize === undefined || rawSize === '') return undefined;

    const num = Number(rawSize);
    if (!isFinite(num) || num <= 0) return undefined;

    // Heurística: anexosNS usa MB (float). anexosApoioTITT pode vir em bytes.
    // Se for muito grande, trata como bytes e converte para MB.
    if (num > 2048) {
      return Number((num / 1024 / 1024).toFixed(3));
    }

    return num;
  },

  escapeHtml: function (value) {
    return this.asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  }
};
