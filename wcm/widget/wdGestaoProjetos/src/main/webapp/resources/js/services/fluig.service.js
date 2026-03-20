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

    getDatasetRows: function (datasetId, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof DatasetFactory === 'undefined') {
                    throw new Error('DatasetFactory indisponivel no contexto atual');
                }

                var fields = Array.isArray(options.fields) && options.fields.length ? options.fields : null;
                var sortFields = Array.isArray(options.sortFields) && options.sortFields.length ? options.sortFields : null;
                var constraints = [];

                if (options.filters) {
                    Object.keys(options.filters).forEach(function (key) {
                        var value = options.filters[key];

                        if (value === null || value === undefined || value === '') {
                            return;
                        }

                        constraints.push(
                            DatasetFactory.createConstraint(key, String(value), String(value), ConstraintType.MUST)
                        );
                    });
                }

                console.group('[getDatasetRows] chamada dsGetSolicitacaoProjetos');
                console.log('[getDatasetRows] datasetId :', datasetId);
                console.log('[getDatasetRows] fields    :', JSON.stringify(fields));
                console.log('[getDatasetRows] constraints:', JSON.stringify(constraints.map(function(c){ return { fieldName: c.fieldName, initialValue: c.initialValue }; })));
                console.groupEnd();

                var dataset = DatasetFactory.getDataset(datasetId, fields, constraints, sortFields);

                console.group('[getDatasetRows] retorno bruto do dataset');
                console.log('[getDatasetRows] dataset           :', dataset);
                console.log('[getDatasetRows] dataset.columns   :', dataset ? JSON.stringify(dataset.columns) : 'n/a');
                console.log('[getDatasetRows] dataset.values    :', dataset ? JSON.stringify(dataset.values) : 'n/a');
                console.log('[getDatasetRows] values.length     :', (dataset && dataset.values) ? dataset.values.length : 0);
                console.groupEnd();

                if (!dataset || !Array.isArray(dataset.values) || dataset.values.length === 0) {
                    resolve([]);
                    return;
                }

                var values = dataset.values;

                // Alguns datasets retornam array de arrays (valores) + dataset.columns.
                // Aqui normalizamos para um array de objetos { coluna: valor }.
                if (Array.isArray(values[0])) {
                    var columns = Array.isArray(dataset.columns) ? dataset.columns : [];

                    var rows = values.map(function (rowArr) {
                        var obj = {};
                        for (var i = 0; i < columns.length; i++) {
                            var key = columns[i];
                            obj[key] = (rowArr && rowArr.length > i) ? rowArr[i] : null;
                        }
                        return obj;
                    });

                    resolve(rows);
                    return;
                }

                // Se jÃƒÆ’Ã‚Â¡ vier como array de objetos, mantÃƒÆ’Ã‚Â©m.
                resolve(values);
            } catch (error) {
                reject(error);
            }
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
            for (var key in cardData) {
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

    asTrimmedString: function (value) {
        if (value === null || value === undefined) return "";
        return String(value).trim();
    },

    asBooleanString: function (value) {
        if (typeof value === "boolean") return value ? "true" : "false";
        var normalized = this.asTrimmedString(value).toLowerCase();
        return normalized === "true" || normalized === "1" || normalized === "on" ? "true" : "false";
    },

    toArray: function (value) {
        return Array.isArray(value) ? value : [];
    },

    normalizeRows: function (rows) {
        return this.toArray(rows)
            .map(this.asTrimmedString)
            .filter(function (value) { return value !== ""; });
    },

    normalizeProcessAttachments: function (attachments) {
        var self = this;
        return self.toArray(attachments)
            .map(function (attachment) {
                return {
                    fileName: self.asTrimmedString(attachment && attachment.fileName),
                    fileContent: self.asTrimmedString(attachment && attachment.fileContent),
                    fileSize: self.asTrimmedString(attachment && attachment.fileSize)
                };
            })
            .filter(function (attachment) {
                return attachment.fileName !== "" && attachment.fileContent !== "";
            });
    },

    normalizeAttachmentMetadata: function (attachments) {
        var self = this;
        return self.toArray(attachments)
            .map(function (attachment) {
                return {
                    fileName: self.asTrimmedString(attachment && attachment.fileName),
                    fileSize: self.asTrimmedString(attachment && attachment.fileSize),
                    persisted: self.asBooleanString(attachment && attachment.persisted)
                };
            })
            .filter(function (attachment) {
                return attachment.fileName !== "";
            });
    },

    buildConstraintsFromCardData: function (cardData) {
        var constraints = [];
        var self = this;
        Object.keys(cardData || {}).forEach(function (fieldName) {
            var finalValue = cardData[fieldName] === null || cardData[fieldName] === undefined
                ? ""
                : String(cardData[fieldName]);
            constraints.push(
                DatasetFactory.createConstraint(fieldName, finalValue, finalValue, ConstraintType.MUST)
            );
        });
        return constraints;
    },

    taskFieldsToCardData: function (taskFields) {
        var cardData = {};
        this.toArray(taskFields).forEach(function (field) {
            if (!field || !field.name) {
                return;
            }

            cardData[String(field.name)] = field.value === null || field.value === undefined
                ? ""
                : String(field.value);
        });
        return cardData;
    },

    buildProjectSolicitationCardData: function (formData) {
        var self = this;
        var cardData = {};
        var simpleFieldMap = [
            { formField: "titulo", fluigField: "titulodoprojetoNS" },
            { formField: "coligada", fluigField: "ColigadaNS" },
            { formField: "area", fluigField: "areaUnidadeNS" },
            { formField: "centro-custo", fluigField: "centrodecustoNS" },
            { formField: "patrocinador", fluigField: "patrocinadorNS" },
            { formField: "objetivo", fluigField: "objetivodoprojetoNS" },
            { formField: "problema", fluigField: "problemaOportunidadeNS" },
            { formField: "prioridade", fluigField: "prioridadeNS" },
            { formField: "escopo-inicial", fluigField: "escopoinicialNS" },
            { formField: "out-of-scope", fluigField: "foradeescopoNS" },
            { formField: "dependencies", fluigField: "dependenciasNS" },
            { formField: "observacoes", fluigField: "observacoesadicionaisNS" }
        ];

        simpleFieldMap.forEach(function (mapping) {
            cardData[mapping.fluigField] = self.asTrimmedString(formData[mapping.formField]);
        });

        cardData.alinhadobevapNS = self.asBooleanString(formData.alinhamento);
        cardData.beneficiosesperadosNS = self.normalizeRows(formData.beneficiosEsperados).join("\n");
        cardData.anexosNS = JSON.stringify(
            self.normalizeAttachmentMetadata(formData.attachmentsMetadata || formData.attachments)
        );

        self.normalizeRows(formData.objetivosEstrategicos).forEach(function (value, index) {
            cardData["descricaoobjetivoNS___" + (index + 1)] = value;
        });

        self.normalizeRows(formData.riscosIniciais).forEach(function (value, index) {
            cardData["riscoPotencialNS___" + (index + 1)] = value;
        });

        self.normalizeRows(formData.beneficiosEsperados).forEach(function (value, index) {
            cardData["beneficioEsperadoNS___" + (index + 1)] = value;
        });

        self.normalizeRows(formData.stakeholders).forEach(function (value, index) {
            cardData["valorstakeholdersNS___" + (index + 1)] = value;
        });

        return cardData;
    },

    buildProjectSolicitationStartFields: function (formData, options) {
        var finalOptions = options || {};
        var attachments = this.normalizeProcessAttachments(formData && formData.attachments);
        var serializedAttachments = attachments.length ? JSON.stringify(attachments) : "";
        var completeTask = finalOptions.completeTask === false ? "false" : "true";

        return [
            "14cdc0c0-a710-4412-81dd-d94fe3abe00a",
            "ProcessSolicitacaoProjetos",
            "0",
            "1",
            serializedAttachments,
            completeTask
        ];
    },

    createProjectSolicitation: function (formData = {}, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                if (!formData || typeof formData !== "object") {
                    throw new Error("Dados do formulario invalidos");
                }

                var fields = this.buildProjectSolicitationStartFields(formData, options);
                var cardData = this.buildProjectSolicitationCardData(formData);
                var constraints = this.buildConstraintsFromCardData(cardData);
                var dsStartProcess = DatasetFactory.getDataset("dsStartProcess", fields, constraints, null);

                if (!dsStartProcess || !dsStartProcess.values || dsStartProcess.values.length === 0) {
                    throw new Error("Nenhum retorno do dsStartProcess");
                }

                var result = dsStartProcess.values[0];
                var status = result.status || result.STATUS || "";
                var numSolicitacao = result.numSolicitacao || result.NUMSOLICITACAO || "";

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

    saveDraft: function (config = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                var mode = this.asTrimmedString(config.mode);

                if (mode === "startProcessDraft") {
                    var result = await this.createProjectSolicitation(config.formData || {}, {
                        completeTask: false
                    });
                    var processInstanceId = this.asTrimmedString(result && result.numSolicitacao);
                    var documentId = processInstanceId
                        ? await this.resolveDocumentIdByProcessInstanceId(processInstanceId)
                        : "";

                    resolve({
                        status: result.status,
                        processInstanceId: processInstanceId,
                        documentId: this.asTrimmedString(documentId),
                        raw: result.raw
                    });
                    return;
                }

                if (mode === "updateCardDraft") {
                    var documentId = this.asTrimmedString(config.documentId);
                    if (!documentId) {
                        throw new Error("documentId e obrigatorio para salvar rascunho");
                    }

                    var cardData = config.cardData || this.taskFieldsToCardData(config.taskFields);
                    await this.updateCard(config.parentId || config.datasetName || "", documentId, cardData);

                    resolve({
                        status: "OK",
                        documentId: documentId
                    });
                    return;
                }

                throw new Error("Modo de rascunho invalido");
            } catch (error) {
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

         saveAndSendTask(taskData, taskFields = [])
    {
        return new Promise(async (resolve, reject) => {
            try {
                if (!taskData) {
                    throw new Error('Dados da tarefa invalidos');
                }

                if (!taskData.id) {
                    throw new Error('ID da tarefa e obrigatorio');
                }

                if (!taskData.numState) {
                    throw new Error('Numero da atividade destino e obrigatorio');
                }

                const taskId = typeof taskData.id === 'string' ? taskData.id : String(taskData.id);
                const numState = typeof taskData.numState === 'string' ? taskData.numState : String(taskData.numState);
                const finalTaskFields = Array.isArray(taskFields) ? taskFields : [];
                const documentId = taskData.documentId === null || taskData.documentId === undefined
                    ? ''
                    : String(taskData.documentId).trim();

                if (finalTaskFields.length > 0) {
                    if (!documentId) {
                        throw new Error('documentId e obrigatorio para atualizar o card antes da movimentacao');
                    }

                    var cardData = {};
                    finalTaskFields.forEach(function (field) {
                        if (!field || !field.name) {
                            return;
                        }

                        cardData[String(field.name)] = field.value === null || field.value === undefined
                            ? ''
                            : String(field.value);
                    });

                    await fluigService.updateCard(taskData.parentId || taskData.datasetName || '', documentId, cardData);
                }

                var fields = [
                    taskId,
                    numState,
                    '14cdc0c0-a710-4412-81dd-d94fe3abe00a',
                    taskData && taskData.comments !== null && taskData.comments !== undefined ? String(taskData.comments) : '',
                    '14cdc0c0-a710-4412-81dd-d94fe3abe00a',
                    'true',
                    'true'
                ];

                var serializedAttachments = '';
                if (taskData && taskData.attachments) {
                    var normalized = fluigService.normalizeProcessAttachments(taskData.attachments);
                    if (normalized && normalized.length) {
                        serializedAttachments = JSON.stringify(normalized);
                    }
                }

                // O dataset lê anexos em fields[8]
                if (serializedAttachments) {
                    fields[8] = serializedAttachments;
                }
                var constraints = [];

                var dsSaveAndSend = DatasetFactory.getDataset('dsSaveAndSendTask', fields, constraints, null);
                if (!dsSaveAndSend || !dsSaveAndSend.values || dsSaveAndSend.values.length === 0) {
                    throw new Error('Nenhum valor retornado ao movimentar a solicitacao');
                }

                var result = dsSaveAndSend.values[0];
                var returnCode = result.returnCode || result.codRetorno || '';
                var message = result.message || result.msgRetorno || '';

                if (returnCode === 'ERROR') {
                    throw new Error(message || 'Erro ao movimentar a solicitacao');
                }

                resolve({
                    success: true,
                    data: message,
                    message: message || 'Sucesso!',
                    raw: result
                });
            } catch (error) {
                console.error('Error saving task data:', error);
                reject(error);
            }
        });
    },
    resolveProcessInstanceIdByDocumentId: function (documentId) {
        return new Promise((resolve, reject) => {
            try {
                var finalDocumentId = documentId === null || documentId === undefined ? '' : String(documentId).trim();
                if (!finalDocumentId) {
                    throw new Error('documentId e obrigatorio');
                }

                var constraintCandidates = [
                    'cardDocumentId',
                    'workflowProcessPK.cardDocumentId',
                    'documentId',
                    'NR_DOCUMENTO_CARD'
                ];

                for (var i = 0; i < constraintCandidates.length; i++) {
                    var constraintName = constraintCandidates[i];
                    var dataset = DatasetFactory.getDataset('workflowProcess', null, [
                        DatasetFactory.createConstraint(constraintName, finalDocumentId, finalDocumentId, ConstraintType.MUST)
                    ], null);

                    if (!dataset || !Array.isArray(dataset.values) || !dataset.values.length) {
                        continue;
                    }

                    var row = dataset.values[0] || {};
                    var processInstanceId = row['workflowProcessPK.processInstanceId'] || row.processInstanceId || row.PROCESSINSTANCEID || row['processInstanceId'];

                    if (processInstanceId !== null && processInstanceId !== undefined && String(processInstanceId).trim() !== '') {
                        resolve(String(processInstanceId).trim());
                        return;
                    }
                }

                throw new Error('Nao foi possivel localizar o processInstanceId para o documentId informado');
            } catch (error) {
                reject(error);
            }
        });
    },
    resolveDocumentIdByProcessInstanceId: function (processInstanceId) {
        return new Promise((resolve, reject) => {
            try {
                var finalProcessInstanceId = processInstanceId === null || processInstanceId === undefined
                    ? ''
                    : String(processInstanceId).trim();

                if (!finalProcessInstanceId) {
                    throw new Error('processInstanceId e obrigatorio');
                }

                var dataset = DatasetFactory.getDataset('workflowProcess', null, [
                    DatasetFactory.createConstraint(
                        'workflowProcessPK.processInstanceId',
                        finalProcessInstanceId,
                        finalProcessInstanceId,
                        ConstraintType.MUST
                    )
                ], null);

                if (!dataset || !Array.isArray(dataset.values) || !dataset.values.length) {
                    throw new Error('Nao foi possivel localizar o documentId para o processo informado');
                }

                var row = dataset.values[0] || {};
                var documentId = row['workflowProcessPK.cardDocumentId']
                    || row.cardDocumentId
                    || row.NR_DOCUMENTO_CARD
                    || row.documentId;

                if (documentId === null || documentId === undefined || String(documentId).trim() === '') {
                    throw new Error('Nao foi possivel localizar o documentId para o processo informado');
                }

                resolve(String(documentId).trim());
            } catch (error) {
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
                console.error('ÃƒÂ¢Ã‚ÂÃ…â€™ Erro ao consultar dados do card:', error);
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
                console.error('ÃƒÂ¢Ã‚ÂÃ…â€™ Erro ao consultar atividade do processo:', error);
                reject(error);
            }
        });
    },

};
