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
  'desenvolvimento-projetos',
  'dp-projectPlanningController.js'
);

function loadController() {
  const code = fs.readFileSync(controllerPath, 'utf8');
  const sandbox = {
    console,
    Map,
    Set,
    Date
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: controllerPath });

  if (!sandbox.projectPlanningController) {
    throw new Error('projectPlanningController não foi carregado no sandbox de teste.');
  }

  return sandbox.projectPlanningController;
}

function normalizePlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}

test('computeTeamAllocationFromWbsPayload agrupa esforço e calcula dedicação', () => {
  const controller = loadController();

  const allocation = controller.computeTeamAllocationFromWbsPayload({
    phases: [
      {
        name: 'Fase 1',
        responsible: 'Ana Costa',
        effortHours: 10,
        tasks: []
      },
      {
        name: 'Fase 2',
        responsible: 'Ana Costa',
        effortHours: 0,
        tasks: [
          { name: 'T1', responsible: 'Carlos Silva', effortHours: 5 },
          { name: 'T2', responsible: 'TechPartners', effortHours: 20 }
        ]
      }
    ]
  });

  assert.deepEqual(normalizePlainObject(allocation), [
    { member: 'TechPartners', profile: 'Fornecedor', dedication: 100 },
    { member: 'Ana Costa', profile: 'TI', dedication: 50 },
    { member: 'Carlos Silva', profile: 'TI', dedication: 25 }
  ]);
});

test('syncRaciMatrixWithWbsPhasesData preserva RACI existente e sincroniza R padrão com removidos', () => {
  const controller = loadController();

  const phasesBase = [
    { phaseName: 'Fase A', responsibles: ['Ana Costa', 'Carlos Silva'] },
    { phaseName: 'Fase B', responsibles: ['TechPartners'] }
  ];

  const existingRows = [
    {
      phase: 'Fase A',
      r: ['Ana Costa'],
      a: ['PMO Corporativo'],
      c: [],
      i: []
    }
  ];

  const removed = new Map([
    [controller.getRaciPhaseKey('Fase A'), new Set(['Carlos Silva'])],
    [controller.getRaciPhaseKey('Fase X (removida)'), new Set(['Alguém'])]
  ]);

  const result = controller.syncRaciMatrixWithWbsPhasesData(phasesBase, existingRows, removed);

  assert.deepEqual(normalizePlainObject(result.rows), [
    {
      phase: 'Fase A',
      r: ['Ana Costa'],
      a: ['PMO Corporativo'],
      c: [],
      i: []
    },
    {
      phase: 'Fase B',
      r: ['TechPartners'],
      a: [],
      c: [],
      i: []
    }
  ]);

  // removed map só deve conter fases ativas
  assert.equal(result.removedByPhase.has(controller.getRaciPhaseKey('Fase A')), true);
  assert.equal(result.removedByPhase.has(controller.getRaciPhaseKey('Fase X (removida)')), false);
});
