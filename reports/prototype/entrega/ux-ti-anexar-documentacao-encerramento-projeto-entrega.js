(function () {
    var finalNote = '';
    var currentTab = 'overview';
    var pendingPlanningStatusChange = null;

    var goLivePlanningData = [
        {
            title: 'Planejamento do Go Live',
            responsible: 'PMO Corporativo',
            executionDate: '22/03/2026',
            stage: 'pre-go-live',
            planningStatus: 'realizado',
            isEditingStatus: false,
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
            stage: 'durante-go-live',
            planningStatus: 'realizado',
            isEditingStatus: false,
            description: 'Monitorar a liberação, apoiar a estabilização inicial do ambiente e acionar rapidamente o fluxo de contingência em caso de desvio operacional.',
            dependencies: [
                'Equipe de plantão alocada',
                'Monitoramento ativo em produção',
                'Plano de rollback revisado'
            ]
        },
        {
            title: 'Estabilização e acompanhamento pós-produção',
            responsible: 'Mariana Ferraz',
            executionDate: '23/03/2026',
            stage: 'pos-go-live',
            planningStatus: 'planejado',
            isEditingStatus: false,
            description: 'Conduzir o acompanhamento assistido após a entrada em produção, consolidar pendências residuais e validar a estabilização do ambiente com as áreas de suporte.',
            dependencies: [
                'Operação assistida iniciada',
                'Incidentes críticos equalizados',
                'Área de negócio acompanhando a estabilização'
            ]
        },
        {
            title: 'Checklist final de prontidão do Go Live',
            responsible: 'Carlos Silva',
            executionDate: '21/03/2026',
            stage: 'pre-go-live',
            planningStatus: 'realizado',
            isEditingStatus: false,
            description: 'Validar a prontidão final antes da janela produtiva, consolidando acessos, comunicação e checklist operacional das equipes envolvidas.',
            dependencies: [
                'Checklist técnico aprovado',
                'Plano de comunicação revisado',
                'Equipes-chave confirmadas para a janela'
            ]
        },
        {
            title: 'Alinhamento executivo de contingência',
            responsible: 'Ana Costa',
            executionDate: '21/03/2026',
            stage: 'pre-go-live',
            planningStatus: 'nao_realizado',
            isEditingStatus: false,
            description: 'Executar o alinhamento final com liderança e áreas de negócio para validar a estratégia de contingência antes da janela produtiva.',
            dependencies: [
                'Diretoria disponível para alinhamento',
                'Fluxo de contingência revisado',
                'Plano de escalonamento aprovado'
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
            notes: 'Treinamento realizado com usuários-chave, equipe de suporte e multiplicadores do negócio.',
            attachments: [
                { name: 'Lista_Presenca_Treinamento.pdf', meta: '1.1 MB' },
                { name: 'Material_Apoio_Usuarios.xlsx', meta: '860 KB' }
            ]
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
            notes: 'Treinamento complementar realizado com a equipe de suporte e operação para reforçar o fluxo de atendimento durante o Go Live.',
            attachments: [
                { name: 'Roteiro_Suporte_GoLive.pdf', meta: '540 KB' }
            ]
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

    function getTrainingStatusBadge(item) {
        if (item.confirmed) {
            return '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check text-green-600"></i><span>Realizado</span></span>';
        }
        return '<span class="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700"><i class="fa-solid fa-clock text-yellow-600"></i><span>Pendente</span></span>';
    }

    function getPlanningStageMeta(stage) {
        var map = {
            'pre-go-live': {
                label: 'Pré-Go Live',
                badge: 'background-color: #1d4ed8; border-color: #1d4ed8;',
                icon: 'fa-solid fa-flag-checkered text-blue-100'
            },
            'durante-go-live': {
                label: 'Durante o Go Live',
                badge: 'background-color: #ea580c; border-color: #ea580c;',
                icon: 'fa-solid fa-bolt text-orange-100'
            },
            'pos-go-live': {
                label: 'Pós-Go Live',
                badge: 'background-color: #7c3aed; border-color: #7c3aed;',
                icon: 'fa-solid fa-chart-line text-violet-100'
            }
        };
        return map[stage] || map['pre-go-live'];
    }

    function getPlanningStatusBadge(status) {
        if (status === 'realizado') {
            return '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check text-green-600"></i><span>Planejamento Realizado</span></span>';
        }
        if (status === 'nao_realizado') {
            return '<span class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"><i class="fa-solid fa-ban text-red-600"></i><span>Planejamento Não Realizado</span></span>';
        }
        return '<span class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><i class="fa-solid fa-calendar-check text-blue-600"></i><span>Planejado</span></span>';
    }

    function createAttachmentItemHTML(attachment) {
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

    function renderGoLiveCards() {
        var container = document.getElementById('closure-go-live-planning-list');
        if (!container) return;

        var planningHtml = goLivePlanningData.map(function (item, planningIndex) {
            var stageMeta = getPlanningStageMeta(item.stage);
            var planningStatusBadge = getPlanningStatusBadge(item.planningStatus);
            var isPreGoLive = item.stage === 'pre-go-live';
            var isDuringGoLive = item.stage === 'durante-go-live';
            var isPostGoLive = item.stage === 'pos-go-live';
            var canEditResolvedStatus = false;
            var canShowStatusFlag = (isPreGoLive && item.planningStatus === 'planejado') ||
                (isDuringGoLive && (item.planningStatus === 'planejado' || item.isEditingStatus)) ||
                (isPostGoLive && item.planningStatus === 'planejado');
            var statusFlag = '';

            if (isPreGoLive && item.planningStatus === 'planejado') {
                statusFlag = '' +
                    '<div class="inline-flex items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 shadow-sm">' +
                        '<button type="button" data-action="set-planning-status" data-status="realizado" data-planning-index="' + planningIndex + '" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ' + (item.planningStatus === 'realizado' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50 hover:text-green-700') + '">' +
                            '<i class="fa-solid fa-circle-check"></i><span>Realizado</span>' +
                        '</button>' +
                        '<button type="button" data-action="set-planning-status" data-status="nao_realizado" data-planning-index="' + planningIndex + '" class="inline-flex items-center gap-1.5 border-l border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors ' + (item.planningStatus === 'nao_realizado' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-red-50 hover:text-red-700') + '">' +
                            '<i class="fa-solid fa-ban"></i><span>Não Realizado</span>' +
                        '</button>' +
                    '</div>';
            } else if (isDuringGoLive && (item.planningStatus === 'planejado' || item.isEditingStatus)) {
                statusFlag = '' +
                    '<div class="inline-flex items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 shadow-sm">' +
                        '<button type="button" data-action="set-planning-status" data-status="realizado" data-planning-index="' + planningIndex + '" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ' + (item.planningStatus === 'realizado' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50 hover:text-green-700') + '">' +
                            '<i class="fa-solid fa-circle-check"></i><span>Realizado</span>' +
                        '</button>' +
                    '</div>';
            } else if (isPostGoLive && item.planningStatus === 'planejado') {
                statusFlag = '' +
                    '<div class="inline-flex items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 shadow-sm">' +
                        '<button type="button" data-action="set-planning-status" data-status="realizado" data-planning-index="' + planningIndex + '" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ' + (item.planningStatus === 'realizado' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50 hover:text-green-700') + '">' +
                            '<i class="fa-solid fa-circle-check"></i><span>Realizado</span>' +
                        '</button>' +
                        '<button type="button" data-action="set-planning-status" data-status="nao_realizado" data-planning-index="' + planningIndex + '" class="inline-flex items-center gap-1.5 border-l border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors ' + (item.planningStatus === 'nao_realizado' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-red-50 hover:text-red-700') + '">' +
                            '<i class="fa-solid fa-ban"></i><span>Não Realizado</span>' +
                        '</button>' +
                    '</div>';
            }

            var editStatusButton = canEditResolvedStatus
                ? '<button type="button" data-action="edit-planning-status" data-planning-index="' + planningIndex + '" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700" title="Editar status do planejamento" aria-label="Editar status do planejamento"><i class="fa-solid fa-pen text-sm"></i></button>'
                : '';

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
                        '<div class="flex items-center gap-2">' +
                            planningStatusBadge +
                            editStatusButton +
                        '</div>' +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap items-center gap-2 text-[13px]">' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Planejado: ' + escapeHtml(item.executionDate) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="' + stageMeta.badge + '"><i class="' + stageMeta.icon + ' mr-1"></i>' + escapeHtml(stageMeta.label) + '</span>' +
                        (canShowStatusFlag ? '<span class="ml-auto">' + statusFlag + '</span>' : '') +
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
            var statusMessage = item.confirmed
                ? '<div class="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"><span class="font-semibold text-bevap-navy">Data realizada:</span> ' + escapeHtml(formatDateTimeDisplay(item.confirmedDate)) + '</div>'
                : '<div class="rounded-lg border border-dashed border-amber-300 bg-white px-4 py-3 text-sm text-amber-800"><span class="font-semibold">Aguardando realização:</span> este treinamento ainda está pendente de confirmação.</div>';

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
                        getTrainingStatusBadge(item) +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap gap-2 text-[13px]">' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Planejado: ' + escapeHtml(item.plannedDate) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>' + escapeHtml(item.plannedHours) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #7c3aed; border-color: #7c3aed;"><i class="fa-solid fa-users mr-1 text-violet-100"></i>' + (item.participants || []).length + ' participantes</span>' +
                    '</div>' +
                    '<div class="mt-4">' +
                        statusMessage +
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
                    '<div class="mt-4">' +
                        '<label class="mb-3 block text-sm text-gray-600">Documentos do Treinamento</label>' +
                        '<div class="space-y-3">' +
                            (item.attachments || []).map(function (attachment) {
                                return createAttachmentItemHTML(attachment);
                            }).join('') +
                        '</div>' +
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
        var overviewContent = document.getElementById('tab-content-closure-overview');
        var requesterValidationContent = document.getElementById('tab-content-requester-validation');
        var finalValidationContent = document.getElementById('tab-content-ti-final-validation');
        var validationContent = document.getElementById('tab-content-ti-go-live-validation');
        if (!overviewTab || !requesterValidationTab || !finalValidationTab || !validationTab || !overviewContent || !requesterValidationContent || !finalValidationContent || !validationContent) return;

        var isOverview = currentTab === 'overview';
        var isRequesterValidation = currentTab === 'requester-validation';
        var isFinalValidation = currentTab === 'final-validation';
        var isValidation = currentTab === 'validation';

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

        overviewContent.classList.toggle('hidden', !isOverview);
        requesterValidationContent.classList.toggle('hidden', !isRequesterValidation);
        finalValidationContent.classList.toggle('hidden', !isFinalValidation);
        validationContent.classList.toggle('hidden', !isValidation);

        var activeTab = isOverview
            ? overviewTab
            : isRequesterValidation
                ? requesterValidationTab
                : isFinalValidation
                    ? finalValidationTab
                    : validationTab;

        scrollTabIntoView(activeTab);
        window.setTimeout(refreshTabsArrows, 200);
    }

    function setCurrentTab(tabName) {
        currentTab = tabName === 'requester-validation' || tabName === 'final-validation' || tabName === 'validation'
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

    function openPlanningStatusModal(planningIndex, status) {
        var modal = document.getElementById('planning-status-modal');
        var title = document.getElementById('planning-status-modal-title');
        var message = document.getElementById('planning-status-modal-message');
        var confirm = document.getElementById('planning-status-confirm');
        if (!modal || !title || !message || !confirm || !goLivePlanningData[planningIndex]) return;

        var item = goLivePlanningData[planningIndex];
        var isRealized = status === 'realizado';
        pendingPlanningStatusChange = { planningIndex: planningIndex, status: status };
        title.textContent = isRealized ? 'Confirmar Planejamento Realizado' : 'Confirmar Planejamento Não Realizado';
        message.textContent = 'Deseja atualizar "' + item.title + '" para o status ' + (isRealized ? 'Realizado' : 'Não Realizado') + '?';
        confirm.className = 'rounded-lg px-6 py-2 font-medium text-white transition-colors ' + (isRealized ? 'bg-bevap-green hover:bg-green-700' : 'bg-red-600 hover:bg-red-700');
        openModal('planning-status-modal');
    }

    function closePlanningStatusModal() {
        closeModal('planning-status-modal');
        pendingPlanningStatusChange = null;
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
            var editPlanningStatusButton = event.target.closest('[data-action="edit-planning-status"]');
            if (editPlanningStatusButton) {
                var editPlanningIndex = Number(editPlanningStatusButton.getAttribute('data-planning-index'));
                if (Number.isNaN(editPlanningIndex) || !goLivePlanningData[editPlanningIndex]) return;
                goLivePlanningData[editPlanningIndex].isEditingStatus = true;
                renderGoLiveCards();
                return;
            }

            var planningStatusButton = event.target.closest('[data-action="set-planning-status"]');
            if (planningStatusButton) {
                var clickedPlanningIndex = Number(planningStatusButton.getAttribute('data-planning-index'));
                var clickedStatus = planningStatusButton.getAttribute('data-status');
                if (Number.isNaN(clickedPlanningIndex) || !goLivePlanningData[clickedPlanningIndex]) return;
                openPlanningStatusModal(clickedPlanningIndex, clickedStatus || 'planejado');
                return;
            }

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
        var planningStatusCancelButton = document.getElementById('planning-status-cancel');
        var planningStatusConfirmButton = document.getElementById('planning-status-confirm');

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

        if (planningStatusCancelButton) planningStatusCancelButton.addEventListener('click', closePlanningStatusModal);
        if (planningStatusConfirmButton) {
            planningStatusConfirmButton.addEventListener('click', function () {
                if (!pendingPlanningStatusChange || !goLivePlanningData[pendingPlanningStatusChange.planningIndex]) {
                    closePlanningStatusModal();
                    return;
                }
                var planning = goLivePlanningData[pendingPlanningStatusChange.planningIndex];
                var selectedStatus = pendingPlanningStatusChange.status;
                planning.planningStatus = selectedStatus;
                planning.isEditingStatus = false;
                closePlanningStatusModal();
                renderGoLiveCards();
                showToast(
                    selectedStatus === 'realizado' ? 'Planejamento realizado' : 'Planejamento não realizado',
                    'O status do planejamento foi atualizado com sucesso.',
                    selectedStatus === 'realizado' ? 'success' : 'info'
                );
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var finalNoteField = document.getElementById('closure-final-note');
        if (finalNoteField) {
            finalNote = finalNoteField.value || '';
        }
        renderClosureDocumentsPanel();
        renderGoLiveCards();
        updateTabs();
        bindEvents();
        refreshTabsArrows();
    });
})();
