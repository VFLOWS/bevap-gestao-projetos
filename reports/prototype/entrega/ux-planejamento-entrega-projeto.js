(function () {
    var currentStep = 1;
    var totalSteps = 2;
    var deliveryInfoTab = 'go-live';
    var collapsedRelatedExecutionMilestones = [];
    var pendingDeleteAction = null;
    var stepLabels = {
        1: 'Planejamento GO Live',
        2: 'Documentos'
    };
    var responsibleOptions = [
        'Ana Costa',
        'Carlos Silva',
        'Diretoria TI',
        'Equipe Infraestrutura',
        'João Vieira',
        'Mariana Lima',
        'PMO Corporativo',
        'Rafael Souza',
        'Segurança da Informação',
        'TechPartners'
    ];
    var defaultPlanData = [
        {
            type: 'treinamento',
            title: 'Treinamento de usuários-chave para Go Live',
            responsible: 'Ana Costa',
            executionDate: '03/19/2026',
            trainingHours: '6',
            description: 'Treinamento funcional e operacional para preparar usuários-chave, suporte e áreas impactadas para a entrada em produção.',
            participants: [
                'Ana Costa',
                'Carlos Silva',
                'Mariana Lima',
                'Rafael Souza',
                'João Vieira',
                'PMO Corporativo',
                'Equipe Infraestrutura',
                'Segurança da Informação',
                'TechPartners',
                'Fernanda Rocha',
                'Patrícia Gomes',
                'Lucas Martins',
                'Bruna Almeida',
                'Ricardo Nunes',
                'Camila Torres',
                'Felipe Andrade'
            ],
            attachments: [
                { name: 'Agenda_Treinamento_GoLive.pdf', meta: '1.2 MB' },
                { name: 'Material_Apoio_Usuarios.xlsx', meta: '860 KB' }
            ]
        },
        {
            type: 'planejamento',
            title: 'Planejamento do Go-live',
            responsible: 'PMO Corporativo',
            executionDate: '03/20/2026',
            description: 'Consolidar a janela de implantação, a comunicação operacional e a prontidão técnica para a entrada em produção.',
            dependencies: ['Checklist técnico consolidado', 'Janela de implantação aprovada']
        },
        {
            type: 'planejamento',
            title: 'Acompanhamento da liberação',
            responsible: 'Rafael Souza',
            executionDate: '03/23/2026',
            description: 'Detalhar o acompanhamento inicial após a liberação e a estabilização do ambiente produtivo.',
            dependencies: ['Plano de rollback validado', 'Comunicação de produção aprovada']
        }
    ];
    var relatedExecutionPhasesData = [
        {
            name: 'Descoberta e Análise',
            responsible: 'Ana Costa',
            effort: 72,
            duration: 10,
            dependencies: [
                'Kickoff inicial validado com todas as áreas',
                'Aprovação formal do escopo funcional inicial'
            ],
            notes: 'Levantamento de requisitos, consolidação documental e preparação da base funcional para a execução.',
            tasks: [
                { name: 'Mapear sistemas impactados', responsible: 'Carlos Silva', effort: 12, duration: 2, dependency: 'Kickoff inicial validado com todas as áreas' },
                { name: 'Entrevistar stakeholders', responsible: 'Ana Costa', effort: 16, duration: 2, dependency: 'Agenda executiva' },
                { name: 'Definir escopo funcional', responsible: 'PMO Corporativo', effort: 20, duration: 3, dependency: 'Inputs do negócio' },
                { name: 'Consolidar documentação inicial', responsible: 'Mariana Lima', effort: 24, duration: 3, dependency: 'Validação do escopo' }
            ]
        },
        {
            name: 'Implementação SSO',
            responsible: 'TechPartners',
            effort: 160,
            duration: 20,
            dependencies: [
                'Conclusão da fase de Descoberta e Análise',
                'Liberação do ambiente de homologação pela infraestrutura'
            ],
            notes: 'Construção técnica da integração, federação de identidade e preparação dos componentes de autenticação.',
            tasks: [
                { name: 'Provisionar ambiente de homologação', responsible: 'Equipe Infraestrutura', effort: 24, duration: 3, dependency: 'Acesso cloud' },
                { name: 'Configurar federação com AD', responsible: 'TechPartners', effort: 32, duration: 4, dependency: 'Credenciais de diretório' },
                { name: 'Implementar fluxo OAuth2/SAML', responsible: 'Rafael Souza', effort: 40, duration: 5, dependency: 'Definição técnica' },
                { name: 'Aplicar políticas de segurança', responsible: 'Segurança da Informação', effort: 16, duration: 2, dependency: 'Baseline de segurança' },
                { name: 'Executar testes integrados', responsible: 'Mariana Lima', effort: 24, duration: 3, dependency: 'Build estável' }
            ]
        },
        {
            name: 'Validação e Go-Live',
            responsible: 'PMO Corporativo',
            effort: 100,
            duration: 13,
            dependencies: [
                'Conclusão da implementação SSO',
                'Evidências técnicas aprovadas pela Segurança da Informação'
            ],
            notes: 'Validação final com negócio, estabilização inicial e preparação da entrada assistida em produção.',
            tasks: [
                { name: 'Planejar roteiro de testes UAT', responsible: 'Ana Costa', effort: 16, duration: 2, dependency: 'Ambiente homologado' },
                { name: 'Executar bateria de testes UAT', responsible: 'Carlos Silva', effort: 24, duration: 3, dependency: 'Roteiro aprovado' },
                { name: 'Corrigir pendências críticas', responsible: 'TechPartners', effort: 24, duration: 3, dependency: 'Resultado UAT' },
                { name: 'Aprovar checklist de produção', responsible: 'Segurança da Informação', effort: 8, duration: 1, dependency: 'Evidências completas' },
                { name: 'Realizar go-live assistido', responsible: 'Equipe Infraestrutura', effort: 16, duration: 2, dependency: 'Janela de mudança' },
                { name: 'Monitorar estabilização inicial', responsible: 'Rafael Souza', effort: 12, duration: 2, dependency: 'Go-live concluído' }
            ]
        }
    ];
    var relatedExecutionMilestonesData = [
        {
            name: 'Concluir descoberta e baseline técnico',
            period: '05/02/2026 até 10/02/2026',
            status: 'concluido',
            owner: 'Ana Costa',
            criteria: [
                'Escopo funcional validado com negócio e TI.',
                'Matriz de sistemas impactados aprovada.'
            ],
            tasks: [
                { phaseName: 'Descoberta e Análise', taskName: 'Mapear sistemas impactados', responsible: 'Carlos Silva', date: '27/01/2026', status: 'concluido' },
                { phaseName: 'Implementação SSO', taskName: 'Provisionar ambiente de homologação', responsible: 'Equipe Infraestrutura', date: '31/01/2026', status: 'concluido' },
                { phaseName: 'Validação e Go-Live', taskName: 'Planejar roteiro de testes UAT', responsible: 'Ana Costa', date: '03/02/2026', status: 'concluido' }
            ]
        },
        {
            name: 'Entrega da implementação SSO em homologação',
            period: '10/03/2026 até 18/03/2026',
            status: 'concluido',
            owner: 'TechPartners',
            criteria: [
                'Federação com AD funcionando para usuários piloto.',
                'Políticas de segurança aplicadas e auditadas.'
            ],
            tasks: [
                { phaseName: 'Implementação SSO', taskName: 'Configurar federação com AD', responsible: 'TechPartners', date: '12/02/2026', status: 'concluido' },
                { phaseName: 'Descoberta e Análise', taskName: 'Definir escopo funcional', responsible: 'Ana Costa', date: '15/02/2026', status: 'concluido' },
                { phaseName: 'Implementação SSO', taskName: 'Aplicar políticas de segurança', responsible: 'Segurança da Informação', date: '20/02/2026', status: 'concluido' },
                { phaseName: 'Validação e Go-Live', taskName: 'Executar bateria de testes UAT', responsible: 'Carlos Silva', date: '22/02/2026', status: 'concluido' }
            ]
        },
        {
            name: 'Go-live e estabilização inicial',
            period: '14/03/2026 até 20/03/2026',
            status: 'concluido',
            owner: 'PMO Corporativo',
            criteria: [
                'UAT concluído sem pendências críticas abertas.',
                'Checklist de produção aprovado pelas áreas responsáveis.'
            ],
            tasks: [
                { phaseName: 'Descoberta e Análise', taskName: 'Consolidar documentação inicial', responsible: 'Rafael Souza', date: '02/03/2026', status: 'concluido' },
                { phaseName: 'Implementação SSO', taskName: 'Implementar fluxo OAuth2/SAML', responsible: 'TechPartners', date: '08/03/2026', status: 'concluido' },
                { phaseName: 'Validação e Go-Live', taskName: 'Monitorar estabilização inicial', responsible: 'Rafael Souza', date: '14/03/2026', status: 'concluido' },
                { phaseName: 'Validação e Go-Live', taskName: 'Aprovar checklist de produção', responsible: 'Segurança da Informação', date: '12/03/2026', status: 'concluido' }
            ]
        }
    ];

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showToast(title, message, type) {
        var toast = document.getElementById('toast');
        var icon = document.getElementById('toast-icon');
        var titleElement = document.getElementById('toast-title');
        var messageElement = document.getElementById('toast-message');
        if (!toast || !icon || !titleElement || !messageElement) return;

        var types = {
            success: { border: 'border-emerald-500', icon: 'fa-solid fa-circle-check text-emerald-600' },
            error: { border: 'border-red-500', icon: 'fa-solid fa-circle-xmark text-red-600' },
            info: { border: 'border-blue-500', icon: 'fa-solid fa-circle-info text-blue-600' }
        };
        var selected = types[type] || types.info;

        toast.className = 'fixed top-24 right-4 z-[70] hidden max-w-sm rounded-lg border-l-4 bg-white px-4 py-3 shadow-xl ' + selected.border;
        icon.className = selected.icon + ' text-xl';
        titleElement.textContent = title;
        messageElement.textContent = message;
        toast.classList.remove('hidden');

        window.clearTimeout(window.__deliveryToastTimeout);
        window.__deliveryToastTimeout = window.setTimeout(function () {
            toast.classList.add('hidden');
        }, 3200);
    }

    function openDeleteConfirmation(message, onConfirm) {
        var modal = document.getElementById('delete-confirmation-modal');
        var messageElement = document.getElementById('delete-confirmation-message');
        if (!modal || !messageElement) return;
        pendingDeleteAction = onConfirm;
        messageElement.textContent = message || 'Confirmar exclusão?';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeDeleteConfirmation() {
        var modal = document.getElementById('delete-confirmation-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        pendingDeleteAction = null;
    }

    function confirmDeleteAction() {
        if (typeof pendingDeleteAction === 'function') {
            pendingDeleteAction();
        }
        closeDeleteConfirmation();
    }

    function openDeliveryConcludeModal() {
        var modal = document.getElementById('delivery-conclude-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeDeliveryConcludeModal() {
        var modal = document.getElementById('delivery-conclude-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function getResponsibleSearchFieldHTML(selectedValue, extraClasses) {
        return '' +
            '<div class="responsible-search-field relative ' + (extraClasses || '') + '">' +
                '<div class="relative">' +
                    '<input type="text" value="' + escapeHtml(selectedValue || '') + '" class="responsible-input responsible-search-input w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-16 text-sm" placeholder="Pesquisar responsável...">' +
                    '<button type="button" class="responsible-search-clear hidden absolute right-8 top-1/2 -translate-y-1/2 px-1 text-red-500 hover:text-red-700" title="Limpar"><i class="fa-solid fa-xmark"></i></button>' +
                    '<button type="button" class="responsible-search-toggle absolute right-2 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-700" title="Abrir opções"><i class="fa-solid fa-chevron-down text-xs"></i></button>' +
                '</div>' +
                '<div class="responsible-search-dropdown hidden absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"></div>' +
            '</div>';
    }

    function refreshResponsibleSearchField(fieldElement) {
        if (!fieldElement) return;
        var searchInput = fieldElement.querySelector('.responsible-search-input');
        var clearButton = fieldElement.querySelector('.responsible-search-clear');
        var toggleButton = fieldElement.querySelector('.responsible-search-toggle');
        var dropdown = fieldElement.querySelector('.responsible-search-dropdown');
        if (!searchInput || !dropdown) return;

        var searchText = searchInput.value ? searchInput.value.trim() : '';
        var searchTextLower = searchText.toLowerCase();
        var exactMatch = responsibleOptions.find(function (name) {
            return name.toLowerCase() === searchTextLower;
        });

        if (exactMatch && (document.activeElement !== searchInput || searchTextLower === exactMatch.toLowerCase())) {
            searchInput.value = exactMatch;
        }

        var hasValue = Boolean(searchInput.value.trim());
        if (clearButton) clearButton.classList.toggle('hidden', !hasValue);
        if (clearButton) clearButton.classList.toggle('right-2', hasValue);
        if (clearButton) clearButton.classList.toggle('right-8', !hasValue);
        if (toggleButton) toggleButton.classList.toggle('hidden', hasValue);

        var filteredOptions = searchText
            ? responsibleOptions.filter(function (name) {
                return name.toLowerCase().includes(searchTextLower);
            })
            : responsibleOptions;

        var isFocused = document.activeElement === searchInput;
        var shouldShowDropdown = fieldElement.dataset.dropdownOpen === 'true' && (isFocused || Boolean(searchText));

        if (!shouldShowDropdown) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            return;
        }

        if (!filteredOptions.length) {
            dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">Nenhum responsável encontrado</div>';
            dropdown.classList.remove('hidden');
            return;
        }

        dropdown.innerHTML = filteredOptions.map(function (name) {
            return '<button type="button" class="responsible-search-option w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100" data-value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</button>';
        }).join('');
        dropdown.classList.remove('hidden');

        dropdown.querySelectorAll('.responsible-search-option').forEach(function (optionElement) {
            optionElement.addEventListener('mousedown', function (event) {
                event.preventDefault();
            });
            optionElement.addEventListener('click', function () {
                var selectedValue = optionElement.getAttribute('data-value') || '';
                searchInput.value = selectedValue;
                fieldElement.dataset.dropdownOpen = 'false';
                refreshResponsibleSearchField(fieldElement);
                searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    }

    function bindResponsibleSearchField(fieldElement) {
        if (!fieldElement || fieldElement.dataset.eventsReady === 'true') return;
        var searchInput = fieldElement.querySelector('.responsible-search-input');
        var clearButton = fieldElement.querySelector('.responsible-search-clear');
        var toggleButton = fieldElement.querySelector('.responsible-search-toggle');
        if (!searchInput) return;

        searchInput.addEventListener('focus', function () {
            fieldElement.dataset.dropdownOpen = 'true';
            refreshResponsibleSearchField(fieldElement);
        });
        searchInput.addEventListener('input', function () {
            fieldElement.dataset.dropdownOpen = 'true';
            refreshResponsibleSearchField(fieldElement);
        });
        searchInput.addEventListener('change', function () {
            refreshResponsibleSearchField(fieldElement);
        });
        searchInput.addEventListener('blur', function () {
            window.setTimeout(function () {
                fieldElement.dataset.dropdownOpen = 'false';
                refreshResponsibleSearchField(fieldElement);
            }, 120);
        });

        if (clearButton) {
            clearButton.addEventListener('click', function (event) {
                event.preventDefault();
                searchInput.value = '';
                fieldElement.dataset.dropdownOpen = 'false';
                refreshResponsibleSearchField(fieldElement);
                searchInput.dispatchEvent(new Event('change', { bubbles: true }));
                searchInput.focus();
            });
        }

        if (toggleButton) {
            toggleButton.addEventListener('click', function (event) {
                event.preventDefault();
                fieldElement.dataset.dropdownOpen = fieldElement.dataset.dropdownOpen === 'true' ? 'false' : 'true';
                refreshResponsibleSearchField(fieldElement);
                searchInput.focus();
            });
        }

        fieldElement.dataset.eventsReady = 'true';
        refreshResponsibleSearchField(fieldElement);
    }

    function initResponsibleSearchFields(rootElement) {
        (rootElement || document).querySelectorAll('.responsible-search-field').forEach(function (fieldElement) {
            bindResponsibleSearchField(fieldElement);
        });
    }

    function parseDateFromText(value) {
        if (!value) return null;
        var safeValue = String(value).trim();
        var match = safeValue.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!match) return null;
        var month = parseInt(match[1], 10) - 1;
        var day = parseInt(match[2], 10);
        var year = parseInt(match[3], 10);
        var date = new Date(year, month, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDateLabel(value) {
        var date = parseDateFromText(value);
        if (!date) return value || 'Sem data definida';
        return date.toLocaleDateString('pt-BR');
    }

    function getTimelineWhenLabel(value) {
        var date = parseDateFromText(value);
        if (!date) return 'A definir';
        var today = new Date();
        var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        var itemStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var diffDays = Math.round((itemStart.getTime() - todayStart.getTime()) / 86400000);

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';
        if (diffDays > 1) return 'Em ' + diffDays + ' dias';
        return Math.abs(diffDays) + ' dias atrás';
    }

    function initRangePickers(rootElement) {
        if (typeof window.jQuery !== 'function' || typeof window.moment !== 'function') return;
        var $ = window.jQuery;
        if (typeof $.fn.daterangepicker !== 'function') return;

        (rootElement || document).querySelectorAll('.delivery-period-input').forEach(function (inputElement) {
            if (!inputElement || inputElement.dataset.periodPickerReady === 'true') return;

            var parts = String(inputElement.value || '').split(' - ');
            var startMoment = window.moment(parts[0] || '03/18/2026', 'MM/DD/YYYY', true);
            var endMoment = window.moment(parts[1] || parts[0] || '03/20/2026', 'MM/DD/YYYY', true);

            if (!startMoment.isValid()) startMoment = window.moment();
            if (!endMoment.isValid()) endMoment = startMoment.clone();

            function applyPeriodValue(startDate, endDate) {
                inputElement.value = startDate.format('MM/DD/YYYY') + ' - ' + endDate.format('MM/DD/YYYY');
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            }

            $(inputElement).daterangepicker({
                startDate: startMoment,
                endDate: endMoment,
                autoUpdateInput: false,
                autoApply: true,
                alwaysShowCalendars: true,
                linkedCalendars: false,
                opens: 'left',
                showDropdowns: true,
                locale: {
                    format: 'MM/DD/YYYY',
                    separator: ' - ',
                    applyLabel: 'Aplicar',
                    cancelLabel: 'Cancelar',
                    customRangeLabel: 'Período personalizado',
                    daysOfWeek: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
                    firstDay: 0
                }
            });

            applyPeriodValue(startMoment, endMoment);
            $(inputElement).on('apply.daterangepicker', function (_, picker) {
                applyPeriodValue(picker.startDate, picker.endDate);
            });

            inputElement.dataset.periodPickerReady = 'true';
        });
    }

    function initSingleDatePickers(rootElement) {
        if (typeof window.jQuery !== 'function' || typeof window.moment !== 'function') return;
        var $ = window.jQuery;
        if (typeof $.fn.daterangepicker !== 'function') return;

        (rootElement || document).querySelectorAll('.delivery-task-date-input, .delivery-execution-date-input').forEach(function (inputElement) {
            if (!inputElement || inputElement.dataset.datePickerReady === 'true') return;

            var startMoment = window.moment(String(inputElement.value || '').trim(), 'MM/DD/YYYY', true);
            if (!startMoment.isValid()) startMoment = window.moment();

            function applyDateValue(dateMoment) {
                inputElement.value = dateMoment.format('MM/DD/YYYY');
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            }

            $(inputElement).daterangepicker({
                singleDatePicker: true,
                autoUpdateInput: false,
                autoApply: true,
                showDropdowns: true,
                startDate: startMoment,
                locale: {
                    format: 'MM/DD/YYYY',
                    applyLabel: 'Aplicar',
                    cancelLabel: 'Cancelar',
                    daysOfWeek: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
                    firstDay: 0
                }
            });

            applyDateValue(startMoment);
            $(inputElement).on('apply.daterangepicker', function (_, picker) {
                applyDateValue(picker.startDate);
            });

            inputElement.dataset.datePickerReady = 'true';
        });
    }

    function createDependencyItemHTML(value) {
        return '' +
            '<div class="delivery-dependency-item flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">' +
                '<i class="fa-solid fa-triangle-exclamation text-yellow-600"></i>' +
                '<input type="text" value="' + escapeHtml(value || '') + '" placeholder="Descreva uma dependência..." class="delivery-dependency-input field-input flex-1 border-none bg-transparent text-sm focus:outline-none">' +
                '<button type="button" class="text-red-500 hover:text-red-700" data-action="remove-dependency" title="Remover dependência">' +
                    '<i class="fa-solid fa-times"></i>' +
                '</button>' +
            '</div>';
    }

    function getDependenciesFieldHTML(values) {
        var dependencyItems = Array.isArray(values) && values.length ? values : [''];
        return '' +
            '<div class="delivery-dependency-field mt-4">' +
                '<div class="mb-1">' +
                    '<label class="block text-sm text-gray-600">Dependências</label>' +
                '</div>' +
                '<div class="delivery-dependency-list mb-3 space-y-2">' +
                    dependencyItems.map(function (value) {
                        return createDependencyItemHTML(value);
                    }).join('') +
                '</div>' +
                '<button type="button" class="text-sm font-medium text-bevap-green hover:text-green-700" data-action="add-dependency">' +
                    '<i class="fa-solid fa-plus mr-1"></i> Adicionar Dependência' +
                '</button>' +
            '</div>';
    }

    function createSelectedParticipantHTML(value) {
        return '' +
            '<div class="delivery-selected-participant inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5" data-value="' + escapeHtml(value || '') + '">' +
                '<span class="truncate text-xs text-gray-700">' + escapeHtml(value || '') + '</span>' +
                '<button type="button" class="text-xs text-red-500 hover:text-red-700" data-action="remove-participant" title="Remover participante">' +
                    '<i class="fa-solid fa-times"></i>' +
                '</button>' +
            '</div>';
    }

    function getParticipantsFieldHTML(values) {
        var participantItems = Array.isArray(values)
            ? values.filter(function (value) { return Boolean(String(value || '').trim()); })
            : [];
        return '' +
            '<div class="delivery-participant-field mt-4">' +
                '<div class="mb-1">' +
                    '<label class="block text-sm text-gray-600">Participantes</label>' +
                '</div>' +
                '<div class="delivery-participant-search-field relative">' +
                    '<div class="relative">' +
                        '<input type="text" class="delivery-participant-search-input w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-16 text-sm" placeholder="Pesquisar e adicionar participante...">' +
                        '<button type="button" class="delivery-participant-search-clear hidden absolute right-8 top-1/2 -translate-y-1/2 px-1 text-red-500 hover:text-red-700" title="Limpar">' +
                            '<i class="fa-solid fa-xmark"></i>' +
                        '</button>' +
                        '<button type="button" class="delivery-participant-search-toggle absolute right-2 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-700" title="Abrir opções">' +
                            '<i class="fa-solid fa-chevron-down text-xs"></i>' +
                        '</button>' +
                    '</div>' +
                    '<div class="delivery-participant-search-dropdown hidden absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"></div>' +
                '</div>' +
                '<div class="delivery-participant-selected-list mt-3 flex flex-wrap gap-2">' +
                    participantItems.map(function (value) {
                        return createSelectedParticipantHTML(value);
                    }).join('') +
                '</div>' +
            '</div>';
    }

    function createAttachmentItemHTML(fileData, index) {
        var fileName = typeof fileData === 'string' ? fileData : (fileData && fileData.name) || '';
        var fileMeta = fileData && fileData.meta ? fileData.meta : '';
        return '' +
            '<div class="delivery-attachment-item flex items-center justify-between rounded-lg bg-gray-50 p-3" data-attachment-index="' + index + '" data-file-name="' + escapeHtml(fileName) + '" data-file-meta="' + escapeHtml(fileMeta) + '">' +
                '<div class="flex items-center">' +
                    '<i class="fa-solid fa-file text-red-500 mr-3"></i>' +
                    '<div>' +
                        '<p class="text-sm font-medium text-gray-700">' + escapeHtml(fileName) + '</p>' +
                        '<p class="text-xs text-gray-500">' + escapeHtml(fileMeta || 'Arquivo anexado') + '</p>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="text-red-500 hover:text-red-700" data-action="remove-training-attachment" title="Remover anexo">' +
                    '<i class="fa-solid fa-trash"></i>' +
                '</button>' +
            '</div>';
    }

    function getTrainingAttachmentsFieldHTML(values) {
        var files = Array.isArray(values) ? values : [];
        return '' +
            '<div class="mt-4">' +
                '<label class="mb-3 block text-sm text-gray-600">Anexar Documentos do Treinamento</label>' +
                '<div class="delivery-attachments-field">' +
                    '<input type="file" multiple class="delivery-attachments-input hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg">' +
                    '<div class="delivery-attachments-dropzone cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-bevap-green">' +
                        '<i class="fa-solid fa-cloud-upload-alt mb-3 text-4xl text-gray-400"></i>' +
                        '<p class="mb-2 text-gray-600">Arraste arquivos ou clique para selecionar</p>' +
                        '<p class="text-sm text-gray-500">PDF, DOC, XLS (máx. 10MB)</p>' +
                    '</div>' +
                    '<div class="delivery-attachments-list mt-4 space-y-2">' +
                        files.map(function (file, index) {
                            return createAttachmentItemHTML(file, index);
                        }).join('') +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function addDependencyItem(buttonElement, value) {
        var field = buttonElement.closest('.delivery-dependency-field');
        if (!field) return;
        var list = field.querySelector('.delivery-dependency-list');
        if (!list) return;

        var dependencyElement = document.createElement('div');
        dependencyElement.innerHTML = createDependencyItemHTML(value || '');
        list.appendChild(dependencyElement.firstChild);
    }

    function removeDependencyItem(buttonElement) {
        var row = buttonElement.closest('.delivery-dependency-item');
        var list = buttonElement.closest('.delivery-dependency-list');
        if (!row || !list) return;

        if (list.children.length <= 1) {
            var inputElement = row.querySelector('.delivery-dependency-input');
            if (inputElement) inputElement.value = '';
            return;
        }

        row.remove();
    }

    function getSelectedParticipantValues(fieldElement) {
        var container = fieldElement.classList.contains('delivery-participant-field')
            ? fieldElement
            : fieldElement.closest('.delivery-participant-field');
        if (!container) return [];
        return Array.prototype.slice.call(container.querySelectorAll('.delivery-selected-participant')).map(function (itemElement) {
            return itemElement.getAttribute('data-value') || '';
        }).filter(Boolean);
    }

    function refreshParticipantSearchField(fieldElement) {
        if (!fieldElement) return;
        var container = fieldElement.classList.contains('delivery-participant-field')
            ? fieldElement
            : fieldElement.closest('.delivery-participant-field');
        if (!container) return;
        var searchInput = fieldElement.querySelector('.delivery-participant-search-input');
        var clearButton = fieldElement.querySelector('.delivery-participant-search-clear');
        var toggleButton = fieldElement.querySelector('.delivery-participant-search-toggle');
        var dropdown = fieldElement.querySelector('.delivery-participant-search-dropdown');
        if (!searchInput || !dropdown) return;

        var searchText = searchInput.value ? searchInput.value.trim() : '';
        var searchTextLower = searchText.toLowerCase();
        var selectedValues = getSelectedParticipantValues(container);
        var filteredOptions = responsibleOptions.filter(function (name) {
            return selectedValues.indexOf(name) === -1 && (!searchText || name.toLowerCase().includes(searchTextLower));
        });

        if (clearButton) clearButton.classList.toggle('hidden', !searchText);
        if (toggleButton) toggleButton.classList.toggle('hidden', Boolean(searchText));

        var isFocused = document.activeElement === searchInput;
        var shouldShowDropdown = fieldElement.dataset.dropdownOpen === 'true' && (isFocused || Boolean(searchText));
        if (!shouldShowDropdown) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            return;
        }

        if (!filteredOptions.length) {
            dropdown.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">Nenhum participante encontrado</div>';
            dropdown.classList.remove('hidden');
            return;
        }

        dropdown.innerHTML = filteredOptions.map(function (name) {
            return '<button type="button" class="delivery-participant-option w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100" data-value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</button>';
        }).join('');
        dropdown.classList.remove('hidden');

        dropdown.querySelectorAll('.delivery-participant-option').forEach(function (optionElement) {
            optionElement.addEventListener('mousedown', function (event) {
                event.preventDefault();
            });
            optionElement.addEventListener('click', function () {
                addSelectedParticipant(fieldElement, optionElement.getAttribute('data-value') || '');
            });
        });
    }

    function addSelectedParticipant(fieldElement, value) {
        if (!fieldElement || !value) return;
        var container = fieldElement.classList.contains('delivery-participant-field')
            ? fieldElement
            : fieldElement.closest('.delivery-participant-field');
        if (!container) return;
        var selectedList = container.querySelector('.delivery-participant-selected-list');
        var searchInput = fieldElement.querySelector('.delivery-participant-search-input');
        if (!selectedList || !searchInput) return;

        var selectedValues = getSelectedParticipantValues(container);
        if (selectedValues.indexOf(value) !== -1) return;

        var participantElement = document.createElement('div');
        participantElement.innerHTML = createSelectedParticipantHTML(value);
        selectedList.appendChild(participantElement.firstChild);
        searchInput.value = '';
        fieldElement.dataset.dropdownOpen = 'false';
        refreshParticipantSearchField(fieldElement);
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function removeParticipantItem(buttonElement) {
        var row = buttonElement.closest('.delivery-selected-participant');
        var field = buttonElement.closest('.delivery-participant-field');
        if (!row) return;
        row.remove();
        if (field) {
            var searchField = field.querySelector('.delivery-participant-search-field');
            if (searchField) refreshParticipantSearchField(searchField);
        }
    }

    function bindParticipantSearchField(fieldElement) {
        if (!fieldElement || fieldElement.dataset.eventsReady === 'true') return;
        var searchInput = fieldElement.querySelector('.delivery-participant-search-input');
        var clearButton = fieldElement.querySelector('.delivery-participant-search-clear');
        var toggleButton = fieldElement.querySelector('.delivery-participant-search-toggle');
        if (!searchInput) return;

        searchInput.addEventListener('focus', function () {
            fieldElement.dataset.dropdownOpen = 'true';
            refreshParticipantSearchField(fieldElement);
        });
        searchInput.addEventListener('input', function () {
            fieldElement.dataset.dropdownOpen = 'true';
            refreshParticipantSearchField(fieldElement);
        });
        searchInput.addEventListener('blur', function () {
            window.setTimeout(function () {
                fieldElement.dataset.dropdownOpen = 'false';
                refreshParticipantSearchField(fieldElement);
            }, 120);
        });

        if (clearButton) {
            clearButton.addEventListener('click', function (event) {
                event.preventDefault();
                searchInput.value = '';
                fieldElement.dataset.dropdownOpen = 'false';
                refreshParticipantSearchField(fieldElement);
                searchInput.focus();
            });
        }

        if (toggleButton) {
            toggleButton.addEventListener('click', function (event) {
                event.preventDefault();
                fieldElement.dataset.dropdownOpen = fieldElement.dataset.dropdownOpen === 'true' ? 'false' : 'true';
                refreshParticipantSearchField(fieldElement);
                searchInput.focus();
            });
        }

        fieldElement.dataset.eventsReady = 'true';
        refreshParticipantSearchField(fieldElement);
    }

    function initParticipantSearchFields(rootElement) {
        (rootElement || document).querySelectorAll('.delivery-participant-search-field').forEach(function (fieldElement) {
            bindParticipantSearchField(fieldElement);
        });
    }

    function formatAttachmentMeta(file) {
        if (!file || typeof file.size !== 'number') return 'Arquivo anexado';
        var sizeInMb = file.size / (1024 * 1024);
        if (sizeInMb >= 1) return sizeInMb.toFixed(1) + ' MB';
        var sizeInKb = Math.max(1, Math.round(file.size / 1024));
        return sizeInKb + ' KB';
    }

    function addTrainingAttachments(fieldElement, fileList) {
        if (!fieldElement || !fileList || !fileList.length) return;
        var list = fieldElement.querySelector('.delivery-attachments-list');
        if (!list) return;

        Array.prototype.forEach.call(fileList, function (file) {
            var attachmentElement = document.createElement('div');
            var nextIndex = list.querySelectorAll('.delivery-attachment-item').length;
            attachmentElement.innerHTML = createAttachmentItemHTML({
                name: file.name,
                meta: formatAttachmentMeta(file)
            }, nextIndex);
            list.appendChild(attachmentElement.firstChild);
        });
    }

    function collectTrainingAttachments(phaseElement) {
        return Array.prototype.slice.call(phaseElement.querySelectorAll('.delivery-attachment-item')).map(function (attachmentElement) {
            return {
                name: attachmentElement.getAttribute('data-file-name') || '',
                meta: attachmentElement.getAttribute('data-file-meta') || ''
            };
        });
    }

    function updateStepUI() {
        for (var step = 1; step <= totalSteps; step += 1) {
            var section = document.getElementById('delivery-step-' + step);
            var indicator = document.getElementById('step-indicator-' + step);
            var label = document.getElementById('step-label-' + step);
            var progress = document.getElementById('step-progress-' + step);
            var isActive = step === currentStep;
            var isCompleted = step < currentStep;

            if (section) section.classList.toggle('hidden', !isActive);
            if (indicator) {
                indicator.classList.toggle('bg-bevap-green', isActive || isCompleted);
                indicator.classList.toggle('text-white', isActive || isCompleted);
                indicator.classList.toggle('bg-gray-300', !isActive && !isCompleted);
                indicator.classList.toggle('text-gray-600', !isActive && !isCompleted);
            }
            if (label) {
                label.classList.toggle('text-bevap-green', isActive);
                label.classList.toggle('font-medium', isActive);
                label.classList.toggle('text-gray-600', !isActive);
            }
            if (progress) {
                progress.style.width = currentStep > step ? '100%' : '0%';
            }
        }

        var prevButton = document.querySelector('[data-action="prev-step"]');
        var nextButton = document.querySelector('[data-action="next-step"]');
        var nextLabel = document.getElementById('next-btn-label');
        if (prevButton) prevButton.disabled = currentStep === 1;
        if (nextButton) {
            nextButton.disabled = currentStep === totalSteps;
            nextButton.classList.toggle('hidden', currentStep === totalSteps);
        }
        if (nextLabel) {
            nextLabel.textContent = currentStep < totalSteps
                ? 'Próximo: ' + stepLabels[currentStep + 1]
                : 'Próximo';
        }
    }

    function goToNextStep() {
        if (currentStep < totalSteps) {
            currentStep += 1;
            updateStepUI();
        }
    }

    function goToPrevStep() {
        if (currentStep > 1) {
            currentStep -= 1;
            updateStepUI();
        }
    }

    function goToStep(step) {
        var parsedStep = Number(step);
        if (parsedStep < 1 || parsedStep > totalSteps) return;
        currentStep = parsedStep;
        updateStepUI();
    }

    function refreshChecklistProgress() {
        var items = Array.prototype.slice.call(document.querySelectorAll('.delivery-checklist-item'));
        if (!items.length) return;
        var checkedCount = items.filter(function (item) { return item.checked; }).length;
        var percent = Math.round((checkedCount / items.length) * 100);
        var label = document.getElementById('delivery-checklist-label');
        var count = document.getElementById('delivery-checklist-count');
        var bar = document.getElementById('delivery-checklist-bar');

        if (label) label.textContent = percent + '% concluído';
        if (count) count.textContent = checkedCount + ' de ' + items.length + ' itens';
        if (bar) bar.style.width = percent + '%';
    }

    function getDeliveryItemData(phaseElement, forcedType) {
        var titleElement = phaseElement.querySelector('.delivery-phase-title');
        var typeElement = phaseElement.querySelector('.delivery-training-flag');
        var type = forcedType || (typeElement && typeElement.checked ? 'treinamento' : (phaseElement.dataset.planType || 'planejamento'));
        var data = {
            type: type,
            title: titleElement ? titleElement.value.trim() : ''
        };

        if (type === 'treinamento') {
            var trainingResponsibleElement = phaseElement.querySelector('.delivery-training-responsible .responsible-search-input');
            var trainingDateElement = phaseElement.querySelector('.delivery-training-date-input');
            var trainingHoursElement = phaseElement.querySelector('.delivery-training-hours-input');
            var trainingDescriptionElement = phaseElement.querySelector('.delivery-phase-description');
            data.responsible = trainingResponsibleElement ? trainingResponsibleElement.value.trim() : '';
            data.executionDate = trainingDateElement ? trainingDateElement.value.trim() : '';
            data.trainingHours = trainingHoursElement ? trainingHoursElement.value.trim() : '';
            data.description = trainingDescriptionElement ? trainingDescriptionElement.value.trim() : '';
            data.participants = Array.prototype.slice.call(phaseElement.querySelectorAll('.delivery-selected-participant')).map(function (itemElement) {
                return itemElement.getAttribute('data-value') || '';
            });
            data.attachments = collectTrainingAttachments(phaseElement);
            return data;
        }

        var phaseResponsibleElement = phaseElement.querySelector('.delivery-phase-responsible .responsible-search-input');
        var phaseExecutionDateElement = phaseElement.querySelector('.delivery-execution-date-input');
        var phaseDescriptionElement = phaseElement.querySelector('.delivery-phase-description');
        data.responsible = phaseResponsibleElement ? phaseResponsibleElement.value.trim() : '';
        data.executionDate = phaseExecutionDateElement ? phaseExecutionDateElement.value.trim() : '';
        data.description = phaseDescriptionElement ? phaseDescriptionElement.value.trim() : '';
        data.dependencies = Array.prototype.slice.call(phaseElement.querySelectorAll('.delivery-dependency-input')).map(function (inputElement) {
            return inputElement.value.trim();
        });
        return data;
    }

    function getPlanningTypeFieldHTML(selectedType) {
        return '' +
            '<div class="md:col-span-2">' +
                '<label class="inline-flex items-center gap-2 text-sm text-gray-600">' +
                    '<input type="checkbox" class="delivery-training-flag h-4 w-4 rounded border-gray-300 text-bevap-green focus:ring-bevap-green"' + (selectedType === 'treinamento' ? ' checked' : '') + '>' +
                    '<span class="font-medium text-gray-700">Planejar Treinamento</span>' +
                '</label>' +
            '</div>';
    }

    function getDeliveryPhaseBodyHTML(phaseData) {
        var selectedType = phaseData.type || 'planejamento';
        var bodyHtml = '' +
            '<div class="grid grid-cols-1 gap-4 md:grid-cols-2">' +
                getPlanningTypeFieldHTML(selectedType);

        if (selectedType === 'treinamento') {
            bodyHtml += '' +
                    '<div class="md:col-span-2">' +
                        '<div class="grid grid-cols-1 gap-4 md:grid-cols-3">' +
                            '<div>' +
                                '<label class="mb-1 block text-sm text-gray-600">Responsável Treinamento</label>' +
                                '<div class="delivery-training-responsible">' + getResponsibleSearchFieldHTML(phaseData.responsible || 'Ana Costa') + '</div>' +
                            '</div>' +
                            '<div>' +
                                '<label class="mb-1 block text-sm text-gray-600">Data Treinamento</label>' +
                                '<input type="text" value="' + escapeHtml(phaseData.executionDate || '') + '" class="delivery-training-date-input w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" placeholder="Selecione a data">' +
                            '</div>' +
                            '<div>' +
                                '<label class="mb-1 block text-sm text-gray-600">Horas Treinamento</label>' +
                                '<input type="number" min="0" step="0.5" value="' + escapeHtml(phaseData.trainingHours || '') + '" class="delivery-training-hours-input w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Informe a quantidade de horas">' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                getParticipantsFieldHTML(phaseData.participants || ['']) +
                '<div class="mt-4">' +
                    '<label class="mb-1 block text-sm text-gray-600">Descrição</label>' +
                    '<textarea class="delivery-phase-description w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows="3" placeholder="Descreva o treinamento...">' + escapeHtml(phaseData.description || '') + '</textarea>' +
                '</div>' +
                getTrainingAttachmentsFieldHTML(phaseData.attachments || []);
            return bodyHtml;
        }

        bodyHtml += '' +
                '<div>' +
                    '<label class="mb-1 block text-sm text-gray-600">Responsável</label>' +
                    '<div class="delivery-phase-responsible">' + getResponsibleSearchFieldHTML(phaseData.responsible || 'Ana Costa') + '</div>' +
                '</div>' +
                '<div>' +
                    '<label class="mb-1 block text-sm text-gray-600">Data Execução</label>' +
                    '<input type="text" value="' + escapeHtml(phaseData.executionDate || '') + '" class="delivery-execution-date-input w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" placeholder="Selecione a data">' +
                '</div>' +
            '</div>' +
            getDependenciesFieldHTML(phaseData.dependencies || ['']) +
            '<div class="mt-4">' +
                '<label class="mb-1 block text-sm text-gray-600">Descrição</label>' +
                '<textarea class="delivery-phase-description w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows="3" placeholder="Descreva o planejamento da entrega...">' + escapeHtml(phaseData.description || '') + '</textarea>' +
            '</div>';
        return bodyHtml;
    }

    function renderDeliveryPhaseBody(phaseElement, phaseData) {
        var contentElement = phaseElement.querySelector('.delivery-phase-content');
        if (!contentElement) return;
        phaseElement.dataset.planType = phaseData.type || 'planejamento';
        contentElement.innerHTML = getDeliveryPhaseBodyHTML(phaseData);
        initResponsibleSearchFields(contentElement);
        initParticipantSearchFields(contentElement);
        initSingleDatePickers(contentElement);
    }

    function getMilestoneStatusMeta(status) {
        var map = {
            concluido: {
                label: 'Concluído',
                badge: 'border-green-200 bg-green-50 text-green-700',
                icon: 'fa-solid fa-circle-check text-green-600'
            },
            em_andamento: {
                label: 'Em Andamento',
                badge: 'border-blue-200 bg-blue-50 text-blue-700',
                icon: 'fa-solid fa-play text-blue-600'
            },
            planejado: {
                label: 'Planejado',
                badge: 'border-gray-200 bg-gray-50 text-gray-700',
                icon: 'fa-regular fa-circle text-gray-500'
            }
        };
        return map[status] || map.planejado;
    }

    function getTaskStatusMeta(status) {
        var map = {
            aguardando_execucao: {
                label: 'Aguardando Execução',
                badge: 'border-gray-200 bg-gray-50 text-gray-700',
                icon: 'fa-regular fa-clock text-gray-500'
            },
            em_execucao: {
                label: 'Em Execução',
                badge: 'border-blue-200 bg-blue-50 text-blue-700',
                icon: 'fa-solid fa-play text-blue-600'
            },
            validacao_solicitante: {
                label: 'Validação do Solicitante',
                badge: 'border-yellow-200 bg-yellow-50 text-yellow-700',
                icon: 'fa-solid fa-user-check text-yellow-600'
            },
            validacao_ti: {
                label: 'Validação do TI',
                badge: 'border-indigo-200 bg-indigo-50 text-indigo-700',
                icon: 'fa-solid fa-shield-halved text-indigo-600'
            },
            concluido: {
                label: 'Concluído',
                badge: 'border-green-200 bg-green-50 text-green-700',
                icon: 'fa-solid fa-circle-check text-green-600'
            }
        };
        return map[status] || map.aguardando_execucao;
    }

    function updateDeliveryInfoTabs() {
        var goLiveTab = document.getElementById('tab-delivery-go-live');
        var summaryTab = document.getElementById('tab-delivery-summary');
        var summaryAlert = document.getElementById('tab-delivery-summary-alert');
        var goLiveContent = document.getElementById('tab-content-delivery-go-live');
        var summaryContent = document.getElementById('tab-content-delivery-summary');
        var isGoLiveActive = deliveryInfoTab === 'go-live';

        if (goLiveTab) {
            goLiveTab.classList.toggle('border-bevap-green', isGoLiveActive);
            goLiveTab.classList.toggle('bg-green-50', isGoLiveActive);
            goLiveTab.classList.toggle('text-bevap-green', isGoLiveActive);
            goLiveTab.classList.toggle('border-transparent', !isGoLiveActive);
            goLiveTab.classList.toggle('text-gray-500', !isGoLiveActive);
        }
        if (summaryTab) {
            summaryTab.classList.toggle('border-bevap-green', !isGoLiveActive);
            summaryTab.classList.toggle('bg-green-50', !isGoLiveActive);
            summaryTab.classList.toggle('text-bevap-green', !isGoLiveActive);
            summaryTab.classList.toggle('border-transparent', isGoLiveActive);
            summaryTab.classList.toggle('text-gray-500', isGoLiveActive);
        }
        if (summaryAlert) summaryAlert.classList.toggle('hidden', !isGoLiveActive);
        if (goLiveContent) goLiveContent.classList.toggle('hidden', !isGoLiveActive);
        if (summaryContent) summaryContent.classList.toggle('hidden', isGoLiveActive);
    }

    function setDeliveryInfoTab(tabName) {
        deliveryInfoTab = tabName === 'summary' ? 'summary' : 'go-live';
        updateDeliveryInfoTabs();
        if (deliveryInfoTab === 'summary') {
            renderRelatedExecutionMilestones();
        }
    }

    function renderRelatedExecutionMilestones() {
        var container = document.getElementById('delivery-related-milestones-list');
        if (!container) return;

        container.innerHTML = relatedExecutionMilestonesData.map(function (milestone, index) {
            var status = getMilestoneStatusMeta(milestone.status);
            var isCollapsed = collapsedRelatedExecutionMilestones[index] === true;
            var executionActivityLink = '../marcos/ux-marco-execucao-atividade.html';
            return '' +
                '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">' +
                    '<div class="flex items-start justify-between gap-4">' +
                        '<div class="min-w-0 flex-1">' +
                            '<div class="flex items-center gap-3">' +
                                '<span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">' +
                                    '<i class="fa-solid fa-flag-checkered text-base"></i>' +
                                '</span>' +
                                '<div class="min-w-0 flex-1">' +
                                    '<h3 class="text-base font-montserrat font-semibold text-bevap-navy">Marco: ' + escapeHtml(milestone.name) + '</h3>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<span class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ' + status.badge + '">' +
                            '<i class="' + status.icon + '"></i>' +
                            '<span>' + status.label + '</span>' +
                        '</span>' +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap gap-2 text-[13px]">' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1" style="color: #dbeafe;"></i>Responsável: ' + escapeHtml(milestone.owner) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-alt mr-1 text-red-100"></i>' + escapeHtml(milestone.period) + '</span>' +
                    '</div>' +
                    '<div class="mt-3 flex items-center justify-end gap-3">' +
                        '<div class="ml-auto shrink-0">' +
                            '<button type="button" onclick="toggleRelatedExecutionMilestoneCollapse(' + index + ')" class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">' +
                                '<i class="fa-solid ' + (isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up') + ' mr-2 text-gray-400"></i>' + (isCollapsed ? 'Expandir' : 'Recolher') +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="' + (isCollapsed ? 'hidden' : 'block') + '">' +
                        '<div class="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">' +
                            '<div class="mb-1.5 flex items-center gap-2">' +
                                '<i class="fa-solid fa-check-double text-sm text-blue-700"></i>' +
                                '<h4 class="text-sm font-montserrat font-semibold text-gray-900">Critérios de Aceite</h4>' +
                            '</div>' +
                            '<div class="space-y-0.5">' +
                                milestone.criteria.map(function (item) {
                                    return '<div class="flex items-start gap-1 rounded-lg bg-blue-50 px-3 py-1 text-sm leading-snug text-gray-700"><i class="fa-solid fa-check mt-0.5 text-[10px] text-bevap-green"></i><span>' + escapeHtml(item) + '</span></div>';
                                }).join('') +
                            '</div>' +
                        '</div>' +
                        '<div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-4">' +
                            '<div class="mb-3 flex items-center justify-between gap-3">' +
                                '<div>' +
                                    '<h4 class="text-sm font-montserrat font-semibold text-gray-900">Tarefas do Marco</h4>' +
                                    '<p class="text-xs text-gray-500">Tarefas relacionadas no planejamento para compor esta entrega.</p>' +
                                '</div>' +
                                '<span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">' + milestone.tasks.length + ' tarefas</span>' +
                            '</div>' +
                            '<div class="space-y-3">' +
                                milestone.tasks.map(function (task) {
                                    var taskStatus = getTaskStatusMeta(task.status);
                                    return '' +
                                        '<div class="rounded-xl border border-gray-200 bg-white p-4">' +
                                            '<div class="flex items-start justify-between gap-3">' +
                                                '<div class="min-w-0 flex-1">' +
                                                    '<a href="' + executionActivityLink + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-semibold text-bevap-navy transition-colors hover:text-blue-700">' +
                                                        '<span>' + escapeHtml(task.taskName) + '</span>' +
                                                        '<i class="fa-solid fa-link text-[11px] shrink-0"></i>' +
                                                    '</a>' +
                                                    '<div class="mt-2 flex flex-wrap gap-2 text-[13px]">' +
                                                        '<span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #2563eb; border-color: #2563eb;"><i class="fa-solid fa-user-tie mr-1 text-blue-100"></i>Responsável: ' + escapeHtml(task.responsible || '-') + '</span>' +
                                                        '<span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-solid fa-layer-group mr-1 text-green-200"></i>Fase: ' + escapeHtml(task.phaseName) + '</span>' +
                                                        '<span class="inline-flex items-center rounded-full border px-2.5 py-1 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>' + escapeHtml(task.date) + '</span>' +
                                                    '</div>' +
                                                '</div>' +
                                                '<span class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ' + taskStatus.badge + '">' +
                                                    '<i class="' + taskStatus.icon + '"></i>' +
                                                    '<span>' + taskStatus.label + '</span>' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>';
                                }).join('') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function toggleRelatedExecutionMilestoneCollapse(index) {
        collapsedRelatedExecutionMilestones[index] = !collapsedRelatedExecutionMilestones[index];
        renderRelatedExecutionMilestones();
    }

    window.toggleRelatedExecutionMilestoneCollapse = toggleRelatedExecutionMilestoneCollapse;

    function createDeliveryPhaseElement(phaseData, index) {
        var phaseElement = document.createElement('div');
        phaseElement.className = 'delivery-phase-item overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm';
        phaseElement.innerHTML = '' +
            '<div class="panel-toggle-header flex cursor-pointer items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">' +
                '<div class="w-full min-w-0">' +
                    '<div class="flex items-center gap-2">' +
                        '<span class="delivery-phase-number text-gray-500">' + (index + 1) + '.</span>' +
                        '<input type="text" value="' + escapeHtml(phaseData.title || '') + '" class="delivery-phase-title w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700" placeholder="Informe o título do planejamento">' +
                    '</div>' +
                '</div>' +
                '<div class="flex items-center space-x-2 pl-3 shrink-0">' +
                    '<button type="button" class="text-red-400 hover:text-red-600" data-action="remove-delivery-phase" title="Remover planejamento">' +
                        '<i class="fa-solid fa-trash"></i>' +
                    '</button>' +
                    '<button type="button" class="cursor-grab text-gray-400 hover:text-gray-600" title="Mover">' +
                        '<i class="fa-solid fa-grip-vertical"></i>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="delivery-phase-content p-4"></div>';

        renderDeliveryPhaseBody(phaseElement, phaseData);
        return phaseElement;
    }

    function updateDeliveryPhaseLabels() {
        var phaseItems = document.querySelectorAll('#delivery-plan-container .delivery-phase-item');
        phaseItems.forEach(function (phaseElement, index) {
            var numberElement = phaseElement.querySelector('.delivery-phase-number');
            if (numberElement) numberElement.textContent = (index + 1) + '.';
        });
    }

    function addDeliveryPhase(phaseData) {
        var container = document.getElementById('delivery-plan-container');
        if (!container) return;
        var phaseElement = createDeliveryPhaseElement(phaseData || {
            type: 'planejamento',
            title: '',
            responsible: 'Ana Costa',
            executionDate: '03/20/2026',
            trainingHours: '',
            description: '',
            participants: [],
            attachments: [],
            dependencies: ['']
        }, container.querySelectorAll('.delivery-phase-item').length);

        container.appendChild(phaseElement);
        updateDeliveryPhaseLabels();
        renderDeliveryTimeline();
    }

    function togglePlanningPanel(headerElement) {
        var panelItem = headerElement.closest('.delivery-phase-item');
        if (!panelItem) return;
        var panelContent = panelItem.querySelector('.delivery-phase-content');
        if (!panelContent) return;
        panelContent.classList.toggle('hidden');
    }

    function getDeliveryTimelineData() {
        var phaseItems = Array.prototype.slice.call(document.querySelectorAll('#delivery-plan-container .delivery-phase-item'));
        var items = [];

        phaseItems.forEach(function (phaseElement, phaseIndex) {
            var phaseData = getDeliveryItemData(phaseElement);

            items.push({
                phaseIndex: phaseIndex,
                phaseTitle: phaseData.title || ((phaseData.type === 'treinamento' ? 'Treinamento ' : 'Planejamento ') + (phaseIndex + 1)),
                executionDate: phaseData.executionDate,
                responsible: phaseData.responsible,
                description: phaseData.description
            });
        });

        items.sort(function (a, b) {
            var dateA = parseDateFromText(a.executionDate);
            var dateB = parseDateFromText(b.executionDate);
            if (!dateA && !dateB) return a.phaseIndex - b.phaseIndex;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
        });

        return items;
    }

    function renderDeliveryTimeline() {
        var timelineContainer = document.getElementById('delivery-timeline-list');
        if (!timelineContainer) return;

        var timelineItems = getDeliveryTimelineData();
        if (!timelineItems.length) {
            timelineContainer.innerHTML = '<div class="text-sm text-gray-600">Adicione planejamentos para visualizar a linha do tempo da entrega.</div>';
            return;
        }

        timelineContainer.innerHTML = timelineItems.map(function (item, index) {
            var isLastItem = index === timelineItems.length - 1;
            var parsedDate = parseDateFromText(item.executionDate);
            var hasDate = Boolean(parsedDate);
            var isReachedDate = hasDate && parsedDate <= new Date();
            var iconBg = 'bg-blue-100';
            var iconColor = 'text-blue-600';
            var iconClass = 'fa-solid fa-hourglass-half';

            if (isLastItem) {
                iconBg = 'bg-bevap-green/10';
                iconColor = 'text-bevap-green';
                iconClass = 'fa-solid fa-rocket';
            } else if (isReachedDate) {
                iconBg = 'bg-bevap-gold/10';
                iconColor = 'text-bevap-gold';
                iconClass = 'fa-solid fa-check';
            }

            return '' +
                '<div class="flex gap-4">' +
                    '<div class="flex flex-col items-center">' +
                        '<div class="flex h-10 w-10 items-center justify-center rounded-full ' + iconBg + '">' +
                            '<i class="' + iconClass + ' ' + iconColor + '"></i>' +
                        '</div>' +
                        (isLastItem ? '' : '<div class="mt-2 h-full w-0.5 bg-slate-200"></div>') +
                    '</div>' +
                    '<div class="flex-1 ' + (isLastItem ? '' : 'pb-4') + '">' +
                        '<div class="mb-1 flex items-start justify-between gap-3">' +
                            '<h4 class="font-semibold text-bevap-navy">' + escapeHtml(item.phaseTitle) + '</h4>' +
                            '<span class="whitespace-nowrap text-xs text-slate-500">' + escapeHtml(getTimelineWhenLabel(item.executionDate)) + '</span>' +
                        '</div>' +
                        '<p class="mb-1 text-xs text-slate-500">' + escapeHtml(formatDateLabel(item.executionDate)) + '</p>' +
                        '<p class="mb-1 text-xs text-slate-500">Responsável: ' + escapeHtml(item.responsible || 'A definir') + '</p>' +
                        '<p class="text-sm text-slate-700">' + escapeHtml(item.description || 'Descrição não informada') + '</p>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function bindDeliveryPlanEvents() {
        document.addEventListener('click', function (event) {
            var goLiveTabButton = event.target.closest('#tab-delivery-go-live');
            if (goLiveTabButton) {
                setDeliveryInfoTab('go-live');
                return;
            }

            var summaryTabButton = event.target.closest('#tab-delivery-summary');
            if (summaryTabButton) {
                setDeliveryInfoTab('summary');
                return;
            }

            var panelHeader = event.target.closest('.panel-toggle-header');
            if (panelHeader && !event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) {
                togglePlanningPanel(panelHeader);
                return;
            }

            var addPhaseButton = event.target.closest('[data-action="add-delivery-phase"]');
            if (addPhaseButton) {
                addDeliveryPhase();
                return;
            }

            var removePhaseButton = event.target.closest('[data-action="remove-delivery-phase"]');
            if (removePhaseButton) {
                var phaseElement = removePhaseButton.closest('.delivery-phase-item');
                if (phaseElement) {
                    openDeleteConfirmation('Deseja excluir este planejamento?', function () {
                        phaseElement.remove();
                        updateDeliveryPhaseLabels();
                        renderDeliveryTimeline();
                    });
                }
                return;
            }

            var addDependencyButton = event.target.closest('[data-action="add-dependency"]');
            if (addDependencyButton) {
                addDependencyItem(addDependencyButton);
                return;
            }

            var removeDependencyButton = event.target.closest('[data-action="remove-dependency"]');
            if (removeDependencyButton) {
                removeDependencyItem(removeDependencyButton);
                renderDeliveryTimeline();
                return;
            }

            var removeParticipantButton = event.target.closest('[data-action="remove-participant"]');
            if (removeParticipantButton) {
                removeParticipantItem(removeParticipantButton);
                return;
            }

            var uploadTrigger = event.target.closest('.delivery-attachments-dropzone');
            if (uploadTrigger) {
                var uploadField = uploadTrigger.closest('.delivery-attachments-field');
                var fileInput = uploadField ? uploadField.querySelector('.delivery-attachments-input') : null;
                if (fileInput) fileInput.click();
                return;
            }

            var removeAttachmentButton = event.target.closest('[data-action="remove-training-attachment"]');
            if (removeAttachmentButton) {
                var attachmentRow = removeAttachmentButton.closest('.delivery-attachment-item');
                if (attachmentRow) {
                    openDeleteConfirmation('Deseja excluir este anexo?', function () {
                        attachmentRow.remove();
                    });
                }
                return;
            }

            var removeStaticDocumentButton = event.target.closest('[data-action="remove-static-document"]');
            if (removeStaticDocumentButton) {
                var documentRow = removeStaticDocumentButton.closest('.delivery-static-document-item');
                if (documentRow) {
                    openDeleteConfirmation('Deseja excluir este anexo?', function () {
                        documentRow.remove();
                    });
                }
                return;
            }
        });

        document.addEventListener('input', function (event) {
            if (event.target.closest('#delivery-plan-container')) {
                renderDeliveryTimeline();
            }
        });

        document.addEventListener('change', function (event) {
            if (event.target.matches('.delivery-training-flag')) {
                var phaseElement = event.target.closest('.delivery-phase-item');
                if (!phaseElement) return;
                var previousType = phaseElement.dataset.planType || 'planejamento';
                var currentData = getDeliveryItemData(phaseElement, previousType);
                currentData.type = event.target.checked ? 'treinamento' : 'planejamento';
                if (currentData.type === 'treinamento') {
                    currentData.trainingHours = currentData.trainingHours || '';
                    currentData.participants = currentData.participants && currentData.participants.length ? currentData.participants : [];
                    currentData.attachments = currentData.attachments || [];
                } else {
                    currentData.dependencies = currentData.dependencies && currentData.dependencies.length ? currentData.dependencies : [''];
                }
                renderDeliveryPhaseBody(phaseElement, currentData);
                renderDeliveryTimeline();
                return;
            }

            if (event.target.matches('.delivery-attachments-input')) {
                var attachmentsField = event.target.closest('.delivery-attachments-field');
                addTrainingAttachments(attachmentsField, event.target.files);
                event.target.value = '';
                return;
            }

            if (event.target.closest('#delivery-plan-container')) {
                renderDeliveryTimeline();
            }
        });
    }

    function seedDeliveryPlan() {
        defaultPlanData.forEach(function (phaseData) {
            addDeliveryPhase(phaseData);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initResponsibleSearchFields();
        initRangePickers();
        initSingleDatePickers();
        bindDeliveryPlanEvents();
        seedDeliveryPlan();
        renderRelatedExecutionMilestones();
        updateDeliveryInfoTabs();
        updateStepUI();
        refreshChecklistProgress();
        renderDeliveryTimeline();

        document.querySelectorAll('[data-step-target]').forEach(function (stepTrigger) {
            stepTrigger.addEventListener('click', function () {
                goToStep(stepTrigger.getAttribute('data-step-target'));
            });
        });

        document.querySelectorAll('.delivery-checklist-item').forEach(function (item) {
            item.addEventListener('change', refreshChecklistProgress);
        });

        var saveButton = document.querySelector('[data-action="save-delivery-plan"]');
        var nextButton = document.querySelector('[data-action="next-step"]');
        var prevButton = document.querySelector('[data-action="prev-step"]');
        var concludeButton = document.querySelector('[data-action="conclude-delivery-plan"]');
        var deleteCancelButton = document.getElementById('delete-confirmation-cancel');
        var deleteConfirmButton = document.getElementById('delete-confirmation-confirm');
        var concludeCancelButton = document.getElementById('delivery-conclude-cancel');
        var concludeConfirmButton = document.getElementById('delivery-conclude-confirm');

        if (saveButton) {
            saveButton.addEventListener('click', function () {
                showToast('Rascunho salvo', 'As informações do planejamento da entrega foram salvas.', 'success');
            });
        }
        if (nextButton) nextButton.addEventListener('click', goToNextStep);
        if (prevButton) prevButton.addEventListener('click', goToPrevStep);
        if (concludeButton) {
            concludeButton.addEventListener('click', function () {
                openDeliveryConcludeModal();
            });
        }
        if (deleteCancelButton) deleteCancelButton.addEventListener('click', closeDeleteConfirmation);
        if (deleteConfirmButton) deleteConfirmButton.addEventListener('click', confirmDeleteAction);
        if (concludeCancelButton) concludeCancelButton.addEventListener('click', closeDeliveryConcludeModal);
        if (concludeConfirmButton) {
            concludeConfirmButton.addEventListener('click', function () {
                closeDeliveryConcludeModal();
                showToast('Planejamento concluído', 'O planejamento da entrega foi consolidado com sucesso.', 'success');
            });
        }
    });
})();
