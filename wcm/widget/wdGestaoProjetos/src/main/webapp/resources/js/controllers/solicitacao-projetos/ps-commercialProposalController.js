const commercialProposalController = {
  _eventNamespace: '.commercialProposal',
  _datasetId: 'dsGetSolicitacaoProjetos',
  _uiComponentsKey: 'gpUiComponents',
  _tabComponentsKey: 'gpApprovalTabComponents',
  _tabsRoot: null,
  _headerBackup: null,
  _toastTimer: null,
  _baseFields: [
    'documentid',
    'titulodoprojetoNS',
    'areaUnidadeNS',
    'patrocinadorNS',
    'prioridadeNS',
    'estadoProcesso',
    'anexosNS',
    'anexosApoioTITT',
    'execucaoProjetoTITT',
    'nomeFornecedorTIPC',
    'codFornecedorTIPC',
    'cnpjTIPC',
    'nomeContatoTIPC',
    'emailTIPC',
    'telefoneTIPC',
    'nomeContato2TIPC',
    'email2TIPC',
    'telefone2TIPC',
    'numeroRefPropostaTIPC',
    'vigenciaDiasTIPC',
    'valortotalTIPC',
    'moedaTIPC',
    'simboloMoedaTIPC',
    'prazoEstimadoTIPC',
    'condicaoPagamentoTIPC',
    'codigoCondicaoPagamentoTIPC',
    'escopoResumidoTIPC',
    'anexosPropostaTIPC',
    'decisaoTIPC',
    'justificativaTIPC',
    'categoriajustiTIPC',
    'escopoClaroDetalhadoTIPC',
    'impostosTaxasInclusosTIPC',
    'prazosEntregaDefinidosTIPC',
    'garantiasSlaEspecificadosTIPC',
    'vigenciaPropostaConfirmadaTIPC',
    'documentosAnexCompTIPC',
    'tblItensServicosTIPC.descricaoItemServicoTIPC',
    'tblItensServicosTIPC.quantidadeItemServicoTIPC',
    'tblItensServicosTIPC.valorUnitarioItemServicoTIPC',
    'tblItensServicosTIPC.totalItemServicoTIPC',
    'tblRiscosIniciaisTIPC.tituloRiscoTIPC',
    'tblRiscosIniciaisTIPC.descricaoRiscoTIPC',
    'tblRiscosIniciaisTIPC.mitigacaoRiscoTIPC',
    'tblRiscosIniciaisTIPC.planoBRiscoTIPC',
    'tblRiscosIniciaisTIPC.nivelRiscoTIPC',
    'tblRiscosIniciaisTIPC.impactoRiscoTIPC',
    'tblRiscosIniciaisTIPC.probabilidadeRiscoTIPC',
    'tblRiscosIniciaisTIPC.riscoPotencialTIPC',
    'tblPreRequisitosTIPC.tituloPreRequisitoTIPC',
    'tblPreRequisitosTIPC.statusPreRequisitoTIPC',
    'tblPreRequisitosTIPC.responsavelPreRequisitoTIPC',
    'tblPreRequisitosTIPC.mitigacaoPreRequisitoTIPC',
    'tblPreRequisitosTIPC.planoBPreRequisitoTIPC',
    'tblPreRequisitosTIPC.preRequisitoTIPC'
  ],
  _state: {
    documentId: null,
    estadoProcesso: null,
    processInstanceId: null,
    baseRow: null,
    currentTab: 'solicitacao',
    historyCache: {},
    isSubmitting: false,
    attachments: [],
    supplierFilter: null,
    supplierOptions: [],
    pendingSupplierSync: null,
    supplierContactRequestId: 0,
    currencyFilter: null,
    currencyOptions: [],
    pendingCurrencySync: null,
    paymentConditionFilter: null,
    paymentConditionOptions: [],
    pendingPaymentConditionSync: null
  },

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();

    this._state.documentId = params && params.documentId ? String(params.documentId) : null;
    this._state.estadoProcesso = params && params.estadoProcesso ? String(params.estadoProcesso) : null;
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : null;
    this._state.currentTab = this.normalizeTabParam(params && params.tab ? String(params.tab) : '') || 'solicitacao';

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.backupAndSetHeader();
        this.renderSidebarSkeleton();
        this.initializeTabs(this._state.currentTab);
        this.bindEvents();
        this.initializeTagInputFilters();
        this.ensureEditableDefaults();
        this.renderAttachmentsList();
        this.updateChecklistProgress();
        this.loadReadOnlyTab(this._state.currentTab);
        this.loadBaseContext();
      })
      .fail((error) => {
        console.error('[commercialProposal] Template load error:', error);
        container.html('<div class="p-6 text-red-600">Falha ao carregar a tela de proposta comercial.</div>');
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
    this._state.attachments = [];
    this._state.supplierFilter = null;
    this._state.supplierOptions = [];
    this._state.pendingSupplierSync = null;
    this._state.supplierContactRequestId = 0;
    this._state.currencyFilter = null;
    this._state.currencyOptions = [];
    this._state.pendingCurrencySync = null;
    this._state.paymentConditionFilter = null;
    this._state.paymentConditionOptions = [];
    this._state.pendingPaymentConditionSync = null;
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-commercial-proposal.html`;
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
      titleEl.text('TI - Proposta Comercial');
    }

    if (breadcrumbEl.length) {
      breadcrumbEl.html(`
        <a href="#dashboard" class="text-gray-300 hover:text-white transition-colors">Home</a>
        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
        <span class="text-bevap-gold font-medium">Proposta Comercial</span>
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

  initializeTabs: function (defaultTabName) {
    const ui = this.getUiComponents();
    const tabsRoot = this.getContainer().find('[data-component="tabs"]').first();
    if (!ui || !ui.tabs || !tabsRoot.length) return;

    this.destroyTabs();
    this._tabsRoot = tabsRoot;

    ui.tabs.init(tabsRoot, {
      defaultTab: defaultTabName || 'solicitacao',
      hideNoticeOnOpen: true,
      onChange: (tabName) => {
        this._state.currentTab = String(tabName || 'solicitacao');
        this.loadReadOnlyTab(this._state.currentTab);
      }
    });

    if (defaultTabName) {
      try {
        ui.tabs.setActive(tabsRoot, defaultTabName);
      } catch (e) {}
    }
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

    container.on(`click${ns}`, '[data-action="open-approve-modal"]', (event) => {
      event.preventDefault();
      this.openModal('approve-modal');
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
      const modalId = this.asText($(event.currentTarget).attr('data-modal-id'));
      if (modalId) this.closeModal(modalId);
    });

    container.on(`click${ns}`, '[data-action="confirm-send"]', (event) => {
      event.preventDefault();
      this.submitProposal({
        decisionValue: 'aprovado',
        justification: '',
        category: '',
        modalId: 'approve-modal',
        successMessage: 'Proposta comercial enviada ao solicitante.'
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-return"]', (event) => {
      event.preventDefault();
      const category = this.asText(container.find('#return-category-input').val());
      const reason = this.asText(container.find('#return-reason-input').val());

      if (!category) {
        this.showToast('Categoria', 'Selecione a categoria da devolucao.', 'warning');
        container.find('#return-category-input').trigger('focus');
        return;
      }

      if (!reason) {
        this.showToast('Justificativa', 'Informe o motivo da devolucao.', 'warning');
        container.find('#return-reason-input').trigger('focus');
        return;
      }

      this.submitProposal({
        decisionValue: 'correcao',
        justification: reason,
        category: category,
        modalId: 'modal-return',
        successMessage: 'Proposta devolvida para correcao.'
      });
    });

    container.on(`click${ns}`, '[data-action="confirm-reject"]', (event) => {
      event.preventDefault();
      const category = this.asText(container.find('#reject-category-input').val());
      const reason = this.asText(container.find('#reject-reason-input').val());

      if (!category) {
        this.showToast('Categoria', 'Selecione a categoria da reprovacao.', 'warning');
        container.find('#reject-category-input').trigger('focus');
        return;
      }

      if (!reason) {
        this.showToast('Justificativa', 'Informe a justificativa da reprovacao.', 'warning');
        container.find('#reject-reason-input').trigger('focus');
        return;
      }

      this.submitProposal({
        decisionValue: 'cancelado',
        justification: reason,
        category: category,
        modalId: 'modal-reject',
        successMessage: 'Nao continuidade da proposta registrada.'
      });
    });

    container.on(`click${ns}`, '#approve-modal, #modal-return, #modal-reject', (event) => {
      if (event.target === event.currentTarget) {
        $(event.currentTarget).addClass('hidden');
      }
    });

    container.on(`click${ns}`, '[data-action="add-proposal-item"]', (event) => {
      event.preventDefault();
      this.addItemRow();
    });

    container.on(`click${ns}`, '[data-action="remove-proposal-item"]', (event) => {
      event.preventDefault();
      this.removeItemRow(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="add-proposal-risk"]', (event) => {
      event.preventDefault();
      this.addRiskMatrixItem();
    });

    container.on(`click${ns}`, '[data-action="remove-proposal-risk"]', (event) => {
      event.preventDefault();
      this.removeRiskMatrixItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="add-proposal-prerequisite"]', (event) => {
      event.preventDefault();
      this.addPrerequisiteItem();
    });

    container.on(`click${ns}`, '[data-action="remove-proposal-prerequisite"]', (event) => {
      event.preventDefault();
      this.removePrerequisiteItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="confirm-proposal-risk"]', (event) => {
      event.preventDefault();
      this.confirmRiskMatrixItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="edit-proposal-risk"]', (event) => {
      event.preventDefault();
      this.editRiskMatrixItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="confirm-proposal-prerequisite"]', (event) => {
      event.preventDefault();
      this.confirmPrerequisiteItem(event.currentTarget);
    });

    container.on(`click${ns}`, '[data-action="edit-proposal-prerequisite"]', (event) => {
      event.preventDefault();
      this.editPrerequisiteItem(event.currentTarget);
    });

    container.on(`input${ns}`, '#proposal-items-list [data-field="item-quantity"], #proposal-items-list [data-field="item-unit"]', (event) => {
      const row = $(event.currentTarget).closest('.proposal-item-row');
      this.updateItemRowTotal(row);
    });

    container.on(`change${ns}`, '.proposal-checklist-item', () => {
      this.updateChecklistProgress();
    });

    container.on(`dragover${ns}`, '#proposal-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).addClass('border-bevap-green bg-green-50');
    });

    container.on(`dragleave${ns}`, '#proposal-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('border-bevap-green bg-green-50');
    });

    container.on(`drop${ns}`, '#proposal-dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('border-bevap-green bg-green-50');

      const files = event.originalEvent && event.originalEvent.dataTransfer
        ? event.originalEvent.dataTransfer.files
        : null;
      this.addAttachments(files);
    });

    container.on(`change${ns}`, '#proposal-attachments-input', (event) => {
      const files = event.currentTarget && event.currentTarget.files ? event.currentTarget.files : null;
      this.addAttachments(files);
      try { event.currentTarget.value = ''; } catch (e) {}
    });

    container.on(`click${ns}`, '[data-action="remove-proposal-attachment"]', (event) => {
      event.preventDefault();
      const attachmentId = this.asText($(event.currentTarget).attr('data-attachment-id'));
      if (attachmentId) this.removeAttachment(attachmentId);
    });
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
  },

  initializeTagInputFilters: function () {
    this.initializeSupplierTagFilter();
    this.initializeCurrencyTagFilter();
    this.initializePaymentConditionTagFilter();
  },

  initializeSupplierTagFilter: function () {
    const mount = this.getContainer().find('#proposal-supplier-filter').get(0);
    if (!mount || typeof TagInputFilter === 'undefined') {
      if (typeof TagInputFilter === 'undefined') {
        console.warn('[commercialProposal] TagInputFilter nao encontrado. Verifique application.info');
      }
      return;
    }

    if (!mount.id) {
      mount.id = 'proposal-supplier-filter';
    }

    this._state.supplierFilter = new TagInputFilter('#proposal-supplier-filter', {
      placeholder: 'Selecione um fornecedor...',
      data: [],
      labelField: 'nomeFantasia',
      valueField: 'codforn',
      columns: [
        { header: 'Codigo', field: 'codforn', width: 'w-1/4' },
        { header: 'Fornecedor', field: 'nomeFantasia', width: 'w-2/4' },
        { header: 'CNPJ', field: 'cnpj', width: 'w-1/4' }
      ],
      singleSelection: true,
      onItemAdded: (item) => {
        this.applySupplierSelection(item);
      },
      onItemRemoved: () => {
        this.clearSupplierSelection();
      }
    });

    this.loadSupplierOptions()
      .then((rows) => {
        this._state.supplierOptions = rows;
        if (this._state.supplierFilter && typeof this._state.supplierFilter.updateData === 'function') {
          this._state.supplierFilter.updateData(rows);
        }
        this.syncSupplierFilterFromPending();
      })
      .catch((error) => {
        console.error('[commercialProposal] Erro carregando ds_RM_fornecedores:', error);
      });
  },

  initializeCurrencyTagFilter: function () {
    const mount = this.getContainer().find('#proposal-currency-filter').get(0);
    if (!mount || typeof TagInputFilter === 'undefined') return;

    if (!mount.id) {
      mount.id = 'proposal-currency-filter';
    }

    this._state.currencyFilter = new TagInputFilter('#proposal-currency-filter', {
      placeholder: 'Selecione uma moeda...',
      data: [],
      labelField: 'DESCRICAO',
      valueField: 'DESCRICAO',
      columns: [
        { header: 'Simbolo', field: 'SIMBOLO', width: 'w-1/4' },
        { header: 'Descricao', field: 'DESCRICAO', width: 'w-2/4' },
        { header: 'Casas', field: 'NUMCASASDECIMAIS', width: 'w-1/4' }
      ],
      singleSelection: true,
      onItemAdded: (item) => {
        this.applyCurrencySelection(item);
      },
      onItemRemoved: () => {
        this.clearCurrencySelection();
      }
    });

    this.loadCurrencyOptions()
      .then((rows) => {
        this._state.currencyOptions = rows;
        if (this._state.currencyFilter && typeof this._state.currencyFilter.updateData === 'function') {
          this._state.currencyFilter.updateData(rows);
        }
        this.syncCurrencyFilterFromPending();
      })
      .catch((error) => {
        console.error('[commercialProposal] Erro carregando dsGetMoeda_ReadView:', error);
      });
  },

  initializePaymentConditionTagFilter: function () {
    const mount = this.getContainer().find('#proposal-payment-condition-filter').get(0);
    if (!mount || typeof TagInputFilter === 'undefined') return;

    if (!mount.id) {
      mount.id = 'proposal-payment-condition-filter';
    }

    this._state.paymentConditionFilter = new TagInputFilter('#proposal-payment-condition-filter', {
      placeholder: 'Selecione a condicao...',
      data: [],
      labelField: 'NOME',
      valueField: 'CODIGO',
      columns: [
        { header: 'Codigo', field: 'CODIGO', width: 'w-1/4' },
        { header: 'Nome', field: 'NOME', width: 'w-2/4' },
        { header: 'Parcelas', field: 'QUANTASVEZES', width: 'w-1/4' },
        { header: 'Periodo', field: 'PERIODOEMDIAS', width: 'w-1/4' }
      ],
      singleSelection: true,
      onItemAdded: (item) => {
        this.applyPaymentConditionSelection(item);
      },
      onItemRemoved: () => {
        this.clearPaymentConditionSelection();
      }
    });

    this.loadPaymentConditionOptions()
      .then((rows) => {
        this._state.paymentConditionOptions = rows;
        if (this._state.paymentConditionFilter && typeof this._state.paymentConditionFilter.updateData === 'function') {
          this._state.paymentConditionFilter.updateData(rows);
        }
        this.syncPaymentConditionFilterFromPending();
      })
      .catch((error) => {
        console.error('[commercialProposal] Erro carregando dsGetCondPagto_ReadView:', error);
      });
  },

  loadSupplierOptions: async function () {
    let rows = [];
    try {
      rows = await fluigService.getDatasetRows('ds_RM_fornecedores');
    } catch (error) {
      rows = await fluigService.getDataset('ds_RM_fornecedores');
    }

    const mapped = (rows || []).map((row) => {
      const codforn = this.asText(row && (row.codforn || row.CODFORN || row.CODCFO));
      const nomeFantasia = this.asText(row && (row.nomeFantasia || row.NOMEFANTASIA));
      if (!codforn || !nomeFantasia) return null;
      return {
        codforn: codforn,
        nomeFantasia: nomeFantasia,
        cnpj: this.asText(row && (row.cnpj || row.CNPJ || row.CGCCFO))
      };
    }).filter(Boolean);

    const seen = new Set();
    return mapped.filter((item) => {
      if (seen.has(item.codforn)) return false;
      seen.add(item.codforn);
      return true;
    });
  },

  loadCurrencyOptions: async function () {
    let rows = [];
    try {
      rows = await fluigService.getDatasetRows('dsGetMoeda_ReadView');
    } catch (error) {
      rows = await fluigService.getDataset('dsGetMoeda_ReadView');
    }

    const normalizedRows = (rows || []).map((row) => {
      const simbolo = this.asText(row && (row.SIMBOLO || row.simbolo));
      const descricao = this.asText(row && (row.DESCRICAO || row.descricao));
      if (!simbolo || !descricao) return null;
      return {
        SIMBOLO: simbolo,
        DESCRICAO: descricao,
        NUMCASASDECIMAIS: this.asText(row && (row.NUMCASASDECIMAIS || row.numcasasdecimais || row.numCasasDecimais))
      };
    }).filter(Boolean);

    const seen = new Set();
    return normalizedRows.filter((item) => {
      const key = this.normalizeLookupText(item.DESCRICAO);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  loadPaymentConditionOptions: async function () {
    let rows = [];
    try {
      rows = await fluigService.getDatasetRows('dsGetCondPagto_ReadView', {
        filters: { CODCOLIGADA: '1' }
      });
    } catch (error) {
      rows = await fluigService.getDataset('dsGetCondPagto_ReadView', { CODCOLIGADA: '1' });
    }

    return (rows || []).map((row) => {
      const codigo = this.asText(row && (row.CODIGO || row.CODCPG));
      const nome = this.asText(row && row.NOME);
      if (!codigo || !nome) return null;
      return {
        CODIGO: codigo,
        NOME: nome,
        QUANTASVEZES: this.asText(row && row.QUANTASVEZES),
        PERIODOEMDIAS: this.asText(row && row.PERIODOEMDIAS)
      };
    }).filter(Boolean);
  },

  loadSupplierContacts: async function (codforn) {
    const supplierCode = this.asText(codforn);
    if (!supplierCode) return [];

    let rows = [];
    try {
      rows = await fluigService.getDatasetRows('dsGetContatoForn_ReadView', {
        filters: {
          CODCFO: supplierCode
        }
      });
    } catch (error) {
      rows = await fluigService.getDataset('dsGetContatoForn_ReadView', {
        CODCFO: supplierCode
      });
    }

    return (rows || []).map((row) => {
      return {
        id: Number(this.asText(row && row.IDCONTATO) || '0'),
        nome: this.asText(row && row.NOME),
        email: this.asText(row && row.EMAIL),
        telefone: this.asText(row && (row.TELEFONE || row.telefone || row.FONE || row.fone))
      };
    }).filter((item) => item.nome || item.email || item.telefone)
      .sort((a, b) => a.id - b.id)
      .slice(0, 2);
  },

  applySupplierSelection: function (item) {
    const root = this.getContainer();
    const cod = this.asText(item && (item.codforn || item.CODFORN || item.CODCFO));
    const nome = this.asText(item && (item.nomeFantasia || item.NOMEFANTASIA));
    const cnpj = this.asText(item && (item.cnpj || item.CNPJ || item.CGCCFO));

    this.clearSupplierContactFields();

    root.find('#proposal-supplier-name').val(nome);
    root.find('#proposal-supplier-code').val(cod);
    root.find('#proposal-supplier-cnpj').val(cnpj);

    if (!cod) return;

    const requestId = ++this._state.supplierContactRequestId;
    this.loadSupplierContacts(cod)
      .then((contacts) => {
        if (requestId !== this._state.supplierContactRequestId) return;
        if (this.asText(root.find('#proposal-supplier-code').val()) !== cod) return;
        this.applySupplierContacts(contacts);
      })
      .catch((error) => {
        console.error('[commercialProposal] Erro carregando contatos do fornecedor:', error);
      });
  },

  applySupplierContacts: function (contacts) {
    const root = this.getContainer();
    const list = Array.isArray(contacts) ? contacts : [];
    const primary = list[0] || {};
    const secondary = list[1] || {};

    root.find('#proposal-contact-name').val(this.asText(primary.nome));
    root.find('#proposal-contact-email').val(this.asText(primary.email));
    root.find('#proposal-contact-phone').val(this.asText(primary.telefone));
    root.find('#proposal-contact2-name').val(this.asText(secondary.nome));
    root.find('#proposal-contact2-email').val(this.asText(secondary.email));
    root.find('#proposal-contact2-phone').val(this.asText(secondary.telefone));
  },

  clearSupplierSelection: function () {
    const root = this.getContainer();
    this._state.supplierContactRequestId += 1;
    root.find('#proposal-supplier-name').val('');
    root.find('#proposal-supplier-code').val('');
    root.find('#proposal-supplier-cnpj').val('');
    this.clearSupplierContactFields();
  },

  clearSupplierContactFields: function () {
    const root = this.getContainer();
    root.find('#proposal-contact-name').val('');
    root.find('#proposal-contact-email').val('');
    root.find('#proposal-contact-phone').val('');
    root.find('#proposal-contact2-name').val('');
    root.find('#proposal-contact2-email').val('');
    root.find('#proposal-contact2-phone').val('');
  },

  requestSupplierSyncFromHidden: function () {
    const root = this.getContainer();
    this._state.pendingSupplierSync = {
      codforn: this.asText(root.find('#proposal-supplier-code').val()),
      nomeFantasia: this.asText(root.find('#proposal-supplier-name').val())
    };
    this.syncSupplierFilterFromPending();
  },

  syncSupplierFilterFromPending: function () {
    const filter = this._state.supplierFilter;
    const pending = this._state.pendingSupplierSync;
    const options = Array.isArray(this._state.supplierOptions) ? this._state.supplierOptions : [];
    if (!filter || !pending || !options.length) return;

    let found = null;
    const pendingCode = this.asText(pending.codforn);
    const pendingLabel = this.asText(pending.nomeFantasia);

    if (pendingCode) {
      found = options.find((row) => this.asText(row && row.codforn) === pendingCode) || null;
    } else if (pendingLabel) {
      const normalizedLabel = this.normalizeLookupText(pendingLabel);
      found = options.find((row) => this.normalizeLookupText(row && row.nomeFantasia) === normalizedLabel) || null;
    }

    if (!found || typeof filter.setSelectedItems !== 'function') return;
    if (!pendingCode) {
      this.getContainer().find('#proposal-supplier-code').val(this.asText(found.codforn));
    }
    filter.setSelectedItems([{
      value: this.asText(found.codforn),
      label: this.asText(found.nomeFantasia)
    }]);
  },

  applyCurrencySelection: function (item) {
    const root = this.getContainer();
    root.find('#proposal-currency').val(this.asText(item && item.DESCRICAO));
    root.find('#proposal-currency-symbol').val(this.asText(item && item.SIMBOLO));
    this.updateAllItemTotals();
  },

  clearCurrencySelection: function () {
    const root = this.getContainer();
    root.find('#proposal-currency').val('');
    root.find('#proposal-currency-symbol').val('');
    this.updateAllItemTotals();
  },

  requestCurrencySyncFromHidden: function () {
    const root = this.getContainer();
    this._state.pendingCurrencySync = {
      simbolo: this.asText(root.find('#proposal-currency-symbol').val()),
      descricao: this.asText(root.find('#proposal-currency').val())
    };
    this.syncCurrencyFilterFromPending();
  },

  syncCurrencyFilterFromPending: function () {
    const filter = this._state.currencyFilter;
    const pending = this._state.pendingCurrencySync;
    const options = Array.isArray(this._state.currencyOptions) ? this._state.currencyOptions : [];
    if (!filter || !pending || !options.length) return;

    let found = null;
    const pendingSymbol = this.asText(pending.simbolo);
    const pendingLabel = this.asText(pending.descricao);

    if (pendingSymbol) {
      found = options.find((row) => this.asText(row && row.SIMBOLO) === pendingSymbol) || null;
    } else if (pendingLabel) {
      const normalizedLabel = this.normalizeLookupText(pendingLabel);
      found = options.find((row) => this.normalizeLookupText(row && row.DESCRICAO) === normalizedLabel) || null;
    }

    if (!found || typeof filter.setSelectedItems !== 'function') return;
    if (!pendingSymbol) {
      this.getContainer().find('#proposal-currency-symbol').val(this.asText(found.SIMBOLO));
    }
    filter.setSelectedItems([{
      value: this.asText(found.DESCRICAO),
      label: this.asText(found.DESCRICAO)
    }]);
  },

  applyPaymentConditionSelection: function (item) {
    const root = this.getContainer();
    root.find('#proposal-payment-condition').val(this.asText(item && item.NOME));
    root.find('#proposal-payment-condition-code').val(this.asText(item && item.CODIGO));
  },

  clearPaymentConditionSelection: function () {
    const root = this.getContainer();
    root.find('#proposal-payment-condition').val('');
    root.find('#proposal-payment-condition-code').val('');
  },

  requestPaymentConditionSyncFromHidden: function () {
    const root = this.getContainer();
    this._state.pendingPaymentConditionSync = {
      codigo: this.asText(root.find('#proposal-payment-condition-code').val()),
      nome: this.asText(root.find('#proposal-payment-condition').val())
    };
    this.syncPaymentConditionFilterFromPending();
  },

  syncPaymentConditionFilterFromPending: function () {
    const filter = this._state.paymentConditionFilter;
    const pending = this._state.pendingPaymentConditionSync;
    const options = Array.isArray(this._state.paymentConditionOptions) ? this._state.paymentConditionOptions : [];
    if (!filter || !pending || !options.length) return;

    let found = null;
    const pendingCode = this.asText(pending.codigo);
    const pendingLabel = this.asText(pending.nome);

    if (pendingCode) {
      found = options.find((row) => this.asText(row && row.CODIGO) === pendingCode) || null;
    } else if (pendingLabel) {
      const normalizedLabel = this.normalizeLookupText(pendingLabel);
      found = options.find((row) => this.normalizeLookupText(row && row.NOME) === normalizedLabel) || null;
    }

    if (!found || typeof filter.setSelectedItems !== 'function') return;
    if (!pendingCode) {
      this.getContainer().find('#proposal-payment-condition-code').val(this.asText(found.CODIGO));
    }
    filter.setSelectedItems([{
      value: this.asText(found.CODIGO),
      label: this.asText(found.NOME)
    }]);
  },

  openModal: function (modalId) {
    const modal = this.getContainer().find(`#${modalId}`);
    if (!modal.length) return;
    modal.removeClass('hidden');
  },

  closeModal: function (modalId) {
    const modal = this.getContainer().find(`#${modalId}`);
    if (!modal.length) return;
    modal.addClass('hidden');
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
      customRows: [
        {
          variant: 'badge',
          label: 'Tipo',
          value: 'N/A',
          iconClass: 'fa-solid fa-arrow-up-right-from-square',
          badgeClasses: 'bg-purple-100 text-purple-800'
        }
      ],
      status: { label: 'N/A', iconClass: 'fa-solid fa-clock', badgeClasses: 'bg-gray-100 text-gray-800' }
    });

    ui.sidebar.renderProgress(progressTarget, { items: this.getProgressItems() });
  },

  renderSidebarFromRow: function (row) {
    const ui = this.getUiComponents();
    if (!ui || !ui.sidebar) return;

    const container = this.getContainer();
    const summaryTarget = container.find('[data-component="project-summary"]').first();
    const progressTarget = container.find('[data-component="progress-status"]').first();

    ui.sidebar.renderProjectSummary(summaryTarget, {
      code: this.asText(row.documentid) || 'N/A',
      title: this.asText(row.titulodoprojetoNS) || 'N/A',
      requester: 'N/A',
      area: this.asText(row.areaUnidadeNS) || 'N/A',
      sponsor: this.asText(row.patrocinadorNS) || 'N/A',
      attachmentsCount: this.countAttachments(row.anexosNS) + this.countAttachments(row.anexosPropostaTIPC),
      priority: {
        label: this.getPriorityLabel(row.prioridadeNS) || 'N/A',
        iconClass: 'fa-solid fa-star',
        badgeClasses: this.getPriorityBadgeClasses(row.prioridadeNS)
      },
      customRows: [
        {
          variant: 'badge',
          label: 'Tipo',
          value: this.asText(row.execucaoProjetoTITT) || 'N/A',
          iconClass: 'fa-solid fa-arrow-up-right-from-square',
          badgeClasses: 'bg-purple-100 text-purple-800'
        }
      ],
      status: {
        label: this.getEstadoProcessoLabel(row.estadoProcesso) || 'N/A',
        iconClass: 'fa-solid fa-clock',
        badgeClasses: 'bg-yellow-100 text-yellow-800'
      }
    });

    ui.sidebar.renderProgress(progressTarget, { items: this.getProgressItems() });
  },

  formatWeeks: function (value) {
    const text = this.asText(value);
    if (!text) return '';
    if (/^\d+$/.test(text)) return `${text} Semana(s)`;
    return text;
  },

  getProgressItems: function () {
    return [
      { style: 'success', label: 'Solicitacao aprovada', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Analise TI concluida', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Impacto na area concluido', iconClass: 'fa-solid fa-check-circle' },
      { style: 'success', label: 'Triagem tecnica (Externo)', iconClass: 'fa-solid fa-check-circle' },
      { style: 'warning', label: 'Validacao proposta comercial', iconClass: 'fa-solid fa-clock' }
    ];
  },

  loadBaseContext: async function () {
    if (!this._state.documentId) {
      this.showToast('Sem solicitacao', 'Nenhum documentId foi informado para esta rota.', 'warning');
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
        this.showToast('Nao encontrado', 'Nao foi possivel localizar dados da solicitacao.', 'warning');
        return;
      }

      this.renderSidebarFromRow(row);
      this.fillFieldsFromRow(row);
      this.updateApproveModalProject(row);
    } catch (error) {
      console.error('[commercialProposal] Error loading base context:', error);
      this.showToast('Erro ao carregar', 'Nao foi possivel carregar os dados principais da solicitacao.', 'error');
    }
  },

  updateApproveModalProject: function (row) {
    const label = [this.asText(row.documentid), this.asText(row.titulodoprojetoNS)].filter(Boolean).join(' • ');
    this.getContainer().find('#approve-project-label').text(label || 'Projeto selecionado');
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

  normalizeTabParam: function (tabParam) {
    const raw = this.asText(tabParam);
    if (!raw) return '';

    const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const allowList = {
      solicitacao: 'solicitacao',
      'analise-ti': 'analise-ti',
      analise: 'analise-ti',
      impacto: 'impacto',
      'triagem-ti': 'triagem-ti',
      triagem: 'triagem-ti',
      fornecedor: 'fornecedor',
      proposta: 'proposta',
      checklist: 'checklist'
    };

    return allowList[normalized] || '';
  },

  loadReadOnlyTab: async function (tabName) {
    const config = this.getReadOnlyTabConfig(tabName);
    if (!config) return;

    const target = this.getContainer().find(`[data-component="${config.mount}"]`).first();
    if (!target.length) return;

    const components = this.getTabComponents();
    const component = components[config.key];
    const componentOptions = { documentId: this._state.documentId, row: this._state.baseRow || null };

    if (this._state.historyCache[tabName]) {
      target.html(this._state.historyCache[tabName]);
      this.mountAttachmentsInTab(target, component, componentOptions);
      return;
    }

    if (!component || typeof component.render !== 'function') {
      target.html('<div class="text-sm text-red-600">Componente da aba indisponivel.</div>');
      return;
    }

    target.html('<div class="text-sm text-gray-500">Carregando conteudo...</div>');

    try {
      const html = typeof component.renderInto === 'function'
        ? await component.renderInto(target, componentOptions)
        : await component.render(componentOptions);

      this._state.historyCache[tabName] = html;
      if (typeof component.renderInto !== 'function') {
        target.html(html);
      }
      this.mountAttachmentsInTab(target, component, componentOptions);
    } catch (error) {
      console.error(`[commercialProposal] Error loading tab ${tabName}:`, error);
      target.html('<div class="text-sm text-red-600">Nao foi possivel carregar esta aba.</div>');
    }
  },

  mountAttachmentsInTab: function (tabRootEl, component, options) {
    if (component && typeof component.mountAttachments === 'function') {
      try {
        component.mountAttachments(tabRootEl, Object.assign({ documentId: this._state.documentId }, options));
      } catch (error) {}
    }

    const ui = this.getUiComponents();
    if (!ui || !ui.attachments || typeof ui.attachments.render !== 'function') return;

    const $root = $(tabRootEl);
    if (!$root.length) return;

    $root.find('[data-gp-attachments]').each((_, el) => {
      const $el = $(el);
      if ($el.data('gpAttachmentsMounted')) return;
      $el.data('gpAttachmentsMounted', true);

      const fieldName = this.asText($el.attr('data-field')) || 'anexosNS';
      ui.attachments.render($el, {
        documentId: this._state.documentId,
        fieldName: fieldName
      });
    });
  },

  ensureEditableDefaults: function () {
    this.getContainer().find('#proposal-total-value').prop('readonly', true);

    if (!this.getContainer().find('#proposal-items-list .proposal-item-row').length) {
      this.addItemRow();
    }
    if (!this.getContainer().find('#proposal-risk-list .tipc-risk-item').length) {
      this.addRiskMatrixItem();
    }
    if (!this.getContainer().find('#proposal-prerequisite-list .tipc-prerequisite-item').length) {
      this.addPrerequisiteItem();
    }
  },

  fillFieldsFromRow: function (row) {
    const root = this.getContainer();

    root.find('#proposal-supplier-name').val(this.asText(row.nomeFornecedorTIPC));
    root.find('#proposal-supplier-code').val(this.asText(row.codFornecedorTIPC));
    root.find('#proposal-supplier-cnpj').val(this.asText(row.cnpjTIPC));
    root.find('#proposal-contact-name').val(this.asText(row.nomeContatoTIPC));
    root.find('#proposal-contact-email').val(this.asText(row.emailTIPC));
    root.find('#proposal-contact-phone').val(this.asText(row.telefoneTIPC));
    root.find('#proposal-contact2-name').val(this.asText(row.nomeContato2TIPC));
    root.find('#proposal-contact2-email').val(this.asText(row.email2TIPC));
    root.find('#proposal-contact2-phone').val(this.asText(row.telefone2TIPC));

    root.find('#proposal-reference-number').val(this.asText(row.numeroRefPropostaTIPC));
    root.find('#proposal-validity-days').val(this.asText(row.vigenciaDiasTIPC));
    root.find('#proposal-total-value').val(this.asText(row.valortotalTIPC));
    root.find('#proposal-currency').val(this.asText(row.moedaTIPC));
    root.find('#proposal-currency-symbol').val(this.asText(row.simboloMoedaTIPC));
    root.find('#proposal-estimated-deadline').val(this.asText(row.prazoEstimadoTIPC));
    root.find('#proposal-payment-condition').val(this.asText(row.condicaoPagamentoTIPC));
    root.find('#proposal-payment-condition-code').val(this.asText(row.codigoCondicaoPagamentoTIPC));
    root.find('#proposal-scope-summary').val(this.asText(row.escopoResumidoTIPC));

    this.requestSupplierSyncFromHidden();
    this.requestCurrencySyncFromHidden();
    this.requestPaymentConditionSyncFromHidden();

    this.renderItemsFromRow(row.tblItensServicosTIPC || row['tblItensServicosTIPC']);
    this.renderRiskMatrixFromRow(row.tblRiscosIniciaisTIPC || row['tblRiscosIniciaisTIPC']);
    this.renderPrerequisitesFromRow(row.tblPreRequisitosTIPC || row['tblPreRequisitosTIPC']);

    this._state.attachments = this.parsePersistedAttachments(row.anexosPropostaTIPC);
    this.renderAttachmentsList();

    root.find('#proposal-check-scope').prop('checked', this.parseBooleanLike(row.escopoClaroDetalhadoTIPC) === true);
    root.find('#proposal-check-taxes').prop('checked', this.parseBooleanLike(row.impostosTaxasInclusosTIPC) === true);
    root.find('#proposal-check-deadlines').prop('checked', this.parseBooleanLike(row.prazosEntregaDefinidosTIPC) === true);
    root.find('#proposal-check-sla').prop('checked', this.parseBooleanLike(row.garantiasSlaEspecificadosTIPC) === true);
    root.find('#proposal-check-validity').prop('checked', this.parseBooleanLike(row.vigenciaPropostaConfirmadaTIPC) === true);
    root.find('#proposal-check-documents').prop('checked', this.parseBooleanLike(row.documentosAnexCompTIPC) === true);

    this.updateAllItemTotals();
    this.updateChecklistProgress();
  },

  renderItemsFromRow: function (tblValue) {
    const list = this.getContainer().find('#proposal-items-list');
    if (!list.length) return;

    const rows = this.parseTableJson(tblValue);
    list.empty();

    const items = rows.map((item) => {
      return {
        description: this.asText(item && item.descricaoItemServicoTIPC),
        quantity: this.asText(item && item.quantidadeItemServicoTIPC),
        unit: this.asText(item && item.valorUnitarioItemServicoTIPC),
        total: this.asText(item && item.totalItemServicoTIPC)
      };
    }).filter((item) => item.description || item.quantity || item.unit || item.total);

    if (!items.length) {
      this.addItemRow();
      return;
    }

    items.forEach((item) => this.addItemRow(item));
  },

  addItemRow: function (data) {
    const list = this.getContainer().find('#proposal-items-list');
    if (!list.length) return;

    const description = this.escapeHtml(this.asText(data && data.description));
    const quantity = this.escapeHtml(this.asText(data && data.quantity) || '1');
    const unit = this.escapeHtml(this.asText(data && data.unit));
    const total = this.escapeHtml(this.asText(data && data.total));

    list.append(`
      <tr class="proposal-item-row border-t">
        <td class="px-4 py-3">
          <input type="text" data-field="item-description" value="${description}" class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
        </td>
        <td class="px-4 py-3 text-center">
          <input type="number" min="1" step="1" data-field="item-quantity" value="${quantity}" class="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center">
        </td>
        <td class="px-4 py-3">
          <input type="text" data-field="item-unit" value="${unit}" class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right">
        </td>
        <td class="px-4 py-3">
          <input type="text" data-field="item-total" value="${total}" readonly class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50 text-gray-700 cursor-not-allowed">
        </td>
        <td class="px-4 py-3 text-center">
          <button type="button" data-action="remove-proposal-item" class="text-red-500 hover:text-red-700">
            <i class="fa-solid fa-trash text-sm"></i>
          </button>
        </td>
      </tr>
    `);

    this.updateItemRowTotal(list.find('.proposal-item-row').last());
  },

  removeItemRow: function (target) {
    const item = $(target).closest('.proposal-item-row');
    if (!item.length) return;
    item.remove();

    if (!this.getContainer().find('#proposal-items-list .proposal-item-row').length) {
      this.addItemRow();
      return;
    }

    this.updateAllItemTotals();
  },

  updateItemRowTotal: function (row, skipProposalTotalUpdate) {
    const $row = row && row.jquery ? row : $(row);
    if (!$row.length) return;

    const totalField = $row.find('[data-field="item-total"]').first();
    const quantity = Number(this.asText($row.find('[data-field="item-quantity"]').val()) || '0');
    const unitValue = this.parseMoneyValue($row.find('[data-field="item-unit"]').val());

    if (!isFinite(quantity) || quantity <= 0 || unitValue === null) {
      totalField.val('');
      if (!skipProposalTotalUpdate) this.updateProposalTotalValue();
      return;
    }

    totalField.val(this.formatCurrencyValue(quantity * unitValue));

    if (!skipProposalTotalUpdate) {
      this.updateProposalTotalValue();
    }
  },

  updateProposalTotalValue: function () {
    const root = this.getContainer();
    const totalField = root.find('#proposal-total-value');
    if (!totalField.length) return;

    let sum = 0;
    let hasValidRows = false;

    root.find('#proposal-items-list .proposal-item-row').each((_, el) => {
      const row = $(el);
      const quantity = Number(this.asText(row.find('[data-field="item-quantity"]').val()) || '0');
      const unitValue = this.parseMoneyValue(row.find('[data-field="item-unit"]').val());
      if (!isFinite(quantity) || quantity <= 0 || unitValue === null) return;

      hasValidRows = true;
      sum += quantity * unitValue;
    });

    totalField.val(hasValidRows ? this.formatCurrencyValue(sum) : '');
    totalField.prop('readonly', true);
  },

  updateAllItemTotals: function () {
    this.getContainer().find('#proposal-items-list .proposal-item-row').each((_, el) => {
      this.updateItemRowTotal($(el), true);
    });

    this.updateProposalTotalValue();
  },

  renderRiskMatrixFromRow: function (tblValue) {
    const list = this.getContainer().find('#proposal-risk-list');
    const empty = this.getContainer().find('#proposal-risk-empty');
    if (!list.length) return;

    list.empty();

    const rows = this.parseTableJson(tblValue);
    const risks = rows.map((item) => {
      const legacy = this.asText(item && item.riscoPotencialTIPC);
      const title = this.asText(item && item.tituloRiscoTIPC) || legacy;
      const description = this.asText(item && item.descricaoRiscoTIPC);

      return {
        title: title,
        description: description || (title === legacy ? legacy : ''),
        mitigation: this.asText(item && item.mitigacaoRiscoTIPC),
        fallback: this.asText(item && item.planoBRiscoTIPC),
        level: this.asText(item && item.nivelRiscoTIPC),
        impact: this.asText(item && item.impactoRiscoTIPC),
        probability: this.asText(item && item.probabilidadeRiscoTIPC)
      };
    }).filter((item) => item.title || item.description || item.mitigation || item.fallback || item.level || item.impact || item.probability);

    if (!risks.length) {
      if (empty.length) empty.removeClass('hidden');
      return;
    }

    risks.forEach((risk) => this.addRiskMatrixItem(risk));
    if (empty.length) empty.addClass('hidden');
  },

  addRiskMatrixItem: function (data) {
    const list = this.getContainer().find('#proposal-risk-list');
    const empty = this.getContainer().find('#proposal-risk-empty');
    if (!list.length) return;

    const cardEl = document.createElement('div');
    cardEl.classList.add('tipc-risk-item', 'risk-item');

    const fromDataset = Boolean(data && (data.title || data.mitigation || data.fallback || data.level || data.impact || data.probability));
    cardEl.setAttribute('data-confirmed', fromDataset ? '1' : '0');

    // indice usado para name="campo___i" (pai/filho do Fluig)
    const nextIndex = list.find('.tipc-risk-item').length + 1;
    cardEl.setAttribute('data-index', String(nextIndex));

    this.renderRiskCardShell(cardEl, {
      title: this.asText(data && data.title),
      description: this.asText(data && data.description),
      mitigation: this.asText(data && data.mitigation),
      fallback: this.asText(data && data.fallback),
      level: this.asText(data && data.level) || 'Alto',
      impact: this.asText(data && data.impact) || 'Alto',
      probability: this.asText(data && data.probability) || 'Alta'
    });

    if (fromDataset) this.showRiskReadOnly(cardEl);
    else this.showRiskEdit(cardEl);

    list.append(cardEl);

    if (empty.length) empty.addClass('hidden');
  },

  renderRiskCardShell: function (cardEl, data) {
    if (!cardEl) return;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;

    const idx = this.asText(el.getAttribute('data-index')) || '1';

    const title = this.escapeHtml(this.asText(data && data.title));
    const description = this.escapeHtml(this.asText(data && data.description));
    const mitigation = this.escapeHtml(this.asText(data && data.mitigation));
    const fallback = this.escapeHtml(this.asText(data && data.fallback));
    const level = (this.asText(data && data.level) || 'Alto').replace('Medio', 'Médio');
    const probability = (this.asText(data && data.probability) || 'Alta').replace('Media', 'Média');
    const impact = (this.asText(data && data.impact) || 'Alto').replace('Medio', 'Médio');

    // Mantem inputs no DOM (hidden) para salvar igual a tabela de itens
    el.innerHTML = `
      <div class="risk-fields hidden">
        <input type="text" name="tituloRiscoTIPC___${this.escapeHtml(idx)}" value="${title}" data-field="risk-title" />
        <input type="text" name="descricaoRiscoTIPC___${this.escapeHtml(idx)}" value="${description}" data-field="risk-description" />
        <input type="text" name="mitigacaoRiscoTIPC___${this.escapeHtml(idx)}" value="${mitigation}" data-field="risk-mitigation" />
        <input type="text" name="planoBRiscoTIPC___${this.escapeHtml(idx)}" value="${fallback}" data-field="risk-fallback" />
        <input type="text" name="nivelRiscoTIPC___${this.escapeHtml(idx)}" value="${this.escapeHtml(level)}" data-field="risk-level" />
        <input type="text" name="impactoRiscoTIPC___${this.escapeHtml(idx)}" value="${this.escapeHtml(impact)}" data-field="risk-impact" />
        <input type="text" name="probabilidadeRiscoTIPC___${this.escapeHtml(idx)}" value="${this.escapeHtml(probability)}" data-field="risk-probability" />
        <input type="text" name="riscoPotencialTIPC___${this.escapeHtml(idx)}" value="${title || description}" />
      </div>

      <div class="risk-edit"></div>
      <div class="risk-view"></div>
    `;

    // Inicializa dataset para leitura rapida
    this.setRiskCardData(el, {
      title: this.asText(data && data.title),
      description: this.asText(data && data.description),
      mitigation: this.asText(data && data.mitigation),
      fallback: this.asText(data && data.fallback),
      level,
      impact,
      probability
    });
  },

  syncRiskInputsFromDataset: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el || !el.dataset) return;
    const wrap = $(el).find('.risk-fields');
    if (!wrap.length) return;

    wrap.find('[name^="tituloRiscoTIPC___"]').val(this.asText(el.dataset.riskTitle));
    wrap.find('[name^="descricaoRiscoTIPC___"]').val(this.asText(el.dataset.riskDescription));
    wrap.find('[name^="mitigacaoRiscoTIPC___"]').val(this.asText(el.dataset.riskMitigation));
    wrap.find('[name^="planoBRiscoTIPC___"]').val(this.asText(el.dataset.riskFallback));
    wrap.find('[name^="nivelRiscoTIPC___"]').val(this.asText(el.dataset.riskLevel));
    wrap.find('[name^="impactoRiscoTIPC___"]').val(this.asText(el.dataset.riskImpact));
    wrap.find('[name^="probabilidadeRiscoTIPC___"]').val(this.asText(el.dataset.riskProbability));
    const potential = this.asText(el.dataset.riskTitle) || this.asText(el.dataset.riskDescription);
    wrap.find('[name^="riscoPotencialTIPC___"]').val(potential);
  },

  showRiskReadOnly: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const view = $(el).find('.risk-view').first();
    const edit = $(el).find('.risk-edit').first();
    if (!view.length || !edit.length) return;
    edit.addClass('hidden');
    view.removeClass('hidden');
    this.renderRiskReadOnlyCard(view.get(0), el);
  },

  showRiskEdit: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const view = $(el).find('.risk-view').first();
    const edit = $(el).find('.risk-edit').first();
    if (!view.length || !edit.length) return;
    view.addClass('hidden');
    edit.removeClass('hidden');
    this.renderRiskEditCard(edit.get(0), el);
  },

  getRiskVisual: function (level) {
    const normalized = (this.asText(level) || 'Alto').replace('Medio', 'Médio');

    if (normalized === 'Baixo') {
      return {
        card: 'border border-green-200 bg-green-50 rounded-lg p-4',
        title: 'text-green-900',
        badge: 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded',
        meta: 'text-xs text-green-800'
      };
    }

    if (normalized === 'Médio') {
      return {
        card: 'border border-yellow-200 bg-yellow-50 rounded-lg p-4',
        title: 'text-yellow-900',
        badge: 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded',
        meta: 'text-xs text-yellow-800'
      };
    }

    return {
      card: 'border border-red-200 bg-red-50 rounded-lg p-4',
      title: 'text-red-900',
      badge: 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded',
      meta: 'text-xs text-red-800'
    };
  },

  setRiskCardData: function (cardEl, data) {
    if (!cardEl) return;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el || !el.dataset) return;
    el.dataset.riskTitle = this.asText(data && data.title);
    el.dataset.riskDescription = this.asText(data && data.description);
    el.dataset.riskLevel = this.asText(data && data.level) || 'Alto';
    el.dataset.riskProbability = this.asText(data && data.probability) || 'Alta';
    el.dataset.riskImpact = this.asText(data && data.impact) || 'Alto';
    el.dataset.riskMitigation = this.asText(data && data.mitigation);
    el.dataset.riskFallback = this.asText(data && data.fallback);
  },

  renderRiskReadOnlyCard: function (containerEl, cardEl) {
    const container = containerEl && containerEl.jquery ? containerEl.get(0) : containerEl;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!container || !el || !el.dataset) return;

    const title = this.asText(el.dataset.riskTitle);
    const level = (this.asText(el.dataset.riskLevel) || 'Alto').replace('Medio', 'Médio');
    const probability = (this.asText(el.dataset.riskProbability) || 'Alta').replace('Media', 'Média');
    const impact = (this.asText(el.dataset.riskImpact) || 'Alto').replace('Medio', 'Médio');
    const mitigation = this.asText(el.dataset.riskMitigation);
    const fallback = this.asText(el.dataset.riskFallback);
    const visual = this.getRiskVisual(level);

    // estilo do card inteiro continua no wrapper
    el.className = `${visual.card} risk-item tipc-risk-item`;
    container.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <h5 class="font-medium ${this.escapeHtml(visual.title)} break-all">${this.escapeHtml(title)}</h5>
        <span class="${this.escapeHtml(visual.badge)} shrink-0">${this.escapeHtml(level)}</span>
      </div>
      <div class="${this.escapeHtml(visual.meta)} break-all">Probabilidade: ${this.escapeHtml(probability)} | Impacto: ${this.escapeHtml(impact)}</div>
      <div class="text-sm text-gray-700 mb-2 break-all"><strong>Mitigacao:</strong> ${this.escapeHtml(mitigation || 'Nao informado')}</div>
      <div class="text-sm text-gray-700 break-all"><strong>Plano B:</strong> ${this.escapeHtml(fallback || 'Nao informado')}</div>
      <div class="flex justify-end items-center gap-2 mt-2">
        <button type="button" data-action="edit-proposal-risk" class="text-blue-500 hover:text-blue-700" title="Editar risco"><i class="fa-solid fa-pen"></i></button>
        <button type="button" data-action="remove-proposal-risk" class="text-red-400 hover:text-red-600" title="Remover risco"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  },

  renderRiskEditCard: function (containerEl, cardEl) {
    const container = containerEl && containerEl.jquery ? containerEl.get(0) : containerEl;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!container || !el || !el.dataset) return;

    el.className = 'border border-gray-200 rounded-lg p-4 bg-white risk-item tipc-risk-item';

    const title = this.escapeHtml(this.asText(el.dataset.riskTitle));
    const level = (this.asText(el.dataset.riskLevel) || 'Alto').replace('Medio', 'Médio');
    const probability = (this.asText(el.dataset.riskProbability) || 'Alta').replace('Media', 'Média');
    const impact = (this.asText(el.dataset.riskImpact) || 'Alto').replace('Medio', 'Médio');
    const mitigation = this.escapeHtml(this.asText(el.dataset.riskMitigation));
    const fallback = this.escapeHtml(this.asText(el.dataset.riskFallback));

    container.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <input data-field="risk-title" type="text" value="${title}" placeholder="Novo risco" class="font-medium text-bevap-navy bg-transparent border-none p-0 focus:outline-none w-full">
        <button type="button" data-action="remove-proposal-risk" class="text-red-400 hover:text-red-600" title="Remover risco"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="space-y-3 text-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="flex items-center gap-2">
            <span class="text-gray-600 min-w-[84px]">Nivel:</span>
            <select data-field="risk-level" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none">
              <option ${level === 'Baixo' ? 'selected' : ''}>Baixo</option>
              <option ${level === 'Médio' ? 'selected' : ''}>Médio</option>
              <option ${level === 'Alto' ? 'selected' : ''}>Alto</option>
            </select>
          </div>
          <div class="flex items-center gap-2 text-gray-600">
            <span class="min-w-[84px]">Probabilidade:</span>
            <select data-field="risk-probability" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none">
              <option ${probability === 'Baixa' ? 'selected' : ''}>Baixa</option>
              <option ${probability === 'Média' ? 'selected' : ''}>Média</option>
              <option ${probability === 'Alta' ? 'selected' : ''}>Alta</option>
            </select>
          </div>
          <div class="flex items-center gap-2 text-gray-600">
            <span class="min-w-[84px]">Impacto:</span>
            <select data-field="risk-impact" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none">
              <option ${impact === 'Baixo' ? 'selected' : ''}>Baixo</option>
              <option ${impact === 'Médio' ? 'selected' : ''}>Médio</option>
              <option ${impact === 'Alto' ? 'selected' : ''}>Alto</option>
            </select>
          </div>
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Mitigacao:</strong>
          <textarea data-field="risk-mitigation" placeholder="Descreva a mitigacao..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none resize-none">${mitigation}</textarea>
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Plano B:</strong>
          <textarea data-field="risk-fallback" placeholder="Descreva o plano B..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none resize-none">${fallback}</textarea>
        </div>
        <button type="button" data-action="confirm-proposal-risk" class="px-3 py-1.5 bg-bevap-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm shrink-0">
          <i class="fa-solid fa-check mr-1"></i>Confirmar
        </button>
      </div>
    `;
  },

  removeRiskMatrixItem: function (target) {
    const item = $(target).closest('.tipc-risk-item');
    if (!item.length) return;
    item.remove();

    const list = this.getContainer().find('#proposal-risk-list');
    const empty = this.getContainer().find('#proposal-risk-empty');
    if (!list.find('.tipc-risk-item').length) {
      if (empty.length) empty.removeClass('hidden');
      return;
    }

    if (empty.length) empty.addClass('hidden');
    this.reindexRiskCards();
  },

  reindexRiskCards: function () {
    const list = this.getContainer().find('#proposal-risk-list');
    if (!list.length) return;

    list.find('.tipc-risk-item').each((idx, el) => {
      const cardEl = el;
      const newIndex = String(idx + 1);
      cardEl.setAttribute('data-index', newIndex);

      const fields = $(cardEl).find('.risk-fields');
      if (!fields.length) return;

      const rename = (prefix) => {
        fields.find(`[name^="${prefix}___"]`).each((_, input) => {
          const $input = $(input);
          $input.attr('name', `${prefix}___${newIndex}`);
        });
      };

      rename('tituloRiscoTIPC');
      rename('descricaoRiscoTIPC');
      rename('mitigacaoRiscoTIPC');
      rename('planoBRiscoTIPC');
      rename('nivelRiscoTIPC');
      rename('impactoRiscoTIPC');
      rename('probabilidadeRiscoTIPC');
      rename('riscoPotencialTIPC');
    });
  },

  renderPrerequisitesFromRow: function (tblValue) {
    const list = this.getContainer().find('#proposal-prerequisite-list');
    const empty = this.getContainer().find('#proposal-prerequisite-empty');
    if (!list.length) return;

    list.empty();

    const rows = this.parseTableJson(tblValue);
    const items = rows.map((item) => {
      const legacy = this.asText(item && item.preRequisitoTIPC);
      return {
        title: this.asText(item && item.tituloPreRequisitoTIPC) || legacy,
        status: this.asText(item && item.statusPreRequisitoTIPC),
        owner: this.asText(item && item.responsavelPreRequisitoTIPC),
        mitigation: this.asText(item && item.mitigacaoPreRequisitoTIPC),
        fallback: this.asText(item && item.planoBPreRequisitoTIPC),
        legacy: legacy,
        confirmed: true
      };
    }).filter((item) => item.title || item.status || item.owner || item.mitigation || item.fallback || item.legacy);

    if (!items.length) {
      if (empty.length) empty.removeClass('hidden');
      return;
    }

    items.forEach((item) => this.addPrerequisiteItem(item));
    if (empty.length) empty.addClass('hidden');
  },

  addPrerequisiteItem: function (data) {
    const list = this.getContainer().find('#proposal-prerequisite-list');
    const empty = this.getContainer().find('#proposal-prerequisite-empty');
    if (!list.length) return;

    const cardEl = document.createElement('div');
    cardEl.classList.add('tipc-prerequisite-item', 'prerequisite-item');

    const confirmed = Boolean(data && data.confirmed);
    cardEl.setAttribute('data-confirmed', confirmed ? '1' : '0');

    const nextIndex = list.find('.tipc-prerequisite-item').length + 1;
    cardEl.setAttribute('data-index', String(nextIndex));

    this.renderPrerequisiteCardShell(cardEl, {
      title: this.asText(data && (data.title || data.value)),
      status: this.asText(data && data.status) || 'Pendente',
      owner: this.asText(data && data.owner),
      mitigation: this.asText(data && data.mitigation),
      fallback: this.asText(data && data.fallback)
    });

    if (confirmed) this.showPrerequisiteReadOnly(cardEl);
    else this.showPrerequisiteEdit(cardEl);

    list.append(cardEl);

    if (empty.length) empty.addClass('hidden');
  },

  renderPrerequisiteCardShell: function (cardEl, data) {
    if (!cardEl) return;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const idx = this.asText(el.getAttribute('data-index')) || '1';

    const title = this.escapeHtml(this.asText(data && data.title));
    const status = this.escapeHtml(this.asText(data && data.status) || 'Pendente');
    const owner = this.escapeHtml(this.asText(data && data.owner));
    const mitigation = this.escapeHtml(this.asText(data && data.mitigation));
    const fallback = this.escapeHtml(this.asText(data && data.fallback));

    el.innerHTML = `
      <div class="prerequisite-fields hidden">
        <input type="text" name="tituloPreRequisitoTIPC___${this.escapeHtml(idx)}" value="${title}" data-field="prerequisite-title" />
        <input type="text" name="statusPreRequisitoTIPC___${this.escapeHtml(idx)}" value="${status}" data-field="prerequisite-status" />
        <input type="text" name="responsavelPreRequisitoTIPC___${this.escapeHtml(idx)}" value="${owner}" data-field="prerequisite-owner" />
        <input type="text" name="mitigacaoPreRequisitoTIPC___${this.escapeHtml(idx)}" value="${mitigation}" data-field="prerequisite-mitigation" />
        <input type="text" name="planoBPreRequisitoTIPC___${this.escapeHtml(idx)}" value="${fallback}" data-field="prerequisite-fallback" />
        <input type="text" name="preRequisitoTIPC___${this.escapeHtml(idx)}" value="${title}" />
      </div>

      <div class="prerequisite-edit"></div>
      <div class="prerequisite-view"></div>
    `;

    this.setPrerequisiteCardData(el, {
      title: this.asText(data && data.title),
      status: this.asText(data && data.status) || 'Pendente',
      owner: this.asText(data && data.owner),
      mitigation: this.asText(data && data.mitigation),
      fallback: this.asText(data && data.fallback)
    });
  },

  syncPrerequisiteInputsFromDataset: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el || !el.dataset) return;
    const wrap = $(el).find('.prerequisite-fields');
    if (!wrap.length) return;

    wrap.find('[name^="tituloPreRequisitoTIPC___"]').val(this.asText(el.dataset.prerequisiteTitle));
    wrap.find('[name^="statusPreRequisitoTIPC___"]').val(this.asText(el.dataset.prerequisiteStatus));
    wrap.find('[name^="responsavelPreRequisitoTIPC___"]').val(this.asText(el.dataset.prerequisiteOwner));
    wrap.find('[name^="mitigacaoPreRequisitoTIPC___"]').val(this.asText(el.dataset.prerequisiteMitigation));
    wrap.find('[name^="planoBPreRequisitoTIPC___"]').val(this.asText(el.dataset.prerequisiteFallback));
    wrap.find('[name^="preRequisitoTIPC___"]').val(this.asText(el.dataset.prerequisiteTitle));
  },

  showPrerequisiteReadOnly: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const view = $(el).find('.prerequisite-view').first();
    const edit = $(el).find('.prerequisite-edit').first();
    if (!view.length || !edit.length) return;
    edit.addClass('hidden');
    view.removeClass('hidden');
    this.renderPrerequisiteReadOnlyCard(view.get(0), el);
  },

  showPrerequisiteEdit: function (cardEl) {
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el) return;
    const view = $(el).find('.prerequisite-view').first();
    const edit = $(el).find('.prerequisite-edit').first();
    if (!view.length || !edit.length) return;
    view.addClass('hidden');
    edit.removeClass('hidden');
    this.renderPrerequisiteEditCard(edit.get(0), el);
  },

  getPrerequisiteStatusBadgeHtml: function (status) {
    const value = this.asText(status) || 'Pendente';
    if (value === 'Concluida' || value === 'Concluída') {
      return '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"><i class="fa-solid fa-check mr-1"></i>Concluida</span>';
    }
    if (value === 'Em andamento') {
      return '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"><i class="fa-solid fa-spinner mr-1"></i>Em andamento</span>';
    }
    if (value === 'Bloqueada') {
      return '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"><i class="fa-solid fa-ban mr-1"></i>Bloqueada</span>';
    }
    return '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"><i class="fa-solid fa-clock mr-1"></i>Pendente</span>';
  },

  setPrerequisiteCardData: function (cardEl, data) {
    if (!cardEl) return;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!el || !el.dataset) return;
    el.dataset.prerequisiteTitle = this.asText(data && data.title);
    el.dataset.prerequisiteStatus = this.asText(data && data.status) || 'Pendente';
    el.dataset.prerequisiteOwner = this.asText(data && data.owner);
    el.dataset.prerequisiteMitigation = this.asText(data && data.mitigation);
    el.dataset.prerequisiteFallback = this.asText(data && data.fallback);
  },

  renderPrerequisiteReadOnlyCard: function (containerEl, cardEl) {
    const container = containerEl && containerEl.jquery ? containerEl.get(0) : containerEl;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!container || !el || !el.dataset) return;

    const title = this.asText(el.dataset.prerequisiteTitle);
    const status = this.asText(el.dataset.prerequisiteStatus) || 'Pendente';
    const owner = this.asText(el.dataset.prerequisiteOwner);
    const mitigation = this.asText(el.dataset.prerequisiteMitigation);
    const fallback = this.asText(el.dataset.prerequisiteFallback);

    el.className = 'border border-gray-200 rounded-lg p-4 prerequisite-item tipc-prerequisite-item';
    container.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <h5 class="font-medium text-bevap-navy break-all">${this.escapeHtml(title)}</h5>
        ${this.getPrerequisiteStatusBadgeHtml(status)}
      </div>
      <div class="text-sm text-gray-600 mb-1 break-all">Responsavel: ${this.escapeHtml(owner || 'Nao informado')}</div>
      <div class="text-sm text-gray-700 mb-1 break-all"><strong>Mitigacao:</strong> ${this.escapeHtml(mitigation || 'Nao informado')}</div>
      <div class="text-sm text-gray-700 break-all"><strong>Plano B:</strong> ${this.escapeHtml(fallback || 'Nao informado')}</div>
      <div class="flex justify-end items-center gap-2 mt-2">
        <button type="button" data-action="edit-proposal-prerequisite" class="text-blue-500 hover:text-blue-700" title="Editar pre-requisito"><i class="fa-solid fa-pen"></i></button>
        <button type="button" data-action="remove-proposal-prerequisite" class="text-red-400 hover:text-red-600" title="Remover pre-requisito"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  },

  renderPrerequisiteEditCard: function (containerEl, cardEl) {
    const container = containerEl && containerEl.jquery ? containerEl.get(0) : containerEl;
    const el = cardEl && cardEl.jquery ? cardEl.get(0) : cardEl;
    if (!container || !el || !el.dataset) return;

    el.className = 'border border-gray-200 rounded-lg p-4 prerequisite-item tipc-prerequisite-item';

    const title = this.escapeHtml(this.asText(el.dataset.prerequisiteTitle));
    const status = this.asText(el.dataset.prerequisiteStatus) || 'Pendente';
    const owner = this.escapeHtml(this.asText(el.dataset.prerequisiteOwner));
    const mitigation = this.escapeHtml(this.asText(el.dataset.prerequisiteMitigation));
    const fallback = this.escapeHtml(this.asText(el.dataset.prerequisiteFallback));

    container.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <input data-field="prerequisite-title" type="text" value="${title}" placeholder="Novo pre-requisito" class="font-medium text-bevap-navy bg-transparent border-none p-0 focus:outline-none w-full">
        <button type="button" data-action="remove-proposal-prerequisite" class="text-red-400 hover:text-red-600" title="Remover pre-requisito"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="space-y-3 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-gray-600 min-w-[84px]">Status:</span>
          <select data-field="prerequisite-status" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border-none focus:outline-none">
            <option ${status === 'Pendente' ? 'selected' : ''}>Pendente</option>
            <option ${status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
            <option ${status === 'Bloqueada' ? 'selected' : ''}>Bloqueada</option>
            <option ${status === 'Concluida' || status === 'Concluída' ? 'selected' : ''}>Concluida</option>
          </select>
        </div>
        <div class="space-y-1 text-gray-600">
          <span class="block">Responsavel:</span>
          <input data-field="prerequisite-owner" type="text" value="${owner}" placeholder="Informe o responsavel" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Mitigacao:</strong>
          <textarea data-field="prerequisite-mitigation" placeholder="Descreva a mitigacao..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none resize-none">${mitigation}</textarea>
        </div>
        <div class="space-y-1 text-gray-700">
          <strong class="block">Plano B:</strong>
          <textarea data-field="prerequisite-fallback" placeholder="Descreva o plano B..." rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none resize-none">${fallback}</textarea>
        </div>
        <button type="button" data-action="confirm-proposal-prerequisite" class="px-3 py-1.5 bg-bevap-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm shrink-0">
          <i class="fa-solid fa-check mr-1"></i>Confirmar
        </button>
      </div>
    `;
  },

  removePrerequisiteItem: function (target) {
    const item = $(target).closest('.tipc-prerequisite-item');
    if (!item.length) return;
    item.remove();

    const list = this.getContainer().find('#proposal-prerequisite-list');
    const empty = this.getContainer().find('#proposal-prerequisite-empty');
    if (!list.find('.tipc-prerequisite-item').length) {
      if (empty.length) empty.removeClass('hidden');
      return;
    }

    if (empty.length) empty.addClass('hidden');
    this.reindexPrerequisiteCards();
  },

  reindexPrerequisiteCards: function () {
    const list = this.getContainer().find('#proposal-prerequisite-list');
    if (!list.length) return;

    list.find('.tipc-prerequisite-item').each((idx, el) => {
      const cardEl = el;
      const newIndex = String(idx + 1);
      cardEl.setAttribute('data-index', newIndex);

      const fields = $(cardEl).find('.prerequisite-fields');
      if (!fields.length) return;

      const rename = (prefix) => {
        fields.find(`[name^="${prefix}___"]`).each((_, input) => {
          const $input = $(input);
          $input.attr('name', `${prefix}___${newIndex}`);
        });
      };

      rename('tituloPreRequisitoTIPC');
      rename('statusPreRequisitoTIPC');
      rename('responsavelPreRequisitoTIPC');
      rename('mitigacaoPreRequisitoTIPC');
      rename('planoBPreRequisitoTIPC');
      rename('preRequisitoTIPC');
    });
  },

  parsePersistedAttachments: function (value) {
    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item) => {
        const documentId = this.asText(item && (item.documentId || item.documentID || item.id));
        const fileName = this.asText(item && (item.fileName || item.filename || item.name));
        const fileSize = item && item.fileSize !== undefined ? String(item.fileSize) : '';
        if (!fileName) return null;
        return {
          id: documentId ? `persisted:${documentId}` : `persisted:${fileName}`,
          documentId: documentId,
          fileName: fileName,
          fileSize: fileSize,
          persisted: true
        };
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  },

  formatAttachmentSize: function (bytes) {
    const size = Number(bytes);
    if (!isFinite(size) || size <= 0) return '';
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  },

  getAttachmentIconClass: function (fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(ext) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  renderAttachmentsList: function () {
    const list = this.getContainer().find('#proposal-attachments-list').first();
    if (!list.length) return;

    const items = Array.isArray(this._state.attachments) ? this._state.attachments : [];
    if (!items.length) {
      list.html('<div class="text-sm text-gray-500">Nenhum anexo selecionado.</div>');
      return;
    }

    list.html(items.map((att) => {
      const fileName = att.file ? att.file.name : att.fileName;
      const safeName = this.escapeHtml(fileName || 'arquivo');
      const sizeLabel = att.file
        ? this.escapeHtml(this.formatAttachmentSize(att.file.size || 0))
        : this.escapeHtml(this.asText(att.fileSize));
      const iconClass = this.escapeHtml(this.getAttachmentIconClass(fileName));
      const canRemove = !att.persisted;
      const removeAction = canRemove
        ? `<button type="button" data-action="remove-proposal-attachment" data-attachment-id="${this.escapeHtml(att.id)}" class="text-red-500 hover:text-red-700" title="Remover"><i class="fa-solid fa-trash"></i></button>`
        : `<button type="button" disabled aria-disabled="true" class="text-red-500 opacity-30 cursor-not-allowed" title="Anexo ja salvo"><i class="fa-solid fa-lock"></i></button>`;

      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid ${iconClass} text-xl mr-3"></i>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 truncate">${safeName}</div>
              <div class="text-xs text-gray-500">${sizeLabel || ''}</div>
            </div>
          </div>
          ${removeAction}
        </div>
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

  updateChecklistProgress: function () {
    const items = this.getContainer().find('.proposal-checklist-item');
    const checked = items.filter(':checked').length;
    const percentage = items.length ? Math.round((checked / items.length) * 100) : 0;

    this.getContainer().find('#commercial-checklist-percentage').text(`${percentage}%`);
    this.getContainer().find('#commercial-checklist-progress').css('width', `${percentage}%`);
  },

  getBooleanFieldValue: function (selector) {
    return this.getContainer().find(selector).is(':checked') ? 'true' : 'false';
  },

  validateForm: function () {
    const root = this.getContainer();
    const missing = [];

    if (!this.asText(root.find('#proposal-supplier-name').val())) missing.push('Nome do Fornecedor');
    if (!this.asText(root.find('#proposal-reference-number').val())) missing.push('No/Ref. da Proposta');
    if (!this.asText(root.find('#proposal-validity-days').val())) missing.push('Vigencia em Dias');
    if (!this.asText(root.find('#proposal-total-value').val())) missing.push('Valor Total');
    if (!this.asText(root.find('#proposal-currency').val())) missing.push('Moeda');
    if (!this.asText(root.find('#proposal-estimated-deadline').val())) missing.push('Prazo estimado semana');
    if (!/^\d+$/.test(this.asText(root.find('#proposal-estimated-deadline').val()))) missing.push('Prazo estimado semana (somente numero)');
    if (!this.asText(root.find('#proposal-payment-condition').val())) missing.push('Condicao de Pagamento');
    if (!this.asText(root.find('#proposal-scope-summary').val())) missing.push('Escopo Resumido');

    // Confirmacao Matriz/Pre-requisitos (prototipo): so conta quando clicar em "Confirmar" nos cards.
    const risksConfirmed = root.find('#proposal-risk-list .tipc-risk-item[data-confirmed="1"]').length;
    const prerequisitesConfirmed = root.find('#proposal-prerequisite-list .tipc-prerequisite-item[data-confirmed="1"]').length;
    const hasAnyConfirmed = (risksConfirmed + prerequisitesConfirmed) > 0;

    // Mantem o checklist como indicador visual, mas nao usa como bloqueio.
    // Regra minima: se usuario adicionou cards, deve confirmar ao menos um antes de enviar.
    const hasAnyDraftCard = root.find('#proposal-risk-list .tipc-risk-item[data-confirmed!="1"], #proposal-prerequisite-list .tipc-prerequisite-item[data-confirmed!="1"]').length > 0;
    if (hasAnyDraftCard && !hasAnyConfirmed) {
      missing.push('Matriz/Pré-requisitos (confirme ao menos 1 item)');
    }

    const items = root.find('#proposal-items-list .proposal-item-row').map((_, el) => {
      const $el = $(el);
      return {
        description: this.asText($el.find('[data-field="item-description"]').val()),
        quantity: this.asText($el.find('[data-field="item-quantity"]').val()),
        unit: this.asText($el.find('[data-field="item-unit"]').val()),
        total: this.asText($el.find('[data-field="item-total"]').val())
      };
    }).get().filter((item) => item.description || item.quantity || item.unit || item.total);

    if (!items.length) {
      missing.push('Itens / Servicos (adicione ao menos 1 item)');
    } else {
      const first = items[0];
      if (!first.description) missing.push('Item/Servico: Descricao');
      if (!first.quantity) missing.push('Item/Servico: Qtd');
      if (!first.unit) missing.push('Item/Servico: Valor Unit.');
      if (!first.total) missing.push('Item/Servico: Total');
    }

    return missing;
  },

  collectTaskFields: function (decisionValue, justificationValue, categoryValue) {
    const root = this.getContainer();
    const cardData = {
      nomeFornecedorTIPC: this.asText(root.find('#proposal-supplier-name').val()),
      codFornecedorTIPC: this.asText(root.find('#proposal-supplier-code').val()),
      cnpjTIPC: this.asText(root.find('#proposal-supplier-cnpj').val()),
      nomeContatoTIPC: this.asText(root.find('#proposal-contact-name').val()),
      emailTIPC: this.asText(root.find('#proposal-contact-email').val()),
      telefoneTIPC: this.asText(root.find('#proposal-contact-phone').val()),
      nomeContato2TIPC: this.asText(root.find('#proposal-contact2-name').val()),
      email2TIPC: this.asText(root.find('#proposal-contact2-email').val()),
      telefone2TIPC: this.asText(root.find('#proposal-contact2-phone').val()),
      numeroRefPropostaTIPC: this.asText(root.find('#proposal-reference-number').val()),
      vigenciaDiasTIPC: this.asText(root.find('#proposal-validity-days').val()),
      valortotalTIPC: this.asText(root.find('#proposal-total-value').val()),
      moedaTIPC: this.asText(root.find('#proposal-currency').val()),
      simboloMoedaTIPC: this.asText(root.find('#proposal-currency-symbol').val()),
      prazoEstimadoTIPC: this.asText(root.find('#proposal-estimated-deadline').val()),
      condicaoPagamentoTIPC: this.asText(root.find('#proposal-payment-condition').val()),
      codigoCondicaoPagamentoTIPC: this.asText(root.find('#proposal-payment-condition-code').val()),
      escopoResumidoTIPC: this.asText(root.find('#proposal-scope-summary').val()),
      escopoClaroDetalhadoTIPC: this.getBooleanFieldValue('#proposal-check-scope'),
      impostosTaxasInclusosTIPC: this.getBooleanFieldValue('#proposal-check-taxes'),
      prazosEntregaDefinidosTIPC: this.getBooleanFieldValue('#proposal-check-deadlines'),
      garantiasSlaEspecificadosTIPC: this.getBooleanFieldValue('#proposal-check-sla'),
      vigenciaPropostaConfirmadaTIPC: this.getBooleanFieldValue('#proposal-check-validity'),
      documentosAnexCompTIPC: this.getBooleanFieldValue('#proposal-check-documents')
    };

    if (decisionValue !== undefined) {
      cardData.decisaoTIPC = this.asText(decisionValue);
    }

    if (justificationValue !== undefined) {
      cardData.justificativaTIPC = this.asText(justificationValue);
    }

    if (categoryValue !== undefined) {
      cardData.categoriajustiTIPC = this.asText(categoryValue);
    }

    const persistedAttachments = (Array.isArray(this._state.attachments) ? this._state.attachments : [])
      .filter((att) => att && att.persisted)
      .map((att) => {
        return {
          documentId: this.asText(att.documentId),
          fileName: this.asText(att.fileName),
          fileSize: this.asText(att.fileSize)
        };
      })
      .filter((att) => att.fileName);

    if (persistedAttachments.length) {
      cardData.anexosPropostaTIPC = JSON.stringify(persistedAttachments);
    }

    const items = root.find('#proposal-items-list .proposal-item-row').map((_, el) => {
      const $el = $(el);
      return {
        description: this.asText($el.find('[data-field="item-description"]').val()),
        quantity: this.asText($el.find('[data-field="item-quantity"]').val()),
        unit: this.asText($el.find('[data-field="item-unit"]').val()),
        total: this.asText($el.find('[data-field="item-total"]').val())
      };
    }).get().filter((item) => item.description || item.quantity || item.unit || item.total);

    items.forEach((item, index) => {
      const i = index + 1;
      cardData[`descricaoItemServicoTIPC___${i}`] = item.description;
      cardData[`quantidadeItemServicoTIPC___${i}`] = item.quantity;
      cardData[`valorUnitarioItemServicoTIPC___${i}`] = item.unit;
      cardData[`totalItemServicoTIPC___${i}`] = item.total;
    });

    // Riscos e Pre-requisitos: mantemos inputs hidden com names do pai/filho.
    // Para salvar, coletamos esses inputs SOMENTE dos cards confirmados.
    const allowedRiskFieldName = /^(tituloRiscoTIPC|descricaoRiscoTIPC|mitigacaoRiscoTIPC|planoBRiscoTIPC|nivelRiscoTIPC|impactoRiscoTIPC|probabilidadeRiscoTIPC|riscoPotencialTIPC)___\d+$/;
    root.find('#proposal-risk-list .tipc-risk-item[data-confirmed="1"] .risk-fields :input[name]').each((_, input) => {
      const $input = $(input);
      const name = this.asText($input.attr('name'));
      if (!name || !allowedRiskFieldName.test(name)) return;
      cardData[name] = this.asText($input.val());
    });

    const allowedPrerequisiteFieldName = /^(tituloPreRequisitoTIPC|statusPreRequisitoTIPC|responsavelPreRequisitoTIPC|mitigacaoPreRequisitoTIPC|planoBPreRequisitoTIPC|preRequisitoTIPC)___\d+$/;
    root.find('#proposal-prerequisite-list .tipc-prerequisite-item[data-confirmed="1"] .prerequisite-fields :input[name]').each((_, input) => {
      const $input = $(input);
      const name = this.asText($input.attr('name'));
      if (!name || !allowedPrerequisiteFieldName.test(name)) return;
      cardData[name] = this.asText($input.val());
    });

    return Object.keys(cardData).map((fieldName) => {
      return { name: fieldName, value: cardData[fieldName] };
    });
  },

  updateRiskEmptyState: function () {
    const root = this.getContainer();
    const empty = root.find('#proposal-risk-empty');
    if (!empty.length) return;
    const any = root.find('#proposal-risk-list .tipc-risk-item[data-confirmed="1"]').length > 0;
    empty.toggleClass('hidden', any);
  },

  updatePrerequisiteEmptyState: function () {
    const root = this.getContainer();
    const empty = root.find('#proposal-prerequisite-empty');
    if (!empty.length) return;
    const any = root.find('#proposal-prerequisite-list .tipc-prerequisite-item[data-confirmed="1"]').length > 0;
    empty.toggleClass('hidden', any);
  },

  confirmRiskMatrixItem: function (btnEl) {
    const card = $(btnEl).closest('.tipc-risk-item');
    if (!card.length) return;

    // Inputs de edicao estao dentro de .risk-edit
    const title = this.asText(card.find('.risk-edit [data-field="risk-title"]').val());
    if (!title) {
      this.showToast('Campo obrigatorio', 'Informe o titulo do risco.', 'warning');
      return;
    }

    const data = {
      title,
      description: this.asText(card.find('.risk-edit [data-field="risk-description"]').val()),
      mitigation: this.asText(card.find('.risk-edit [data-field="risk-mitigation"]').val()),
      fallback: this.asText(card.find('.risk-edit [data-field="risk-fallback"]').val()),
      level: this.asText(card.find('.risk-edit [data-field="risk-level"]').val()),
      impact: this.asText(card.find('.risk-edit [data-field="risk-impact"]').val()),
      probability: this.asText(card.find('.risk-edit [data-field="risk-probability"]').val())
    };

    this.setRiskCardData(card, data);
    card.attr('data-confirmed', '1');
    this.syncRiskInputsFromDataset(card);
    this.showRiskReadOnly(card);
    this.updateRiskEmptyState();
  },

  editRiskMatrixItem: function (btnEl) {
    const card = $(btnEl).closest('.tipc-risk-item');
    if (!card.length) return;
    card.attr('data-confirmed', '0');
    this.showRiskEdit(card);
    this.updateRiskEmptyState();
  },

  confirmPrerequisiteItem: function (btnEl) {
    const card = $(btnEl).closest('.tipc-prerequisite-item');
    if (!card.length) return;

    const title = this.asText(card.find('.prerequisite-edit [data-field="prerequisite-title"]').val());
    if (!title) {
      this.showToast('Campo obrigatorio', 'Informe o titulo do pre-requisito.', 'warning');
      return;
    }

    const data = {
      title,
      status: this.asText(card.find('.prerequisite-edit [data-field="prerequisite-status"]').val()),
      owner: this.asText(card.find('.prerequisite-edit [data-field="prerequisite-owner"]').val()),
      mitigation: this.asText(card.find('.prerequisite-edit [data-field="prerequisite-mitigation"]').val()),
      fallback: this.asText(card.find('.prerequisite-edit [data-field="prerequisite-fallback"]').val())
    };

    this.setPrerequisiteCardData(card, data);
    card.attr('data-confirmed', '1');
    this.syncPrerequisiteInputsFromDataset(card);
    this.showPrerequisiteReadOnly(card);
    this.updatePrerequisiteEmptyState();
  },

  editPrerequisiteItem: function (btnEl) {
    const card = $(btnEl).closest('.tipc-prerequisite-item');
    if (!card.length) return;
    card.attr('data-confirmed', '0');
    this.showPrerequisiteEdit(card);
    this.updatePrerequisiteEmptyState();
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Salvando rascunho da proposta...');
      await this.waitForUiPaint();
      await fluigService.saveDraft({
        mode: 'updateCardDraft',
        documentId: this._state.documentId,
        taskFields: this.collectTaskFields()
      });
      this.showToast('Rascunho salvo', 'As alteracoes foram salvas com sucesso.', 'success');
    } catch (error) {
      console.error('[commercialProposal] Error saving draft:', error);
      this.showToast('Erro ao salvar', error && error.message ? error.message : 'Nao foi possivel salvar o rascunho.', 'error');
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  createActionLoading: function () {
    if (typeof modalLoadingService !== 'undefined' && modalLoadingService.show) {
      return modalLoadingService.show({
        title: 'Enviando proposta',
        message: 'Aguarde enquanto os dados sao enviados ao Fluig...'
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
      throw new Error('Nao foi possivel identificar a solicitacao atual');
    }

    const processInstanceId = await fluigService.resolveProcessInstanceIdByDocumentId(this._state.documentId);
    this._state.processInstanceId = this.asText(processInstanceId);
    return this._state.processInstanceId;
  },

  submitProposal: async function (config) {
    if (this._state.isSubmitting) return;

    const loading = this.createActionLoading();
    this._state.isSubmitting = true;

    try {
      const decisionValue = this.asText(config && config.decisionValue).toLowerCase();
      const requiresFullValidation = !decisionValue || decisionValue === 'aprovado';

      if (requiresFullValidation) {
        const missing = this.validateForm();
        if (missing.length) {
          if (config && config.modalId) {
            this.closeModal(config.modalId);
          }
          this.showToast('Campos obrigatorios', `Preencha: ${missing.join(' | ')}`, 'warning');
          return;
        }
      }

      loading.updateMessage('Preparando proposta comercial...');
      await this.waitForUiPaint();

      const processInstanceId = await this.resolveProcessInstanceId();
      const taskFields = this.collectTaskFields(
        config && config.decisionValue,
        config && config.justification,
        config && config.category
      );
      const attachments = await this.collectAttachmentsPayload();

      try {
        const nonEmptyFields = taskFields.filter((f) => this.asText(f && f.value) !== '').length;
        console.log('[commercialProposal] taskFields total:', taskFields.length, 'nonEmpty:', nonEmptyFields);
      } catch (e) {}

      loading.updateMessage('Enviando movimentacao para o Fluig...');
      await this.waitForUiPaint();

      await fluigService.saveAndSendTask({
        id: processInstanceId,
        numState: 40,
        documentId: this._state.documentId,
        datasetName: 'DSFormSolicitacaoProjetos',
        attachments: attachments
      }, taskFields);

      if (config && config.modalId) {
        this.closeModal(config.modalId);
      }
      this.showToast('Sucesso', this.asText(config && config.successMessage) || 'Movimentacao registrada com sucesso.', 'success');

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 600);
    } catch (error) {
      console.error('[commercialProposal] Error sending proposal:', error);
      this.showToast('Erro ao enviar', error && error.message ? error.message : 'Nao foi possivel enviar a proposta.', 'error');
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
    toastTitle.text(title || 'Informacao');
    toastMessage.text(message || '');
    toast.removeClass('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.addClass('hidden');
      this._toastTimer = null;
    }, 3500);
  },

  getPriorityLabel: function (priority) {
    const normalized = this.asText(priority).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.indexOf('critico') !== -1) return 'Critico';
    if (normalized.indexOf('estrategico') !== -1) return 'Estrategico';
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

  parseBooleanLike: function (value) {
    if (value === true) return true;
    if (value === false) return false;

    const normalized = this.asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!normalized) return null;
    if (['1', 'true', 'sim', 's', 'yes', 'on'].indexOf(normalized) >= 0) return true;
    if (['0', 'false', 'nao', 'n', 'no', 'off'].indexOf(normalized) >= 0) return false;
    return null;
  },

  parseMoneyValue: function (value) {
    const text = this.asText(value);
    if (!text) return null;

    const normalized = text
      .replace(/\s/g, '')
      .replace(/[A-Za-z$€£R]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');

    const parsed = Number(normalized);
    return isFinite(parsed) ? parsed : null;
  },

  formatCurrencyValue: function (value) {
    const amount = Number(value);
    if (!isFinite(amount)) return '';

    const root = this.getContainer();
    const currencySymbol = this.asText(root.find('#proposal-currency-symbol').val());
    const currencyLabel = this.asText(root.find('#proposal-currency').val());
    const prefix = currencySymbol || currencyLabel || 'R$';
    return `${prefix} ${amount.toFixed(2).replace('.', ',')}`;
  },

  normalizeLookupText: function (value) {
    return this.asText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
