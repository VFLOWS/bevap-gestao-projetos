var MyWidget = SuperWidget.extend({
  init: function () {
    if (this.isEditMode) {
      return;
    }


    // Configuração do Font Awesome
    if (!window.FontAwesomeConfig) {
      window.FontAwesomeConfig = { autoReplaceSvg: 'nest' };
    }

    // Injetar Font Awesome
    if (!$('script[src*="font-awesome"]').length) {
      $('head').append('<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>');
    }

    // Injetar Google Fonts
    if (!$('link[href*="fonts.googleapis.com"]').length) {
      $('head').append('<link rel="preconnect" href="https://fonts.googleapis.com">');
      $('head').append('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
      $('head').append('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;500;600;700;800;900&display=swap" rel="stylesheet">');
    }






    // Configuração do Tailwind
    if (!window.tailwindConfig) {
      window.tailwindConfig =  {
            theme: {
                extend: {
                    colors: {
                        'bevap-navy': '#0B2E4A',
                        'bevap-green': '#1C8C5D',
                        'bevap-gold': '#F1B434',
                    },
                    fontFamily: {
                        'montserrat': ['Montserrat', 'sans-serif'],
                        'inter': ['Inter', 'sans-serif'],
                    }
                }
            }
        }
    }

    // Injetar Tailwind CSS
    if (!$('script[src*="tailwindcss"]').length) {
      const tailwindScript = document.createElement('script');
      tailwindScript.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(tailwindScript);
    }

    //injeta pdflib
    if (!window.PDFLib) {
      const pdflibScript = document.createElement('script');
      pdflibScript.src = 'https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.js';
      document.head.appendChild(pdflibScript);
    }

    // Estilos globais
    if (!$('style#gp-widget-styles').length) {
      const styles = `
        /* Reset de scrollbar */
        ::-webkit-scrollbar { 
          display: none;
        }
        
        /* Estilos base */
        body {
          font-family: 'Inter', sans-serif !important;
        }
        
        /* Preservar ícones do Font Awesome */
        .fa, .fas, .far, .fal, .fab {
          font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands" !important;
        }
      `;

      const styleTag = document.createElement('style');
      styleTag.id = 'gp-widget-styles';
      styleTag.textContent = styles;
      document.head.appendChild(styleTag);
    }

    $(document).ready(function () {
      router.init();

      // 🔹 Preenche informações do usuário no header
      $("#userName").text(WCMAPI.userLogin); // Nome completo
      $("#userEmail").text(WCMAPI.user);     // Login/rede



    });


  },

  loadXLSXLibrary: function () {
    return new Promise((resolve, reject) => {
      if (typeof XLSX !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar biblioteca XLSX'));
      document.head.appendChild(script);
    });
  }

});

