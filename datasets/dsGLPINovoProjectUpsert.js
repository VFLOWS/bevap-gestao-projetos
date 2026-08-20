function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn('status');
    dataset.addColumn('http_status');
    dataset.addColumn('method');
    dataset.addColumn('endpoint');
    dataset.addColumn('session_token');
    dataset.addColumn('glpi_id');
    dataset.addColumn('response');
    dataset.addColumn('message');

    var config = {
        serviceCode: 'glpi_novo_rest',
        appToken: 'MkVWVwRz0KHQUeRwUApf9P0h0yFm47PtiAF95V7L',
        sessionToken: '',
        itemtype: 'Project',
        id: '',
        method: '',
        bodyJson: '',
        timeoutService: '120'
    };

    try {
        applyConstraints(config, constraints);

        if (!config.sessionToken) {
            dataset.addRow(['ERROR', '', '', '', '', '', '', 'Session-Token nao informado.']);
            return dataset;
        }

        if (!config.appToken) {
            dataset.addRow(['ERROR', '', '', '', config.sessionToken, '', '', 'App-Token nao informado.']);
            return dataset;
        }

        var method = normalizeMethod(config.method, config.id);
        var endpoint = buildEndpoint(config.itemtype, config.id);

        var bodyString = normalizeBody(config.bodyJson, method);

        var headers = {
            'Content-Type': 'application/json',
            'App-Token': String(config.appToken),
            'Session-Token': String(config.sessionToken)
        };

        var response = invokeService(config.serviceCode, endpoint, method, headers, bodyString, config.timeoutService);
        var httpStatus = extractHttpStatus(response);
        var resultText = extractResultText(response);

        var parsed = tryParseJson(resultText);
        var success = isSuccessHttpStatus(httpStatus);

        var glpiId = '';
        var message = '';

        if (success) {
            if (method === 'POST') {
                glpiId = parsed.value && parsed.value.id !== undefined && parsed.value.id !== null ? String(parsed.value.id) : '';
                message = parsed.value && parsed.value.message ? String(parsed.value.message) : 'Item criado com sucesso.';

                if (!glpiId) {
                    success = false;
                    message = 'POST executado mas retorno nao trouxe id.';
                }
            } else {
                // PUT geralmente retorna array com { "<id>": true, "message": "" }
                glpiId = String(config.id || '');
                message = extractPutMessage(parsed.value, resultText);
            }
        } else {
            message = extractErrorMessage(parsed.value, resultText, httpStatus);
        }

        dataset.addRow([
            success ? 'OK' : 'ERROR',
            httpStatus,
            method,
            endpoint,
            config.sessionToken,
            glpiId,
            parsed.serialized,
            message
        ]);
    } catch (e) {
        dataset.addRow(['ERROR', '', '', '', config.sessionToken || '', config.id || '', '', formatErrorMessage(e)]);
    }

    return dataset;
}

function applyConstraints(config, constraints) {
    if (constraints == null) {
        return;
    }

    for (var i = 0; i < constraints.length; i++) {
        var constraint = constraints[i];
        var fieldName = safeConstraintField(constraint, 'fieldName');
        var fieldValue = safeConstraintField(constraint, 'initialValue');
        var normalizedName = String(fieldName || '').toLowerCase();

        if (normalizedName === 'servicecode') {
            config.serviceCode = fieldValue || config.serviceCode;
        } else if (normalizedName === 'apptoken') {
            config.appToken = fieldValue || '';
        } else if (normalizedName === 'sessiontoken') {
            config.sessionToken = fieldValue || '';
        } else if (normalizedName === 'itemtype') {
            config.itemtype = fieldValue || config.itemtype;
        } else if (normalizedName === 'id' || normalizedName === 'idglpi') {
            config.id = fieldValue || '';
        } else if (normalizedName === 'method') {
            config.method = fieldValue || '';
        } else if (normalizedName === 'body' || normalizedName === 'bodyjson' || normalizedName === 'payload' || normalizedName === 'payloadjson') {
            config.bodyJson = fieldValue || '';
        } else if (normalizedName === 'timeoutservice') {
            config.timeoutService = fieldValue || config.timeoutService;
        }
    }
}

function safeConstraintField(constraint, key) {
    try {
        if (constraint == null) {
            return '';
        }
        if (constraint[key] !== undefined && constraint[key] !== null) {
            return String(constraint[key]);
        }
        if (key === 'fieldName' && constraint.getFieldName) {
            return String(constraint.getFieldName() || '');
        }
        if (key === 'initialValue' && constraint.getInitialValue) {
            return String(constraint.getInitialValue() || '');
        }
    } catch (e) {
        return '';
    }
    return '';
}

function normalizeMethod(method, id) {
    var normalized = String(method || '').trim().toUpperCase();
    if (normalized === 'POST' || normalized === 'PUT') {
        return normalized;
    }

    // Se id veio preenchido, assume PUT; senao, POST
    return String(id || '').trim() ? 'PUT' : 'POST';
}

function buildEndpoint(itemtype, id) {
    var type = String(itemtype || '').trim();
    if (!type) {
        type = 'Project';
    }

    var base = '/apirest.php/' + type;
    var safeId = String(id || '').trim();
    if (!safeId) {
        return base;
    }

    return base + '/' + encodeURIComponent(safeId);
}

function normalizeBody(bodyJson, method) {
    var upper = String(method || '').toUpperCase();

    // Sem body para GET (nao usamos aqui)
    if (upper === 'GET') {
        return '';
    }

    var raw = String(bodyJson || '').trim();
    if (!raw) {
        return '';
    }

    // Se ja veio JSON valido, tenta detectar se tem "input"
    var parsed = tryParseJson(raw);
    if (parsed.isJson) {
        // Se ja for {input:{...}} deixa
        if (parsed.value && typeof parsed.value === 'object' && parsed.value.input !== undefined) {
            return parsed.serialized;
        }

        // Se for um objeto simples, embrulha
        if (parsed.value && typeof parsed.value === 'object' && !isArray(parsed.value)) {
            return JSON.stringify({ input: parsed.value });
        }

        // Se for array ou outro tipo, manda como veio
        return parsed.serialized;
    }

    // Se nao for JSON, manda texto como veio
    return raw;
}

function invokeService(serviceCode, endpoint, method, headers, bodyString, timeoutService) {
    var clientService = fluigAPI.getAuthorizeClientService();
    var data = {
        companyId: String(getValue('WKCompany')),
        serviceCode: String(serviceCode || ''),
        endpoint: String(endpoint || ''),
        method: String(method || 'GET'),
        timeoutService: String(timeoutService || '120'),
        options: {
            encoding: 'UTF-8',
            mediaType: 'application/json',
            headers: headers || {}
        }
    };

    if (bodyString && String(method || '').toUpperCase() !== 'GET') {
        data.params = String(bodyString);
    }

    return clientService.invoke(JSONUtil.toJSON(data));
}

function extractResultText(response) {
    if (response == null) {
        return '';
    }

    try {
        if (response.getResult) {
            return String(response.getResult() || '');
        }
    } catch (e) {
    }

    try {
        if (response.result !== undefined && response.result !== null) {
            return String(response.result);
        }
    } catch (e2) {
    }

    return '';
}

function extractHttpStatus(response) {
    if (response == null) {
        return '';
    }

    try {
        if (response.getHttpStatusResult) {
            return String(response.getHttpStatusResult() || '');
        }
    } catch (e) {
    }

    try {
        if (response.httpStatusResult !== undefined && response.httpStatusResult !== null) {
            return String(response.httpStatusResult);
        }
    } catch (e2) {
    }

    return '';
}

function tryParseJson(rawValue) {
    var raw = String(rawValue || '').trim();
    if (!raw) {
        return { value: null, serialized: '', isJson: false };
    }

    try {
        var parsed = JSON.parse(raw);
        return { value: parsed, serialized: JSON.stringify(parsed), isJson: true };
    } catch (e) {
        return { value: raw, serialized: raw, isJson: false };
    }
}

function isSuccessHttpStatus(httpStatus) {
    var numericStatus = parseInt(String(httpStatus || '200'), 10);
    if (isNaN(numericStatus)) {
        // alguns conectores nao retornam status
        return true;
    }
    return numericStatus >= 200 && numericStatus < 300;
}

function extractPutMessage(parsedValue, rawValue) {
    // sucesso pode vir como array [{"8":true,"message":""}]
    if (isArray(parsedValue) && parsedValue.length > 0) {
        var first = parsedValue[0];
        if (first && typeof first === 'object') {
            if (first.message !== undefined && first.message !== null && String(first.message) !== '') {
                return String(first.message);
            }
            return 'Item atualizado com sucesso.';
        }
    }

    // fallback
    if (String(rawValue || '').trim()) {
        return 'Item atualizado. Resposta: ' + String(rawValue);
    }

    return 'Item atualizado com sucesso.';
}

function extractErrorMessage(parsedValue, rawValue, httpStatus) {
    if (isArray(parsedValue) && parsedValue.length > 1) {
        return 'HTTP ' + String(httpStatus || '') + ': ' + String(parsedValue[1] || parsedValue[0] || 'Erro na requisicao.');
    }

    if (parsedValue && typeof parsedValue === 'object') {
        if (parsedValue.message) {
            return 'HTTP ' + String(httpStatus || '') + ': ' + String(parsedValue.message);
        }
        if (parsedValue.error) {
            return 'HTTP ' + String(httpStatus || '') + ': ' + String(parsedValue.error);
        }
    }

    if (String(rawValue || '').trim()) {
        return 'HTTP ' + String(httpStatus || '') + ': ' + String(rawValue);
    }

    return 'HTTP ' + String(httpStatus || '') + ': erro ao executar requisicao.';
}

function formatErrorMessage(error) {
    var raw = String(error || 'Erro desconhecido');
    if (raw.indexOf('PKIX path building failed') >= 0 || raw.indexOf('SSLHandshakeException') >= 0) {
        return 'Falha SSL (PKIX): certificado nao confiavel para a JVM do Fluig. Importe a cadeia no truststore e reinicie.';
    }
    return raw;
}

function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
}
