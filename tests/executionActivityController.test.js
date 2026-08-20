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
  'executionActivityController.js'
);

function loadController() {
  const code = fs.readFileSync(controllerPath, 'utf8');
  const sandbox = {
    console,
    window: {},
    setTimeout,
    clearTimeout,
    Date
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: controllerPath });

  if (!sandbox.window.executionActivityController) {
    throw new Error('executionActivityController nao foi carregado no sandbox de teste.');
  }

  return sandbox.window.executionActivityController;
}

function normalizePlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}

test('parseExecutionEntries normaliza tabela pai-filho preservando indices', () => {
  const controller = loadController();

  const entries = controller.parseExecutionEntries({
    executionEntryIdEF___3: 'entry-3',
    executionEntryStatusEF___3: 'active',
    executionEntryDateEF___3: '2026-05-15',
    executionEntryStartEF___3: '08:00',
    executionEntryEndEF___3: '10:30',
    executionEntryDurationEF___3: '150',
    executionEntryCommentEF___3: 'Mapeamento inicial',
    executionEntryAuthorIdEF___3: 'u1',
    executionEntryAuthorNameEF___3: 'Carlos Silva',
    executionEntryCreatedAtEF___3: '2026-05-15T11:00:00.000Z',
    executionEntryUpdatedAtEF___3: '2026-05-15T11:10:00.000Z'
  });

  assert.deepEqual(normalizePlainObject(entries), [{
    id: 'entry-3',
    rowIndex: 3,
    status: 'active',
    date: '2026-05-15',
    start: '08:00',
    end: '10:30',
    durationMinutes: 150,
    comment: 'Mapeamento inicial',
    authorId: 'u1',
    authorName: 'Carlos Silva',
    createdAt: '2026-05-15T11:00:00.000Z',
    updatedAt: '2026-05-15T11:10:00.000Z',
    persisted: true
  }]);
});

test('sumActiveDurationMinutes ignora apontamentos deletados', () => {
  const controller = loadController();

  const total = controller.sumActiveDurationMinutes([
    { status: 'active', durationMinutes: 60 },
    { status: 'deleted', durationMinutes: 120 },
    { status: 'active', durationMinutes: 30 }
  ]);

  assert.equal(total, 90);
});

test('collectExecutionTaskFields mantem indice existente e atribui novo sem duplicar', () => {
  const controller = loadController();
  const entries = [
    {
      id: 'existing',
      rowIndex: 4,
      status: 'active',
      date: '2026-05-15',
      start: '08:00',
      end: '09:00',
      durationMinutes: 60,
      comment: 'Existente',
      authorId: 'u1',
      authorName: 'Ana',
      createdAt: '2026-05-15T10:00:00.000Z',
      updatedAt: '2026-05-15T10:00:00.000Z'
    },
    {
      id: 'new',
      rowIndex: null,
      status: 'deleted',
      date: '2026-05-16',
      start: '10:00',
      end: '11:00',
      durationMinutes: 60,
      comment: 'Novo deletado',
      authorId: 'u2',
      authorName: 'Bruno',
      createdAt: '2026-05-16T10:00:00.000Z',
      updatedAt: '2026-05-16T11:00:00.000Z'
    }
  ];

  const fields = controller.collectExecutionTaskFields(entries);
  const byName = Object.fromEntries(fields.map((field) => [field.name, field.value]));

  assert.equal(byName.executionEntryIdEF___4, 'existing');
  assert.equal(byName.executionEntryIdEF___5, 'new');
  assert.equal(byName.executionEntryStatusEF___5, 'deleted');
  assert.equal(entries[1].rowIndex, 5);
});

test('validateEntryInput rejeita horario final anterior ao inicial', () => {
  const controller = loadController();

  const result = controller.validateEntryInput({
    date: '2026-05-15',
    start: '11:00',
    end: '10:00',
    comment: 'Teste'
  });

  assert.equal(result.valid, false);
  assert.match(result.message, /final deve ser maior/);
});

test('resolveContextIds falha sem documentId e sem processInstanceId', async () => {
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
