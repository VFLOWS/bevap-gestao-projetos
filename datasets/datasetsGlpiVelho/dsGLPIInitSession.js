function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");
    dataset.addColumn("session_token");
    dataset.addColumn("message");

    var DEFAULT_APP_TOKEN = "MkVWVwRz0KHQUeRwUApf9P0h0yFm47PtiAF95V7L";
    var serviceCode = "glpi_novo_rest";
    var endpoint = "/apirest.php/initSession";
    var appToken = DEFAULT_APP_TOKEN;

       if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            var constraint = constraints[i];
            var fieldName = "";
            var fieldValue = "";

            try {
                fieldName = String(constraint.fieldName || (constraint.getFieldName ? constraint.getFieldName() : "") || "");
            } catch (e1) {
                fieldName = "";
            }

            try {
                fieldValue = String(constraint.initialValue || (constraint.getInitialValue ? constraint.getInitialValue() : "") || "");
            } catch (e2) {
                fieldValue = "";
            }

            var normalizedFieldName = fieldName.toLowerCase();

            if (normalizedFieldName == "servicecode" && fieldValue) {
                serviceCode = fieldValue;
            }

            if (normalizedFieldName == "endpoint" && fieldValue) {
                endpoint = fieldValue;
            }

            if (normalizedFieldName == "apptoken" && fieldValue) {
                appToken = fieldValue;
            }
        }
    }

    if (!appToken) {
        dataset.addRow(["ERROR", "", "App-Token nao informado e sem fallback configurado."]);
        return dataset;
    }

    try {
        var clientService = fluigAPI.getAuthorizeClientService();

        var data = {
            companyId: "1",
            serviceCode: "glpi_novo_rest",
            endpoint: "/apirest.php/initSession",
            method: "GET",
            options: {
                encoding: "UTF-8",
                mediaType: "application/json",
            },
            headers: {
                "APP-TOKEN": "MkVWVwRz0KHQUeRwUApf9P0h0yFm47PtiAF95V7L",
                "Content-Type": "application/json",
                "Authorization": "Basic c3ZjLnRvdHZzLmZsdWlnOjVac1JzYWo1ODN6Zg=="
            }
            
        };

        log.info('---Debug--- dsGLPIInitSession')
        log.info('---Debug--- dsGLPIInitSession || data: '+ JSON.stringify(data))
        log.dir(data)
        //var response = clientService.invoke(JSONUtil.toJSON(data));
        var response = clientService.invoke(JSON.stringify(data));
        var resultText = response != null ? String(response.getResult() || "") : "";

        if (!resultText) {
            dataset.addRow(["ERROR", "", "Resposta vazia do servico."]);
            return dataset;
        }

        var result = null;
        try {
            result = JSON.parse(resultText);
        } catch (parseError) {
            dataset.addRow(["ERROR", "", "Resposta nao-JSON do servico: " + resultText]);
            return dataset;
        }
        var token = result && result.session_token ? String(result.session_token) : "";

        if (!token) {
            var message = result && result.message ? String(result.message) : "session_token nao encontrado na resposta.";
            dataset.addRow(["ERROR", resultText, message]);
            return dataset;
        }

        dataset.addRow(["OK", token, "Token obtido com sucesso."]);
    } catch (e) {
        var errorText = String(e || "Erro desconhecido");

        if (errorText.indexOf("PKIX path building failed") >= 0 || errorText.indexOf("SSLHandshakeException") >= 0) {
            dataset.addRow([
                "ERROR",
                "",
                "Falha SSL (PKIX): o certificado/CA da URL nao esta confiavel para a JVM do Fluig. Importe a cadeia no truststore do servidor Fluig e reinicie o servico."
            ]);
            return dataset;
        }

        dataset.addRow(["ERROR", "", errorText]);
    }

    return dataset;
}
