const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadController() {
  const source = `${loadSource()}\ncontroller = executionActivityTiValidationController;`;
  const sandbox = { console };
  vm.runInNewContext(source, sandbox, { filename: getControllerPath() });
  return sandbox.controller;
}

function loadSource() {
  return fs.readFileSync(getControllerPath(), 'utf8');
}

function getControllerPath() {
  return path.resolve(__dirname, '../wcm/widget/wdGestaoProjetos/src/main/webapp/resources/js/controllers/execucao-fases/executionActivityTiValidationController.js');
}

test('ti approval requires checklist and agreement', () => {
  const controller = loadController();

  const incompleteChecklist = controller.validateDecisionInput({
    agreement: true,
    checklist: { agreement: true, items: [true, false] },
    requireChecklist: true,
    requireAgreement: true
  });
  assert.equal(incompleteChecklist.valid, false);
  assert.equal(incompleteChecklist.checklistOk, false);

  const missingAgreement = controller.validateDecisionInput({
    agreement: false,
    checklist: { agreement: false, items: [true, true] },
    requireChecklist: true,
    requireAgreement: true
  });
  assert.equal(missingAgreement.valid, false);
  assert.equal(missingAgreement.agreementOk, false);
});

test('ti correction and discontinuity do not require agreement', () => {
  const controller = loadController();

  const correction = controller.validateDecisionInput({
    agreement: false,
    description: 'Revisar apontamento',
    requireDescription: true
  });
  assert.equal(correction.valid, true);

  const discontinuity = controller.validateDecisionInput({
    agreement: false,
    category: 'tecnica',
    description: 'Inviabilidade técnica',
    requireCategory: true,
    requireDescription: true
  });
  assert.equal(discontinuity.valid, true);
});

test('ti parser reads requester history from requesterValidationDescEF', () => {
  const controller = loadController();
  const history = controller.parseRequesterValidationHistory({
    requesterValidationDecisionEF___1: 'correcao',
    requesterValidationCommentEF___1: 'Comentário',
    requesterValidationDescEF___1: 'Descrição curta',
    requesterValidationUserNameEF___1: 'Solicitante'
  });

  assert.equal(history.length, 1);
  assert.equal(history[0].description, 'Descrição curta');
});

test('ti textarea starts empty instead of reusing last scalar comment', () => {
  const source = loadSource();

  assert.match(source, /\$\('#ti-feedback-text'\)\.val\(''\)/);
  assert.doesNotMatch(source, /\$\('#ti-feedback-text'\)\.val\(card\.tiComment/);
});
