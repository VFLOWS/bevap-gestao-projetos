const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadController() {
  const source = `${loadSource()}\ncontroller = executionActivityRequesterValidationController;`;
  const sandbox = { console };
  vm.runInNewContext(source, sandbox, { filename: getControllerPath() });
  return sandbox.controller;
}

function loadSource() {
  return fs.readFileSync(getControllerPath(), 'utf8');
}

function getControllerPath() {
  return path.resolve(__dirname, '../wcm/widget/wdGestaoProjetos/src/main/webapp/resources/js/controllers/execucao-fases/executionActivityRequesterValidationController.js');
}

test('requester approval requires agreement', () => {
  const controller = loadController();
  const result = controller.validateDecisionInput({
    agreement: false,
    requireAgreement: true
  });

  assert.equal(result.valid, false);
  assert.equal(result.agreementOk, false);
});

test('requester correction and discontinuity do not require agreement', () => {
  const controller = loadController();

  const correction = controller.validateDecisionInput({
    agreement: false,
    description: 'Ajustar evidência',
    requireDescription: true
  });
  assert.equal(correction.valid, true);

  const discontinuity = controller.validateDecisionInput({
    agreement: false,
    category: 'escopo',
    description: 'Fora do escopo atual',
    requireCategory: true,
    requireDescription: true
  });
  assert.equal(discontinuity.valid, true);
});

test('requester history uses requesterValidationDescEF field', () => {
  const controller = loadController();
  const fields = controller.collectValidationTaskFields({
    decision: 'validado',
    comment: 'Aprovado',
    description: 'Entrega aceita',
    checklist: { agreement: true, items: [true, true] },
    history: [{ rowIndex: 1, decision: 'correcao' }]
  });

  assert.ok(fields.some((field) => field.name === 'requesterValidationDescEF___2'));
  assert.ok(!fields.some((field) => field.name === 'requesterValidationDescriptionEF___2'));
});

test('requester textarea starts empty instead of reusing last scalar comment', () => {
  const source = loadSource();

  assert.match(source, /\$\('#requester-feedback-text'\)\.val\(''\)/);
  assert.doesNotMatch(source, /\$\('#requester-feedback-text'\)\.val\(card\.requesterComment/);
});
