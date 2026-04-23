function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("codRetorno");
    dataset.addColumn("msgRetorno");

    try {
        if (fields == null || fields.length === 0) {
            throw "Nenhum campo informado para updateCardData";
        }

        var companyId = 1;
        var username = "vflows.ext.vinicius";
        var password = "}tPHIJifgSx7NT1@";

        var ECMCard = ServiceManager.getService("ECMCardService");
        var serviceLocator = ECMCard.instantiate("com.totvs.technology.ecm.dm.ws.ECMCardServiceService");
        var service = serviceLocator.getCardServicePort();

        var cardFieldDtoArray = ECMCard.instantiate("com.totvs.technology.ecm.dm.ws.CardFieldDtoArray");

        var documentId = null;
        var fieldsCount = 0;

        for (var f = 0; f < fields.length; f++) {
            var raw = String(fields[f] || "");
            if (!raw) {
                continue;
            }

            var obj = null;
            try {
                obj = JSON.parse(raw);
            } catch (parseErr) {
                throw "Falha ao parsear campo JSON (index=" + f + "): " + parseErr;
            }

            if (!obj || obj.campo == null) {
                continue;
            }

            var campo = String(obj.campo);
            var valor = obj.valor == null ? "" : String(obj.valor);

            if (campo === "documentId") {
                documentId = valor;
                continue;
            }

            var cardFieldDto = ECMCard.instantiate("com.totvs.technology.ecm.dm.ws.CardFieldDto");
            cardFieldDto.setField(campo);
            cardFieldDto.setValue(valor);
            cardFieldDtoArray.getItem().add(cardFieldDto);
            fieldsCount++;
        }

        if (!documentId) {
            throw "Nenhum documentId informado para updateCardData";
        }

        log.info("dsUpdateCardDataService - documentId=" + documentId + " fields=" + fieldsCount);

        var result = service.updateCardData(
            companyId,
            username,
            password,
            parseInt(documentId, 10),
            cardFieldDtoArray
        );

        var message = "";
        try {
            if (result != null) {
                if (typeof result.getWebServiceMessage === "function") {
                    message = String(result.getWebServiceMessage() || "");
                } else if (typeof result.getItem === "function" && result.getItem() != null && result.getItem().size && result.getItem().size() > 0) {
                    var first = result.getItem().get(0);
                    if (first != null && typeof first.getWebServiceMessage === "function") {
                        message = String(first.getWebServiceMessage() || "");
                    } else {
                        message = String(first);
                    }
                } else {
                    message = String(result);
                }
            }
        } catch (msgErr) {
            message = "";
        }

        dataset.addRow(["OK", message || "Card atualizado" ]);
    } catch (erro) {
        log.error("ERRO no dsUpdateCardDataService: " + erro);
        dataset.addRow(["ERRO", String(erro)]);
    }

    return dataset;
}
