/**
 * BEVAP Backlog Widget - ES5 Compatible
 * Manage backlog items with prioritization
 */

(function() {
    'use strict';

    var allItems = [];
    var filteredItems = [];

    function initBacklog() {
        BevapUtils.showLoading('backlog-table');
        setTimeout(function() { loadBacklogItems(); }, 800);
    }

    function loadBacklogItems() {
        allItems = [
            { id: 1, titulo: 'Implementar autenticação SSO', tipo: 'feature', prioridade: 'critica', estimativa: 13, pontos: 0, descricao: 'Single Sign-On com Azure AD' },
            { id: 2, titulo: 'Corrigir bug de sessão', tipo: 'bug', prioridade: 'alta', estimativa: 5, pontos: 0, descricao: 'Sessão expira incorretamente' },
            { id: 3, titulo: 'Otimizar queries do banco', tipo: 'improvement', prioridade: 'media', estimativa: 8, pontos: 0, descricao: 'Melhorar performance de consultas' },
            { id: 4, titulo: 'Dashboard de métricas', tipo: 'feature', prioridade: 'alta', estimativa: 21, pontos: 0, descricao: 'Dashboard com KPIs principais' },
            { id: 5, titulo: 'Internacionalização', tipo: 'feature', prioridade: 'baixa', estimativa: 13, pontos: 0, descricao: 'Suporte a múltiplos idiomas' },
            { id: 6, titulo: 'Exportar relatórios PDF', tipo: 'feature', prioridade: 'media', estimativa: 8, pontos: 0, descricao: 'Gerar relatórios em PDF' }
        ];

        filteredItems = allItems;
        renderBacklogTable();
    }

    function renderBacklogTable() {
        var container = document.getElementById('backlog-table');
        if (!container) return;

        if (filteredItems.length === 0) {
            BevapUtils.showEmpty('backlog-table', 'Nenhum item no backlog');
            return;
        }

        var html = '<div class="overflow-x-auto">' +
            '<table class="min-w-full divide-y divide-gray-200">' +
            '  <thead class="bg-gray-50">' +
            '    <tr>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimativa</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>' +
            '    </tr>' +
            '  </thead>' +
            '  <tbody class="bg-white divide-y divide-gray-200">';

        for (var i = 0; i < filteredItems.length; i++) {
            var item = filteredItems[i];
            var tipoClass = getTipoClass(item.tipo);
            var tipoText = getTipoText(item.tipo);
            var prioridadeClass = getPrioridadeClass(item.prioridade);
            var prioridadeText = getPrioridadeText(item.prioridade);

            html += '<tr class="hover:bg-gray-50">' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#' + item.id + '</td>' +
                '      <td class="px-6 py-4">' +
                '        <div class="text-sm font-medium text-bevap-dark">' + BevapUtils.escapeHtml(item.titulo) + '</div>' +
                '        <div class="text-sm text-gray-500">' + BevapUtils.escapeHtml(item.descricao) + '</div>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap">' +
                '        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + tipoClass + '">' + tipoText + '</span>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap">' +
                '        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + prioridadeClass + '">' + prioridadeText + '</span>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + item.estimativa + ' pts</td>' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
                '        <button onclick="moveToPlanning(' + item.id + ')" class="text-bevap-primary hover:text-bevap-primary focus-bevap" aria-label="Mover para planejamento">Planejar</button>' +
                '      </td>' +
                '    </tr>';
        }

        html += '  </tbody></table></div>';
        container.innerHTML = html;
    }

    function getTipoClass(tipo) {
        return { 'feature': 'bg-blue-100 text-blue-800', 'bug': 'bg-red-100 text-red-800', 'improvement': 'bg-green-100 text-green-800' }[tipo] || 'bg-gray-100 text-gray-800';
    }

    function getTipoText(tipo) {
        return { 'feature': 'Feature', 'bug': 'Bug', 'improvement': 'Melhoria' }[tipo] || tipo;
    }

    function getPrioridadeClass(prioridade) {
        return { 'critica': 'bg-red-100 text-red-800', 'alta': 'bg-orange-100 text-orange-800', 'media': 'bg-yellow-100 text-yellow-800', 'baixa': 'bg-green-100 text-green-800' }[prioridade] || 'bg-gray-100 text-gray-800';
    }

    function getPrioridadeText(prioridade) {
        return { 'critica': 'Crítica', 'alta': 'Alta', 'media': 'Média', 'baixa': 'Baixa' }[prioridade] || prioridade;
    }

    window.applyBacklogFilters = function() {
        var priorityFilter = document.getElementById('filter-priority-backlog').value;
        var typeFilter = document.getElementById('filter-type-backlog').value;
        
        filteredItems = allItems.filter(function(item) {
            return (!priorityFilter || item.prioridade === priorityFilter) && (!typeFilter || item.tipo === typeFilter);
        });
        renderBacklogTable();
    };

    window.clearBacklogFilters = function() {
        document.getElementById('filter-priority-backlog').value = '';
        document.getElementById('filter-type-backlog').value = '';
        filteredItems = allItems;
        renderBacklogTable();
    };

    window.moveToPlanning = function(itemId) {
        alert('Mover item #' + itemId + ' para planejamento');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBacklog);
    } else {
        initBacklog();
    }
})();
