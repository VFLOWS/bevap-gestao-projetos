<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planejamento BEVAP</title>
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts - Montserrat and Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- BEVAP Shared Styles -->
    <link rel="stylesheet" href="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-colors.css">
    
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Montserrat', sans-serif;
        }
        .kanban-column {
            min-height: 400px;
        }
        .kanban-card {
            cursor: grab;
        }
        .kanban-card:active {
            cursor: grabbing;
        }
        .kanban-card.dragging {
            opacity: 0.5;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div id="bevap-planejamento-widget" class="p-6">
        <!-- Header -->
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-bevap-dark mb-2">Planejamento</h1>
            <p class="text-gray-600">Kanban de planejamento de projetos</p>
        </header>

        <!-- Kanban Board -->
        <section class="overflow-x-auto pb-4" role="region" aria-label="Quadro kanban de planejamento">
            <div id="kanban-board" class="flex gap-4 min-w-max">
                <!-- Backlog Column -->
                <div class="flex-shrink-0 w-80 bg-white rounded-lg shadow">
                    <div class="bg-gray-100 px-4 py-3 rounded-t-lg border-l-4 border-gray-500">
                        <div class="flex items-center justify-between">
                            <h2 class="font-semibold text-gray-800">Backlog</h2>
                            <span class="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full" id="count-backlog" aria-live="polite">0</span>
                        </div>
                    </div>
                    <div id="column-backlog" class="kanban-column p-4 space-y-3" data-status="backlog" role="list" aria-label="Tarefas em backlog">
                        <!-- Cards will be added here -->
                    </div>
                </div>

                <!-- A Fazer Column -->
                <div class="flex-shrink-0 w-80 bg-white rounded-lg shadow">
                    <div class="bg-blue-50 px-4 py-3 rounded-t-lg border-l-4 border-blue-500">
                        <div class="flex items-center justify-between">
                            <h2 class="font-semibold text-blue-800">A Fazer</h2>
                            <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full" id="count-todo" aria-live="polite">0</span>
                        </div>
                    </div>
                    <div id="column-todo" class="kanban-column p-4 space-y-3" data-status="todo" role="list" aria-label="Tarefas a fazer">
                        <!-- Cards will be added here -->
                    </div>
                </div>

                <!-- Em Análise Column -->
                <div class="flex-shrink-0 w-80 bg-white rounded-lg shadow">
                    <div class="bg-yellow-50 px-4 py-3 rounded-t-lg border-l-4 border-bevap-accent">
                        <div class="flex items-center justify-between">
                            <h2 class="font-semibold text-yellow-800">Em Análise</h2>
                            <span class="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full" id="count-analysis" aria-live="polite">0</span>
                        </div>
                    </div>
                    <div id="column-analysis" class="kanban-column p-4 space-y-3" data-status="analysis" role="list" aria-label="Tarefas em análise">
                        <!-- Cards will be added here -->
                    </div>
                </div>

                <!-- Aprovado Column -->
                <div class="flex-shrink-0 w-80 bg-white rounded-lg shadow">
                    <div class="bg-green-50 px-4 py-3 rounded-t-lg border-l-4 border-bevap-primary">
                        <div class="flex items-center justify-between">
                            <h2 class="font-semibold text-green-800">Aprovado</h2>
                            <span class="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full" id="count-approved" aria-live="polite">0</span>
                        </div>
                    </div>
                    <div id="column-approved" class="kanban-column p-4 space-y-3" data-status="approved" role="list" aria-label="Tarefas aprovadas">
                        <!-- Cards will be added here -->
                    </div>
                </div>

                <!-- Pronto para Desenvolvimento Column -->
                <div class="flex-shrink-0 w-80 bg-white rounded-lg shadow">
                    <div class="bg-bevap-dark bg-opacity-10 px-4 py-3 rounded-t-lg border-l-4 border-bevap-dark">
                        <div class="flex items-center justify-between">
                            <h2 class="font-semibold text-bevap-dark">Pronto para Dev</h2>
                            <span class="bg-bevap-dark bg-opacity-20 text-bevap-dark text-xs font-semibold px-2 py-1 rounded-full" id="count-ready" aria-live="polite">0</span>
                        </div>
                    </div>
                    <div id="column-ready" class="kanban-column p-4 space-y-3" data-status="ready" role="list" aria-label="Tarefas prontas para desenvolvimento">
                        <!-- Cards will be added here -->
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- BEVAP Shared Utilities -->
    <script src="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-utils.js"></script>
    
    <!-- Planejamento Widget Script -->
    <script src="planejamento.js"></script>
</body>
</html>
