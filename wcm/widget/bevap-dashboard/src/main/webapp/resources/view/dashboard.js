/**
 * BEVAP Dashboard Widget - ES5 Compatible
 * Displays KPIs and recent projects
 */

(function() {
    'use strict';

    /**
     * Initialize dashboard
     */
    function initDashboard() {
        // Show loading state
        BevapUtils.showLoading('dashboard-content');
        BevapUtils.showLoading('recent-projects');
        
        // Simulate data loading (in production, this would be an API call)
        setTimeout(function() {
            loadKPIs();
            loadRecentProjects();
        }, 1000);
    }

    /**
     * Load KPI data
     */
    function loadKPIs() {
        // Simulated data - In production, fetch from Fluig dataset or API
        var kpiData = {
            totalProjetos: 42,
            emDesenvolvimento: 15,
            aguardandoValidacao: 8,
            concluidos: 19
        };

        // Update KPI values with animation
        animateValue('kpi-total-projetos', 0, kpiData.totalProjetos, 1000);
        animateValue('kpi-em-desenvolvimento', 0, kpiData.emDesenvolvimento, 1000);
        animateValue('kpi-validacao', 0, kpiData.aguardandoValidacao, 1000);
        animateValue('kpi-concluidos', 0, kpiData.concluidos, 1000);

        // Show chart in content area
        showDashboardChart();
    }

    /**
     * Animate KPI value counter
     */
    function animateValue(elementId, start, end, duration) {
        var element = document.getElementById(elementId);
        if (!element) return;

        var range = end - start;
        var increment = range / (duration / 16); // 60fps
        var current = start;

        var timer = setInterval(function() {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }

    /**
     * Show dashboard chart
     */
    function showDashboardChart() {
        var content = document.getElementById('dashboard-content');
        if (!content) return;

        content.innerHTML = 
            '<div class="space-y-4">' +
            '  <h3 class="text-lg font-semibold text-bevap-dark">Distribuição por Status</h3>' +
            '  <div class="space-y-3">' +
            '    <div>' +
            '      <div class="flex justify-between mb-1">' +
            '        <span class="text-sm text-gray-600">Planejamento</span>' +
            '        <span class="text-sm font-semibold text-bevap-dark">10%</span>' +
            '      </div>' +
            '      <div class="w-full bg-gray-200 rounded-full h-2.5">' +
            '        <div class="bg-bevap-dark h-2.5 rounded-full" style="width: 10%" role="progressbar" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>' +
            '      </div>' +
            '    </div>' +
            '    <div>' +
            '      <div class="flex justify-between mb-1">' +
            '        <span class="text-sm text-gray-600">Desenvolvimento</span>' +
            '        <span class="text-sm font-semibold text-bevap-dark">36%</span>' +
            '      </div>' +
            '      <div class="w-full bg-gray-200 rounded-full h-2.5">' +
            '        <div class="bg-bevap-accent h-2.5 rounded-full" style="width: 36%" role="progressbar" aria-valuenow="36" aria-valuemin="0" aria-valuemax="100"></div>' +
            '      </div>' +
            '    </div>' +
            '    <div>' +
            '      <div class="flex justify-between mb-1">' +
            '        <span class="text-sm text-gray-600">Validação</span>' +
            '        <span class="text-sm font-semibold text-bevap-dark">19%</span>' +
            '      </div>' +
            '      <div class="w-full bg-gray-200 rounded-full h-2.5">' +
            '        <div class="bg-blue-500 h-2.5 rounded-full" style="width: 19%" role="progressbar" aria-valuenow="19" aria-valuemin="0" aria-valuemax="100"></div>' +
            '      </div>' +
            '    </div>' +
            '    <div>' +
            '      <div class="flex justify-between mb-1">' +
            '        <span class="text-sm text-gray-600">Entrega</span>' +
            '        <span class="text-sm font-semibold text-bevap-dark">45%</span>' +
            '      </div>' +
            '      <div class="w-full bg-gray-200 rounded-full h-2.5">' +
            '        <div class="bg-bevap-primary h-2.5 rounded-full" style="width: 45%" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
    }

    /**
     * Load recent projects
     */
    function loadRecentProjects() {
        // Simulated data - In production, fetch from Fluig dataset or API
        var projects = [
            { id: 1, nome: 'Portal de Autoatendimento', status: 'Desenvolvimento', prioridade: 'Alta', dataAtualizacao: '2026-01-07' },
            { id: 2, nome: 'Integração SAP-Fluig', status: 'Validação TI', prioridade: 'Crítica', dataAtualizacao: '2026-01-06' },
            { id: 3, nome: 'Workflow de Compras', status: 'Planejamento', prioridade: 'Média', dataAtualizacao: '2026-01-05' },
            { id: 4, nome: 'Dashboard Executivo', status: 'Go-Live', prioridade: 'Alta', dataAtualizacao: '2026-01-04' },
            { id: 5, nome: 'Mobile App BEVAP', status: 'Desenvolvimento', prioridade: 'Alta', dataAtualizacao: '2026-01-03' }
        ];

        var container = document.getElementById('recent-projects');
        if (!container) return;

        if (projects.length === 0) {
            BevapUtils.showEmpty('recent-projects', 'Nenhum projeto encontrado');
            return;
        }

        var html = '<div class="overflow-x-auto">' +
            '<table class="min-w-full divide-y divide-gray-200">' +
            '  <thead class="bg-gray-50">' +
            '    <tr>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atualização</th>' +
            '      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>' +
            '    </tr>' +
            '  </thead>' +
            '  <tbody class="bg-white divide-y divide-gray-200">';

        for (var i = 0; i < projects.length; i++) {
            var project = projects[i];
            var statusClass = getStatusClass(project.status);
            var prioridadeClass = getPrioridadeClass(project.prioridade);

            html += '<tr class="hover:bg-gray-50">' +
                '      <td class="px-6 py-4 whitespace-nowrap">' +
                '        <div class="text-sm font-medium text-bevap-dark">' + BevapUtils.escapeHtml(project.nome) + '</div>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap">' +
                '        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + statusClass + '">' + 
                BevapUtils.escapeHtml(project.status) + '</span>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap">' +
                '        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + prioridadeClass + '">' + 
                BevapUtils.escapeHtml(project.prioridade) + '</span>' +
                '      </td>' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + 
                BevapUtils.formatDate(project.dataAtualizacao) + '</td>' +
                '      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
                '        <button onclick="viewProject(' + project.id + ')" class="text-bevap-primary hover:text-bevap-primary focus-bevap" aria-label="Ver projeto ' + BevapUtils.escapeHtml(project.nome) + '">Ver</button>' +
                '      </td>' +
                '    </tr>';
        }

        html += '  </tbody>' +
            '</table>' +
            '</div>';

        container.innerHTML = html;
    }

    /**
     * Get status badge class
     */
    function getStatusClass(status) {
        var classes = {
            'Planejamento': 'bg-bevap-dark text-white',
            'Desenvolvimento': 'bg-bevap-accent text-bevap-dark',
            'Validação TI': 'bg-blue-100 text-blue-800',
            'Go-Live': 'bg-bevap-primary text-white',
            'Concluído': 'bg-green-100 text-green-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Get priority badge class
     */
    function getPrioridadeClass(prioridade) {
        var classes = {
            'Crítica': 'bg-red-100 text-red-800',
            'Alta': 'bg-orange-100 text-orange-800',
            'Média': 'bg-yellow-100 text-yellow-800',
            'Baixa': 'bg-green-100 text-green-800'
        };
        return classes[prioridade] || 'bg-gray-100 text-gray-800';
    }

    /**
     * View project details (placeholder)
     */
    window.viewProject = function(projectId) {
        alert('Visualizar projeto #' + projectId);
        // In production, this would navigate to the project details or open a modal
    };

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
