/**
 * BEVAP Solicitacao Widget - ES5 Compatible
 * Displays requests list with filters and new request form
 */

(function() {
    'use strict';

    var allRequests = [];
    var filteredRequests = [];

    /**
     * Initialize solicitacao widget
     */
    function initSolicitacao() {
        BevapUtils.showLoading('requests-table');
        
        // Simulate data loading
        setTimeout(function() {
            loadRequests();
        }, 800);
    }

    /**
     * Load requests data
     */
    function loadRequests() {
        // Simulated data - In production, fetch from Fluig dataset or API
        allRequests = [
            { id: 1, nome: 'Portal de Autoatendimento', descricao: 'Desenvolvimento de portal web', area: 'RH', prioridade: 'alta', status: 'em-analise', dataSolicitacao: '2026-01-05', solicitante: 'Maria Silva' },
            { id: 2, nome: 'Integração SAP-Fluig', descricao: 'Integração de sistemas', area: 'TI', prioridade: 'critica', status: 'aprovado', dataSolicitacao: '2026-01-04', solicitante: 'João Santos' },
            { id: 3, nome: 'Workflow de Compras', descricao: 'Automatização de aprovações', area: 'Compras', prioridade: 'media', status: 'novo', dataSolicitacao: '2026-01-03', solicitante: 'Ana Costa' },
            { id: 4, nome: 'Dashboard Executivo', descricao: 'Painéis de indicadores', area: 'Diretoria', prioridade: 'alta', status: 'aprovado', dataSolicitacao: '2026-01-02', solicitante: 'Carlos Oliveira' },
            { id: 5, nome: 'Mobile App BEVAP', descricao: 'Aplicativo mobile', area: 'TI', prioridade: 'alta', status: 'em-analise', dataSolicitacao: '2026-01-01', solicitante: 'Pedro Lima' },
            { id: 6, nome: 'Sistema de Tickets', descricao: 'Gestão de chamados', area: 'Suporte', prioridade: 'media', status: 'novo', dataSolicitacao: '2025-12-30', solicitante: 'Lucia Ferreira' },
            { id: 7, nome: 'Relatórios Financeiros', descricao: 'Automatização de relatórios', area: 'Financeiro', prioridade: 'baixa', status: 'rejeitado', dataSolicitacao: '2025-12-28', solicitante: 'Roberto Alves' }
        ];

        filteredRequests = allRequests;
        renderRequestsTable();
    }

    /**
     * Render requests table
     */
    function renderRequestsTable() {
        var container = document.getElementById('requests-table');
        if (!container) return;

        if (filteredRequests.length === 0) {
            BevapUtils.showEmpty('requests-table', 'Nenhuma solicitação encontrada');
            return;
        }

        var html = '<div class="overflow-x-auto">' +
            '<table class="min-w-full divide-y divide-gray-200">' +
            '  <thead class="bg-gray-50">' +
            '    <tr>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>' +
            '    </tr>' +
            '  </thead>' +
            '  <tbody class="bg-white divide-y divide-gray-200">';

        for (var i = 0; i < filteredRequests.length; i++) {
            var request = filteredRequests[i];
            var statusClass = getStatusClass(request.status);
            var prioridadeClass = getPrioridadeClass(request.prioridade);
            var statusText = getStatusText(request.status);
            var prioridadeText = getPrioridadeText(request.prioridade);

            html += '<tr class="hover:bg-gray-50">' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#' + request.id + '</td>' +
                '      <td class="px-6 py-4">' +
                '        <div class="text-sm font-medium text-bevap-dark">' + BevapUtils.escapeHtml(request.nome) + '</div>' +
                '        <div class="text-sm text-gray-500">' + BevapUtils.escapeHtml(request.descricao) + '</div>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + BevapUtils.escapeHtml(request.area) + '</td>' +
                '      <td class="px-6 py-4 whitespace-nowrap">' +
                '        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + prioridadeClass + '">' + 
                prioridadeText + '</span>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap">' +
                '        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + statusClass + '">' + 
                statusText + '</span>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + BevapUtils.escapeHtml(request.solicitante) + '</td>' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + BevapUtils.formatDate(request.dataSolicitacao) + '</td>' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
                '        <button onclick="viewRequest(' + request.id + ')" class="text-bevap-primary hover:text-bevap-primary focus-bevap mr-3" aria-label="Ver solicitação ' + BevapUtils.escapeHtml(request.nome) + '">Ver</button>' +
                '        <button onclick="editRequest(' + request.id + ')" class="text-blue-600 hover:text-blue-900 focus-bevap" aria-label="Editar solicitação ' + BevapUtils.escapeHtml(request.nome) + '">Editar</button>' +
                '      </td>' +
                '    </tr>';
        }

        html += '  </tbody>' +
            '</table>' +
            '</div>' +
            '<div class="px-6 py-4 bg-gray-50 border-t border-gray-200">' +
            '  <p class="text-sm text-gray-700">Mostrando <span class="font-medium">' + filteredRequests.length + '</span> solicitação(ões)</p>' +
            '</div>';

        container.innerHTML = html;
    }

    /**
     * Get status display text
     */
    function getStatusText(status) {
        var texts = {
            'novo': 'Novo',
            'em-analise': 'Em Análise',
            'aprovado': 'Aprovado',
            'rejeitado': 'Rejeitado'
        };
        return texts[status] || status;
    }

    /**
     * Get priority display text
     */
    function getPrioridadeText(prioridade) {
        var texts = {
            'critica': 'Crítica',
            'alta': 'Alta',
            'media': 'Média',
            'baixa': 'Baixa'
        };
        return texts[prioridade] || prioridade;
    }

    /**
     * Get status badge class
     */
    function getStatusClass(status) {
        var classes = {
            'novo': 'bg-blue-100 text-blue-800',
            'em-analise': 'bg-bevap-accent text-bevap-dark',
            'aprovado': 'bg-green-100 text-green-800',
            'rejeitado': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Get priority badge class
     */
    function getPrioridadeClass(prioridade) {
        var classes = {
            'critica': 'bg-red-100 text-red-800',
            'alta': 'bg-orange-100 text-orange-800',
            'media': 'bg-yellow-100 text-yellow-800',
            'baixa': 'bg-green-100 text-green-800'
        };
        return classes[prioridade] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Apply filters
     */
    window.applyFilters = function() {
        var statusFilter = document.getElementById('filter-status').value.toLowerCase();
        var priorityFilter = document.getElementById('filter-priority').value.toLowerCase();
        var searchFilter = document.getElementById('filter-search').value.toLowerCase();

        filteredRequests = allRequests.filter(function(request) {
            var matchStatus = !statusFilter || request.status === statusFilter;
            var matchPriority = !priorityFilter || request.prioridade === priorityFilter;
            var matchSearch = !searchFilter || 
                request.nome.toLowerCase().indexOf(searchFilter) !== -1 ||
                request.descricao.toLowerCase().indexOf(searchFilter) !== -1;

            return matchStatus && matchPriority && matchSearch;
        });

        renderRequestsTable();
    };

    /**
     * Clear filters
     */
    window.clearFilters = function() {
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-priority').value = '';
        document.getElementById('filter-search').value = '';
        filteredRequests = allRequests;
        renderRequestsTable();
    };

    /**
     * Submit new request
     */
    window.submitRequest = function(event) {
        event.preventDefault();

        var formData = {
            nome: document.getElementById('project-name').value,
            descricao: document.getElementById('project-description').value,
            prioridade: document.getElementById('project-priority').value,
            area: document.getElementById('project-area').value,
            prazo: document.getElementById('project-deadline').value,
            justificativa: document.getElementById('project-justification').value
        };

        // In production, this would submit to Fluig workflow
        console.log('Submitting request:', formData);

        // Show success message
        alert('Solicitação enviada com sucesso!\n\nProjeto: ' + formData.nome);

        // Close drawer and reset form
        BevapUtils.closeDrawer('new-request-drawer');
        document.getElementById('new-request-form').reset();

        // Reload requests
        loadRequests();
    };

    /**
     * View request details
     */
    window.viewRequest = function(requestId) {
        var request = allRequests.find(function(r) { return r.id === requestId; });
        if (request) {
            alert('Visualizar solicitação #' + requestId + '\n\n' +
                'Nome: ' + request.nome + '\n' +
                'Descrição: ' + request.descricao + '\n' +
                'Área: ' + request.area + '\n' +
                'Prioridade: ' + getPrioridadeText(request.prioridade) + '\n' +
                'Status: ' + getStatusText(request.status));
        }
    };

    /**
     * Edit request
     */
    window.editRequest = function(requestId) {
        alert('Editar solicitação #' + requestId);
        // In production, this would open the edit drawer
    };

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSolicitacao);
    } else {
        initSolicitacao();
    }
})();
