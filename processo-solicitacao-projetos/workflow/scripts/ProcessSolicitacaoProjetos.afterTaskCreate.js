var GP_NOTIFY_TEMPLATE = "tpl_gp_tarefa_pendente";
// var GP_NOTIFY_SENDER = "b1c70351e76b4a59b8f12f596389cbb5"; // PROD
var GP_NOTIFY_SENDER = "e6cfab79-5cf3-4350-a789-bdfb89ebc741"; // QA
var GP_WIDGET_URL = "https://fluig.bevap.com.br:8443/portal/p/1/bevap-gestao-projetos";
var GP_NOTIFY_FIXED_RECIPIENTS = [
    { name: "Vinicius Nogueira", receiver: "vinicius.nogueira@vflows.com.br", external: true }
];

function afterTaskCreate(colleagueId) {
    try {
        var activity = text(getValue("WKNextState"));
        var config = getNotifyConfig(activity);
        if (!config) return;

        var context = buildContext(activity, config);
        var recipients = uniqueRecipients(GP_NOTIFY_FIXED_RECIPIENTS.concat(getRecipients(config)));

        for (var i = 0; i < recipients.length; i++) {
            sendNotification(context, recipients[i]);
        }
    } catch (e) {
        log.error("[GP][afterTaskCreate] Erro ao notificar tarefa pendente: " + e);
    }
}

function getNotifyConfig(activity) {
    var configs = {
        "5": { name: "TI - Avaliar Projeto", type: "group", target: "TI", label: "TI", route: "evaluateProject" },
        "15": { name: "Corrigir Solicitação", type: "user", field: "solicitanteColleagueIdNS", correction: true, route: "correction" },
        "19": { name: "Superior Imediato - Aprovar Projeto", type: "user", field: "aprovadorSuperiorImedNS", route: "immediateApproval" },
        "26": { name: "TI - Triagem Técnica", type: "group", target: "TI", label: "TI", route: "technicalTriage" },
        "36": { name: "Comitê - Aprovar Projeto", type: "group", target: "COMITE_GP", label: "Comitê de Gestão de Projetos", route: "committeeApproval" },
        "38": { name: "TI - Anexar Proposta Comercial", type: "group", target: "TI", label: "TI", route: "commercialProposal" },
        "40": { name: "Solicitante - Aprovar Proposta", type: "user", field: "solicitanteColleagueIdNS", route: "requesterProposalApproval" },
        "54": { name: "Gerente do Centro de Custo - Aprovar Custo Projeto", type: "user", field: "aprovadorSuperiorImedNS", route: "gccCostApproval" },
        "61": { name: "Comitê - Aprovar Custo Projeto", type: "group", target: "COMITE_GP", label: "Comitê de Gestão de Projetos", route: "committeeCostApproval" },
        "66": { name: "Compras - Realizar Contratação", type: "group", target: "COMPRAS", label: "Compras", route: "purchaseContracting" }
    };

    return configs[String(activity)] || null;
}

function buildContext(activity, config) {
    var processId = text(getValue("WKNumProces"));
    var documentId = text(getValue("WKCardId"));
    var link = GP_WIDGET_URL + "#" + config.route + "?processInstanceId=" + processId;

    if (documentId) {
        link += "&documentId=" + documentId;
    }

    return {
        activity: activity,
        activityName: config.name,
        correction: config.correction === true,
        groupLabel: config.label || "",
        isGroup: config.type === "group",
        processId: processId,
        projectCode: cardValue("codigoglpi") || ("Processo " + processId),
        projectTitle: cardValue("titulodoprojetoNS") || "Projeto sem título",
        link: link
    };
}

function getRecipients(config) {
    if (config.type === "user") {
        return userRecipient(cardValue(config.field));
    }

    if (config.type === "group") {
        return groupRecipients(config.target);
    }

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
        var colleagueId = rows[i]("colleagueGroupPK.colleagueId") || rows[i]("colleagueId");
        var user = getColleague(colleagueId);

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

    if (rows.length === 0) {
        return { colleagueId: id, name: id, receiver: "" };
    }

    var email = rows[0]("mail") || rows[0]("email");

    return {
        colleagueId: id,
        name: rows[0]("colleagueName") || rows[0]("name") || id,
        receiver: email,
        email: email
    };
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
    var message = buildMessage(context, recipient.name);
    var destinations = new java.util.ArrayList();

    destinations.add(recipient.receiver);

    params.put("subject", "[" + context.projectCode + "] Gestão de Projetos - Tarefa Pendente");
    params.put("htmlBody",
        "<p style=\"margin:0 0 24px 0;\">" + escapeHtml(message) + "</p>" +
        "<p style=\"margin:0;text-align:center;\"><a href=\"" + escapeHtml(context.link) + "\" style=\"background-color:#007bff;color:#ffffff;padding:12px 25px;text-decoration:none;border-radius:5px;font-size:16px;display:inline-block;\">Clique aqui para acessar a solicitação</a></p>");

    log.info("[GP][afterTaskCreate] notifier.notify destino=" + recipient.receiver +
        ", tipo=" + (recipient.external ? "email" : "usuario") +
        ", processo=" + context.processId +
        ", atividade=" + context.activity);

    notifier.notify(GP_NOTIFY_SENDER, GP_NOTIFY_TEMPLATE, params, destinations, "text/html");
}

function buildMessage(context, name) {
    if (context.correction) {
        return "Olá " + name + ", a solicitação " + context.projectCode +
            " retornou para correção e existe uma tarefa pendente sob sua responsabilidade. Favor verificar.";
    }

    if (context.isGroup) {
        return "Olá " + name + ", existe uma tarefa pendente para o grupo " +
            context.groupLabel + " do qual você faz parte. Favor verificar.";
    }

    return "Olá " + name + ", existe uma tarefa pendente sob sua responsabilidade. Favor verificar.";
}

function datasetRows(datasetName, field, value) {
    var constraint = DatasetFactory.createConstraint(field, value, value, ConstraintType.MUST);
    var dataset = DatasetFactory.getDataset(datasetName, null, [constraint], null);
    var rows = [];

    if (!dataset || !dataset.rowsCount) {
        return rows;
    }

    for (var i = 0; i < dataset.rowsCount; i++) {
        rows.push(function (row) {
            return function (column) {
                return datasetValue(dataset, row, column);
            };
        }(i));
    }

    return rows;
}

function cardValue(field) {
    try {
        return text(hAPI.getCardValue(field));
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
