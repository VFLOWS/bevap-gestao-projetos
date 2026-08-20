document.addEventListener("DOMContentLoaded", function() {
    const link = document.querySelector('link[href*="wcm_global.css"]');
    if (link) {
        link.disabled = true;
    }
});