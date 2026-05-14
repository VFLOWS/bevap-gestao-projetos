document.addEventListener('DOMContentLoaded', function () {
    var currentParams = window.location.search || '';
    var requesterChecklistVisited = false;

    function toggleTab(tabPrefix, tabName) {
        ['detail', 'checklist'].forEach(function (tab) {
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
        if (tabPrefix === 'requester' && tabName === 'checklist') {
            requesterChecklistVisited = true;
            updateChecklistProgress();
        }
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
        document.getElementById('tab-' + tabPrefix + '-checklist')?.addEventListener('click', function () {
            toggleTab(tabPrefix, 'checklist');
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

    function openActionModal(action) {
        var root = document.getElementById('modal-root');
        if (!root) return;

        var config = {
            approve: {
                iconWrap: 'bg-green-100',
                icon: 'fa-solid fa-check text-bevap-green text-2xl',
                title: 'Confirmar Validação do Solicitante',
                body: 'Ao confirmar, a atividade seguirá para a etapa de validação técnica da TI.',
                confirm: 'Validar Atividade',
                confirmClass: 'bg-bevap-green hover:bg-green-700 text-white',
                toastTitle: 'Atividade validada',
                toastMessage: 'A atividade foi encaminhada para a validação técnica da TI.',
                redirect: 'ux-marco-validacao-ti.html'
            },
            stop: {
                iconWrap: 'bg-red-100',
                icon: 'fa-solid fa-ban text-red-600 text-2xl',
                title: 'Não Continuidade da Atividade',
                body: 'Justifique a não continuidade da atividade para registrar a decisão e notificar os envolvidos no fluxo.',
                confirm: 'Confirmar Não Continuidade',
                confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
                toastTitle: 'Fluxo encerrado',
                toastMessage: 'A atividade foi finalizada por não continuidade.',
                redirect: '../ux-planejamento.html'
            }
        }[action];

        if (!config) return;

        if (action === 'stop') {
            root.innerHTML = '' +
                '<div id="generic-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">' +
                    '<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">' +
                        '<h3 class="text-xl font-montserrat font-bold text-bevap-navy mb-4">Não Continuidade do Projeto</h3>' +
                        '<p class="text-sm text-gray-600 mb-4">Justifique a não continuidade do projeto para notificar os stakeholders:</p>' +
                        '<select id="discontinue-category" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green mb-3">' +
                            '<option value="">Selecione a categoria</option>' +
                            '<option value="tecnica">Inviabilidade técnica</option>' +
                            '<option value="prioridades">Mudança de prioridades</option>' +
                            '<option value="recursos">Recursos indisponíveis</option>' +
                            '<option value="riscos">Risco elevado</option>' +
                            '<option value="escopo">Escopo indefinido</option>' +
                            '<option value="outro">Outro</option>' +
                        '</select>' +
                        '<textarea id="discontinue-reason" rows="4" placeholder="Descrição detalhada..." class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bevap-green focus:border-transparent transition-all resize-none mb-4"></textarea>' +
                        '<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">' +
                            '<p class="text-xs text-red-800"><i class="fa-solid fa-info-circle mr-1"></i> Os stakeholders serão notificados automaticamente.</p>' +
                        '</div>' +
                        '<div class="flex justify-end space-x-3">' +
                            '<button type="button" data-modal-close class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all">Cancelar</button>' +
                            '<button type="button" data-modal-confirm class="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all">Confirmar</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        } else {
            root.innerHTML = '' +
                '<div id="generic-modal" class="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 p-4">' +
                    '<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">' +
                        '<div class="mb-4 flex items-center">' +
                            '<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full ' + config.iconWrap + '">' +
                                '<i class="' + config.icon + '"></i>' +
                            '</div>' +
                            '<h3 class="text-xl font-montserrat font-bold text-bevap-navy">' + config.title + '</h3>' +
                        '</div>' +
                        '<div class="text-gray-700">' +
                            '<p class="mb-4">Você está analisando a atividade <strong>Mapear sistemas impactados</strong>.</p>' +
                            '<p class="text-sm text-gray-600">' + config.body + '</p>' +
                        '</div>' +
                        '<div class="mt-6 flex justify-end space-x-3">' +
                            '<button type="button" data-modal-close class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50">Cancelar</button>' +
                            '<button type="button" data-modal-confirm class="rounded-lg px-6 py-2 font-medium transition-colors ' + config.confirmClass + '">' + config.confirm + '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

        root.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
        root.querySelector('[data-modal-confirm]')?.addEventListener('click', function () {
            if (action === 'stop') {
                var category = root.querySelector('#discontinue-category');
                var reason = root.querySelector('#discontinue-reason');
                var categoryValue = category ? category.value.trim() : '';
                var reasonValue = reason ? reason.value.trim() : '';
                if (!categoryValue || !reasonValue) {
                    showToast('Justificativa pendente', 'Selecione a categoria e preencha a justificativa para registrar a não continuidade.', 'error');
                    return;
                }
            }
            closeModal();
            showToast(config.toastTitle, config.toastMessage, action === 'stop' ? 'info' : 'success');
            window.setTimeout(function () {
                window.location.href = config.redirect + currentParams;
            }, 900);
        });
        root.querySelector('#generic-modal')?.addEventListener('click', function (event) {
            if (event.target && event.target.id === 'generic-modal') closeModal();
        });
    }

    function updateChecklistProgress() {
        var items = document.querySelectorAll('.requester-checklist-item');
        var checked = document.querySelectorAll('.requester-checklist-item:checked').length;
        var percentage = items.length ? Math.round((checked / items.length) * 100) : 0;
        var percentageElement = document.getElementById('requester-checklist-percentage');
        var progressElement = document.getElementById('requester-checklist-progress');
        var notice = document.getElementById('requester-checklist-notice');
        if (percentageElement) percentageElement.textContent = percentage + '%';
        if (progressElement) progressElement.style.width = percentage + '%';
        if (notice) {
            notice.classList.toggle('hidden', requesterChecklistVisited);
        }
    }

    bindTabs('requester', 'requester-panel');
    updateChecklistProgress();
    document.querySelectorAll('.requester-checklist-item').forEach(function (checkbox) {
        checkbox.addEventListener('change', updateChecklistProgress);
    });
    document.getElementById('requester-agreement-checkbox')?.addEventListener('change', updateChecklistProgress);
    document.querySelector('[data-action="approve-requester"]')?.addEventListener('click', function () {
        if (!document.getElementById('requester-agreement-checkbox')?.checked) {
            showToast('Confirmação pendente', 'Marque a confirmação do solicitante antes de validar a atividade.', 'error');
            toggleTab('requester', 'checklist');
            return;
        }
        openActionModal('approve');
    });
    document.querySelector('[data-action="return-corrections"]')?.addEventListener('click', function () {
        document.getElementById('return-modal')?.classList.remove('hidden');
    });
    document.querySelector('[data-action="close-return-modal"]')?.addEventListener('click', function () {
        document.getElementById('return-modal')?.classList.add('hidden');
    });
    document.querySelector('[data-action="confirm-return-modal"]')?.addEventListener('click', function () {
        var reason = document.getElementById('return-reason');
        if (!reason || !reason.value.trim()) {
            showToast('Campo obrigatório', 'Informe o motivo da devolução.', 'error');
            return;
        }
        document.getElementById('return-modal')?.classList.add('hidden');
        showToast('Devolvido para correção', 'A atividade retornou para a etapa de execução para ajustes.', 'info');
        window.setTimeout(function () {
            window.location.href = 'ux-marco-execucao-atividade.html' + currentParams;
        }, 900);
    });
    document.querySelector('[data-action="stop-flow"]')?.addEventListener('click', function () {
        openActionModal('stop');
    });
    document.getElementById('return-modal')?.addEventListener('click', function (event) {
        if (event.target && event.target.id === 'return-modal') {
            document.getElementById('return-modal')?.classList.add('hidden');
        }
    });
});
