<#import "/wcm.ftl" as wcm/>

<#if pageRender.isEditMode()=true>
    <@wcm.header />
</#if>

<!-- WCM Wrapper content -->
<div class="wcm-wrapper-content">

    <script src="https://cdn.tailwindcss.com"></script>
    
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <style>::-webkit-scrollbar { display: none;}</style>
    <script>
    
      tailwind.config = {
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

    </script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;500;600;700;800;900&amp;display=swap"><style>
      body {
        font-family: 'Inter', sans-serif !important;
      }
      
      /* Preserve Font Awesome icons */
      .fa, .fas, .far, .fal, .fab {
        font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands" !important;
      }
    </style><style>
  .highlighted-section {
    outline: 2px solid #004499;
    background-color: rgba(0, 102, 204, 0.1);
  }

  .edit-button {
    position: absolute;
    z-index: 1000;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  html, body {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  </style>
    <!-- Wrapper -->
        <div>

            <!-- Onde deverá estar a barra de formatação -->
            <#if pageRender.isEditMode()=true>
                <div name="formatBar" id="formatBar"></div>
                <!-- Div geral -->
                <!-- Há CSS distinto para Edição/Visualização -->
            <div id="edicaoPagina">
            <#else>
            <div id="visualizacaoPagina">
            </#if>
                <!-- Slot 1 -->
                <div class="editable-slot layout-1-1" id="slotFull1">
                    <@wcm.renderSlot id="SlotA" editableSlot="true"/>
                </div>

            </div>            

        </div>
	
</div>