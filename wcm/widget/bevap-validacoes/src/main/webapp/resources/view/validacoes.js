/**
 * BEVAP Validacoes Widget - ES5 Compatible
 */

(function() {
    'use strict';

    var currentTab = 'solicitante';

    function initValidacoes() {
        loadSolicitanteValidations();
        loadTIValidations();
    }

    window.showTab = function(tab) {
        currentTab = tab;
        
        // Update tab buttons
        document.getElementById('tab-solicitante').className = tab === 'solicitante' ? 
            'px-4 py-2 font-medium rounded-lg bg-bevap-primary text-white focus-bevap' : 
            'px-4 py-2 font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap';
        document.getElementById('tab-solicitante').setAttribute('aria-selected', tab === 'solicitante');
        
        document.getElementById('tab-ti').className = tab === 'ti' ? 
            'px-4 py-2 font-medium rounded-lg bg-bevap-primary text-white focus-bevap' : 
            'px-4 py-2 font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap';
        document.getElementById('tab-ti').setAttribute('aria-selected', tab === 'ti');
        
        // Show/hide panels
        document.getElementById('panel-solicitante').className = tab === 'solicitante' ? '' : 'hidden';
        document.getElementById('panel-ti').className = tab === 'ti' ? '' : 'hidden';
    };

    function loadSolicitanteValidations() {
        var validations = [
            { id: 1, projeto: 'Portal de Autoatendimento', status: 'pendente', data: '2026-01-05' },
            { id: 2, projeto: 'Dashboard Executivo', status: 'aprovado', data: '2026-01-03', feedback: 'Atende aos requisitos' }
        ];

        var html = renderValidationList(validations, 'solicitante');
        document.getElementById('validacao-solicitante-content').innerHTML = html;
    }

    function loadTIValidations() {
        var validations = [
            { id: 1, projeto: 'Integração SAP-Fluig', status: 'pendente', data: '2026-01-06' },
            { id: 2, projeto: 'API Gateway', status: 'aprovado', data: '2026-01-04', feedback: 'Arquitetura aprovada' },
            { id: 3, projeto: 'Mobile App BEVAP', status: 'rejeitado', data: '2026-01-02', feedback: 'Necessita revisão de segurança' }
        ];

        var html = renderValidationList(validations, 'ti');
        document.getElementById('validacao-ti-content').innerHTML = html;
    }

    function renderValidationList(validations, type) {
        var html = '<div class="space-y-4">';
        
        for (var i = 0; i < validations.length; i++) {
            var validation = validations[i];
            var statusClass = getValidationStatusClass(validation.status);
            var statusText = getValidationStatusText(validation.status);
            
            html += '<div class="border border-gray-200 rounded-lg p-4">' +
                '  <div class="flex justify-between items-start mb-2">' +
                '    <h3 class="font-semibold text-bevap-dark">' + BevapUtils.escapeHtml(validation.projeto) + '</h3>' +
                '    <span class="px-2 py-1 text-xs font-semibold rounded-full ' + statusClass + '">' + statusText + '</span>' +
                '  </div>' +
                '  <p class="text-sm text-gray-500 mb-3">Solicitado em: ' + BevapUtils.formatDate(validation.data) + '</p>';
            
            if (validation.feedback) {
                html += '  <div class="bg-gray-50 rounded p-3 mb-3">' +
                    '    <p class="text-sm text-gray-700"><strong>Feedback:</strong> ' + BevapUtils.escapeHtml(validation.feedback) + '</p>' +
                    '  </div>';
            }
            
            if (validation.status === 'pendente') {
                html += '  <div class="flex gap-2">' +
                    '    <button onclick="approveValidation(' + validation.id + ', \'' + type + '\')" class="flex-1 px-4 py-2 bg-bevap-primary text-white rounded-md hover:bg-bevap-primary focus-bevap">Aprovar</button>' +
                    '    <button onclick="rejectValidation(' + validation.id + ', \'' + type + '\')" class="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50 focus-bevap">Rejeitar</button>' +
                    '  </div>';
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    function getValidationStatusClass(status) {
        return { 'pendente': 'bg-yellow-100 text-yellow-800', 'aprovado': 'bg-green-100 text-green-800', 'rejeitado': 'bg-red-100 text-red-800' }[status] || 'bg-gray-100 text-gray-800';
    }

    function getValidationStatusText(status) {
        return { 'pendente': 'Pendente', 'aprovado': 'Aprovado', 'rejeitado': 'Rejeitado' }[status] || status;
    }

    window.approveValidation = function(id, type) {
        alert('Aprovar validação #' + id + ' (' + type + ')');
    };

    window.rejectValidation = function(id, type) {
        var feedback = prompt('Motivo da rejeição:');
        if (feedback) {
            alert('Validação #' + id + ' rejeitada: ' + feedback);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initValidacoes);
    } else {
        initValidacoes();
    }
})();
