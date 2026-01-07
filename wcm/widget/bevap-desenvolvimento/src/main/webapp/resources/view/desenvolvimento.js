/**
 * BEVAP Desenvolvimento Widget - ES5 Compatible
 * Track development progress of projects
 */

(function() {
    'use strict';

    var projects = [];

    /**
     * Initialize desenvolvimento widget
     */
    function initDesenvolvimento() {
        BevapUtils.showLoading('dev-projects');
        
        setTimeout(function() {
            loadProjects();
        }, 800);
    }

    /**
     * Load development projects
     */
    function loadProjects() {
        // Simulated data
        projects = [
            { id: 1, nome: 'Portal de Autoatendimento', sprint: 'Sprint 3', progresso: 65, tarefasConcluidas: 13, tarefasTotal: 20, responsavel: 'Maria Silva', dataInicio: '2025-12-15', dataPrevisao: '2026-02-15' },
            { id: 2, nome: 'Mobile App BEVAP', sprint: 'Sprint 2', progresso: 40, tarefasConcluidas: 8, tarefasTotal: 20, responsavel: 'Pedro Lima', dataInicio: '2026-01-02', dataPrevisao: '2026-03-02' },
            { id: 3, nome: 'Dashboard Executivo', sprint: 'Sprint 4', progresso: 85, tarefasConcluidas: 17, tarefasTotal: 20, responsavel: 'Carlos Oliveira', dataInicio: '2025-11-20', dataPrevisao: '2026-01-20' },
            { id: 4, nome: 'API Gateway', sprint: 'Sprint 1', progresso: 25, tarefasConcluidas: 5, tarefasTotal: 20, responsavel: 'Ricardo Mendes', dataInicio: '2026-01-05', dataPrevisao: '2026-03-05' }
        ];

        renderProjects();
    }

    /**
     * Render development projects
     */
    function renderProjects() {
        var container = document.getElementById('dev-projects');
        if (!container) return;

        if (projects.length === 0) {
            BevapUtils.showEmpty('dev-projects', 'Nenhum projeto em desenvolvimento');
            return;
        }

        var html = '';

        for (var i = 0; i < projects.length; i++) {
            var project = projects[i];
            var progressColor = getProgressColor(project.progresso);

            html += '<article class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">' +
                '  <div class="flex justify-between items-start mb-4">' +
                '    <div>' +
                '      <h2 class="text-xl font-semibold text-bevap-dark mb-1">' + BevapUtils.escapeHtml(project.nome) + '</h2>' +
                '      <p class="text-sm text-gray-600">Responsável: ' + BevapUtils.escapeHtml(project.responsavel) + '</p>' +
                '    </div>' +
                '    <span class="bg-bevap-accent text-bevap-dark px-3 py-1 rounded-full text-sm font-semibold">' + 
                BevapUtils.escapeHtml(project.sprint) + '</span>' +
                '  </div>' +
                
                '  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">' +
                '    <div class="bg-gray-50 rounded-lg p-3">' +
                '      <p class="text-xs text-gray-600 mb-1">Tarefas Concluídas</p>' +
                '      <p class="text-2xl font-bold text-bevap-primary">' + project.tarefasConcluidas + '/' + project.tarefasTotal + '</p>' +
                '    </div>' +
                '    <div class="bg-gray-50 rounded-lg p-3">' +
                '      <p class="text-xs text-gray-600 mb-1">Data de Início</p>' +
                '      <p class="text-lg font-semibold text-gray-800">' + BevapUtils.formatDate(project.dataInicio) + '</p>' +
                '    </div>' +
                '    <div class="bg-gray-50 rounded-lg p-3">' +
                '      <p class="text-xs text-gray-600 mb-1">Previsão de Entrega</p>' +
                '      <p class="text-lg font-semibold text-gray-800">' + BevapUtils.formatDate(project.dataPrevisao) + '</p>' +
                '    </div>' +
                '  </div>' +
                
                '  <div class="mb-4">' +
                '    <div class="flex justify-between items-center mb-2">' +
                '      <span class="text-sm font-medium text-gray-700">Progresso</span>' +
                '      <span class="text-sm font-bold ' + progressColor + '">' + project.progresso + '%</span>' +
                '    </div>' +
                '    <div class="w-full bg-gray-200 rounded-full h-3">' +
                '      <div class="' + progressColor + ' h-3 rounded-full transition-all duration-300" style="width: ' + project.progresso + '%" role="progressbar" aria-valuenow="' + project.progresso + '" aria-valuemin="0" aria-valuemax="100"></div>' +
                '    </div>' +
                '  </div>' +
                
                '  <div class="flex gap-2">' +
                '    <button onclick="viewProjectDetails(' + project.id + ')" class="flex-1 px-4 py-2 bg-bevap-primary text-white rounded-md hover:bg-bevap-primary focus-bevap">Ver Detalhes</button>' +
                '    <button onclick="viewProjectTasks(' + project.id + ')" class="flex-1 px-4 py-2 border border-bevap-primary text-bevap-primary rounded-md hover:bg-bevap-primary hover:text-white focus-bevap transition-colors">Tarefas</button>' +
                '  </div>' +
                '</article>';
        }

        container.innerHTML = html;
    }

    /**
     * Get progress bar color based on percentage
     */
    function getProgressColor(progresso) {
        if (progresso >= 80) return 'bg-green-500 text-green-700';
        if (progresso >= 50) return 'bg-bevap-accent text-yellow-700';
        if (progresso >= 30) return 'bg-blue-500 text-blue-700';
        return 'bg-red-500 text-red-700';
    }

    /**
     * View project details
     */
    window.viewProjectDetails = function(projectId) {
        var project = projects.find(function(p) { return p.id === projectId; });
        if (project) {
            alert('Detalhes do Projeto #' + projectId + '\n\n' +
                'Nome: ' + project.nome + '\n' +
                'Sprint: ' + project.sprint + '\n' +
                'Responsável: ' + project.responsavel + '\n' +
                'Progresso: ' + project.progresso + '%\n' +
                'Tarefas: ' + project.tarefasConcluidas + '/' + project.tarefasTotal + '\n' +
                'Início: ' + BevapUtils.formatDate(project.dataInicio) + '\n' +
                'Previsão: ' + BevapUtils.formatDate(project.dataPrevisao));
        }
    };

    /**
     * View project tasks
     */
    window.viewProjectTasks = function(projectId) {
        alert('Visualizar tarefas do projeto #' + projectId);
    };

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDesenvolvimento);
    } else {
        initDesenvolvimento();
    }
})();
