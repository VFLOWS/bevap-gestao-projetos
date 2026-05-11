function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");
    dataset.addColumn("http_status");
    dataset.addColumn("session_token");
    dataset.addColumn("method");
    dataset.addColumn("endpoint");
    dataset.addColumn("response");
    dataset.addColumn("message");

    var DEFAULT_APP_TOKEN = "ATAvmSwmgVKk9BLwrtgQDhMtFx37O9Y9fjFhPmOQ";
    var config = {
        serviceCode: "glpi_suporte_rest",
        endpoint: "",
        method: "GET",
        appToken: DEFAULT_APP_TOKEN,
        sessionToken: "",
        autoInitSession: true,
        headers: "",
        body: "",
        queryParams: "",
        queryString: "",
        timeoutService: "100"
    };

    try {
        applyConstraints(config, constraints);

        if (!config.endpoint) {
            dataset.addRow(["ERROR", "", "", config.method, "", "", "Constraint endpoint nao informada."]);
            return dataset;
        }

        if (!config.appToken) {
            dataset.addRow(["ERROR", "", "", config.method, config.endpoint, "", "App-Token nao informado."]);
            return dataset;
        }

        var method = normalizeMethod(config.method);
        var endpoint = buildEndpoint(config.endpoint, config.queryParams, config.queryString, sessionToken, config.appToken);
        var headers = parseJsonObject(config.headers);
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
        headers["App-Token"] = config.appToken;

        var sessionToken = String(config.sessionToken || "").trim();
        if (method !== "GET" || String(config.autoInitSession) === "true") {
            if (!sessionToken) {
                sessionToken = initSession(config.serviceCode, config.appToken, config.timeoutService);
            }
        }

        endpoint = buildEndpoint(config.endpoint, config.queryParams, config.queryString, sessionToken, config.appToken);

        if (sessionToken) {
            headers["Session-Token"] = sessionToken;
        }

        var bodyString = normalizeBody(config.body);
        var response = invokeService(config.serviceCode, endpoint, method, headers, bodyString, config.timeoutService);
        var httpStatus = extractHttpStatus(response);
        var resultText = extractResultText(response);
        var parsedResult = tryParseJson(resultText);
        var serializedResponse = parsedResult.serialized;
        var status = isSuccessHttpStatus(httpStatus) ? "OK" : "ERROR";
        var message = isSuccessHttpStatus(httpStatus)
            ? "Requisicao executada com sucesso."
            : extractErrorMessage(parsedResult.value, resultText, httpStatus);

        dataset.addRow([
            status,
            httpStatus,
            sessionToken,
            method,
            endpoint,
            serializedResponse,
            message
        ]);
    } catch (e) {
        dataset.addRow([
            "ERROR",
            "",
            "",
            normalizeMethod(config.method),
            buildSafeEndpoint(config.endpoint, config.queryParams, config.queryString, config.sessionToken, config.appToken),
            "",
            formatErrorMessage(e)
        ]);
    }

    return dataset;
}

function applyConstraints(config, constraints) {
    if (constraints == null) {
        return;
    }

    for (var i = 0; i < constraints.length; i++) {
        var constraint = constraints[i];
        var fieldName = safeConstraintField(constraint, "fieldName");
        var fieldValue = safeConstraintField(constraint, "initialValue");
        var normalizedName = String(fieldName || "").toLowerCase();

        if (!normalizedName) {
            continue;
        }

        if (normalizedName === "servicecode") {
            config.serviceCode = fieldValue || config.serviceCode;
        } else if (normalizedName === "endpoint") {
            config.endpoint = fieldValue || "";
        } else if (normalizedName === "method") {
            config.method = fieldValue || config.method;
        } else if (normalizedName === "apptoken") {
            config.appToken = fieldValue || "";
        } else if (normalizedName === "sessiontoken") {
            config.sessionToken = fieldValue || "";
        } else if (normalizedName === "autoinitsession") {
            config.autoInitSession = parseBoolean(fieldValue);
        } else if (normalizedName === "headers" || normalizedName === "headersjson") {
            config.headers = fieldValue || "";
        } else if (normalizedName === "body" || normalizedName === "bodyjson") {
            config.body = fieldValue || "";
        } else if (normalizedName === "queryparams" || normalizedName === "queryparamsjson") {
            config.queryParams = fieldValue || "";
        } else if (normalizedName === "querystring") {
            config.queryString = fieldValue || "";
        } else if (normalizedName === "timeoutservice") {
            config.timeoutService = fieldValue || config.timeoutService;
        }
    }
}

function safeConstraintField(constraint, key) {
    try {
        if (constraint == null) {
            return "";
        }
        if (constraint[key] !== undefined && constraint[key] !== null) {
            return String(constraint[key]);
        }
        if (key === "fieldName" && constraint.getFieldName) {
            return String(constraint.getFieldName() || "");
        }
        if (key === "initialValue" && constraint.getInitialValue) {
            return String(constraint.getInitialValue() || "");
        }
    } catch (e) {
        return "";
    }
    return "";
}

function parseBoolean(value) {
    var normalized = String(value || "").trim().toLowerCase();
    return normalized !== "false" && normalized !== "0" && normalized !== "nao" && normalized !== "n";
}

function normalizeMethod(method) {
    var normalized = String(method || "GET").trim().toUpperCase();
    return normalized || "GET";
}

function buildSafeEndpoint(endpoint, queryParams, queryString, sessionToken, appToken) {
    try {
        return buildEndpoint(endpoint, queryParams, queryString, sessionToken, appToken);
    } catch (e) {
        return String(endpoint || "");
    }
}

function buildEndpoint(endpoint, queryParams, queryString, sessionToken, appToken) {
    var raw = String(endpoint || "").trim();
    if (!raw) {
        return "";
    }

    raw = raw.replace(/^https?:\/\/[^\/]+/i, "");
    if (raw.indexOf("/") !== 0) {
        raw = "/" + raw;
    }
    if (raw.indexOf("/apirest.php") !== 0) {
        raw = "/apirest.php" + raw;
    }

    var query = buildQueryString(queryParams, queryString, sessionToken, appToken);
    if (!query) {
        return raw;
    }
    return raw + (raw.indexOf("?") >= 0 ? "&" : "?") + query;
}

function buildQueryString(queryParams, queryString, sessionToken, appToken) {
    var fragments = [];
    var rawQueryString = String(queryString || "").trim();
    if (rawQueryString) {
        fragments.push(rawQueryString.replace(/^\?/, ""));
    }

    var paramsObject = parseJsonObject(queryParams);
    for (var key in paramsObject) {
        if (!paramsObject.hasOwnProperty(key)) {
            continue;
        }
        var value = paramsObject[key];
        if (value === null || value === undefined || String(value) === "") {
            continue;
        }
        fragments.push(encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(value)));
    }

    appendIfMissing(fragments, "session_token", sessionToken);
    appendIfMissing(fragments, "app_token", appToken);

    return fragments.join("&");
}

function appendIfMissing(fragments, key, value) {
    var normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
        return;
    }

    var encodedKey = encodeURIComponent(String(key));
    for (var i = 0; i < fragments.length; i++) {
        if (String(fragments[i] || "").indexOf(encodedKey + "=") === 0) {
            return;
        }
    }

    fragments.push(encodedKey + "=" + encodeURIComponent(normalizedValue));
}

function normalizeBody(body) {
    var raw = String(body || "").trim();
    if (!raw) {
        return "";
    }

    var parsed = tryParseJson(raw);
    if (parsed.value === null || parsed.value === undefined) {
        return raw;
    }
    return parsed.serialized;
}

function parseJsonObject(rawValue) {
    var raw = String(rawValue || "").trim();
    if (!raw) {
        return {};
    }

    try {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !isArray(parsed)) {
            return parsed;
        }
    } catch (e) {
    }

    return {};
}

function tryParseJson(rawValue) {
    var raw = String(rawValue || "").trim();
    if (!raw) {
        return {
            value: null,
            serialized: ""
        };
    }

    try {
        var parsed = JSON.parse(raw);
        return {
            value: parsed,
            serialized: JSON.stringify(parsed)
        };
    } catch (e) {
        return {
            value: raw,
            serialized: raw
        };
    }
}

function initSession(serviceCode, appToken, timeoutService) {
    var headers = {
        "App-Token": String(appToken || ""),
        "Content-Type": "application/json"
    };
    var response = invokeService(serviceCode, "/apirest.php/initSession", "GET", headers, "", timeoutService);
    var httpStatus = extractHttpStatus(response);
    var resultText = extractResultText(response);
    var parsed = tryParseJson(resultText);

    if (!isSuccessHttpStatus(httpStatus)) {
        throw extractErrorMessage(parsed.value, resultText, httpStatus);
    }

    var token = parsed.value && parsed.value.session_token ? String(parsed.value.session_token) : "";
    if (!token) {
        throw "session_token nao encontrado na resposta do initSession.";
    }

    return token;
}

function invokeService(serviceCode, endpoint, method, headers, bodyString, timeoutService) {
    var clientService = fluigAPI.getAuthorizeClientService();
    var data = {
        companyId: String(getValue("WKCompany")),
        serviceCode: String(serviceCode || ""),
        endpoint: String(endpoint || ""),
        method: String(method || "GET"),
        timeoutService: String(timeoutService || "100"),
        options: {
            encoding: "UTF-8",
            mediaType: "application/json",
            headers: headers || {}
        }
    };

    if (bodyString && String(method || "").toUpperCase() !== "GET") {
        data.params = bodyString;
    }

    return clientService.invoke(JSONUtil.toJSON(data));
}

function extractResultText(response) {
    if (response == null) {
        return "";
    }

    try {
        if (response.getResult) {
            return String(response.getResult() || "");
        }
    } catch (e) {
    }

    try {
        if (response.result !== undefined && response.result !== null) {
            return String(response.result);
        }
    } catch (e2) {
    }

    return "";
}

function extractHttpStatus(response) {
    if (response == null) {
        return "";
    }

    try {
        if (response.getHttpStatusResult) {
            return String(response.getHttpStatusResult() || "");
        }
    } catch (e) {
    }

    try {
        if (response.httpStatusResult !== undefined && response.httpStatusResult !== null) {
            return String(response.httpStatusResult);
        }
    } catch (e2) {
    }

    return "";
}

function isSuccessHttpStatus(httpStatus) {
    var numericStatus = parseInt(String(httpStatus || "200"), 10);
    if (isNaN(numericStatus)) {
        return true;
    }
    return numericStatus >= 200 && numericStatus < 300;
}

function extractErrorMessage(parsedValue, rawValue, httpStatus) {
    if (isArray(parsedValue) && parsedValue.length > 1) {
        return "HTTP " + String(httpStatus || "") + ": " + String(parsedValue[1] || parsedValue[0] || "Erro na requisicao.");
    }

    if (parsedValue && typeof parsedValue === "object") {
        if (parsedValue.message) {
            return "HTTP " + String(httpStatus || "") + ": " + String(parsedValue.message);
        }
        if (parsedValue.error) {
            return "HTTP " + String(httpStatus || "") + ": " + String(parsedValue.error);
        }
    }

    if (String(rawValue || "").trim()) {
        return "HTTP " + String(httpStatus || "") + ": " + String(rawValue);
    }

    return "HTTP " + String(httpStatus || "") + ": erro ao executar requisicao.";
}

function formatErrorMessage(error) {
    var raw = String(error || "Erro desconhecido");
    if (raw.indexOf("PKIX path building failed") >= 0 || raw.indexOf("SSLHandshakeException") >= 0) {
        return "Falha SSL (PKIX): certificado nao confiavel para a JVM do Fluig. Importe a cadeia no truststore e reinicie.";
    }
    return raw;
}

function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}
