function afterStateLeave(sequenceId) {
    var atividade = getValue("WKNumState");

    // ? MAPEAMENTO IGUAL AO DE SOLICITAÇÃO
    // Adicione novas atividades aqui conforme necessário
    var targetFieldByActivity = {
        "14": "documentsJsonDP"      // Planejamento do Projeto
    };

    var targetField = targetFieldByActivity[String(atividade)];
    if (!targetField) return;

    try {
        var gson = new com.google.gson.Gson();
        var attachments = hAPI.listAttachments();

        // ? FUNÇÃO DE SEGURANÇA (IDÊNTICA A SOLICITAÇÃO)
        function safeParseArray(text) {
            var raw = String(text || "").trim();
            if (!raw) return [];

            try {
                var parsed = JSON.parse(raw);
                return (parsed && parsed.length !== undefined) ? parsed : [];
            } catch (e) {
                // fallback para casos onde JSON parse falhe por formatação
                try {
                    var parsed2 = gson.fromJson(raw, java.lang.Object);
                    return (parsed2 && parsed2.length !== undefined) ? parsed2 : [];
                } catch (e2) {
                    return [];
                }
            }
        }

        // ? EXTRAÇÃO DE IDS (IDÊNTICA A SOLICITAÇÃO)
        function extractDocumentIds(arr) {
            var ids = {};
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                var docId = item ? (item.documentId || item.documentID || item.id) : null;
                if (docId !== null && docId !== undefined) {
                    ids[String(docId)] = true;
                }
            }
            return ids;
        }

        // ? LISTA DE CAMPOS DE ANEXO (adicione se houver mais campos futuramente)
        var attachmentFields = [
            "documentsJsonDP"
        ];

        // ? EXCLUSÃO DE DUPLICIDADE CRUZADA (IDÊNTICA A SOLICITAÇÃO)
        var excludedIds = {};
        for (var f = 0; f < attachmentFields.length; f++) {
            var fieldName = attachmentFields[f];
            if (fieldName === targetField) {
                continue;
            }
            var jsonText = String(hAPI.getCardValue(fieldName) || "");
            var fieldIds = extractDocumentIds(safeParseArray(jsonText));

            for (var idKey in fieldIds) {
                if (fieldIds.hasOwnProperty(idKey)) {
                    excludedIds[idKey] = true;
                }
            }
        }

        // ? CAPTURA FINAL (IDÊNTICA A SOLICITAÇÃO)
        var jsonAttachments = [];

        for (var j = 0; j < attachments.size(); j++) {
            var attachment = attachments.get(j);
            var documentId = String(attachment.getDocumentId());

            // só pega anexos que ainda nao foram salvos em outros campos de anexo
            if (excludedIds[documentId] === true) continue;

            jsonAttachments.push({
                documentId: attachment.getDocumentId(),
                fileName: attachment.getDocumentDescription(),
                version: attachment.getVersion(),
                createdAt: attachment.getCreateDate(),
                fileSize: attachment.getPhisicalFileSize()
            });
        }

        // ? SALVAMENTO NO CAMPO
        var attachmentsString = gson.toJson(jsonAttachments);
        hAPI.setCardValue(targetField, attachmentsString);
        
        log.info("[afterStateLeave Desenvolvimento] Atividade " + atividade + ": " + jsonAttachments.length + " anexos salvos em " + targetField + " = " + attachmentsString);
        
    } catch (error) {
        log.error("[afterStateLeave Desenvolvimento] Erro ao capturar anexos (atividade " + atividade + "): " + error);
    }
}