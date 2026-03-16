/**
 * Componente de filtro customizado que exibe itens selecionados como tags
 * e mostra uma lista suspensa com múltiplas colunas para seleção.
 */
class TagInputFilter {
    constructor(selector, options) {
        this.container = document.querySelector(selector);
        if (!this.container) {
            console.error(`Container do filtro não encontrado: ${selector}`);
            return;
        }

        // Opções padrão e customizadas
        this.options = {
            placeholder: 'Selecione...',
            data: [],
            labelField: 'label', // Campo do objeto de dados usado para o texto da tag
            valueField: 'value', // Campo do objeto de dados usado como valor único
            columns: [],         // Configuração das colunas para a tabela suspensa
            singleSelection: false,
            onItemAdded: () => {},
            onItemRemoved: () => {},
            ...options,
        };

        this.selectedItems = new Map(); // Armazena os itens selecionados [value, label]
        this.isDisabled = false;

        this._render();
        this._initListeners();
    }

    /**
     * Renderiza a estrutura HTML inicial do componente.
     */
    _render() {
        this.container.innerHTML = `
            <div class="tag-input-wrapper relative">
                <div class="tag-input-area bg-white border-2 border-gray-200 rounded-xl w-full min-h-[45px] p-2.5 flex items-center flex-wrap gap-2 cursor-text focus-within:ring-2 focus-within:ring-bevap-green focus-within:border-bevap-green">    
                <input type="text" class="tag-input-search flex-grow p-1 text-sm outline-none bg-transparent" placeholder="${this.options.placeholder}">
                </div>
                <div class="tag-input-dropdown absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 hidden max-h-72 overflow-y-auto"></div>
            </div>
        `;

        this.wrapper = this.container.querySelector('.tag-input-wrapper');
        this.inputArea = this.container.querySelector('.tag-input-area');
        this.searchInput = this.container.querySelector('.tag-input-search');
        this.dropdown = this.container.querySelector('.tag-input-dropdown');
    }

    /**
     * Inicializa todos os listeners de eventos do componente.
     */
    _initListeners() {
        this.inputArea.addEventListener('click', () => !this.isDisabled && this.searchInput.focus());
        this.searchInput.addEventListener('focus', () => this.openDropdown());
        this.searchInput.addEventListener('keyup', () => this._filterList());
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && this.searchInput.value === '' && this.selectedItems.size > 0) {
                const lastItemValue = Array.from(this.selectedItems.keys()).pop();
                this._removeItem(lastItemValue);
            }
        });
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) this.closeDropdown();
        });
    }

    /**
     * Renderiza a lista suspensa em formato de tabela.
     */
    _renderDropdownList(filterText = '') {
        this.dropdown.innerHTML = '';
        const lowerFilterText = filterText.toLowerCase();

        // Cabeçalho da tabela
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex bg-gray-50 p-6 border-b sticky top-0 z-10';
        this.options.columns.forEach(col => {
            const headerCell = document.createElement('div');
            headerCell.className = `${col.width || 'flex-1'} text-xs font-bold uppercase text-gray-500`;
            headerCell.textContent = col.header;
            headerDiv.appendChild(headerCell);
        });
        this.dropdown.appendChild(headerDiv);

        // Linhas da tabela
        const listContainer = document.createElement('div');
        let hasResults = false;
        this.options.data.forEach(item => {
            // Convertendo para string aqui para consistência
            const itemValue = String(item[this.options.valueField]);
            const itemLabelRaw = item[this.options.labelField];
            const itemLabel = itemLabelRaw === null || itemLabelRaw === undefined ? '' : String(itemLabelRaw);

            if (this.selectedItems.has(itemValue)) return;

            // Verificação de robustez: só filtra se o label existir
            if (itemLabel.toLowerCase().includes(lowerFilterText)) {
                hasResults = true;
                const rowDiv = document.createElement('div');
                rowDiv.className = 'flex p-6 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0';
                this.options.columns.forEach(col => {
                    const cellDiv = document.createElement('div');
                    cellDiv.className = `${col.width || 'flex-1'} text-sm text-gray-700 truncate`;
                    const cellValue = item && item[col.field] !== undefined && item[col.field] !== null ? String(item[col.field]) : '';
                    cellDiv.textContent = cellValue;
                    rowDiv.appendChild(cellDiv);
                });
                rowDiv.addEventListener('click', () => this._addItem(item));
                listContainer.appendChild(rowDiv);
            }
        });

        if (!hasResults) {
            listContainer.innerHTML = `<div class="p-6 text-sm text-gray-500 italic">Nenhum resultado encontrado</div>`;
        }
        this.dropdown.appendChild(listContainer);
    }

    /**
     * Renderiza as tags dos itens selecionados dentro do input.
     */
    _renderTags() {
        this.inputArea.querySelectorAll('.tag-input-tag').forEach(tag => tag.remove());
        this.selectedItems.forEach((label, value) => {
            const tagEl = document.createElement('div');
            tagEl.className = 'tag-input-tag flex items-center gap-2 bg-gray-200 text-gray-800 text-sm font-semibold pl-3 pr-2 py-1 rounded-md';
            tagEl.innerHTML = `<span id="tagLabel_${this.container.id}">${label}</span><button data-value="${value}" class="tag-input-remove-tag text-gray-500 hover:text-red-600">&times;</button>`;
            this.inputArea.insertBefore(tagEl, this.searchInput);
        });
        this.inputArea.querySelectorAll('.tag-input-remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._removeItem(btn.dataset.value);
            });
        });
        this.searchInput.placeholder = this.selectedItems.size > 0 ? '' : this.options.placeholder;
    }

    _filterList() {
        this.openDropdown();
    }

    _addItem(item) {

        if (this.options.singleSelection) {
            this.selectedItems.clear();
        }
        
        const itemValue = String(item[this.options.valueField]);
        const itemLabel = item[this.options.labelField];

        if (item[this.options.valueField] === undefined || itemLabel === undefined) {
            console.error("Tentativa de adicionar item com valor/rótulo indefinido:", item);
            return;
        }

        this.selectedItems.set(itemValue, itemLabel); // Agora a chave é sempre uma string
        this.searchInput.value = '';
        this._renderTags();
        this.closeDropdown();
        if (typeof this.options.onItemAdded === 'function') this.options.onItemAdded(item);
    }

    _removeItem(value) {
        // 'value' já é uma string vinda do data-attribute, então a busca agora funciona
        const originalItem = this.options.data.find(d => String(d[this.options.valueField]) === value);
        
        if (this.selectedItems.delete(value)) { // .delete() agora funciona e retorna true
            this._renderTags();
            if (typeof this.options.onItemRemoved === 'function') this.options.onItemRemoved(originalItem);
        }
    }

    openDropdown() {
        if (this.isDisabled) return;
        this._renderDropdownList(this.searchInput.value);
        this.dropdown.classList.remove('hidden');
    }

    closeDropdown() {
        this.dropdown.classList.add('hidden');
    }

    updateData(newData) {
        this.options.data = Array.isArray(newData) ? newData : [];
        this.closeDropdown();
        this.openDropdown(); // força recriação visual com os novos dados
        this.closeDropdown();
      }

    // --- MÉTODOS PÚBLICOS ---
    getSelectedItems() {
        // Retorna os valores como foram armazenados (strings)
        return Array.from(this.selectedItems, ([value, label]) => ({ label, value }));
    }

    removeAll() {
        this.selectedItems.clear();
        this._renderTags();
    }

    disable(isDisabled) {
        this.isDisabled = isDisabled;
        this.wrapper.classList.toggle('opacity-50', isDisabled);
        this.wrapper.classList.toggle('pointer-events-none', isDisabled);
        this.searchInput.disabled = isDisabled;
      
        // ajusta cor do label
        const label = this.container.closest('.space-y-3')?.querySelector('label');
        if (label) {
          label.classList.toggle('text-sebrae-blue', !isDisabled);
          label.classList.toggle('text-gray-400', isDisabled);
        }
      }
      

    reload(newData) {
        this.options.data = Array.isArray(newData) ? newData : [];
        this.removeAll();
    }

    setSelectedItems(items) {
        if (!Array.isArray(items)) return;
    
        // Limpar seleções atuais
        this.selectedItems.clear();
    
        // Adicionar novos itens
        items.forEach(item => {
            if (item && item.value !== undefined && item.label !== undefined) {
                // Garantir que o valor seja string para consistência
                const stringValue = String(item.value);
                const stringLabel = String(item.label);
                
                // Verificar se o item existe nos dados disponíveis
                const existsInData = this.options.data.some(d => 
                    String(d[this.options.valueField]) === stringValue
                );
                
                if (existsInData) {
                    this.selectedItems.set(stringValue, stringLabel);
                }
            }
        });
    
        this._renderTags();
    }
}
