function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");
    dataset.addColumn("numSolicitacao");

    try {

        // ===============================
        // CONFIGURAÇÕES DO PROCESSO
        // ===============================
        var CODUSUARIO   = fields[0];
        // Processo alvo: Solicitação de Ajuste de Exceção
        var processId    = fields[1];
        var choosedState = fields[2];
        var companyId    = fields[3];

        var comments     = "Processo iniciado automaticamente";
        var userId       = CODUSUARIO;
        var completeTask = true;
        var managerMode  = false;

        var colleagueIds = [CODUSUARIO];

        log.warn("DATASET START PROCESS ===> INSTANCIANDO SERVIÇOS");

        // ===============================
        // INSTANCIAÇÃO DO SERVIÇO
        // ===============================
        var ECMWorkflowEngine = ServiceManager.getService("ECMWorkflowEngineService");
        var serviceLocator = ECMWorkflowEngine.instantiate(
            "com.totvs.technology.ecm.workflow.ws.ECMWorkflowEngineServiceService"
        );
        var service = serviceLocator.getWorkflowEngineServicePort();

        var serviceObj = ECMWorkflowEngine.instantiate(
            "net.java.dev.jaxb.array.ObjectFactory"
        );

        var serviceAttArray = ECMWorkflowEngine.instantiate(
            "com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray"
        );

        var serviceTaskArray = ECMWorkflowEngine.instantiate(
            "com.totvs.technology.ecm.workflow.ws.ProcessTaskAppointmentDtoArray"
        );

        // ===============================
        // PARTICIPANTES
        // ===============================
        var colleague = serviceObj.createStringArray();

        for (var y = 0; y < colleagueIds.length; y++) {
            colleague.getItem().add(colleagueIds[y]);
        }

        // ===============================
        // MONTAGEM DO CARDDATA
        // ===============================
        log.warn("DATASET START PROCESS ===> MONTANDO CARDDATA");

        var cardData = serviceObj.createStringArrayArray();
        var formData;

        function getConstraintValue(constraintsArr, fieldName) {
            if (!constraintsArr || !constraintsArr.length) return "";
            for (var iC = 0; iC < constraintsArr.length; iC++) {
                var c = constraintsArr[iC];
                if (!c) continue;
                try {
                    if (String(c.fieldName || "") === String(fieldName)) {
                        return String(c.initialValue || "");
                    }
                } catch (e) {
                    // ignore
                }
            }
            return "";
        }

        // Compatibilidade: permite enviar JSON via fields[0] (DatasetFactory.getDataset(name, [json], ...))
        // ou via constraint (ex.: fieldName = 'json'/'JSON')
        var jsonPayload = "";
        if (fields && fields.length > 0 && fields[0]) {
            jsonPayload = String(fields[0]);
        } else {
            jsonPayload = getConstraintValue(constraints, "json") || getConstraintValue(constraints, "JSON") || "";
        }

        if (jsonPayload) {
            log.warn("JSON RECEBIDO VIA PARAMETRO");
            formData = JSON.parse(jsonPayload);
        } else {
            log.warn("NENHUM JSON RECEBIDO - USANDO MOCK");

            formData = {
                numeroRequisicao: "",
                solicitanteNome: "",
                dataSolicitacao: "",
                numeroMovimentoRM: "",
                valorTotalRequisicao: "",
                justificativaAjuste:
                    "Solicitação criada automaticamente pelo dataset em " + new Date()
            };
        }

       var cardData = serviceObj.createStringArrayArray();
    	
    	if (constraints != null){
    		if (constraints.length >0) {
        		for (var c = 0; c < constraints.length; c++){

					log.warn("DATASET START PROCESS ===> CONSTRAINT ENCONTRADA ==> " + constraints[c].fieldName)
					log.warn("DATASET START PROCESS ===> CONSTRAINT ENCONTRADA ==> " + constraints[c].initialValue)
    		    	var campos = serviceObj.createStringArray();
    		    	campos.getItem().add(constraints[c].fieldName);
    		    	campos.getItem().add(constraints[c].initialValue);
    		    	cardData.getItem().add(campos);
        		}
    		} else {
    			throw 'Campos não informados.'
    		}
    	} else {
    		throw 'Campos não informados.'
		}

       
        log.warn("DATASET START PROCESS ===> INICIANDO PROCESSO");

        var result2 = service.startProcess(
            "vflows.ext.vinicius",
            "wwRXYTU-DhVWT",
            parseInt(companyId),
            processId,
            parseInt(choosedState),
            colleague,
            comments,
            userId,
            completeTask,
            serviceAttArray,
            cardData,
            serviceTaskArray,
            managerMode
        );

        // ===============================
        // TRATAMENTO DO RETORNO
        // ===============================
        var error = "";
        var iProcess = "";

        if (result2.getItem().size() > 0) {

            for (var a = 0; a < result2.getItem().size(); a++) {

                var result = result2.getItem().get(a);
                var key    = result.getItem().get(0);
                var value  = result.getItem().get(1);

                if (key == "ERROR") {
                    error = value;
                }

                if (key == "iProcess") {
                    iProcess = value;
                }
            }

            if (error === "") {
                dataset.addRow(["OK", iProcess]);
            } else {
                dataset.addRow(["ERRO", ""]);
            }

        } else {
            dataset.addRow(["ERRO", ""]);
        }

    } catch (erro) {

        log.error("ERRO NO DATASET: " + erro);
        dataset.addRow(["ERRO", erro.toString()]);
    }

    return dataset;
}
