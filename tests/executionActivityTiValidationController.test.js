const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const controllerPath = path.join(
  __dirname,
  '..',
  'wcm',
  'widget',
  'wdGestaoProjetos',
  'src',
  'main',
  'webapp',
  'resources',
  'js',
  'controllers',
  'execucao-fases',
  'executionActivityTiValidationController.js'
);

function loadController() {
  const code = fs.readFileSync(controllerPath, 'utf8');
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    window: {},
    document: {
      getElementById() {
        return null;
      }
    },
    WCMAPI: {
      getUserCode() {
        return 'ti-001';
      },
      getUser() {
        return 'Analista TI';
      }
    }
  };
  vm.createContext(sandbox);
  return vm.runInContext(`${code}\n;executionActivityTiValidationController;`, sandbox);
}

function fieldsToObject(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = field.value;
    return acc;
  }, {});
}

test('parseRequesterValidationHistory preserva ordem cronologica do solicitante', () => {
  const controller = loadController();
  const history = controller.parseRequesterValidationHistory({
    requesterValidationDecisionEF___1: 'correcao',
    requesterValidationCommentEF___1: 'Ajustar evidencia',
    requesterValidationCreatedAtEF___1: '2026-05-20T12:00:00.000Z',
    requesterValidationDecisionEF___2: 'validado',
    requesterValidationCommentEF___2: 'Aprovado',
    requesterValidationCreatedAtEF___2: '2026-05-20T15:00:00.000Z'
  });

  assert.deepEqual(history.map((entry) => entry.decision), ['correcao', 'validado']);
  assert.deepEqual(history.map((entry) => entry.rowIndex), [1, 2]);
});

test('parseTiValidationHistory normaliza JSON da tabela pai-filho', () => {
  const controller = loadController();
  const history = controller.parseTiValidationHistory({
    tblTiValidationHistoryEF: JSON.stringify([
      {
        tiValidationIdEF: 'ti-hist-1',
        tiValidationDecisionEF: 'devolver_correcao',
        tiValidationCommentEF: 'Revisar dado tecnico',
        tiValidationUserNameEF: 'Analista',
        tiValidationCreatedAtEF: '2026-05-21T10:00:00.000Z'
      }
    ])
  });

  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'ti-hist-1');
  assert.equal(history[0].decision, 'devolver_correcao');
  assert.equal(history[0].comment, 'Revisar dado tecnico');
});

test('parseTiValidationHistory normaliza campos indexados do Fluig', () => {
  const controller = loadController();
  const history = controller.parseTiValidationHistory({
    tiValidationIdEF___3: 'ti-hist-3',
    tiValidationDecisionEF___3: 'validado',
    tiValidationCommentEF___3: 'Ok tecnico',
    tiValidationUserNameEF___3: 'Analista',
    tiValidationCreatedAtEF___3: '2026-05-21T11:00:00.000Z'
  });

  assert.equal(history.length, 1);
  assert.equal(history[0].rowIndex, 3);
  assert.equal(history[0].decision, 'validado');
  assert.equal(history[0].comment, 'Ok tecnico');
});

test('collectTiValidationTaskFields monta aprovacao com nova linha historica', () => {
  const controller = loadController();
  const fields = controller.collectTiValidationTaskFields({
    decision: 'validado',
    comment: 'Validado tecnicamente',
    checklist: { agreement: true, items: [true, true, true, true] },
    history: []
  });
  const output = fieldsToObject(fields);

  assert.equal(output.decisaoTiValidacaoAtividade, 'validado');
  assert.equal(output.validacaoTiComentarioAtividade, 'Validado tecnicamente');
  assert.equal(output.validacaoTiLiConcordoAtividade, 'true');
  assert.equal(output.tiValidationDecisionEF___1, 'validado');
  assert.equal(output.tiValidationCommentEF___1, 'Validado tecnicamente');
  assert.equal(output.tiValidationUserIdEF___1, 'ti-001');
  assert.equal(output.tiValidationUserNameEF___1, 'Analista TI');
});

test('collectTiValidationTaskFields usa proximo indice quando ha historico TI anterior', () => {
  const controller = loadController();
  const fields = controller.collectTiValidationTaskFields({
    decision: 'devolver_correcao',
    comment: 'Parecer geral',
    description: 'Corrigir evidencia tecnica',
    checklist: { agreement: false, items: [false, false, false, false] },
    history: [{ rowIndex: 2, decision: 'devolver_correcao' }]
  });
  const output = fieldsToObject(fields);

  assert.equal(output.decisaoTiValidacaoAtividade, 'devolver_correcao');
  assert.equal(output.validacaoTiDescricaoAtividade, 'Corrigir evidencia tecnica');
  assert.equal(output.tiValidationDecisionEF___3, 'devolver_correcao');
  assert.equal(output.tiValidationDescriptionEF___3, 'Corrigir evidencia tecnica');
});

test('collectTiValidationTaskFields monta nao continuidade com categoria', () => {
  const controller = loadController();
  const fields = controller.collectTiValidationTaskFields({
    decision: 'nao_continuidade',
    comment: 'Nao seguir',
    description: 'Inviavel tecnicamente',
    category: 'tecnica',
    checklist: { agreement: false, items: [false, false, false, false] },
    history: []
  });
  const output = fieldsToObject(fields);

  assert.equal(output.decisaoTiValidacaoAtividade, 'nao_continuidade');
  assert.equal(output.validacaoTiCategoriaAtividade, 'tecnica');
  assert.equal(output.tiValidationCategoryEF___1, 'tecnica');
});

test('validateDecisionInput exige checklist completo e aceite para aprovacao', () => {
  const controller = loadController();
  const checklistResult = controller.validateDecisionInput({
    decision: 'validado',
    agreement: true,
    checklist: { agreement: true, items: [true, false, true, true] },
    requireChecklist: true,
    requireAgreement: true
  });
  const agreementResult = controller.validateDecisionInput({
    decision: 'validado',
    agreement: false,
    checklist: { agreement: false, items: [true, true, true, true] },
    requireChecklist: true,
    requireAgreement: true
  });

  assert.equal(checklistResult.valid, false);
  assert.equal(checklistResult.checklistOk, false);
  assert.equal(agreementResult.valid, false);
  assert.equal(agreementResult.agreementOk, false);
});

test('getMovementTaskData usa gateway 34 da validacao TI', () => {
  const controller = loadController();
  controller._state.processInstanceId = '123';
  controller._state.documentId = '456';
  const taskData = controller.getMovementTaskData('comentario');

  assert.equal(taskData.id, '123');
  assert.equal(taskData.documentId, '456');
  assert.equal(taskData.numState, 34);
  assert.equal(taskData.datasetName, 'formExecucaoAtividade');
});
