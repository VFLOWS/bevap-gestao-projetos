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
  'executionActivityRequesterValidationController.js'
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
        return 'user-001';
      },
      getUser() {
        return 'Solicitante Teste';
      }
    }
  };
  vm.createContext(sandbox);
  return vm.runInContext(`${code}\n;executionActivityRequesterValidationController;`, sandbox);
}

function fieldsToObject(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = field.value;
    return acc;
  }, {});
}

test('parseRequesterValidationHistory normaliza linhas JSON da tabela pai-filho', () => {
  const controller = loadController();
  const history = controller.parseRequesterValidationHistory({
    tblRequesterValidationHistoryEF: JSON.stringify([
      {
        requesterValidationIdEF: 'hist-1',
        requesterValidationDecisionEF: 'correcao',
        requesterValidationCommentEF: 'Ajustar evidencia',
        requesterValidationUserNameEF: 'Maria',
        requesterValidationCreatedAtEF: '2026-05-20T12:00:00.000Z'
      }
    ])
  });

  assert.equal(history.length, 1);
  assert.equal(history[0].rowIndex, 1);
  assert.equal(history[0].id, 'hist-1');
  assert.equal(history[0].decision, 'correcao');
  assert.equal(history[0].comment, 'Ajustar evidencia');
  assert.equal(history[0].userName, 'Maria');
});

test('parseRequesterValidationHistory normaliza campos indexados do Fluig', () => {
  const controller = loadController();
  const history = controller.parseRequesterValidationHistory({
    requesterValidationIdEF___2: 'hist-2',
    requesterValidationDecisionEF___2: 'validado',
    requesterValidationCommentEF___2: 'Ok',
    requesterValidationUserNameEF___2: 'Joao',
    requesterValidationCreatedAtEF___2: '2026-05-20T13:00:00.000Z'
  });

  assert.equal(history.length, 1);
  assert.equal(history[0].rowIndex, 2);
  assert.equal(history[0].decision, 'validado');
  assert.equal(history[0].comment, 'Ok');
});

test('collectValidationTaskFields cria nova linha no proximo indice disponivel', () => {
  const controller = loadController();
  const fields = controller.collectValidationTaskFields({
    decision: 'validado',
    comment: 'Aprovado',
    description: '',
    category: '',
    checklist: { agreement: true, items: [true, true, true, true] },
    history: [{ rowIndex: 1, decision: 'correcao' }]
  });
  const output = fieldsToObject(fields);

  assert.equal(output.validacaoSolicitante, 'validado');
  assert.equal(output.validacaoSolicitanteComentario, 'Aprovado');
  assert.equal(output.validacaoSolicitanteLiConcordo, 'true');
  assert.equal(output.requesterValidationDecisionEF___2, 'validado');
  assert.equal(output.requesterValidationCommentEF___2, 'Aprovado');
  assert.equal(output.requesterValidationUserIdEF___2, 'user-001');
  assert.equal(output.requesterValidationUserNameEF___2, 'Solicitante Teste');
  assert.ok(!Object.prototype.hasOwnProperty.call(output, 'validacaoSolicitanteHistJson'));
});

test('aprovacao de primeira gera uma unica linha historica', () => {
  const controller = loadController();
  const fields = controller.collectValidationTaskFields({
    decision: 'validado',
    comment: 'Concordo com a entrega',
    checklist: { agreement: true, items: [true, true, true, true] },
    history: []
  });
  const output = fieldsToObject(fields);

  assert.equal(output.requesterValidationDecisionEF___1, 'validado');
  assert.equal(output.requesterValidationCommentEF___1, 'Concordo com a entrega');
  assert.equal(Object.keys(output).filter((field) => field.startsWith('requesterValidationDecisionEF___')).length, 1);
});

test('correcao seguida de aprovacao preserva duas entradas em ordem cronologica', () => {
  const controller = loadController();
  const correctionCard = {
    requesterValidationIdEF___1: 'hist-1',
    requesterValidationDecisionEF___1: 'correcao',
    requesterValidationCommentEF___1: 'Corrigir evidencias',
    requesterValidationCreatedAtEF___1: '2026-05-20T12:00:00.000Z'
  };
  const existingHistory = controller.parseRequesterValidationHistory(correctionCard);
  const approvalFields = controller.collectValidationTaskFields({
    decision: 'validado',
    comment: 'Agora aprovado',
    checklist: { agreement: true, items: [true, true, true, true] },
    history: existingHistory
  });
  const combinedCard = { ...correctionCard, ...fieldsToObject(approvalFields) };
  const finalHistory = controller.parseRequesterValidationHistory(combinedCard);

  assert.deepEqual(finalHistory.map((entry) => entry.decision), ['correcao', 'validado']);
  assert.equal(finalHistory[0].comment, 'Corrigir evidencias');
  assert.equal(finalHistory[1].comment, 'Agora aprovado');
});

test('validateDecisionInput exige aceite do solicitante antes de movimentar', () => {
  const controller = loadController();
  const result = controller.validateDecisionInput({
    agreement: false,
    description: '',
    category: ''
  });

  assert.equal(result.valid, false);
  assert.equal(result.agreementOk, false);
});

test('validacao do solicitante segue para gateway 25', () => {
  const controller = loadController();

  assert.equal(controller._nextState, 25);
});
