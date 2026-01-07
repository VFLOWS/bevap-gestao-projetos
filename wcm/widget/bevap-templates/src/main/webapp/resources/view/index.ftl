<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Templates BEVAP</title>
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts - Montserrat and Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- BEVAP Shared Styles -->
    <link rel="stylesheet" href="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-colors.css">
    
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Montserrat', sans-serif; }
    </style>
</head>
<body class="bg-gray-50">
    <div id="bevap-templates-widget" class="p-6">
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-bevap-dark mb-2">Templates</h1>
            <p class="text-gray-600">Biblioteca de templates de projeto</p>
        </header>

        <!-- Template Categories -->
        <section class="mb-6">
            <div class="flex gap-2 flex-wrap" role="group" aria-label="Categorias de templates">
                <button onclick="filterTemplates('all')" id="cat-all" class="px-4 py-2 rounded-lg bg-bevap-primary text-white focus-bevap">Todos</button>
                <button onclick="filterTemplates('workflow')" id="cat-workflow" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap">Workflows</button>
                <button onclick="filterTemplates('formulario')" id="cat-formulario" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap">Formulários</button>
                <button onclick="filterTemplates('dashboard')" id="cat-dashboard" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap">Dashboards</button>
            </div>
        </section>

        <!-- Templates Grid -->
        <section id="templates-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="region" aria-label="Templates disponíveis">
            <!-- Templates will be loaded here -->
        </section>
    </div>

    <script src="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-utils.js"></script>
    <script src="templates.js"></script>
</body>
</html>
