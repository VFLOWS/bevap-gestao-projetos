<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard BEVAP</title>
    
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
    <div id="bevap-dashboard-widget" class="p-6">
        <!-- Header -->
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-bevap-dark mb-2">Dashboard de Projetos</h1>
            <p class="text-gray-600">Visão geral dos projetos BEVAP</p>
        </header>

        <!-- KPIs Section -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" role="region" aria-label="Indicadores">
            <!-- KPI 1: Total de Projetos -->
            <article class="bg-white rounded-lg shadow p-6 border-l-4 border-bevap-primary hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">Total de Projetos</p>
                        <p class="text-3xl font-bold text-bevap-dark" id="kpi-total-projetos" aria-live="polite">-</p>
                    </div>
                    <div class="bg-bevap-primary bg-opacity-10 p-3 rounded-full" aria-hidden="true">
                        <svg class="w-8 h-8 text-bevap-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                </div>
            </article>

            <!-- KPI 2: Em Desenvolvimento -->
            <article class="bg-white rounded-lg shadow p-6 border-l-4 border-bevap-accent hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">Em Desenvolvimento</p>
                        <p class="text-3xl font-bold text-bevap-dark" id="kpi-em-desenvolvimento" aria-live="polite">-</p>
                    </div>
                    <div class="bg-bevap-accent bg-opacity-10 p-3 rounded-full" aria-hidden="true">
                        <svg class="w-8 h-8 text-bevap-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                        </svg>
                    </div>
                </div>
            </article>

            <!-- KPI 3: Aguardando Validação -->
            <article class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">Aguardando Validação</p>
                        <p class="text-3xl font-bold text-bevap-dark" id="kpi-validacao" aria-live="polite">-</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full" aria-hidden="true">
                        <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                        </svg>
                    </div>
                </div>
            </article>

            <!-- KPI 4: Concluídos -->
            <article class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">Concluídos</p>
                        <p class="text-3xl font-bold text-bevap-dark" id="kpi-concluidos" aria-live="polite">-</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-full" aria-hidden="true">
                        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
            </article>
        </section>

        <!-- Content Area -->
        <div id="dashboard-content" class="bg-white rounded-lg shadow p-6">
            <!-- Loading state will be shown here by default -->
        </div>

        <!-- Recent Projects -->
        <section class="mt-6 bg-white rounded-lg shadow p-6" role="region" aria-label="Projetos Recentes">
            <h2 class="text-xl font-bold text-bevap-dark mb-4">Projetos Recentes</h2>
            <div id="recent-projects">
                <!-- Projects will be loaded here -->
            </div>
        </section>
    </div>

    <!-- BEVAP Shared Utilities -->
    <script src="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-utils.js"></script>
    
    <!-- Dashboard Widget Script -->
    <script src="dashboard.js"></script>
</body>
</html>
