(function () {
  if (typeof window === 'undefined' || typeof window.$ === 'undefined') return;

  const KEY = 'gpUiComponents';
  const $doc = $(document);

  function getUiRegistry() {
    const ui = $doc.data(KEY) || {};
    $doc.data(KEY, ui);
    return ui;
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

  function parseAttachments(value) {
    if (Array.isArray(value)) return value;

    const text = asText(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function getAttachmentIconClass(fileName) {
    const extension = String(fileName || '').split('.').pop().toLowerCase();

    if (extension === 'pdf') return 'fa-file-pdf text-red-500';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(extension) >= 0) return 'fa-file-image text-blue-500';
    if (['xls', 'xlsx', 'csv'].indexOf(extension) >= 0) return 'fa-file-excel text-green-600';
    if (['doc', 'docx'].indexOf(extension) >= 0) return 'fa-file-word text-blue-600';
    return 'fa-file text-gray-500';
  }

  // `anexosNS.fileSize` atualmente vem em MB (float). Ex: 0.076...
  function formatAttachmentSizeFromMb(fileSizeMb) {
    const sizeMb = Number(fileSizeMb);
    if (!isFinite(sizeMb) || sizeMb <= 0) return '—';
    if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(1)} KB`;
    if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
    return `${(sizeMb / 1024).toFixed(1)} GB`;
  }

  async function resolveAttachmentUrls(documentIds) {
    const uniqueIds = Array.from(new Set((Array.isArray(documentIds) ? documentIds : [])
      .map((id) => asText(id))
      .filter(Boolean)));

    const result = {};
    if (!uniqueIds.length) return result;

    if (typeof fluigService === 'undefined' || !fluigService.getDatasetRows) {
      return result;
    }

    await Promise.all(uniqueIds.map(async (docId) => {
      try {
        const rows = await fluigService.getDatasetRows('dsGetAnexoURL', {
          fields: ['documentId', 'downloadURL'],
          filters: { documentId: docId }
        });

        const row = rows && rows.length ? rows[0] : null;
        const url = asText(row && (row.downloadURL || row.downloadUrl || row.DOWNLOADURL));
        if (url) {
          result[docId] = url;
        }
      } catch (error) {
        // Silencioso: se falhar para um documento, mantém item sem URL.
      }
    }));

    return result;
  }

  const attachments = {
    /**
     * Renderiza a lista de anexos no mesmo formato do protótipo.
     *
     * Uso (com valor pronto):
     *   ui.attachments.render(targetEl, { value: row.anexosNS })
     *
     * Uso (buscando do dataset):
     *   ui.attachments.render(targetEl, { documentId, fieldName: 'anexosNS' })
     */
    render: async function (targetEl, options = {}) {
      const $target = $(targetEl);
      if (!$target.length) return;

      const variantFromAttr = asText($target.attr('data-variant'));
      const variant = asText(options.variant) || variantFromAttr;

      const fieldName = asText(options.fieldName);
      const datasetId = asText(options.datasetId);
      const documentId = asText(options.documentId);

      const emptyHtml = asText(options.emptyHtml)
        || '<div class="py-2 text-sm text-gray-500">—</div>';

      $target.html('<div class="py-2 text-sm text-gray-500">Carregando anexos...</div>');

      let rawValue = options.value;

      if ((rawValue === null || rawValue === undefined || rawValue === '') && documentId) {
        try {
          const rows = await fluigService.getDatasetRows(datasetId, {
            fields: [fieldName],
            filters: {
              documentid: documentId
            }
          });

          const row = rows && rows.length ? rows[0] : null;
          rawValue = row ? row[fieldName] : rawValue;
        } catch (error) {
          // Se falhar o dataset, só exibe vazio.
          $target.html(emptyHtml);
          return;
        }
      }

      const items = parseAttachments(rawValue)
        .map((item) => {
          const docId = asText(item && (item.documentId || item.documentID || item.id));
          return {
            documentId: docId,
            fileName: asText(item && (item.fileName || item.filename || item.name)),
            fileSize: item && item.fileSize !== undefined ? item.fileSize : (item && item.size)
          };
        })
        .filter((item) => item.documentId && item.fileName);

      if (!items.length) {
        $target.html(emptyHtml);
        return;
      }

      const urlsById = await resolveAttachmentUrls(items.map((a) => a.documentId));

      const isPrototypeCards = variant === 'prototype-cards';

      const rowsHtml = items.map((att) => {
        const safeName = escapeHtml(att.fileName);
        const sizeLabel = escapeHtml(formatAttachmentSizeFromMb(att.fileSize));
        const iconClass = escapeHtml(getAttachmentIconClass(att.fileName));

        const url = asText(urlsById[att.documentId]);
        const safeUrl = escapeHtml(url);
        const disabled = !url;

        if (isPrototypeCards) {
          const viewNode = disabled
            ? `<button disabled aria-disabled="true" class="text-bevap-green opacity-50 cursor-not-allowed" title="Visualizar">
                <i class="fa-solid fa-eye"></i>
              </button>`
            : `<a href="${safeUrl}" target="_blank" rel="noopener" class="text-bevap-green hover:text-green-700" title="Visualizar">
                <i class="fa-solid fa-eye"></i>
              </a>`;

          const downloadNode = disabled
            ? `<button disabled aria-disabled="true" class="text-bevap-navy opacity-50 cursor-not-allowed" title="Baixar">
                <i class="fa-solid fa-download"></i>
              </button>`
            : `<a href="${safeUrl}" download="${safeName}" class="text-bevap-navy hover:text-blue-700" title="Baixar">
                <i class="fa-solid fa-download"></i>
              </a>`;

          return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center min-w-0">
                <i class="fa-solid ${iconClass} text-xl mr-3"></i>
                <div class="min-w-0">
                  <div class="font-medium text-sm text-gray-900 truncate">${safeName}</div>
                  <div class="text-xs text-gray-500">${sizeLabel}</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                ${viewNode}
                ${downloadNode}
              </div>
            </div>
          `;
        }

        const viewNode = disabled
          ? `<button disabled aria-disabled="true" class="px-3 py-2 text-sm font-medium text-bevap-green border border-bevap-green rounded-lg opacity-50 cursor-not-allowed" title="Visualizar">
              <i class="fa-solid fa-eye"></i>
            </button>`
          : `<a href="${safeUrl}" target="_blank" rel="noopener" class="px-3 py-2 text-sm font-medium text-bevap-green border border-bevap-green rounded-lg hover:bg-green-50 transition-colors" title="Visualizar">
              <i class="fa-solid fa-eye"></i>
            </a>`;

        const downloadNode = disabled
          ? `<button disabled aria-disabled="true" class="px-3 py-2 text-sm font-medium text-bevap-navy border border-bevap-navy rounded-lg opacity-50 cursor-not-allowed" title="Baixar">
              <i class="fa-solid fa-download"></i>
            </button>`
          : `<a href="${safeUrl}" download="${safeName}" class="px-3 py-2 text-sm font-medium text-bevap-navy border border-bevap-navy rounded-lg hover:bg-gray-50 transition-colors" title="Baixar">
              <i class="fa-solid fa-download"></i>
            </a>`;

        return `
          <div class="py-3 flex items-center justify-between">
            <div class="flex items-center min-w-0">
              <i class="fa-solid ${iconClass} text-xl mr-3"></i>
              <div class="min-w-0">
                <div class="font-medium text-sm text-gray-900 truncate">${safeName}</div>
                <div class="text-xs text-gray-500">${sizeLabel}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${viewNode}
              ${downloadNode}
            </div>
          </div>
        `;
      }).join('');

      $target.html(isPrototypeCards ? `<div class="space-y-2">${rowsHtml}</div>` : rowsHtml);
    }
  };

  const ui = getUiRegistry();
  ui.attachments = attachments;
})();
