var GP_NOTIFY_TEMPLATE = "tpl_gp_tarefa_pendente";
var GP_NOTIFY_SENDER = "b1c70351e76b4a59b8f12f596389cbb5";
var GP_WIDGET_URL = "https://fluig.bevap.com.br:8443/portal/p/1/bevap-gestao-projetos";
var GP_PROCESS_NAME = "ProcessEntregaProjetos";
var GP_NOTIFY_FIXED_RECIPIENTS = [
    { name: "Jose Adriano", receiver: "jgomes@bevap.com.br", external: true },
    { name: "Vinicius Nogueira", receiver: "vinicius.nogueira@vflows.com.br", external: true },
    { name: "Diana Rocha", receiver: "drsilva@bevap.com.br", external: true },
    { name: "Lucas Carvalho", receiver: "lucas.carvalho@vflows.com.br", external: true }
];

function afterTaskCreate(colleagueId) {
    try {
        var activity = getCurrentActivity();
        var config = getNotifyConfig(activity);
        if (!config) {
            log.warn("[GP][" + GP_PROCESS_NAME + ".afterTaskCreate] Nenhuma configuracao de notificacao para atividade=" + activity +
                ", WKNextState=" + workflowValue("WKNextState") +
                ", WKNumState=" + workflowValue("WKNumState") + ".");
            return;
        }

        var context = buildContext(activity, config);
        var recipients = GP_NOTIFY_FIXED_RECIPIENTS;

        for (var i = 0; i < recipients.length; i++) {
            sendNotification(context, recipients[i]);
        }
    } catch (e) {
        log.error("[GP][" + GP_PROCESS_NAME + ".afterTaskCreate] Erro ao notificar tarefa pendente: " + e);
    }
}

function getCurrentActivity() {
    return workflowValue("WKNextState") || workflowValue("WKNumState");
}

function getNotifyConfig(activity) {
    var configs = {
        "14": { type: "group", target: "TI", route: "epGlpiErrorTreatment" },
        "18": { type: "group", target: "TI", route: "epDeliveryPlanning" },
        "22": { type: "group", target: "TI", route: "epUserTraining" },
        "27": { type: "group", target: "TI", route: "epFinalGoLiveValidation" },
        "35": { type: "group", target: "TI", route: "epGoLiveExecution" },
        "42": { type: "user", field: "solicitanteColleagueIdNS", route: "epRequesterGoLiveValidation" },
        "46": { type: "group", target: "TI", route: "epProjectClosureDocumentation" },
        "50": { type: "group", target: "TI", route: "epGlpiErrorTreatment" }
    };

    return configs[String(activity)] || null;
}

function buildContext(activity, config) {
    var processId = text(getValue("WKNumProces"));
    var processDefinitionId = getProcessDefinitionId();
    var documentId = text(getValue("WKCardId"));
    var link = GP_WIDGET_URL + "#" + config.route + "?processInstanceId=" + processId;
    var projectCode = getProjectCode(processId);

    if (documentId) {
        link += "&documentId=" + documentId;
    }

    return {
        activity: activity,
        activityDescription: getActivityDescription(processDefinitionId, activity),
        responsibilityDescription: getResponsibilityDescription(config),
        processDefinitionId: processDefinitionId,
        processId: processId,
        projectCode: projectCode,
        projectName: projectCode,
        link: link
    };
}

function getProcessDefinitionId() {
    var processDefinitionId = text(getValue("WKDef"));

    if (!processDefinitionId) {
        throw "WKDef vazio; nao foi possivel consultar processState.";
    }

    return processDefinitionId;
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

function getResponsibilityDescription(config) {
    if (config.type === "group") return "grupo";
    if (config.type === "role") return "papel";
    return "usu\u00e1rio";
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

function getRecipients(config) {
    if (config.type === "user") return userRecipient(cardValue(config.field));
    if (config.type === "group") return groupRecipients(config.target);
    if (config.type === "role") return roleRecipients(config.target);
    return [];
}

function userRecipient(colleagueId) {
    var user = getColleague(colleagueId);
    return user.receiver ? [user] : [];
}

function groupRecipients(groupId) {
    var rows = datasetRows("colleagueGroup", "colleagueGroupPK.groupId", groupId);
    var recipients = [];
    var seen = {};

    for (var i = 0; i < rows.length; i++) {
        var user = getColleague(rows[i]("colleagueGroupPK.colleagueId") || rows[i]("colleagueId"));

        if (user.receiver && !seen[user.receiver]) {
            seen[user.receiver] = true;
            recipients.push(user);
        }
    }

    return recipients;
}

function roleRecipients(roleId) {
    var rows = datasetRows("workflowColleagueRole", "workflowColleagueRolePK.roleId", roleId);
    var recipients = [];
    var seen = {};

    for (var i = 0; i < rows.length; i++) {
        var user = getColleague(rows[i]("workflowColleagueRolePK.colleagueId") || rows[i]("colleagueId"));

        if (user.receiver && !seen[user.receiver]) {
            seen[user.receiver] = true;
            recipients.push(user);
        }
    }

    return recipients;
}

function getColleague(colleagueId) {
    var id = text(colleagueId);
    var rows = id ? datasetRows("colleague", "colleaguePK.colleagueId", id) : [];

    if (rows.length === 0) return { colleagueId: id, name: id, receiver: "" };

    var email = rows[0]("mail") || rows[0]("email");

    return {
        colleagueId: id,
        name: rows[0]("colleagueName") || rows[0]("name") || id,
        receiver: email,
        email: email
    };
}

function getSubstituteRecipients(recipients) {
    var substitutes = [];
    var seen = {};

    for (var i = 0; i < recipients.length; i++) {
        var ownerId = text(recipients[i].colleagueId);
        if (!ownerId) continue;

        var rows = datasetRows("dsGetSubstitutosUsuario", "colleagueId", ownerId);
        var content = getSubstituteContent(rows.length ? rows[0]("rawResponse") : "");

        for (var j = 0; j < content.length; j++) {
            if (!canUseSubstituteForProcess(content[j])) continue;

            var substitute = getColleague(content[j].substituteId);
            if (substitute.receiver && !seen[substitute.receiver]) {
                substitute.substitute = true;
                seen[substitute.receiver] = true;
                substitutes.push(substitute);
            }
        }
    }

    return substitutes;
}

function getSubstituteContent(rawResponse) {
    try {
        var body = rawResponse ? JSON.parse(rawResponse) : {};
        return body.content && body.content.length ? body.content : [];
    } catch (e) {
        log.warn("[GP][" + GP_PROCESS_NAME + ".afterTaskCreate] Erro ao ler substitutos: " + e);
        return [];
    }
}

function canUseSubstituteForProcess(substitute) {
    var processes = substitute && substitute.processes;
    if (!processes || processes.length === 0) return true;

    for (var i = 0; i < processes.length; i++) {
        if (text(processes[i] && processes[i].process) === GP_PROCESS_NAME) return true;
    }

    return false;
}

function uniqueRecipients(recipients) {
    var unique = [];
    var seen = {};

    for (var i = 0; i < recipients.length; i++) {
        var receiver = text(recipients[i].receiver);
        if (receiver && !seen[receiver]) {
            seen[receiver] = true;
            unique.push(recipients[i]);
        }
    }

    return unique;
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

    log.info("[GP][" + GP_PROCESS_NAME + ".afterTaskCreate] notifier.notify destino=" + recipient.receiver +
        ", tipo=" + (recipient.external ? "email" : (recipient.substitute ? "substituto" : "usuario")) +
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

function datasetRows(datasetName, field, value) {
    var filters = {};
    filters[field] = value;
    return datasetRowsByConstraints(datasetName, filters);
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
