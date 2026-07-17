<div id="MyWidget_${instanceId}" class="super-widget wcm-widget-class" data-params="MyWidget.instance()">
	<script type="text/javascript" src="/webdesk/vcXMLRPC.js"></script>
    <header id="header" class="fixed top-0 left-0 right-0 bg-bevap-navy shadow-lg z-50 w-full">
        <div class="w-full px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center space-x-4 ">
                    <div class="flex items-center space-x-2 bg-white px-4 py-1 rounded-lg">
                        <img src="/wdGestaoProjetos/resources/images/logoBevap.png" class="h-auto w-24" alt="BEVAP">
                    </div>
                    <div class="h-8 w-px bg-gray-400"></div>
                    <h1 id="gp-page-title_${instanceId}" class="text-white font-montserrat font-semibold text-lg">Dashboard</h1>
                </div>
                <div class="flex items-center space-x-3">
                    <button type="button" data-action="gp-back-dashboard" class="hidden inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-bevap-navy shadow-sm transition-colors hover:bg-gray-100">
                        <i class="fa-solid fa-arrow-left text-xs"></i>
                        <span>Voltar</span>
                    </button>
                    <button class="text-white hover:text-bevap-gold transition-colors">
                        <i class="fa-regular fa-bell text-xl"></i>
                    </button>
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User avatar" class="w-9 h-9 rounded-full border-2 border-bevap-gold">
                </div>
            </div>
        </div>
        <div class="">
            <div class="w-full px-4 sm:px-6 lg:px-8 h-10 flex items-center">
                <nav id="gp-page-breadcrumb_${instanceId}" class="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
                    <a href="#dashboard" class="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <i class="fa-solid fa-house text-xs"></i>
                        <span>Início</span>
                    </a>
                    <span class="text-gray-400">/</span>
                    <span class="text-bevap-gold font-medium">Dashboard</span>
                </nav>
            </div>
        </div>
    </header>

    <main id="page-container" class="">
        <!-- O JS insere aqui o conteúdo da tela -->
    </main>

    <div data-component="gp-back-dashboard-modal" class="hidden fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div class="mb-4 flex items-center">
                <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <i class="fa-solid fa-arrow-left text-xl text-bevap-navy"></i>
                </div>
                <h3 class="text-xl font-montserrat font-bold text-bevap-navy">Voltar ao Dashboard</h3>
            </div>
            <p class="mb-6 text-sm text-gray-600">Voce voltara para o dashboard. Alteracoes nao salvas nesta tela podem ser perdidas.</p>
            <div class="flex justify-end gap-3">
                <button type="button" data-action="gp-cancel-back-dashboard" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">Cancelar</button>
                <button type="button" data-action="gp-confirm-back-dashboard" class="rounded-lg bg-bevap-green px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700">Confirmar</button>
            </div>
        </div>
    </div>

</div>

