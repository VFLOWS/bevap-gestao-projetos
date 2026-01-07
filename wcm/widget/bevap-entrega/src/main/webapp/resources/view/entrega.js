/**
 * BEVAP Entrega Widget - ES5 Compatible
 */

(function() {
    'use strict';

    function initEntrega() {
        loadGoLive();
        loadTreinamentos();
        loadEncerramento();
    }

    window.showEntregaTab = function(tab) {
        var tabs = ['golive', 'treinamentos', 'encerramento'];
        for (var i = 0; i < tabs.length; i++) {
            var tabName = tabs[i];
            var btn = document.getElementById('tab-' + tabName);
            var panel = document.getElementById('panel-' + tabName);
            
            if (tabName === tab) {
                btn.className = 'px-4 py-2 font-medium rounded-lg bg-bevap-primary text-white focus-bevap';
                btn.setAttribute('aria-selected', 'true');
                panel.className = '';
            } else {
                btn.className = 'px-4 py-2 font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap';
                btn.setAttribute('aria-selected', 'false');
                panel.className = 'hidden';
            }
        }
    };

    function loadGoLive() {
        var checklist = [
            { id: 1, item: 'Testes de integração concluídos', concluido: true },
            { id: 2, item: 'Ambiente de produção preparado', concluido: true },
            { id: 3, item: 'Backup de segurança realizado', concluido: true },
            { id: 4, item: 'Documentação atualizada', concluido: false },
            { id: 5, item: 'Plano de rollback preparado', concluido: false },
            { id: 6, item: 'Comunicação aos usuários enviada', concluido: false }
        ];

        var completed = checklist.filter(function(i) { return i.concluido; }).length;
        var total = checklist.length;
        var progress = Math.round((completed / total) * 100);

        var html = '<h2 class="text-xl font-semibold text-bevap-dark mb-4">Checklist de Go-Live</h2>' +
            '<div class="mb-6">' +
            '  <div class="flex justify-between mb-2">' +
            '    <span class="text-sm font-medium">Progresso</span>' +
            '    <span class="text-sm font-bold text-bevap-primary">' + completed + '/' + total + ' (' + progress + '%)</span>' +
            '  </div>' +
            '  <div class="w-full bg-gray-200 rounded-full h-3">' +
            '    <div class="bg-bevap-primary h-3 rounded-full" style="width: ' + progress + '%" role="progressbar"></div>' +
            '  </div>' +
            '</div>' +
            '<div class="space-y-3">';

        for (var i = 0; i < checklist.length; i++) {
            var item = checklist[i];
            html += '<label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">' +
                '  <input type="checkbox" ' + (item.concluido ? 'checked' : '') + ' onchange="toggleChecklistItem(' + item.id + ')" class="w-5 h-5 text-bevap-primary focus-bevap">' +
                '  <span class="text-gray-900 ' + (item.concluido ? 'line-through' : '') + '">' + BevapUtils.escapeHtml(item.item) + '</span>' +
                '</label>';
        }

        html += '</div>';
        document.getElementById('golive-content').innerHTML = html;
    }

    function loadTreinamentos() {
        var trainings = [
            { id: 1, nome: 'Treinamento Usuários Finais', data: '2026-01-15', participantes: 25, status: 'agendado' },
            { id: 2, nome: 'Treinamento Administradores', data: '2026-01-12', participantes: 8, status: 'concluido' },
            { id: 3, nome: 'Workshop Avançado', data: '2026-01-20', participantes: 12, status: 'agendado' }
        ];

        var html = '<h2 class="text-xl font-semibold text-bevap-dark mb-4">Treinamentos Planejados</h2>' +
            '<div class="space-y-4">';

        for (var i = 0; i < trainings.length; i++) {
            var training = trainings[i];
            var statusClass = training.status === 'concluido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            var statusText = training.status === 'concluido' ? 'Concluído' : 'Agendado';

            html += '<div class="border border-gray-200 rounded-lg p-4">' +
                '  <div class="flex justify-between items-start mb-2">' +
                '    <h3 class="font-semibold text-bevap-dark">' + BevapUtils.escapeHtml(training.nome) + '</h3>' +
                '    <span class="px-2 py-1 text-xs font-semibold rounded-full ' + statusClass + '">' + statusText + '</span>' +
                '  </div>' +
                '  <p class="text-sm text-gray-600 mb-2">Data: ' + BevapUtils.formatDate(training.data) + '</p>' +
                '  <p class="text-sm text-gray-600">Participantes: ' + training.participantes + '</p>' +
                '</div>';
        }

        html += '</div>';
        document.getElementById('treinamentos-content').innerHTML = html;
    }

    function loadEncerramento() {
        var html = '<h2 class="text-xl font-semibold text-bevap-dark mb-4">Encerramento do Projeto</h2>' +
            '<div class="space-y-6">' +
            '  <div class="border-l-4 border-bevap-primary bg-blue-50 p-4 rounded">' +
            '    <h3 class="font-semibold text-bevap-dark mb-2">Lições Aprendidas</h3>' +
            '    <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap" rows="4" placeholder="Descreva as lições aprendidas..."></textarea>' +
            '  </div>' +
            '  <div class="border-l-4 border-bevap-accent bg-yellow-50 p-4 rounded">' +
            '    <h3 class="font-semibold text-bevap-dark mb-2">Documentação Final</h3>' +
            '    <div class="space-y-2">' +
            '      <label class="flex items-center gap-2"><input type="checkbox" class="focus-bevap"> Manual do Usuário</label>' +
            '      <label class="flex items-center gap-2"><input type="checkbox" class="focus-bevap"> Documentação Técnica</label>' +
            '      <label class="flex items-center gap-2"><input type="checkbox" class="focus-bevap"> Termo de Aceite</label>' +
            '    </div>' +
            '  </div>' +
            '  <button onclick="finalizarProjeto()" class="w-full px-6 py-3 bg-bevap-primary text-white rounded-lg hover:bg-bevap-primary focus-bevap font-semibold">Finalizar Projeto</button>' +
            '</div>';
        
        document.getElementById('encerramento-content').innerHTML = html;
    }

    window.toggleChecklistItem = function(itemId) {
        console.log('Toggle checklist item:', itemId);
    };

    window.finalizarProjeto = function() {
        if (confirm('Deseja realmente finalizar o projeto?')) {
            alert('Projeto finalizado com sucesso!');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEntrega);
    } else {
        initEntrega();
    }
})();
