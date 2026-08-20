const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const servicePath = path.resolve(
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
  'services',
  'fluig.service.js'
);

function loadFluigService() {
  const code = fs.readFileSync(servicePath, 'utf8');
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    Promise,
    Date
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: servicePath });

  if (!sandbox.fluigService) {
    throw new Error('fluigService não foi carregado no sandbox de teste.');
  }

  return sandbox.fluigService;
}

function normalizePlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}

test('resolve contexto do processo com prioridade para desenvolvimento', async () => {
  const fluigService = loadFluigService();

  fluigService.getDatasetRows = async function (datasetId, options) {
    const documentId = options && options.filters ? options.filters.documentid : '';

    if (datasetId === 'dsGetSolicitacaoProjetos' && documentId === '101') {
      return [{
        documentid: '101',
        titulodoprojetoNS: 'Portal do Colaborador',
        prioridadeNS: 'Estratégico',
        estadoProcesso: '5 - Avaliar Projeto',
        codigoglpi: 'PRJ-2026-101'
      }];
    }

    if (datasetId === 'dsGetDesenvolvimentoProjetos' && documentId === '101') {
      return [{
        documentid: '101',
        titulodoprojetoNS: 'Portal do Colaborador',
        prioridadeNS: 'Estratégico',
        estadoProcesso: '4 - Rascunho',
        codigoglpi: 'PRJ-2026-101'
      }];
    }

    return [];
  };

  const context = await fluigService.resolveProjectProcessContext({
    documentId: '101',
    fields: ['documentid', 'titulodoprojetoNS', 'prioridadeNS', 'estadoProcesso', 'codigoglpi']
  });

  assert.equal(context.processType, 'desenvolvimento');
  assert.equal(context.datasetId, 'dsGetDesenvolvimentoProjetos');
  assert.equal(context.formName, 'FormDesenvolvimentoProjetos');
  assert.equal(context.activity, 4);
});

test('aciona projectPlanning para desenvolvimento nas activities 0 e 4', () => {
  const fluigService = loadFluigService();

  const draftAction = fluigService.getProjectProcessActionConfig({
    processType: 'desenvolvimento',
    estadoProcesso: '0 - Início'
  });
  const reviewAction = fluigService.getProjectProcessActionConfig({
    processType: 'desenvolvimento',
    estadoProcesso: '4 - Rascunho'
  });

  assert.deepEqual(normalizePlainObject(draftAction), {
    enabled: true,
    route: 'projectPlanning',
    label: 'Planejar Projeto'
  });
  assert.deepEqual(normalizePlainObject(reviewAction), {
    enabled: true,
    route: 'projectPlanning',
    label: 'Planejar Projeto'
  });
});

test('mantém solicitação em rascunho apontando para newSolicitation', () => {
  const fluigService = loadFluigService();

  const action = fluigService.getProjectProcessActionConfig({
    processType: 'solicitacao',
    estadoProcesso: '4 - Rascunho'
  });

  assert.deepEqual(normalizePlainObject(action), {
    enabled: true,
    route: 'newSolicitation',
    label: 'Continuar Rascunho'
  });
});

test('não mistura flows quando solicitação e desenvolvimento compartilham o mesmo número de activity', () => {
  const fluigService = loadFluigService();

  const solicitationAction = fluigService.getProjectProcessActionConfig({
    processType: 'solicitacao',
    estadoProcesso: '4 - Rascunho'
  });
  const developmentAction = fluigService.getProjectProcessActionConfig({
    processType: 'desenvolvimento',
    estadoProcesso: '4 - Rascunho'
  });
  const solicitationLabel = fluigService.getProjectProcessStateLabel({
    processType: 'solicitacao',
    estadoProcesso: '4 - Rascunho'
  });
  const developmentLabel = fluigService.getProjectProcessStateLabel({
    processType: 'desenvolvimento',
    estadoProcesso: '4 - Rascunho'
  });

  assert.deepEqual(normalizePlainObject(solicitationAction), {
    enabled: true,
    route: 'newSolicitation',
    label: 'Continuar Rascunho'
  });
  assert.deepEqual(normalizePlainObject(developmentAction), {
    enabled: true,
    route: 'projectPlanning',
    label: 'Planejar Projeto'
  });
  assert.equal(solicitationLabel, 'Rascunho da Nova Solicitação');
  assert.equal(developmentLabel, 'Planejamento do Projeto');
});
