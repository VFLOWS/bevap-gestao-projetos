function servicetask53(attempt, message) {

    try {

        log.info("### servicetask53 - INICIO");

        var constraints = [];

        // =====================================================
        // HELPERS
        // =====================================================
        function addConstraint(fieldName, value) {

            if (value == null) {
                value = "";
            }

            constraints.push(
                DatasetFactory.createConstraint(
                    fieldName,
                    String(value),
                    String(value),
                    ConstraintType.MUST
                )
            );
        }

        // =====================================================
        // CAMPOS SIMPLES
        // =====================================================

        var simpleFields = [

            "timelineNS",
            "decisaoSuperiorImediato",
            "decisaoAvaliarProjeto",
            "payloadJsonGLPI",
           
            "titulodoprojetoNS",
            "ColigadaNS",
            "areaUnidadeNS",
            "centrodecustoNS",
            "patrocinadorNS",
            "solicitanteNomeNS",
            "solicitanteColleagueIdNS",
            "objetivodoprojetoNS",
            "problemaOportunidadeNS",
            "beneficiosesperadosNS",
            "alinhadobevapNS",
            "prioridadeNS",
            "escopoinicialNS",
            "foradeescopoNS",
            "dependenciasNS",
            "anexosNS",
            "observacoesadicionaisNS",

            "visibilidadetecnicaAPTI",
            "alternativasconsideradasAPTI",
            "esforcoestimadohorasAPTI",
            "esforcoestimadopontosAPTI",
            "dependenciastecnicasAPTI",
            "observacoesdaanaliseAPTI",
            "objetivoClaramenteDefinidoAPTI",
            "escopoBemDelimitadoAPTI",
            "documentacaoTecnicaAdeqAPTI",
            "patrocinadoridentificadoAPTI",
            "alinhEstratConfAPTI",
            "recursosTecDispAPTI",
            "anexosessenciaispresentesAPTI",

            "disponibilidadedaEquipeSI",
            "recursosNecessariosAreaSI",
            "conflitosdeAgendaSI",
            "prioridadeparaaAreaSI",
            "observacoesdoGestorSI",
            "equipepossuiDisponibilidadeSI",
            "recursosNecessIdentSI",
            "naoHaConflitosCriticosSI",
            "projetoAlinhadoPrioridadesSI",

            "execucaoProjetoTITT",
            "motivoDecisaoCategoriaTITT",
            "motivoDecisaoDescricaoTITT",
            "disponibilidadedaEquipeTITT",
            "dataDesejadaInicioTITT",

            "fornecedorRecomendadoTITT",
            "codfornTITT",
            "tipoContratacaoTITT",
            "justifExecucaoExtTITT",
            "anexosApoioTITT",

            "escopoProjClaroDetTITT",
            "estimativasCustoPrazoRegTITT",
            "anexosEssenciaisPresentesTITT",
            "decisaoExecucaoDocumentadaTITT",
            "riscosDependenciasMapeadosTITT",

            "dataHoraCAP",
            "anotacoesCAP",
            "anexarAtaReuniaoCAP",
            "decisaocomite1",
            "justificativacomite1",
            "categoriajusticomite1",

            "nomeFornecedorTIPC",
            "codFornecedorTIPC",
            "cnpjTIPC",
            "nomeContatoTIPC",
            "emailTIPC",
            "telefoneTIPC",
            "nomeContato2TIPC",
            "email2TIPC",
            "telefone2TIPC",
            "numeroRefPropostaTIPC",
            "vigenciaDiasTIPC",
            "valortotalTIPC",
            "moedaTIPC",
            "simboloMoedaTIPC",
            "prazoEstimadoTIPC",
            "condicaoPagamentoTIPC",
            "codigoCondicaoPagamentoTIPC",
            "escopoResumidoTIPC",

            "anexosPropostaTIPC",

            "escopoClaroDetalhadoTIPC",
            "impostosTaxasInclusosTIPC",
            "prazosEntregaDefinidosTIPC",
            "garantiasSlaEspecificadosTIPC",
            "vigenciaPropostaConfirmadaTIPC",
            "documentosAnexCompTIPC",

            "decisaoTIPC",
            "justificativaTIPC",
            "categoriajustiTIPC",

            "observacoesNegociacaoSAP",
            "liConcordoPropostaComercialSAP",
            "decisaoPropostaSAP",
            "justificativaPropostaSAP",
            "categoriajustiPropostaSAP",

            "capexGCC",
            "valorCapexGCC",
            "naturezaCapexGCC",

            "opexGCC",
            "valorOpexGCC",
            "naturezaOpexGCC",

            "competenciaGCC",
            "observacoesNegociacaoGCC",
            "decisaoGCC",
            "justificativaGCC",
            "categoriaJustificativaGCC",

            "dataHoraACP",
            "anotacoesACP",
            "anexarAtaReuniaoACP",
            "decisaocomite2",
            "justificativacomite2",
            "categoriajusticomite2",

            "tipoContratacaoCRC",
            "numeroPedidoContratoCRC",
            "dataEmissaoCRC",
            "inicioVigenciaCRC",
            "fimVigenciaCRC",
            "condicaoPagamentoCRC",
            "centroCustoCRC",
            "contaContabilCRC",
            "escopoAcordadoCRC",
            "slaGarantiaCRC",
            "multasRescisaoCRC",
            "pessoaJuridicaRegularCRC",
            "certidoesNegativasCRC",
            "lgpdCRC",
            "analiseSegurancaCRC",
            "seguroResponsabilidadeCRC",
            "anexosCRC",

            "escolhercondicaopagamentoCRC",
            "quantasVezesCondicaoCRC",
            "periodoEmDiasCondicaoCRC",
            "escolherparcelasCRC",

            "valorFinalCRC",
            "impostosEncargosCRC",
            "capexCRC",
            "opexCRC",

            "decisaoCRC",
            "justificativaCRC",
            "categoriajustiCRC",

            "decisaoCorrecao",
            "justificativaCorrecao",
            "categoriajustiCorrecao",

            "idGLPI",
            "codigoglpi",
            "statusIntegracaoGLPI",
            "mensagemErroGLPI"
        ];

        for (var i = 0; i < simpleFields.length; i++) {

            var fieldName = simpleFields[i];
            var value = hAPI.getCardValue(fieldName);

            addConstraint(fieldName, value);
        }

        // =====================================================
        // TABELAS PAI X FILHO
        // =====================================================

        var childTables = {

            "tblBeneficiosEsperadosNS": [
                "beneficioEsperadoNS"
            ],

            "tblObjetivosEstrategicosNS": [
                "descricaoobjetivoNS"
            ],

            "tblRiscosIniciaisNS": [
                "riscoPotencialNS"
            ],

            "tblStakeholdersNS": [
                "valorstakeholdersNS"
            ],

            "tblRiscosIdentificadosAPTI": [
                "nivelRiscoAPTI",
                "descricaoRiscoAPTI"
            ],

            "tblRiscosIdentificadosTITT": [
                "tituloRiscoTITT",
                "descricaoRiscoTITT",
                "mitigacaoRiscoTITT",
                "planoBRiscoTITT",
                "nivelRiscoTITT",
                "impactoRiscoTITT",
                "probabilidadeRiscoTITT"
            ],

            "tblDependenciasTITT": [
                "tituloDependenciaTITT",
                "statusDependenciaTITT",
                "responsavelDependenciaTITT",
                "mitigacaoDependenciaTITT",
                "planoBDependenciaTITT"
            ],

            "tblParticipantesCAP": [
                "nomeParticipanteCAP"
            ],

            "tblItensServicosTIPC": [
                "descricaoItemServicoTIPC",
                "quantidadeItemServicoTIPC",
                "valorUnitarioItemServicoTIPC",
                "totalItemServicoTIPC"
            ],

            "tblRiscosIniciaisTIPC": [
                "tituloRiscoTIPC",
                "descricaoRiscoTIPC",
                "mitigacaoRiscoTIPC",
                "planoBRiscoTIPC",
                "nivelRiscoTIPC",
                "impactoRiscoTIPC",
                "probabilidadeRiscoTIPC",
                "riscoPotencialTIPC"
            ],

            "tblPreRequisitosTIPC": [
                "tituloPreRequisitoTIPC",
                "statusPreRequisitoTIPC",
                "responsavelPreRequisitoTIPC",
                "mitigacaoPreRequisitoTIPC",
                "planoBPreRequisitoTIPC",
                "preRequisitoTIPC"
            ],

            "tblNaturezaCustoCapexGCC": [
                "centroCustoCapexGCC",
                "contaContabilCapexGCC",
                "porcentagemCapexGCC",
                "saldoCapexGCC",
                "saldoAposCompromissoCapexGCC"
            ],

            "tblNaturezaCustoOpexGCC": [
                "centroCustoOpexGCC",
                "contaContabilOpexGCC",
                "porcentagemOpexGCC",
                "saldoOpexGCC",
                "saldoAposCompromissoOpexGCC"
            ],

            "tblParticipantesACP": [
                "nomeParticipanteACP"
            ]
        };

        for (var tableName in childTables) {

			var indexes = hAPI.getChildrenIndexes(tableName);

			if (!indexes || indexes.length == 0) {
				continue;
			}

			for (var x = 0; x < indexes.length; x++) {

				var idx = indexes[x];

				var fieldsTable = childTables[tableName];

				for (var y = 0; y < fieldsTable.length; y++) {

					var field = fieldsTable[y];
					var completeField = field + "___" + idx;

					var fieldValue = hAPI.getCardValue(completeField);

					addConstraint(
						completeField,
						fieldValue
					);
				}
			}
		}

        log.info("### servicetask53 - TOTAL CONSTRAINTS: " + constraints.length);

        // =====================================================
        // START PROCESS
        // =====================================================

        var fields = [
            "14cdc0c0-a710-4412-81dd-d94fe3abe00a",
            "ProcessDesenvolvimentoProjetos",
            "0",
            getValue("WKCompany") + "",
            "",
            "true"
        ];

        var ds = DatasetFactory.getDataset(
            "dsStartProcess",
            fields,
            constraints,
            null
        );

        if (ds == null || ds.rowsCount == 0) {
            throw "Dataset dsStartProcess nao retornou dados.";
        }

        var status = ds.getValue(0, "status");
        var numSolicitacao = ds.getValue(0, "numSolicitacao");

        log.info("### servicetask53 - STATUS: " + status);
        log.info("### servicetask53 - NOVO PROCESSO: " + numSolicitacao);

        if (status != "OK") {
            throw "Erro ao iniciar processo.";
        }


        return true;

    } catch (e) {

        log.error("### servicetask53 - ERRO: " + e);

        throw e;
    }
}