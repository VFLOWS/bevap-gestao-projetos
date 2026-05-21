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
                        var rawFilter = options.filters[key];
                        var isMetaObject = rawFilter
                            && typeof rawFilter === 'object'
                            && !Array.isArray(rawFilter);
                        var value = isMetaObject ? rawFilter.value : rawFilter;
                        var finalValue = isMetaObject
                            ? (rawFilter.finalValue !== undefined ? rawFilter.finalValue : value)
                            : value;
                        var type = isMetaObject && rawFilter.type !== undefined
                            ? rawFilter.type
                            : ConstraintType.MUST;

                        if (value === null || value === undefined || value === '') {
                            return;
                        }

                        var constraint = DatasetFactory.createConstraint(
                            key,
                            String(value),
                            finalValue === null || finalValue === undefined ? String(value) : String(finalValue),
                            type
                        );

                        if (isMetaObject && rawFilter.likeSearch === true) {
                            constraint._likeSearch = true;
                        }

                        constraints.push(constraint);
                    });
                }

                console.group('[getDatasetRows] chamada dsGetSolicitacaoProjetos');
                console.log('[getDatasetRows] datasetId :', datasetId);
                console.log('[getDatasetRows] fields    :', JSON.stringify(fields));
                console.log('[getDatasetRows] constraints:', JSON.stringify(constraints.map(function(c){
                    return {
                        fieldName: c.fieldName,
                        initialValue: c.initialValue,
                        finalValue: c.finalValue,
                        type: c.constraintType,
                        likeSearch: c._likeSearch === true
                    };
                })));
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
                (item.values || []).forEach(function (field) {
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

    getProjectProcessDefinitions: function () {
        return {
            solicitacao: {
                type: 'solicitacao',
                processName: 'ProcessSolicitacaoProjetos',
                datasetId: 'dsGetSolicitacaoProjetos',
                formName: 'FormSolicitacaoProjetos',
                label: 'Solicitação'
            },
            desenvolvimento: {
                type: 'desenvolvimento',
                processName: 'ProcessDesenvolvimentoProjetos',
                datasetId: 'dsGetDesenvolvimentoProjetos',
                formName: 'FormDesenvolvimentoProjetos',
                label: 'Desenvolvimento'
            },
            execucaoFases: {
                type: 'execucaoFases',
                processName: 'execucaoFasesAtividades',
                datasetId: 'dsGetExecucaoAtividade',
                formName: 'formExecucaoAtividade',
                label: 'Execucao de Fases'
            }
        };
    },

    normalizeProjectProcessType: function (value) {
        var text = this.asTrimmedString(value).toLowerCase();
        if (!text) {
            return '';
        }

        if (text === 'solicitacao' || text === 'solicitação') {
            return 'solicitacao';
        }

        if (text === 'desenvolvimento') {
            return 'desenvolvimento';
        }

        if (text === 'execucaofases' || text === 'execucao-fases' || text === 'execucao fases') {
            return 'execucaoFases';
        }

        return '';
    },

    detectProjectProcessType: function (value) {
        var normalized = this.normalizeProjectProcessType(value);
        if (normalized) {
            return normalized;
        }

        var text = this.asTrimmedString(value).toLowerCase();
        if (!text) {
            return '';
        }

        if (text.indexOf('processsolicitacaoprojetos') !== -1 || text.indexOf('solicitacao') !== -1 || text.indexOf('solicitação') !== -1) {
            return 'solicitacao';
        }

        if (text.indexOf('processdesenvolvimentoprojetos') !== -1 || text.indexOf('desenvolvimento') !== -1) {
            return 'desenvolvimento';
        }

        if (text.indexOf('execucaofasesatividades') !== -1 || text.indexOf('execucao fases') !== -1 || text.indexOf('execuÃ§Ã£o fases') !== -1) {
            return 'execucaoFases';
        }

        return '';
    },

    getProjectProcessDefinition: function (value) {
        var processType = this.detectProjectProcessType(value);
        var definitions = this.getProjectProcessDefinitions();
        return definitions[processType] || null;
    },

    parseProjectProcessActivity: function (value) {
        var text = this.asTrimmedString(value);
        if (!text) {
            return null;
        }

        var matchDash = text.match(/^\s*(\d+)\s*-/);
        var matchAny = matchDash || text.match(/(\d+)/);
        if (!matchAny || !matchAny[1]) {
            return null;
        }

        var parsed = parseInt(matchAny[1], 10);
        return isNaN(parsed) ? null : parsed;
    },

    resolveProjectProcessActivity: function (processType, estadoProcesso, statusValue) {
        var activity = this.parseProjectProcessActivity(estadoProcesso);
        var normalizedType = this.detectProjectProcessType(processType);
        var statusText = this.asTrimmedString(statusValue);

        if (activity === null && normalizedType === 'desenvolvimento' && statusText === '2') {
            return 38;
        }

        return activity;
    },

    ensureProjectProcessFields: function (processType, fields) {
        if (!Array.isArray(fields) || !fields.length) {
            return fields;
        }

        var normalizedType = this.detectProjectProcessType(processType);
        if (normalizedType !== 'desenvolvimento') {
            return fields;
        }

        var finalFields = fields.slice();
        ['documentid', 'estadoProcesso', 'STATUS'].forEach(function (fieldName) {
            if (finalFields.indexOf(fieldName) === -1) {
                finalFields.push(fieldName);
            }
        });

        return finalFields;
    },

    buildProjectProcessContext: function (processType, row, extras) {
        var definition = this.getProjectProcessDefinition(processType);
        var finalRow = row && typeof row === 'object' ? row : {};
        var finalExtras = extras && typeof extras === 'object' ? extras : {};
        var rawState = finalExtras.estadoProcesso !== undefined
            ? finalExtras.estadoProcesso
            : finalRow.estadoProcesso;
        var rawStatus = finalExtras.STATUS !== undefined
            ? finalExtras.STATUS
            : (finalExtras.status !== undefined ? finalExtras.status : (finalRow.STATUS !== undefined ? finalRow.STATUS : finalRow.status));
        var activity = finalExtras.activity !== undefined
            ? finalExtras.activity
            : this.resolveProjectProcessActivity(processType, rawState, rawStatus);

        return Object.assign({}, finalRow, finalExtras, {
            processType: definition ? definition.type : this.detectProjectProcessType(processType),
            processName: definition ? definition.processName : '',
            datasetId: definition ? definition.datasetId : '',
            formName: definition ? definition.formName : '',
            processLabel: definition ? definition.label : '',
            estadoProcesso: this.asTrimmedString(rawState),
            activity: activity
        });
    },

    getProjectProcessLabel: function (value) {
        var definition = this.getProjectProcessDefinition(value);
        return definition ? definition.label : 'Processo';
    },

    getProjectCancelledActivities: function () {
        return [24, 47, 55, 56, 59];
    },

    getProjectProcessActionMap: function (processType) {
        var normalizedType = this.detectProjectProcessType(processType);

        if (normalizedType === 'desenvolvimento') {
            return {
                14: {
                    enabled: true,
                    route: 'projectPlanning',
                    label: 'Planejar Projeto'
                },
                46: {
                    enabled: true,
                    route: 'dpGlpiErrorTreatment',
                    label: 'Tratar Erro GLPI'
                },
                52: {
                    enabled: true,
                    route: 'dpGlpiErrorTreatment',
                    label: 'Tratar Erro GLPI'
                },
                47: {
                 enabled: true,
                 route: 'dpStartExecErrorTreatment',
                 label: 'Tratar Erro Iniciar Execução'
                 },
                 
                 18: {
                 enabled: true,
                 route: 'projectExecution', // Aponta para a chave criada no router
                 label: 'Executar Projeto'
                 },
                 23: {
                 enabled: true,
                 route: 'projectRequesterValidation',
                 label: 'Validar Projeto'
                 },
                 32: {
                 enabled: true,
                 route: 'projectTiValidation',
                 label: 'Validar Projeto TI'
                 },
                 38: {
                 enabled: true,
                 route: 'projectFinal',
                 label: 'Visualizar Encerramento'
                 }
            };
        }

        if (normalizedType === 'execucaoFases') {
            return {
                14: {
                    enabled: true,
                    route: 'executionActivityWaiting',
                    label: 'Aguardar Execucao'
                },
                18: {
                    enabled: true,
                    route: 'executionActivity',
                    label: 'Executar Atividade'
                },
                23: {
                    enabled: true,
                    route: 'executionActivityRequesterValidation',
                    label: 'Validar Atividade'
                },
                32: {
                    enabled: true,
                    route: 'executionActivityTiValidation',
                    label: 'Validar Atividade TI'
                }
            };
        }

        return {
            0: {
                enabled: true,
                route: 'newSolicitation',
                label: 'Continuar Rascunho'
            },
            4: {
                enabled: true,
                route: 'newSolicitation',
                label: 'Continuar Rascunho'
            },
            5: {
                enabled: true,
                route: 'evaluateProject',
                label: 'Avaliar Agora'
            },
            15: {
                enabled: true,
                route: 'correction',
                label: 'Corrigir Agora'
            },
            19: {
                enabled: true,
                route: 'immediateApproval',
                label: 'Abrir Aprovação'
            },
            26: {
                enabled: true,
                route: 'technicalTriage',
                label: 'Abrir Triagem'
            },
            28: {
                enabled: true,
                route: 'glpiErrorTreatment',
                label: 'Tratar Erro GLPI'
            },
            36: {
                enabled: true,
                route: 'committeeApproval',
                label: 'Abrir Comitê'
            },
            38: {
                enabled: true,
                route: 'commercialProposal',
                label: 'Abrir Proposta'
            },
            40: {
                enabled: true,
                route: 'requesterProposalApproval',
                label: 'Abrir Proposta'
            },
            54: {
                enabled: true,
                route: 'gccCostApproval',
                label: 'Abrir GCC'
            },
            61: {
                enabled: true,
                route: 'committeeCostApproval',
                label: 'Abrir Comitê (Custo)'
            },
            66: {
                enabled: true,
                route: 'purchaseContracting',
                label: 'Abrir Compras'
            }
        };
    },

    getProjectProcessStateLabelMap: function (processType) {
        var normalizedType = this.detectProjectProcessType(processType);

        if (normalizedType === 'desenvolvimento') {
            return {
                0: 'Planejamento do Projeto',
                4: 'Planejamento do Projeto',
                14: 'Aguardando Planejamento do Projeto',
                18: 'Execução do Projeto',
                23: 'Validacao do Solicitante',
                25: 'Aguardando Encaminhamento da Validacao do Solicitante',
                32: 'Validacao TI',
                34: 'Aguardando Encaminhamento da Validacao TI',
                38: 'Execucao de Projeto Finalizada',
                46: 'Erro de Integracao GLPI',
                52: 'Erro de Integracao GLPI',
                72: 'Finalizado'
            };
        }

        if (normalizedType === 'execucaoFases') {
            return {
                0: 'Inicio da Atividade',
                12: 'Integracao GLPI',
                14: 'Aguardando Execucao da Atividade',
                18: 'Execucao da Atividade',
                23: 'Validacao do Solicitante',
                25: 'Aguardando Encaminhamento da Validacao do Solicitante',
                32: 'Validacao TI',
                34: 'Aguardando Encaminhamento da Validacao TI',
                36: 'Integracao GLPI',
                41: 'Finalizado',
                46: 'Erro de Integracao GLPI',
                52: 'Erro de Integracao GLPI'
            };
        }

        return {
            0: 'Rascunho da Nova Solicitação',
            4: 'Rascunho da Nova Solicitação',
            5: 'Aguardando TI Avaliar Projeto',
            15: 'Aguardando Correção do Solicitante',
            19: 'Aguardando Aprovação do Superior Imediato',
            26: 'Aguardando Triagem Técnica TI',
            28: 'Erro de Integração GLPI',
            29: 'Integração GLPI',
            36: 'Aguardando Aprovação Comitê',
            38: 'Aguardando TI Anexar Proposta Comercial',
            40: 'Aguardando Solicitante Aprovar Proposta',
            53: 'Integração Iniciar Projeto',
            54: 'Aguardando Aprovação Gerente do Centro de Custo',
            61: 'Aguardando Comitê Aprovar Custo do Projeto',
            66: 'Aguardando Compras Realizar Contratação',
            72: 'Finalizado',
            74: 'Erro de Integração Iniciar Projeto'
        };
    },

    isProjectPlanningActivity: function (processTypeOrContext, activity) {
        var context = processTypeOrContext && typeof processTypeOrContext === 'object'
            ? processTypeOrContext
            : null;
        var processType = context
            ? this.detectProjectProcessType(context.processType || context.processName)
            : this.detectProjectProcessType(processTypeOrContext);
        var finalActivity = context
            ? this.parseProjectProcessActivity(context.activity !== undefined ? context.activity : context.estadoProcesso)
            : this.parseProjectProcessActivity(activity);

        return processType === 'desenvolvimento' && (finalActivity === 0 || finalActivity === 4 || finalActivity === 14);
    },

    getProjectProcessActionConfig: function (processTypeOrContext, activity) {
        var context = processTypeOrContext && typeof processTypeOrContext === 'object'
            ? processTypeOrContext
            : this.buildProjectProcessContext(processTypeOrContext, {
                estadoProcesso: activity
            });
        var processType = this.detectProjectProcessType(context.processType || context.processName);
        var currentActivity = this.parseProjectProcessActivity(context.activity !== undefined ? context.activity : context.estadoProcesso);
        var actionMap = this.getProjectProcessActionMap(processType);

        if (currentActivity !== null && actionMap[currentActivity]) {
            return actionMap[currentActivity];
        }

        if (processType === 'desenvolvimento') {
            return {
                enabled: false,
                route: '',
                label: 'Etapa Não Suportada'
            };
        }

        return {
            enabled: false,
            route: '',
            label: 'Indisponível'
        };
    },

    getProjectProcessStateLabel: function (processTypeOrContext, estadoProcesso) {
        var context = processTypeOrContext && typeof processTypeOrContext === 'object'
            ? processTypeOrContext
            : this.buildProjectProcessContext(processTypeOrContext, {
                estadoProcesso: estadoProcesso
            });
        var processType = this.detectProjectProcessType(context.processType || context.processName);
        var raw = this.asTrimmedString(context.estadoProcesso);
        var activity = this.parseProjectProcessActivity(context.activity !== undefined ? context.activity : raw);
        var stateLabelMap = this.getProjectProcessStateLabelMap(processType);

        if (this.getProjectCancelledActivities().indexOf(activity) !== -1) {
            return 'Cancelado';
        }

        if (activity !== null && stateLabelMap[activity]) {
            return stateLabelMap[activity];
        }

        if (processType === 'desenvolvimento') {
            return raw || 'Pendência de Desenvolvimento';
        }

        return raw || 'Pendência disponível para avaliação';
    },

    fetchProjectProcessRows: function (processType, options) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var definition = self.getProjectProcessDefinition(processType);
            if (!definition) {
                resolve([]);
                return;
            }

            var finalOptions = options && typeof options === 'object'
                ? Object.assign({}, options)
                : {};
            finalOptions.fields = self.ensureProjectProcessFields(definition.type, finalOptions.fields);

            self.getDatasetRows(definition.datasetId, finalOptions)
                .then(function (rows) {
                    resolve((rows || []).map(function (row) {
                        return self.buildProjectProcessContext(definition.type, row);
                    }));
                })
                .catch(reject);
        });
    },

    fetchAllProjectProcessRows: async function (options) {
        var definitions = this.getProjectProcessDefinitions();
        var processTypes = Object.keys(definitions);
        var results = await Promise.all(processTypes.map((processType) => {
            return this.fetchProjectProcessRows(processType, options).catch(function () {
                return [];
            });
        }));

        return results.reduce(function (acc, rows) {
            return acc.concat(rows || []);
        }, []);
    },

    resolveProjectProcessContext: async function (filters) {
        var finalFilters = filters && typeof filters === 'object' ? filters : {};
        var documentId = this.asTrimmedString(finalFilters.documentId);
        var preferredType = this.detectProjectProcessType(finalFilters.processType || finalFilters.processName || finalFilters.type);
        var queryOptions = {
            fields: Array.isArray(finalFilters.fields) ? finalFilters.fields : null,
            sortFields: Array.isArray(finalFilters.sortFields) ? finalFilters.sortFields : null,
            filters: Object.assign({}, finalFilters.filters || {})
        };

        if (documentId) {
            queryOptions.filters.documentid = documentId;
        }

        var processTypes = [];
        if (preferredType) {
            processTypes.push(preferredType);
        }

        Object.keys(this.getProjectProcessDefinitions()).forEach(function (processType) {
            if (processTypes.indexOf(processType) === -1) {
                processTypes.push(processType);
            }
        });

        var contexts = [];
        for (var i = 0; i < processTypes.length; i++) {
            var rows = await this.fetchProjectProcessRows(processTypes[i], queryOptions);
            if (rows && rows.length) {
                contexts = contexts.concat(rows);
                if (preferredType && processTypes[i] === preferredType) {
                    break;
                }
            }
        }

        if (!contexts.length) {
            return null;
        }

        if (preferredType) {
            for (var preferredIndex = 0; preferredIndex < contexts.length; preferredIndex++) {
                if (contexts[preferredIndex].processType === preferredType) {
                    return contexts[preferredIndex];
                }
            }
        }

        for (var contextIndex = 0; contextIndex < contexts.length; contextIndex++) {
            if (contexts[contextIndex].processType === 'desenvolvimento') {
                return contexts[contextIndex];
            }
        }

        return contexts[0];
    },

    asTrimmedString: function (value) {
        if (value === null || value === undefined) return "";
        return String(value).trim();
    },

    extractYearFromDateLike: function (value) {
        var text = this.asTrimmedString(value);
        if (!text) {
            return "";
        }

        var match = text.match(/^(\d{4})[-/]/);
        if (match && match[1]) {
            return match[1];
        }

        var parsed = new Date(text);
        if (!isNaN(parsed.getTime())) {
            return String(parsed.getFullYear());
        }

        return "";
    },

    buildProjectCode: function (processInstanceId, referenceDate) {
        var processId = this.asTrimmedString(processInstanceId);
        if (!processId) {
            return "";
        }

        // Safra logic: harvest starts 01/04 (April 1). If current/reference date
        // is on or after April 1 of year Y then safra is Y-(Y+1), otherwise (Y-1)-Y.
        var ref = referenceDate || new Date().toISOString();
        var dt = new Date(ref);
        if (isNaN(dt.getTime())) dt = new Date();
        var year = dt.getFullYear();
        var month = dt.getMonth() + 1; // 1..12

        var startYear;
        // if month >= 4 (April or later) safra starts this year, else starts previous year
        if (month >= 4) {
            startYear = year;
        } else {
            startYear = year - 1;
        }
        var endYear = startYear + 1;

        var startYY = String(startYear).slice(-2);
        var endYY = String(endYear).slice(-2);
        var safraCode = startYY + endYY; // e.g. '2627'

        var paddedProcessId = String(processId || '0').replace(/^0+/, '').padStart(4, '0');
        return 'PRJ-' + safraCode + '-' + paddedProcessId;
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
        var requesterName = self.asTrimmedString((formData && formData.solicitanteNome) || (typeof WCMAPI !== "undefined" && WCMAPI.getUser ? WCMAPI.getUser() : ""));
        var requesterColleagueId = self.asTrimmedString((formData && formData.solicitanteColleagueId) || (typeof WCMAPI !== "undefined" && WCMAPI.getUserCode ? WCMAPI.getUserCode() : ""));
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

        cardData.solicitanteNomeNS = requesterName;
        cardData.solicitanteColleagueIdNS = requesterColleagueId;

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

    createProjectSolicitation: async function (formData = {}, options = {}) {
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

            // Monta o código do projeto e salva no card recém-criado
            try {
                var processInstanceId = String(numSolicitacao || "").trim();
                var referenceDate = this.asTrimmedString((formData && formData.referenceDate) || new Date().toISOString());
                var projectCode = this.buildProjectCode(processInstanceId, referenceDate);

                // Tenta resolver documentId e atualizar o card com o campo `codigoglpi`
                var documentId = '';
                try {
                    documentId = await this.resolveDocumentIdByProcessInstanceId(processInstanceId);
                } catch (e) {
                    // se não conseguiu resolver agora, ignora — código ainda estará gerado e poderá ser salvo depois
                    documentId = '';
                }

                if (documentId) {
                    try {
                        await this.updateCard('', documentId, { codigoglpi: projectCode });
                    } catch (e) {
                        // Não falha o fluxo se a atualização do card der erro; registra para análise
                        console.warn('Falha ao salvar codigoglpi no card:', e);
                    }
                }
            } catch (e) {
                console.warn('Erro ao montar/salvar projectCode:', e);
            }

            return {
                status: status,
                numSolicitacao: numSolicitacao,
                raw: result
            };
        } catch (error) {
            console.error("Error creating project solicitation:", error);
            throw error;
        }
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

                try {
                    console.group('[fluigService.saveAndSendTask] pre-update');
                    console.log('[fluigService.saveAndSendTask] taskId:', taskId);
                    console.log('[fluigService.saveAndSendTask] numState:', numState);
                    console.log('[fluigService.saveAndSendTask] documentId:', documentId);
                    console.log('[fluigService.saveAndSendTask] taskFields.length:', finalTaskFields.length);
                    console.log('[fluigService.saveAndSendTask] first field names:', finalTaskFields.slice(0, 20).map(function (f) {
                        return f && f.name ? String(f.name) : '';
                    }));
                    console.groupEnd();
                } catch (e) {}

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

                    var updateResult = await fluigService.updateCard(taskData.parentId || taskData.datasetName || '', documentId, cardData);
                    try {
                        console.log('[fluigService.saveAndSendTask] updateCard result:', updateResult);
                    } catch (e) {}
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
    getWorkflowProcessInfo: function (filters = {}) {
        return new Promise((resolve, reject) => {
            try {
                var finalProcessInstanceId = this.asTrimmedString(filters.processInstanceId);
                var finalDocumentId = this.asTrimmedString(filters.documentId);
                var dataset = null;

                if (finalProcessInstanceId) {
                    dataset = DatasetFactory.getDataset('workflowProcess', null, [
                        DatasetFactory.createConstraint(
                            'workflowProcessPK.processInstanceId',
                            finalProcessInstanceId,
                            finalProcessInstanceId,
                            ConstraintType.MUST
                        )
                    ], null);
                } else if (finalDocumentId) {
                    var constraintCandidates = [
                        'cardDocumentId',
                        'workflowProcessPK.cardDocumentId',
                        'documentId',
                        'NR_DOCUMENTO_CARD'
                    ];

                    for (var i = 0; i < constraintCandidates.length; i++) {
                        dataset = DatasetFactory.getDataset('workflowProcess', null, [
                            DatasetFactory.createConstraint(
                                constraintCandidates[i],
                                finalDocumentId,
                                finalDocumentId,
                                ConstraintType.MUST
                            )
                        ], null);

                        if (dataset && Array.isArray(dataset.values) && dataset.values.length) {
                            break;
                        }
                    }
                } else {
                    throw new Error('processInstanceId ou documentId e obrigatorio');
                }

                if (!dataset || !Array.isArray(dataset.values) || !dataset.values.length) {
                    throw new Error('Nao foi possivel localizar os dados do processo informado');
                }

                resolve(dataset.values[0] || {});
            } catch (error) {
                reject(error);
            }
        });
    },
    resolveProjectSummaryContext: async function (filters = {}) {
        var finalDocumentId = this.asTrimmedString(filters.documentId);
        var finalProcessInstanceId = this.asTrimmedString(filters.processInstanceId);
        var workflowInfo = filters && typeof filters.workflowInfo === 'object' ? filters.workflowInfo : null;
        var referenceDate = this.asTrimmedString(filters.referenceDate);

        if (!finalProcessInstanceId && finalDocumentId) {
            try {
                finalProcessInstanceId = await this.resolveProcessInstanceIdByDocumentId(finalDocumentId);
            } catch (error) {}
        }

        if (!workflowInfo && (finalProcessInstanceId || finalDocumentId)) {
            try {
                workflowInfo = await this.getWorkflowProcessInfo({
                    processInstanceId: finalProcessInstanceId,
                    documentId: finalDocumentId
                });
            } catch (error) {}
        }

        if (!referenceDate && workflowInfo) {
            referenceDate = this.asTrimmedString(
                workflowInfo.startDateProcess
                || workflowInfo.startDateProcessFromHistory
                || workflowInfo['startDateProcess']
                || workflowInfo['startDateProcessFromHistory']
            );
        }

        return {
            documentId: finalDocumentId,
            processInstanceId: finalProcessInstanceId,
            workflowInfo: workflowInfo,
            projectCode: this.buildProjectCode(finalProcessInstanceId, referenceDate)
        };
    },
    resolveProjectSummaryCode: async function (filters = {}) {
        var context = await this.resolveProjectSummaryContext(filters);
        return this.asTrimmedString(context && context.projectCode);
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
