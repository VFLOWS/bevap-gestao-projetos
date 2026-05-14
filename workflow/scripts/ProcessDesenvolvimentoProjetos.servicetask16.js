function servicetask16(attempt, message) {

	try {

		log.info("### servicetask16 - INICIO");

		var baseConstraints = [];

		function addConstraint(targetConstraints, fieldName, value) {

			if (value == null) {
				value = "";
			}

			targetConstraints.push(
				DatasetFactory.createConstraint(
					fieldName,
					String(value),
					String(value),
					ConstraintType.MUST
				)
			);
		}

		function addSimpleFields(targetConstraints) {

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
				"mensagemErroGLPI",

				"projectPlanningJsonDP",
				"raciJsonDP",
				"documentsJsonDP",
				"chkEapWbsDP",
				"chkMilestonesDP",
				"chkRisksDP",
				"chkRaciDP",
				"chkDocsDP"
			];

			for (var i = 0; i < simpleFields.length; i++) {

				var fieldName = simpleFields[i];
				addConstraint(targetConstraints, fieldName, hAPI.getCardValue(fieldName));
			}
		}

		function addChildTableFields(targetConstraints) {

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
					"milestoneTaskMilestoneIdDP",
					"milestoneTaskTextDP",
					"milestoneTaskDueDateDP"
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

						addConstraint(targetConstraints, completeField, hAPI.getCardValue(completeField));
					}
				}
			}
		}

		addSimpleFields(baseConstraints);
		addChildTableFields(baseConstraints);

		var summaryIndexes = hAPI.getChildrenIndexes("tblMilestoneTasksSummaryDP");

		if (!summaryIndexes || summaryIndexes.length == 0) {
			log.info("### servicetask16 - NENHUMA LINHA EM tblMilestoneTasksSummaryDP");
			return true;
		}

		for (var i = 0; i < summaryIndexes.length; i++) {

			var idx = summaryIndexes[i];
			var constraints = [];

			// pular se já foi iniciado (controle por campo booleano na linha)
			var startedVal = hAPI.getCardValue("milestoneTaskSummaryStartedDP___" + idx);
			if (startedVal && String(startedVal).toLowerCase() === "true") {
				log.info("### servicetask16 - PULANDO LINHA JA INICIADA: " + idx);
				continue;
			}

			for (var b = 0; b < baseConstraints.length; b++) {
				constraints.push(baseConstraints[b]);
			}

			addConstraint(constraints, "milestoneTaskSummaryTextDP", hAPI.getCardValue("milestoneTaskSummaryTextDP___" + idx));
			addConstraint(constraints, "milestoneTaskSummaryDueDateDP", hAPI.getCardValue("milestoneTaskSummaryDueDateDP___" + idx));
			addConstraint(constraints, "milestoneTaskSummaryPhaseDP", hAPI.getCardValue("milestoneTaskSummaryPhaseDP___" + idx));
			addConstraint(constraints, "milestoneTaskSummaryMarcoDP", hAPI.getCardValue("milestoneTaskSummaryMarcoDP___" + idx));

			log.info("### servicetask16 - INICIANDO PROCESSO execucaoFasesAtividades PARA LINHA " + idx);

			var fields = [
				"14cdc0c0-a710-4412-81dd-d94fe3abe00a",
				"execucaoFasesAtividades",
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
				// gravar informação de erro para a tela de tratar erro (atividade 47)
				hAPI.setCardValue("erroIniciarExecucaoMsg", "Dataset dsStartProcess nao retornou dados para a linha " + idx + ".");
				hAPI.setCardValue("erroIniciarExecucaoIdx", String(idx));
				throw "Dataset dsStartProcess nao retornou dados para a linha " + idx + ".";
			}

			var status = ds.getValue(0, "status");
			var iProcess = ds.getValue(0, "numSolicitacao");

			log.info("### servicetask16 - STATUS: " + status);
			log.info("### servicetask16 - NOVO PROCESSO: " + iProcess);

			if (status != "OK") {
				// gravar informação de erro para a tela de tratar erro (atividade 47)
				hAPI.setCardValue("erroIniciarExecucaoMsg", "Erro ao iniciar processo execucaoFasesAtividades para a linha " + idx + ".");
				hAPI.setCardValue("erroIniciarExecucaoIdx", String(idx));
				throw "Erro ao iniciar processo execucaoFasesAtividades para a linha " + idx + ".";
			}

			// Salvar o ID do processo aberto no campo milestoneTaskSummaryProcessDP
			hAPI.setCardValue("milestoneTaskSummaryProcessDP___" + idx, iProcess);
			log.info("### servicetask16 - SALVOU iProcess NA LINHA: " + idx + " = " + iProcess);
			// Marcar como iniciado para não reiniciar esta linha em novas tentativas
			hAPI.setCardValue("milestoneTaskSummaryStartedDP___" + idx, "true");
			log.info("### servicetask16 - MARCOU STARTED NA LINHA: " + idx);
		}

		return true;

	} catch (e) {

		log.error("### servicetask16 - ERRO: " + e);

		throw e;
	}
}