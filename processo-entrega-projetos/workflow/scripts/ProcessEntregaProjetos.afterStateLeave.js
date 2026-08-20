function afterStateLeave(sequenceId) {
    try {
        var targetFieldsByActivity = {
            "18": ["anexosEntregaEP", "anexosTreinamentoEP"],
            "22": ["anexosEntregaEP", "anexosTreinamentoEP"],
            "27": ["anexosValFinalEP"],
            "35": ["anexosGoLiveTiEP"],
            "42": ["anexosSolicGoLiveEP"],
            "46": ["anexosEncerramentoEP"]
        };

        var activity = String(getValue("WKNumState") || sequenceId);
        var targetFields = targetFieldsByActivity[activity];
        if (!targetFields || !targetFields.length) return;

        var gson = new com.google.gson.Gson();
        var groupedAttachments = {};
        for (var t = 0; t < targetFields.length; t++) {
            groupedAttachments[targetFields[t]] = [];
        }

        var attachments = hAPI.listAttachments();
        if (!attachments || attachments.size() === 0) {
            saveGroupedAttachments(groupedAttachments, gson);
            return;
        }

        var registeredIds = getRegisteredAttachmentIds(targetFields);
        var metadataIndex = getAttachmentMetadataIndex(targetFields);

        for (var j = 0; j < attachments.size(); j++) {
            var attachment = attachments.get(j);
            var documentId = String(attachment.getDocumentId());
            if (registeredIds[documentId]) continue;

            var fileName = String(attachment.getDocumentDescription() || "");
            var metadata = metadataIndex.byDocumentId[documentId] || nextMetadataByFileName(metadataIndex.byFileName, fileName);
            var targetField = metadata.targetField || targetFields[0];
            if (!groupedAttachments[targetField]) groupedAttachments[targetField] = [];

            var item = {
                documentId: attachment.getDocumentId(),
                fileName: attachment.getDocumentDescription(),
                version: attachment.getVersion(),
                createdAt: attachment.getCreateDate(),
                fileSize: attachment.getPhisicalFileSize()
            };
            if (metadata.planId) item.planId = metadata.planId;
            if (metadata.scope) item.scope = metadata.scope;
            groupedAttachments[targetField].push(item);
        }

        saveGroupedAttachments(groupedAttachments, gson);
        log.info("[afterStateLeave Entrega] Atividade " + activity + ": anexos processados com sucesso.");
    } catch (error) {
        log.error("[afterStateLeave Entrega] Erro ao capturar anexos: " + error);
    }
}

function getRegisteredAttachmentIds(targetFields) {
    var registeredIds = {};
    var attachmentFields = [
        "anexosNS",
        "anexosApoioTITT",
        "anexosPropostaTIPC",
        "anexosCRC",
        "documentsJsonDP",
        "anexosEntregaEP",
        "anexosTreinamentoEP",
        "anexosValFinalEP",
        "anexosGoLiveTiEP",
        "anexosSolicGoLiveEP",
        "anexosEncerramentoEP"
    ];

    for (var f = 0; f < attachmentFields.length; f++) {
        var fieldName = attachmentFields[f];
        if (arrayContains(targetFields, fieldName)) continue;

        var parsed = parseJsonArray(hAPI.getCardValue(fieldName));
        for (var p = 0; p < parsed.length; p++) {
            var storedId = parsed[p] && (parsed[p].documentId || parsed[p].id);
            if (storedId) registeredIds[String(storedId)] = true;
        }
    }

    return registeredIds;
}

function getAttachmentMetadataIndex(targetFields) {
    var index = {
        byDocumentId: {},
        byFileName: {}
    };

    for (var f = 0; f < targetFields.length; f++) {
        var fieldName = targetFields[f];
        var items = parseJsonArray(hAPI.getCardValue(fieldName));
        for (var i = 0; i < items.length; i++) {
            var fileName = items[i] && (items[i].fileName || items[i].name);
            if (!fileName) continue;
            var metadata = {
                targetField: fieldName,
                planId: items[i].planId ? String(items[i].planId) : "",
                scope: items[i].scope ? String(items[i].scope) : ""
            };
            var documentId = items[i].documentId || items[i].documentID || items[i].id;
            if (documentId) index.byDocumentId[String(documentId)] = metadata;

            var fileKey = normalizeKey(fileName);
            if (!index.byFileName[fileKey]) index.byFileName[fileKey] = [];
            index.byFileName[fileKey].push(metadata);
        }
    }

    return index;
}

function nextMetadataByFileName(byFileName, fileName) {
    var queue = byFileName[normalizeKey(fileName)];
    if (!queue || !queue.length) return {};
    return queue.shift() || {};
}

function saveGroupedAttachments(groupedAttachments, gson) {
    for (var fieldName in groupedAttachments) {
        if (groupedAttachments.hasOwnProperty(fieldName)) {
            hAPI.setCardValue(fieldName, gson.toJson(groupedAttachments[fieldName] || []));
        }
    }
}

function parseJsonArray(rawValue) {
    if (!rawValue) return [];
    try {
        var parsed = JSON.parse(String(rawValue));
        return parsed && parsed.length ? parsed : [];
    } catch (ignore) {
        return [];
    }
}

function normalizeKey(value) {
    return String(value || "").toLowerCase().replace(/^\s+|\s+$/g, "");
}

function arrayContains(items, value) {
    for (var i = 0; i < (items || []).length; i++) {
        if (items[i] === value) return true;
    }
    return false;
}
