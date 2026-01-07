# BEVAP - Gestão de Projetos - Widgets Fluig

Sistema de widgets para gestão de projetos desenvolvido para a plataforma Fluig utilizando Tailwind CSS via CDN, HTML/FTL templates e JavaScript ES5.

## 🎨 Brand Identity

### Cores BEVAP
- **Primary Green**: `#1C8C5D` - Cor principal para ações e elementos importantes
- **Dark Blue**: `#0B2E4A` - Cor secundária para títulos e elementos de destaque
- **Accent Yellow**: `#F1B434` - Cor de destaque para avisos e elementos de atenção

### Tipografia
- **Montserrat**: Utilizada para títulos e cabeçalhos (weights: 400, 500, 600, 700, 800)
- **Inter**: Utilizada para corpo de texto (weights: 300, 400, 500, 600, 700)

## 📦 Estrutura de Widgets

### 1. **bevap-shared** - Recursos Compartilhados
Biblioteca de utilitários e estilos compartilhados entre todos os widgets.

**Arquivos:**
- `bevap-colors.css` - Definições de cores e estilos BEVAP
- `bevap-utils.js` - Funções utilitárias ES5:
  - `showLoading()` - Exibe estado de carregamento
  - `showEmpty()` - Exibe estado vazio
  - `showError()` - Exibe estado de erro
  - `formatDate()` - Formata datas (DD/MM/YYYY)
  - `formatDateTime()` - Formata data e hora
  - `openDrawer()` / `closeDrawer()` - Gerencia drawers laterais
  - `escapeHtml()` - Sanitiza HTML para prevenir XSS
  - `ajax()` - Requisições AJAX compatíveis com ES5

### 2. **bevap-dashboard** - Dashboard Principal
Widget de visualização geral com KPIs e projetos recentes.

**Características:**
- 4 KPIs principais com animação de contadores
- Gráfico de barras de distribuição por status
- Tabela de projetos recentes com filtros
- Estados: loading, empty, error
- Acessibilidade: ARIA labels, roles, live regions

**KPIs Exibidos:**
- Total de Projetos
- Em Desenvolvimento
- Aguardando Validação
- Concluídos

### 3. **bevap-solicitacao** - Gestão de Solicitações
Widget para criar e listar solicitações de projetos.

**Características:**
- Formulário em drawer lateral para nova solicitação
- Tabela com filtros (status, prioridade, busca)
- Campos do formulário:
  - Nome do Projeto
  - Descrição
  - Prioridade (Crítica, Alta, Média, Baixa)
  - Área Solicitante
  - Prazo Desejado
  - Justificativa
- Estados de solicitação: Novo, Em Análise, Aprovado, Rejeitado

### 4. **bevap-planejamento** - Kanban de Planejamento
Widget kanban para gerenciar o planejamento de projetos.

**Características:**
- 5 colunas: Backlog, A Fazer, Em Análise, Aprovado, Pronto para Dev
- Drag and drop entre colunas
- Contadores dinâmicos por coluna
- Cards com informações: título, descrição, prioridade, responsável
- Badges de prioridade coloridos

### 5. **bevap-desenvolvimento** - Acompanhamento de Desenvolvimento
Widget para monitorar projetos em desenvolvimento.

**Características:**
- Cards de projetos com informações detalhadas
- Barra de progresso visual
- Métricas: tarefas concluídas, datas, sprint atual
- Indicadores de progresso com cores dinâmicas:
  - Verde: 80%+
  - Amarelo: 50-79%
  - Azul: 30-49%
  - Vermelho: <30%

### 6. **bevap-backlog** - Gestão de Backlog
Widget para gerenciar itens do backlog.

**Características:**
- Tabela de itens com filtros (prioridade, tipo)
- Tipos de item: Feature, Bug, Melhoria
- Estimativas em pontos
- Ação para mover itens ao planejamento
- Priorização visual com badges

### 7. **bevap-atividade** - Timeline de Atividades
Widget de acompanhamento de atividades do projeto.

**Características:**
- Timeline vertical com ícones coloridos
- Tipos de atividade:
  - Criação (verde)
  - Atualização (amarelo)
  - Comentário (azul)
  - Tarefa (verde claro)
- Data/hora de cada atividade
- Informação do usuário responsável

### 8. **bevap-validacoes** - Validações
Widget com duas abas para validações de Solicitante e TI.

**Características:**
- Tabs navegáveis
- Lista de itens aguardando validação
- Estados: Pendente, Aprovado, Rejeitado
- Ações: Aprovar / Rejeitar com feedback
- Campo para justificativa de rejeição

### 9. **bevap-entrega** - Gestão de Entrega
Widget com três seções: Go-Live, Treinamentos e Encerramento.

**Características Go-Live:**
- Checklist interativo
- Barra de progresso do checklist
- Itens: testes, ambiente, backup, documentação, rollback, comunicação

**Características Treinamentos:**
- Lista de treinamentos agendados/concluídos
- Data, número de participantes
- Status visual

**Características Encerramento:**
- Campo para lições aprendidas
- Checklist de documentação final
- Botão de finalização do projeto

### 10. **bevap-templates** - Biblioteca de Templates
Widget para gerenciar templates de projeto.

**Características:**
- Grid responsivo de cards
- Filtros por categoria: Todos, Workflows, Formulários, Dashboards
- Ícones específicos por tipo
- Ações: Visualizar / Usar template
- Descrição detalhada de cada template

## 🎯 Características Gerais

### Estados Visuais
Todos os widgets implementam três estados obrigatórios:
1. **Loading** - Spinner animado com mensagem
2. **Empty** - Ícone e mensagem customizável quando não há dados
3. **Error** - Ícone de erro com opção de recarregar

### Acessibilidade (a11y)
- ARIA labels em todos os elementos interativos
- ARIA roles para regiões e componentes
- ARIA live regions para atualizações dinâmicas
- Suporte a navegação por teclado
- Focus visível customizado
- Contraste de cores adequado (WCAG AA)
- Textos alternativos em ícones decorativos

### Responsividade
- Mobile-first design com Tailwind CSS
- Grid responsivo (1 coluna mobile, 2-4 colunas desktop)
- Tabelas com scroll horizontal em telas pequenas
- Drawers adaptáveis
- Touch-friendly (mínimo 44x44px para elementos interativos)

### Segurança
- Escape de HTML em todos os conteúdos dinâmicos via `BevapUtils.escapeHtml()`
- Validação de formulários
- Prevenção de XSS

## 🚀 Como Usar

### 1. Importar em um Widget Fluig

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts -->
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
<body>
    <!-- Seu conteúdo aqui -->
    
    <!-- BEVAP Shared Utilities -->
    <script src="${serverPath}/wcm/widget/bevap-shared/src/main/resources/bevap-utils.js"></script>
    
    <!-- Seu script específico -->
    <script src="seu-widget.js"></script>
</body>
</html>
```

### 2. Usar Utilitários JavaScript

```javascript
// Mostrar loading
BevapUtils.showLoading('meu-container');

// Mostrar estado vazio
BevapUtils.showEmpty('meu-container', 'Nenhum dado encontrado');

// Mostrar erro
BevapUtils.showError('meu-container', 'Erro ao carregar dados');

// Formatar data
var dataFormatada = BevapUtils.formatDate('2026-01-07');

// Abrir/fechar drawer
BevapUtils.openDrawer('meu-drawer');
BevapUtils.closeDrawer('meu-drawer');

// Fazer requisição AJAX
BevapUtils.ajax({
    url: '/api/endpoint',
    method: 'GET',
    success: function(data) {
        console.log('Sucesso:', data);
    },
    error: function(xhr) {
        console.error('Erro:', xhr);
    }
});
```

### 3. Usar Classes CSS Customizadas

```html
<!-- Cores de fundo -->
<div class="bg-bevap-primary">Primary Green</div>
<div class="bg-bevap-dark">Dark Blue</div>
<div class="bg-bevap-accent">Accent Yellow</div>

<!-- Cores de texto -->
<span class="text-bevap-primary">Texto Verde</span>
<span class="text-bevap-dark">Texto Azul Escuro</span>
<span class="text-bevap-accent">Texto Amarelo</span>

<!-- Bordas -->
<div class="border-bevap-primary">Borda Verde</div>

<!-- Hover -->
<button class="bg-bevap-primary hover:bg-bevap-primary">Botão</button>

<!-- Focus para acessibilidade -->
<input class="focus-bevap" type="text">

<!-- Spinner de loading -->
<div class="bevap-spinner"></div>
```

## 📋 Integração com Fluig

### Datasets Recomendados
Para produção, substitua os dados mockados por chamadas a datasets Fluig:

```javascript
// Exemplo de integração com dataset
var dataset = DatasetFactory.getDataset('nome-do-dataset', null, null, null);
var dados = dataset.values;
```

### Workflows
Os formulários podem ser integrados com workflows Fluig para aprovações.

### Widgets WCM
Todos os widgets são compatíveis com o sistema WCM (Web Content Management) do Fluig.

## 🔧 Manutenção e Customização

### Alterar Cores
Edite o arquivo `bevap-colors.css` para modificar as cores do tema.

### Adicionar Novos Utilitários
Adicione funções ao objeto `BevapUtils` em `bevap-utils.js`.

### Criar Novos Widgets
Use os widgets existentes como template, seguindo a estrutura:
- `index.ftl` - Template HTML
- `widget.js` - Lógica JavaScript ES5
- Importar recursos compartilhados

### ⚠️ Notas de Produção

**Alertas e Prompts**: Os widgets atualmente utilizam `alert()` e `prompt()` do JavaScript para feedback rápido durante o desenvolvimento. Para produção, recomenda-se:
- Substituir por modais customizados do Fluig ou biblioteca de UI
- Implementar sistema de notificações toast
- Adicionar sanitização de dados com `BevapUtils.escapeHtml()` em todos os inputs de usuário

**Integração com Fluig**:
- Substituir dados mockados por chamadas a datasets reais
- Implementar validações server-side
- Configurar permissões de acesso por perfil
- Integrar com workflows existentes

## 📱 Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões modernas)
- **Fluig**: Versões 1.6.x e superiores
- **JavaScript**: ES5 para compatibilidade máxima
- **CSS**: Tailwind 3.x via CDN

## 📝 Licença

Este projeto é proprietário da VFLOWS/BEVAP.

---

**Desenvolvido para BEVAP** - Sistema de Gestão de Projetos Fluig
