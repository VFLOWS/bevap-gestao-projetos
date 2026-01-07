# BEVAP Widgets - Quick Start Guide

## 📦 Widget Overview

Este projeto contém **10 widgets Fluig** completos para gestão de projetos BEVAP:

```
wcm/widget/
├── bevap-shared/              # Recursos compartilhados
│   └── src/main/resources/
│       ├── bevap-colors.css   # Estilos e cores BEVAP
│       └── bevap-utils.js     # Utilitários JavaScript ES5
│
├── bevap-dashboard/           # 📊 Dashboard com KPIs
├── bevap-solicitacao/         # 📝 Solicitações (novo + lista)
├── bevap-planejamento/        # 📋 Kanban de planejamento
├── bevap-desenvolvimento/     # 💻 Tracking de desenvolvimento
├── bevap-backlog/             # 📑 Gestão de backlog
├── bevap-atividade/           # 🕐 Timeline de atividades
├── bevap-validacoes/          # ✅ Validações (Solicitante + TI)
├── bevap-entrega/             # 🚀 Entrega (Go-Live + Treinamentos + Encerramento)
└── bevap-templates/           # 📚 Biblioteca de templates
```

## 🎨 BEVAP Design System

### Cores
- **Primary**: `#1C8C5D` (Verde) - Classes: `.bg-bevap-primary`, `.text-bevap-primary`
- **Dark**: `#0B2E4A` (Azul Escuro) - Classes: `.bg-bevap-dark`, `.text-bevap-dark`
- **Accent**: `#F1B434` (Amarelo) - Classes: `.bg-bevap-accent`, `.text-bevap-accent`

### Fontes
- **Montserrat** - Títulos e cabeçalhos
- **Inter** - Corpo de texto

## 🚀 Início Rápido

### 1. Dashboard
**Widget**: `bevap-dashboard`
**Arquivo**: `wcm/widget/bevap-dashboard/src/main/webapp/resources/view/index.ftl`

Exibe visão geral com:
- 4 KPIs animados
- Gráfico de distribuição por status
- Tabela de projetos recentes

### 2. Solicitações
**Widget**: `bevap-solicitacao`
**Arquivo**: `wcm/widget/bevap-solicitacao/src/main/webapp/resources/view/index.ftl`

Gerencia solicitações com:
- Drawer lateral para nova solicitação
- Tabela com filtros (status, prioridade, busca)
- Estados: Novo, Em Análise, Aprovado, Rejeitado

### 3. Planejamento Kanban
**Widget**: `bevap-planejamento`
**Arquivo**: `wcm/widget/bevap-planejamento/src/main/webapp/resources/view/index.ftl`

Kanban com:
- 5 colunas: Backlog → A Fazer → Em Análise → Aprovado → Pronto para Dev
- Drag & drop entre colunas
- Contadores dinâmicos

### 4. Desenvolvimento
**Widget**: `bevap-desenvolvimento`
**Arquivo**: `wcm/widget/bevap-desenvolvimento/src/main/webapp/resources/view/index.ftl`

Acompanhamento com:
- Cards por projeto
- Barra de progresso visual
- Métricas: sprint, tarefas, datas

### 5. Backlog
**Widget**: `bevap-backlog`
**Arquivo**: `wcm/widget/bevap-backlog/src/main/webapp/resources/view/index.ftl`

Gestão de backlog com:
- Tabela de itens
- Filtros (prioridade, tipo)
- Tipos: Feature, Bug, Melhoria

### 6. Atividades
**Widget**: `bevap-atividade`
**Arquivo**: `wcm/widget/bevap-atividade/src/main/webapp/resources/view/index.ftl`

Timeline com:
- Atividades em ordem cronológica
- Tipos: Criação, Atualização, Comentário, Tarefa
- Ícones coloridos por tipo

### 7. Validações
**Widget**: `bevap-validacoes`
**Arquivo**: `wcm/widget/bevap-validacoes/src/main/webapp/resources/view/index.ftl`

Duas abas:
- **Validação Solicitante**: Aprovação de requisitos
- **Validação TI**: Aprovação técnica
- Ações: Aprovar/Rejeitar com feedback

### 8. Entrega
**Widget**: `bevap-entrega`
**Arquivo**: `wcm/widget/bevap-entrega/src/main/webapp/resources/view/index.ftl`

Três abas:
- **Go-Live**: Checklist de implantação
- **Treinamentos**: Gestão de capacitação
- **Encerramento**: Lições aprendidas e finalização

### 9. Templates
**Widget**: `bevap-templates`
**Arquivo**: `wcm/widget/bevap-templates/src/main/webapp/resources/view/index.ftl`

Biblioteca com:
- Grid de templates
- Filtros por categoria: Workflows, Formulários, Dashboards
- Ações: Visualizar/Usar template

## 🛠️ Utilitários Compartilhados

### JavaScript (BevapUtils)

```javascript
// Estados visuais
BevapUtils.showLoading('container-id');
BevapUtils.showEmpty('container-id', 'Mensagem customizada');
BevapUtils.showError('container-id', 'Mensagem de erro');

// Formatação
BevapUtils.formatDate('2026-01-07');        // Retorna: 07/01/2026
BevapUtils.formatDateTime('2026-01-07T14:30:00'); // Retorna: 07/01/2026 14:30

// Drawers
BevapUtils.openDrawer('drawer-id');
BevapUtils.closeDrawer('drawer-id');

// Segurança
var safeText = BevapUtils.escapeHtml(userInput);

// AJAX
BevapUtils.ajax({
    url: '/api/endpoint',
    method: 'POST',
    data: { key: 'value' },
    success: function(response) { /* ... */ },
    error: function(xhr) { /* ... */ }
});
```

### CSS (Classes Customizadas)

```html
<!-- Botões -->
<button class="bg-bevap-primary text-white hover:bg-bevap-primary focus-bevap">
    Ação Principal
</button>

<!-- Cards -->
<div class="bg-white rounded-lg shadow p-6 border-l-4 border-bevap-primary">
    Conteúdo
</div>

<!-- Badges -->
<span class="bg-bevap-accent text-bevap-dark px-2 py-1 rounded-full text-xs font-semibold">
    Status
</span>

<!-- Loading Spinner -->
<div class="bevap-spinner"></div>
```

## ✅ Checklist de Features

### Todos os Widgets Incluem:

- ✅ **HTML/FTL Templates** - Estrutura semântica
- ✅ **JavaScript ES5** - Compatibilidade máxima
- ✅ **Tailwind CSS via CDN** - Sem build necessário
- ✅ **BEVAP Colors** - Identidade visual consistente
- ✅ **Google Fonts** - Montserrat + Inter
- ✅ **Estados Visuais** - Loading, Empty, Error
- ✅ **Acessibilidade** - ARIA labels, roles, keyboard navigation
- ✅ **Responsivo** - Mobile-first design
- ✅ **Segurança** - XSS protection via escapeHtml

### Componentes Implementados:

- ✅ **KPIs** - Indicadores animados (Dashboard)
- ✅ **Kanban** - Drag & drop (Planejamento)
- ✅ **Tabelas** - Com filtros e paginação
- ✅ **Drawers** - Painéis laterais (Solicitação)
- ✅ **Filtros** - Busca e categorização
- ✅ **Timeline** - Linha do tempo (Atividade)
- ✅ **Checklists** - Tarefas interativas (Entrega)
- ✅ **Tabs** - Navegação por abas (Validações, Entrega, Templates)
- ✅ **Progress Bars** - Barras de progresso visuais
- ✅ **Badges** - Status e prioridades coloridos

## 📱 Compatibilidade

- **Fluig**: 1.6.x+
- **Navegadores**: Chrome, Firefox, Safari, Edge (moderno)
- **JavaScript**: ES5 (IE11+)
- **CSS**: Tailwind 3.x via CDN

## 🔗 Próximos Passos

1. **Importar no Fluig Studio**
2. **Configurar Datasets** - Substituir dados mockados
3. **Integrar Workflows** - Conectar com processos Fluig
4. **Personalizar** - Ajustar cores, textos, validações
5. **Testar** - Validar em ambiente de homologação

## 📖 Documentação Completa

Consulte o arquivo `README.md` na raiz do projeto para documentação detalhada de cada widget.

---

**BEVAP** - Sistema de Gestão de Projetos Fluig
Desenvolvido com ❤️ usando Tailwind CSS + ES5
