document.addEventListener('DOMContentLoaded', function () {
    var currentParams = window.location.search || '';
    var checklistVisited = false;
    var tiTabs = ['detail', 'requester', 'checklist'];

    function toggleTab(tabPrefix, tabName) {
        tiTabs.forEach(function (tab) {
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
        if (tabPrefix === 'project-ti' && tabName === 'checklist') {
            checklistVisited = true;
            updateTiChecklistProgress();
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
        document.getElementById('tab-' + tabPrefix + '-requester')?.addEventListener('click', function () {
            toggleTab(tabPrefix, 'requester');
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

    function openModal(id) {
        document.getElementById(id)?.classList.remove('hidden');
    }

    function closeModal(id) {
        document.getElementById(id)?.classList.add('hidden');
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
        window.clearTimeout(window.__projectTiToastTimeout);
        window.__projectTiToastTimeout = window.setTimeout(function () {
            toast.classList.add('hidden');
        }, 3200);
    }

    function updateTiChecklistProgress() {
        var items = document.querySelectorAll('.project-ti-checklist-item');
        var checked = document.querySelectorAll('.project-ti-checklist-item:checked').length;
        var percentage = items.length ? Math.round((checked / items.length) * 100) : 0;
        var percentageElement = document.getElementById('project-ti-checklist-percentage');
        var progressElement = document.getElementById('project-ti-checklist-progress');
        var notice = document.getElementById('project-ti-checklist-notice');
        if (percentageElement) percentageElement.textContent = percentage + '%';
        if (progressElement) progressElement.style.width = percentage + '%';
        if (notice) {
            notice.classList.toggle('hidden', checklistVisited);
        }
    }

    function validateApprovalRequirements() {
        var agreement = document.getElementById('project-ti-agreement-checkbox');
        var feedback = document.getElementById('project-ti-feedback-text');
        var checklistItems = document.querySelectorAll('.project-ti-checklist-item');
        var checkedCount = document.querySelectorAll('.project-ti-checklist-item:checked').length;
        var allChecklistDone = checklistItems.length > 0 && checkedCount === checklistItems.length;

        if (!allChecklistDone) {
            showToast('Checklist pendente', 'Conclua o checklist da TI antes de validar o projeto.', 'error');
            toggleTab('project-ti', 'checklist');
            return false;
        }

        if (!feedback || !feedback.value.trim()) {
            showToast('Comentário obrigatório', 'Informe o parecer técnico da TI antes de validar o projeto.', 'error');
            feedback?.focus();
            return false;
        }

        if (!agreement || !agreement.checked) {
            showToast('Confirmação pendente', 'Marque a confirmação da TI antes de validar o projeto.', 'error');
            toggleTab('project-ti', 'checklist');
            return false;
        }

        return true;
    }

    bindTabs('project-ti', 'project-ti-panel');
    updateTiChecklistProgress();

    document.querySelectorAll('.project-ti-checklist-item').forEach(function (checkbox) {
        checkbox.addEventListener('change', updateTiChecklistProgress);
    });
    document.getElementById('project-ti-agreement-checkbox')?.addEventListener('change', updateTiChecklistProgress);

    document.querySelector('[data-action="approve-project"]')?.addEventListener('click', function () {
        if (!validateApprovalRequirements()) return;
        openModal('approve-modal');
    });

    document.querySelector('[data-action="return-corrections"]')?.addEventListener('click', function () {
        openModal('return-modal');
    });

    document.querySelector('[data-action="stop-flow"]')?.addEventListener('click', function () {
        openModal('discontinue-modal');
    });

    document.querySelector('[data-action="close-approve-modal"]')?.addEventListener('click', function () {
        closeModal('approve-modal');
    });
    document.querySelector('[data-action="confirm-approve-modal"]')?.addEventListener('click', function () {
        closeModal('approve-modal');
        showToast('Validação concluída', 'A validação da TI foi registrada com sucesso.', 'success');
        window.setTimeout(function () {
            window.location.href = '../ux-planejamento.html' + currentParams;
        }, 900);
    });

    document.querySelector('[data-action="close-return-modal"]')?.addEventListener('click', function () {
        closeModal('return-modal');
    });
    document.querySelector('[data-action="confirm-return-modal"]')?.addEventListener('click', function () {
        var reason = document.getElementById('return-reason');
        if (!reason || !reason.value.trim()) {
            showToast('Campo obrigatório', 'Informe o motivo da devolução.', 'error');
            reason?.focus();
            return;
        }
        closeModal('return-modal');
        showToast('Devolvido para correção', 'O projeto retornou para a execução para ajustes.', 'info');
        window.setTimeout(function () {
            window.location.href = 'ux-execucao-projeto.html' + currentParams;
        }, 900);
    });

    document.querySelector('[data-action="close-discontinue-modal"]')?.addEventListener('click', function () {
        closeModal('discontinue-modal');
    });
    document.querySelector('[data-action="confirm-discontinue-modal"]')?.addEventListener('click', function () {
        var category = document.getElementById('discontinue-category');
        var reason = document.getElementById('discontinue-reason');
        if (!category || !category.value || !reason || !reason.value.trim()) {
            showToast('Campos obrigatórios', 'Selecione a categoria e descreva o motivo.', 'error');
            return;
        }
        closeModal('discontinue-modal');
        showToast('Não continuidade registrada', 'A não continuidade foi registrada e os stakeholders serão notificados.', 'error');
        window.setTimeout(function () {
            window.location.href = '../ux-planejamento.html' + currentParams;
        }, 900);
    });

    ['approve-modal', 'return-modal', 'discontinue-modal'].forEach(function (modalId) {
        document.getElementById(modalId)?.addEventListener('click', function (event) {
            if (event.target && event.target.id === modalId) {
                closeModal(modalId);
            }
        });
    });
});
