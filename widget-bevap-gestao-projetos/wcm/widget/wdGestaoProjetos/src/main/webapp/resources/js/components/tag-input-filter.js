/**
 * Componente de filtro customizado que exibe itens selecionados como tags
 * e mostra uma lista suspensa com multiplas colunas para selecao.
 */
class TagInputFilter {
    constructor(selector, options) {
        this.selectedItems = new Map();
        this.isDisabled = false;
        this.isReady = false;
        this.container = document.querySelector(selector);
        this._boundDocumentClick = null;
        this._boundPortalPosition = null;
        if (!this.container) {
            console.error(`Container do filtro nao encontrado: ${selector}`);
            return;
        }

        this.options = {
            placeholder: 'Selecione...',
            data: [],
            labelField: 'label',
            valueField: 'value',
            getItemLabel: null,
            columns: [],
            singleSelection: false,
            portalDropdown: false,
            compact: false,
            clearUnselectedInputOnBlur: true,
            onItemAdded: () => {},
            onItemRemoved: () => {},
            ...options,
        };

        this.isReady = true;

        this._render();
        this._initListeners();
    }

    _render() {
        if (!this.isReady || !this.container) return;
        const wrapperPositionClass = this.options.portalDropdown ? 'w-full min-w-0' : 'relative w-full min-w-0';
        const dropdownMarkup = this.options.portalDropdown
            ? ''
            : '<div class="tag-input-dropdown absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 hidden max-h-72 overflow-hidden flex flex-col"></div>';
        const inputAreaClass = this.options.compact
            ? 'tag-input-area bg-white border border-gray-300 rounded-lg w-full h-[38px] min-h-[38px] px-3 py-1.5 flex items-center gap-2 cursor-text focus-within:ring-2 focus-within:ring-bevap-green focus-within:border-bevap-green overflow-hidden'
            : 'tag-input-area bg-white border-2 border-gray-200 rounded-xl w-full min-h-[45px] px-3 py-2 flex items-center gap-2 cursor-text focus-within:ring-2 focus-within:ring-bevap-green focus-within:border-bevap-green overflow-hidden';
        this.container.innerHTML = `
            <div class="tag-input-wrapper ${wrapperPositionClass}">
                <div class="${inputAreaClass}">
                    <input type="text" class="tag-input-search flex-grow min-w-0 p-1 text-sm outline-none bg-transparent" placeholder="${this.options.placeholder}">
                </div>
                ${dropdownMarkup}
            </div>
        `;

        this.wrapper = this.container.querySelector('.tag-input-wrapper');
        this.inputArea = this.container.querySelector('.tag-input-area');
        this.searchInput = this.container.querySelector('.tag-input-search');

        if (this.options.portalDropdown) {
            this.dropdown = document.createElement('div');
            this.dropdown.className = 'tag-input-dropdown fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] hidden overflow-hidden flex flex-col';
            document.body.appendChild(this.dropdown);
        } else {
            this.dropdown = this.container.querySelector('.tag-input-dropdown');
        }

        this.dropdownHeader = null;
        this.dropdownBody = null;
    }

    _initListeners() {
        if (!this.isReady || !this.inputArea || !this.searchInput) return;
        this.inputArea.addEventListener('click', () => !this.isDisabled && this.searchInput.focus());
        if (this.dropdown) {
            this.dropdown.addEventListener('mousedown', (event) => {
                const target = event.target && event.target.closest ? event.target : null;
                if (target && target.closest('[data-tag-option-index]')) {
                    event.preventDefault();
                }
            });
        }
        this.searchInput.addEventListener('focus', () => this.openDropdown());
        this.searchInput.addEventListener('keyup', () => this._filterList());
        this.searchInput.addEventListener('blur', () => {
            window.setTimeout(() => {
                if (!this.isReady) return;
                const activeElement = document.activeElement;
                const stillInside = activeElement && (
                    this.container.contains(activeElement)
                    || (this.dropdown && this.dropdown.contains(activeElement))
                );
                if (!stillInside) {
                    this.closeDropdown();
                    return;
                }
                this._clearPendingSearchText();
            }, 150);
        });
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && this.searchInput.value === '' && this.selectedItems.size > 0) {
                const lastItemValue = Array.from(this.selectedItems.keys()).pop();
                this._removeItem(lastItemValue);
            }
        });
        this._boundDocumentClick = (e) => {
            if (!this.container || !document.documentElement.contains(this.container)) {
                document.removeEventListener('click', this._boundDocumentClick);
                if (this.options.portalDropdown && this.dropdown && this.dropdown.parentNode) {
                    this.dropdown.parentNode.removeChild(this.dropdown);
                }
                if (this._boundPortalPosition) {
                    window.removeEventListener('scroll', this._boundPortalPosition, true);
                    window.removeEventListener('resize', this._boundPortalPosition);
                    this._boundPortalPosition = null;
                }
                this.isReady = false;
                this._boundDocumentClick = null;
                return;
            }
            if (!this.container.contains(e.target) && !(this.dropdown && this.dropdown.contains(e.target))) this.closeDropdown();
        };
        document.addEventListener('click', this._boundDocumentClick);
    }

    _positionDropdown() {
        if (!this.isReady || !this.dropdown || !this.options.portalDropdown || !this.wrapper) return;
        const rect = this.wrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const top = rect.bottom + 8;
        const availableHeight = Math.max(180, viewportHeight - top - 12);
        this.dropdown.style.left = `${Math.max(8, rect.left)}px`;
        this.dropdown.style.top = `${top}px`;
        this.dropdown.style.width = `${Math.max(240, rect.width)}px`;
        this.dropdown.style.maxHeight = `${Math.min(320, availableHeight)}px`;
    }

    _getItemValue(item) {
        if (!item) return '';
        const value = item[this.options.valueField];
        return value === null || value === undefined ? '' : String(value);
    }

    _getItemLabel(item) {
        if (!item) return '';

        if (typeof this.options.getItemLabel === 'function') {
            const customLabel = this.options.getItemLabel(item);
            return customLabel === null || customLabel === undefined ? '' : String(customLabel);
        }

        const rawLabel = item[this.options.labelField];
        return rawLabel === null || rawLabel === undefined ? '' : String(rawLabel);
    }

    _getFunctionCacheId(fn) {
        if (typeof WeakMap === 'undefined') return 'custom';
        const constructorRef = this.constructor;
        if (!constructorRef._functionCacheIds) {
            constructorRef._functionCacheIds = new WeakMap();
            constructorRef._nextFunctionCacheId = 1;
        }
        if (!constructorRef._functionCacheIds.has(fn)) {
            constructorRef._functionCacheIds.set(fn, constructorRef._nextFunctionCacheId++);
        }
        return constructorRef._functionCacheIds.get(fn);
    }

    _getPreparedDataSignature() {
        const columnsSignature = (this.options.columns || [])
            .map(col => `${col.field || ''}:${col.header || ''}:${col.width || ''}`)
            .join('|');
        const labelResolver = typeof this.options.getItemLabel === 'function'
            ? `custom:${this._getFunctionCacheId(this.options.getItemLabel)}`
            : `field:${this.options.labelField || ''}`;

        return [
            this.options.valueField || '',
            labelResolver,
            columnsSignature
        ].join('||');
    }

    _buildPreparedData(data) {
        return data.map((item) => {
            const itemValue = this._getItemValue(item);
            const itemLabel = this._getItemLabel(item);
            return {
                item,
                value: itemValue,
                label: itemLabel,
                lowerLabel: String(itemLabel || '').toLowerCase(),
                cells: (this.options.columns || []).map(col => {
                    return {
                        value: item && item[col.field] !== undefined && item[col.field] !== null ? String(item[col.field]) : '',
                        width: col.width || 'flex-1'
                    };
                })
            };
        });
    }

    _getPreparedData() {
        const data = Array.isArray(this.options.data) ? this.options.data : [];
        if (typeof WeakMap === 'undefined') {
            return this._buildPreparedData(data);
        }

        const constructorRef = this.constructor;
        if (!constructorRef._preparedDataCache) {
            constructorRef._preparedDataCache = new WeakMap();
        }

        let dataCache = constructorRef._preparedDataCache.get(data);
        if (!dataCache) {
            dataCache = {};
            constructorRef._preparedDataCache.set(data, dataCache);
        }

        const signature = this._getPreparedDataSignature();
        if (!dataCache[signature]) {
            dataCache[signature] = this._buildPreparedData(data);
        }

        return dataCache[signature];
    }

    _invalidatePreparedData(data) {
        if (typeof WeakMap === 'undefined') return;
        const constructorRef = this.constructor;
        if (constructorRef._preparedDataCache && Array.isArray(data)) {
            constructorRef._preparedDataCache.delete(data);
        }
    }

    _renderDropdownList(filterText = '') {
        if (!this.isReady || !this.dropdown) return;
        this.dropdown.innerHTML = '';
        this.dropdownHeader = null;
        this.dropdownBody = null;
        const lowerFilterText = String(filterText || '').toLowerCase();

        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex shrink-0 bg-gray-50 px-4 py-3 border-b';
        this.options.columns.forEach(col => {
            const headerCell = document.createElement('div');
            headerCell.className = `${col.width || 'flex-1'} text-xs font-bold uppercase text-gray-500`;
            headerCell.textContent = col.header;
            headerDiv.appendChild(headerCell);
        });
        this.dropdown.appendChild(headerDiv);
        this.dropdownHeader = headerDiv;

        const listContainer = document.createElement('div');
        listContainer.className = 'min-h-0 flex-1 overflow-y-auto overscroll-contain';
        listContainer.style.overscrollBehavior = 'contain';
        listContainer.addEventListener('wheel', function (event) {
            event.stopPropagation();
        });
        let hasResults = false;
        const preparedData = this._getPreparedData();
        const rowsFragment = document.createDocumentFragment();

        listContainer.addEventListener('click', (event) => {
            const target = event.target && event.target.closest ? event.target : null;
            const row = target ? target.closest('[data-tag-option-index]') : null;
            if (!row || !listContainer.contains(row)) return;
            const option = preparedData[Number(row.dataset.tagOptionIndex)];
            if (option) this._addItem(option.item);
        });

        preparedData.forEach((option, index) => {
            if (!option.value || this.selectedItems.has(option.value)) return;

            if (option.lowerLabel.includes(lowerFilterText)) {
                hasResults = true;
                const rowDiv = document.createElement('div');
                rowDiv.className = 'flex px-4 py-3 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0';
                rowDiv.dataset.tagOptionIndex = String(index);

                option.cells.forEach(cell => {
                    const cellDiv = document.createElement('div');
                    cellDiv.className = `${cell.width || 'flex-1'} text-sm text-gray-700 truncate`;
                    cellDiv.textContent = cell.value;
                    rowDiv.appendChild(cellDiv);
                });

                rowsFragment.appendChild(rowDiv);
            }
        });

        if (!hasResults) {
            listContainer.innerHTML = '<div class="px-4 py-3 text-sm text-gray-500 italic">Nenhum resultado encontrado</div>';
        } else {
            listContainer.appendChild(rowsFragment);
        }

        this.dropdown.appendChild(listContainer);
        this.dropdownBody = listContainer;
    }

    _renderTags() {
        if (!this.isReady || !this.inputArea || !this.searchInput) return;
        this.inputArea.querySelectorAll('.tag-input-tag').forEach(tag => tag.remove());
        const isSingleWithSelection = this.options.singleSelection && this.selectedItems.size > 0;

        this.selectedItems.forEach((label, value) => {
            const safeLabel = String(label)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            const tagEl = document.createElement('div');
            tagEl.className = `tag-input-tag flex items-center gap-2 min-w-0 max-w-full bg-gray-200 text-gray-800 text-sm font-semibold pl-3 pr-2 py-1 rounded-md ${isSingleWithSelection ? 'w-full' : ''}`;
            tagEl.innerHTML = `<span id="tagLabel_${this.container.id}" class="tag-input-tag-label block flex-1 min-w-0 truncate" title="${safeLabel}">${safeLabel}</span><button data-value="${value}" class="tag-input-remove-tag shrink-0 text-gray-500 hover:text-red-600">&times;</button>`;
            this.inputArea.insertBefore(tagEl, this.searchInput);
        });

        if (isSingleWithSelection) {
            this.searchInput.classList.remove('flex-grow', 'p-1');
            this.searchInput.classList.add('w-0', 'p-0', 'm-0', 'min-w-0');
        } else {
            this.searchInput.classList.remove('w-0', 'p-0', 'm-0');
            this.searchInput.classList.add('flex-grow', 'p-1', 'min-w-0');
        }

        this.inputArea.querySelectorAll('.tag-input-remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._removeItem(btn.dataset.value);
            });
        });

        this.searchInput.placeholder = this.selectedItems.size > 0 || this.isDisabled ? '' : this.options.placeholder;
    }

    _filterList() {
        if (!this.isReady) return;
        this.openDropdown();
    }

    _clearPendingSearchText() {
        if (!this.isReady || !this.searchInput || !this.options.clearUnselectedInputOnBlur) return;
        if (!this.searchInput.value) return;
        this.searchInput.value = '';
        if (this.dropdown && !this.dropdown.classList.contains('hidden')) {
            this._renderDropdownList('');
        }
    }

    _addItem(item) {
        if (!this.isReady) return;
        if (this.options.singleSelection) {
            this.selectedItems.clear();
        }

        const itemValue = this._getItemValue(item);
        const itemLabel = this._getItemLabel(item);

        if (!itemValue || itemLabel === undefined) {
            console.error('Tentativa de adicionar item com valor/rotulo indefinido:', item);
            return;
        }

        this.selectedItems.set(itemValue, itemLabel);
        this.searchInput.value = '';
        this._renderTags();
        this.closeDropdown();
        if (typeof this.options.onItemAdded === 'function') this.options.onItemAdded(item);
    }

    _removeItem(value) {
        if (!this.isReady) return;
        const original = this._getPreparedData().find(d => d.value === value);
        const originalItem = original && original.item;

        if (this.selectedItems.delete(value)) {
            this._renderTags();
            if (typeof this.options.onItemRemoved === 'function') this.options.onItemRemoved(originalItem);
        }
    }

    openDropdown() {
        if (!this.isReady) return;
        if (this.isDisabled) return;
        this._renderDropdownList(this.searchInput.value);
        if (this.options.portalDropdown) {
            this._positionDropdown();
            if (!this._boundPortalPosition) {
                this._boundPortalPosition = () => {
                    if (!this.dropdown || this.dropdown.classList.contains('hidden')) return;
                    this._positionDropdown();
                };
            }
            window.addEventListener('scroll', this._boundPortalPosition, true);
            window.addEventListener('resize', this._boundPortalPosition);
        }
        this.dropdown.classList.remove('hidden');
    }

    closeDropdown() {
        if (!this.isReady || !this.dropdown) return;
        this._clearPendingSearchText();
        this.dropdown.classList.add('hidden');
        if (this.options.portalDropdown && this._boundPortalPosition) {
            window.removeEventListener('scroll', this._boundPortalPosition, true);
            window.removeEventListener('resize', this._boundPortalPosition);
        }
    }

    updateData(newData) {
        if (!this.isReady) return;
        this._invalidatePreparedData(newData);
        this.options.data = Array.isArray(newData) ? newData : [];
        this.closeDropdown();
        this.openDropdown();
        this.closeDropdown();
    }

    getSelectedItems() {
        return Array.from(this.selectedItems, ([value, label]) => ({ label, value }));
    }

    removeAll() {
        if (!this.isReady) return;
        this.selectedItems.clear();
        this._renderTags();
    }

    disable(isDisabled) {
        if (!this.isReady || !this.wrapper || !this.searchInput) return;
        this.isDisabled = isDisabled;
        this.wrapper.classList.toggle('opacity-50', isDisabled);
        this.wrapper.classList.toggle('pointer-events-none', isDisabled);
        this.searchInput.disabled = isDisabled;
        this._renderTags();

        const label = this.container.closest('.space-y-3')?.querySelector('label');
        if (label) {
            label.classList.toggle('text-sebrae-blue', !isDisabled);
            label.classList.toggle('text-gray-400', isDisabled);
        }
    }

    reload(newData) {
        if (!this.isReady) return;
        this._invalidatePreparedData(newData);
        this.options.data = Array.isArray(newData) ? newData : [];
        this.removeAll();
    }

    setSelectedItems(items) {
        if (!this.isReady) return;
        if (!Array.isArray(items)) return;

        this.selectedItems.clear();

        items.forEach(item => {
            if (item && item.value !== undefined && item.label !== undefined) {
                const stringValue = String(item.value);
                const stringLabel = String(item.label);
                const existsInData = this._getPreparedData().some(d => d.value === stringValue);

                if (existsInData) {
                    this.selectedItems.set(stringValue, stringLabel);
                }
            }
        });

        this._renderTags();
    }

    destroy() {
        if (!this.isReady) return;
        this.closeDropdown();
        if (this._boundDocumentClick) {
            document.removeEventListener('click', this._boundDocumentClick);
            this._boundDocumentClick = null;
        }
        if (this.options.portalDropdown && this.dropdown && this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }
        this.isReady = false;
    }
}
