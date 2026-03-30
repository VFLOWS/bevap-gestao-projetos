function afterStateLeave(sequenceId) {
    var atividade = getValue("WKNumState");

    var targetFieldByActivity = {
        "26": "anexosApoioTITT",
        "36": "anexarAtaReuniaoCAP",
        "38": "anexosPropostaTIPC",
        "61": "anexarAtaReuniaoACP"
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
                // fallback para casos onde JSON parse falhe por formatação
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

        // Excluir anexos já salvos em qualquer campo de anexo para evitar duplicidade cruzada.
        var attachmentFields = [
            "anexosNS",
            "anexosApoioTITT",
            "anexarAtaReuniaoCAP",
            "anexosPropostaTIPC",
            "anexarAtaReuniaoACP",
            "anexosCRC"
        ];

        var excludedIds = {};
        for (var f = 0; f < attachmentFields.length; f++) {
            var fieldName = attachmentFields[f];
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

            // só pega anexos que NÃO estavam na criação
            if (excludedIds[documentId] === true) continue;

            jsonAttachments.push({
                documentId: attachment.getDocumentId(),
                fileName: attachment.getDocumentDescription(),
                version: attachment.getVersion(),
                createdAt: attachment.getCreateDate(),
                fileSize: attachment.getPhisicalFileSize()
            });
        }

        var attachmentsString = gson.toJson(jsonAttachments);

        hAPI.setCardValue(targetField, attachmentsString);
        log.info("[afterStateLeave] Atividade " + atividade + ": anexos novos salvos em " + targetField + " = " + jsonAttachments.length);
    } catch (error) {
        log.error("[afterStateLeave] Erro ao capturar anexos (atividade " + atividade + "): " + error);
    }
}
