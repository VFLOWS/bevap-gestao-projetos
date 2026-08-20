document.addEventListener('DOMContentLoaded', function () {
    var currentParams = window.location.search || '';
    var executionEntryState = {
        estimatedMinutes: 12 * 60,
        committedMinutes: 6 * 60,
        editingEntry: null
    };

    function toggleTab(tabPrefix, tabName) {
        ['detail', 'attachments'].forEach(function (tab) {
            var button = document.getElementById('tab-' + tabPrefix + '-' + tab);
            var content = document.getElementById('tab-content-' + tabPrefix + '-' + tab);
            if (!button || !content) return;
            var active = tab === tabName;
            button.classList.toggle('border-bevap-green', active);
            button.classList.toggle('text-bevap-green', active);
            button.classList.toggle('bg-green-50', active);
            button.classList.toggle('border-transparent', !active);
            button.classList.toggle('text-gray-500', !active);
            button.classList.toggle('hover:text-gray-700', !active);
            content.classList.toggle('hidden', !active);
        });
    }

    function bindTabs(tabPrefix, shellPrefix) {
        var scroller = document.getElementById(shellPrefix + '-tabs-scroll');
        var leftArrow = document.getElementById(shellPrefix + '-tabs-left-arrow');
        var rightArrow = document.getElementById(shellPrefix + '-tabs-right-arrow');

        function updateArrows() {
            if (!scroller || !leftArrow || !rightArrow) return;
            var maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            var hasOverflow = maxScroll > 2;
            var atStart = scroller.scrollLeft <= 2;
            var atEnd = scroller.scrollLeft >= maxScroll - 2;
            leftArrow.classList.toggle('opacity-0', !hasOverflow || atStart);
            leftArrow.classList.toggle('pointer-events-none', !hasOverflow || atStart);
            rightArrow.classList.toggle('opacity-0', !hasOverflow || atEnd);
            rightArrow.classList.toggle('pointer-events-none', !hasOverflow || atEnd);
        }

        document.getElementById('tab-' + tabPrefix + '-detail')?.addEventListener('click', function () {
            toggleTab(tabPrefix, 'detail');
        });
        document.getElementById('tab-' + tabPrefix + '-attachments')?.addEventListener('click', function () {
            toggleTab(tabPrefix, 'attachments');
        });
        leftArrow?.addEventListener('click', function () {
            scroller.scrollTo({ left: 0, behavior: 'smooth' });
            window.setTimeout(updateArrows, 360);
        });
        rightArrow?.addEventListener('click', function () {
            scroller.scrollTo({ left: scroller.scrollWidth - scroller.clientWidth, behavior: 'smooth' });
            window.setTimeout(updateArrows, 360);
        });
        scroller?.addEventListener('scroll', updateArrows);
        window.setTimeout(updateArrows, 0);
        toggleTab(tabPrefix, 'detail');
    }

    function closeModal() {
        var root = document.getElementById('modal-root');
        if (root) root.innerHTML = '';
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
        window.clearTimeout(window.__marcosToastTimeout);
        window.__marcosToastTimeout = window.setTimeout(function () {
            toast.classList.add('hidden');
        }, 3200);
    }

    function openModal() {
        var root = document.getElementById('modal-root');
        if (!root) return;
        root.innerHTML = '' +
            '<div id="generic-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">' +
                    '<div class="flex items-center mb-4">' +
                        '<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">' +
                            '<i class="fa-solid fa-paper-plane text-bevap-green text-2xl"></i>' +
                        '</div>' +
                        '<h3 class="text-xl font-montserrat font-bold text-bevap-navy">Enviar para Validação do Solicitante</h3>' +
                    '</div>' +
                    '<div class="text-gray-700">' +
                        '<p class="mb-4">Você está encaminhando a atividade <strong>Mapear sistemas impactados</strong> para a próxima etapa do fluxo.</p>' +
                        '<p class="text-sm text-gray-600">Ao confirmar, o protótipo abrirá a tela de validação do solicitante.</p>' +
                    '</div>' +
                    '<div class="mt-6 flex justify-end space-x-3">' +
                        '<button type="button" data-modal-close class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>' +
                        '<button type="button" data-modal-confirm class="px-6 py-2 rounded-lg transition-colors font-medium bg-bevap-green hover:bg-green-700 text-white">Enviar</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        root.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
        root.querySelector('[data-modal-confirm]')?.addEventListener('click', function () {
            closeModal();
            showToast('Atividade enviada', 'A validação do solicitante foi iniciada.', 'success');
            window.setTimeout(function () {
                window.location.href = 'ux-marco-validacao-solicitante.html' + currentParams;
            }, 900);
        });
        root.querySelector('#generic-modal')?.addEventListener('click', function (event) {
            if (event.target && event.target.id === 'generic-modal') closeModal();
        });
    }

    function openSaveActivityModal() {
        var root = document.getElementById('modal-root');
        if (!root) return;
        root.innerHTML = '' +
            '<div id="save-activity-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">' +
                    '<div class="flex items-center mb-4">' +
                        '<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">' +
                            '<i class="fa-solid fa-save text-blue-600 text-xl"></i>' +
                        '</div>' +
                        '<h3 class="text-xl font-montserrat font-bold text-bevap-navy">Salvar Alterações da Atividade</h3>' +
                    '</div>' +
                    '<div class="text-gray-700">' +
                        '<p class="mb-4">Confirma o salvamento desta atividade?</p>' +
                        '<p class="text-sm text-gray-600">Todos os apontamentos de tempo e anexos adicionados nesta execução serão salvos.</p>' +
                    '</div>' +
                    '<div class="mt-6 flex justify-end space-x-3">' +
                        '<button type="button" data-save-modal-close class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>' +
                        '<button type="button" data-save-modal-confirm class="px-6 py-2 rounded-lg transition-colors font-medium bg-bevap-navy hover:opacity-95 text-white">Salvar</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        root.querySelector('[data-save-modal-close]')?.addEventListener('click', closeModal);
        root.querySelector('[data-save-modal-confirm]')?.addEventListener('click', function () {
            closeModal();
            showToast('Alterações salvas', 'Todos os apontamentos e anexos da atividade foram salvos com sucesso.', 'success');
        });
        root.querySelector('#save-activity-modal')?.addEventListener('click', function (event) {
            if (event.target && event.target.id === 'save-activity-modal') closeModal();
        });
    }

    function getExecutionEntryModalMarkup(editing) {
        return '' +
            '<div id="execution-entry-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">' +
                '<div class="w-full max-w-3xl rounded-2xl bg-white shadow-xl">' +
                    '<div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">' +
                        '<div class="flex items-center gap-3">' +
                            '<span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shrink-0">' +
                                '<i class="fa-regular fa-clock text-lg"></i>' +
                            '</span>' +
                            '<div>' +
                                '<h3 class="text-lg font-montserrat font-bold text-bevap-navy">' + (editing ? 'Editar Apontamento de Tempo' : 'Adicionar Apontamento de Tempo') + '</h3>' +
                                '<p class="text-sm text-gray-500">Informe o intervalo e registre o comentário da atividade.</p>' +
                            '</div>' +
                        '</div>' +
                        '<button type="button" data-entry-modal-close class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">' +
                            '<i class="fa-solid fa-xmark"></i>' +
                        '</button>' +
                    '</div>' +
                    '<div class="px-6 py-5">' +
                        '<div>' +
                            '<label class="mb-2 block text-sm font-medium text-gray-700">Apontamento de Tempo</label>' +
                            '<div class="grid gap-3 md:grid-cols-2">' +
                                '<div class="rounded-xl border border-gray-200 bg-slate-50 p-4">' +
                                    '<div class="flex items-center gap-2 text-sm font-medium text-bevap-navy">' +
                                        '<i class="fa-regular fa-clock text-blue-600"></i>' +
                                        '<span>Início</span>' +
                                    '</div>' +
                                    '<div class="mt-3">' +
                                        '<input id="execution-entry-start-time" type="text" inputmode="numeric" maxlength="5" value="08:00" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="08:00">' +
                                        '<span class="mt-1 block text-xs text-gray-500">Informe hora e minutos de início</span>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="rounded-xl border border-gray-200 bg-slate-50 p-4">' +
                                    '<div class="flex items-center gap-2 text-sm font-medium text-bevap-navy">' +
                                        '<i class="fa-solid fa-clock-rotate-left text-blue-600"></i>' +
                                        '<span>Fim</span>' +
                                    '</div>' +
                                    '<div class="mt-3">' +
                                        '<input id="execution-entry-end-time" type="text" inputmode="numeric" maxlength="5" value="10:00" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="10:00">' +
                                        '<span class="mt-1 block text-xs text-gray-500">Informe hora e minutos de fim</span>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="mt-4">' +
                            '<label for="execution-entry-comment" class="mb-2 block text-sm font-medium text-gray-700">Comentário da Atividade</label>' +
                            '<textarea id="execution-entry-comment" rows="5" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-bevap-green" placeholder="Descreva o andamento, decisões tomadas ou impedimentos encontrados durante esse intervalo."></textarea>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">' +
                        '<button type="button" data-entry-modal-close class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancelar</button>' +
                        '<button type="button" id="execution-entry-discard" class="' + (editing ? 'inline-flex' : 'hidden') + ' items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">' +
                            '<i class="fa-solid fa-xmark mr-2"></i><span>Descartar Edição</span>' +
                        '</button>' +
                        '<button type="button" data-action="add-entry" class="inline-flex items-center justify-center rounded-lg bg-bevap-navy px-4 py-2 text-sm font-medium text-white hover:opacity-95">' +
                            '<i class="' + (editing ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-plus') + ' mr-2"></i><span>' + (editing ? 'Editar Lançamento' : 'Adicionar lançamento') + '</span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function padNumber(value) {
        return String(value).padStart(2, '0');
    }

    function formatHoursAndMinutes(totalMinutes) {
        var normalized = Math.max(0, Math.round(totalMinutes));
        var hours = Math.floor(normalized / 60);
        var minutes = normalized % 60;
        if (!minutes) return hours + 'h';
        return hours + 'h ' + padNumber(minutes) + 'min';
    }

    function parseDurationLabel(label) {
        var normalized = String(label || '').trim();
        var match = normalized.match(/(\d+)h(?:\s*(\d{2})min)?/i);
        if (!match) return 0;
        var hours = parseInt(match[1], 10) || 0;
        var minutes = parseInt(match[2], 10) || 0;
        return (hours * 60) + minutes;
    }

    function formatEntryDateRange(dateLabel, rangeLabel) {
        var parts = String(rangeLabel || '').split(' às ');
        if (parts.length !== 2) return (dateLabel ? dateLabel + ' ' : '') + String(rangeLabel || '');
        return (dateLabel ? dateLabel + ' ' : '') + parts[0] + ' - ' + parts[1];
    }

    function normalizeTimeInputValue(rawValue) {
        var digits = String(rawValue || '').replace(/\D/g, '').slice(0, 4);
        if (digits.length <= 2) return digits;
        return digits.slice(0, 2) + ':' + digits.slice(2);
    }

    function parseTimeInputValue(value) {
        var normalized = String(value || '').trim();
        var match = normalized.match(/^(\d{2}):(\d{2})$/);
        if (!match) return null;
        var hour = parseInt(match[1], 10);
        var minute = parseInt(match[2], 10);
        if (isNaN(hour) || isNaN(minute)) return null;
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
        return {
            hour: hour,
            minute: minute,
            totalMinutes: (hour * 60) + minute,
            label: padNumber(hour) + ':' + padNumber(minute)
        };
    }

    function getExecutionEntryDurationMinutes() {
        var startField = document.getElementById('execution-entry-start-time');
        var endField = document.getElementById('execution-entry-end-time');
        if (!startField || !endField) return 0;
        var startTime = parseTimeInputValue(startField.value);
        var endTime = parseTimeInputValue(endField.value);
        if (!startTime || !endTime) return 0;
        return endTime.totalMinutes - startTime.totalMinutes;
    }

    function getExecutionEntryRangeLabel() {
        var startField = document.getElementById('execution-entry-start-time');
        var endField = document.getElementById('execution-entry-end-time');
        if (!startField || !endField) return '';
        var startTime = parseTimeInputValue(startField.value);
        var endTime = parseTimeInputValue(endField.value);
        if (!startTime || !endTime) return '';
        return startTime.label + ' às ' + endTime.label;
    }

    function updateExecutionEffortSummary() {
        var estimatedElement = document.getElementById('execution-estimated-hours');
        var usedElement = document.getElementById('execution-used-hours');
        var remainingElement = document.getElementById('execution-remaining-hours');
        var usedMinutes = executionEntryState.committedMinutes;
        var remainingMinutes = executionEntryState.estimatedMinutes - usedMinutes;
        if (estimatedElement) estimatedElement.textContent = formatHoursAndMinutes(executionEntryState.estimatedMinutes);
        if (usedElement) usedElement.textContent = formatHoursAndMinutes(usedMinutes);
        if (remainingElement) remainingElement.textContent = formatHoursAndMinutes(Math.max(0, remainingMinutes));
    }

    function updateExecutionEntryButtonState() {
        var root = document.getElementById('modal-root');
        var button = root ? root.querySelector('[data-action="add-entry"]') : null;
        var discardButton = root ? root.querySelector('#execution-entry-discard') : null;
        if (!button) return;
        var icon = button.querySelector('i');
        var label = button.querySelector('span');
        var editing = !!executionEntryState.editingEntry;
        if (icon) {
            icon.className = editing ? 'fa-solid fa-pen-to-square mr-2' : 'fa-solid fa-plus mr-2';
        }
        if (label) {
            label.textContent = editing ? 'Editar Lançamento' : 'Adicionar lançamento';
        }
        if (discardButton) {
            discardButton.classList.toggle('hidden', !editing);
            discardButton.classList.toggle('inline-flex', editing);
        }
    }

    function updateExecutionEditingHighlight() {
        document.querySelectorAll('.execution-entry-item').forEach(function (item) {
            var active = executionEntryState.editingEntry === item;
            item.classList.toggle('border-blue-300', active);
            item.classList.toggle('bg-blue-50', active);
            item.classList.toggle('ring-2', active);
            item.classList.toggle('ring-blue-100', active);
            item.classList.toggle('border-gray-200', !active);
            item.classList.toggle('bg-slate-50', !active);
        });
    }

    function populateExecutionEntryForm(rangeLabel, message) {
        var startField = document.getElementById('execution-entry-start-time');
        var endField = document.getElementById('execution-entry-end-time');
        var commentField = document.getElementById('execution-entry-comment');
        var parts = String(rangeLabel || '').split(' às ');
        if (startField) startField.value = parts[0] || '';
        if (endField) endField.value = parts[1] || '';
        if (commentField) commentField.value = message || '';
    }

    function resetExecutionEntryForm() {
        populateExecutionEntryForm('08:00 às 10:00', '');
        updateExecutionEntryButtonState();
    }

    function clearExecutionEntryEditing() {
        executionEntryState.editingEntry = null;
        updateExecutionEntryButtonState();
        updateExecutionEditingHighlight();
    }

    function closeExecutionEntryModal() {
        closeModal();
        clearExecutionEntryEditing();
    }

    function discardExecutionEntryEditing() {
        closeExecutionEntryModal();
        showToast('Edição descartada', 'As alterações do lançamento em edição foram descartadas.', 'info');
    }

    function bindExecutionEntryModalActions() {
        bindTimeInputMask('execution-entry-start-time');
        bindTimeInputMask('execution-entry-end-time');
        document.querySelectorAll('[data-entry-modal-close]').forEach(function (button) {
            button.addEventListener('click', closeExecutionEntryModal);
        });
        document.querySelector('[data-action="add-entry"]')?.addEventListener('click', addExecutionEntry);
        document.getElementById('execution-entry-discard')?.addEventListener('click', discardExecutionEntryEditing);
        document.getElementById('execution-entry-modal')?.addEventListener('click', function (event) {
            if (event.target && event.target.id === 'execution-entry-modal') {
                closeExecutionEntryModal();
            }
        });
    }

    function openExecutionEntryModal(item) {
        var root = document.getElementById('modal-root');
        var editing = !!item;
        if (!root) return;
        executionEntryState.editingEntry = item || null;
        updateExecutionEditingHighlight();
        root.innerHTML = getExecutionEntryModalMarkup(editing);
        bindExecutionEntryModalActions();
        if (editing) {
            populateExecutionEntryForm(item.getAttribute('data-range'), item.getAttribute('data-message'));
            document.getElementById('execution-entry-comment')?.focus();
        } else {
            resetExecutionEntryForm();
            document.getElementById('execution-entry-start-time')?.focus();
        }
        updateExecutionEntryButtonState();
    }

    function setExecutionEntryContent(item, stamp, durationLabel, rangeLabel, message) {
        var dateLabel = String(stamp || '').split(' ')[0] || '';
        item.setAttribute('data-author', 'Carlos Silva');
        item.setAttribute('data-time', stamp);
        item.setAttribute('data-duration', durationLabel);
        item.setAttribute('data-range', rangeLabel);
        item.setAttribute('data-message', message);
        item.innerHTML = '' +
            '<div class="flex items-start justify-between gap-3">' +
                '<div class="flex items-center gap-3">' +
                    '<span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bevap-navy text-sm font-semibold text-white">CS</span>' +
                    '<div><div class="font-semibold text-bevap-navy leading-5">Carlos Silva</div><div class="mt-1 text-xs text-gray-500">' + formatEntryDateRange(dateLabel, rangeLabel) + '</div></div>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<span class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">' + durationLabel + '</span>' +
                    '<div class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500">' + stamp + '</div>' +
                    '<button type="button" data-action="edit-entry" title="Editar lançamento" aria-label="Editar lançamento" class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">' +
                        '<i class="fa-solid fa-pen text-[10px]"></i>' +
                    '</button>' +
                    '<button type="button" data-action="delete-entry" title="Excluir lançamento" aria-label="Excluir lançamento" class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">' +
                        '<i class="fa-solid fa-trash text-[10px]"></i>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<p class="mt-2 text-sm text-gray-700"></p>';
        item.querySelector('p').textContent = message;
    }

    function addExecutionEntry() {
        var startField = document.getElementById('execution-entry-start-time');
        var endField = document.getElementById('execution-entry-end-time');
        var commentField = document.getElementById('execution-entry-comment');
        var history = document.getElementById('execution-entry-history');
        if (!startField || !endField || !commentField || !history) return;

        var startTime = parseTimeInputValue(startField.value);
        var endTime = parseTimeInputValue(endField.value);
        var durationMinutes = getExecutionEntryDurationMinutes();
        var rangeLabel = getExecutionEntryRangeLabel();
        var message = commentField.value.trim();

        if (!startTime || !endTime) {
            showToast('Horário inválido', 'Informe início e fim no formato HH:MM.', 'error');
            startField.focus();
            return;
        }
        if (durationMinutes <= 0) {
            showToast('Intervalo inválido', 'Selecione um horário final maior que o horário inicial.', 'error');
            endField.focus();
            return;
        }
        if (!message) {
            showToast('Comentário vazio', 'Descreva o andamento da atividade para registrar o lançamento.', 'error');
            commentField.focus();
            return;
        }

        var durationLabel = formatHoursAndMinutes(durationMinutes);
        var now = new Date();
        var stamp = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        var wasEditing = !!executionEntryState.editingEntry;
        var item = executionEntryState.editingEntry || document.createElement('div');
        var editingMinutes = executionEntryState.editingEntry ? parseDurationLabel(executionEntryState.editingEntry.getAttribute('data-duration')) : 0;

        executionEntryState.committedMinutes += durationMinutes - editingMinutes;
        updateExecutionEffortSummary();

        item.className = 'execution-entry-item rounded-xl border border-gray-200 bg-slate-50 p-4';
        setExecutionEntryContent(item, stamp, durationLabel, rangeLabel, message);
        if (!wasEditing) {
            history.prepend(item);
        }

        closeModal();
        clearExecutionEntryEditing();
        showToast(
            wasEditing ? 'Lançamento atualizado' : 'Lançamento adicionado',
            wasEditing ? 'O lançamento foi atualizado com sucesso.' : 'O tempo e o comentário foram registrados na atividade.',
            'success'
        );
    }

    function bindTimeInputMask(inputId) {
        var field = document.getElementById(inputId);
        if (!field) return;
        field.addEventListener('input', function () {
            field.value = normalizeTimeInputValue(field.value);
        });
    }

    function toggleExecutionEntryHistory() {
        var history = document.getElementById('execution-entry-history');
        var toggle = document.getElementById('execution-entry-history-toggle');
        if (!history || !toggle) return;
        var icon = toggle.querySelector('i');
        var label = toggle.querySelector('span');
        var isExpanded = toggle.getAttribute('aria-expanded') !== 'false';
        var nextExpanded = !isExpanded;
        history.classList.toggle('hidden', !nextExpanded);
        toggle.setAttribute('aria-expanded', String(nextExpanded));
        if (icon) {
            icon.classList.toggle('fa-chevron-up', nextExpanded);
            icon.classList.toggle('fa-chevron-down', !nextExpanded);
        }
        if (label) {
            label.textContent = nextExpanded ? 'Recolher' : 'Expandir';
        }
    }

    function handleExecutionEntryActions(event) {
        var editButton = event.target.closest('[data-action="edit-entry"]');
        var deleteButton = event.target.closest('[data-action="delete-entry"]');
        var item = event.target.closest('.execution-entry-item');
        if (!item) return;

        if (editButton) {
            openExecutionEntryModal(item);
            return;
        }

        if (deleteButton) {
            openDeleteEntryModal(item);
        }
    }

    function openDeleteEntryModal(item) {
        var root = document.getElementById('modal-root');
        if (!root || !item) return;
        root.innerHTML = '' +
            '<div id="delete-entry-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">' +
                    '<div class="flex items-center mb-4">' +
                        '<div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">' +
                            '<i class="fa-solid fa-trash text-red-600 text-xl"></i>' +
                        '</div>' +
                        '<h3 class="text-xl font-montserrat font-bold text-bevap-navy">Excluir Apontamento de Tempo</h3>' +
                    '</div>' +
                    '<p class="text-gray-700 mb-2">Confirma a exclusão deste apontamento de tempo do histórico?</p>' +
                    '<p class="text-sm text-gray-600 mb-6">Essa ação removerá o comentário e recalculará o esforço utilizado da atividade.</p>' +
                    '<div class="flex justify-end gap-3">' +
                        '<button type="button" data-modal-close class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>' +
                        '<button type="button" data-modal-confirm class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Excluir</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        root.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
        root.querySelector('[data-modal-confirm]')?.addEventListener('click', function () {
            executionEntryState.committedMinutes = Math.max(0, executionEntryState.committedMinutes - parseDurationLabel(item.getAttribute('data-duration')));
            if (executionEntryState.editingEntry === item) {
                clearExecutionEntryEditing();
                closeModal();
            }
            item.remove();
            updateExecutionEffortSummary();
            closeModal();
            showToast('Lançamento excluído', 'O apontamento de tempo foi removido do histórico.', 'info');
        });
        root.querySelector('#delete-entry-modal')?.addEventListener('click', function (event) {
            if (event.target && event.target.id === 'delete-entry-modal') closeModal();
        });
    }

    function formatFileSize(size) {
        if (!size) return 'Arquivo local';
        if (size < 1024 * 1024) return (size / 1024).toFixed(0) + ' KB';
        return (size / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function getFileVisual(fileName) {
        var extension = (fileName.split('.').pop() || '').toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(extension) >= 0) {
            return { icon: 'fa-solid fa-file-image', color: 'text-blue-500' };
        }
        if (['xls', 'xlsx', 'csv'].indexOf(extension) >= 0) {
            return { icon: 'fa-solid fa-file-excel', color: 'text-emerald-600' };
        }
        if (['doc', 'docx', 'txt'].indexOf(extension) >= 0) {
            return { icon: 'fa-solid fa-file-word', color: 'text-indigo-600' };
        }
        return { icon: 'fa-solid fa-file-pdf', color: 'text-red-500' };
    }

    function renderExecutionFile(fileName, metaLabel) {
        var list = document.getElementById('execution-files-list');
        if (!list) return;
        var visual = getFileVisual(fileName);
        var item = document.createElement('div');
        item.className = 'execution-file-item flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3';
        item.setAttribute('data-file-name', fileName);
        item.innerHTML = '' +
            '<div class="flex items-center">' +
                '<i class="' + visual.icon + ' text-xl ' + visual.color + ' mr-3"></i>' +
                '<div>' +
                    '<div class="text-sm font-medium text-gray-900"></div>' +
                    '<div class="text-xs text-gray-500"></div>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="text-red-500 transition-colors hover:text-red-700" data-action="remove-file">' +
                '<i class="fa-solid fa-trash"></i>' +
            '</button>';
        item.querySelector('.text-sm').textContent = fileName;
        item.querySelector('.text-xs').textContent = metaLabel;
        list.appendChild(item);
    }

    function addExecutionFiles(fileList) {
        if (!fileList || !fileList.length) return;
        Array.from(fileList).forEach(function (file) {
            renderExecutionFile(file.name, formatFileSize(file.size));
        });
        showToast('Anexos adicionados', 'Os arquivos foram incluídos na atividade.', 'success');
    }

    function bindAttachmentActions() {
        var dropzone = document.getElementById('execution-dropzone');
        var input = document.getElementById('execution-attachment-input');
        var filesList = document.getElementById('execution-files-list');

        dropzone?.addEventListener('click', function () {
            input?.click();
        });

        input?.addEventListener('change', function () {
            addExecutionFiles(input.files);
            input.value = '';
        });

        dropzone?.addEventListener('dragover', function (event) {
            event.preventDefault();
            dropzone.classList.add('border-bevap-green', 'bg-green-50');
        });

        dropzone?.addEventListener('dragleave', function () {
            dropzone.classList.remove('border-bevap-green', 'bg-green-50');
        });

        dropzone?.addEventListener('drop', function (event) {
            event.preventDefault();
            dropzone.classList.remove('border-bevap-green', 'bg-green-50');
            addExecutionFiles(event.dataTransfer.files);
        });

        filesList?.addEventListener('click', function (event) {
            var button = event.target.closest('[data-action="remove-file"]');
            if (!button) return;
            var item = button.closest('.execution-file-item');
            if (!item) return;
            item.remove();
            showToast('Anexo removido', 'O arquivo foi removido da lista da atividade.', 'info');
        });
    }

    bindTabs('execution', 'execution-panel');
    updateExecutionEffortSummary();
    updateExecutionEntryButtonState();
    updateExecutionEditingHighlight();
    bindAttachmentActions();
    document.getElementById('execution-entry-history-toggle')?.addEventListener('click', toggleExecutionEntryHistory);
    document.getElementById('execution-entry-history')?.addEventListener('click', handleExecutionEntryActions);
    document.querySelector('[data-action="open-add-entry-modal"]')?.addEventListener('click', function () {
        openExecutionEntryModal(null);
    });
    document.querySelector('[data-action="save-activity"]')?.addEventListener('click', openSaveActivityModal);
    document.querySelector('[data-action="send-requester"]')?.addEventListener('click', openModal);
});
