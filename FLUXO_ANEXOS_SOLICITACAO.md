# 📎 FLUXO COMPLETO DE ANEXOS EM SOLICITAÇÃO DE PROJETOS

## 🎯 Resumo Executivo

O fluxo de anexos em Solicitação funciona em **3 camadas**:
1. **Frontend** (Widget JavaScript) - Captura e renderiza
2. **Backend** (Fluig Service) - Normaliza e serializa
3. **Workflow** (AfterStateLeave) - Captura e distribui por atividade

Cada anexo transita entre atividades como JSON serializado, permitindo que usuários adicionem arquivos em diferentes etapas.

---

## 📊 PADRÃO COMPLETO: Captura → Armazenamento → Transição

### 1️⃣ **CAPTURA (Frontend - ps-newSolicitationController.js)**

#### UI - Dropzone e Input
```html
<!-- ps-new-solicitation.html, Step 3 -->
<div id="dropzone" class="border-2 border-dashed...">
  <!-- Drag & drop zone -->
</div>
<input id="attachments-input" type="file" class="hidden" multiple>
<div id="files-list"><!-- Anexos renderizados aqui --></div>
```

#### Eventos de Captura
```javascript
// 1. Drag & Drop
container.on('drop#ps-newSolicitation', '#dropzone', (event) => {
  const files = event.originalEvent.dataTransfer.files;
  this.addAttachments(files);  // ← Entra aqui
});

// 2. Click Input
container.on('change#ps-newSolicitation', '#attachments-input', (event) => {
  const files = event.currentTarget.files;
  this.addAttachments(files);  // ← Entra aqui
  event.currentTarget.value = '';  // Reset input
});
```

#### Adição ao Estado (validação)
```javascript
addAttachments: function (filesList) {
  const maxSizeBytes = 10 * 1024 * 1024;  // 10MB limit
  
  files.forEach((file) => {
    // ✅ Validação 1: Tamanho máximo
    if (file.size > maxSizeBytes) {
      this.showNotification({
        title: 'Arquivo acima do limite',
        message: `${file.name} excede 10MB`
      });
      return;
    }
    
    // ✅ Validação 2: Duplicatas
    const alreadyExists = this._state.attachments.some((att) => {
      if (att.file) {
        return att.file.name === file.name &&
               att.file.size === file.size &&
               att.file.lastModified === file.lastModified;
      }
      return att.fileName === file.name;
    });
    if (alreadyExists) return;
    
    // ✅ Armazenamento no estado interno
    this._state.attachments.push({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: file  // ← File object do navegador
    });
  });
  
  this.renderAttachments();  // Atualiza UI
}
```

#### Remoção
```javascript
container.on('click#ps-newSolicitation', '[data-action="remove-attachment"]', (event) => {
  const attachmentId = String($(event.currentTarget).attr('data-file-id')).trim();
  this.removeAttachment(attachmentId);
});

removeAttachment: function (attachmentId) {
  this._state.attachments = this._state.attachments
    .filter((att) => att.id !== attachmentId);
  this.renderAttachments();
}
```

---

### 2️⃣ **ARMAZENAMENTO (Preparação para Envio)**

#### Coleta de Payload (Base64)
```javascript
// Quando usuário clica "ENVIAR"
collectAttachmentsPayload: async function () {
  const items = this._state.attachments.filter((att) => att.file);
  
  const attachmentPayload = await Promise.all(
    items.map(async (att) => {
      const file = att.file;
      const fileContent = await this.readFileAsBase64(file);
      
      return {
        fileName: String(file.name).trim(),
        fileContent: String(fileContent).trim(),  // ← Base64 encoded
        fileSize: String(file.size).trim()
      };
    })
  );
  
  return attachmentPayload.filter((item) => 
    item.fileName && item.fileContent
  );
}

readFileAsBase64: function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const raw = String(event.target.result);
      const base64 = raw.indexOf(',') >= 0 
        ? raw.split(',')[1] 
        : raw;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}`));
    reader.readAsDataURL(file);
  });
}
```

#### Coleta de Metadata (para salvar no campo)
```javascript
buildAttachmentMetadata: function () {
  return this._state.attachments.map((attachment) => {
    // Para arquivos NOVOS (não persistidos)
    if (attachment.file) {
      return {
        fileName: this.asText(attachment.file.name),
        fileSize: String(attachment.file.size)
      };
    }
    
    // Para anexos JÁ SALVOS (persistidos)
    return {
      documentId: this.asText(attachment.documentId),
      fileName: this.asText(attachment.fileName),
      fileSize: this.asText(attachment.fileSize),
      version: this.asText(attachment.version),
      createdAt: this.asText(attachment.createdAt),
      persisted: true  // ← Marca como salvo
    };
  }).filter((att) => att.fileName);
}
```

#### Estrutura do Payload Enviado
```javascript
{
  titulo: "SSO - Single Sign-On",
  coligada: "01",
  // ... outros campos ...
  attachments: [
    {
      fileName: "proposta.pdf",
      fileContent: "JVBERi0xLjQKJeLj7obqja7jbapq...",  // Base64
      fileSize: "2097152"  // Em bytes
    },
    {
      fileName: "escopo.docx",
      fileContent: "UEsDBBQABgAIAAAAIQDkn8YC...",
      fileSize: "45056"
    }
  ],
  attachmentsMetadata: [
    {
      fileName: "proposta.pdf",
      fileSize: "2097152"
    },
    {
      fileName: "escopo.docx",
      fileSize: "45056"
    }
  ]
}
```

---

### 3️⃣ **SALVAMENTO NO FLUIG (fluig.service.js)**

#### normalizeAttachmentMetadata
```javascript
normalizeAttachmentMetadata: function (attachments) {
  return this.toArray(attachments)
    .map(function (attachment) {
      return {
        fileName: self.asTrimmedString(attachment && attachment.fileName),
        fileSize: self.asTrimmedString(attachment && attachment.fileSize),
        persisted: self.asBooleanString(attachment && attachment.persisted)
      };
    })
    .filter(function (attachment) {
      return attachment.fileName !== "";
    });
}
```

#### Construção do Card Data
```javascript
buildProjectSolicitationCardData: function (formData) {
  var cardData = {};
  
  // ... outros campos ...
  
  // AQUI OS ANEXOS SÃO SALVOS COMO JSON NO CAMPO
  cardData.anexosNS = JSON.stringify(
    this.normalizeAttachmentMetadata(
      formData.attachmentsMetadata || formData.attachments
    )
  );
  
  return cardData;
}
```

#### Resultado Salvo no Card
```
Campo: anexosNS
Valor (JSON string):
[
  {
    "fileName": "proposta.pdf",
    "fileSize": "2097152",
    "persisted": false
  },
  {
    "fileName": "escopo.docx",
    "fileSize": "45056",
    "persisted": false
  }
]
```

---

### 4️⃣ **CAPTURA NA TRANSIÇÃO (afterStateLeave.js)**

**Arquivo:** `ProcessSolicitacaoProjetos.afterStateLeave.js`

#### Mapeamento Atividade → Campo
```javascript
var targetFieldByActivity = {
    "15": "anexosNS",              // Nova Solicitação
    "26": "anexosApoioTITT",        // TI Triagem Técnica
    "36": "anexarAtaReuniaoCAP",    // Aprovação Comitê Projetos
    "38": "anexosPropostaTIPC",     // TI Proposta Comercial
    "61": "anexarAtaReuniaoACP",    // Aprovação Comitê Interno
    "66": "anexosCRC"               // CRC
};
```

#### Lógica de Captura (Simplificada)
```javascript
function afterStateLeave(sequenceId) {
  var atividade = getValue("WKNumState");
  var targetField = targetFieldByActivity[String(atividade)];
  if (!targetField) return;  // Não captura se atividade não está mapeada
  
  try {
    // 1️⃣ OBTÉM TODOS OS ANEXOS FÍSICOS DO FLUIG
    var attachments = hAPI.listAttachments();
    
    // 2️⃣ EXTRAI IDs dos anexos JÁ SALVOS em OUTROS campos
    var excludedIds = {};
    var attachmentFields = [
      "anexosNS",
      "anexosApoioTITT",
      "anexarAtaReuniaoCAP",
      "anexosPropostaTIPC",
      "anexarAtaReuniaoACP",
      "anexosCRC"
    ];
    
    for (var f = 0; f < attachmentFields.length; f++) {
      var fieldName = attachmentFields[f];
      if (fieldName === targetField) continue;  // Pula o próprio campo
      
      var jsonText = String(hAPI.getCardValue(fieldName) || "");
      var parsed = JSON.parse(jsonText);
      
      // Marca como excluído
      parsed.forEach(function (item) {
        excludedIds[String(item.documentId)] = true;
      });
    }
    
    // 3️⃣ FILTRA ANEXOS NOVOS (não salvos em outro lugar)
    var jsonAttachments = [];
    for (var j = 0; j < attachments.size(); j++) {
      var attachment = attachments.get(j);
      var documentId = String(attachment.getDocumentId());
      
      // Só pega anexos que AINDA NÃO foram salvos
      if (excludedIds[documentId] === true) continue;
      
      jsonAttachments.push({
        documentId: attachment.getDocumentId(),
        fileName: attachment.getDocumentDescription(),
        version: attachment.getVersion(),
        createdAt: attachment.getCreateDate(),
        fileSize: attachment.getPhisicalFileSize()
      });
    }
    
    // 4️⃣ SALVA NO CAMPO DE ANEXO
    hAPI.setCardValue(targetField, JSON.stringify(jsonAttachments));
    
    log.info(`[afterStateLeave] Atividade ${atividade}: 
      ${jsonAttachments.length} anexos salvos em ${targetField}`);
      
  } catch (error) {
    log.error(`[afterStateLeave] Erro: ${error}`);
  }
}
```

---

## 📋 CAMPOS DE ANEXO EM SOLICITAÇÃO

### FormSolicitacaoProjetos.html

| Campo ID | Label | Tipo | Atividade | Descrição |
|----------|-------|------|-----------|-----------|
| `anexosNS` | "anexos" | textarea, JSON | Nova Solicitação (15) | Anexos da solicitação inicial |
| `anexosApoioTITT` | "Anexos de Apoio" | textarea, JSON | TI Triagem Técnica (26) | Pré-propostas, estudos técnicos |
| `anexarAtaReuniaoCAP` | "Ata da Reunião" | textarea, JSON | Aprovação Comitê (36) | Ata de aprovação do comitê |
| `anexosPropostaTIPC` | "Anexos da Proposta" | textarea, JSON | TI Proposta Comercial (38) | Proposta comercial, termos, escopo |
| `anexarAtaReuniaoACP` | "Ata da Reunião" | textarea, JSON | Aprovação Comitê Interno (61) | Ata de aprovação interno |
| `anexosCRC` | "Anexos CRC" | textarea, JSON | CRC (66) | Documentos finais CRC |

**Campos de Validação (Checkbox/não armazenam):**
- `anexosessenciaispresentesAPTI` - Checkbox validação
- `anexosEssenciaisPresentesTITT` - Checkbox validação

---

## 🎛️ WIDGETS E COMPONENTES

### Controllers que gerenciam anexos

#### 1. **ps-newSolicitationController.js** (Nova Solicitação)
- **Campo:** `anexosNS`
- **Dropzone:** `#dropzone`
- **Input:** `#attachments-input`
- **Lista:** `#files-list`
- **Max Size:** 10MB
- **Funcionalidades:** Captura, renderização, coleta de payload

#### 2. **ps-commercialProposalController.js** (Proposta Comercial)
- **Campo:** `anexosPropostaTIPC`
- **Dropzone:** `#proposal-dropzone`
- **Input:** `#proposal-attachments-input`
- **Lista:** `#proposal-attachments-list`
- **Reutiliza:** `parsePersistedAttachments`, `renderAttachmentsList`

#### 3. **ps-technicalTriageController.js** (Triagem Técnica)
- **Campo:** `anexosApoioTITT`
- **Dropzone:** Similar ao comercial
- **Input:** `#external-attachments-input`

#### 4. **ps-committeeApprovalController.js** e **ps-committeeCostApprovalController.js**
- **Campo:** `anexarAtaReuniaoCAP` ou `anexarAtaReuniaoACP`
- **Funcionalidade:** Upload de Ata da Reunião

### Métodos Compartilhados

#### parsePersistedAttachments (Carrega anexos salvos)
```javascript
parsePersistedAttachments: function (value) {
  const text = this.asText(value);
  if (!text) return [];
  
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    
    return parsed.map((item) => {
      const documentId = this.asText(item && (item.documentId || item.id));
      const fileName = this.asText(item && (item.fileName || item.name));
      
      if (!fileName) return null;
      
      return {
        id: documentId ? `persisted:${documentId}` : `persisted:${fileName}`,
        documentId: documentId,
        fileName: fileName,
        fileSize: item.fileSize,
        persisted: true  // ← Marca como persistido
      };
    }).filter(Boolean);
    
  } catch (error) {
    return [];
  }
}
```

#### renderAttachmentsList (Renderiza na UI)
```javascript
renderAttachmentsList: function () {
  const list = this.getContainer().find('#proposal-attachments-list');
  if (!list.length) return;
  
  const items = Array.isArray(this._state.attachments) 
    ? this._state.attachments 
    : [];
    
  if (!items.length) {
    list.html('<div class="text-sm text-gray-500">Nenhum anexo</div>');
    return;
  }
  
  list.html(items.map((att) => {
    const fileName = att.file ? att.file.name : att.fileName;
    const canRemove = !att.persisted;  // ← Desabilita remoção se persistido
    
    return `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center min-w-0">
          <i class="fa-solid ${iconClass} text-xl mr-3"></i>
          <div class="min-w-0">
            <div class="font-medium text-sm">${fileName}</div>
            <div class="text-xs text-gray-500">${fileSize}</div>
          </div>
        </div>
        ${canRemove 
          ? '<button>Remover</button>' 
          : '<button disabled><i class="fa-solid fa-lock"></i></button>'}
      </div>
    `;
  }).join(''));
}
```

---

## 🔄 CICLO COMPLETO: Passo a Passo

```
┌─────────────────────────────────────────────────────────────┐
│ PASSO 1: USUÁRIO ARRASTA/SELECIONA ARQUIVO                  │
└─────────────────────────────────────────────────────────────┘
        │
        ├─ Evento: drop (drag) OU change (input)
        ├─ Validação: Tamanho máximo (10MB)
        ├─ Validação: Não duplicar
        └─ Armazenamento: _state.attachments.push({ id, file })

┌─────────────────────────────────────────────────────────────┐
│ PASSO 2: UI RENDERIZA ANEXO                                 │
└─────────────────────────────────────────────────────────────┘
        │
        ├─ renderAttachments() gera HTML
        ├─ Mostra ícone do tipo de arquivo
        ├─ Mostra tamanho em MB/KB
        └─ Botão de remover (ativo para não-persistidos)

┌─────────────────────────────────────────────────────────────┐
│ PASSO 3: USUÁRIO CLICA "ENVIAR SOLICITAÇÃO"                 │
└─────────────────────────────────────────────────────────────┘
        │
        ├─ collectAttachmentsPayload() → Base64
        ├─ buildAttachmentMetadata() → JSON metadata
        └─ buildSubmissionPayload() → Estrutura completa

┌─────────────────────────────────────────────────────────────┐
│ PASSO 4: FLUIG SERVICE PROCESSA                             │
└─────────────────────────────────────────────────────────────┘
        │
        ├─ normalizeAttachmentMetadata()
        ├─ buildProjectSolicitationCardData()
        ├─ Salva em anexosNS como JSON
        └─ Envia attachments como anexos FÍSICOS do Fluig

┌─────────────────────────────────────────────────────────────┐
│ PASSO 5: WORKFLOW PROCESSA (afterStateLeave)                │
└─────────────────────────────────────────────────────────────┘
        │
        ├─ hAPI.listAttachments() → Lista física
        ├─ Extrai documentIds dos campos existentes
        ├─ Filtra apenas NOVOS anexos
        └─ Salva em anexosNS (atividade 15)

┌─────────────────────────────────────────────────────────────┐
│ PASSO 6: PRÓXIMA ATIVIDADE CARREGA ANEXOS                   │
└─────────────────────────────────────────────────────────────┘
        │
        ├─ parsePersistedAttachments() lê JSON
        ├─ Restaura attachments com persisted: true
        ├─ Renderiza com ícone de LOCK 🔒
        └─ Usuário pode adicionar MAIS anexos

┌─────────────────────────────────────────────────────────────┐
│ PASSO 7: CICLO SE REPETE                                    │
└─────────────────────────────────────────────────────────────┘
        │
        └─ Cada atividade pode capturar novos anexos
           e adicionar ao seu campo específico
```

---

## 🔍 RASTREAMENTO TÉCNICO

### JSON Estrutura do Campo `anexosNS`
```json
[
  {
    "fileName": "proposta_comercial.pdf",
    "fileSize": "2097152",
    "documentId": "14521",
    "version": "1",
    "createdAt": "2024-01-15T10:30:45Z",
    "persisted": true
  },
  {
    "fileName": "escopo_detalhado.docx",
    "fileSize": "45056",
    "documentId": "14522",
    "version": "1",
    "createdAt": "2024-01-15T10:31:12Z",
    "persisted": true
  }
]
```

### Transição Entre Atividades

**Atividade 15 (Nova Solicitação) → Atividade 26 (Triagem Técnica):**

```
1. afterStateLeave (Atividade 15)
   ├─ targetField = "anexosNS"
   ├─ Captura anexos FÍSICOS do Fluig
   ├─ Exclui IDs já em outros campos
   └─ Salva em anexosNS

2. Transição para Atividade 26
   
3. ps-technicalTriageController inicializa
   ├─ Lê campo anexosApoioTITT (vazio)
   ├─ parsePersistedAttachments([]) → []
   ├─ Usuário pode upload NEW arquivos
   └─ Ao sair: afterStateLeave salva em anexosApoioTITT

4. Ciclo continua...
```

---

## ⚙️ DADOS: Dataset `dsGetSolicitacaoProjetos`

Retorna os campos de anexo já populados:

```
Row {
  documentid: "12345",
  titulodoprojetoNS: "SSO",
  anexosNS: "[{\"fileName\":\"...\", ...}]",  // ← JSON string
  anexosApoioTITT: "[...]",
  anexosPropostaTIPC: "[...]",
  ...
}
```

Controllers parseiam este JSON e restauram no `_state.attachments`.

---

## 🎯 CONCLUSÃO

O fluxo de anexos em Solicitação é **robusto e multicamadas:**

✅ **Frontend:** Captura com validação (tamanho, duplicata)  
✅ **Serialização:** Base64 para transmissão + JSON para armazenamento  
✅ **Backend:** Fluig Service normaliza e serializa  
✅ **Workflow:** afterStateLeave captura e distribui por atividade  
✅ **Persistência:** Anexos salvos permitem transição entre atividades  
✅ **UI/UX:** Lock 🔒 indica anexos não-removíveis, renderização intuitiva  

Cada atividade possui seu próprio campo de anexo, permitindo documentação granular do processo.
