function servicetask29(attempt, message) {
    var FIELD_ID_GLPI = 'idGLPI';
    var FIELD_STATUS = 'statusIntegracaoGLPI';
    var FIELD_ERROR = 'mensagemErroGLPI';

    // 🚨 1ª TRAVA: Bloqueia as retentativas invisíveis (Assíncronas) do Fluig por instabilidade
    if (attempt > 1) {
        log.warn("=== BLOQUEANDO EXECUCAO DUPLICADA NO GLPI === Tentativa: " + attempt);
        throw "A integração demorou a responder na primeira tentativa. Verifique manualmente no GLPI antes de prosseguir."; 
    }

    try {
        var existingIdGlpi = asText(hAPI.getCardValue(FIELD_ID_GLPI));
        
        // Removemos a 2ª Trava. Se chegou aqui de novo e tem ID, ele VAI fazer o Update (PUT).

        setCardValueSafe(FIELD_STATUS, 'PROCESSANDO');
        setCardValueSafe(FIELD_ERROR, '');

        var sessionToken = getGlpiNovoSessionToken();
        var isUpdate = !!existingIdGlpi;

        // 1. Descobrir e-mail do solicitante
        var solicitanteId = getCardValueSafe('solicitanteColleagueIdNS');
        var emailUsuario = getUserEmailByColleagueId(solicitanteId);
        if (!emailUsuario) {
            throw "E-mail do solicitante não encontrado no Fluig.";
        }

        // 2. Descobrir o ID do Usuário no GLPI
        var glpiUserId = getGlpiUserIdByEmail(sessionToken, emailUsuario);
        if (!glpiUserId) {
            throw "Usuário com e-mail " + emailUsuario + " não encontrado no GLPI.";
        }

        // 3. Descobrir o ID do Grupo do Usuário no GLPI
        var glpiGroupId = getGlpiGroupIdByUserId(sessionToken, glpiUserId);

        // 4. Montar o Payload dinâmico usando o código já salvo no formulário
        var projectInput = buildGlpiProjectInput(isUpdate, glpiUserId, glpiGroupId);

        // 5. Enviar para o dataset de Upsert (criação/atualização)
        var upsertResult = upsertGlpiProject(sessionToken, projectInput, existingIdGlpi);

        if (!upsertResult.ok) {
            throw upsertResult.message;
        }

        // Só salva o ID se for uma criação nova (POST)
        if (!isUpdate && upsertResult.glpiId) {
            setCardValueSafe(FIELD_ID_GLPI, upsertResult.glpiId);
        }

        setCardValueSafe(FIELD_STATUS, 'OK');
        setCardValueSafe(FIELD_ERROR, '');
        return true;
    } catch (e) {
        var errMsg = formatErrorMessage(e);
        setCardValueSafe(FIELD_STATUS, 'ERROR');
        setCardValueSafe(FIELD_ERROR, errMsg);
        throw errMsg;
    }
}

// ==========================================
// FUNÇÕES DE BUSCA (FLUIG E GLPI)
// ==========================================

function getUserEmailByColleagueId(colleagueId) {
    if (!colleagueId) return "";
    var c1 = DatasetFactory.createConstraint("colleaguePK.colleagueId", colleagueId, colleagueId, ConstraintType.MUST);
    var ds = DatasetFactory.getDataset("colleague", null, [c1], null);
    
    if (ds && ds.rowsCount > 0) {
        return asText(ds.getValue(0, "mail"));
    }
    return "";
}

function getGlpiUserIdByEmail(sessionToken, email) {
    var endpoint = "/apirest.php/search/User?criteria[0][field]=5&criteria[0][searchtype]=contains&criteria[0][value]=" + email + "&forcedisplay[0]=2";
    var resultStr = callGlpiGetDataset(sessionToken, endpoint);
    
    try {
        var json = JSON.parse(resultStr);
        if (json.data && json.data.length > 0) {
            // Pega o ID (campo "2") do primeiro registro encontrado
            return json.data[0]["2"]; 
        }
    } catch (e) {
        log.error("Erro ao parsear retorno do GLPI para Usuario: " + e);
    }
    return 0;
}

function getGlpiGroupIdByUserId(sessionToken, userId) {
    if (!userId || userId === 0) return 0;
    
    var endpoint = "/apirest.php/User/" + userId + "/Group_User";
    var resultStr = callGlpiGetDataset(sessionToken, endpoint);
    
    try {
        var json = JSON.parse(resultStr);
        if (Array.isArray(json) && json.length > 0) {
            // Retorna o groups_id do primeiro objeto do array
            return json[0].groups_id;
        }
    } catch (e) {
        log.error("Erro ao parsear retorno do GLPI para Grupo: " + e);
    }
    return 0;
}

function callGlpiGetDataset(sessionToken, endpoint) {
    var constraints = [];
    constraints.push(DatasetFactory.createConstraint('sessionToken', sessionToken, sessionToken, ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('endpoint', endpoint, endpoint, ConstraintType.MUST));
    
    var ds = DatasetFactory.getDataset('dsGLPINovoGet', null, constraints, null);
    if (ds && ds.rowsCount > 0) {
        var status = asText(ds.getValue(0, "status"));
        if (status === "OK") {
            return asText(ds.getValue(0, "response_data"));
        } else {
            throw asText(ds.getValue(0, "message"));
        }
    }
    throw "Dataset dsGLPINovoGet não retornou dados.";
}

// ==========================================
// MONTAGEM DO PAYLOAD
// ==========================================

function buildGlpiProjectInput(isUpdate, glpiUserId, glpiGroupId) {
    var title = getCardValueSafe('titulodoprojetoNS');
    var objective = getCardValueSafe('objetivodoprojetoNS');
    var comments = getCardValueSafe('observacoesadicionaisNS');
    var prioridade = getCardValueSafe('prioridadeNS');
    
    var now = getCurrentDateTime();
    var mappedPriority = mapPrioridade(prioridade);
    var projectCode = getCardValueSafe('codigoglpi');

    if (!projectCode) {
        throw "Campo codigoglpi não preenchido no formulário.";
    }

    var payload = {
        name: title || "Projeto sem Titulo",
        code: projectCode,
        priority: mappedPriority,
        entities_id: 0,
        is_recursive: 0,
        projects_id: 0,
        projectstates_id: 0,
        projecttypes_id: 0,
        users_id: parseInt(glpiUserId, 10) || 0,
        groups_id: parseInt(glpiGroupId, 10) || 0,
        date_mod: now,
        plan_start_date: "",
        plan_end_date: "",
        real_start_date: "",
        real_end_date: "",
        percent_done: 0,
        auto_percent_done: 0,
        show_on_global_gantt: 0,
        content: objective,
        comment: comments,
        is_deleted: 0,
        projecttemplates_id: 0,
        is_template: 0
    };

    // Se for criação (POST), adicionamos as datas iniciais
    if (!isUpdate) {
        payload.date = now;
        payload.date_creation = now;
    }

    return payload;
}

function mapPrioridade(prioridadeValue) {
    var normalized = String(prioridadeValue || '').toLowerCase().trim();
    
    if (normalized === 'critico') {
        return 6;
    } else if (normalized === 'estrategico') {
        return 3;
    } else if (normalized === 'operacional') {
        return 2;
    }
    
    // fallback: prioridade normal
    return 1;
}

function getCurrentDateTime() {
    var date = new Date();
    var yyyy = date.getFullYear();
    var mm = padZero(date.getMonth() + 1);
    var dd = padZero(date.getDate());
    var hh = padZero(date.getHours());
    var min = padZero(date.getMinutes());
    var ss = padZero(date.getSeconds());
    return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + min + ":" + ss;
}

function padZero(num) {
    return num < 10 ? "0" + num : num;
}

function getGlpiNovoSessionToken() {
    var ds = DatasetFactory.getDataset('dsGLPINovoInitSession', null, null, null);
    ensureDatasetHasRow(ds, 'dsGLPINovoInitSession');
    var status = asText(ds.getValue(0, 'status'));
    var token = asText(ds.getValue(0, 'session_token'));
    if (status !== 'OK' || !token) {
        throw asText(ds.getValue(0, 'message')) || 'Falha ao obter session_token';
    }
    return token;
}

function upsertGlpiProject(sessionToken, projectInput, existingIdGlpi) {
    var constraints = [];
    constraints.push(DatasetFactory.createConstraint('sessionToken', sessionToken, sessionToken, ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('itemtype', 'Project', 'Project', ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('bodyJson', JSON.stringify(projectInput), JSON.stringify(projectInput), ConstraintType.MUST));

    var method = existingIdGlpi ? 'PUT' : 'POST';
    constraints.push(DatasetFactory.createConstraint('method', method, method, ConstraintType.MUST));

    if (existingIdGlpi) {
        constraints.push(DatasetFactory.createConstraint('id', existingIdGlpi, existingIdGlpi, ConstraintType.MUST));
    }

    var ds = DatasetFactory.getDataset('dsGLPINovoProjectUpsert', null, constraints, null);
    ensureDatasetHasRow(ds, 'dsGLPINovoProjectUpsert');

    var status = asText(ds.getValue(0, 'status'));
    return {
        ok: status === 'OK',
        glpiId: asText(ds.getValue(0, 'glpi_id')),
        message: asText(ds.getValue(0, 'message')) || 'Falha ao integrar com GLPI.'
    };
}

function getCardValueSafe(fieldName) {
    try {
        return asText(hAPI.getCardValue(fieldName));
    } catch (e) {
        return '';
    }
}

function setCardValueSafe(fieldName, value) {
    try {
        hAPI.setCardValue(fieldName, String(value == null ? '' : value));
    } catch (e) {}
}

function ensureDatasetHasRow(ds, datasetName) {
    var count = 0;
    try { count = ds.getRowCount(); } catch (e) {
        try { count = ds.rowsCount; } catch (e2) { count = 0; }
    }
    if (!count || count < 1) throw 'Dataset ' + datasetName + ' nao retornou linhas.';
}

function asText(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/^\s+|\s+$/g, '');
}

function formatErrorMessage(error) {
    var raw = String(error || 'Erro desconhecido');
    if (raw.indexOf('PKIX') >= 0 || raw.indexOf('SSL') >= 0) {
        return 'Falha SSL (PKIX): certificado nao confiavel.';
    }
    return raw;
}