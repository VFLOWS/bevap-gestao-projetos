(function () {
    var finalNote = '';
    var currentTab = 'overview';

    var goLivePlanningData = [
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
            notes: 'Treinamento complementar realizado com a equipe de suporte e operação para reforçar o fluxo de atendimento durante o GO Live.',
            attachments: [
                { name: 'Roteiro_Suporte_GoLive.pdf', meta: '540 KB' }
            ]
        }
    ];

    var goLiveDocumentsData = [
        { name: 'Relatorio_Monitoramento_GoLive.pdf', meta: '940 KB' },
        { name: 'Plano_Rollback_Aprovado.docx', meta: '410 KB' },
        { name: 'Registro_Execucao_GoLive.xlsx', meta: '680 KB' }
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

        toast.className = 'fixed right-4 top-24 z-[70] hidden max-w-sm rounded-lg border-l-4 bg-white px-4 py-3 shadow-xl ' + selected.border;
        icon.className = selected.icon + ' text-xl';
        titleElement.textContent = title;
        messageElement.textContent = message;
        toast.classList.remove('hidden');

        window.clearTimeout(window.__tiGoLiveToastTimeout);
        window.__tiGoLiveToastTimeout = window.setTimeout(function () {
            toast.classList.add('hidden');
        }, 3200);
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

    function getTrainingStatusBadge(item) {
        if (item.confirmed) {
            return '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check text-green-600"></i><span>Realizado</span></span>';
        }
        return '<span class="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700"><i class="fa-solid fa-clock text-yellow-600"></i><span>Pendente</span></span>';
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
        return '' +
            (participants || []).map(function (participant) {
                return '<span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">' + escapeHtml(participant) + '</span>';
            }).join('');
    }

    function updateTabs() {
        var overviewTab = document.getElementById('tab-ti-go-live-overview');
        var validationTab = document.getElementById('tab-ti-go-live-validation');
        var documentsTab = document.getElementById('tab-ti-go-live-documents');
        var overviewContent = document.getElementById('tab-content-ti-go-live-overview');
        var validationContent = document.getElementById('tab-content-ti-go-live-validation');
        var documentsContent = document.getElementById('tab-content-ti-go-live-documents');
        if (!overviewTab || !validationTab || !documentsTab || !overviewContent || !validationContent || !documentsContent) return;

        var isOverview = currentTab === 'overview';
        var isValidation = currentTab === 'validation';
        var isDocuments = currentTab === 'documents';

        overviewTab.className = isOverview
            ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        validationTab.className = isValidation
            ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        documentsTab.className = isDocuments
            ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';

        overviewContent.classList.toggle('hidden', !isOverview);
        validationContent.classList.toggle('hidden', !isValidation);
        documentsContent.classList.toggle('hidden', !isDocuments);
    }

    function setCurrentTab(tabName) {
        currentTab = tabName === 'documents' || tabName === 'validation' ? tabName : 'overview';
        updateTabs();
    }

    function renderGoLiveCards() {
        var container = document.getElementById('ti-go-live-execution-list');
        if (!container) return;

        var planningHtml = goLivePlanningData.map(function (item) {
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
                '</div>';
        }).join('');

        container.innerHTML = planningHtml + trainingHtml;
    }

    function renderDocumentsTab() {
        var container = document.getElementById('ti-go-live-documents-list');
        if (!container) return;

        container.innerHTML = '' +
            '<div class="bg-white p-5">' +
                '<h3 class="mb-4 flex items-center text-base font-montserrat font-semibold text-bevap-navy">' +
                    '<i class="fa-solid fa-paperclip mr-3 text-bevap-gold"></i>Documentos' +
                '</h3>' +
                '<div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-bevap-green">' +
                    '<i class="fa-solid fa-cloud-arrow-up mb-3 text-4xl text-gray-400"></i>' +
                    '<p class="mb-2 text-gray-600">Arraste arquivos ou clique para selecionar</p>' +
                    '<p class="text-sm text-gray-500">PDF, DOC, XLS (máx. 10MB)</p>' +
                '</div>' +
                '<div class="mt-4 space-y-3">' +
                    goLiveDocumentsData.map(function (attachment) {
                        return '<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">' +
                            '<div class="flex items-center gap-3">' +
                                '<i class="fa-solid fa-file-lines text-blue-500"></i>' +
                                '<div>' +
                                    '<div class="text-sm font-medium text-gray-900">' + escapeHtml(attachment.name) + '</div>' +
                                    '<div class="text-xs text-gray-500">' + escapeHtml(attachment.meta) + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' +
            '</div>';
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
        document.addEventListener('click', function (event) {
            var overviewTabButton = event.target.closest('#tab-ti-go-live-overview');
            if (overviewTabButton) {
                setCurrentTab('overview');
                return;
            }

            var documentsTabButton = event.target.closest('#tab-ti-go-live-documents');
            if (documentsTabButton) {
                setCurrentTab('documents');
                return;
            }

            var validationTabButton = event.target.closest('#tab-ti-go-live-validation');
            if (validationTabButton) {
                setCurrentTab('validation');
                return;
            }

            var openDocumentsButton = event.target.closest('[data-action="open-documents-tab"]');
            if (openDocumentsButton) {
                setCurrentTab('documents');
                return;
            }

            var returnPlanningButton = event.target.closest('[data-action="return-planning"]');
            if (returnPlanningButton) {
                openModal('return-modal');
                return;
            }

            var discontinueButton = event.target.closest('[data-action="discontinue-go-live"]');
            if (discontinueButton) {
                openModal('discontinue-modal');
                return;
            }

            var concludeButton = event.target.closest('[data-action="conclude-go-live"]');
            if (concludeButton) {
                var agreementCheckbox = document.getElementById('ti-go-live-agreement-checkbox');
                if (!finalNote.trim()) {
                    showToast('Informe a observação final', 'Registre a observação final da TI antes de concluir o GO Live.', 'error');
                    return;
                }
                if (!agreementCheckbox || !agreementCheckbox.checked) {
                    showToast('Confirmação obrigatória', 'Marque a confirmação da execução técnica do GO Live antes de concluir esta etapa.', 'error');
                    return;
                }
                openModal('conclude-modal');
                return;
            }

            var saveButton = event.target.closest('[data-action="save-go-live-progress"]');
            if (saveButton) {
                showToast('Rascunho salvo', 'O progresso da execução do GO Live foi salvo com sucesso.', 'success');
            }
        });

        document.addEventListener('input', function (event) {
            if (event.target.id === 'ti-go-live-final-note') {
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
                showToast('Retorno solicitado', 'A execução foi direcionada para novo planejamento do GO Live.', 'info');
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
                showToast('Não continuidade registrada', 'A não continuidade do GO Live foi registrada com sucesso.', 'info');
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
                showToast('GO Live concluído', 'A execução técnica do GO Live foi finalizada com sucesso.', 'success');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var finalNoteField = document.getElementById('ti-go-live-final-note');
        if (finalNoteField) {
            finalNote = finalNoteField.value || '';
        }
        renderGoLiveCards();
        renderDocumentsTab();
        updateTabs();
        bindEvents();
    });
})();
