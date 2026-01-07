/**
 * BEVAP Shared Utilities - ES5 Compatible
 * Common functions for all widgets
 */

var BevapUtils = (function() {
    'use strict';

    /**
     * Show loading state
     */
    function showLoading(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = 
            '<div class="flex items-center justify-center p-8" role="status" aria-live="polite">' +
            '  <div class="bevap-spinner" aria-label="Carregando..."></div>' +
            '  <span class="ml-3 text-gray-600">Carregando...</span>' +
            '</div>';
    }

    /**
     * Show empty state
     */
    function showEmpty(containerId, message) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        var msg = message || 'Nenhum dado disponível';
        container.innerHTML = 
            '<div class="flex flex-col items-center justify-center p-8 text-center" role="alert" aria-live="polite">' +
            '  <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
            '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>' +
            '  </svg>' +
            '  <p class="text-gray-600 text-lg">' + msg + '</p>' +
            '</div>';
    }

    /**
     * Show error state
     */
    function showError(containerId, errorMessage) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        var msg = errorMessage || 'Ocorreu um erro ao carregar os dados';
        container.innerHTML = 
            '<div class="flex flex-col items-center justify-center p-8 text-center" role="alert" aria-live="assertive">' +
            '  <svg class="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
            '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' +
            '  </svg>' +
            '  <p class="text-red-600 text-lg font-semibold mb-2">Erro</p>' +
            '  <p class="text-gray-600">' + msg + '</p>' +
            '  <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-bevap-primary text-white rounded hover:bg-bevap-primary focus-bevap" aria-label="Tentar novamente">Tentar Novamente</button>' +
            '</div>';
    }

    /**
     * Format date to Brazilian format
     */
    function formatDate(dateString) {
        if (!dateString) return '-';
        var date = new Date(dateString);
        var day = ('0' + date.getDate()).slice(-2);
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var year = date.getFullYear();
        return day + '/' + month + '/' + year;
    }

    /**
     * Format date with time
     */
    function formatDateTime(dateString) {
        if (!dateString) return '-';
        var date = new Date(dateString);
        var day = ('0' + date.getDate()).slice(-2);
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var year = date.getFullYear();
        var hours = ('0' + date.getHours()).slice(-2);
        var minutes = ('0' + date.getMinutes()).slice(-2);
        return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
    }

    /**
     * Open drawer
     */
    function openDrawer(drawerId) {
        var drawer = document.getElementById(drawerId);
        if (drawer) {
            drawer.classList.remove('hidden');
            drawer.setAttribute('aria-hidden', 'false');
            // Focus first focusable element
            var focusable = drawer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable) focusable.focus();
        }
    }

    /**
     * Close drawer
     */
    function closeDrawer(drawerId) {
        var drawer = document.getElementById(drawerId);
        if (drawer) {
            drawer.classList.add('hidden');
            drawer.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    /**
     * Make AJAX request (ES5 compatible)
     */
    function ajax(options) {
        var xhr = new XMLHttpRequest();
        var method = options.method || 'GET';
        var url = options.url;
        var success = options.success || function() {};
        var error = options.error || function() {};
        
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    success(response);
                } catch (e) {
                    success(xhr.responseText);
                }
            } else {
                error(xhr);
            }
        };
        
        xhr.onerror = function() {
            error(xhr);
        };
        
        if (options.data) {
            xhr.send(JSON.stringify(options.data));
        } else {
            xhr.send();
        }
    }

    // Public API
    return {
        showLoading: showLoading,
        showEmpty: showEmpty,
        showError: showError,
        formatDate: formatDate,
        formatDateTime: formatDateTime,
        openDrawer: openDrawer,
        closeDrawer: closeDrawer,
        escapeHtml: escapeHtml,
        ajax: ajax
    };
})();
