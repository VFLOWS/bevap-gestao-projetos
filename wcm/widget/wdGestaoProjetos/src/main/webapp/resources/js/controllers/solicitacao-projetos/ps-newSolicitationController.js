const newSolicitationController = {
  _eventNamespace: '.newSolicitation',

  _state: {
    currentStep: 1
  },

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

  load: function () {
    const container = this.getContainer();
    this.destroy();

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
  },

  getTemplateUrl: function () {
    return `${WCMAPI.getServerURL()}/wdGestaoProjetos/resources/js/templates/solicitacao-projetos/ps-new-solicitation.html`;
  },

  getContainer: function () {
    return $('#page-container');
  },

  initializePage: function () {
    this.bindEvents();
    this._state.currentStep = 1;
    this.updateStepper();
    this.updateChecklist();
    this.updateSummaryPriority();
    this.updateSummaryDetails();
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
      const hasArea = areaField.length && String(areaField.val() || '').trim() !== '';
      const selectedArea = hasArea ? String(areaField.find('option:selected').text() || '').trim() : '';
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

  saveDraft: function () {
    this.showNotification({
      borderClass: 'border-bevap-green',
      iconClass: 'fa-check-circle text-bevap-green',
      title: 'Rascunho salvo!',
      message: 'Suas alteracoes foram salvas automaticamente.'
    });
  },

  submitForm: function () {
    const missingFields = this.validateForm();
    if (missingFields.length > 0) {
      this.showValidationModal(missingFields);
      return;
    }

    this.closeValidationModal();
    this.getContainer().find('#success-modal').removeClass('hidden');
  },

  cancelForm: function () {
    location.hash = '#dashboard';
  },

  closeModal: function () {
    location.hash = '#dashboard';
  },

  viewRequest: function () {
    location.href = 'detalhamento-solicitacao.html';
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
