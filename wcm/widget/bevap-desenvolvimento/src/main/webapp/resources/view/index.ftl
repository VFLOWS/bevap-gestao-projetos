<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Desenvolvimento BEVAP</title>
    
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
    <div id="bevap-desenvolvimento-widget" class="p-6">
        <!-- Header -->
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-bevap-dark mb-2">Desenvolvimento</h1>
            <p class="text-gray-600">Acompanhamento de projetos em desenvolvimento</p>
        </header>

        <!-- Projects in Development -->
        <section id="dev-projects" class="space-y-4" role="region" aria-label="Projetos em desenvolvimento">
            <!-- Projects will be loaded here -->
        </section>
    </div>

    <!-- BEVAP Shared Utilities -->
    <script src="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-utils.js"></script>
    
    <!-- Desenvolvimento Widget Script -->
    <script src="desenvolvimento.js"></script>
</body>
</html>
