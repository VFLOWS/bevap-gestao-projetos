function afterStateLeave(sequenceId) {
    var atividade = getValue("WKNumState");

    var targetFieldByActivity = {
        "18": "anexosExecucaoAtividade"
    };

    var targetField = targetFieldByActivity[String(atividade)];
    if (!targetField) return;

    try {
        var gson = new com.google.gson.Gson();
        var attachments = hAPI.listAttachments();

        function safeParseArray(text) {
            var raw = String(text || "").trim();
            if (!raw) return [];

            try {
                var parsed = JSON.parse(raw);
                return (parsed && parsed.length !== undefined) ? parsed : [];
            } catch (e) {
                try {
                    var parsed2 = gson.fromJson(raw, java.lang.Object);
                    return (parsed2 && parsed2.length !== undefined) ? parsed2 : [];
                } catch (e2) {
                    return [];
                }
            }
        }

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

        var attachmentFields = [
            "anexosExecucaoAtividade"
        ];

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

        var jsonAttachments = [];
        for (var j = 0; j < attachments.size(); j++) {
            var attachment = attachments.get(j);
            var documentId = String(attachment.getDocumentId());
            if (excludedIds[documentId] === true) continue;

            jsonAttachments.push({
                documentId: attachment.getDocumentId(),
                fileName: attachment.getDocumentDescription(),
                version: attachment.getVersion(),
                createdAt: attachment.getCreateDate(),
                fileSize: attachment.getPhisicalFileSize()
            });
        }

        hAPI.setCardValue(targetField, gson.toJson(jsonAttachments));
        log.info("[afterStateLeave execucaoFasesAtividades] Atividade " + atividade + ": anexos salvos em " + targetField + " = " + jsonAttachments.length);
    } catch (error) {
        log.error("[afterStateLeave execucaoFasesAtividades] Erro ao capturar anexos (atividade " + atividade + "): " + error);
    }
}
