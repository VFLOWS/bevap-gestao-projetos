(function () {
    var pendingDeleteAction = null;
    var pendingTrainingConfirmIndex = null;

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
            confirmed: false,
            confirmedDate: '',
            notes: 'Treinamento reagendado para alinhar dúvidas da operação após a validação final do ambiente.',
            attachments: [
                { name: 'Roteiro_Suporte_GoLive.pdf', meta: '540 KB' }
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

    function getStatusBadge(training) {
        if (training.confirmed) {
            return '<span class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><i class="fa-solid fa-circle-check text-green-600"></i><span>Realizado</span></span>';
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
            var isConfirmed = training.confirmed;
            var cardClasses = isConfirmed
                ? 'rounded-xl border border-emerald-200 bg-white p-5 shadow-sm'
                : 'rounded-xl border border-amber-200 bg-white p-5 shadow-sm';
            var highlightClasses = isConfirmed
                ? 'border border-emerald-200 bg-white'
                : 'border border-amber-200 bg-white';
            var panelClasses = isConfirmed
                ? 'rounded-xl border border-emerald-200 bg-emerald-50 p-4'
                : 'rounded-xl border border-amber-200 bg-amber-50 p-4';
            var inputClasses = isConfirmed
                ? 'w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm'
                : 'w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm';
            var statusMessage = isConfirmed
                ? '<div class="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"><span class="font-semibold text-bevap-navy">Data Realizada:</span> ' + escapeHtml(formatDateTimeDisplay(training.confirmedDate)) + '</div>'
                : '<div class="rounded-lg border border-dashed border-amber-300 bg-white px-4 py-3 text-sm text-amber-800"><span class="font-semibold">Aguardando Realização:</span> defina a data e hora reais para confirmar este treinamento.</div>';
            var actionSection = isConfirmed
                ? ''
                : '<div class="' + highlightClasses + ' rounded-xl p-4">' +
                    '<div>' +
                        '<label class="mb-1 block text-sm text-gray-600">Data da Realização</label>' +
                        '<input type="datetime-local" value="' + escapeHtml(training.confirmedDate) + '" data-field="confirmed-date" data-training-index="' + index + '" class="' + inputClasses + '">' +
                    '</div>' +
                    '<div class="mt-4 flex items-end">' +
                        '<button type="button" data-action="confirm-training" data-training-index="' + index + '" class="w-full rounded-lg bg-bevap-green px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700">' +
                            '<i class="fa-solid fa-check mr-2"></i>Confirmar Realização' +
                        '</button>' +
                    '</div>' +
                '</div>';
            var notesField = isConfirmed
                ? '<textarea data-field="notes" data-training-index="' + index + '" class="' + inputClasses + '" rows="3" readonly>' + escapeHtml(training.notes) + '</textarea>'
                : '<textarea data-field="notes" data-training-index="' + index + '" class="' + inputClasses + '" rows="3" placeholder="Registre como o treinamento ocorreu, principais pontos e observações.">' + escapeHtml(training.notes) + '</textarea>';

            return '' +
                '<div class="' + cardClasses + '">' +
                    '<div class="flex items-start justify-between gap-4">' +
                        '<div class="min-w-0 flex-1">' +
                            '<div class="flex items-center gap-3">' +
                                '<span class="inline-flex h-10 w-10 items-center justify-center rounded-xl ' + (isConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700') + '">' +
                                    '<i class="fa-solid fa-chalkboard-user text-base"></i>' +
                                '</span>' +
                                '<div class="min-w-0 flex-1">' +
                                    '<h3 class="text-base font-montserrat font-semibold text-bevap-navy">' + escapeHtml(training.title) + '</h3>' +
                                    '<p class="mt-1 text-sm text-gray-500">Responsável: ' + escapeHtml(training.responsible) + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        getStatusBadge(training) +
                    '</div>' +
                    '<div class="mt-4 flex flex-wrap gap-2 text-[13px]">' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-calendar-days mr-1 text-red-100"></i>Planejado: ' + escapeHtml(training.plannedDate) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #16a34a; border-color: #16a34a;"><i class="fa-regular fa-clock mr-1 text-green-200"></i>' + escapeHtml(training.plannedHours) + '</span>' +
                        '<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-white" style="background-color: #7c3aed; border-color: #7c3aed;"><i class="fa-solid fa-users mr-1 text-violet-100"></i>' + (training.participants || []).length + ' participantes</span>' +
                    '</div>' +
                    '<div class="mt-4">' +
                        statusMessage +
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
                        actionSection +
                    '</div>' +
                    '<div class="mt-4">' +
                        '<label class="mb-1 block text-sm text-gray-600">Observações</label>' +
                        notesField +
                    '</div>' +
                    '<div class="mt-4">' +
                        '<label class="mb-3 block text-sm text-gray-600">Anexar Documentos do Treinamento</label>' +
                        '<div class="training-attachments-field" data-training-index="' + index + '">' +
                            '<input type="file" multiple class="training-attachments-input hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg">' +
                            '<div class="training-attachments-dropzone cursor-pointer rounded-lg border-2 border-dashed ' + (isConfirmed ? 'border-emerald-300 bg-white' : 'border-amber-300 bg-white') + ' p-6 text-center transition-colors hover:border-bevap-green">' +
                                '<i class="fa-solid fa-cloud-arrow-up mb-2 text-2xl ' + (isConfirmed ? 'text-emerald-400' : 'text-amber-400') + '"></i>' +
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
                '</div>';
        }).join('');

        refreshSummary();
    }

    function refreshSummary() {
        var total = trainingsData.length;
        var confirmed = trainingsData.filter(function (training) { return training.confirmed; }).length;
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
            return !training.confirmed;
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

            var confirmTrainingButton = event.target.closest('[data-action="confirm-training"]');
            if (confirmTrainingButton) {
                pendingTrainingConfirmIndex = Number(confirmTrainingButton.getAttribute('data-training-index'));
                if (!trainingsData[pendingTrainingConfirmIndex].confirmed && !trainingsData[pendingTrainingConfirmIndex].confirmedDate) {
                    showToast('Informe data e hora', 'Selecione a data e a hora da realização antes de confirmar o treinamento.', 'error');
                    pendingTrainingConfirmIndex = null;
                    return;
                }
                openModal('next-activity-modal');
                configureNextActivityModal(
                    'Confirmar Realização do Treinamento',
                    'Você está confirmando a realização do treinamento <strong>' + escapeHtml(trainingsData[pendingTrainingConfirmIndex].title) + '</strong>.',
                    'Ao confirmar, este treinamento será marcado como realizado.'
                );
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
                    showToast('Treinamentos pendentes', 'Confirme todos os treinamentos realizados ou retorne para novo planejamento antes de seguir.', 'info');
                    return;
                }
                pendingTrainingConfirmIndex = null;
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
            if (field === 'notes') {
                trainingsData[trainingIndex].notes = event.target.value;
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
            pendingTrainingConfirmIndex = null;
        });
        if (nextConfirmButton) {
            nextConfirmButton.addEventListener('click', function () {
                if (pendingTrainingConfirmIndex !== null) {
                    var training = trainingsData[pendingTrainingConfirmIndex];
                    training.confirmed = true;
                    if (!training.confirmedDate) training.confirmedDate = '2026-03-20T09:00';
                    renderTrainingCards();
                    closeModal('next-activity-modal');
                    pendingTrainingConfirmIndex = null;
                    showToast('Treinamento realizado', 'O treinamento foi marcado como realizado com sucesso.', 'success');
                    return;
                }
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
