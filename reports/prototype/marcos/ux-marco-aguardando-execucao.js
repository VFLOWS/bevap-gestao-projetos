document.addEventListener('DOMContentLoaded', function () {
    var currentParams = window.location.search || '';

    function setUiState(state) {
        var banner = document.getElementById('ui-state-banner');
        var overlay = document.getElementById('ui-loading-overlay');
        var errorBox = document.getElementById('ui-error-box');
        if (!banner || !overlay || !errorBox) return;
        banner.className = 'hidden';
        overlay.classList.add('hidden');
        errorBox.classList.add('hidden');
        if (state === 'loading') {
            overlay.classList.remove('hidden');
            banner.className = 'rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800';
            banner.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Carregando dados da atividade e atualizando os indicadores do workflow.';
        } else if (state === 'error') {
            errorBox.classList.remove('hidden');
            banner.className = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800';
            banner.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-2"></i>Estado de erro do protótipo: exibe mensagem transacional, detalhes do bloqueio e CTA de retorno ao planejamento.';
        } else if (state === 'success') {
            banner.className = 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800';
            banner.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Estado de sucesso do protótipo: confirma o registro da ação e destaca o próximo passo.';
        }
        document.querySelectorAll('[data-ui-state]').forEach(function (button) {
            var active = button.getAttribute('data-ui-state') === state;
            button.classList.toggle('bg-bevap-navy', active);
            button.classList.toggle('text-white', active);
            button.classList.toggle('border-bevap-navy', active);
            button.classList.toggle('bg-white', !active);
            button.classList.toggle('text-gray-700', !active);
            button.classList.toggle('border-gray-300', !active);
        });
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

    function closeModal() {
        var root = document.getElementById('modal-root');
        if (root) root.innerHTML = '';
    }

    function openModal() {
        var root = document.getElementById('modal-root');
        if (!root) return;
        root.innerHTML = '' +
            '<div id="generic-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">' +
                    '<div class="flex items-center mb-4">' +
                        '<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">' +
                            '<i class="fa-solid fa-play-circle text-bevap-green text-2xl"></i>' +
                        '</div>' +
                        '<h3 class="text-xl font-montserrat font-bold text-bevap-navy">Confirmar Início da Execução</h3>' +
                    '</div>' +
                    '<div class="text-gray-700">' +
                        '<p class="mb-4">Você está iniciando a atividade <strong>Mapear sistemas impactados</strong> do marco <strong>Concluir descoberta e baseline técnico</strong>.</p>' +
                        '<p class="text-sm text-gray-600">Ao confirmar, a execução da atividade será iniciada e a próxima tela do protótipo será aberta.</p>' +
                    '</div>' +
                    '<div class="mt-6 flex justify-end space-x-3">' +
                        '<button type="button" data-modal-close class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>' +
                        '<button type="button" data-modal-confirm class="px-6 py-2 rounded-lg transition-colors font-medium bg-bevap-green hover:bg-green-700 text-white">Iniciar Execução</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        root.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
        root.querySelector('[data-modal-confirm]')?.addEventListener('click', function () {
            closeModal();
            showToast('Execução iniciada', 'A atividade avançou para a próxima etapa do protótipo.', 'success');
            window.setTimeout(function () {
                window.location.href = 'ux-marco-execucao-atividade.html' + currentParams;
            }, 900);
        });
        root.querySelector('#generic-modal')?.addEventListener('click', function (event) {
            if (event.target && event.target.id === 'generic-modal') closeModal();
        });
    }

    document.querySelectorAll('[data-ui-state]').forEach(function (button) {
        button.addEventListener('click', function () {
            setUiState(button.getAttribute('data-ui-state'));
        });
    });

    document.querySelector('[data-action="start-execution"]')?.addEventListener('click', openModal);

    setUiState('default');
});
