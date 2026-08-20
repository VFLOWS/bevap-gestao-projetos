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
                        'bevap-navy': '#3D567E',
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
    window.tailwind = window.tailwind || {};
    window.tailwind.config = window.tailwindConfig;

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

    const self = this;
    $(document).ready(function () {
      self.waitForRouterDependencies(function () {
        router.init();
      });

      // 🔹 Preenche informações do usuário no header
      if (typeof WCMAPI !== 'undefined') {
        $("#userName").text(WCMAPI.userLogin); // Nome completo
        $("#userEmail").text(WCMAPI.user);     // Login/rede
      }
      self.setupCurrentUserAvatar();



    });


  },

  setupCurrentUserAvatar: async function () {
    const avatar = $('[data-role="gp-user-avatar"]').first();
    if (!avatar.length) {
      return;
    }

    const img = avatar.find('[data-role="gp-user-avatar-img"]').first();
    const fallback = avatar.find('[data-role="gp-user-avatar-fallback"]').first();
    const userName = this.getCurrentUserName();
    const userCode = this.getCurrentUserCode();
    const avatarUrls = await this.getCurrentUserAvatarUrls(userCode);

    fallback.text(this.getUserInitials(userName || userCode));
    avatar.attr('title', userName || userCode || 'Usuario');

    if (!avatarUrls.length || !img.length) {
      img.addClass('hidden').attr('src', '');
      fallback.removeClass('hidden');
      return;
    }

    let currentUrlIndex = 0;
    img
      .off('load.gpUserAvatar error.gpUserAvatar')
      .on('load.gpUserAvatar', function () {
        img.removeClass('hidden');
        fallback.addClass('hidden');
      })
      .on('error.gpUserAvatar', function () {
        currentUrlIndex += 1;
        if (currentUrlIndex < avatarUrls.length) {
          img.attr('src', avatarUrls[currentUrlIndex]);
          return;
        }

        img.addClass('hidden').removeAttr('src');
        fallback.removeClass('hidden');
      })
      .attr('alt', userName ? 'Foto de ' + userName : 'User avatar')
      .attr('src', avatarUrls[currentUrlIndex]);
  },

  getCurrentUserAvatarUrls: async function (userCode) {
    const serverUrl = typeof WCMAPI !== 'undefined' && WCMAPI.getServerURL
      ? String(WCMAPI.getServerURL() || '')
      : '';
    const ids = [];
    const addId = function (value) {
      const id = String(value || '').trim();
      if (id && ids.indexOf(id) === -1) {
        ids.push(id);
      }
    };

    try {
      const logged = await $.get(serverUrl + '/api/public/social/user/logged/v2');
      const content = logged && logged.content ? logged.content : {};
      addId(content.alias);
      addId(content.idpId);
      addId(content.userCode);
      addId(content.id);
      addId(content.foundationUserId);
    } catch (error) {}

    addId(userCode);
    if (typeof WCMAPI !== 'undefined') {
      addId(WCMAPI.user);
      addId(WCMAPI.userLogin);
    }

    return ids.reduce(function (urls, id) {
      const encodedId = encodeURIComponent(id);
      const version = Date.now();
      urls.push(serverUrl + '/api/public/profile/image/' + encodedId + '/X_SMALL_PICTURE?v=' + version);
      urls.push(serverUrl + '/api/public/profile/image/' + encodedId + '/SMALL_PICTURE?v=' + version);
      urls.push(serverUrl + '/api/public/social/imageBySize/' + encodedId + '/80?v=' + version);
      return urls;
    }, []);
  },

  getCurrentUserCode: function () {
    if (typeof WCMAPI !== 'undefined' && WCMAPI.getUserCode) {
      return String(WCMAPI.getUserCode() || '').trim();
    }

    if (typeof WCMAPI !== 'undefined') {
      return String(WCMAPI.userCode || WCMAPI.user || '').trim();
    }

    return '';
  },

  getCurrentUserName: function () {
    if (typeof WCMAPI !== 'undefined' && WCMAPI.getUser) {
      return String(WCMAPI.getUser() || '').trim();
    }

    if (typeof WCMAPI !== 'undefined') {
      return String(WCMAPI.userLogin || WCMAPI.user || '').trim();
    }

    return '';
  },

  getUserInitials: function (value) {
    const text = String(value || '').trim();
    if (!text) {
      return 'US';
    }

    return text
      .split(/\s+/)
      .filter(Boolean)
      .map(function (part) { return part.charAt(0); })
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'US';
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
  },

  hasGlobalDependency: function (name) {
    try {
      return Function(`return typeof ${name} !== "undefined";`)();
    } catch (error) {
      return typeof window[name] !== 'undefined';
    }
  },

  waitForRouterDependencies: function (callback, attempt) {
    const currentAttempt = attempt || 0;
    const dependencies = [
      'router',
      'fluigService',
      'dashboardController',
      'projectPlanningController',
      'newSolicitationController',
      'solicitationDetailController',
      'correctionController',
      'evaluateProjectController',
      'immediateApprovalController',
      'technicalTriageController',
      'committeeApprovalController',
      'commercialProposalController',
      'gccCostApprovalController',
      'committeeCostApprovalController',
      'purchaseContractingController',
      'gpGlpiErrorContext',
      'projectReadonlyViewController',
      'glpiErrorTreatmentController',
      'dpGlpiErrorTreatmentController',
      'dpStartExecErrorTreatmentController',
      'dpStartDeliveryErrorTreatmentController',
      'epGlpiErrorTreatmentController',
      'epDeliveryPlanningController',
      'epUserTrainingController',
      'epFinalGoLiveValidationController',
      'epGoLiveExecutionController',
      'epRequesterGoLiveValidationController',
      'epProjectClosureDocumentationController',
      'executionActivityWaitingController',
      'executionActivityController',
      'executionActivityRequesterValidationController',
      'executionActivityTiValidationController',
      'efGlpiErrorTreatmentController',
      'requesterProposalApprovalController',
      'projectExecutionController',
      'projectRequesterValidationController',
      'projectTiValidationController',
      'projectFinalController'
    ];

    const missing = dependencies.filter((name) => !this.hasGlobalDependency(name));
    if (!missing.length) {
      callback();
      return;
    }

    if (currentAttempt >= 120) {
      console.error('[wdGestaoProjetos] Dependencias do router nao carregadas:', missing);
      callback();
      return;
    }

    setTimeout(() => {
      this.waitForRouterDependencies(callback, currentAttempt + 1);
    }, 50);
  }

});

window.MyWidget = MyWidget;

