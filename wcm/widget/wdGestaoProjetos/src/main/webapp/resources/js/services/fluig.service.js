var fluigService = {
    getDataset: function (datasetId, filters = null) {
        return new Promise((resolve, reject) => {
            var filterFields = "";

            if (filters) {
                Object.keys(filters).forEach(function (key) {
                    var value = filters[key];
                    filterFields += `${key},${value},`;
                })
            }


            $.ajax({
                url: `${WCMAPI.getServerURL()}/api/public/ecm/dataset/search`,
                method: 'GET',

                data: {
                    datasetId: datasetId,
                    filterFields: filterFields,
                }
            }).done(function (data) {
                resolve(data.content || []);
            }).fail(function (err) {
                reject(err);
            });
        });
    },

    createCard: function (parentDocumentId, cardData) {
        return new Promise((resolve, reject) => {

            var values = [];
            for (key in cardData) {
                values.push({ fieldId: key, value: cardData[key].toString() });
            }

            const usuarioCriacao = WCMAPI.getUser()
            const matriculaUsuarioCriacao = WCMAPI.getUserCode()
            const dataHoraCriacao = moment().format("DD/MM/YYYY - HH:MM:SS")

            values.push({ fieldId: "usuarioCriacao", value: usuarioCriacao });
            values.push({ fieldId: "dataHoraCriacao", value: dataHoraCriacao });
            values.push({ fieldId: "matriculaUsuarioCriacao", value: matriculaUsuarioCriacao });

            fetch(`/ecm-forms/api/v2/cardindex/${parentDocumentId}/cards`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ values: values })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    resolve(data);
                })
                .catch(error => {
                    reject(error);
                });
        });

    },

    updateCard: function (parentId, cardId, cardData) {
        return new Promise((resolve, reject) => {
            var values = [];
            for (key in cardData) {
                if(cardData[key] !== null && cardData[key] !== undefined)
                {
                    values.push({ campo: key, valor: cardData[key] });
                }
            }

            const usuarioAtualizacao = WCMAPI.getUser()
            const dataHoraAtualizacao = moment().format("DD/MM/YYYY - HH:MM:SS")

            values.push({ campo: "documentId", valor: cardId });
            values.push({ campo: "usuarioAtualizacao", valor: usuarioAtualizacao });
            values.push({ campo: "dataHoraAtualizacao", valor: dataHoraAtualizacao });

            var fields = values.map(v => JSON.stringify(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, ""));
            

            const ret = DatasetFactory.getDataset("dsUpdateCardDataService", fields, [], null).values[0];
            if(ret.codRetorno == "ERRO")
            {
                reject(new Error(ret.msgRetorno || 'Erro ao atualizar card'));
            }

            resolve(ret);

            /*fetch(`/ecm-forms/api/v2/cardindex/${parentId}/cards/${cardId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ values: values })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    resolve(data);
                })
                .catch(error => {
                    reject(error);
                });*/
        });
    },

    deleteCard: function (parentId, cardId) {
        return new Promise((resolve, reject) => {
            fetch(`/ecm-forms/api/v2/cardindex/${parentId}/cards/${cardId}`, {
                method: "DELETE"
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    resolve();
                })
                .catch(error => {
                    reject(error);
                });
        });
    },

    searchCard(parentId, cardId = null, dataToLookup = {}) {
        function odataEqAll(obj) {
            return Object.entries(obj)
                .map(([k, v]) => `${k} eq '${String(v).replace(/'/g, "''")}'`)
                .join(' and ');
        }

        function odataOrEq(field, values) {
            const parts = values.map(v => `${field} eq '${String(v).replace(/'/g, "''")}'`);
            return `(${parts.join(' or ')})`;
        }

        function formatData(response) {
            var data = [];
            response.forEach(function (item) {
                var cardId = item.cardId;
                var cardData = {};
                item.values.forEach(function (field) {
                    cardData[field.fieldId] = field.value;
                });
                data.push({
                    ...cardData,
                    cardId: cardId
                })
            })
            return data;
        }

        return new Promise((resolve, reject) => {

            var url = cardId ? `/ecm-forms/api/v2/cardindex/${parentId}/cards/${cardId}` : `/ecm-forms/api/v2/cardindex/${parentId}/cards`;

            if (Object.keys(dataToLookup).length > 0) {
                const odataFilters = odataEqAll(dataToLookup);
                dataToLookup['$filter'] = odataFilters;
            }

            $.ajax({
                url: url,
                method: 'GET',
                data: dataToLookup
            }).done(function (data) {
                resolve(formatData(data.items || [data]) || []);
            }).fail(function (err) {
                reject(err);
            });
        });
    },

    createProjectSolicitation: function (formData = {}) {
        return new Promise((resolve, reject) => {
            try {
                if (!formData || typeof formData !== "object") {
                    throw new Error("Dados do formulario invalidos");
                }

                function asTrimmedString(value) {
                    if (value === null || value === undefined) return "";
                    return String(value).trim();
                }

                function asBooleanString(value) {
                    if (typeof value === "boolean") return value ? "true" : "false";
                    const normalized = asTrimmedString(value).toLowerCase();
                    return normalized === "true" || normalized === "1" || normalized === "on" ? "true" : "false";
                }

                function toArray(value) {
                    return Array.isArray(value) ? value : [];
                }

                function normalizeRows(rows) {
                    return toArray(rows)
                        .map(asTrimmedString)
                        .filter(value => value !== "");
                }

                function normalizeAttachments(attachments) {
                    return toArray(attachments)
                        .map((attachment) => {
                            return {
                                fileName: asTrimmedString(attachment && attachment.fileName),
                                fileContent: asTrimmedString(attachment && attachment.fileContent)
                            };
                        })
                        .filter((attachment) => attachment.fileName !== "" && attachment.fileContent !== "");
                }

                function pushConstraint(constraints, fieldName, value) {
                    const finalValue = value === null || value === undefined ? "" : String(value);
                    constraints.push(
                        DatasetFactory.createConstraint(fieldName, finalValue, finalValue, ConstraintType.MUST)
                    );
                }

                function pushChildConstraints(constraints, childFieldName, rows) {
                    const normalizedRows = normalizeRows(rows);
                    normalizedRows.forEach((rowValue, index) => {
                        const lineIndex = index + 1;
                        pushConstraint(constraints, `${childFieldName}___${lineIndex}`, rowValue);
                    });
                }

                const attachments = normalizeAttachments(formData.attachments);
                const serializedAttachments = attachments.length ? JSON.stringify(attachments) : "";

                const fields = [
                    "14cdc0c0-a710-4412-81dd-d94fe3abe00a",
                    "ProcessSolicitacaoProjetos",
                    "0",
                    "1",
                    serializedAttachments
                ];

                const constraints = [];

                const simpleFieldMap = [
                    { formField: "titulo", fluigField: "titulodoprojetoNS" },
                    { formField: "area", fluigField: "areaUnidadeNS" },
                    { formField: "centro-custo", fluigField: "centrodecustoNS" },
                    { formField: "patrocinador", fluigField: "patrocinadorNS" },
                    { formField: "objetivo", fluigField: "objetivodoprojetoNS" },
                    { formField: "problema", fluigField: "problemaOportunidadeNS" },
                    { formField: "beneficios", fluigField: "beneficiosesperadosNS" },
                    { formField: "prioridade", fluigField: "prioridades" },
                    { formField: "escopo-inicial", fluigField: "escopoinicialNS" },
                    { formField: "out-of-scope", fluigField: "foradeescopoNS" },
                    { formField: "dependencies", fluigField: "dependenciasNS" },
                    { formField: "observacoes", fluigField: "observacoesadicionaisNS" }
                ];

                simpleFieldMap.forEach((mapping) => {
                    pushConstraint(
                        constraints,
                        mapping.fluigField,
                        asTrimmedString(formData[mapping.formField])
                    );
                });

                pushConstraint(
                    constraints,
                    "alinhadobevapNS",
                    asBooleanString(formData.alinhamento)
                );

                // Versao atual sem upload real no formulario
                pushConstraint(constraints, "anexosNS", "");

                pushChildConstraints(constraints, "descricaoobjetivoNS", formData.objetivosEstrategicos);
                pushChildConstraints(constraints, "riscoPotencialNS", formData.riscosIniciais);
                pushChildConstraints(constraints, "valorstakeholdersNS", formData.stakeholders);

                const dsStartProcess = DatasetFactory.getDataset("dsStartProcess", fields, constraints, null);
                if (!dsStartProcess || !dsStartProcess.values || dsStartProcess.values.length === 0) {
                    throw new Error("Nenhum retorno do dsStartProcess");
                }

                const result = dsStartProcess.values[0];
                const status = result.status || result.STATUS || "";
                const numSolicitacao = result.numSolicitacao || result.NUMSOLICITACAO || "";

                if (status !== "OK") {
                    throw new Error(result.message || result.MESSAGE || "Erro ao iniciar solicitacao no Fluig");
                }

                resolve({
                    status: status,
                    numSolicitacao: numSolicitacao,
                    raw: result
                });
            } catch (error) {
                console.error("Error creating project solicitation:", error);
                reject(error);
            }
        });
    },

    getUserSubstitutes: function (userId) {
        return new Promise((resolve, reject) => {
            fluigService.getDataset("dsGetSubstitutosUsuario", {
                colleagueId: userId
            }).then(data => {
                let content = data.descReturn || data;
                resolve(content);
            }).catch(error => {
                reject(error);
            });
        });
    },

    saveAndSendTask(taskData, taskFields = []) {
        return new Promise((resolve, reject) => {
            try {

                if (!taskData) {
                    throw new Error('Dados de solicitação inválidos');
                }

                if (!taskData.id) {
                    throw new Error('ID da tarefa é obrigatório');
                }
                if (!taskData.numState) {
                    throw new Error('Número atividade destino é obrigatória');
                }


                const taskId = typeof taskData.id === "string" ? taskData.id : String(taskData.id);
                const numState = typeof taskData.numState === "string" ? taskData.numState : String(taskData.numState);
                var datasetName = taskData.datasetName;

                //Formata o fields
                var fields = [
                    taskId,
                    numState,
                    "tisolucoes", // responsável
                    "",
                    "tisolucoes", // solicitante
                    "true",
                    "true",
                ]
                var constraints = [];

                if (taskFields.length > 0) {
                    if (!taskData.datasetName) {
                        throw new Error('Nome do dataset é obrigatório');
                    }

                    var dsWorkflow = DatasetFactory.getDataset("workflowProcess", null, [
                        DatasetFactory.createConstraint("workflowProcessPK.processInstanceId", taskId, taskId, ConstraintType.MUST)
                    ], null)

                    if (!dsWorkflow || !dsWorkflow.values || dsWorkflow.values.length === 0) {
                        throw new Error('Solicitação não encontrada ou inválida');
                    }

                    let cardId = dsWorkflow.values[0].cardDocumentId;

                    const dsForm = DatasetFactory.getDataset(datasetName, null, [
                        DatasetFactory.createConstraint("documentId", cardId, cardId, ConstraintType.MUST)
                    ], null);

                    let formData = dsForm && dsForm.values && dsForm.values.length > 0 ? dsForm.values[0] : null;
                    if (!formData) {
                        throw new Error('Dados do formulário não encontrados');
                    }

                    taskFields.forEach(field => {
                        formData[field.name] = field.value;
                    });

                    Object.keys(formData).forEach(key => {
                        constraints.push(DatasetFactory.createConstraint(key, formData[key], formData[key], ConstraintType.MUST));
                    });

                }

                var dsSaveAndSend = DatasetFactory.getDataset("dsSaveAndSendTask", fields, constraints, null);

                if (dsSaveAndSend && dsSaveAndSend.values && dsSaveAndSend.values.length > 0) {
                    var result = dsSaveAndSend.values[0];

                    if (result.returnCode === 'ERROR') {
                        throw new Error(result.message || 'Erro ao movimentar a solicitação');
                    }

                    //Retorna o resultado com sucesso
                    resolve({
                        success: true,
                        data: result.message,
                        message: 'Sucesso!'
                    });
                }
                else {
                    //Se não houver valores de retorno, mas também não houve erro explícito
                    throw new Error('Nenhum valor retornado ao movimentar a solicitação');
                }
            } catch (error) {
                console.error("Error saving task data:", error);
                reject(error);
            }
        });
    },
    
    getCardData: function (cardId) {
        return new Promise((resolve, reject) => {
            try {
                // Consulta dados do card usando o documentId
                const constraints = [
                    DatasetFactory.createConstraint("documentId", cardId, cardId, ConstraintType.MUST)
                ];

                const cardDataset = DatasetFactory.getDataset("dsPCA_PAI", null, constraints, null);
                
                if (cardDataset && cardDataset.values && cardDataset.values.length > 0) {
                    const cardData = cardDataset.values[0];
                    resolve({
                        processInstanceId: cardData.processInstanceId || cardData.PROCESSINSTANCEID,
                        cardId: cardId,
                        ...cardData
                    });
                } else {
                    resolve(null);
                }
            } catch (error) {
                console.error('❌ Erro ao consultar dados do card:', error);
                reject(error);
            }
        });
    },

    getProcessCurrentActivity: function (processInstanceId) {
        return new Promise((resolve, reject) => {
            try {
                // Consulta a atividade atual do processo
                const constraints = [
                    DatasetFactory.createConstraint("workflowProcessPK.processInstanceId", processInstanceId, processInstanceId, ConstraintType.MUST)
                ];

                const processDataset = DatasetFactory.getDataset("workflowProcess", null, constraints, null);
                
                if (processDataset && processDataset.values && processDataset.values.length > 0) {
                    const processData = processDataset.values[0];
                    resolve({
                        sequence: processData.sequence || processData.SEQUENCE,
                        processInstanceId: processInstanceId,
                        ...processData
                    });
                } else {
                    resolve(null);
                }
            } catch (error) {
                console.error('❌ Erro ao consultar atividade do processo:', error);
                reject(error);
            }
        });
    },

};
