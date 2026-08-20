const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const controllerPath = path.resolve(
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
  'executionActivityWaitingController.js'
);

function loadController() {
  const code = fs.readFileSync(controllerPath, 'utf8');
  const sandbox = {
    console,
    window: {},
    setTimeout,
    clearTimeout
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: controllerPath });

  if (!sandbox.window.executionActivityWaitingController) {
    throw new Error('executionActivityWaitingController nao foi carregado no sandbox de teste.');
  }

  return sandbox.window.executionActivityWaitingController;
}

function normalizePlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}

test('normalizeCard usa somente campos diretos do card de execucao', () => {
  const controller = loadController();

  const card = controller.normalizeCard({
    cardId: '456',
    milestoneTaskSummaryTextDP: 'Configurar ambiente',
    milestoneTaskSummaryDueDateDP: '2026-05-20',
    milestoneTaskSummaryPhaseDP: 'Implantacao',
    milestoneTaskSummaryMarcoDP: 'Go live',
    milestoneTaskSummaryProcessDP: '123',
    codigoglpi: 'PRJ-001',
    titulodoprojetoNS: 'Portal Interno',
    areaUnidadeNS: 'TI',
    patrocinadorNS: 'Maria Souza',
    prioridadeNS: 'Alta',
    solicitanteNomeNS: 'Joao Silva',
    statusIntegracaoGLPIAtividade: 'Integrado',
    mensagemErroGLPIAtividade: '',
    idGLPIAtividade: '987',
    responsibleFromWbs: 'Nao deve aparecer'
  });

  assert.deepEqual(normalizePlainObject(card), {
    documentId: '456',
    activity: 'Configurar ambiente',
    dueDate: '2026-05-20',
    phase: 'Implantacao',
    milestone: 'Go live',
    parentProcess: '123',
    projectCode: 'PRJ-001',
    projectTitle: 'Portal Interno',
    projectArea: 'TI',
    projectSponsor: 'Maria Souza',
    projectPriority: 'Alta',
    requesterName: 'Joao Silva',
    glpiStatus: 'Integrado',
    glpiError: '',
    glpiActivityId: '987'
  });
});

test('formatDate preserva data brasileira e formata ISO simples', () => {
  const controller = loadController();

  assert.equal(controller.formatDate('2026-05-20'), '20/05/2026');
  assert.equal(controller.formatDate('20/05/2026'), '20/05/2026');
  assert.equal(controller.formatDate(''), '');
});

test('resolveContextIds falha quando rota nao recebe documentId nem processInstanceId', async () => {
  const controller = loadController();
  controller._state = {
    documentId: null,
    processInstanceId: null
  };

  await assert.rejects(
    () => controller.resolveContextIds(),
    /Informe documentId ou processInstanceId/
  );
});
