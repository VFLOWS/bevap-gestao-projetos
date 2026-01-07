/**
 * BEVAP Templates Widget - ES5 Compatible
 */

(function() {
    'use strict';

    var allTemplates = [];
    var currentCategory = 'all';

    function initTemplates() {
        BevapUtils.showLoading('templates-grid');
        setTimeout(function() { loadTemplates(); }, 800);
    }

    function loadTemplates() {
        allTemplates = [
            { id: 1, nome: 'Workflow de Aprovação', categoria: 'workflow', descricao: 'Template para processos de aprovação', icone: 'workflow' },
            { id: 2, nome: 'Solicitação de Compras', categoria: 'formulario', descricao: 'Formulário padrão para compras', icone: 'form' },
            { id: 3, nome: 'Dashboard Operacional', categoria: 'dashboard', descricao: 'Painel de indicadores operacionais', icone: 'dashboard' },
            { id: 4, nome: 'Workflow de Férias', categoria: 'workflow', descricao: 'Gestão de solicitações de férias', icone: 'workflow' },
            { id: 5, nome: 'Formulário de Feedback', categoria: 'formulario', descricao: 'Coleta de feedback de usuários', icone: 'form' },
            { id: 6, nome: 'Dashboard Executivo', categoria: 'dashboard', descricao: 'Visão executiva de KPIs', icone: 'dashboard' },
            { id: 7, nome: 'Workflow de Onboarding', categoria: 'workflow', descricao: 'Processo de integração de colaboradores', icone: 'workflow' },
            { id: 8, nome: 'Relatório de Projeto', categoria: 'formulario', descricao: 'Template de relatório de status', icone: 'form' }
        ];

        renderTemplates();
    }

    function renderTemplates() {
        var container = document.getElementById('templates-grid');
        if (!container) return;

        var filtered = currentCategory === 'all' ? allTemplates : allTemplates.filter(function(t) { return t.categoria === currentCategory; });

        if (filtered.length === 0) {
            BevapUtils.showEmpty('templates-grid', 'Nenhum template encontrado');
            return;
        }

        var html = '';
        for (var i = 0; i < filtered.length; i++) {
            var template = filtered[i];
            var iconColor = getIconColor(template.categoria);

            html += '<article class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 flex flex-col">' +
                '  <div class="' + iconColor + ' w-12 h-12 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">' +
                getTemplateIcon(template.icone) +
                '  </div>' +
                '  <h3 class="text-lg font-semibold text-bevap-dark mb-2">' + BevapUtils.escapeHtml(template.nome) + '</h3>' +
                '  <p class="text-sm text-gray-600 mb-4 flex-grow">' + BevapUtils.escapeHtml(template.descricao) + '</p>' +
                '  <div class="flex gap-2">' +
                '    <button onclick="previewTemplate(' + template.id + ')" class="flex-1 px-4 py-2 border border-bevap-primary text-bevap-primary rounded-md hover:bg-bevap-primary hover:text-white focus-bevap transition-colors">Visualizar</button>' +
                '    <button onclick="useTemplate(' + template.id + ')" class="flex-1 px-4 py-2 bg-bevap-primary text-white rounded-md hover:bg-bevap-primary focus-bevap">Usar</button>' +
                '  </div>' +
                '</article>';
        }

        container.innerHTML = html;
    }

    function getIconColor(categoria) {
        return { 'workflow': 'bg-bevap-primary bg-opacity-10', 'formulario': 'bg-bevap-accent bg-opacity-10', 'dashboard': 'bg-blue-100' }[categoria] || 'bg-gray-100';
    }

    function getTemplateIcon(tipo) {
        var icons = {
            'workflow': '<svg class="w-6 h-6 text-bevap-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>',
            'form': '<svg class="w-6 h-6 text-bevap-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
            'dashboard': '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>'
        };
        return icons[tipo] || '';
    }

    window.filterTemplates = function(category) {
        currentCategory = category;
        
        // Update button styles
        var categories = ['all', 'workflow', 'formulario', 'dashboard'];
        for (var i = 0; i < categories.length; i++) {
            var cat = categories[i];
            var btn = document.getElementById('cat-' + cat);
            if (btn) {
                btn.className = cat === category ? 
                    'px-4 py-2 rounded-lg bg-bevap-primary text-white focus-bevap' : 
                    'px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap';
            }
        }
        
        renderTemplates();
    };

    window.previewTemplate = function(templateId) {
        var template = allTemplates.find(function(t) { return t.id === templateId; });
        if (template) {
            alert('Visualizar Template\n\n' + template.nome + '\n' + template.descricao);
        }
    };

    window.useTemplate = function(templateId) {
        var template = allTemplates.find(function(t) { return t.id === templateId; });
        if (template) {
            alert('Usando template: ' + template.nome);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTemplates);
    } else {
        initTemplates();
    }
})();
