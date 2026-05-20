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
				"chkDocsDP",
				"milestoneTaskSeqCtrlDP",
				"milestoneTaskProcCtrlDP",
				"execFasesAtividadesCorrecao",
				"milestoneTaskCancelProcDP",
				"milestoneTaskSyncSnapDP"
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

		function isTrue(value) {
			var normalized = String(value || "").toLowerCase();
			return normalized == "true" || normalized == "1" || normalized == "sim" || normalized == "yes";
		}

		function getExecutionActivityByProcess(processId) {
			if (!processId) return null;
			var constraints = [
				DatasetFactory.createConstraint("PWS.NUM_PROCES", String(processId), String(processId), ConstraintType.MUST)
			];
			var fields = ["documentid", "NUM_PROCES", "estadoProcesso", "STATUS"];
			var ds = DatasetFactory.getDataset("dsGetExecucaoAtividade", fields, constraints, null);
			if (ds == null || ds.rowsCount == 0) return null;
			for (var r = 0; r < ds.rowsCount; r++) {
				if (String(ds.getValue(r, "NUM_PROCES") || "") == String(processId)) {
					return {
						documentid: String(ds.getValue(r, "documentid") || ""),
						NUM_PROCES: String(ds.getValue(r, "NUM_PROCES") || ""),
						estadoProcesso: String(ds.getValue(r, "estadoProcesso") || ""),
						STATUS: String(ds.getValue(r, "STATUS") || "")
					};
				}
			}
			return {
				documentid: String(ds.getValue(0, "documentid") || ""),
				NUM_PROCES: String(ds.getValue(0, "NUM_PROCES") || ""),
				estadoProcesso: String(ds.getValue(0, "estadoProcesso") || ""),
				STATUS: String(ds.getValue(0, "STATUS") || "")
			};
		}

		function callUpdateCard(documentId, constraints) {
			var fields = [JSON.stringify({ campo: "documentId", valor: String(documentId) })];
			for (var c = 0; c < constraints.length; c++) {
				fields.push(JSON.stringify({
					campo: String(constraints[c].fieldName || ""),
					valor: String(constraints[c].initialValue || "")
				}));
			}
			var ds = DatasetFactory.getDataset("dsUpdateCardDataService", fields, null, null);
			if (ds == null || ds.rowsCount == 0) throw "Dataset dsUpdateCardDataService nao retornou dados para documentId " + documentId + ".";
			var retorno = String(ds.getValue(0, "codRetorno") || "");
			var mensagem = String(ds.getValue(0, "msgRetorno") || "");
			log.info("### servicetask16 - UPDATE CARD documentId=" + documentId + " retorno=" + retorno + " msg=" + mensagem);
			if (retorno != "OK") throw "Erro ao atualizar card " + documentId + ": " + mensagem;
		}

		function cancelProcessInstance(processId, cancelText) {
			if (!processId) return;
			var clientService = fluigAPI.getAuthorizeClientService();
			var body = {
				processInstanceId: Number(processId),
				cancelText: String(cancelText || "Cancelado automaticamente por correção do planejamento.")
			};
			var data = {
				companyId: String(getValue("WKCompany")),
				serviceCode: "fluig_rest",
				endpoint: "/api/public/2.0/workflows/cancelInstance",
				method: "post",
				timeoutService: "120",
				options: {
					encoding: "UTF-8",
					mediaType: "application/json",
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json"
					}
				},
				params: body
			};
			log.info("### servicetask16 - CANCEL INSTANCE REQUEST processId=" + processId + " body=" + JSON.stringify(body));
			var response = clientService.invoke(JSONUtil.toJSON(data));
			var resultText = response && response.getResult ? String(response.getResult() || "") : "";
			log.info("### servicetask16 - CANCEL INSTANCE processId=" + processId + " retorno=" + resultText);
		}

		function setTaskMirrorValues(idx, processId, documentId, status, estadoProcesso) {
			var summaryId = String(hAPI.getCardValue("milestoneTaskSummaryIdDP___" + idx) || "");
			var taskIndexes = hAPI.getChildrenIndexes("tblMilestoneTasksDP");
			var taskRowIdx = "";
			for (var ti = 0; taskIndexes && ti < taskIndexes.length; ti++) {
				var currentTaskIdx = taskIndexes[ti];
				if (String(hAPI.getCardValue("milestoneTaskIdDP___" + currentTaskIdx) || "") == summaryId) {
					taskRowIdx = currentTaskIdx;
					break;
				}
			}
			hAPI.setCardValue("milestoneTaskSummaryProcessDP___" + idx, String(processId || ""));
			hAPI.setCardValue("milestoneTaskSummaryDocIdDP___" + idx, String(documentId || ""));
			hAPI.setCardValue("milestoneTaskSummaryStatusDP___" + idx, String(status || ""));
			hAPI.setCardValue("milestoneTaskSummaryEstProcDP___" + idx, String(estadoProcesso || ""));
			hAPI.setCardValue("milestoneTaskSummaryStartedDP___" + idx, "true");
			if (taskRowIdx) {
				hAPI.setCardValue("milestoneTaskProcessDP___" + taskRowIdx, String(processId || ""));
				hAPI.setCardValue("milestoneTaskDocIdDP___" + taskRowIdx, String(documentId || ""));
				hAPI.setCardValue("milestoneTaskStatusDP___" + taskRowIdx, String(status || ""));
				hAPI.setCardValue("milestoneTaskStartedDP___" + taskRowIdx, "true");
			}
		}

		function parseJsonArray(rawValue) {
			try {
				var parsed = JSON.parse(String(rawValue || "[]"));
				return parsed && parsed.length ? parsed : [];
			} catch (eJson) {
				return [];
			}
		}

		function normalizeSnapshotRow(item) {
			if (!item) return null;
			var taskId = parseInt(String(item.taskId || item.id || "0"), 10);
			if (isNaN(taskId) || taskId <= 0) return null;
			return {
				taskId: taskId,
				processId: String(item.processId || item.process || ""),
				documentId: String(item.documentId || item.docId || ""),
				started: isTrue(item.started),
				status: String(item.status || ""),
				estadoProcesso: String(item.estadoProcesso || "")
			};
		}

		function getSummarySnapshotFromCard(indexes) {
			var snapshot = [];
			for (var s = 0; indexes && s < indexes.length; s++) {
				var idx = indexes[s];
				var taskId = parseInt(String(hAPI.getCardValue("milestoneTaskSummaryIdDP___" + idx) || "0"), 10);
				if (isNaN(taskId) || taskId <= 0) continue;
				snapshot.push({
					taskId: taskId,
					processId: String(hAPI.getCardValue("milestoneTaskSummaryProcessDP___" + idx) || ""),
					documentId: String(hAPI.getCardValue("milestoneTaskSummaryDocIdDP___" + idx) || ""),
					started: isTrue(hAPI.getCardValue("milestoneTaskSummaryStartedDP___" + idx)),
					status: String(hAPI.getCardValue("milestoneTaskSummaryStatusDP___" + idx) || ""),
					estadoProcesso: String(hAPI.getCardValue("milestoneTaskSummaryEstProcDP___" + idx) || "")
				});
			}
			return snapshot;
		}

		function indexSnapshotByTaskId(snapshot) {
			var map = {};
			for (var i = 0; snapshot && i < snapshot.length; i++) {
				var normalized = normalizeSnapshotRow(snapshot[i]);
				if (normalized) {
					map[String(normalized.taskId)] = normalized;
				}
			}
			return map;
		}

		function collectProcessesToCancel(previousSnapshot, currentSnapshot, explicitQueue) {
			var processMap = {};
			var currentMap = indexSnapshotByTaskId(currentSnapshot);

			for (var p = 0; previousSnapshot && p < previousSnapshot.length; p++) {
				var previousItem = normalizeSnapshotRow(previousSnapshot[p]);
				if (!previousItem || !previousItem.started || !previousItem.processId) continue;
				if (!currentMap[String(previousItem.taskId)]) {
					processMap[previousItem.processId] = true;
					log.info("### servicetask16 - SNAPSHOT DETECTOU REMOCAO taskId=" + previousItem.taskId + " processId=" + previousItem.processId);
				}
			}

			for (var q = 0; explicitQueue && q < explicitQueue.length; q++) {
				var queuedProcessId = String(explicitQueue[q] || "");
				if (!queuedProcessId) continue;
				processMap[queuedProcessId] = true;
			}

			var processes = [];
			for (var processId in processMap) {
				if (processMap.hasOwnProperty(processId)) {
					processes.push(processId);
				}
			}
			return processes;
		}

		function finalizeSync(summaryIndexes, maxProcessedId) {
			var finalSnapshot = getSummarySnapshotFromCard(summaryIndexes);
			hAPI.setCardValue("milestoneTaskProcCtrlDP", String(maxProcessedId));
			hAPI.setCardValue("milestoneTaskSyncSnapDP", JSON.stringify(finalSnapshot));
			hAPI.setCardValue("execFasesAtividadesCorrecao", "false");
			hAPI.setCardValue("milestoneTaskCancelProcDP", "[]");
			log.info("### servicetask16 - milestoneTaskProcCtrlDP ATUALIZADO PARA: " + maxProcessedId);
			log.info("### servicetask16 - SNAPSHOT FINAL SALVO: " + JSON.stringify(finalSnapshot));
		}

		function addCurrentSummaryContext(targetConstraints, idx) {
			addConstraint(targetConstraints, "milestoneTaskSummaryIdDP", hAPI.getCardValue("milestoneTaskSummaryIdDP___" + idx));
			addConstraint(targetConstraints, "milestoneTaskSummaryTextDP", hAPI.getCardValue("milestoneTaskSummaryTextDP___" + idx));
			addConstraint(targetConstraints, "milestoneTaskSummaryDueDateDP", hAPI.getCardValue("milestoneTaskSummaryDueDateDP___" + idx));
			addConstraint(targetConstraints, "milestoneTaskSummaryPhaseDP", hAPI.getCardValue("milestoneTaskSummaryPhaseDP___" + idx));
			addConstraint(targetConstraints, "milestoneTaskSummaryMarcoDP", hAPI.getCardValue("milestoneTaskSummaryMarcoDP___" + idx));
		}

		addSimpleFields(baseConstraints);
		addChildTableFields(baseConstraints);

		var summaryIndexes = hAPI.getChildrenIndexes("tblMilestoneTasksSummaryDP");
		var correctionMode = isTrue(hAPI.getCardValue("execFasesAtividadesCorrecao"));
		var cancelledProcesses = parseJsonArray(hAPI.getCardValue("milestoneTaskCancelProcDP"));
		var previousSnapshot = parseJsonArray(hAPI.getCardValue("milestoneTaskSyncSnapDP"));
		var currentSnapshot = getSummarySnapshotFromCard(summaryIndexes);
		var processesToCancel = collectProcessesToCancel(previousSnapshot, currentSnapshot, cancelledProcesses);
		var processedControlId = parseInt(String(hAPI.getCardValue("milestoneTaskProcCtrlDP") || "0"), 10);
		if (isNaN(processedControlId)) processedControlId = 0;
		var maxProcessedId = processedControlId;
		log.info("### servicetask16 - MODO CORRECAO: " + correctionMode);
		log.info("### servicetask16 - milestoneTaskProcCtrlDP ATUAL: " + processedControlId);
		log.info("### servicetask16 - SNAPSHOT ANTERIOR: " + JSON.stringify(previousSnapshot));
		log.info("### servicetask16 - SNAPSHOT ATUAL: " + JSON.stringify(currentSnapshot));
		log.info("### servicetask16 - PROCESSOS MARCADOS PARA CANCELAMENTO: " + cancelledProcesses);
		log.info("### servicetask16 - PROCESSOS A CANCELAR APOS COMPARACAO: " + processesToCancel);

		for (var cp = 0; cp < processesToCancel.length; cp++) {
			cancelProcessInstance(processesToCancel[cp], "Cancelado automaticamente por remocao da tarefa do marco durante a correcao do planejamento.");
		}

		if (!summaryIndexes || summaryIndexes.length == 0) {
			log.info("### servicetask16 - NENHUMA LINHA EM tblMilestoneTasksSummaryDP");
			finalizeSync(summaryIndexes, maxProcessedId);
			return true;
		}

		for (var i = 0; i < summaryIndexes.length; i++) {

			var idx = summaryIndexes[i];
			var constraints = [];
			var summaryTaskId = parseInt(String(hAPI.getCardValue("milestoneTaskSummaryIdDP___" + idx) || "0"), 10);
			if (isNaN(summaryTaskId)) summaryTaskId = 0;
			if (summaryTaskId > maxProcessedId) maxProcessedId = summaryTaskId;

			// pular se já foi iniciado (controle por campo booleano na linha)
			var startedVal = hAPI.getCardValue("milestoneTaskSummaryStartedDP___" + idx);
			log.info("### servicetask16 - ANALISANDO LINHA " + idx + " summaryId=" + summaryTaskId + " started=" + startedVal + " process=" + hAPI.getCardValue("milestoneTaskSummaryProcessDP___" + idx));
			if (startedVal && String(startedVal).toLowerCase() === "true") {
				if (correctionMode) {
					var existingProcess = hAPI.getCardValue("milestoneTaskSummaryProcessDP___" + idx);
					var existingDocumentId = hAPI.getCardValue("milestoneTaskSummaryDocIdDP___" + idx);
					var executionActivity = getExecutionActivityByProcess(existingProcess);
					var updateDocumentId = existingDocumentId || (executionActivity ? executionActivity.documentid : "");
					if (!updateDocumentId) {
						throw "Nao foi possivel localizar documentId da atividade ja iniciada na linha " + idx + " processo " + existingProcess + ".";
					}
					for (var ub = 0; ub < baseConstraints.length; ub++) {
						constraints.push(baseConstraints[ub]);
					}
					addCurrentSummaryContext(constraints, idx);
					log.info("### servicetask16 - ATUALIZANDO CARD EXISTENTE LINHA " + idx + " PROCESSO " + existingProcess + " DOCUMENTID " + updateDocumentId + " CAMPOS=" + constraints.length);
					callUpdateCard(updateDocumentId, constraints);
					if (executionActivity) {
						setTaskMirrorValues(idx, existingProcess, updateDocumentId, executionActivity.STATUS, executionActivity.estadoProcesso);
					}
					continue;
				}
				log.info("### servicetask16 - PULANDO LINHA JA INICIADA: " + idx);
				continue;
			}

			if (summaryTaskId > 0 && summaryTaskId <= processedControlId) {
				log.info("### servicetask16 - PULANDO LINHA " + idx + " POR JA ESTAR ABAIXO/IGUAL AO CONTROLE milestoneTaskProcCtrlDP. summaryId=" + summaryTaskId + " controle=" + processedControlId);
				continue;
			}

			for (var b = 0; b < baseConstraints.length; b++) {
				constraints.push(baseConstraints[b]);
			}

			addCurrentSummaryContext(constraints, idx);

			log.info("### servicetask16 - INICIANDO PROCESSO execucaoFasesAtividades PARA LINHA " + idx + " summaryId=" + summaryTaskId + " controleAnterior=" + processedControlId);

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

			// Salvar processo/documento/status nos espelhos da tarefa.
			var openedActivity = getExecutionActivityByProcess(iProcess);
			var openedDocumentId = openedActivity ? openedActivity.documentid : "";
			var openedStatus = openedActivity ? openedActivity.STATUS : "";
			var openedEstado = openedActivity ? openedActivity.estadoProcesso : "";
			setTaskMirrorValues(idx, iProcess, openedDocumentId, openedStatus, openedEstado);
			log.info("### servicetask16 - SALVOU iProcess NA LINHA: " + idx + " = " + iProcess + " documentId=" + openedDocumentId);
			log.info("### servicetask16 - MARCOU STARTED NA LINHA: " + idx);
		}

		finalizeSync(summaryIndexes, maxProcessedId);
		return true;

	} catch (e) {

		log.error("### servicetask16 - ERRO: " + e);

		throw e;
	}
}
