(function () {
    var pendingDeleteAction = null;

    var trainingsData = [
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
            status: 'realizado',
            selectedOutcome: 'realizado',
            confirmedDate: '2026-03-19T09:00',
            notes: 'Treinamento realizado com usuários-chave, equipe de suporte e multiplicadores do negócio.',
            justification: '',
            isEditing: false,
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
            status: '',
            selectedOutcome: '',
            confirmedDate: '',
            notes: 'Treinamento reagendado para alinhar dúvidas da operação após a validação final do ambiente.',
            justification: '',
            isEditing: false,
            attachments: [
                { name: 'Roteiro_Suporte_GoLive.pdf', meta: '540 KB' }
            ]
        },
        {
            title: 'Treinamento complementar para operação assistida',
            responsible: 'Marina Lopes',
            plannedDate: '22/03/2026',
            plannedHours: '2h',
            participants: [
                'Amanda Silva',
                'Caio Mendes',
                'Larissa Prado',
                'Renato Nogueira',
                'Sofia Almeida',
                'Tatiane Barreto'
            ],
            status: 'nao_realizado',
            selectedOutcome: 'nao_realizado',
            confirmedDate: '',
            notes: 'A turma foi reagendada porque a janela da operação assistida foi absorvida pelo suporte em campo.',
            justification: 'Treinamento não realizado devido à indisponibilidade dos usuários-chave durante a janela prevista.',
            isEditing: false,
            attachments: [
                { name: 'Comunicado_Reagendamento_Treinamento.pdf', meta: '420 KB' }
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

        window.clearTimeout(window.__trainingToastTimeout);
        window.__trainingToastTimeout = window.setTimeout(function () {
            toast.classList.add('hidden');
        }, 3200);
    }

    function formatAttachmentMeta(file) {
        var sizeInKb = Math.max(1, Math.round(file.size / 1024));
        if (sizeInKb >= 1024) {
            return (Math.round((sizeInKb / 1024) * 10) / 10) + ' MB';
        }
        return sizeInKb + ' KB';
    }

    function getTrainingStatus(training) {
        return training && training.status ? training.status : '';
    }

    function getStatusBadge(status) {
        if (status === 'realizado') {
            return '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check text-green-600"></i><span>Realizado</span></span>';
        }
        if (status === 'nao_realizado') {
            return '<span class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"><i class="fa-solid fa-ban text-red-600"></i><span>Não Realizado</span></span>';
        }
        return '<span class="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700"><i class="fa-solid fa-clock text-yellow-600"></i><span>Pendente</span></span>';
    }

    function formatDateTimeDisplay(value) {
        if (!value) return 'Nao informado';

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

    function getCurrentDateTimeLocal() {
        var now = new Date();
        var pad = function (value) {
            return String(value).padStart(2, '0');
        };
        return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    }

    function createParticipantsHTML(training) {
        return (training.participants || []).map(function (participant) {
            return '<span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">' + escapeHtml(participant) + '</span>';
        }).join('');
    }

    function createAttachmentItemHTML(attachment, trainingIndex, attachmentIndex) {
        return '' +
            '<div class="training-attachment-item flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3" data-training-index="' + trainingIndex + '" data-attachment-index="' + attachmentIndex + '">' +
                '<div class="flex items-center gap-3">' +
                    '<i class="fa-solid fa-file-lines text-blue-500"></i>' +
                    '<div>' +
                        '<div class="text-sm font-medium text-gray-900">' + escapeHtml(attachment.name) + '</div>' +
                        '<div class="text-xs text-gray-500">' + escapeHtml(attachment.meta) + '</div>' +
                    '</div>' +
                '</div>' +
                '<button type="button" data-action="remove-training-attachment" class="text-gray-400 transition-colors hover:text-red-500">' +
                    '<i class="fa-solid fa-trash"></i>' +
                '</button>' +
            '</div>';
    }

    function renderTrainingCards() {
        var container = document.getElementById('training-confirmation-list');
        if (!container) return;

        container.innerHTML = trainingsData.map(function (training, index) {
            var status = getTrainingStatus(training);
            var selectedOutcome = training.selectedOutcome || status || '';
            var isEditing = !!training.isEditing;
            var editorOutcome = isEditing ? (training.editSelectedOutcome || status) : selectedOutcome;
            var displayStatus = isEditing ? editorOutcome : status;
            var isRealized = status === 'realizado';
            var isNotRealized = status === 'nao_realizado';
            var isResolved = isRealized || isNotRealized;
            var displayIsRealized = displayStatus === 'realizado';
            var displayIsNotRealized = displayStatus === 'nao_realizado';
            var cardClasses = displayIsRealized
                ? 'rounded-xl border border-emerald-200 bg-white p-5 shadow-sm'
                : displayIsNotRealized
                    ? 'rounded-xl border border-red-200 bg-white p-5 shadow-sm'
                    : 'rounded-xl border border-amber-200 bg-white p-5 shadow-sm';
            var highlightClasses = displayIsRealized
                ? 'border border-emerald-200 bg-white'
                : displayIsNotRealized
                    ? 'border border-red-200 bg-white'
                    : 'border border-amber-200 bg-white';
            var panelClasses = displayIsRealized
                ? 'rounded-xl border border-emerald-200 bg-emerald-50 p-4'
                : displayIsNotRealized
                    ? 'rounded-xl border border-red-200 bg-red-50 p-4'
                    : 'rounded-xl border border-amber-200 bg-amber-50 p-4';
            var inputClasses = displayIsRealized
                ? 'w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm'
                : displayIsNotRealized
                    ? 'w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm'
                    : 'w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm';
            var previewConfirmedDate = training.confirmedDate || getCurrentDateTimeLocal();
            var realizedMeta = displayIsRealized
                ? '<span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 md:ml-auto"><i class="fa-solid fa-calendar-check mr-1 text-gray-500"></i>Data Realização: ' + escapeHtml(formatDateTimeDisplay(isEditing ? previewConfirmedDate : training.confirmedDate)) + '</span>'
                : '';
            var resultOptionsBlock = (!isResolved || isEditing) ? '' +
                '<div>' +
                    '<label class="mb-2 block text-sm text-gray-600">Treinamento</label>' +
                    '<div class="flex flex-wrap gap-4">' +
                        '<label class="inline-flex items-center gap-2 text-sm text-gray-700">' +
                            '<input type="radio" name="training-outcome-' + index + '" value="realizado" data-field="' + (isEditing ? 'edit-selected-outcome' : 'selected-outcome') + '" data-training-index="' + index + '" class="h-4 w-4 border-gray-300 text-bevap-green focus:ring-bevap-green"' + (editorOutcome === 'realizado' ? ' checked' : '') + '>' +
                            '<span>Realizado</span>' +
                        '</label>' +
                        '<label class="inline-flex items-center gap-2 text-sm text-gray-700">' +
                            '<input type="radio" name="training-outcome-' + index + '" value="nao_realizado" data-field="' + (isEditing ? 'edit-selected-outcome' : 'selected-outcome') + '" data-training-index="' + index + '" class="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"' + (editorOutcome === 'nao_realizado' ? ' checked' : '') + '>' +
                            '<span>Não Realizado</span>' +
                        '</label>' +
                    '</div>' +
                '</div>' : '';
            var actionSection = !isResolved && selectedOutcome === 'realizado'
                ? '<div>' +
                    '<div>' +
                        '<label class="mb-1 block text-sm text-gray-600">Data da Realização</label>' +
                        '<input type="datetime-local" value="' + escapeHtml(training.confirmedDate) + '" data-field="confirmed-date" data-training-index="' + index + '" class="' + inputClasses + '">' +
                    '</div>' +
                    '<div class="mt-4 flex items-end">' +
                        '<button type="button" data-action="mark-training-realized" data-training-index="' + index + '" class="w-full rounded-lg bg-bevap-green px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700">' +
                            '<i class="fa-solid fa-check mr-2"></i>' + (isRealized ? 'Treinamento Realizado' : 'Confirmar Realização') +
                        '</button>' +
                    '</div>' +
                '</div>'
                : '';
            if (!isResolved && selectedOutcome === 'nao_realizado') {
                actionSection = '<div>' +
                    '<div>' +
                        '<label class="mb-1 block text-sm text-gray-600">Justificativa</label>' +
                        '<textarea data-field="justification" data-training-index="' + index + '" class="' + inputClasses + '" rows="3" placeholder="Descreva por que o treinamento não foi realizado.">' + escapeHtml(training.justification || '') + '</textarea>' +
                    '</div>' +
                    '<div class="mt-4 flex items-end">' +
                        '<button type="button" data-action="mark-training-not-realized" data-training-index="' + index + '" class="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700">' +
                            '<i class="fa-solid fa-ban mr-2"></i>' + (isNotRealized ? 'Treinamento Não Realizado' : 'Marcar como Não Realizado') +
                        '</button>' +
                    '</div>' +
                '</div>';
            }
            if (isNotRealized && !isEditing) {
                actionSection = '<div>' +
                    '<label class="mb-1 block text-sm text-gray-600">Justificativa</label>' +
                    '<textarea class="' + inputClasses + '" rows="3" readonly>' + escapeHtml(training.justification || '') + '</textarea>' +
                '</div>';
            }
            var notesField = isEditing
                ? '<textarea data-field="edit-notes" data-training-index="' + index + '" class="' + inputClasses + '" rows="3" placeholder="Registre como o treinamento ocorreu, principais pontos e observações.">' + escapeHtml(training.editNotes || '') + '</textarea>'
                : isResolved
                ? '<textarea data-field="notes" data-training-index="' + index + '" class="' + inputClasses + '" rows="3" readonly>' + escapeHtml(training.notes) + '</textarea>'
                : '<textarea data-field="notes" data-training-index="' + index + '" class="' + inputClasses + '" rows="3" placeholder="Registre como o treinamento ocorreu, principais pontos e observações.">' + escapeHtml(training.notes) + '</textarea>';
            var editActions = isResolved && !isEditing
                ? ''
                : isEditing
                    ? '<div class="flex flex-wrap justify-end gap-3"><button type="button" data-action="cancel-edit-training" data-training-index="' + index + '" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancelar</button><button type="button" data-action="save-edit-training" data-training-index="' + index + '" class="rounded-lg bg-bevap-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"><i class="fa-solid fa-floppy-disk mr-2"></i>Salvar Edição</button></div>'
                    : '';
            var headerActions = isResolved && !isEditing
                ? '<button type="button" data-action="edit-training" data-training-index="' + index + '" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700" title="Editar treinamento" aria-label="Editar treinamento"><i class="fa-solid fa-pen text-sm"></i></button>'
                : '';

            return '' +
                '<div class="' + cardClasses + '">' +
                    '<div class="flex items-start justify-between gap-4">' +
                        '<div class="min-w-0 flex-1">' +
                            '<div class="flex items-center gap-3">' +
                                '<span class="inline-flex h-10 w-10 items-center justify-center rounded-xl ' + (displayIsRealized ? 'bg-emerald-100 text-emerald-700' : displayIsNotRealized ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700') + '">' +
                                    '<i class="fa-solid fa-chalkboard-user text-base"></i>' +
                                '</span>' +
                                '<div class="min-w-0 flex-1">' +
                                    '<h3 class="text-base font-montserrat font-semibold text-bevap-navy">' + escapeHtml(training.title) + '</h3>' +
                                    '<p class="mt-1 text-sm text-gray-500">Responsável: ' + escapeHtml(training.responsible) + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center gap-2">' +
                            getStatusBadge(displayStatus) +
                            headerActions +
                        '</div>' +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap items-center gap-2 text-[13px]">' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Planejado: ' + escapeHtml(training.plannedDate) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>' + escapeHtml(training.plannedHours) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #7c3aed; border-color: #7c3aed;"><i class="fa-solid fa-users mr-1 text-violet-100"></i>' + (training.participants || []).length + ' participantes</span>' +
                        realizedMeta +
                    '</div>' +
                    '<div class="mt-4 space-y-4">' +
                        '<div class="' + panelClasses + '">' +
                            '<div class="mb-3">' +
                                '<label class="text-sm font-medium text-bevap-navy">Participantes</label>' +
                            '</div>' +
                            '<div class="flex flex-wrap gap-2">' +
                                createParticipantsHTML(training) +
                            '</div>' +
                        '</div>' +
                        '<div class="' + highlightClasses + ' rounded-xl p-4 space-y-4">' +
                            resultOptionsBlock +
                            actionSection +
                            '<div>' +
                                '<label class="mb-1 block text-sm text-gray-600">Observações</label>' +
                                notesField +
                            '</div>' +
                            editActions +
                            '<div>' +
                                '<label class="mb-3 block text-sm text-gray-600">Anexar Documentos do Treinamento</label>' +
                                '<div class="training-attachments-field" data-training-index="' + index + '">' +
                                    '<input type="file" multiple class="training-attachments-input hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg">' +
                                    '<div class="training-attachments-dropzone cursor-pointer rounded-lg border-2 border-dashed ' + (displayIsRealized ? 'border-emerald-300 bg-white' : displayIsNotRealized ? 'border-red-300 bg-white' : 'border-amber-300 bg-white') + ' p-6 text-center transition-colors hover:border-bevap-green">' +
                                        '<i class="fa-solid fa-cloud-arrow-up mb-2 text-2xl ' + (displayIsRealized ? 'text-emerald-400' : displayIsNotRealized ? 'text-red-400' : 'text-amber-400') + '"></i>' +
                                        '<p class="text-sm text-gray-600">Arraste arquivos ou clique para selecionar</p>' +
                                        '<p class="mt-1 text-xs text-gray-500">PDF, DOC, XLS, PPT (máx. 10MB)</p>' +
                                    '</div>' +
                                    '<div class="mt-3 space-y-3">' +
                                        training.attachments.map(function (attachment, attachmentIndex) {
                                            return createAttachmentItemHTML(attachment, index, attachmentIndex);
                                        }).join('') +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }).join('');

        refreshSummary();
    }

    function refreshSummary() {
        var total = trainingsData.length;
        var confirmed = trainingsData.filter(function (training) { return getTrainingStatus(training) === 'realizado'; }).length;
        var percent = total ? Math.round((confirmed / total) * 100) : 0;

        var totalElement = document.getElementById('summary-training-count');
        var confirmedElement = document.getElementById('summary-confirmed-count');
        var progressText = document.getElementById('training-progress-text');
        var progressBar = document.getElementById('training-progress-bar');

        if (totalElement) totalElement.textContent = total + ' planejados';
        if (confirmedElement) confirmedElement.textContent = confirmed + ' realizados';
        if (progressText) progressText.textContent = percent + '%';
        if (progressBar) progressBar.style.width = percent + '%';
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

    function hasPendingTrainings() {
        return trainingsData.some(function (training) {
            return !getTrainingStatus(training);
        });
    }

    function configureNextActivityModal(title, primaryMessage, secondaryMessage) {
        var modal = document.getElementById('next-activity-modal');
        if (!modal) return;

        var modalTitle = modal.querySelector('h3');
        var paragraphs = modal.querySelectorAll('p');

        if (modalTitle) modalTitle.textContent = title;
        if (paragraphs[0]) paragraphs[0].innerHTML = primaryMessage;
        if (paragraphs[1]) paragraphs[1].textContent = secondaryMessage;
    }

    function bindEvents() {
        document.addEventListener('click', function (event) {
            var dropzone = event.target.closest('.training-attachments-dropzone');
            if (dropzone) {
                var field = dropzone.closest('.training-attachments-field');
                var input = field ? field.querySelector('.training-attachments-input') : null;
                if (input) input.click();
                return;
            }

            var removeAttachmentButton = event.target.closest('[data-action="remove-training-attachment"]');
            if (removeAttachmentButton) {
                var attachmentItem = removeAttachmentButton.closest('.training-attachment-item');
                if (!attachmentItem) return;
                var trainingIndex = Number(attachmentItem.getAttribute('data-training-index'));
                var attachmentIndex = Number(attachmentItem.getAttribute('data-attachment-index'));
                openDeleteConfirmation('Deseja excluir este anexo do treinamento?', function () {
                    trainingsData[trainingIndex].attachments.splice(attachmentIndex, 1);
                    renderTrainingCards();
                });
                return;
            }

            var markRealizedButton = event.target.closest('[data-action="mark-training-realized"]');
            if (markRealizedButton) {
                var realizedIndex = Number(markRealizedButton.getAttribute('data-training-index'));
                if (!trainingsData[realizedIndex].confirmedDate) {
                    showToast('Informe data e hora', 'Selecione a data e a hora da realização antes de confirmar o treinamento.', 'error');
                    return;
                }
                trainingsData[realizedIndex].status = 'realizado';
                trainingsData[realizedIndex].selectedOutcome = 'realizado';
                renderTrainingCards();
                showToast('Treinamento realizado', 'O treinamento foi marcado como realizado com sucesso.', 'success');
                return;
            }

            var markNotRealizedButton = event.target.closest('[data-action="mark-training-not-realized"]');
            if (markNotRealizedButton) {
                var notRealizedIndex = Number(markNotRealizedButton.getAttribute('data-training-index'));
                if (!String(trainingsData[notRealizedIndex].justification || '').trim()) {
                    showToast('Informe a justificativa', 'Descreva o motivo antes de marcar o treinamento como não realizado.', 'error');
                    return;
                }
                trainingsData[notRealizedIndex].status = 'nao_realizado';
                trainingsData[notRealizedIndex].selectedOutcome = 'nao_realizado';
                trainingsData[notRealizedIndex].confirmedDate = '';
                renderTrainingCards();
                showToast('Treinamento não realizado', 'O treinamento foi marcado como não realizado.', 'info');
                return;
            }

            var editTrainingButton = event.target.closest('[data-action="edit-training"]');
            if (editTrainingButton) {
                var editIndex = Number(editTrainingButton.getAttribute('data-training-index'));
                trainingsData[editIndex].isEditing = true;
                trainingsData[editIndex].editSelectedOutcome = trainingsData[editIndex].status;
                trainingsData[editIndex].editNotes = trainingsData[editIndex].notes;
                renderTrainingCards();
                return;
            }

            var cancelEditTrainingButton = event.target.closest('[data-action="cancel-edit-training"]');
            if (cancelEditTrainingButton) {
                var cancelEditIndex = Number(cancelEditTrainingButton.getAttribute('data-training-index'));
                trainingsData[cancelEditIndex].isEditing = false;
                delete trainingsData[cancelEditIndex].editSelectedOutcome;
                delete trainingsData[cancelEditIndex].editNotes;
                renderTrainingCards();
                return;
            }

            var saveEditTrainingButton = event.target.closest('[data-action="save-edit-training"]');
            if (saveEditTrainingButton) {
                var saveEditIndex = Number(saveEditTrainingButton.getAttribute('data-training-index'));
                var editTraining = trainingsData[saveEditIndex];
                if (!editTraining.editSelectedOutcome) {
                    showToast('Selecione o status', 'Defina se o treinamento ficou realizado ou não realizado antes de salvar.', 'error');
                    return;
                }
                editTraining.status = editTraining.editSelectedOutcome;
                editTraining.selectedOutcome = editTraining.editSelectedOutcome;
                editTraining.notes = editTraining.editNotes || '';
                if (editTraining.status === 'realizado' && !editTraining.confirmedDate) {
                    editTraining.confirmedDate = getCurrentDateTimeLocal();
                }
                if (editTraining.status === 'nao_realizado') {
                    editTraining.confirmedDate = '';
                }
                editTraining.isEditing = false;
                delete editTraining.editSelectedOutcome;
                delete editTraining.editNotes;
                renderTrainingCards();
                showToast('Treinamento atualizado', 'As informações do treinamento foram atualizadas com sucesso.', 'success');
                return;
            }

            var returnPlanningButton = event.target.closest('[data-action="return-planning"]');
            if (returnPlanningButton) {
                openModal('return-modal');
                return;
            }

            var nextActivityButton = event.target.closest('[data-action="go-next-activity"]');
            if (nextActivityButton) {
                if (hasPendingTrainings()) {
                    showToast('Treinamentos pendentes', 'Defina todos os treinamentos como realizado ou não realizado antes de seguir.', 'info');
                    return;
                }
                openModal('next-activity-modal');
                configureNextActivityModal(
                    'Concluir Treinamentos',
                    'Você está confirmando a conclusão dos treinamentos dos usuários do projeto <strong>PRJ-2026-014 • Implantar SSO corporativo</strong>.',
                    'Ao confirmar, esta etapa será concluída e o fluxo seguirá para a próxima atividade operacional.'
                );
                return;
            }

            var saveButton = event.target.closest('[data-action="save-training-progress"]');
            if (saveButton) {
                showToast('Rascunho salvo', 'O progresso dos treinamentos foi salvo com sucesso.', 'success');
            }
        });

        document.addEventListener('input', function (event) {
            var field = event.target.getAttribute('data-field');
            var trainingIndex = Number(event.target.getAttribute('data-training-index'));
            if (Number.isNaN(trainingIndex)) return;

            if (field === 'confirmed-date') {
                trainingsData[trainingIndex].confirmedDate = event.target.value.trim();
            }
            if (field === 'selected-outcome') {
                trainingsData[trainingIndex].selectedOutcome = event.target.value;
                if (!event.target.value) {
                    trainingsData[trainingIndex].status = '';
                }
                renderTrainingCards();
                return;
            }
            if (field === 'edit-selected-outcome') {
                trainingsData[trainingIndex].editSelectedOutcome = event.target.value;
                renderTrainingCards();
                return;
            }
            if (field === 'justification') {
                trainingsData[trainingIndex].justification = event.target.value;
            }
            if (field === 'notes') {
                trainingsData[trainingIndex].notes = event.target.value;
            }
            if (field === 'edit-notes') {
                trainingsData[trainingIndex].editNotes = event.target.value;
            }
        });

        document.addEventListener('change', function (event) {
            if (event.target.matches('.training-attachments-input')) {
                var field = event.target.closest('.training-attachments-field');
                var trainingIndex = field ? Number(field.getAttribute('data-training-index')) : NaN;
                if (Number.isNaN(trainingIndex)) return;
                Array.prototype.slice.call(event.target.files || []).forEach(function (file) {
                    trainingsData[trainingIndex].attachments.push({
                        name: file.name,
                        meta: formatAttachmentMeta(file)
                    });
                });
                event.target.value = '';
                renderTrainingCards();
            }
        });

        var deleteCancelButton = document.getElementById('delete-confirmation-cancel');
        var deleteConfirmButton = document.getElementById('delete-confirmation-confirm');
        var returnCancelButton = document.getElementById('return-cancel');
        var returnConfirmButton = document.getElementById('return-confirm');
        var nextCancelButton = document.getElementById('next-activity-cancel');
        var nextConfirmButton = document.getElementById('next-activity-confirm');

        if (deleteCancelButton) deleteCancelButton.addEventListener('click', closeDeleteConfirmation);
        if (deleteConfirmButton) deleteConfirmButton.addEventListener('click', confirmDeleteAction);
        if (returnCancelButton) returnCancelButton.addEventListener('click', function () {
            closeModal('return-modal');
        });
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
                showToast('Retorno solicitado', 'A entrega foi direcionada para novo planejamento.', 'info');
            });
        }
        if (nextCancelButton) nextCancelButton.addEventListener('click', function () {
            closeModal('next-activity-modal');
        });
        if (nextConfirmButton) {
            nextConfirmButton.addEventListener('click', function () {
                closeModal('next-activity-modal');
                showToast('Treinamentos concluídos', 'A etapa de treinamento dos usuários foi concluída com sucesso.', 'success');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderTrainingCards();
        bindEvents();
    });
})();
