# Contributing to BEVAP Widgets

## 🔒 Security Best Practices

### XSS Prevention
Todos os dados dinâmicos inseridos no DOM devem ser sanitizados:

```javascript
// ❌ ERRADO - Vulnerável a XSS
element.innerHTML = userData;

// ✅ CORRETO - Dados sanitizados
element.innerHTML = BevapUtils.escapeHtml(userData);
```

### Alertas e Modais
Os protótipos atuais usam `alert()` e `prompt()` para feedback rápido. Para produção:

```javascript
// ❌ Protótipo - OK para desenvolvimento
alert('Operação concluída');
var input = prompt('Digite o valor:');

// ✅ Produção - Use modals customizados
showCustomModal({
    title: 'Sucesso',
    message: BevapUtils.escapeHtml('Operação concluída'),
    type: 'success'
});

var input = showCustomPrompt({
    title: 'Entrada requerida',
    message: 'Digite o valor:',
    validate: function(value) {
        return value.length > 0;
    }
});
```

### Validação de Dados

```javascript
// Validação client-side
function validateForm(data) {
    if (!data.nome || data.nome.trim().length === 0) {
        return { valid: false, error: 'Nome é obrigatório' };
    }
    
    // Sanitize antes de enviar
    return {
        valid: true,
        data: {
            nome: BevapUtils.escapeHtml(data.nome),
            descricao: BevapUtils.escapeHtml(data.descricao)
        }
    };
}

// Sempre validar no servidor também!
```

### AJAX e APIs

```javascript
// Use os utilitários do BevapUtils
BevapUtils.ajax({
    url: '/api/projetos',
    method: 'POST',
    data: {
        nome: BevapUtils.escapeHtml(nome),
        descricao: BevapUtils.escapeHtml(descricao)
    },
    success: function(response) {
        // Sanitize response data antes de exibir
        showSuccess(BevapUtils.escapeHtml(response.message));
    },
    error: function(xhr) {
        // Não exponha detalhes técnicos ao usuário
        showError('Erro ao processar solicitação');
        console.error('API Error:', xhr);
    }
});
```

## 📝 Code Style Guide

### JavaScript (ES5)

```javascript
// Use IIFE para encapsular código
(function() {
    'use strict';
    
    // Variáveis no topo
    var dados = [];
    var filtros = {};
    
    // Funções nomeadas
    function inicializar() {
        carregarDados();
        configurarEventos();
    }
    
    // Funções privadas
    function carregarDados() {
        // Implementação
    }
    
    // Funções públicas via window
    window.minhaFuncaoPublica = function(param) {
        // Implementação
    };
    
    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
})();
```

### HTML/FTL

```html
<!-- Sempre inclua atributos de acessibilidade -->
<button 
    onclick="acaoClick()"
    class="btn-primary focus-bevap"
    aria-label="Descrição detalhada da ação"
    type="button">
    Texto do Botão
</button>

<!-- Use roles e aria-live para conteúdo dinâmico -->
<div 
    id="notifications" 
    role="alert" 
    aria-live="polite" 
    aria-atomic="true">
    <!-- Notificações aparecem aqui -->
</div>

<!-- Formulários acessíveis -->
<label for="input-nome">
    Nome <span class="text-red-500" aria-label="obrigatório">*</span>
</label>
<input 
    type="text" 
    id="input-nome" 
    required 
    aria-required="true"
    class="focus-bevap">
```

### CSS

```css
/* Use variáveis CSS para cores */
:root {
    --bevap-primary: #1C8C5D;
    --bevap-dark: #0B2E4A;
    --bevap-accent: #F1B434;
}

/* Classes com prefixo bevap- */
.bevap-card {
    /* Estilos */
}

/* Sempre inclua :focus para acessibilidade */
.focus-bevap:focus {
    outline: 2px solid var(--bevap-primary);
    outline-offset: 2px;
}
```

## 🧪 Testing Checklist

Antes de submeter um widget para produção:

### Funcionalidade
- [ ] Estados: Loading, Empty, Error funcionam corretamente
- [ ] Filtros e buscas retornam resultados esperados
- [ ] Formulários validam dados corretamente
- [ ] Ações (salvar, deletar, etc.) funcionam como esperado

### Segurança
- [ ] Todos os inputs são sanitizados com `BevapUtils.escapeHtml()`
- [ ] Validação client-side E server-side implementada
- [ ] Sem uso de `eval()` ou `innerHTML` com dados não sanitizados
- [ ] CSRF tokens implementados em formulários (se aplicável)

### Acessibilidade
- [ ] Navegação por teclado funciona (Tab, Enter, Esc)
- [ ] Todas as imagens têm texto alternativo
- [ ] ARIA labels em elementos interativos
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Testado com leitor de tela

### Performance
- [ ] Sem consultas desnecessárias ao servidor
- [ ] Debounce/throttle em eventos frequentes (scroll, input)
- [ ] Lazy loading de dados quando aplicável
- [ ] Otimização de imagens e assets

### Responsividade
- [ ] Testado em mobile (320px+)
- [ ] Testado em tablet (768px+)
- [ ] Testado em desktop (1024px+)
- [ ] Touch-friendly (elementos ≥44px)

### Compatibilidade
- [ ] Testado em Chrome
- [ ] Testado em Firefox
- [ ] Testado em Safari
- [ ] Testado em Edge
- [ ] JavaScript ES5 (sem Arrow Functions, const, let, etc.)

## 📋 Pull Request Template

Ao submeter melhorias, inclua:

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Melhoria de performance
- [ ] Refatoração
- [ ] Atualização de documentação

## Checklist
- [ ] Código segue o style guide
- [ ] Dados sanitizados (XSS prevention)
- [ ] Testes de acessibilidade realizados
- [ ] Testado em múltiplos navegadores
- [ ] Documentação atualizada

## Screenshots (se aplicável)
Cole imagens das mudanças visuais
```

## 🚀 Deployment Checklist

Antes de deploy em produção:

1. **Code Review** - Pelo menos um revisor
2. **Security Scan** - Verificar vulnerabilidades
3. **Testing** - Executar todos os testes
4. **Backup** - Backup do ambiente atual
5. **Staging** - Testar em ambiente de homologação
6. **Monitoramento** - Preparar logs e métricas
7. **Rollback Plan** - Plano de reversão documentado
8. **Documentation** - Atualizar documentação de usuário

## 💡 Tips para Novos Desenvolvedores

1. **Comece pelos Exemplos**: Use widgets existentes como template
2. **Mantenha Consistência**: Siga os padrões estabelecidos
3. **Pense em Acessibilidade**: Desde o início, não como afterthought
4. **Teste Cedo**: Não deixe testes para o final
5. **Documente**: Código claro > código inteligente
6. **Peça Ajuda**: Code reviews são oportunidades de aprendizado

## 📞 Contato

Para dúvidas ou suporte:
- Abra uma issue no GitHub
- Consulte a documentação completa no README.md
- Entre em contato com a equipe VFLOWS/BEVAP

---

**Obrigado por contribuir com o projeto BEVAP!** 🎉
