function servicetask55(attempt, message) {

	try {

		log.info("### servicetask55 - INICIO");

		var constraints = [];

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

		function addSimpleFields() {
			var simpleFields = [
				"urlServidor",
				"decisaoSuperiorImediato",
				"idGLPI",
				"codigoglpi",
				"payloadJsonGLPI",
				"decisaoAvaliarProjeto",
				"timelineNS",
				"titulodoprojetoNS",
				"ColigadaNS",
				"areaUnidadeNS",
				"centrodecustoNS",
				"patrocinadorNS",
				"solicitanteNomeNS",
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
				"statusIntegracaoGLPI",
				"mensagemErroGLPI",
				"projectPlanningJsonDP",
				"milestoneTaskSeqCtrlDP",
				"milestoneTaskProcCtrlDP",
				"raciJsonDP",
				"documentsJsonDP",
				"chkEapWbsDP",
				"chkMilestonesDP",
				"chkRisksDP",
				"chkRaciDP",
				"chkDocsDP",
				"decisaoExecucaoProjetoDP",
				"justificativaExecucaoProjetoDP",
				"execFasesAtividadesCorrecao",
				"milestoneTaskCancelProcDP",
				"milestoneTaskSyncSnapDP",
				"ValidacaoSolicitanteDecisao",
				"valSolicComentarioDP",
				"valSolicDescricaoDP",
				"valSolicCategoriaDP",
				"valSolicChecklistDP",
				"valSolicLiConcordoDP",
				"valSolicHistJsonDP",
				"ValidacaoTIDecisao",
				"valTIComentarioDP",
				"valTIDescricaoDP",
				"valTICategoriaDP",
				"valTIChecklistDP",
				"valTILiConcordoDP",
				"valTIHistJsonDP",
				"erroIniciarExecucaoMsg",
				"erroIniciarExecucaoIdx"
			];

			for (var i = 0; i < simpleFields.length; i++) {
				var fieldName = simpleFields[i];
				addConstraint(fieldName, hAPI.getCardValue(fieldName));
			}
		}

		function addChildTableFields() {
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
				],
				"tblWbsPhasesDP": [
					"wbsPhaseIdDP",
					"wbsPhaseOrderDP",
					"wbsPhaseNameDP",
					"wbsPhaseResponsibleDP",
					"wbsPhaseEffortHoursDP",
					"wbsPhaseDurationDaysDP",
					"wbsPhaseNotesDP"
				],
				"tblWbsTasksDP": [
					"wbsTaskIdDP",
					"wbsTaskPhaseIdDP",
					"wbsTaskOrderDP",
					"wbsTaskNameDP",
					"wbsTaskResponsibleDP",
					"wbsTaskEffortHoursDP",
					"wbsTaskDurationDaysDP"
				],
				"tblMilestonesDP": [
					"milestoneIdDP",
					"milestoneNameDP",
					"milestoneStartDateDP",
					"milestoneEndDateDP"
				],
				"tblMilestoneCriteriaDP": [
					"milestoneCriteriaMilestoneIdDP",
					"milestoneCriteriaTextDP"
				],
				"tblMilestoneTasksDP": [
					"milestoneTaskIdDP",
					"milestoneTaskMilestoneIdDP",
					"milestoneTaskTextDP",
					"milestoneTaskDueDateDP",
					"milestoneTaskProcessDP",
					"milestoneTaskDocIdDP",
					"milestoneTaskStatusDP",
					"milestoneTaskStartedDP"
				],
				"tblMilestoneTasksSummaryDP": [
					"milestoneTaskSummaryIdDP",
					"milestoneTaskSummaryTextDP",
					"milestoneTaskSummaryDueDateDP",
					"milestoneTaskSummaryPhaseDP",
					"milestoneTaskSummaryMarcoDP",
					"milestoneTaskSummaryProcessDP",
					"milestoneTaskSummaryDocIdDP",
					"milestoneTaskSummaryEstProcDP",
					"milestoneTaskSummaryStatusDP",
					"milestoneTaskSummaryStartedDP"
				],
				"tblRisksDP": [
					"riskIdDP",
					"riskDescriptionDP",
					"riskProbabilityDP",
					"riskImpactDP",
					"riskMitigationDP",
					"riskPlanBDP"
				],
				"tblExternalDependenciesDP": [
					"externalDependencyIdDP",
					"externalDependencyDescriDP",
					"externalDependencyStatusDP",
					"externalDependencyResponDP",
					"externalDependencyMitiDP",
					"externalDependencyPlanBDP"
				],
				"tblTeamAllocationDP": [
					"allocMemberDP",
					"allocProfileDP",
					"allocDedicationDP"
				],
				"tblCommunicationPlanDP": [
					"commAudienceDP",
					"commChannelDP",
					"commFrequencyDP"
				]
			};

			for (var tableName in childTables) {
				if (!childTables.hasOwnProperty(tableName)) {
					continue;
				}

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
						addConstraint(completeField, hAPI.getCardValue(completeField));
					}
				}
			}
		}

		hAPI.setCardValue("erroIniciarEntregaMsg", "");
		hAPI.setCardValue("erroIniciarEntregaProc", "");

		addSimpleFields();
		addChildTableFields();

		log.info("### servicetask55 - TOTAL CONSTRAINTS: " + constraints.length);

		var fields = [
			"14cdc0c0-a710-4412-81dd-d94fe3abe00a",
			"ProcessEntregaProjetos",
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
			hAPI.setCardValue("erroIniciarEntregaMsg", "Dataset dsStartProcess nao retornou dados ao iniciar ProcessEntregaProjetos.");
			hAPI.setCardValue("erroIniciarEntregaProc", "");
			throw "Dataset dsStartProcess nao retornou dados ao iniciar ProcessEntregaProjetos.";
		}

		var status = ds.getValue(0, "status");
		var numSolicitacao = ds.getValue(0, "numSolicitacao");

		log.info("### servicetask55 - STATUS: " + status);
		log.info("### servicetask55 - NOVO PROCESSO ENTREGA: " + numSolicitacao);

		if (status != "OK") {
			hAPI.setCardValue("erroIniciarEntregaMsg", "Erro ao iniciar processo ProcessEntregaProjetos. Retorno: " + String(numSolicitacao || ""));
			hAPI.setCardValue("erroIniciarEntregaProc", String(numSolicitacao || ""));
			throw "Erro ao iniciar processo ProcessEntregaProjetos.";
		}

		return true;

	} catch (e) {

		log.error("### servicetask55 - ERRO: " + e);

		if (!String(hAPI.getCardValue("erroIniciarEntregaMsg") || "")) {
			hAPI.setCardValue("erroIniciarEntregaMsg", String(e || "Erro ao iniciar processo ProcessEntregaProjetos."));
			hAPI.setCardValue("erroIniciarEntregaProc", "");
		}

		throw e;
	}
}
