BEVAP • Portfólio de Projetos — Prototipagem de Widgets (Fluig WCM)

Protótipos não-funcionais das telas do gerenciamento de projetos da BEVAP, feitos como widgets do TOTVS Fluig (WCM) usando Tailwind via CDN e JS ES5. Foco: validar UX, navegação e identidade visual.

1) Resumo
Este repositório contém a estrutura base para prototipar as páginas/widgets dos 4 macroprocessos: Solicitação, Desenvolvimento, Execução de Atividades/Fases e Entrega. Não há backend nem integrações; os dados vêm de mocks JSON.

2) Pré-requisitos
- Acesso a um ambiente Fluig (DEV/HML) para testar widgets WCM.
- Permissão para publicar widgets.
- Navegador moderno (Chrome/Edge/Firefox).

3) Estrutura de pastas
/widgets/
  bevap-portfolio/
    view.ftl              # Tela pública do widget
    edit.ftl              # Configurações (não obrigatório no protótipo)
    wcmmanifest.json      # Manifesto do widget
    res/
      css/custom.css      # Tokens de marca + ajustes Tailwind
      js/app.js           # Navegação e montagem de telas (ES5)
    mocks/
      kpis.json
      projetos.json
      atividades.json
      notificacoes.json
README.md

Identidade BEVAP (tokens):
- Cores: Green #1C8C5D, Navy #3D567E, Gold #F1B434.
- Fontes: Montserrat (títulos) e Inter (corpo) via CDN.

4) Como usar (passo a passo)
1. Clonar este repositório.
2. Copiar a pasta bevap-portfolio para …/data/entidades/<TENANT>/wcm/widget/ do Fluig (ou usar a área administrativa para upload).
3. Publicar o widget e adicionar em uma página do Fluig.
4. Abrir a página: a Home (Dashboard) é exibida por padrão.
5. Usar a barra de navegação do widget para alternar telas (dados via mocks).

Dica: Também é possível abrir o view.ftl local em um servidor estático apenas para revisar o layout; porém, o contexto correto é dentro do Fluig.

5) Telas previstas (protótipos)
- Dashboard do Portfólio (KPIs, Kanban por status, tabela, pendências, notificações)
- Solicitação de Projeto: nova / lista / aprovações
- Planejamento do Projeto
- Desenvolvimento (visão macro + checkpoints)
- Backlog/WBS de Atividades e Minhas Atividades
- Detalhe de Atividade (execução, anexos, comentários)
- Validação do Solicitante e Validação de TI
- Entrega: Go-Live, Treinamentos, Encerramento
- Relatórios e Templates

6) Snippets importantes

6.1. Incluir Tailwind + fontes (view.ftl)
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="${publisherContextPath}/resources/css/custom.css">
<script>tailwind.config={theme:{extend:{colors:{bevap:{green:'#1C8C5D',navy:'#3D567E',gold:'#F1B434'}}}}}</script>

6.2. Manifesto mínimo (wcmmanifest.json)
{
  "name": "bevap-portfolio",
  "displayName": "BEVAP • Portfólio de Projetos",
  "description": "Protótipo de UX (Tailwind) para gestão de projetos",
  "version": "0.1.0",
  "publisher": "BEVAP",
  "nameSpace": "bevap",
  "dependencies": []
}

6.3. Navegação por âncora (app.js)
(function () {
  var state = (location.hash || "#/dashboard").replace("#/", "");
  function render(s) {
    var views = document.querySelectorAll("[data-view]");
    for (var i = 0; i < views.length; i++) {
      views[i].style.display = (views[i].getAttribute("data-view") === s) ? "block" : "none";
    }
  }
  window.addEventListener("hashchange", function(){ render(location.hash.replace("#/","")); });
  render(state);
})();

7) Critérios de validação (protótipo)
- Consistência visual com a marca BEVAP (cores, fontes, iconografia).
- Navegação entre telas prevista no fluxo de negócio.
- Estados: carregando, vazio e erro.
- Acessibilidade básica: foco visível, contraste AA.

8) Convenções
- CSS: usar classes Tailwind; ajustes em custom.css com prefixo .bevap-.
- JS: ES5, sem frameworks; apenas DOM API.
- Mocks: JSON em mocks/, carregado via fetch com caminhos relativos no Fluig.
- Nomenclatura: #/dashboard, #/solicitacao, #/planejamento, #/desenvolvimento, #/backlog, #/atividade, #/validacao-solicitante, #/validacao-ti, #/golive, #/treinamentos, #/encerramento, #/relatorios, #/templates.

9) Riscos / cuidados
- CDN bloqueada: se Tailwind/Google Fonts não carregarem, usar assets locais.
- Cache do Fluig: após alterações, limpar cache/publicação do WCM.
- Mock ≠ real: campos e fluxos podem mudar na implementação.

10) Roadmap
1. Completar protótipos de todas as telas.
2. Alinhar com negócio (BEVAP) os checklists/DoD em cada tela.
3. Criar guia de componentes (KPIs, Kanban, tabela, drawer, filtros).
4. Anexar prints no README e publicar link de navegação entre telas.
5. Depois: mapear contratos de dados para implementação real no Fluig.

