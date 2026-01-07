/**
 * BEVAP Planejamento Widget - ES5 Compatible
 * Kanban board for project planning
 */

(function() {
    'use strict';

    var tasks = [];
    var draggedElement = null;

    /**
     * Initialize planejamento widget
     */
    function initPlanejamento() {
        showLoadingState();
        
        // Simulate data loading
        setTimeout(function() {
            loadTasks();
        }, 800);
    }

    /**
     * Show loading state in all columns
     */
    function showLoadingState() {
        var columns = ['backlog', 'todo', 'analysis', 'approved', 'ready'];
        for (var i = 0; i < columns.length; i++) {
            var column = document.getElementById('column-' + columns[i]);
            if (column) {
                column.innerHTML = '<div class="flex justify-center py-8"><div class="bevap-spinner"></div></div>';
            }
        }
    }

    /**
     * Load tasks data
     */
    function loadTasks() {
        // Simulated data
        tasks = [
            { id: 1, titulo: 'Portal de Autoatendimento', descricao: 'Desenvolver portal web para colaboradores', prioridade: 'alta', responsavel: 'Maria Silva', status: 'backlog' },
            { id: 2, titulo: 'Integração SAP-Fluig', descricao: 'Integrar sistemas SAP com Fluig', prioridade: 'critica', responsavel: 'João Santos', status: 'analysis' },
            { id: 3, titulo: 'Workflow de Compras', descricao: 'Automatizar processo de aprovação de compras', prioridade: 'media', responsavel: 'Ana Costa', status: 'todo' },
            { id: 4, titulo: 'Dashboard Executivo', descricao: 'Criar painéis para diretoria', prioridade: 'alta', responsavel: 'Carlos Oliveira', status: 'approved' },
            { id: 5, titulo: 'Mobile App BEVAP', descricao: 'Aplicativo mobile para gestão', prioridade: 'alta', responsavel: 'Pedro Lima', status: 'ready' },
            { id: 6, titulo: 'Sistema de Tickets', descricao: 'Gestão de chamados de TI', prioridade: 'media', responsavel: 'Lucia Ferreira', status: 'backlog' },
            { id: 7, titulo: 'Relatórios Financeiros', descricao: 'Automatizar geração de relatórios', prioridade: 'baixa', responsavel: 'Roberto Alves', status: 'todo' },
            { id: 8, titulo: 'Intranet BEVAP', descricao: 'Nova intranet corporativa', prioridade: 'media', responsavel: 'Fernanda Costa', status: 'analysis' },
            { id: 9, titulo: 'API Gateway', descricao: 'Centralizador de APIs', prioridade: 'alta', responsavel: 'Ricardo Mendes', status: 'approved' }
        ];

        renderKanbanBoard();
    }

    /**
     * Render kanban board
     */
    function renderKanbanBoard() {
        var columns = ['backlog', 'todo', 'analysis', 'approved', 'ready'];
        
        // Clear all columns
        for (var i = 0; i < columns.length; i++) {
            var columnId = 'column-' + columns[i];
            var column = document.getElementById(columnId);
            if (column) {
                column.innerHTML = '';
            }
        }

        // Add tasks to columns
        for (var j = 0; j < tasks.length; j++) {
            var task = tasks[j];
            addTaskToColumn(task);
        }

        // Update counters
        updateCounters();

        // Enable drag and drop
        setupDragAndDrop();
    }

    /**
     * Add task card to column
     */
    function addTaskToColumn(task) {
        var column = document.getElementById('column-' + task.status);
        if (!column) return;

        var prioridadeClass = getPrioridadeClass(task.prioridade);
        var prioridadeText = getPrioridadeText(task.prioridade);

        var card = document.createElement('div');
        card.className = 'kanban-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
        card.draggable = true;
        card.setAttribute('data-task-id', task.id);
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', task.titulo);
        
        card.innerHTML = 
            '<div class="flex items-start justify-between mb-2">' +
            '  <h3 class="font-semibold text-gray-900 text-sm">' + BevapUtils.escapeHtml(task.titulo) + '</h3>' +
            '  <span class="ml-2 px-2 py-0.5 text-xs font-semibold rounded ' + prioridadeClass + '">' + prioridadeText + '</span>' +
            '</div>' +
            '<p class="text-sm text-gray-600 mb-3">' + BevapUtils.escapeHtml(task.descricao) + '</p>' +
            '<div class="flex items-center justify-between text-xs text-gray-500">' +
            '  <div class="flex items-center">' +
            '    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
            '      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>' +
            '    </svg>' +
            '    <span>' + BevapUtils.escapeHtml(task.responsavel) + '</span>' +
            '  </div>' +
            '  <button onclick="viewTask(' + task.id + ')" class="text-bevap-primary hover:text-bevap-primary focus-bevap" aria-label="Ver detalhes de ' + BevapUtils.escapeHtml(task.titulo) + '">Ver</button>' +
            '</div>';

        column.appendChild(card);
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
     * Update column counters
     */
    function updateCounters() {
        var columns = ['backlog', 'todo', 'analysis', 'approved', 'ready'];
        
        for (var i = 0; i < columns.length; i++) {
            var status = columns[i];
            var count = tasks.filter(function(t) { return t.status === status; }).length;
            var counter = document.getElementById('count-' + status);
            if (counter) {
                counter.textContent = count;
            }
        }
    }

    /**
     * Setup drag and drop functionality
     */
    function setupDragAndDrop() {
        var cards = document.querySelectorAll('.kanban-card');
        var columns = document.querySelectorAll('.kanban-column');

        // Add drag event listeners to cards
        for (var i = 0; i < cards.length; i++) {
            cards[i].addEventListener('dragstart', handleDragStart);
            cards[i].addEventListener('dragend', handleDragEnd);
        }

        // Add drop event listeners to columns
        for (var j = 0; j < columns.length; j++) {
            columns[j].addEventListener('dragover', handleDragOver);
            columns[j].addEventListener('drop', handleDrop);
            columns[j].addEventListener('dragenter', handleDragEnter);
            columns[j].addEventListener('dragleave', handleDragLeave);
        }
    }

    /**
     * Handle drag start
     */
    function handleDragStart(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    /**
     * Handle drag end
     */
    function handleDragEnd(e) {
        this.classList.remove('dragging');
        
        // Remove drag-over styling from all columns
        var columns = document.querySelectorAll('.kanban-column');
        for (var i = 0; i < columns.length; i++) {
            columns[i].classList.remove('bg-gray-100');
        }
    }

    /**
     * Handle drag over
     */
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    /**
     * Handle drag enter
     */
    function handleDragEnter(e) {
        this.classList.add('bg-gray-100');
    }

    /**
     * Handle drag leave
     */
    function handleDragLeave(e) {
        this.classList.remove('bg-gray-100');
    }

    /**
     * Handle drop
     */
    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        this.classList.remove('bg-gray-100');

        if (draggedElement) {
            var taskId = parseInt(draggedElement.getAttribute('data-task-id'));
            var newStatus = this.getAttribute('data-status');
            
            // Update task status
            for (var i = 0; i < tasks.length; i++) {
                if (tasks[i].id === taskId) {
                    tasks[i].status = newStatus;
                    break;
                }
            }

            // Re-render board
            renderKanbanBoard();

            // Show success message
            console.log('Task moved to:', newStatus);
        }

        return false;
    }

    /**
     * View task details
     */
    window.viewTask = function(taskId) {
        var task = tasks.find(function(t) { return t.id === taskId; });
        if (task) {
            alert('Detalhes da Tarefa #' + taskId + '\n\n' +
                'Título: ' + task.titulo + '\n' +
                'Descrição: ' + task.descricao + '\n' +
                'Responsável: ' + task.responsavel + '\n' +
                'Prioridade: ' + getPrioridadeText(task.prioridade) + '\n' +
                'Status: ' + getStatusText(task.status));
        }
    };

    /**
     * Get status display text
     */
    function getStatusText(status) {
        var texts = {
            'backlog': 'Backlog',
            'todo': 'A Fazer',
            'analysis': 'Em Análise',
            'approved': 'Aprovado',
            'ready': 'Pronto para Desenvolvimento'
        };
        return texts[status] || status;
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlanejamento);
    } else {
        initPlanejamento();
    }
})();
