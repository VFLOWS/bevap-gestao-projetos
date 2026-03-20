const evaluateProjectController = {
  _eventNamespace: '.evaluateProject',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _solicitationFields: [
    'documentid',
    'estadoProcesso',
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
    'tblRiscosIniciaisNS.riscoPotencialNS',
    'tblStakeholdersNS.valorstakeholdersNS',
    'tblObjetivosEstrategicosNS.descricaoobjetivoNS',
    'visibilidadetecnicaAPTI',
    'alternativasconsideradasAPTI',
    'esforcoestimadohorasAPTI',
    'esforcoestimadopontosAPTI',
    'dependenciastecnicasAPTI',
    'observacoesdaanaliseAPTI',
    'objetivoClaramenteDefinidoAPTI',
    'escopoBemDelimitadoAPTI',
    'documentacaoTecnicaAdeqAPTI',
    'patrocinadoridentificadoAPTI',
    'alinhEstratConfAPTI',
    'recursosTecDispAPTI',
    'anexosessenciaispresentesAPTI',
    'tblRiscosIdentificadosAPTI.nivelRiscoAPTI',
    'tblRiscosIdentificadosAPTI.descricaoRiscoAPTI'
  ],
  _headerBackup: null,
  _toastTimer: null,
  _tabsRoot: null,
  _uiComponentsKey: 'gpUiComponents',
  _approvalTabComponentsKey: 'gpApprovalTabComponents',
  _currentDocumentId: null,
  _currentEstadoProcesso: null,
  _currentProcessInstanceId: null,
  _isSubmitting: false,

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();

    const rawDocumentId = params && (params.documentId || params.documentid);
    const rawEstadoProcesso = params && (params.estadoProcesso || params.estadoprocesso);
    const rawProcessInstanceId = params && (params.processInstanceId || params.processinstanceid);

    this._currentDocumentId = rawDocumentId ? String(rawDocumentId) : null;
    this._currentEstadoProcesso = rawEstadoProcesso ? String(rawEstadoProcesso) : null;
    this._currentProcessInstanceId = rawProcessInstanceId ? String(rawProcessInstanceId) : null;

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

    this._currentDocumentId = null;
    this._currentEstadoProcesso = null;
    this._currentProcessInstanceId = null;
    this._isSubmitting = false;
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
      titleEl.text('TI - Evaluate Project');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Evaluate</span>
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
      this.removeRiskItem(event.currentTarget);
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
      this.handleTaskAction({
        modalId: 'modal-return',
        choosedState: 14,
        decisionField: 'decisaoAvaliarProjeto',
        decisionValue: 'correcao',
        successMessage: 'Projeto devolvido para correcao'
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-reject"]', (event) => {
      event.preventDefault();
      this.handleTaskAction({
        modalId: 'modal-reject',
        choosedState: 14,
        decisionField: 'decisaoAvaliarProjeto',
        decisionValue: 'cancelado',
        successMessage: 'Projeto marcado como nao continuidade'
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-approve"]', (event) => {
      event.preventDefault();
      this.handleTaskAction({
        modalId: 'approve-modal',
        choosedState: 14,
        decisionField: 'decisaoAvaliarProjeto',
        decisionValue: 'aprovado',
        successMessage: 'Encaminhado para aprovacao do projeto'
      });
    });

    container.on(`click${ns}`, '[data-action="save-draft"]', (event) => {
      event.preventDefault();
      this.saveDraft();
    });

    container.on(`click${ns}`, '[data-action="view-attachment"]', (event) => {
      event.preventDefault();
      const url = this.asText($(event.currentTarget).attr('data-url'));
      const fileName = this.asText($(event.currentTarget).attr('data-file-name'));
      if (!url) {
        this.showToast('Nao foi possivel abrir o anexo', 'error');
        return;
      }

      if (fileName) {
        this.showToast(`Abrindo ${fileName}...`, 'success');
      }

      window.open(url, '_blank', 'noopener');
    });

    container.on(`click${ns}`, '[data-action="download-attachment"]', (event) => {
      event.preventDefault();
      const url = this.asText($(event.currentTarget).attr('data-url'));
      const fileName = this.asText($(event.currentTarget).attr('data-file-name'));
      if (!url) {
        this.showToast('Nao foi possivel baixar o anexo', 'error');
        return;
      }

      if (fileName) {
        this.showToast(`Baixando ${fileName}...`, 'success');
      }

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    });

    container.on(`click${ns}`, '[data-action="show-timeline"]', (event) => {
      event.preventDefault();
      this.showToast('Linha do tempo em desenvolvimento', 'success');
    });

    container.on(`click${ns}`, '[data-action="show-attachments"]', (event) => {
      event.preventDefault();
      this.openAttachmentsFromSidebar();
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

  getApprovalTabComponents: function () {
    if (typeof $ === 'undefined') return null;
    const components = $(document).data(this._approvalTabComponentsKey);
    return components && typeof components === 'object' ? components : null;
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

        if (tabName === 'solicitacao') {
          this.renderSolicitacaoHistoryTab();
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
      code: '-',
      title: '-',
      requester: '-',
      area: '-',
      sponsor: '-',
      attachmentsCount: 0,
      priority: { label: '-', iconClass: 'fa-solid fa-star', badgeClasses: 'bg-gray-100 text-gray-800' },
      status: { label: '-', iconClass: 'fa-solid fa-clock', badgeClasses: 'bg-gray-100 text-gray-800' }
    });

    ui.sidebar.renderProgress(progressTarget, {
      items: [
        { style: 'success', label: 'Solicitacao completa', iconClass: 'fa-solid fa-check-circle' },
        { style: 'warning', label: 'Analise tecnica pendente', iconClass: 'fa-solid fa-exclamation-circle' }
      ]
    });
  },

  ensureDefaultRiskItem: function () {
    const riskContainer = this.getContainer().find('#risks-container');
    if (!riskContainer.length) return;

    if (riskContainer.children().length === 0) {
      this.addRiskItem();
    }
  },

  getRiskItemMarkup: function () {
    return `
      <div class="md:col-span-3">
        <label class="block text-xs font-medium text-gray-600 mb-1">Nivel de Risco</label>
        <select data-field="nivelRiscoAPTI" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent transition-all text-sm">
          <option value="" selected disabled>Selecione</option>
          <option value="baixo">Baixo</option>
          <option value="medio">Medio</option>
          <option value="alto">Alto</option>
        </select>
      </div>
      <div class="md:col-span-8">
        <label class="block text-xs font-medium text-gray-600 mb-1">Descricao do Risco</label>
        <textarea data-field="descricaoRiscoAPTI" rows="2" placeholder="Descreva o risco tecnico identificado..." class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent transition-all resize-none text-sm"></textarea>
      </div>
      <div class="md:col-span-1 flex md:justify-end md:pt-6">
        <button type="button" data-action="remove-risk" class="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors" title="Remover risco">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
  },

  addRiskItem: function () {
    const container = document.getElementById('risks-container');
    if (!container) return;

    const riskItem = document.createElement('div');
    riskItem.className = 'risk-item grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border border-gray-200 rounded-lg bg-gray-50';
    riskItem.innerHTML = this.getRiskItemMarkup();
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

  showToast: function (message, type) {
    const root = this.getContainer();
    const toast = root.find('#toast');
    const messageEl = root.find('#toast-message');
    const icon = toast.find('i').first();
    if (!toast.length || !messageEl.length || !icon.length) return;

    const styleMap = {
      success: { iconClass: 'fa-check-circle text-bevap-green', borderClass: 'border-bevap-green' },
      error: { iconClass: 'fa-triangle-exclamation text-red-500', borderClass: 'border-red-500' }
    };
    const presentation = styleMap[type || 'success'] || styleMap.success;

    messageEl.text(message || 'Acao realizada com sucesso');
    icon.attr('class', `fa-solid ${presentation.iconClass} text-xl mr-3`);
    toast.attr('class', `hidden fixed top-20 right-4 bg-white shadow-lg rounded-lg p-4 z-50 border-l-4 ${presentation.borderClass}`);
    toast.removeClass('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
      this._toastTimer = null;
    }, 3000);
  },

  updateChecklistProgress: function () {
    const root = this.getContainer().find('#tab-content-checklist');
    if (!root.length) return;

    const checkboxes = root.find('.apti-checklist-item').length
      ? root.find('.apti-checklist-item')
      : root.find('input[type="checkbox"]');
    const checked = checkboxes.filter(':checked').length;
    const percentage = checkboxes.length ? Math.round((checked / checkboxes.length) * 100) : 0;

    this.getContainer().find('#checklist-percentage').text(percentage + '%');
    this.getContainer().find('#checklist-progress').css('width', percentage + '%');
  },

  resetAllFields: function () {
    const root = this.getContainer();
    if (!root || !root.length) return;

    root.find('input, textarea, select').each(function () {
      const $el = $(this);
      const type = String($el.attr('type') || '').toLowerCase();

      if (type === 'checkbox' || type === 'radio') {
        $el.prop('checked', false);
        return;
      }

      $el.val('');
    });

    if (root.find('#technical-visibility-viable').length) {
      root.find('#technical-visibility-viable').prop('checked', true);
    } else {
      root.find('input[name="viabilidade"]').first().prop('checked', true);
    }
    root.find('#risks-container').empty();

    const riscosList = document.getElementById('riscos-iniciais-list');
    if (riscosList) riscosList.innerHTML = '<div class="text-sm text-gray-500">-</div>';

    const stakeholdersList = document.getElementById('stakeholders-list');
    if (stakeholdersList) stakeholdersList.innerHTML = '<div class="text-sm text-gray-500">-</div>';

    const attachmentsList = document.getElementById('attachments-list');
    if (attachmentsList) attachmentsList.innerHTML = '<div class="py-2 text-sm text-gray-500">—</div>';

    this.renderAlinhamentoBevap(null);
    this.autoResizeSolicitacaoTextareas();
    this.updateChecklistProgress();
  },

  loadSolicitationFromDataset: async function () {
    if (!this._currentDocumentId) {
      return;
    }

    try {
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
      this.fillEvaluateFieldsFromRow(row);
      this.renderSidebarFromRow(row);
      this.updateApproveModalProject(row);
      await this.renderSolicitacaoHistoryTab();
    } catch (error) {
      console.error('[evaluateProject] Error loading solicitation:', error);
    }
  },

  renderSolicitacaoHistoryTab: async function () {
    const target = this.getContainer().find('[data-component="tab-solicitacao-history"]').first();
    if (!target.length) return;

    const components = this.getApprovalTabComponents();
    const component = components && components.solicitationHistory;
    if (!component || typeof component.render !== 'function') {
      target.html('<div class="text-sm text-red-600">Componente de solicitacao indisponivel.</div>');
      return;
    }

    if (!this._currentDocumentId) {
      try {
        const emptyHtml = await component.render({ documentId: '' });
        target.html(emptyHtml);
      } catch (error) {
        target.html('<div class="text-sm text-gray-500">Selecione uma solicitacao para visualizar o historico.</div>');
      }
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteudo...</div>');

    try {
      if (typeof component.renderInto === 'function') {
        await component.renderInto(target, { documentId: this._currentDocumentId });
      } else {
        const html = await component.render({ documentId: this._currentDocumentId });
        target.html(html);
        if (typeof component.mountAttachments === 'function') {
          component.mountAttachments(target, { documentId: this._currentDocumentId });
        }
      }
      this.autoResizeSolicitacaoTextareas();
    } catch (error) {
      console.error('[evaluateProject] Error rendering solicitationHistory:', error);
      target.html('<div class="text-sm text-red-600">Nao foi possivel carregar a solicitacao.</div>');
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
    setVal('alinhadobevapNS', row.alinhadobevapNS);
    setVal('prioridadeNS', row.prioridadeNS);
    setVal('observacoesadicionaisNS', row.observacoesadicionaisNS);
    setVal('tblRiscosIniciaisNS', row.tblRiscosIniciaisNS);
    setVal('tblStakeholdersNS', row.tblStakeholdersNS);
    setVal('tblObjetivosEstrategicosNS', row.tblObjetivosEstrategicosNS);

    this.renderRiscosIniciais(row.tblRiscosIniciaisNS);
    this.renderStakeholders(row.tblStakeholdersNS);
    this.renderAttachments('anexosNS', row.anexosNS);
    this.renderAlinhamentoBevap(row.alinhadobevapNS);
    this.autoResizeSolicitacaoTextareas();
  },

  fillEvaluateFieldsFromRow: function (row) {
    const root = this.getContainer();
    const setTextarea = (selector, value, blockIndex) => {
      const field = root.find(selector).first();
      if (field.length) {
        field.val(this.asText(value));
        return;
      }

      const fallbackField = this.getAnalysisFieldBlocks().eq(blockIndex).find('textarea').first();
      if (fallbackField.length) {
        fallbackField.val(this.asText(value));
      }
    };
    const setNumber = (selector, value, inputIndex) => {
      const field = root.find(selector).first();
      if (field.length) {
        field.val(this.asText(value));
        return;
      }

      const fallbackField = this.getAnalysisFieldBlocks()
        .eq(2)
        .find('input[type="number"]')
        .eq(inputIndex || 0);
      if (fallbackField.length) {
        fallbackField.val(this.asText(value));
      }
    };

    root.find('input[name="viabilidade"]').prop('checked', false)
      .filter(`[value="${this.asText(row.visibilidadetecnicaAPTI)}"]`).prop('checked', true);
    setTextarea('#alternatives-considered-input', row.alternativasconsideradasAPTI, 1);
    setNumber('#estimated-hours-input', row.esforcoestimadohorasAPTI, 0);
    setNumber('#estimated-points-input', row.esforcoestimadopontosAPTI, 1);
    setTextarea('#technical-dependencies-input', row.dependenciastecnicasAPTI, 4);
    setTextarea('#analysis-observations-input', row.observacoesdaanaliseAPTI, 5);

    this.setChecklistFieldValue('#objective-defined-check', row.objetivoClaramenteDefinidoAPTI, 0);
    this.setChecklistFieldValue('#scope-delimited-check', row.escopoBemDelimitadoAPTI, 1);
    this.setChecklistFieldValue('#documentation-adequate-check', row.documentacaoTecnicaAdeqAPTI, 2);
    this.setChecklistFieldValue('#sponsor-identified-check', row.patrocinadoridentificadoAPTI, 3);
    this.setChecklistFieldValue('#strategic-alignment-check', row.alinhEstratConfAPTI, 4);
    this.setChecklistFieldValue('#technical-resources-check', row.recursosTecDispAPTI, 5);
    this.setChecklistFieldValue('#essential-attachments-check', row.anexosessenciaispresentesAPTI, 6);
    this.renderIdentifiedRisks(row.tblRiscosIdentificadosAPTI);
    this.updateChecklistProgress();
  },

  setChecklistFieldValue: function (selector, value, index) {
    const shouldCheck = this.parseBooleanLike(value) === true;
    const field = this.getContainer().find(selector).first();
    if (field.length) {
      field.prop('checked', shouldCheck);
      return;
    }

    const fallbackField = this.getContainer().find('#tab-content-checklist input[type="checkbox"]').eq(index);
    if (fallbackField.length) {
      fallbackField.prop('checked', shouldCheck);
    }
  },

  renderIdentifiedRisks: function (value) {
    const container = this.getContainer().find('#risks-container');
    if (!container.length) return;

    const risks = this.parseTableJson(value);
    container.empty();

    if (!risks.length) {
      this.ensureDefaultRiskItem();
      return;
    }

    risks.forEach((risk) => {
      const item = document.createElement('div');
      item.className = 'risk-item grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border border-gray-200 rounded-lg bg-gray-50';
      item.innerHTML = this.getRiskItemMarkup();
      container.get(0).appendChild(item);

      const row = $(item);
      row.find('[data-field="nivelRiscoAPTI"]').val(this.asText(risk && risk.nivelRiscoAPTI));
      row.find('[data-field="descricaoRiscoAPTI"]').val(this.asText(risk && risk.descricaoRiscoAPTI));
    });
  },

  openAttachmentsFromSidebar: async function () {
    const ui = this.getUiComponents();
    if (ui && ui.tabs && this._tabsRoot) {
      ui.tabs.setActive(this._tabsRoot, 'solicitacao');
    }

    await this.renderSolicitacaoHistoryTab();

    const target = this.getContainer().find('[data-tab-panel="solicitacao"] [data-gp-attachments]').first();
    const fallback = this.getContainer().find('[data-component="tab-solicitacao-history"]').first();
    const scrollTarget = target.length ? target : fallback;
    if (!scrollTarget.length) return;

    const el = scrollTarget.get(0);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  renderAttachments: function (fieldName, rawValue) {
    const list = this.getContainer().find('#attachments-list').first();
    if (!list.length) return;

    const ui = this.getUiComponents();
    if (ui && ui.attachments && typeof ui.attachments.render === 'function') {
      ui.attachments.render(list, {
        fieldName: this.asText(fieldName) || 'anexosNS',
        value: rawValue
      });
      return;
    }

    list.html('<div class="py-2 text-sm text-gray-500">—</div>');
  },

  renderSidebarFromRow: function (row) {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const summaryTarget = this.getContainer().find('[data-component="project-summary"]').first();
    if (!summaryTarget.length) return;

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: this.asText(row.documentid) || '-',
      title: row.titulodoprojetoNS || '-',
      requester: '-',
      area: row.areaUnidadeNS || '-',
      sponsor: row.patrocinadorNS || '-',
      attachmentsCount: this.countAttachments(row.anexosNS),
      priority: {
        label: this.getPriorityLabel(row.prioridadeNS) || '-',
        iconClass: 'fa-solid fa-star',
        badgeClasses: this.getPriorityBadgeClasses(row.prioridadeNS) || 'bg-gray-100 text-gray-800'
      },
      status: {
        label: this.getEstadoProcessoLabel(row.estadoProcesso) || '-',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-yellow-100 text-yellow-800'
      }
    });
  },

  updateApproveModalProject: function (row) {
    const label = this.getContainer().find('#approve-project-label');
    if (!label.length) return;

    const documentId = this.asText(row && row.documentid);
    const title = this.asText(row && row.titulodoprojetoNS);
    const parts = [];

    if (documentId) parts.push(documentId);
    if (title) parts.push(title);
    label.text(parts.length ? parts.join(' - ') : 'Projeto selecionado');
  },

  getPriorityBadgeClasses: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'bg-red-100 text-red-800';
    if (normalized.indexOf('estrategico') !== -1) return 'bg-yellow-100 text-yellow-800';
    if (normalized.indexOf('operacional') !== -1) return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-800';
  },

  getEstadoProcessoLabel: function (estadoProcesso) {
    const raw = this.asText(estadoProcesso);
    if (!raw) return '';
    return raw.replace(/^\s*\d+\s*-\s*/i, '').trim() || raw;
  },

  autoResizeSolicitacaoTextareas: function () {
    const root = this.getContainer().find('#tab-content-solicitacao');
    if (!root.length) return;

    root.find('textarea[readonly]').each(function () {
      this.style.overflow = 'hidden';
      this.style.height = '0px';
      this.style.height = Math.max(this.scrollHeight, 24) + 'px';
    });
  },

  getPriorityLabel: function (priority) {
    const raw = this.asText(priority);
    const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'Critico';
    if (normalized.indexOf('estrategico') !== -1) return 'Estrategico';
    if (normalized.indexOf('operacional') !== -1) return 'Operacional';
    return raw || '';
  },

  renderRiscosIniciais: function (tblRiscosIniciaisNS) {
    const root = document.getElementById('riscos-iniciais-list');
    if (!root) return;

    const risks = this.parseTableJson(tblRiscosIniciaisNS)
      .map((item) => this.asText(item && item.riscoPotencialNS))
      .filter(Boolean);

    if (!risks.length) {
      root.innerHTML = '<div class="text-sm text-gray-500">-</div>';
      return;
    }

    root.innerHTML = risks.map((risk) => `
      <div class="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <i class="fa-solid fa-triangle-exclamation text-yellow-600 mt-0.5"></i>
        <span class="text-sm text-gray-700">${this.escapeHtml(risk)}</span>
      </div>
    `).join('');
  },

  renderStakeholders: function (tblStakeholdersNS) {
    const root = document.getElementById('stakeholders-list');
    if (!root) return;

    const stakeholders = this.parseTableJson(tblStakeholdersNS)
      .map((item) => this.asText(item && item.valorstakeholdersNS))
      .filter(Boolean);

    if (!stakeholders.length) {
      root.innerHTML = '<div class="text-sm text-gray-500">-</div>';
      return;
    }

    root.innerHTML = stakeholders.map((name) => `
      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-bevap-navy text-white">
        ${this.escapeHtml(name)}
      </span>
    `).join('');
  },

  renderAlinhamentoBevap: function (rawValue) {
    const container = this.getContainer();
    const banner = container.find('#alinhamento-bevap-banner');
    const icon = container.find('#alinhamento-bevap-icon');
    const text = container.find('#alinhamento-bevap-text');
    if (!banner.length || !icon.length || !text.length) return;

    const isAligned = this.parseBooleanLike(rawValue) === true;
    banner.removeClass('border-green-200 bg-green-50 border-red-200 bg-red-50 border-gray-200 bg-gray-50');
    banner.addClass(isAligned ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50');
    icon.attr('class', `fa-solid fa-circle-info mr-2 ${isAligned ? 'text-bevap-green' : 'text-red-600'}`);
    text.attr('class', `text-sm font-medium ${isAligned ? 'text-bevap-green' : 'text-red-700'}`);
    text.text(isAligned ? 'Alinhado aos objetivos estrategicos BEVAP' : 'Nao alinhado aos objetivos estrategicos BEVAP');
  },

  createActionLoading: function () {
    if (typeof modalLoadingService !== 'undefined' && modalLoadingService.show) {
      return modalLoadingService.show({
        title: 'Movendo solicitacao',
        message: 'Aguarde enquanto a tarefa e enviada ao Fluig...'
      });
    }

    const legacyLoading = FLUIGC.loading(this.getContainer());
    legacyLoading.show();

    return {
      hide: function () {
        legacyLoading.hide();
      },
      updateMessage: function () {}
    };
  },

  waitForUiPaint: function () {
    return new Promise((resolve) => {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          setTimeout(resolve, 0);
        });
        return;
      }

      setTimeout(resolve, 0);
    });
  },

  getBooleanFieldValue: function (selector) {
    return this.getContainer().find(selector).is(':checked') ? 'true' : 'false';
  },

  getAnalysisFieldBlocks: function () {
    return this.getContainer().find('#tab-content-analise-tecnica .space-y-5 > div');
  },

  getAnalysisFieldValue: function (config) {
    const root = this.getContainer();
    if (config.selector) {
      const directField = root.find(config.selector).first();
      if (directField.length) {
        return this.asText(directField.val());
      }
    }

    const block = this.getAnalysisFieldBlocks().eq(config.blockIndex);
    if (!block.length) return '';

    if (config.type === 'radio') {
      return this.asText(block.find(config.fallbackSelector || 'input[type="radio"]:checked').first().val());
    }

    if (config.type === 'numberGroup') {
      return this.asText(block.find('input[type="number"]').eq(config.inputIndex || 0).val());
    }

    return this.asText(block.find(config.fallbackSelector || 'textarea').first().val());
  },

  getChecklistBooleanValue: function (selector, index) {
    const root = this.getContainer();
    const directField = root.find(selector).first();
    if (directField.length) {
      return directField.is(':checked') ? 'true' : 'false';
    }

    const fallbackField = root.find('#tab-content-checklist input[type="checkbox"]').eq(index);
    return fallbackField.length && fallbackField.is(':checked') ? 'true' : 'false';
  },

  collectRiskRows: function () {
    return this.getContainer().find('#risks-container .risk-item').map((index, element) => {
      const row = $(element);
      return {
        level: this.asText(row.find('[data-field="nivelRiscoAPTI"]').val()),
        description: this.asText(row.find('[data-field="descricaoRiscoAPTI"]').val())
      };
    }).get().filter((item) => item.level || item.description);
  },

  collectEvaluateTaskFields: function (decisionField, decisionValue) {
    const fieldMap = {
      visibilidadetecnicaAPTI: this.getAnalysisFieldValue({
        selector: 'input[name="technical-visibility"]:checked',
        blockIndex: 0,
        type: 'radio',
        fallbackSelector: 'input[name="viabilidade"]:checked'
      }),
      alternativasconsideradasAPTI: this.getAnalysisFieldValue({
        selector: '#alternatives-considered-input',
        blockIndex: 1,
        fallbackSelector: 'textarea'
      }),
      esforcoestimadohorasAPTI: this.getAnalysisFieldValue({
        selector: '#estimated-hours-input',
        blockIndex: 2,
        type: 'numberGroup',
        inputIndex: 0
      }),
      esforcoestimadopontosAPTI: this.getAnalysisFieldValue({
        selector: '#estimated-points-input',
        blockIndex: 2,
        type: 'numberGroup',
        inputIndex: 1
      }),
      dependenciastecnicasAPTI: this.getAnalysisFieldValue({
        selector: '#technical-dependencies-input',
        blockIndex: 4,
        fallbackSelector: 'textarea'
      }),
      observacoesdaanaliseAPTI: this.getAnalysisFieldValue({
        selector: '#analysis-observations-input',
        blockIndex: 5,
        fallbackSelector: 'textarea'
      }),
      objetivoClaramenteDefinidoAPTI: this.getChecklistBooleanValue('#objective-defined-check', 0),
      escopoBemDelimitadoAPTI: this.getChecklistBooleanValue('#scope-delimited-check', 1),
      documentacaoTecnicaAdeqAPTI: this.getChecklistBooleanValue('#documentation-adequate-check', 2),
      patrocinadoridentificadoAPTI: this.getChecklistBooleanValue('#sponsor-identified-check', 3),
      alinhEstratConfAPTI: this.getChecklistBooleanValue('#strategic-alignment-check', 4),
      recursosTecDispAPTI: this.getChecklistBooleanValue('#technical-resources-check', 5),
      anexosessenciaispresentesAPTI: this.getChecklistBooleanValue('#essential-attachments-check', 6)
    };

    fieldMap[decisionField] = decisionValue;

    this.collectRiskRows().forEach((risk, index) => {
      const rowIndex = index + 1;
      fieldMap[`nivelRiscoAPTI___${rowIndex}`] = risk.level;
      fieldMap[`descricaoRiscoAPTI___${rowIndex}`] = risk.description;
    });

    return Object.keys(fieldMap).map((fieldName) => {
      return {
        name: fieldName,
        value: fieldMap[fieldName]
      };
    });
  },

  saveDraft: async function () {
    if (this._isSubmitting) return;

    const loading = this.createActionLoading();
    this._isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho da avaliacao...');
      await this.waitForUiPaint();
      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._currentDocumentId,
        taskFields: this.collectEvaluateTaskFields()
      });
      this.showToast('Rascunho salvo', 'As alteracoes foram salvas com sucesso.', 'success');
      setTimeout(() => {
        location.hash = '#dashboard';
      }, 150);
    } catch (error) {
      console.error('[evaluateProject] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Nao foi possivel salvar o rascunho.', 'error');
    } finally {
      this._isSubmitting = false;
      loading.hide();
    }
  },

  resolveProcessInstanceId: async function () {
    if (this._currentProcessInstanceId) {
      return this._currentProcessInstanceId;
    }

    if (!this._currentDocumentId) {
      throw new Error('Nao foi possivel identificar a solicitacao atual');
    }

    const processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(this._currentDocumentId);
    this._currentProcessInstanceId = this.asText(processInstanceId);
    return this._currentProcessInstanceId;
  },

  handleTaskAction: async function (config) {
    if (this._isSubmitting) return;

    const loading = this.createActionLoading();
    this._isSubmitting = true;

    try {
      loading.updateMessage('Preparando dados da etapa...');
      await this.waitForUiPaint();
      const processInstanceId = await this.resolveProcessInstanceId();
      const taskFields = this.collectEvaluateTaskFields(config.decisionField, config.decisionValue);

      loading.updateMessage('Enviando movimentacao para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: config.choosedState,
        documentId: this._currentDocumentId,
        datasetName: 'DSFormSolicitacaoProjetos'
      }, taskFields);

      this.closeModal(config.modalId);
      this.showToast(config.successMessage, 'success');

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[evaluateProject] Error moving task:', error);
      this.showToast(error && error.message ? error.message : 'Nao foi possivel movimentar a solicitacao.', 'error');
    } finally {
      this._isSubmitting = false;
      loading.hide();
    }
  },

  countAttachments: function (value) {
    const text = this.asText(value);
    if (!text) return 0;

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.length;
      }
    } catch (error) {}

    return text.split(/\r?\n|;|,/).map((item) => this.asText(item)).filter(Boolean).length;
  },

  parseBooleanLike: function (value) {
    if (value === true) return true;
    if (value === false) return false;

    const normalized = this.asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!normalized) return null;
    if (['1', 'true', 'sim', 's', 'yes', 'on'].indexOf(normalized) >= 0) return true;
    if (['0', 'false', 'nao', 'n', 'no', 'off'].indexOf(normalized) >= 0) return false;
    if (normalized.indexOf('nao alinh') !== -1) return false;
    if (normalized.indexOf('alinhad') !== -1) return true;
    return null;
  },

  parseTableJson: function (value) {
    if (Array.isArray(value)) return value;

    const text = this.asText(value);
    if (!text || text === 'null') return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[evaluateProject] Invalid child table JSON:', error);
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
