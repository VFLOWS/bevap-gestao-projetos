(function () {
    var finalNote = '';
    var currentTab = 'overview';

    var projectPlanningData = [
        {
            title: 'Planejamento do Go Live',
            responsible: 'PMO Corporativo',
            executionDate: '22/03/2026',
            description: 'Consolidar a janela produtiva, alinhar a sequência operacional e garantir a comunicação com as áreas envolvidas durante o início do GO Live.',
            dependencies: [
                'Janela produtiva aprovada',
                'Validação final do ambiente concluída',
                'Stakeholders comunicados'
            ]
        },
        {
            title: 'Acompanhamento da liberação',
            responsible: 'Rafael Souza',
            executionDate: '22/03/2026',
            description: 'Monitorar a liberação, apoiar a estabilização inicial do ambiente e acionar rapidamente o fluxo de contingência em caso de desvio operacional.',
            dependencies: [
                'Equipe de plantão alocada',
                'Monitoramento ativo em produção',
                'Plano de rollback revisado'
            ]
        }
    ];

    var trainingsSummaryData = [
        {
            title: 'Treinamento de usuários-chave para Go Live',
            responsible: 'Ana Costa',
            plannedDate: '19/03/2026',
            plannedHours: '6h',
            participants: [
                'Aline Martins',
                'Bruno Castro',
                'Camila Rocha',
                'Daniel Moraes',
                'Eduarda Lima',
                'Felipe Nunes',
                'Gabriela Costa',
                'Henrique Melo',
                'Isabela Santos',
                'Joao Pedro',
                'Karen Alves',
                'Lucas Teixeira',
                'Mariana Cruz',
                'Nicolas Freitas',
                'Patricia Gomes',
                'Thiago Ribeiro'
            ],
            confirmed: true,
            confirmedDate: '2026-03-19T09:00',
            notes: 'Treinamento realizado com usuários-chave, equipe de suporte e multiplicadores do negócio.'
        },
        {
            title: 'Reciclagem operacional da equipe de suporte e atendimento',
            responsible: 'Rafael Souza',
            plannedDate: '21/03/2026',
            plannedHours: '3h',
            participants: [
                'Bianca Moreira',
                'Carlos Eduardo',
                'Diego Sales',
                'Fernanda Ramos',
                'Julia Pires',
                'Leandro Matos',
                'Priscila Duarte',
                'Vanessa Araujo'
            ],
            confirmed: true,
            confirmedDate: '2026-03-21T14:00',
            notes: 'Treinamento complementar realizado com a equipe de suporte e operação para reforçar o fluxo de atendimento durante o Go Live.'
        }
    ];

    var closingDocumentsData = [
        { name: 'Ata_Encerramento_Projeto.pdf', meta: '820 KB' },
        { name: 'Termo_Aceite_Final_Assinado.pdf', meta: '1.4 MB' },
        { name: 'Relatorio_Final_Estabilizacao.docx', meta: '560 KB' },
        { name: 'Checklist_Encerramento_TI.xlsx', meta: '390 KB' }
    ];

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createDependenciesHTML(dependencies) {
        return (dependencies || []).map(function (item) {
            return '' +
                '<div class="flex items-start gap-2 p-1 text-sm text-gray-700">' +
                    '<i class="fa-solid fa-triangle-exclamation mt-0.5 text-yellow-600"></i>' +
                    '<span>' + escapeHtml(item) + '</span>' +
                '</div>';
        }).join('');
    }

    function createParticipantsHTML(participants) {
        return (participants || []).map(function (participant) {
            return '<span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">' + escapeHtml(participant) + '</span>';
        }).join('');
    }

    function formatDateTimeDisplay(value) {
        if (!value) return 'Não informado';

        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
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

        toast.className = 'fixed right-4 top-24 z-[70] hidden max-w-sm rounded-lg border-l-4 bg-white px-4 py-3 shadow-xl ' + selected.border;
        icon.className = selected.icon + ' text-xl';
        titleElement.textContent = title;
        messageElement.textContent = message;
        toast.classList.remove('hidden');

        window.clearTimeout(window.__closureToastTimeout);
        window.__closureToastTimeout = window.setTimeout(function () {
            toast.classList.add('hidden');
        }, 3200);
    }

    function createAttachmentListHTML() {
        return closingDocumentsData.map(function (attachment) {
            return '' +
                '<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">' +
                    '<div class="flex items-center gap-3">' +
                        '<i class="fa-solid fa-file-lines text-blue-500"></i>' +
                        '<div>' +
                            '<div class="text-sm font-medium text-gray-900">' + escapeHtml(attachment.name) + '</div>' +
                            '<div class="text-xs text-gray-500">' + escapeHtml(attachment.meta) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function renderClosureDocumentsPanel() {
        var container = document.getElementById('closure-documents-panel');
        if (!container) return;

        container.innerHTML = '' +
            '<div class="bg-white p-5">' +
                '<div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-bevap-green">' +
                    '<i class="fa-solid fa-cloud-arrow-up mb-3 text-4xl text-gray-400"></i>' +
                    '<p class="mb-2 text-gray-600">Arraste arquivos ou clique para selecionar</p>' +
                    '<p class="text-sm text-gray-500">PDF, DOC, XLS (máx. 10MB)</p>' +
                '</div>' +
                '<div class="mt-4 space-y-3">' +
                    createAttachmentListHTML() +
                '</div>' +
            '</div>';
    }

    function renderProjectPlanningPanel() {
        var container = document.getElementById('project-planning-list');
        if (!container) return;

        var planningHtml = projectPlanningData.map(function (item) {
            return '' +
                '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">' +
                    '<div class="flex items-start justify-between gap-4">' +
                        '<div class="min-w-0 flex-1">' +
                            '<div class="flex items-center gap-3">' +
                                '<span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">' +
                                    '<i class="fa-solid fa-rocket text-base"></i>' +
                                '</span>' +
                                '<div class="min-w-0 flex-1">' +
                                    '<h3 class="text-base font-montserrat font-semibold text-bevap-navy">' + escapeHtml(item.title) + '</h3>' +
                                    '<p class="mt-1 text-sm text-gray-500">Responsável: ' + escapeHtml(item.responsible) + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<span class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><i class="fa-solid fa-calendar-check text-blue-600"></i><span>Planejado</span></span>' +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap gap-2 text-[13px]">' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Planejado: ' + escapeHtml(item.executionDate) + '</span>' +
                    '</div>' +
                    '<div class="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">' +
                        '<span class="font-semibold text-bevap-navy">Descrição:</span> ' + escapeHtml(item.description) +
                    '</div>' +
                    '<div class="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">' +
                        '<div class="mb-3 flex items-center justify-between gap-3">' +
                            '<label class="text-sm font-medium text-bevap-navy">Dependências</label>' +
                            '<span class="text-xs font-medium text-gray-600">' + (item.dependencies || []).length + ' itens</span>' +
                        '</div>' +
                        '<div class="space-y-2">' +
                            createDependenciesHTML(item.dependencies) +
                        '</div>' +
                    '</div>' +
                '</div>';
        }).join('');

        var trainingHtml = trainingsSummaryData.map(function (item) {
            return '' +
                '<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">' +
                    '<div class="flex items-start justify-between gap-4">' +
                        '<div class="min-w-0 flex-1">' +
                            '<div class="flex items-center gap-3">' +
                                '<span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">' +
                                    '<i class="fa-solid fa-chalkboard-user text-base"></i>' +
                                '</span>' +
                                '<div class="min-w-0 flex-1">' +
                                    '<h3 class="text-base font-montserrat font-semibold text-bevap-navy">' + escapeHtml(item.title) + '</h3>' +
                                    '<p class="mt-1 text-sm text-gray-500">Responsável: ' + escapeHtml(item.responsible) + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check text-green-600"></i><span>Realizado</span></span>' +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap gap-2 text-[13px]">' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Planejado: ' + escapeHtml(item.plannedDate) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>' + escapeHtml(item.plannedHours) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-gray-700"><i class="fa-solid fa-calendar-check mr-1 text-gray-500"></i>Realizado: ' + escapeHtml(formatDateTimeDisplay(item.confirmedDate)) + '</span>' +
                    '</div>' +
                    '<div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">' +
                        '<div class="mb-3">' +
                            '<label class="text-sm font-medium text-bevap-navy">Participantes</label>' +
                        '</div>' +
                        '<div class="flex flex-wrap gap-2">' +
                            createParticipantsHTML(item.participants) +
                        '</div>' +
                    '</div>' +
                    '<div class="mt-4">' +
                        '<label class="mb-1 block text-sm text-gray-600">Observações</label>' +
                        '<textarea class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" rows="3" readonly>' + escapeHtml(item.notes) + '</textarea>' +
                    '</div>' +
                '</div>';
        }).join('');

        container.innerHTML = planningHtml + trainingHtml;
    }

    function refreshTabsArrows() {
        var tabsScroll = document.getElementById('closure-tabs-scroll');
        var leftArrow = document.getElementById('closure-tabs-left-arrow');
        var rightArrow = document.getElementById('closure-tabs-right-arrow');
        if (!tabsScroll || !leftArrow || !rightArrow) return;

        var maxScrollLeft = Math.max(0, tabsScroll.scrollWidth - tabsScroll.clientWidth);
        var canScrollLeft = tabsScroll.scrollLeft > 8;
        var canScrollRight = tabsScroll.scrollLeft < maxScrollLeft - 8;

        leftArrow.classList.toggle('opacity-0', !canScrollLeft);
        leftArrow.classList.toggle('pointer-events-none', !canScrollLeft);
        rightArrow.classList.toggle('opacity-0', !canScrollRight);
        rightArrow.classList.toggle('pointer-events-none', !canScrollRight);
    }

    function scrollTabIntoView(tabButton) {
        var tabsScroll = document.getElementById('closure-tabs-scroll');
        if (!tabsScroll || !tabButton) return;

        var tabLeft = tabButton.offsetLeft;
        var tabRight = tabLeft + tabButton.offsetWidth;
        var visibleLeft = tabsScroll.scrollLeft;
        var visibleRight = visibleLeft + tabsScroll.clientWidth;
        var padding = 48;

        if (tabLeft < visibleLeft + padding) {
            tabsScroll.scrollTo({
                left: Math.max(0, tabLeft - padding),
                behavior: 'smooth'
            });
        } else if (tabRight > visibleRight - padding) {
            tabsScroll.scrollTo({
                left: tabRight - tabsScroll.clientWidth + padding,
                behavior: 'smooth'
            });
        }
    }

    function updateTabs() {
        var overviewTab = document.getElementById('tab-closure-overview');
        var requesterValidationTab = document.getElementById('tab-requester-validation');
        var finalValidationTab = document.getElementById('tab-ti-final-validation');
        var validationTab = document.getElementById('tab-ti-go-live-validation');
        var projectPlanningTab = document.getElementById('tab-project-planning');
        var overviewContent = document.getElementById('tab-content-closure-overview');
        var requesterValidationContent = document.getElementById('tab-content-requester-validation');
        var finalValidationContent = document.getElementById('tab-content-ti-final-validation');
        var validationContent = document.getElementById('tab-content-ti-go-live-validation');
        var projectPlanningContent = document.getElementById('tab-content-project-planning');
        if (!overviewTab || !requesterValidationTab || !finalValidationTab || !validationTab || !projectPlanningTab || !overviewContent || !requesterValidationContent || !finalValidationContent || !validationContent || !projectPlanningContent) return;

        var isOverview = currentTab === 'overview';
        var isRequesterValidation = currentTab === 'requester-validation';
        var isFinalValidation = currentTab === 'final-validation';
        var isValidation = currentTab === 'validation';
        var isProjectPlanning = currentTab === 'project-planning';

        overviewTab.className = isOverview
            ? 'shrink-0 whitespace-nowrap border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'shrink-0 whitespace-nowrap border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        requesterValidationTab.className = isRequesterValidation
            ? 'shrink-0 whitespace-nowrap border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'shrink-0 whitespace-nowrap border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        finalValidationTab.className = isFinalValidation
            ? 'shrink-0 whitespace-nowrap border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'shrink-0 whitespace-nowrap border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        validationTab.className = isValidation
            ? 'shrink-0 whitespace-nowrap border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'shrink-0 whitespace-nowrap border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        projectPlanningTab.className = isProjectPlanning
            ? 'shrink-0 whitespace-nowrap border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'shrink-0 whitespace-nowrap border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';

        overviewContent.classList.toggle('hidden', !isOverview);
        requesterValidationContent.classList.toggle('hidden', !isRequesterValidation);
        finalValidationContent.classList.toggle('hidden', !isFinalValidation);
        validationContent.classList.toggle('hidden', !isValidation);
        projectPlanningContent.classList.toggle('hidden', !isProjectPlanning);

        var activeTab = isOverview
            ? overviewTab
            : isRequesterValidation
                ? requesterValidationTab
                : isFinalValidation
                    ? finalValidationTab
                    : isValidation
                        ? validationTab
                        : projectPlanningTab;

        scrollTabIntoView(activeTab);
        window.setTimeout(refreshTabsArrows, 200);
    }

    function setCurrentTab(tabName) {
        currentTab = tabName === 'requester-validation' || tabName === 'final-validation' || tabName === 'validation' || tabName === 'project-planning'
            ? tabName
            : 'overview';
        updateTabs();
    }

    function openModal(modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeModal(modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function bindEvents() {
        var tabsScroll = document.getElementById('closure-tabs-scroll');
        var leftArrow = document.getElementById('closure-tabs-left-arrow');
        var rightArrow = document.getElementById('closure-tabs-right-arrow');

        if (tabsScroll) {
            tabsScroll.addEventListener('scroll', refreshTabsArrows);
        }

        if (leftArrow && tabsScroll) {
            leftArrow.addEventListener('click', function () {
                var distance = Math.max(280, Math.floor(tabsScroll.clientWidth * 0.85));
                tabsScroll.scrollBy({
                    left: -distance,
                    behavior: 'smooth'
                });
            });
        }

        if (rightArrow && tabsScroll) {
            rightArrow.addEventListener('click', function () {
                var distance = Math.max(280, Math.floor(tabsScroll.clientWidth * 0.85));
                tabsScroll.scrollBy({
                    left: distance,
                    behavior: 'smooth'
                });
            });
        }

        window.addEventListener('resize', refreshTabsArrows);

        document.addEventListener('click', function (event) {
            var overviewTabButton = event.target.closest('#tab-closure-overview');
            if (overviewTabButton) {
                setCurrentTab('overview');
                return;
            }

            var requesterValidationTabButton = event.target.closest('#tab-requester-validation');
            if (requesterValidationTabButton) {
                setCurrentTab('requester-validation');
                return;
            }

            var finalValidationTabButton = event.target.closest('#tab-ti-final-validation');
            if (finalValidationTabButton) {
                setCurrentTab('final-validation');
                return;
            }

            var validationTabButton = event.target.closest('#tab-ti-go-live-validation');
            if (validationTabButton) {
                setCurrentTab('validation');
                return;
            }

            var projectPlanningTabButton = event.target.closest('#tab-project-planning');
            if (projectPlanningTabButton) {
                setCurrentTab('project-planning');
                return;
            }

            var openDocumentsButton = event.target.closest('[data-action="open-closure-documents"]');
            if (openDocumentsButton) {
                setCurrentTab('overview');
                return;
            }

            var returnPlanningButton = event.target.closest('[data-action="return-planning"]');
            if (returnPlanningButton) {
                openModal('return-modal');
                return;
            }

            var discontinueButton = event.target.closest('[data-action="discontinue-closure"]');
            if (discontinueButton) {
                openModal('discontinue-modal');
                return;
            }

            var concludeButton = event.target.closest('[data-action="conclude-closure"]');
            if (concludeButton) {
                var agreementCheckbox = document.getElementById('closure-agreement-checkbox');
                if (!finalNote.trim()) {
                    showToast('Informe a observação final', 'Registre a observação final da TI antes de concluir o encerramento do projeto.', 'error');
                    return;
                }
                if (!agreementCheckbox || !agreementCheckbox.checked) {
                    showToast('Confirmação obrigatória', 'Marque a confirmação da documentação de encerramento antes de concluir esta etapa.', 'error');
                    return;
                }
                openModal('conclude-modal');
                return;
            }

            var saveButton = event.target.closest('[data-action="save-closure-progress"]');
            if (saveButton) {
                showToast('Rascunho salvo', 'O progresso da documentação de encerramento foi salvo com sucesso.', 'success');
            }
        });

        document.addEventListener('input', function (event) {
            if (event.target.id === 'closure-final-note') {
                finalNote = event.target.value;
            }
        });

        var returnCancelButton = document.getElementById('return-cancel');
        var returnConfirmButton = document.getElementById('return-confirm');
        var discontinueCancelButton = document.getElementById('discontinue-cancel');
        var discontinueConfirmButton = document.getElementById('discontinue-confirm');
        var concludeCancelButton = document.getElementById('conclude-cancel');
        var concludeConfirmButton = document.getElementById('conclude-confirm');

        if (returnCancelButton) {
            returnCancelButton.addEventListener('click', function () {
                closeModal('return-modal');
            });
        }

        if (returnConfirmButton) {
            returnConfirmButton.addEventListener('click', function () {
                var returnReasonField = document.getElementById('return-reason');
                var returnReason = returnReasonField ? returnReasonField.value.trim() : '';
                if (!returnReason) {
                    showToast('Informe o motivo', 'Descreva o motivo do novo planejamento antes de confirmar o retorno.', 'error');
                    return;
                }
                closeModal('return-modal');
                if (returnReasonField) returnReasonField.value = '';
                showToast('Retorno solicitado', 'O encerramento foi direcionado para novo planejamento do GO Live.', 'info');
            });
        }

        if (discontinueCancelButton) {
            discontinueCancelButton.addEventListener('click', function () {
                closeModal('discontinue-modal');
            });
        }

        if (discontinueConfirmButton) {
            discontinueConfirmButton.addEventListener('click', function () {
                var discontinueCategoryField = document.getElementById('discontinue-category');
                var discontinueReasonField = document.getElementById('discontinue-reason');
                var discontinueCategory = discontinueCategoryField ? discontinueCategoryField.value.trim() : '';
                var discontinueReason = discontinueReasonField ? discontinueReasonField.value.trim() : '';
                if (!discontinueCategory) {
                    showToast('Informe a categoria', 'Selecione a categoria da não continuidade antes de confirmar esta ação.', 'error');
                    return;
                }
                if (!discontinueReason) {
                    showToast('Informe o motivo', 'Descreva o motivo da não continuidade antes de confirmar esta ação.', 'error');
                    return;
                }
                closeModal('discontinue-modal');
                if (discontinueCategoryField) discontinueCategoryField.value = '';
                if (discontinueReasonField) discontinueReasonField.value = '';
                showToast('Não continuidade registrada', 'A não continuidade do encerramento do projeto foi registrada com sucesso.', 'info');
            });
        }

        if (concludeCancelButton) {
            concludeCancelButton.addEventListener('click', function () {
                closeModal('conclude-modal');
            });
        }

        if (concludeConfirmButton) {
            concludeConfirmButton.addEventListener('click', function () {
                closeModal('conclude-modal');
                showToast('Projeto encerrado', 'A documentação final foi registrada e o projeto foi encerrado com sucesso.', 'success');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var finalNoteField = document.getElementById('closure-final-note');
        if (finalNoteField) {
            finalNote = finalNoteField.value || '';
        }
        renderClosureDocumentsPanel();
        renderProjectPlanningPanel();
        updateTabs();
        bindEvents();
        refreshTabsArrows();
    });
})();
