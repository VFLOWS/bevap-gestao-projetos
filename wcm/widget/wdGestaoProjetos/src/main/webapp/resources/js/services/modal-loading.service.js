var modalLoadingService = (function () {
    var sequence = 0;

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getModalElement(modalId) {
        return $(`[data-loading-modal-id="${modalId}"]`);
    }

    function hide(modalId) {
        if (!modalId) return;
        getModalElement(modalId).remove();
    }

    function hideAll() {
        $('[data-loading-modal-id]').remove();
    }

    function show(options) {
        var config = options || {};
        var title = escapeHtml(config.title || "Processing");
        var message = escapeHtml(config.message || "Please wait...");
        var modalId = `loading-modal-${Date.now()}-${++sequence}`;

        var modal = $(`
            <div data-loading-modal-id="${modalId}" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style="z-index: 9999;">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                    <div class="w-14 h-14 border-4 border-gray-200 border-t-bevap-green rounded-full animate-spin mx-auto mb-5"></div>
                    <h3 data-role="loading-title" class="text-xl font-montserrat font-bold text-bevap-navy mb-2">${title}</h3>
                    <p data-role="loading-message" class="text-sm text-gray-600">${message}</p>
                </div>
            </div>
        `);

        $('body').append(modal);

        return {
            id: modalId,
            hide: function () {
                hide(modalId);
            },
            updateTitle: function (value) {
                getModalElement(modalId).find('[data-role="loading-title"]').text(String(value || ""));
            },
            updateMessage: function (value) {
                getModalElement(modalId).find('[data-role="loading-message"]').text(String(value || ""));
            }
        };
    }

    return {
        show: show,
        hide: hide,
        hideAll: hideAll
    };
})();
