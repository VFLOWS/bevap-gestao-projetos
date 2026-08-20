function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");
    dataset.addColumn("numSolicitacao");

    try {

        // ===============================
        // PROCESS CONFIG
        // ===============================
        var CODUSUARIO = fields[0];
        var processId = fields[1];
        var choosedState = fields[2];
        var companyId = fields[3];
        var anexos = [];

        var comments = "Processo iniciado automaticamente";
        var userId = CODUSUARIO;
        var completeTask = true;
        var managerMode = false;

        var colleagueIds = [CODUSUARIO];

        log.warn("DATASET START PROCESS ===> INSTANCIANDO SERVICOS");

        // ===============================
        // SERVICE INIT
        // ===============================
        var ECMWorkflowEngine = ServiceManager.getService("ECMWorkflowEngineService");
        var serviceLocator = ECMWorkflowEngine.instantiate(
            "com.totvs.technology.ecm.workflow.ws.ECMWorkflowEngineServiceService"
        );
        var service = serviceLocator.getWorkflowEngineServicePort();

        var serviceObj = ECMWorkflowEngine.instantiate(
            "net.java.dev.jaxb.array.ObjectFactory"
        );
        var workflowObjFactory = null;

        try {
            workflowObjFactory = ECMWorkflowEngine.instantiate(
                "com.totvs.technology.ecm.workflow.ws.ObjectFactory"
            );
        } catch (factoryError) {
            log.warn("DATASET START PROCESS ===> ObjectFactory workflow indisponivel, seguindo com instantiate direto");
        }

        var serviceAttArray = ECMWorkflowEngine.instantiate(
            "com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray"
        );

        var serviceTaskArray = ECMWorkflowEngine.instantiate(
            "com.totvs.technology.ecm.workflow.ws.ProcessTaskAppointmentDtoArray"
        );

        if (fields != null && fields.length >= 4 && fields[4]) {
            try {
                anexos = JSON.parse(fields[4]);
                if (!anexos || typeof anexos.length === "undefined") {
                    anexos = [];
                }
                log.warn("DATASET START PROCESS ===> ANEXOS ENCONTRADOS: " + anexos.length);
            } catch (parseError) {
                log.error("DATASET START PROCESS ===> ERRO AO PARSEAR ANEXOS: " + parseError);
                anexos = [];
            }
        } else {
            log.warn("DATASET START PROCESS ===> NENHUM ANEXO INFORMADO");
        }

        // ===============================
        // PARTICIPANTS
        // ===============================
        var colleague = serviceObj.createStringArray();

        for (var y = 0; y < colleagueIds.length; y++) {
            colleague.getItem().add(colleagueIds[y]);
        }

        // ===============================
        // BUILD CARDDATA FROM CONSTRAINTS
        // ===============================
        log.warn("DATASET START PROCESS ===> MONTANDO CARDDATA");

        var cardData = serviceObj.createStringArrayArray();

        if (constraints != null) {
            if (constraints.length > 0) {
                for (var c = 0; c < constraints.length; c++) {

                    log.warn("DATASET START PROCESS ===> CONSTRAINT ENCONTRADA ==> " + constraints[c].fieldName);
                    log.warn("DATASET START PROCESS ===> CONSTRAINT ENCONTRADA ==> " + constraints[c].initialValue);
                    var campos = serviceObj.createStringArray();
                    campos.getItem().add(constraints[c].fieldName);
                    campos.getItem().add(constraints[c].initialValue);
                    cardData.getItem().add(campos);
                }
            } else {
                throw 'Campos nao informados.';
            }
        } else {
            throw 'Campos nao informados.';
        }

        if (anexos.length > 0) {
            for (var i = 0; i < anexos.length; i++) {
                var nomeArquivo = anexos[i].fileName ? String(anexos[i].fileName) : "";
                var conteudoArquivo = anexos[i].fileContent ? String(anexos[i].fileContent) : "";

                if (nomeArquivo === "" || conteudoArquivo === "") {
                    continue;
                }

                var attachmentDto = null;
                var attachment = null;

                try {
                    if (workflowObjFactory != null) {
                        attachmentDto = workflowObjFactory.createProcessAttachmentDto();
                        attachment = workflowObjFactory.createAttachment();
                    }
                } catch (factoryItemError) {
                    attachmentDto = null;
                    attachment = null;
                }

                if (attachmentDto == null || attachment == null) {
                    attachmentDto = ECMWorkflowEngine.instantiate("com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDto");
                    attachment = ECMWorkflowEngine.instantiate("com.totvs.technology.ecm.workflow.ws.Attachment");
                }

                var fileBytes = java.util.Base64.getDecoder().decode(
                    new java.lang.String(conteudoArquivo).getBytes("UTF-8")
                );

                attachment.setFileName(nomeArquivo);
                attachment.setFilecontent(fileBytes);
                attachmentDto.getAttachments().add(attachment);
                attachmentDto.setDescription(nomeArquivo);
                attachmentDto.setNewAttach(true);
                serviceAttArray.getItem().add(attachmentDto);
            }
        }

        log.warn("DATASET START PROCESS ===> INICIANDO PROCESSO");

        var result2 = service.startProcess(
            "vflows.ext.vinicius",
            "}tPHIJifgSx7NT1@",
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
        // RETURN HANDLING
        // ===============================
        var error = "";
        var iProcess = "";

        if (result2.getItem().size() > 0) {

            for (var a = 0; a < result2.getItem().size(); a++) {

                var result = result2.getItem().get(a);
                var key = result.getItem().get(0);
                var value = result.getItem().get(1);

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
