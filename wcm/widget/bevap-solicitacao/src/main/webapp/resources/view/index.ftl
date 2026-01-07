<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitações BEVAP</title>
    
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
    <div id="bevap-solicitacao-widget" class="p-6">
        <!-- Header with New Request Button -->
        <header class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-3xl font-bold text-bevap-dark mb-2">Solicitações</h1>
                <p class="text-gray-600">Gerencie as solicitações de projetos</p>
            </div>
            <button 
                onclick="BevapUtils.openDrawer('new-request-drawer')" 
                class="bg-bevap-primary text-white px-6 py-3 rounded-lg hover:bg-bevap-primary focus-bevap font-semibold flex items-center gap-2 transition-colors"
                aria-label="Nova Solicitação">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Nova Solicitação
            </button>
        </header>

        <!-- Filters Section -->
        <section class="bg-white rounded-lg shadow p-4 mb-6" role="search" aria-label="Filtros de pesquisa">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label for="filter-status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select id="filter-status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap" onchange="applyFilters()">
                        <option value="">Todos</option>
                        <option value="novo">Novo</option>
                        <option value="em-analise">Em Análise</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="rejeitado">Rejeitado</option>
                    </select>
                </div>
                <div>
                    <label for="filter-priority" class="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select id="filter-priority" class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap" onchange="applyFilters()">
                        <option value="">Todas</option>
                        <option value="critica">Crítica</option>
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                    </select>
                </div>
                <div>
                    <label for="filter-search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                    <input 
                        type="text" 
                        id="filter-search" 
                        placeholder="Nome do projeto..." 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap"
                        onkeyup="applyFilters()"
                        aria-label="Buscar por nome do projeto">
                </div>
                <div class="flex items-end">
                    <button 
                        onclick="clearFilters()" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus-bevap transition-colors"
                        aria-label="Limpar filtros">
                        Limpar Filtros
                    </button>
                </div>
            </div>
        </section>

        <!-- Requests Table -->
        <section class="bg-white rounded-lg shadow overflow-hidden" role="region" aria-label="Lista de solicitações">
            <div id="requests-table">
                <!-- Table will be loaded here -->
            </div>
        </section>
    </div>

    <!-- New Request Drawer -->
    <aside 
        id="new-request-drawer" 
        class="hidden fixed inset-0 z-50 overflow-hidden" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="drawer-title"
        aria-hidden="true">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onclick="BevapUtils.closeDrawer('new-request-drawer')"></div>
        
        <!-- Drawer Panel -->
        <div class="absolute inset-y-0 right-0 max-w-full flex">
            <div class="w-screen max-w-2xl">
                <div class="h-full flex flex-col bg-white shadow-xl">
                    <!-- Header -->
                    <header class="px-6 py-4 bg-bevap-dark">
                        <div class="flex items-center justify-between">
                            <h2 id="drawer-title" class="text-xl font-semibold text-white">Nova Solicitação</h2>
                            <button 
                                onclick="BevapUtils.closeDrawer('new-request-drawer')" 
                                class="text-white hover:text-gray-200 focus-bevap"
                                aria-label="Fechar formulário">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </header>

                    <!-- Form Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="new-request-form" class="space-y-6" onsubmit="submitRequest(event)">
                            <div>
                                <label for="project-name" class="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Projeto <span class="text-red-500" aria-label="obrigatório">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="project-name" 
                                    required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap"
                                    aria-required="true">
                            </div>

                            <div>
                                <label for="project-description" class="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição <span class="text-red-500" aria-label="obrigatório">*</span>
                                </label>
                                <textarea 
                                    id="project-description" 
                                    required 
                                    rows="4" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap"
                                    aria-required="true"></textarea>
                            </div>

                            <div>
                                <label for="project-priority" class="block text-sm font-medium text-gray-700 mb-1">
                                    Prioridade <span class="text-red-500" aria-label="obrigatório">*</span>
                                </label>
                                <select id="project-priority" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap" aria-required="true">
                                    <option value="">Selecione...</option>
                                    <option value="critica">Crítica</option>
                                    <option value="alta">Alta</option>
                                    <option value="media">Média</option>
                                    <option value="baixa">Baixa</option>
                                </select>
                            </div>

                            <div>
                                <label for="project-area" class="block text-sm font-medium text-gray-700 mb-1">
                                    Área Solicitante <span class="text-red-500" aria-label="obrigatório">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="project-area" 
                                    required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap"
                                    aria-required="true">
                            </div>

                            <div>
                                <label for="project-deadline" class="block text-sm font-medium text-gray-700 mb-1">
                                    Prazo Desejado
                                </label>
                                <input 
                                    type="date" 
                                    id="project-deadline" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap">
                            </div>

                            <div>
                                <label for="project-justification" class="block text-sm font-medium text-gray-700 mb-1">
                                    Justificativa
                                </label>
                                <textarea 
                                    id="project-justification" 
                                    rows="3" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus-bevap"></textarea>
                            </div>
                        </form>
                    </div>

                    <!-- Footer -->
                    <footer class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div class="flex justify-end gap-3">
                            <button 
                                type="button" 
                                onclick="BevapUtils.closeDrawer('new-request-drawer')" 
                                class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus-bevap">
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                form="new-request-form"
                                class="px-6 py-2 bg-bevap-primary text-white rounded-md hover:bg-bevap-primary focus-bevap">
                                Enviar Solicitação
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    </aside>

    <!-- BEVAP Shared Utilities -->
    <script src="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-utils.js"></script>
    
    <!-- Solicitacao Widget Script -->
    <script src="solicitacao.js"></script>
</body>
</html>
