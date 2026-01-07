<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backlog BEVAP</title>
    
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
    </style>
</head>
<body class="bg-gray-50">
    <div id="bevap-backlog-widget" class="p-6">
        <!-- Header -->
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-bevap-dark mb-2">Backlog</h1>
            <p class="text-gray-600">Gerenciamento de itens do backlog</p>
        </header>

        <!-- Filters -->
        <section class="bg-white rounded-lg shadow p-4 mb-6" role="search" aria-label="Filtros de backlog">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label for="filter-priority-backlog" class="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select id="filter-priority-backlog" class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap" onchange="applyBacklogFilters()">
                        <option value="">Todas</option>
                        <option value="critica">Crítica</option>
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                    </select>
                </div>
                <div>
                    <label for="filter-type-backlog" class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select id="filter-type-backlog" class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap" onchange="applyBacklogFilters()">
                        <option value="">Todos</option>
                        <option value="feature">Feature</option>
                        <option value="bug">Bug</option>
                        <option value="improvement">Melhoria</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button onclick="clearBacklogFilters()" class="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus-bevap">Limpar Filtros</button>
                </div>
            </div>
        </section>

        <!-- Backlog Table -->
        <section class="bg-white rounded-lg shadow overflow-hidden" role="region" aria-label="Lista de backlog">
            <div id="backlog-table">
                <!-- Table will be loaded here -->
            </div>
        </section>
    </div>

    <!-- BEVAP Shared Utilities -->
    <script src="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-utils.js"></script>
    
    <!-- Backlog Widget Script -->
    <script src="backlog.js"></script>
</body>
</html>
