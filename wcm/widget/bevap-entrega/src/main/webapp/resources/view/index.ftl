<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrega BEVAP</title>
    
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
    <div id="bevap-entrega-widget" class="p-6">
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-bevap-dark mb-2">Entrega</h1>
            <p class="text-gray-600">Go-Live, Treinamentos e Encerramento</p>
        </header>

        <!-- Tabs -->
        <div class="mb-6">
            <nav class="flex space-x-4" role="tablist">
                <button onclick="showEntregaTab('golive')" id="tab-golive" class="px-4 py-2 font-medium rounded-lg bg-bevap-primary text-white focus-bevap" role="tab" aria-selected="true">Go-Live</button>
                <button onclick="showEntregaTab('treinamentos')" id="tab-treinamentos" class="px-4 py-2 font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap" role="tab" aria-selected="false">Treinamentos</button>
                <button onclick="showEntregaTab('encerramento')" id="tab-encerramento" class="px-4 py-2 font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus-bevap" role="tab" aria-selected="false">Encerramento</button>
            </nav>
        </div>

        <section id="panel-golive" role="tabpanel"><div id="golive-content" class="bg-white rounded-lg shadow p-6"></div></section>
        <section id="panel-treinamentos" class="hidden" role="tabpanel"><div id="treinamentos-content" class="bg-white rounded-lg shadow p-6"></div></section>
        <section id="panel-encerramento" class="hidden" role="tabpanel"><div id="encerramento-content" class="bg-white rounded-lg shadow p-6"></div></section>
    </div>

    <script src="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-utils.js"></script>
    <script src="entrega.js"></script>
</body>
</html>
