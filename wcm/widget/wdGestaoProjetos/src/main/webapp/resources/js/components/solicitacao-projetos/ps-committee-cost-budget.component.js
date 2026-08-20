(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpApprovalTabComponents';
  const DATASET_ID = 'dsGetSolicitacaoProjetos';
  const FIELDS = [
    'valortotalTIPC',
    'capexGCC',
    'opexGCC',
    'tblNaturezaCustoCapexGCC.centroCustoCapexGCC',
    'tblNaturezaCustoCapexGCC.contaContabilCapexGCC',
    'tblNaturezaCustoCapexGCC.porcentagemCapexGCC',
    'tblNaturezaCustoCapexGCC.saldoCapexGCC',
    'tblNaturezaCustoCapexGCC.saldoAposCompromissoCapexGCC',
    'tblNaturezaCustoOpexGCC.centroCustoOpexGCC',
    'tblNaturezaCustoOpexGCC.contaContabilOpexGCC',
    'tblNaturezaCustoOpexGCC.porcentagemOpexGCC',
    'tblNaturezaCustoOpexGCC.saldoOpexGCC',
    'tblNaturezaCustoOpexGCC.saldoAposCompromissoOpexGCC'
  ];

  function getRegistry() {
    const $doc = $(document);
    const registry = $doc.data(KEY) || {};
    $doc.data(KEY, registry);
    return registry;
  }

  function asText(value) {
    if (value === null || value === undefined || value === 'null') return '';
    return String(value).trim();
  }

  function escapeHtml(value) {
    return asText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseTableJson(value) {
    const text = asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function parsePercent(value) {
    const text = asText(value).replace('%', '').replace(',', '.');
    const parsed = Number(text);
    if (!isFinite(parsed)) return 0;
    return Math.max(0, Math.min(100, parsed));
  }

  function parseMoney(value) {
    const text = asText(value);
    if (!text) return null;

    const normalized = text
      .replace(/\s/g, '')
      .replace(/[A-Za-z$€£R]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');

    const parsed = Number(normalized);
    return isFinite(parsed) ? parsed : null;
  }

  function formatMoney(value) {
    const amount = Number(value);
    const safe = isFinite(amount) ? amount : 0;

    try {
      return safe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (error) {
      return `R$ ${safe.toFixed(2).replace('.', ',')}`;
    }
  }

  function formatPercent(value) {
    const safe = Math.max(0, Number(value) || 0);
    const fixed = Number(safe.toFixed(2));
    return `${String(fixed).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}%`;
  }

  function parseAllocationRows(value, kind) {
    return parseTableJson(value).map((item) => {
      if (kind === 'capex') {
        return {
          center: asText(item && item.centroCustoCapexGCC),
          account: asText(item && item.contaContabilCapexGCC),
          committed: asText(item && item.porcentagemCapexGCC),
          balance: asText(item && item.saldoCapexGCC),
          balanceAfter: asText(item && item.saldoAposCompromissoCapexGCC)
        };
      }

      return {
        center: asText(item && item.centroCustoOpexGCC),
        account: asText(item && item.contaContabilOpexGCC),
        committed: asText(item && item.porcentagemOpexGCC),
        balance: asText(item && item.saldoOpexGCC),
        balanceAfter: asText(item && item.saldoAposCompromissoOpexGCC)
      };
    }).filter((row) => row.center || row.account || row.committed || row.balance || row.balanceAfter);
  }

  function getCommittedValue(row, kindTotal) {
    const before = parseMoney(row && row.balance);
    const after = parseMoney(row && row.balanceAfter);
    if (before !== null && after !== null) {
      return Math.max(0, before - after);
    }

    const direct = parseMoney(row && row.committed);
    if (direct !== null) {
      return Math.max(0, direct);
    }

    const pct = parsePercent(row && row.committed);
    if (pct > 0 && isFinite(kindTotal) && kindTotal > 0) {
      return kindTotal * (pct / 100);
    }

    return 0;
  }

  function sumCommittedValues(rows, kindTotal) {
    return (Array.isArray(rows) ? rows : []).reduce((sum, row) => {
      return sum + getCommittedValue(row, kindTotal);
    }, 0);
  }

  function aggregateCenters(capexRows, opexRows, capexAmount, opexAmount) {
    const map = {};

    function addRows(rows, kindTotal, kindName) {
      rows.forEach((row, index) => {
        const label = asText(row.center) || `${kindName} ${index + 1}`;
        const value = getCommittedValue(row, kindTotal);
        if (value <= 0) return;

        if (!map[label]) {
          map[label] = 0;
        }
        map[label] += value;
      });
    }

    addRows(capexRows, capexAmount, 'CAPEX');
    addRows(opexRows, opexAmount, 'OPEX');

    return Object.keys(map)
      .map((name) => ({ name, value: map[name] }))
      .sort((a, b) => b.value - a.value);
  }

  async function loadRow(documentId) {
    if (!documentId || typeof fluigService === 'undefined' || !fluigService.getDatasetRows) return null;

    const rows = await fluigService.getDatasetRows(DATASET_ID, {
      fields: FIELDS,
      filters: { documentid: documentId }
    });

    return rows && rows.length ? rows[0] : null;
  }

  function buildModel(row) {
    const totalAmount = parseMoney(row && row.valortotalTIPC) || 0;
    const capexPercentFromCard = parsePercent(row && row.capexGCC);
    const opexPercentFromCard = parsePercent(row && row.opexGCC);

    const capexRows = parseAllocationRows(
      row && (
        row.tblNaturezaCustoCapexGCC
        || row['tblNaturezaCustoCapexGCC']
        || row['tblNaturezaCustoCapexGCC.centroCustoCapexGCC']
      ),
      'capex'
    );
    const opexRows = parseAllocationRows(
      row && (
        row.tblNaturezaCustoOpexGCC
        || row['tblNaturezaCustoOpexGCC']
        || row['tblNaturezaCustoOpexGCC.centroCustoOpexGCC']
      ),
      'opex'
    );

    let capexAmount = totalAmount * (capexPercentFromCard / 100);
    let opexAmount = totalAmount * (opexPercentFromCard / 100);

    const capexRowsAmount = sumCommittedValues(capexRows, totalAmount);
    const opexRowsAmount = sumCommittedValues(opexRows, totalAmount);

    if (capexAmount <= 0 && capexRowsAmount > 0) capexAmount = capexRowsAmount;
    if (opexAmount <= 0 && opexRowsAmount > 0) opexAmount = opexRowsAmount;

    let capexPercent = capexPercentFromCard;
    let opexPercent = opexPercentFromCard;

    if (totalAmount > 0) {
      const shouldRecalculatePercent = (
        (capexPercent <= 0 && capexAmount > 0)
        || (opexPercent <= 0 && opexAmount > 0)
        || ((capexPercent + opexPercent) <= 0 && (capexAmount + opexAmount) > 0)
      );

      if (shouldRecalculatePercent) {
        capexPercent = (capexAmount / totalAmount) * 100;
        opexPercent = (opexAmount / totalAmount) * 100;
      }
    }

    const centers = aggregateCenters(capexRows, opexRows, capexAmount, opexAmount);

    return {
      totalAmount,
      capexPercent,
      opexPercent,
      capexAmount,
      opexAmount,
      centers
    };
  }

  function renderCentersTable(model) {
    const centers = Array.isArray(model.centers) ? model.centers : [];

    if (!centers.length) {
      return `
        <tr>
          <td colspan="4" class="px-4 py-4 text-sm text-gray-500 text-center">Nenhum centro de custo informado.</td>
        </tr>
      `;
    }

    return centers.map((item) => {
      const pct = model.totalAmount > 0 ? (item.value / model.totalAmount) * 100 : 0;
      return `
        <tr>
          <td class="px-4 py-3 text-bevap-navy">${escapeHtml(item.name)}</td>
          <td class="px-4 py-3 text-right font-semibold text-bevap-navy">${escapeHtml(formatMoney(item.value))}</td>
          <td class="px-4 py-3 text-center font-medium text-gray-800">${escapeHtml(formatPercent(pct))}</td>
          <td class="px-4 py-3 text-center">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-medium">Aprovada</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderHtml(model) {
    const capexWidth = Math.max(0, Math.min(100, model.capexPercent));
    const opexWidth = Math.max(0, Math.min(100, model.opexPercent));

    return `
      <div class="space-y-6">
        <h2 class="text-xl font-montserrat font-bold text-bevap-navy mb-6 flex items-center">
          <i class="fa-solid fa-dollar-sign mr-3 text-bevap-gold"></i>
          Analise de Custo &amp; Orcamento
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-gradient-to-r from-bevap-navy to-blue-900 text-white rounded-xl p-6 shadow-sm">
            <div class="text-sm font-semibold mb-3 flex items-center">
              <i class="fa-solid fa-calculator mr-2 text-bevap-gold"></i>
              Investimento Total
            </div>
            <div class="text-3xl font-montserrat font-bold">${escapeHtml(formatMoney(model.totalAmount))}</div>
            <div class="text-sm text-blue-100 mt-1">Valor aprovado pelo Gerente do Centro de Custo</div>
          </div>

          <div>
            <h3 class="text-base font-montserrat font-semibold text-bevap-navy mb-3">Distribuicao CAPEX/OPEX</h3>
            <div class="space-y-3">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-bevap-navy">CAPEX (${escapeHtml(formatPercent(model.capexPercent))})</span>
                  <span class="text-lg font-bold text-bevap-navy">${escapeHtml(formatMoney(model.capexAmount))}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-bevap-green h-2 rounded-full" style="width: ${capexWidth}%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-bevap-navy">OPEX (${escapeHtml(formatPercent(model.opexPercent))})</span>
                  <span class="text-lg font-bold text-bevap-navy">${escapeHtml(formatMoney(model.opexAmount))}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-500 h-2 rounded-full" style="width: ${opexWidth}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-montserrat font-semibold text-bevap-navy mb-3 flex items-center">
            <i class="fa-solid fa-building mr-2 text-bevap-gold"></i>
            Centros de Custo Envolvidos
          </h3>
          <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-gray-700">Centro de Custo</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-700">Valor</th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-700">% Total</th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-700">Alcada</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                ${renderCentersTable(model)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  async function render(options = {}) {
    const documentId = asText(options.documentId);
    if (!documentId) {
      return '<div class="text-sm text-gray-500">Selecione uma solicitacao para visualizar Custo &amp; Orcamento.</div>';
    }

    const baseRow = options.row || null;
    const hasGccFields = Boolean(
      baseRow && (
        Object.prototype.hasOwnProperty.call(baseRow, 'capexGCC') ||
        Object.prototype.hasOwnProperty.call(baseRow, 'tblNaturezaCustoCapexGCC') ||
        Object.prototype.hasOwnProperty.call(baseRow, 'tblNaturezaCustoOpexGCC') ||
        Object.prototype.hasOwnProperty.call(baseRow, 'tblNaturezaCustoCapexGCC.centroCustoCapexGCC') ||
        Object.prototype.hasOwnProperty.call(baseRow, 'tblNaturezaCustoOpexGCC.centroCustoOpexGCC')
      )
    );

    const row = hasGccFields ? baseRow : await loadRow(documentId);
    if (!row) {
      return '<div class="text-sm text-gray-500">Nao foi possivel carregar dados de Custo &amp; Orcamento.</div>';
    }

    return renderHtml(buildModel(row));
  }

  async function renderInto(targetEl, options = {}) {
    const $target = targetEl && targetEl.jquery ? targetEl : $(targetEl);
    if (!$target || !$target.length) {
      return render(options);
    }

    $target.html('<div class="text-sm text-gray-500">Carregando Custo &amp; Orcamento...</div>');

    try {
      const html = await render(options);
      $target.html(html);
      return html;
    } catch (error) {
      $target.html('<div class="text-sm text-red-600">Nao foi possivel carregar esta aba.</div>');
      return '';
    }
  }

  const registry = getRegistry();
  registry.committeeCostBudget = {
    render,
    renderInto
  };
})();
