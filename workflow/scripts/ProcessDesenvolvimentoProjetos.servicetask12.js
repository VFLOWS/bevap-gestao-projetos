function servicetask12(attempt, message) {
    var FIELD_ID_GLPI = 'idGLPI';
    var FIELD_PAYLOAD = 'payloadJsonGLPI'; // O novo campo que guarda o JSON pronto
    var FIELD_STATUS = 'statusIntegracaoGLPI';
    var FIELD_ERROR = 'mensagemErroGLPI';

    // 1ª TRAVA: Bloqueia as retentativas invisíveis do Fluig por instabilidade
    if (attempt > 1) {
        log.warn("=== BLOQUEANDO EXECUCAO DUPLICADA NO GLPI === Tentativa: " + attempt);
        throw "A integração demorou a responder na primeira tentativa. Verifique manualmente no GLPI antes de prosseguir."; 
    }

    try {
        var existingIdGlpi = asText(hAPI.getCardValue(FIELD_ID_GLPI));
        
        // 2ª TRAVA: Como SEMPRE é update, se não vier o ID, nós paramos o processo aqui.
        if (!existingIdGlpi || existingIdGlpi === "0" || existingIdGlpi === "") {
            throw "ID do Projeto no GLPI não encontrado no formulário. Não é possível realizar a atualização.";
        }

        // 3ª TRAVA: Pega o Payload já montado da etapa anterior
        var payloadStr = asText(hAPI.getCardValue(FIELD_PAYLOAD));
        if (!payloadStr) {
            throw "Payload do GLPI não encontrado no formulário. Verifique se o campo " + FIELD_PAYLOAD + " foi salvo na etapa anterior.";
        }

        setCardValueSafe(FIELD_STATUS, 'ATUALIZANDO');
        setCardValueSafe(FIELD_ERROR, '');

        // Transforma o texto salvo de volta em um Objeto JSON
        var projectInput = JSON.parse(payloadStr);

        // A MÁGICA AQUI: Alteramos APENAS a propriedade de status para 2 (em andamento)
        projectInput.projectstates_id = 2;

        var sessionToken = getGlpiNovoSessionToken();

        // Enviar o PUT (Atualização) para a API
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

// ==========================================
// INTEGRAÇÃO GLPI (TOKEN E UPSERT)
// ==========================================

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

    // Sempre PUT (Atualização)
    var method = 'PUT'; 
    constraints.push(DatasetFactory.createConstraint('method', method, method, ConstraintType.MUST));
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

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================

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