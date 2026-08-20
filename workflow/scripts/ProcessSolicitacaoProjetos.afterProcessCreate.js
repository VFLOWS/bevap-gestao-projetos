var GP_NOTIFY_TEMPLATE = "tpl_gp_tarefa_pendente";
var GP_NOTIFY_SENDER = "b1c70351e76b4a59b8f12f596389cbb5";
var GP_WIDGET_URL = "https://fluig.bevap.com.br:8443/portal/p/1/bevap-gestao-projetos";
var GP_PROCESS_NAME = "ProcessSolicitacaoProjetos";
var GP_INITIAL_ACTIVITY = "5";
var GP_NOTIFY_FIXED_RECIPIENTS = [
    { name: "Jose Adriano", receiver: "jgomes@bevap.com.br", external: true },
    { name: "Vinicius Nogueira", receiver: "vinicius.nogueira@vflows.com.br", external: true },
    { name: "Diana Rocha", receiver: "drsilva@bevap.com.br", external: true },
    { name: "Lucas Carvalho", receiver: "lucas.carvalho@vflows.com.br", external: true }
];

function afterProcessCreate(processId) {
    try {
        saveInitialAttachments();
    } catch (e) {
        log.error("[GP][" + GP_PROCESS_NAME + ".afterProcessCreate] Erro ao salvar anexos iniciais: " + e);
    }

    try {
        notifyInitialTask(processId);
    } catch (e2) {
        log.error("[GP][" + GP_PROCESS_NAME + ".afterProcessCreate] Erro ao notificar tarefa inicial: " + e2);
    }
}

function saveInitialAttachments() {
    var attachments = hAPI.listAttachments();
    var jsonAttachments = [];
    var gson = new com.google.gson.Gson();

    for (var i = 0; i < attachments.size(); i++) {
        var attachment = attachments.get(i);

        jsonAttachments.push({
            documentId: attachment.getDocumentId(),
            fileName: attachment.getDocumentDescription(),
            version: attachment.getVersion(),
            createdAt: attachment.getCreateDate(),
            fileSize: attachment.getPhisicalFileSize()
        });
    }

    var attachmentsString = gson.toJson(jsonAttachments);

    hAPI.setCardValue("anexosNS", attachmentsString);
}

function notifyInitialTask(processId) {
    var context = buildInitialNotificationContext(processId);

    log.info("[GP][" + GP_PROCESS_NAME + ".afterProcessCreate] Notificando atividade inicial: processo=" + context.processId +
        ", processoDefinicao=" + context.processDefinitionId +
        ", atividade=" + context.activity +
        ", descricao=" + context.activityDescription +
        ", destinatarios=" + GP_NOTIFY_FIXED_RECIPIENTS.length + ".");

    for (var i = 0; i < GP_NOTIFY_FIXED_RECIPIENTS.length; i++) {
        sendNotification(context, GP_NOTIFY_FIXED_RECIPIENTS[i]);
    }
}

function buildInitialNotificationContext(processId) {
    var processInstanceId = text(processId) || workflowValue("WKNumProces");
    var processDefinitionId = workflowValue("WKDef") || GP_PROCESS_NAME;
    var documentId = workflowValue("WKCardId");
    var projectCode = getProjectCode(processInstanceId);
    var link = GP_WIDGET_URL + "#evaluateProject?processInstanceId=" + processInstanceId;

    if (documentId) {
        link += "&documentId=" + documentId;
    }

    return {
        activity: GP_INITIAL_ACTIVITY,
        activityDescription: getActivityDescription(processDefinitionId, GP_INITIAL_ACTIVITY),
        responsibilityDescription: "grupo",
        processDefinitionId: processDefinitionId,
        processId: processInstanceId,
        projectCode: projectCode,
        projectName: projectCode,
        link: link
    };
}

function getProjectCode(processId) {
    var code = cardValue("codigoglpi");
    if (code) return code;

    return buildProjectCode(processId, null);
}

function buildProjectCode(processInstanceId, referenceDate) {
    var pid = text(processInstanceId).replace(/^0+/, "");
    if (!pid) return "";

    var dt = referenceDate ? new Date(referenceDate) : new Date();
    if (isNaN(dt.getTime())) dt = new Date();

    var year = dt.getFullYear();
    var month = dt.getMonth() + 1;
    var startYear = month >= 4 ? year : year - 1;
    var endYear = startYear + 1;
    var safraCode = String(startYear).slice(-2) + String(endYear).slice(-2);
    var paddedProcessId = pid;

    while (paddedProcessId.length < 4) {
        paddedProcessId = "0" + paddedProcessId;
    }

    return "PRJ-" + safraCode + "-" + paddedProcessId;
}

function getActivityDescription(processDefinitionId, activity) {
    var rows = datasetRowsByConstraints("processState", {
        "processStatePK.processId": processDefinitionId,
        "processStatePK.sequence": activity
    });

    if (!rows.length) {
        throw "Dataset processState nao retornou linhas para processo " + processDefinitionId + " atividade " + activity + ".";
    }

    var selected = null;
    var selectedVersion = -1;

    for (var i = 0; i < rows.length; i++) {
        var version = parseInt(rows[i]("processStatePK.version") || rows[i]("version"), 10);
        if (isNaN(version)) version = -1;

        if (selected === null || version > selectedVersion) {
            selected = rows[i];
            selectedVersion = version;
        }
    }

    var description = selected ? text(selected("stateDescription")) : "";
    if (!description) {
        throw "Dataset processState retornou linha sem stateDescription para processo " + processDefinitionId + " atividade " + activity + ".";
    }

    return description;
}

function sendNotification(context, recipient) {
    var params = new java.util.HashMap();
    var htmlMessage = buildHtmlMessage(context, recipient.name);
    var destinations = new java.util.ArrayList();

    destinations.add(recipient.receiver);

    params.put("subject", "[" + context.projectCode + "] Gest\u00e3o de Projetos - " + context.activityDescription);
    params.put("htmlBody",
        "<p style=\"margin:0 0 24px 0;\">" + htmlMessage + "</p>" +
        "<p style=\"margin:0;text-align:center;\"><a href=\"" + escapeHtml(context.link) + "\" style=\"background-color:#007bff;color:#ffffff;padding:12px 25px;text-decoration:none;border-radius:5px;font-size:16px;display:inline-block;\">Clique aqui para acessar a tarefa</a></p>");

    log.info("[GP][" + GP_PROCESS_NAME + ".afterProcessCreate] notifier.notify destino=" + recipient.receiver +
        ", tipo=" + (recipient.external ? "email" : "usuario") +
        ", processo=" + context.processId +
        ", processoDefinicao=" + context.processDefinitionId +
        ", atividade=" + context.activity +
        ", descricao=" + context.activityDescription);

    notifier.notify(GP_NOTIFY_SENDER, GP_NOTIFY_TEMPLATE, params, destinations, "text/html");
}

function buildHtmlMessage(context, name) {
    return "Ol\u00e1 " + escapeHtml(name) + " existe uma tarefa <strong>" + escapeHtml(context.activityDescription) + "</strong>" +
        " pendente para o seu " + escapeHtml(context.responsibilityDescription) +
        " referente ao projeto <strong>" + escapeHtml(context.projectName) + "</strong>.";
}

function datasetRowsByConstraints(datasetName, filters) {
    var constraints = [];

    for (var field in filters) {
        if (filters.hasOwnProperty(field)) {
            var value = text(filters[field]);
            constraints.push(DatasetFactory.createConstraint(field, value, value, ConstraintType.MUST));
        }
    }

    var dataset = DatasetFactory.getDataset(datasetName, null, constraints, null);
    var rows = [];
    var count = getDatasetRowCount(dataset);

    for (var i = 0; i < count; i++) {
        rows.push(function (row) {
            return function (column) {
                return datasetValue(dataset, row, column);
            };
        }(i));
    }

    return rows;
}

function getDatasetRowCount(dataset) {
    if (!dataset) return 0;

    try {
        if (dataset.getRowCount) return parseInt(dataset.getRowCount(), 10) || 0;
    } catch (e) {}

    try {
        if (dataset.getRowsCount) return parseInt(dataset.getRowsCount(), 10) || 0;
    } catch (e2) {}

    return parseInt(dataset.rowsCount, 10) || 0;
}

function cardValue(field) {
    try {
        return text(hAPI.getCardValue(field));
    } catch (e) {
        return "";
    }
}

function workflowValue(field) {
    try {
        return text(getValue(field));
    } catch (e) {
        return "";
    }
}

function datasetValue(dataset, row, column) {
    try {
        return text(dataset.getValue(row, column));
    } catch (e) {
        return "";
    }
}

function text(value) {
    return value === null || value === undefined ? "" : String(value).trim();
}

function escapeHtml(value) {
    return text(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
