(function () {
    var finalNote = '';
    var currentTab = 'overview';

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
            ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        requesterValidationTab.className = isRequesterValidation
            ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        finalValidationTab.className = isFinalValidation
            ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';
        validationTab.className = isValidation
            ? 'border-b-2 border-bevap-green bg-green-50 px-6 py-4 text-sm font-medium text-bevap-green'
            : 'border-b-2 border-transparent px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700';

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

    function bindEvents() {
        var tabsScroll = document.getElementById('closure-tabs-scroll');
        var leftArrow = document.getElementById('closure-tabs-left-arrow');
        var rightArrow = document.getElementById('closure-tabs-right-arrow');

        if (tabsScroll) {
            tabsScroll.addEventListener('scroll', refreshTabsArrows);
        }

        if (leftArrow && tabsScroll) {
            leftArrow.addEventListener('click', function () {
                tabsScroll.scrollBy({
                    left: -220,
                    behavior: 'smooth'
                });
            });
        }

        if (rightArrow && tabsScroll) {
            rightArrow.addEventListener('click', function () {
                tabsScroll.scrollBy({
                    left: 220,
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
        updateTabs();
        bindEvents();
        refreshTabsArrows();
    });
})();
