function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("returnCode");
    dataset.addColumn("message");

    try {
        if (fields == '' || fields == undefined || fields == null || fields.length == 0) {
            throw 'Array com dados nao informado'
        }

        log.warn("Rodando ds Send Task --- Vai salvar os fields")

        var processInstanceId = fields[0];
        var choosedState = fields[1];
        var colleagueIds = [fields[2]];
        var comments = fields[3];
        var userId = fields[4];
        var completeTask = (fields[5] == 'true');
        var managerMode = (fields[6] == 'true');
        var anexos = null;



        log.warn("Rodando ds Send Task --- process =>" + processInstanceId)
        log.warn("Rodando ds Send Task --- chooseState => " + choosedState)
        log.warn("Rodando ds Send Task --- colleagIds => " + colleagueIds)
        log.warn("Rodando ds Send Task --- comments => " + comments)
        log.warn("Rodando ds Send Task --- userId => " + userId)
        log.warn("Rodando ds Send Task --- completeTask => " + completeTask)
        log.warn("Rodando ds Send Task --- managerMode => " + managerMode)

        log.warn("Rodando ds Send Task --- Salvou os fields")

        if(fields[8]){
    	  
            log.warn("Rodando ds Send Task --- Encontrou Anexo")
            anexos = JSON.parse(fields[8])
        }else{
            
            log.warn("Rodando ds Send Task --- Não Encontrou Anexo")
        }

        var ECMWorkflowEngine = ServiceManager.getService('ECMWorkflowEngineService');
        var serviceLocator = ECMWorkflowEngine.instantiate('com.totvs.technology.ecm.workflow.ws.ECMWorkflowEngineServiceService');
        var service = serviceLocator.getWorkflowEngineServicePort();
        var serviceObj = ECMWorkflowEngine.instantiate('net.java.dev.jaxb.array.ObjectFactory');
        var serviceTaskArray = ECMWorkflowEngine.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessTaskAppointmentDtoArray');
        var serviceAttArray = ECMWorkflowEngine.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray');

        var workflowObjFactory = null;
        try {
            workflowObjFactory = ECMWorkflowEngine.instantiate('com.totvs.technology.ecm.workflow.ws.ObjectFactory');
        } catch (factoryError) {
            workflowObjFactory = null;
        }


        //Array de colleagueIds da solicitação
        var colleague = serviceObj.createStringArray();

        if (colleagueIds.length > 0) {
            for (var y = 0; y < colleagueIds.length; y++) {
                colleague.getItem().add(colleagueIds[y]);
            }
        }

        log.warn("Rodando ds Send Task --- terminou Array Coleagues")

        var cardData = serviceObj.createStringArrayArray();

        if (constraints != null) {
            if (constraints.length > 0) {
                for (var c = 0; c < constraints.length; c++) {
                    var campos = serviceObj.createStringArray();
                    campos.getItem().add(constraints[c].fieldName);
                    campos.getItem().add(constraints[c].initialValue);
                    cardData.getItem().add(campos);
                    log.warn("Rodando ds Send Task --- cardData => " + "nome campo: " + constraints[c].fieldName + "value: " + constraints[c].initialValue)
                }
            } else {
                //throw 'Campos não informados.'
            }
        } else {
            //throw 'Campos não informados.'
        }

        log.warn("Rodando ds Send Task --- terminou CardData")

        if (anexos && anexos.length) {
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
                    attachmentDto = ECMWorkflowEngine.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDto');
                    attachment = ECMWorkflowEngine.instantiate('com.totvs.technology.ecm.workflow.ws.Attachment');
                }

                var fileBytes = java.util.Base64.getDecoder().decode(
                    new java.lang.String(conteudoArquivo).getBytes('UTF-8')
                );

                attachment.setFileName(nomeArquivo);
                attachment.setFilecontent(fileBytes);
                attachmentDto.getAttachments().add(attachment);
                attachmentDto.setDescription(nomeArquivo);
                attachmentDto.setNewAttach(true);
                serviceAttArray.getItem().add(attachmentDto);
            }
        }

        var result2 = service.saveAndSendTask('vflows.ext.vinicius', '}tPHIJifgSx7NT1@', parseInt(1),
			parseInt(processInstanceId), parseInt(choosedState), colleague, comments, userId, true, serviceAttArray, 
			cardData, serviceTaskArray, false, parseInt(0));       
        
        
        log.warn("Rodando ds Send Task --- Chamou SendTask")
        log.dir(result2);

        if (result2.getItem().size() > 0) {
            for (var a = 0; a < result2.getItem().size(); a++) {
                var result = result2.getItem().get(a);
                if (result.getItem().get(0) == 'iTask' || result.getItem().get(0) == 'ERROR') {
                    dataset.addRow([result.getItem().get(0), result.getItem().get(1)]);
                }
            }
        } else {
            dataset.addRow(['ERROR', result2]);
        }

    } catch (erro) {
        dataset.addRow(['ERROR', erro]);
    }

    return dataset;
}