function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn('status');
    dataset.addColumn('http_status');
    dataset.addColumn('session_token');
    dataset.addColumn('response');
    dataset.addColumn('message');

    var config = {
        serviceCode: 'glpi_novo_rest',
        endpoint: '/apirest.php/initSession',
        appToken: 'MkVWVwRz0KHQUeRwUApf9P0h0yFm47PtiAF95V7L',
        authorization: '',
        timeoutService: '120'
    };

    try {
        applyConstraints(config, constraints);

        if (!config.appToken) {
            dataset.addRow(['ERROR', '', '', '', 'App-Token nao informado.']);
            return dataset;
        }

        var headers = {
            'Content-Type': 'application/json',
            'App-Token': String(config.appToken)
        };

        // Alguns ambientes usam APP-TOKEN (case-insensitive por spec, mas mantemos compatibilidade)
        headers['APP-TOKEN'] = String(config.appToken);

        if (config.authorization) {
            headers['Authorization'] = String(config.authorization);
        }

        var response = invokeService(config.serviceCode, config.endpoint, 'GET', headers, '', config.timeoutService);
        var httpStatus = extractHttpStatus(response);
        var resultText = extractResultText(response);

        if (!resultText) {
            dataset.addRow(['ERROR', httpStatus, '', '', 'Resposta vazia do servico.']);
            return dataset;
        }

        var parsed = tryParseJson(resultText);
        if (!parsed.isJson) {
            dataset.addRow(['ERROR', httpStatus, '', resultText, 'Resposta nao-JSON do servico.']);
            return dataset;
        }

        var token = parsed.value && parsed.value.session_token ? String(parsed.value.session_token) : '';
        if (!token) {
            var msg = parsed.value && parsed.value.message ? String(parsed.value.message) : 'session_token nao encontrado na resposta.';
            dataset.addRow(['ERROR', httpStatus, '', parsed.serialized, msg]);
            return dataset;
        }

        dataset.addRow(['OK', httpStatus, token, parsed.serialized, 'Token obtido com sucesso.']);
    } catch (e) {
        dataset.addRow(['ERROR', '', '', '', formatErrorMessage(e)]);
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
        } else if (normalizedName === 'endpoint') {
            config.endpoint = fieldValue || config.endpoint;
        } else if (normalizedName === 'apptoken') {
            config.appToken = fieldValue || '';
        } else if (normalizedName === 'authorization') {
            config.authorization = fieldValue || '';
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

function formatErrorMessage(error) {
    var raw = String(error || 'Erro desconhecido');
    if (raw.indexOf('PKIX path building failed') >= 0 || raw.indexOf('SSLHandshakeException') >= 0) {
        return 'Falha SSL (PKIX): certificado nao confiavel para a JVM do Fluig. Importe a cadeia no truststore e reinicie.';
    }
    return raw;
}
