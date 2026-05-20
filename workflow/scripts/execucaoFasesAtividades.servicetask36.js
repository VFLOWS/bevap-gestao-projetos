function servicetask36(attempt, message) {
    var FIELD_TASK_ID = 'idGLPIAtividade';
    var FIELD_STATUS = 'statusIntegracaoGLPIAtividade';
    var FIELD_ERROR = 'mensagemErroGLPIAtividade';
    var FIELD_RESPONSE = 'retornoIntegracaoGLPIAtividade';

    if (attempt > 1) {
        log.warn('=== BLOQUEANDO EXECUCAO DUPLICADA DE PROJECTTASK NO GLPI (UPDATE) === Tentativa: ' + attempt);
        throw 'A integracao demorou a responder na primeira tentativa. Verifique manualmente no GLPI antes de prosseguir.';
    }

    try {
        var existingTaskId = getCardValueSafe(FIELD_TASK_ID);
        if (!existingTaskId) {
            throw 'ID da ProjectTask no GLPI nao encontrado no formulario. Nao e possivel atualizar a atividade.';
        }

        setCardValueSafe(FIELD_STATUS, 'ATUALIZANDO');
        setCardValueSafe(FIELD_ERROR, '');
        setCardValueSafe(FIELD_RESPONSE, '');

        var sessionToken = getGlpiNovoSessionToken();
        var taskInput = buildProjectTaskInput();
        var payload = { input: taskInput };
        var bodyJson = JSON.stringify(payload);

        log.warn('GLPI ProjectTask endpoint (update): /apirest.php/ProjectTask/' + existingTaskId);
        log.warn('GLPI ProjectTask payload (update): ' + bodyJson);

        var result = upsertGlpiProjectTask(sessionToken, existingTaskId, bodyJson);

        log.warn('GLPI ProjectTask UPDATE HTTP status: ' + result.httpStatus);
        log.warn('GLPI ProjectTask UPDATE response body: ' + result.response);
        log.warn('GLPI ProjectTask UPDATE ID: ' + result.glpiId);

        setCardValueSafe(FIELD_RESPONSE, result.response);

        if (!result.ok) {
            throw result.message;
        }

        setCardValueSafe(FIELD_STATUS, 'ATUALIZADO COM SUCESSO');
        setCardValueSafe(FIELD_ERROR, '');

        return true;
    } catch (e) {
        var errMsg = formatErrorMessage(e);
        setCardValueSafe(FIELD_STATUS, 'ERRO NA ATUALIZACAO');
        setCardValueSafe(FIELD_ERROR, errMsg);
        log.error('Erro ao atualizar ProjectTask no GLPI: ' + errMsg);
        throw errMsg;
    }
}

function buildProjectTaskInput() {
    var name = getCardValueSafe('milestoneTaskSummaryTextDP');
    var content = getCardValueSafe('milestoneTaskSummaryPhaseDP');
    var projectId = parsePositiveInt(getCardValueSafe('idGLPI'));
    var techUserId = parsePositiveInt(getCardValueSafe('responsavelTecnicoGlpiId'));
    var planStart = normalizeDateTime(getCardValueSafe('dataInicioPlanejadaGLPI'));
    var planEnd = normalizeDateTime(getCardValueSafe('milestoneTaskSummaryDueDateDP'));

    if (!name) {
        throw 'Campo milestoneTaskSummaryTextDP nao preenchido.';
    }
    if (!content) {
        throw 'Campo milestoneTaskSummaryPhaseDP nao preenchido.';
    }
    if (!projectId) {
        throw 'Campo idGLPI nao preenchido ou invalido.';
    }

    var input = {
        name: name,
        content: content,
        projects_id: projectId
    };

    if (techUserId) {
        input.users_id_tech = techUserId;
    }

    input.percent_done = 0;
    input.state = 1;

    if (planStart) {
        input.plan_start_date = planStart;
    }
    if (planEnd) {
        input.plan_end_date = planEnd;
    }

    return input;
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

function upsertGlpiProjectTask(sessionToken, existingTaskId, bodyJson) {
    var constraints = [];
    constraints.push(DatasetFactory.createConstraint('sessionToken', sessionToken, sessionToken, ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('itemtype', 'ProjectTask', 'ProjectTask', ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('bodyJson', bodyJson, bodyJson, ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('method', 'PUT', 'PUT', ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('id', existingTaskId, existingTaskId, ConstraintType.MUST));

    var ds = DatasetFactory.getDataset('dsGLPINovoProjectUpsert', null, constraints, null);
    ensureDatasetHasRow(ds, 'dsGLPINovoProjectUpsert');

    var status = asText(ds.getValue(0, 'status'));
    var httpStatus = asText(ds.getValue(0, 'http_status'));
    var response = asText(ds.getValue(0, 'response'));
    var glpiId = asText(ds.getValue(0, 'glpi_id')) || existingTaskId;
    var message = asText(ds.getValue(0, 'message')) || 'Falha ao atualizar ProjectTask no GLPI.';

    return {
        ok: status === 'OK',
        httpStatus: httpStatus,
        response: response,
        glpiId: glpiId,
        message: message
    };
}

function normalizeDateTime(value) {
    var raw = asText(value);
    var match = null;

    if (!raw) {
        return '';
    }

    raw = raw.replace('T', ' ');

    match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (match) {
        return raw + ' 00:00:00';
    }

    match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(raw);
    if (match) {
        return raw + ':00';
    }

    match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(raw);
    if (match) {
        return raw;
    }

    match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (match) {
        return match[3] + '-' + match[2] + '-' + match[1] + ' 00:00:00';
    }

    match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(raw);
    if (match) {
        return match[3] + '-' + match[2] + '-' + match[1] + ' ' + match[4] + ':' + match[5] + ':00';
    }

    match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(raw);
    if (match) {
        return match[3] + '-' + match[2] + '-' + match[1] + ' ' + match[4] + ':' + match[5] + ':' + match[6];
    }

    throw 'Data invalida para o GLPI: ' + raw + '. Use yyyy-MM-dd HH:mm:ss.';
}

function parsePositiveInt(value) {
    var raw = asText(value);
    var parsed = 0;
    if (!raw) {
        return 0;
    }
    if (!/^\d+$/.test(raw)) {
        return 0;
    }
    parsed = parseInt(raw, 10);
    return parsed > 0 ? parsed : 0;
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
    } catch (e) {
    }
}

function ensureDatasetHasRow(ds, datasetName) {
    var count = 0;
    try {
        count = ds.getRowCount();
    } catch (e) {
        try {
            count = ds.rowsCount;
        } catch (e2) {
            count = 0;
        }
    }
    if (!count || count < 1) {
        throw 'Dataset ' + datasetName + ' nao retornou linhas.';
    }
}

function asText(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value).replace(/^\s+|\s+$/g, '');
}

function formatErrorMessage(error) {
    var raw = String(error || 'Erro desconhecido');
    if (raw.indexOf('PKIX') >= 0 || raw.indexOf('SSL') >= 0) {
        return 'Falha SSL (PKIX): certificado nao confiavel.';
    }
    return raw;
}
