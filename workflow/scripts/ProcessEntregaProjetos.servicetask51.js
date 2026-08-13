function servicetask51(attempt, message) {
    var FIELD_ID_GLPI = 'idGLPI';
    var FIELD_PAYLOAD = 'payloadJsonGLPI';
    var FIELD_STATUS = 'statusIntegracaoGLPI';
    var FIELD_ERROR = 'mensagemErroGLPI';

    if (attempt > 1) {
        log.warn("=== BLOQUEANDO EXECUCAO DUPLICADA NO GLPI === Tentativa: " + attempt);
        throw "A integracao demorou a responder na primeira tentativa. Verifique manualmente no GLPI antes de prosseguir.";
    }

    try {
        assertForcedGlpiTestError(FIELD_STATUS, FIELD_ERROR);

        var existingIdGlpi = asText(hAPI.getCardValue(FIELD_ID_GLPI));

        if (!existingIdGlpi || existingIdGlpi === "0" || existingIdGlpi === "") {
            throw "ID do Projeto no GLPI nao encontrado no formulario. Nao e possivel realizar a atualizacao.";
        }

        var payloadStr = asText(hAPI.getCardValue(FIELD_PAYLOAD));
        if (!payloadStr) {
            throw "Payload do GLPI nao encontrado no formulario. Verifique se o campo " + FIELD_PAYLOAD + " foi salvo na etapa anterior.";
        }

        setCardValueSafe(FIELD_STATUS, 'ATUALIZANDO');
        setCardValueSafe(FIELD_ERROR, '');

        var projectInput = JSON.parse(payloadStr);
        projectInput.projectstates_id = 1;

        var sessionToken = getGlpiNovoSessionToken();
        var upsertResult = upsertGlpiProject(sessionToken, projectInput, existingIdGlpi);

        if (!upsertResult.ok) {
            throw upsertResult.message;
        }

        setCardValueSafe(FIELD_STATUS, 'ATUALIZADO COM SUCESSO');
        setCardValueSafe(FIELD_ERROR, '');
        return true;

    } catch (e) {
        var errMsg = formatErrorMessage(e);
        setCardValueSafe(FIELD_STATUS, 'ERRO NA ATUALIZACAO');
        setCardValueSafe(FIELD_ERROR, errMsg);
        throw errMsg;
    }
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
    constraints.push(DatasetFactory.createConstraint('method', 'PUT', 'PUT', ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('id', existingIdGlpi, existingIdGlpi, ConstraintType.MUST));

    var ds = DatasetFactory.getDataset('dsGLPINovoProjectUpsert', null, constraints, null);
    ensureDatasetHasRow(ds, 'dsGLPINovoProjectUpsert');

    var status = asText(ds.getValue(0, 'status'));
    return {
        ok: status === 'OK',
        glpiId: asText(ds.getValue(0, 'glpi_id')),
        message: asText(ds.getValue(0, 'message')) || 'Falha ao integrar com GLPI.'
    };
}

function setCardValueSafe(fieldName, value) {
    try {
        hAPI.setCardValue(fieldName, String(value == null ? '' : value));
    } catch (e) {}
}

function assertForcedGlpiTestError(statusField, errorField, responseField) {
    var forceError = '';
    try {
        forceError = asText(hAPI.getCardValue('forcarErroGLPI'));
    } catch (e) {
        forceError = '';
    }

    if (forceError === '1') {
        var message = 'Erro GLPI forcado para teste (forcarErroGLPI=1).';
        if (statusField) {
            setCardValueSafe(statusField, 'ERROR');
        }
        if (errorField) {
            setCardValueSafe(errorField, message);
        }
        if (responseField) {
            setCardValueSafe(responseField, message);
        }
        log.warn(message);
        throw message;
    }
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
