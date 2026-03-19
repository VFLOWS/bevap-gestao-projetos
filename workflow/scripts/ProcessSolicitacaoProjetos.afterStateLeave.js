function afterStateLeave(sequenceId) {
    var atividade = getValue("WKNumState");

    if (atividade != 26) {
        return;
    }

    try {
        var gson = new com.google.gson.Gson();
        var attachments = hAPI.listAttachments();

        var baseJson = String(hAPI.getCardValue("anexosNS") || "");

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

        var baseIds = extractDocumentIds(safeParseArray(baseJson));

        var jsonAttachments = [];

        for (var j = 0; j < attachments.size(); j++) {
            var attachment = attachments.get(j);
            var documentId = String(attachment.getDocumentId());

            // só pega anexos que NÃO estavam na criação
            if (baseIds[documentId] === true) continue;

            jsonAttachments.push({
                documentId: attachment.getDocumentId(),
                fileName: attachment.getDocumentDescription(),
                version: attachment.getVersion(),
                createdAt: attachment.getCreateDate(),
                fileSize: attachment.getPhisicalFileSize()
            });
        }

        var attachmentsString = gson.toJson(jsonAttachments);
        hAPI.setCardValue("anexosApoioTITT", attachmentsString);

        log.info("[afterStateLeave] Triagem (26): anexos novos salvos em anexosApoioTITT = " + jsonAttachments.length);
    } catch (error) {
        log.error("[afterStateLeave] Erro ao capturar anexos da triagem (26): " + error);
    }
}