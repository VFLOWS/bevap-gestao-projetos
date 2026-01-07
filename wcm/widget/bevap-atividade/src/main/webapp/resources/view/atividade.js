/**
 * BEVAP Atividade Widget - ES5 Compatible
 */

(function() {
    'use strict';

    function initAtividade() {
        BevapUtils.showLoading('activity-timeline');
        setTimeout(function() { loadActivities(); }, 800);
    }

    function loadActivities() {
        var activities = [
            { id: 1, tipo: 'criacao', titulo: 'Projeto criado', usuario: 'Maria Silva', data: '2026-01-07T10:00:00', descricao: 'Projeto "Portal de Autoatendimento" foi criado' },
            { id: 2, tipo: 'atualizacao', titulo: 'Status atualizado', usuario: 'João Santos', data: '2026-01-07T11:30:00', descricao: 'Status alterado para "Em Desenvolvimento"' },
            { id: 3, tipo: 'comentario', titulo: 'Comentário adicionado', usuario: 'Ana Costa', data: '2026-01-07T14:15:00', descricao: 'Revisão de requisitos concluída' },
            { id: 4, tipo: 'tarefa', titulo: 'Tarefa concluída', usuario: 'Carlos Oliveira', data: '2026-01-07T16:45:00', descricao: 'Implementação do módulo de login' }
        ];

        var container = document.getElementById('activity-timeline');
        if (!container) return;

        var html = '<div class="space-y-4">';
        for (var i = 0; i < activities.length; i++) {
            var activity = activities[i];
            var iconColor = getActivityIconColor(activity.tipo);
            
            html += '<div class="flex gap-4">' +
                '  <div class="flex-shrink-0">' +
                '    <div class="w-10 h-10 rounded-full ' + iconColor + ' flex items-center justify-center" aria-hidden="true">' +
                getActivityIcon(activity.tipo) +
                '    </div>' +
                '  </div>' +
                '  <div class="flex-1">' +
                '    <div class="bg-gray-50 rounded-lg p-4">' +
                '      <div class="flex justify-between items-start mb-2">' +
                '        <h3 class="font-semibold text-bevap-dark">' + BevapUtils.escapeHtml(activity.titulo) + '</h3>' +
                '        <span class="text-xs text-gray-500">' + BevapUtils.formatDateTime(activity.data) + '</span>' +
                '      </div>' +
                '      <p class="text-sm text-gray-600 mb-2">' + BevapUtils.escapeHtml(activity.descricao) + '</p>' +
                '      <p class="text-xs text-gray-500">Por: ' + BevapUtils.escapeHtml(activity.usuario) + '</p>' +
                '    </div>' +
                '  </div>' +
                '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    }

    function getActivityIconColor(tipo) {
        return { 'criacao': 'bg-bevap-primary text-white', 'atualizacao': 'bg-bevap-accent text-bevap-dark', 'comentario': 'bg-blue-500 text-white', 'tarefa': 'bg-green-500 text-white' }[tipo] || 'bg-gray-500 text-white';
    }

    function getActivityIcon(tipo) {
        var icons = {
            'criacao': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>',
            'atualizacao': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
            'comentario': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>',
            'tarefa': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
        };
        return icons[tipo] || '';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAtividade);
    } else {
        initAtividade();
    }
})();
