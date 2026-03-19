const newSolicitationController = {
  _eventNamespace: '.newSolicitation',

  _state: {
    currentStep: 1,
    numSolicitacao: "",
    documentId: "",
    processInstanceId: "",
    isSubmitting: false,
    attachments: []
  },

  _draftFields: [
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
    'tblObjetivosEstrategicosNS.descricaoobjetivoNS',
    'tblRiscosIniciaisNS.riscoPotencialNS',
    'tblStakeholdersNS.valorstakeholdersNS'
  ],

  _constants: {
    requiredFields: [
      'titulo',
      'area',
      'centro-custo',
      'patrocinador',
      'objetivo',
      'problema',
      'beneficios',
      'escopo-inicial',
      'out-of-scope',
      'dependencies',
      'declaracao'
    ],
    completionFields: [
      'titulo',
      'area',
      'centro-custo',
      'patrocinador',
      'objetivo',
      'problema',
      'beneficios',
      'escopo-inicial',
      'out-of-scope',
      'dependencies',
      'declaracao',
      'alinhamento'
    ],
    requiredFieldLabels: {
      titulo: 'Titulo do Projeto',
      area: 'Area/Unidade',
      'centro-custo': 'Centro de Custo',
      patrocinador: 'Patrocinador',
      objetivo: 'Objetivo do Projeto',
      problema: 'Problema/Oportunidade',
      beneficios: 'Beneficios Esperados',
      'escopo-inicial': 'Escopo Inicial',
      'out-of-scope': 'Fora de Escopo',
      dependencies: 'Dependencias',
      declaracao: 'Declaracao'
    },
    checklistSections: [
      {
        step: 1,
        fields: ['titulo', 'area', 'centro-custo', 'patrocinador', 'objetivo', 'problema', 'beneficios']
      },
      {
        step: 2,
        fields: ['escopo-inicial', 'out-of-scope', 'dependencies']
      },
      {
        step: 3,
        fields: ['declaracao']
      }
    ]
  },

  load: function (params = {}) {
    const container = this.getContainer();
    this.destroy();
    this._state.documentId = params && params.documentId ? String(params.documentId) : "";
    this._state.processInstanceId = params && params.processInstanceId ? String(params.processInstanceId) : "";

    return $.get(this.getTemplateUrl())
      .done((html) => {
        container.html(html);
        this.initializePage();
      })
      .fail((error) => {
        console.error('New solicitation template load error:', error);
        container.html('<div class="p-6 text-red-600">Failed to load new solicitation page.</div>');
      });
  },

  destroy: function () {
    this.unbindEvents();
    this._state.currentStep = 1;
    this._state.numSolicitacao = "";
    this._state.documentId = "";
    this._state.processInstanceId = "";
    this._state.isSubmitting = false;
    this._state.attachments = [];
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-new-solicitation.html`;
  },

  getContainer: function () {
    return $('#page-container');
  },

  initializePage: function () {
    this.bindEvents();
    this.registerZoomCallbacks();
    this.initializeZoomFields();
    this._state.currentStep = 1;
    this._state.attachments = [];
    this.updateStepper();
    this.updateChecklist();
    this.toggleStrategicObjectives();
    this.updateSummaryPriority();
    this.updateSummaryDetails();
    this.renderAttachments();
    this.loadDraftFromDataset();
  },

  registerZoomCallbacks: function () {
    window.setSelectedZoomItem = setSelectedZoomItem;
    window.removedZoomItem = removedZoomItem;
  },

  initializeZoomFields: function () {
    if (typeof loadZoom === 'function') {
      loadZoom();
      return;
    }

    console.warn('[newSolicitation] loadZoom nao encontrado. Os campos zoom podem nao inicializar.');
  },

  bindEvents: function () {
    const container = this.getContainer();
    const ns = this._eventNamespace;

    this.unbindEvents();

    container.on(`click${ns}`, '[data-action="next-step"]', (event) => {
      event.preventDefault();
      const step = Number($(event.currentTarget).attr('data-step'));
      this.goToStep(step);
    });

    container.on(`click${ns}`, '[data-action="prev-step"]', (event) => {
      event.preventDefault();
      const step = Number($(event.currentTarget).attr('data-step'));
      this.goToStep(step);
    });

    container.on(`click${ns}`, '[data-action="go-prev-step"]', (event) => {
      event.preventDefault();
      this.goToPreviousStep();
    });

    container.on(`click${ns}`, '[data-action="add-risk"]', (event) => {
      event.preventDefault();
      this.addRisk();
    });

    container.on(`click${ns}`, '[data-action="remove-risk"]', (event) => {
      event.preventDefault();
      $(event.currentTarget).closest('.flex.items-center.gap-2').remove();
      this.updateChecklist();
    });

    container.on(`click${ns}`, '[data-action="add-strategic-objective"]', (event) => {
      event.preventDefault();
      this.addStrategicObjective();
    });

    container.on(`click${ns}`, '[data-action="remove-strategic-objective"]', (event) => {
      event.preventDefault();
      $(event.currentTarget).closest('.strategic-objective-item').remove();
      this.updateChecklist();
    });

    container.on(`click${ns}`, '[data-action="add-stakeholder"]', (event) => {
      event.preventDefault();
      this.addStakeholder();
    });

    container.on(`keydown${ns}`, '#stakeholder-input', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.addStakeholder();
      }
    });

    container.on(`click${ns}`, '[data-action="remove-stakeholder"]', (event) => {
      event.preventDefault();
      $(event.currentTarget).closest('span.inline-flex').remove();
    });

    container.on(`click${ns}`, '#dropzone', (event) => {
      event.preventDefault();
      container.find('#attachments-input').trigger('click');
    });

    container.on(`dragover${ns}`, '#dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).addClass('border-bevap-green bg-green-50');
    });

    container.on(`dragleave${ns}`, '#dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('border-bevap-green bg-green-50');
    });

    container.on(`drop${ns}`, '#dropzone', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const dropzone = $(event.currentTarget);
      dropzone.removeClass('border-bevap-green bg-green-50');

      const files = event.originalEvent && event.originalEvent.dataTransfer
        ? event.originalEvent.dataTransfer.files
        : null;
      this.addAttachments(files);
    });

    container.on(`change${ns}`, '#attachments-input', (event) => {
      const files = event.currentTarget.files;
      this.addAttachments(files);
      event.currentTarget.value = '';
    });

    container.on(`click${ns}`, '[data-action="remove-attachment"]', (event) => {
      event.preventDefault();
      const attachmentId = String($(event.currentTarget).attr('data-file-id') || '').trim();
      if (!attachmentId) return;
      this.removeAttachment(attachmentId);
    });

    container.on(`click${ns}`, '[data-action="save-draft"]', (event) => {
      event.preventDefault();
      this.saveDraft();
    });

    container.on(`click${ns}`, '[data-action="cancel-form"]', (event) => {
      event.preventDefault();
      this.cancelForm();
    });

    container.on(`click${ns}`, '[data-action="submit-form"]', (event) => {
      event.preventDefault();
      this.submitForm();
    });

    container.on(`click${ns}`, '[data-action="view-request"]', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.viewRequest();
    });

    container.on(`click${ns}`, '[data-action="close-modal"]', (event) => {
      event.preventDefault();
      this.closeModal();
    });

    container.on(`click${ns}`, '[data-action="close-validation-modal"]', (event) => {
      event.preventDefault();
      this.closeValidationModal();
    });

    container.on(`change${ns}`, 'input[name="prioridade"]', () => {
      this.updateSummaryPriority();
      this.updateSummaryDetails();
    });

    container.on(`change${ns}`, '#alinhamento', () => {
      this.toggleStrategicObjectives();
      this.updateChecklist();
    });

    container.on(`input${ns} change${ns}`, '.field-input, input[required], textarea[required]', () => {
      this.updateChecklist();
      this.updateSummaryDetails();
    });
  },

  unbindEvents: function () {
    this.getContainer().off(this._eventNamespace);
  },

  getField: function (fieldId) {
    const container = this.getContainer();
    const field = container.find(`#${fieldId}, [name="${fieldId}"], [data-field="${fieldId}"]`).first();
    return field.length ? field : null;
  },

  isFieldFilled: function (field) {
    if (!field || !field.length) return false;

    const type = String(field.attr('type') || '').toLowerCase();

    if (type === 'checkbox') return field.is(':checked');

    if (type === 'radio') {
      const name = field.attr('name');
      if (!name) return field.is(':checked');
      return this.getContainer().find(`input[name="${name}"]:checked`).length > 0;
    }

    return String(field.val() || '').trim() !== '';
  },

  validateForm: function () {
    return this._constants.requiredFields.reduce((missing, fieldId) => {
      const field = this.getField(fieldId);
      if (!field) return missing;

      if (!this.isFieldFilled(field)) {
        missing.push(this._constants.requiredFieldLabels[fieldId] || fieldId);
      }

      return missing;
    }, []);
  },

  showValidationModal: function (missingFields) {
    const modalContent = this.getContainer().find('#missing-fields');
    modalContent.empty();

    missingFields.forEach((field) => {
      modalContent.append(`
        <div class="flex items-start mb-2 last:mb-0">
          <i class="fa-solid fa-circle text-red-400 text-xs mt-1.5 mr-2 flex-shrink-0"></i>
          <span class="text-sm text-red-800">${field}</span>
        </div>
      `);
    });

    this.getContainer().find('#validation-modal').removeClass('hidden');
  },

  closeValidationModal: function () {
    this.getContainer().find('#validation-modal').addClass('hidden');
  },

  updateChecklist: function () {
    const allCompleted = { 1: false, 2: false, 3: false };

    this._constants.checklistSections.forEach((section) => {
      const sectionCompleted = section.fields.every((fieldId) => this.isFieldFilled(this.getField(fieldId)));
      allCompleted[section.step] = sectionCompleted;
    });

    const checklistItems = this.getContainer().find('#checklist-card .space-y-2 > .flex.items-center');
    checklistItems.each((index, item) => {
      const itemIndex = index + 1;
      const row = $(item);
      const icon = row.find('.checklist-icon').first();
      const label = row.find('span').eq(1);

      if (allCompleted[itemIndex]) {
        icon.html('&#10003;').attr('class', 'checklist-icon text-bevap-green mr-2 font-bold');
        label.removeClass('text-gray-400').addClass('text-gray-700');
      } else {
        icon.html('&#9675;').attr('class', 'checklist-icon text-gray-300 mr-2 font-semibold');
        label.removeClass('text-gray-700').addClass('text-gray-400');
      }
    });

    const totalRequired = this._constants.completionFields.length;
    const filledRequired = this._constants.completionFields.reduce((count, fieldId) => {
      return count + (this.isFieldFilled(this.getField(fieldId)) ? 1 : 0);
    }, 0);

    const progress = totalRequired > 0 ? Math.round((filledRequired / totalRequired) * 100) : 0;

    const progressBar = this.getContainer().find('#checklist-card .mt-4.pt-4.border-t .bg-bevap-green.h-2.rounded-full').first();
    const progressLabel = this.getContainer().find('#checklist-card .mt-4.pt-4.border-t .font-semibold.text-bevap-navy').first();

    if (progressBar.length && progressLabel.length) {
      progressBar.css('width', `${progress}%`);
      progressLabel.text(`${progress}%`);
    }
  },

  goToStep: function (step) {
    if (!step || step < 1) return;

    const container = this.getContainer();
    const currentStep = this._state.currentStep;
    const currentSelector = `#step-${currentStep}`;
    const nextSelector = `#step-${step}`;

    if (!container.find(nextSelector).length) return;

    container.find(currentSelector).addClass('hidden');
    container.find(nextSelector).removeClass('hidden');

    this._state.currentStep = step;
    this.updateStepper();
    this.updateChecklist();

    scrollTo({ top: 0, behavior: 'smooth' });
  },

  goToPreviousStep: function () {
    if (this._state.currentStep > 1) {
      this.goToStep(this._state.currentStep - 1);
    }
  },

  updateStepper: function () {
    const steps = this.getContainer().find('#stepper .flex-1');

    steps.each((index, element) => {
      const stepNumber = index + 1;
      const step = $(element);
      const circle = step.find('.w-10').first();
      const label = step.find('span').first();
      const lineLeft = step.find('.line-left').first();
      const lineRight = step.find('.line-right').first();

      if (stepNumber < this._state.currentStep) {
        circle.removeClass('bg-gray-300 text-gray-600').addClass('bg-bevap-green text-white shadow-lg');
        circle.html('<i class="fa-solid fa-check"></i>');
        label.removeClass('text-gray-500').addClass('text-bevap-green font-medium');
        if (lineLeft.length) lineLeft.addClass('bg-bevap-green');
        if (lineRight.length) lineRight.addClass('bg-bevap-green');
        return;
      }

      if (stepNumber === this._state.currentStep) {
        circle.removeClass('bg-gray-300 text-gray-600').addClass('bg-bevap-green text-white shadow-lg');
        circle.text(stepNumber);
        label.removeClass('text-gray-500').addClass('text-bevap-green font-medium');
        if (lineLeft.length) lineLeft.addClass('bg-bevap-green');
        if (lineRight.length) lineRight.removeClass('bg-bevap-green');
        return;
      }

      circle.removeClass('bg-bevap-green text-white shadow-lg').addClass('bg-gray-300 text-gray-600');
      circle.text(stepNumber);
      label.removeClass('text-bevap-green font-medium').addClass('text-gray-500');
      if (lineLeft.length) lineLeft.removeClass('bg-bevap-green');
      if (lineRight.length) lineRight.removeClass('bg-bevap-green');
    });
  },

  addRisk: function () {
    const risksList = this.getContainer().find('#riscos-list');

    risksList.append(`
      <div class="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <i class="fa-solid fa-triangle-exclamation text-yellow-600"></i>
        <input type="text" placeholder="Descreva um risco potencial..." class="field-input flex-1 bg-transparent border-none focus:outline-none text-sm" data-field="riscos">
        <button data-action="remove-risk" class="text-red-500 hover:text-red-700">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `);

    this.updateChecklist();
  },

  toggleStrategicObjectives: function () {
    const container = this.getContainer();
    const checkbox = container.find('#alinhamento');
    const section = container.find('#objetivos-estrategicos-section');
    if (!checkbox.length || !section.length) return;

    if (checkbox.is(':checked')) {
      section.removeClass('hidden');
      return;
    }

    section.addClass('hidden');
  },

  addStrategicObjective: function () {
    const list = this.getContainer().find('#objetivos-estrategicos-list');
    if (!list.length) return;

    list.append(`
      <div class="strategic-objective-item flex items-center gap-2 p-3 bg-white border border-green-200 rounded-lg">
        <input type="text" placeholder="Descreva um objetivo estratÃ©gico..." class="field-input flex-1 bg-transparent border-none focus:outline-none text-sm" data-field="objetivos-estrategicos">
        <button data-action="remove-strategic-objective" class="text-red-500 hover:text-red-700">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `);
  },

  getPriorityPresentation: function (value) {
    const map = {
      critico: {
        label: 'Crítico',
        classes: 'bg-red-100 text-red-700',
        icon: 'fa-circle-exclamation'
      },
      estrategico: {
        label: 'Estratégico',
        classes: 'bg-green-100 text-green-800',
        icon: 'fa-star'
      },
      operacional: {
        label: 'Operacional',
        classes: 'bg-blue-100 text-blue-800',
        icon: 'fa-circle'
      }
    };

    return map[value] || map.estrategico;
  },

  updateSummaryPriority: function () {
    const container = this.getContainer();
    const selectedPriority = container.find('input[name="prioridade"]:checked').val();
    const priority = this.getPriorityPresentation(selectedPriority);
    const badge = container.find('#summary-priority-badge');
    const icon = container.find('#summary-priority-icon');
    const label = container.find('#summary-priority-label');

    badge.removeClass('bg-red-100 text-red-700 bg-green-100 text-green-800 bg-blue-100 text-blue-800');
    badge.addClass(priority.classes);
    icon.attr('class', `fa-solid ${priority.icon} mr-1`);
    label.text(priority.label);
  },

  updateSummaryDetails: function () {
    const container = this.getContainer();
    const codeValue = container.find('#summary-code-value');
    const areaValue = container.find('#summary-area-value');
    const sponsorValue = container.find('#summary-sponsor-value');

    if (codeValue.length) {
      codeValue.text('N/A');
    }

    if (areaValue.length) {
      const areaField = container.find('#area');
      const selectedArea = areaField.length ? String(areaField.val() || '').trim() : '';
      areaValue.text(selectedArea || 'N/A');
    }

    if (sponsorValue.length) {
      const sponsor = String(container.find('#patrocinador').val() || '').trim();
      sponsorValue.text(sponsor || 'N/A');
    }
  },

  addStakeholder: function () {
    const input = this.getContainer().find('#stakeholder-input').first();
    const value = String(input.val() || '').trim();
    if (!value) return;

    this.getContainer().find('#stakeholders-list').append(`
      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-bevap-navy text-white">
        ${value}
        <button data-action="remove-stakeholder" class="ml-2 hover:text-red-300">
          <i class="fa-solid fa-times text-xs"></i>
        </button>
      </span>
    `);

    input.val('');
  },

  addAttachments: function (filesList) {
    const files = Array.from(filesList || []);
    if (!files.length) return;

    const maxSizeBytes = 10 * 1024 * 1024;

    files.forEach((file) => {
      if (!file) return;

      if (file.size > maxSizeBytes) {
        this.showNotification({
          borderClass: 'border-red-500',
          iconClass: 'fa-triangle-exclamation text-red-500',
          title: 'Arquivo acima do limite',
          message: `${file.name} excede 10MB e nao foi adicionado.`
        });
        return;
      }

      const alreadyExists = this._state.attachments.some((attachment) => {
        if (attachment.file) {
          return attachment.file.name === file.name
            && attachment.file.size === file.size
            && attachment.file.lastModified === file.lastModified;
        }

        return attachment.fileName === file.name;
      });

      if (alreadyExists) return;

      this._state.attachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: file
      });
    });

    this.renderAttachments();
  },

  removeAttachment: function (attachmentId) {
    this._state.attachments = this._state.attachments.filter((attachment) => attachment.id !== attachmentId);
    this.renderAttachments();
  },

  parseTableJson: function (value) {
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

  parseAttachmentMetadata: function (value) {
    const text = this.asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  },

  setFieldValue: function (selector, value) {
    const field = this.getContainer().find(selector).first();
    if (!field.length) return;
    field.val(value === null || value === undefined ? '' : String(value));
  },

  renderStrategicObjectives: function (items) {
    const list = this.getContainer().find('#objetivos-estrategicos-list');
    if (!list.length) return;

    const rows = (items || []).length ? items : [''];
    list.html(rows.map((value) => {
      return `
        <div class="strategic-objective-item flex items-center gap-2 p-3 bg-white border border-green-200 rounded-lg">
          <input type="text" placeholder="Descreva um objetivo estrategico..." class="field-input flex-1 bg-transparent border-none focus:outline-none text-sm" data-field="objetivos-estrategicos" value="${this.escapeHtml(value)}">
          <button data-action="remove-strategic-objective" class="text-red-500 hover:text-red-700">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      `;
    }).join(''));
  },

  renderInitialRisks: function (items) {
    const list = this.getContainer().find('#riscos-list');
    if (!list.length) return;

    const rows = (items || []).length ? items : [''];
    list.html(rows.map((value) => {
      return `
        <div class="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <i class="fa-solid fa-triangle-exclamation text-yellow-600"></i>
          <input type="text" placeholder="Descreva um risco potencial..." class="field-input flex-1 bg-transparent border-none focus:outline-none text-sm" data-field="riscos" value="${this.escapeHtml(value)}">
          <button data-action="remove-risk" class="text-red-500 hover:text-red-700">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      `;
    }).join(''));
  },

  renderStakeholderList: function (items) {
    const list = this.getContainer().find('#stakeholders-list');
    if (!list.length) return;

    list.html((items || []).map((value) => {
      return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-bevap-navy text-white">
          ${this.escapeHtml(value)}
          <button data-action="remove-stakeholder" class="ml-2 hover:text-red-300">
            <i class="fa-solid fa-times text-xs"></i>
          </button>
        </span>
      `;
    }).join(''));
  },

  restorePersistedAttachments: function (items) {
    this._state.attachments = (items || []).map((item, index) => {
      return {
        id: `saved-att-${index + 1}`,
        persisted: true,
        fileName: this.asText(item && item.fileName),
        fileSize: this.asText(item && item.fileSize)
      };
    }).filter((item) => item.fileName);
  },

  getDraftUiCacheKey: function (documentId) {
    const finalDocumentId = this.asText(documentId);
    return finalDocumentId ? `gp:new-solicitation:draft:${finalDocumentId}` : '';
  },

  readDraftUiCache: function (documentId) {
    const cacheKey = this.getDraftUiCacheKey(documentId);
    if (!cacheKey || typeof window === 'undefined' || !window.localStorage) {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  },

  writeDraftUiCache: function (documentId, payload) {
    const cacheKey = this.getDraftUiCacheKey(documentId);
    if (!cacheKey || typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(cacheKey, JSON.stringify({
        "centro-custo": this.asText(payload && payload["centro-custo"]),
        stakeholders: Array.isArray(payload && payload.stakeholders) ? payload.stakeholders : [],
        declaracao: !!(payload && payload.declaracao)
      }));
    } catch (error) {}
  },

  clearDraftUiCache: function (documentId) {
    const cacheKey = this.getDraftUiCacheKey(documentId);
    if (!cacheKey || typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      window.localStorage.removeItem(cacheKey);
    } catch (error) {}
  },

  normalizeStringArray: function (items) {
    return (Array.isArray(items) ? items : [])
      .map((item) => this.asText(item))
      .filter(Boolean);
  },

  setZoomDisplayValue: function (inputSelector, hiddenSelector, value) {
    const finalValue = this.asText(value);
    const container = this.getContainer();
    const field = container.find(inputSelector).first();
    if (field.length) {
      field.val(finalValue);
      field.attr('value', finalValue);
      field.trigger('change');
    }

    if (hiddenSelector) {
      const hidden = container.find(hiddenSelector).first();
      if (hidden.length) {
        hidden.val(finalValue);
      }
    }
  },

  loadDraftFromDataset: async function () {
    if (!this._state.documentId) {
      return;
    }

    try {
      const rows = await fluigService.getDatasetRows('dsGetSolicitacaoProjetos', {
        fields: this._draftFields,
        filters: {
          documentid: this._state.documentId
        }
      });

      const row = rows && rows.length ? rows[0] : null;
      if (!row) {
        return;
      }

      this.applyDraftRow(row);
    } catch (error) {
      console.error('[newSolicitation] Error loading draft:', error);
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Erro ao carregar rascunho',
        message: 'Nao foi possivel carregar os dados salvos desta solicitacao.'
      });
    }
  },

  applyDraftRow: function (row) {
    const currentDocumentId = this.asText(row.documentid) || this._state.documentId;
    const cachedUiState = this.readDraftUiCache(currentDocumentId);
    const objectives = this.parseTableJson(row.tblObjetivosEstrategicosNS)
      .map((item) => this.asText(item && item.descricaoobjetivoNS))
      .filter(Boolean);
    const risks = this.parseTableJson(row.tblRiscosIniciaisNS)
      .map((item) => this.asText(item && item.riscoPotencialNS))
      .filter(Boolean);
    const stakeholdersFromDataset = this.parseTableJson(row.tblStakeholdersNS || row.tblstakeholdersNS)
      .map((item) => this.asText(item && item.valorstakeholdersNS))
      .filter(Boolean);
    const stakeholders = stakeholdersFromDataset.length
      ? stakeholdersFromDataset
      : this.normalizeStringArray(cachedUiState.stakeholders);
    const attachments = this.parseAttachmentMetadata(row.anexosNS);
    const centroCusto = this.asText(row.centrodecustoNS) || this.asText(cachedUiState["centro-custo"]);
    const declaracao = cachedUiState.declaracao === true;

    this._state.documentId = currentDocumentId;
    this.setFieldValue('#titulo', row.titulodoprojetoNS);
    this.setFieldValue('#area', row.areaUnidadeNS);
    this.setZoomDisplayValue('#centro-custo', '#cod-centro-custo', centroCusto);
    this.setFieldValue('#patrocinador', row.patrocinadorNS);
    this.setFieldValue('#objetivo', row.objetivodoprojetoNS);
    this.setFieldValue('#problema', row.problemaOportunidadeNS);
    this.setFieldValue('#beneficios', row.beneficiosesperadosNS);
    this.getContainer().find('#alinhamento').prop('checked', this.asText(row.alinhadobevapNS) === 'true');
    this.getContainer().find('input[name="prioridade"]').filter((index, element) => {
      return this.asText($(element).val()) === this.asText(row.prioridadeNS);
    }).first().prop('checked', true);
    this.setFieldValue('#escopo-inicial', row.escopoinicialNS);
    this.setFieldValue('[data-field="out-of-scope"]', row.foradeescopoNS);
    this.setFieldValue('[data-field="dependencies"]', row.dependenciasNS);
    this.setFieldValue('#observacoes', row.observacoesadicionaisNS);
    this.getContainer().find('#declaracao').prop('checked', declaracao);

    this.renderStrategicObjectives(objectives);
    this.renderInitialRisks(risks);
    this.renderStakeholderList(stakeholders);
    this.restorePersistedAttachments(attachments);
    this.toggleStrategicObjectives();
    this.renderAttachments();
    this.updateSummaryPriority();
    this.updateSummaryDetails();
    this.updateChecklist();
  },

  escapeHtml: function (value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  formatAttachmentSize: function (bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < (1024 * 1024)) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  },

  getAttachmentIconClass: function (fileName) {
    const extension = String(fileName || '').split('.').pop().toLowerCase();

    if (extension === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(extension) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(extension) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(extension) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  },

  renderAttachments: function () {
    const list = this.getContainer().find('#files-list');
    if (!list.length) return;

    if (!this._state.attachments.length) {
      list.html(`
        <div id="files-empty-state" class="text-sm text-gray-500">
          Nenhum anexo selecionado.
        </div>
      `);
      return;
    }

    const rows = this._state.attachments.map((attachment) => {
      const fileName = attachment.file ? attachment.file.name : attachment.fileName;
      const safeName = this.escapeHtml(fileName);
      const fileSize = attachment.file ? attachment.file.size : attachment.fileSize;
      const size = attachment.persisted && isNaN(Number(fileSize))
        ? this.asText(fileSize) || 'Arquivo salvo'
        : this.formatAttachmentSize(fileSize);
      const iconClass = this.getAttachmentIconClass(fileName);

      return `
        <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-center min-w-0">
            <i class="fa-solid ${iconClass} text-xl mr-3"></i>
            <div class="min-w-0">
              <div class="font-medium text-sm truncate">${safeName}</div>
              <div class="text-xs text-gray-500">${size}</div>
            </div>
          </div>
          <button data-action="remove-attachment" data-file-id="${attachment.id}" class="text-red-500 hover:text-red-700">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    });

    list.html(rows.join(''));
  },

  readFileAsBase64: function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = String(event.target && event.target.result ? event.target.result : '');
        const base64 = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;
        resolve(base64);
      };
      reader.onerror = () => {
        reject(new Error(`Falha ao ler o anexo ${file && file.name ? file.name : ''}`.trim()));
      };
      reader.readAsDataURL(file);
    });
  },

  collectAttachmentsPayload: async function () {
    const items = this._state.attachments.filter((attachment) => attachment.file);
    if (!items.length) return [];

    const attachmentPayload = await Promise.all(items.map(async (attachment) => {
      const file = attachment.file;
      const fileContent = await this.readFileAsBase64(file);
      return {
        fileName: String(file.name || '').trim(),
        fileContent: String(fileContent || '').trim(),
        fileSize: String(file.size || '').trim()
      };
    }));

    return attachmentPayload.filter((item) => item.fileName && item.fileContent);
  },

  buildAttachmentMetadata: function () {
    return this._state.attachments.map((attachment) => {
      if (attachment.file) {
        return {
          fileName: this.asText(attachment.file.name),
          fileSize: String(attachment.file.size || '').trim()
        };
      }

      return {
        fileName: this.asText(attachment.fileName),
        fileSize: this.asText(attachment.fileSize),
        persisted: true
      };
    }).filter((attachment) => attachment.fileName);
  },

  buildSubmissionPayload: async function () {
    const container = this.getContainer();
    const getValue = (selector) => String(container.find(selector).val() || "").trim();
    const getChecked = (selector) => container.find(selector).is(":checked");

    const objetivosEstrategicos = container
      .find('#objetivos-estrategicos-list [data-field="objetivos-estrategicos"]')
      .map(function () { return String($(this).val() || "").trim(); })
      .get()
      .filter(value => value !== "");

    const riscosIniciais = container
      .find('#riscos-list [data-field="riscos"]')
      .map(function () { return String($(this).val() || "").trim(); })
      .get()
      .filter(value => value !== "");

    const stakeholders = container
      .find('#stakeholders-list > span')
      .map(function () {
        const chip = $(this).clone();
        chip.find('button').remove();
        return String(chip.text() || "").trim();
      })
      .get()
      .filter(value => value !== "");

    const attachments = await this.collectAttachmentsPayload();
    const attachmentsMetadata = this.buildAttachmentMetadata();

    return {
      titulo: getValue("#titulo"),
      area: getValue("#area"),
      "centro-custo": getValue("#centro-custo"),
      patrocinador: getValue("#patrocinador"),
      objetivo: getValue("#objetivo"),
      problema: getValue("#problema"),
      beneficios: getValue("#beneficios"),
      alinhamento: getChecked("#alinhamento"),
      prioridade: String(container.find('input[name="prioridade"]:checked').val() || "").trim(),
      "escopo-inicial": getValue("#escopo-inicial"),
      "out-of-scope": getValue('[data-field="out-of-scope"]'),
      dependencies: getValue('[data-field="dependencies"]'),
      observacoes: getValue("#observacoes"),
      declaracao: getChecked("#declaracao"),
      objetivosEstrategicos: objetivosEstrategicos,
      riscosIniciais: riscosIniciais,
      stakeholders: stakeholders,
      attachments: attachments,
      attachmentsMetadata: attachmentsMetadata
    };
  },

  createSubmitLoading: function (title, message) {
    if (typeof modalLoadingService !== 'undefined' && modalLoadingService.show) {
      return modalLoadingService.show({
        title: title || 'Enviando solicitacao',
        message: message || 'Aguarde enquanto a solicitacao e criada no Fluig...'
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

  updateDraftHash: function () {
    if (!this._state.documentId || !window.history || typeof window.history.replaceState !== 'function') {
      return;
    }

    const nextHash = `#newSolicitation?documentId=${encodeURIComponent(this._state.documentId)}`;
    const url = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, '', url);
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

  toTaskFields: function (cardData) {
    return Object.keys(cardData || {}).map((fieldName) => {
      return {
        name: fieldName,
        value: cardData[fieldName]
      };
    });
  },

  saveDraft: async function () {
    if (this._state.isSubmitting) return;

    const loading = this.createSubmitLoading('Salvando rascunho', 'Aguarde enquanto o rascunho e salvo...');
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Preparando dados do rascunho...');
      await this.waitForUiPaint();
      const payload = await this.buildSubmissionPayload();

      if (this._state.documentId) {
        loading.updateMessage('Atualizando rascunho existente...');
        await this.waitForUiPaint();
        await fluigService.saveDraft({
          mode: 'updateCardDraft',
          documentId: this._state.documentId,
          cardData: fluigService.buildProjectSolicitationCardData(payload)
        });
      } else {
        loading.updateMessage('Criando rascunho inicial no Fluig...');
        await this.waitForUiPaint();
        const result = await fluigService.saveDraft({
          mode: 'startProcessDraft',
          formData: payload
        });

        this._state.documentId = this.asText(result.documentId);
        this._state.processInstanceId = this.asText(result.processInstanceId);
        this._state.numSolicitacao = this._state.processInstanceId;
        this.updateDraftHash();
      }

      this.writeDraftUiCache(this._state.documentId, payload);

      this.showNotification({
        borderClass: 'border-bevap-green',
        iconClass: 'fa-check-circle text-bevap-green',
        title: 'Rascunho salvo!',
        message: 'Os dados informados foram salvos com sucesso.'
      });

      setTimeout(() => {
        location.hash = '#dashboard';
      }, 150);
    } catch (error) {
      console.error('[newSolicitation] Error saving draft:', error);
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Erro ao salvar rascunho',
        message: error && error.message ? error.message : 'Nao foi possivel salvar o rascunho.'
      });
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
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

  submitForm: async function () {
    if (this._state.isSubmitting) return;

    const missingFields = this.validateForm();
    if (missingFields.length > 0) {
      this.showValidationModal(missingFields);
      return;
    }

    this.closeValidationModal();

    const loading = this.createSubmitLoading();
    this._state.isSubmitting = true;

    try {
      loading.updateMessage('Preparando dados do formulario...');
      await this.waitForUiPaint();
      const payload = await this.buildSubmissionPayload();

      if (this._state.documentId) {
        loading.updateMessage('Atualizando rascunho antes do envio...');
        await this.waitForUiPaint();
        const processInstanceId = await this.resolveProcessInstanceId();
        const taskFields = this.toTaskFields(fluigService.buildProjectSolicitationCardData(payload));

        loading.updateMessage('Concluindo envio da solicitacao...');
        await this.waitForUiPaint();
        await fluigService.saveAndSendTask({
          id: processInstanceId,
          numState: 5,
          documentId: this._state.documentId,
          datasetName: 'DSFormSolicitacaoProjetos'
        }, taskFields);
        this._state.numSolicitacao = this.asText(processInstanceId);
        this.clearDraftUiCache(this._state.documentId);
      } else {
        loading.updateMessage('Enviando para o processo no Fluig...');
        await this.waitForUiPaint();
        const result = await fluigService.createProjectSolicitation(payload, {
          completeTask: true
        });
        this._state.numSolicitacao = String(result.numSolicitacao || "").trim();
      }

      this.getContainer().find('#success-modal').removeClass('hidden');
    } catch (error) {
      console.error("Error submitting project solicitation:", error);
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Erro ao enviar',
        message: 'Nao foi possivel criar a solicitacao no Fluig. Tente novamente.'
      });
    } finally {
      this._state.isSubmitting = false;
      loading.hide();
    }
  },

  cancelForm: function () {
    location.hash = '#dashboard';
  },

  closeModal: function () {
    location.hash = '#dashboard';
  },

  viewRequest: function () {
    const numSolicitacao = String(this._state.numSolicitacao || "").trim();
    if (!numSolicitacao) {
      this.showNotification({
        borderClass: 'border-red-500',
        iconClass: 'fa-triangle-exclamation text-red-500',
        title: 'Solicitacao nao encontrada',
        message: 'Nao foi possivel localizar o numero da solicitacao.'
      });
      return;
    }

    const url = `https://fluigqa.bevap.com.br:8443/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${encodeURIComponent(numSolicitacao)}`;
    const newTab = window.open(url, "_blank", "noopener,noreferrer");

    if (newTab) {
      newTab.opener = null;
      return;
    }

    this.showNotification({
      borderClass: 'border-red-500',
      iconClass: 'fa-triangle-exclamation text-red-500',
      title: 'Pop-up bloqueado',
      message: 'Permita pop-ups para abrir a solicitacao em nova guia.'
    });
  },

  asText: function (value) {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

    return String(value).trim();
  },

  showNotification: function (config) {
    const notification = $(`
      <div class="fixed top-20 right-4 bg-white border-l-4 ${config.borderClass} shadow-lg rounded-lg p-4 z-50 animate-slide-in">
        <div class="flex items-center">
          <i class="fa-solid ${config.iconClass} text-xl mr-3"></i>
          <div>
            <p class="font-semibold text-gray-800">${config.title}</p>
            <p class="text-sm text-gray-600">${config.message}</p>
          </div>
        </div>
      </div>
    `);

    $('body').append(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
};

function loadZoom() {
  String.prototype.replaceAll = String.prototype.replaceAll || function (needle, replacement) {
    return this.split(needle).join(replacement);
  };

  $('input[type="zoom"]').each(function () {
    if (!$(this).prop('readonly')) {
      if (typeof loadZoomForInput === 'function') {
        loadZoomForInput(this);
      }
    } else {
      $(this).prop('type', 'text').addClass('form-control');
    }
  });
}

function setZoomHiddenValue(fieldId, value) {
  if (typeof Util !== 'undefined' && Util && typeof Util.setVal === 'function') {
    Util.setVal(fieldId, value || '');
    return;
  }

  $(`#${fieldId}`).val(value || '');
}

function setSelectedZoomItem(zoomItem) {
  const idSelecionado = String(
    (zoomItem && (zoomItem.inputId || zoomItem.inputName || zoomItem.id)) || ''
  ).trim();

  // Coligada
  if (idSelecionado === 'coligada') {
    setZoomHiddenValue('cod-coligada', zoomItem && (zoomItem.CODCOLIGADA || zoomItem.codigo || ''));
  }

  // Area/Unidade
  if (idSelecionado === 'area') {
    setZoomHiddenValue('cod-area', zoomItem && (zoomItem.CODIGO || zoomItem.codigo || ''));
  }

  // Centro de Custo
  if (idSelecionado === 'centro-custo') {
    setZoomHiddenValue('cod-centro-custo', zoomItem && (zoomItem.CODIGO || zoomItem.codigo || ''));
  }
}

function removedZoomItem(removedItem) {
  const idSelecionado = String(
    (removedItem && (removedItem.inputId || removedItem.inputName || removedItem.id)) || ''
  ).trim();

  // Limpa hidden quando usuario remove selecao do zoom.
  if (idSelecionado === 'coligada') {
    setZoomHiddenValue('cod-coligada', '');
  }

  if (idSelecionado === 'area') {
    setZoomHiddenValue('cod-area', '');
  }

  if (idSelecionado === 'centro-custo') {
    setZoomHiddenValue('cod-centro-custo', '');
  }
}
