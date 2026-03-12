 approveGap(gapId, approvalData) {
    return new Promise((resolve, reject) => {
      try {

        if (!gapId || !approvalData || !approvalData.decision) {
          throw new Error('Dados de aprovação inválidos');
        }

        //Formata o fields
        var fields = [
          gapId, // areaGapId
          "9",
          "brass0007", // Usuário responsável
          "",
          "brass0007", // Usuário solicitante
          "true", // Iniciar workflow automaticamente
          "true",
        ]

        var constraints = [
          DatasetFactory.createConstraint("responsibleDecision", approvalData.decision, approvalData.decision, ConstraintType.MUST),
          DatasetFactory.createConstraint("responsibleReason", approvalData.reason || "", approvalData.reason, ConstraintType.MUST)
        ]

        var dsWorkflow = DatasetFactory.getDataset("workflowProcess", null, [
          DatasetFactory.createConstraint("workflowProcessPK.processInstanceId", gapId, gapId, ConstraintType.MUST)
        ], null)

        if (!dsWorkflow || !dsWorkflow.values || dsWorkflow.values.length === 0) {
          throw new Error('GAP não encontrado ou inválido');
        }

        let cardId = dsWorkflow.values[0].cardDocumentId;

        var dsUpdateCard = DatasetFactory.getDataset("dsUpdateCard", [
          JSON.stringify({ campo: "documentId", valor: cardId }),
          JSON.stringify({ campo: "responsibleDecision", valor: approvalData.decision }),
          JSON.stringify({ campo: "responsibleReason", valor: approvalData.reason || "" }),
        ], null, null);

        if (!dsUpdateCard || !dsUpdateCard.values || dsUpdateCard.values.length === 0) {
          throw new Error('Falha ao atualizar dados de aprovação do GAP');
        }

        var dsSaveAndSend = DatasetFactory.getDataset("dsSaveAndSendTask", fields, null, null);

        if (dsSaveAndSend && dsSaveAndSend.values && dsSaveAndSend.values.length > 0) {
          var result = dsSaveAndSend.values[0];

          if (result.returnCode === 'ERROR') {
            throw new Error(result.message || 'Erro ao aprovar o GAP');
          }

          //Retorna o resultado com sucesso
          resolve({
            success: true,
            data: result.message,
            message: 'GAP aprovado com sucesso!'
          });
        }
        else {
          //Se não houver valores de retorno, mas também não houve erro explícito
          throw new Error('Nenhum dado retornado ao aprovar o GAP');
        }


      } catch (error) {
        console.error('Erro em approveGap:', error);
        reject({
          success: false,
          message: error.message || 'Erro ao aprovar o GAP',
          error: error
        });
      }

    })

  }

