// Альтернативная компактная версия toolbar с dropdown для фильтров

Vue.component('file-manager-toolbar-compact', {
    props: {
        value: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            searchMode: 'current',
            showFilterDropdown: false,
            filterOptions: [
                { value: 'all', label: 'Все файлы', icon: 'fa-folder' },
                { value: 'image', label: 'Изображения', icon: 'fa-image' },
                { value: 'document', label: 'Документы', icon: 'fa-file-alt' },
                { value: 'archive', label: 'Архивы', icon: 'fa-file-archive' },
                { value: 'iso', label: 'ISO образы', icon: 'fa-compact-disc' }
            ]
        };
    },
    computed: {
        localValue: {
            get() {
                return this.value;
            },
            set(val) {
                this.$emit('input', val);
            }
        },
        currentFilterLabel() {
            const filter = this.filterOptions.find(f => f.value === this.localValue.currentFilter);
            return filter ? filter.label : 'Все файлы';
        },
        currentFilterIcon() {
            const filter = this.filterOptions.find(f => f.value === this.localValue.currentFilter);
            return filter ? filter.icon : 'fa-folder';
        }
    },
    methods: {
        updateViewMode(mode) {
            this.localValue.viewMode = mode;
            Storage.setViewMode(mode);
        },
        handleSearch() {
            if (this.searchMode === 'global' && this.localValue.searchQuery) {
                this.$parent.performGlobalSearch();
            }
        },
        handleSearchModeChange() {
            this.$emit('search-mode-change', this.searchMode);
            if (this.searchMode === 'global' && this.localValue.searchQuery) {
                this.handleSearch();
            }
        },
        selectFilter(value) {
            this.localValue.currentFilter = value;
            this.showFilterDropdown = false;
        }
    },
    mounted() {
        // Закрытие dropdown при клике вне
        document.addEventListener('click', (e) => {
            if (!this.$el.contains(e.target)) {
                this.showFilterDropdown = false;
            }
        });
    },
    template: `
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 py-2">
                <div class="flex items-center gap-2">
                    <!-- Compact Search -->
                    <div class="flex gap-1 flex-1 max-w-sm">
                        <div class="relative flex-1">
                            <input type="text" 
                                   v-model="localValue.searchQuery"
                                   @keyup.enter="handleSearch"
                                   placeholder="Поиск..."
                                   class="search-input w-full pl-7 pr-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700">
                            <i class="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                        </div>
                        <button @click="searchMode = searchMode === 'current' ? 'global' : 'current'; handleSearchModeChange()"
                                class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                :title="searchMode === 'current' ? 'Поиск в текущей папке' : 'Поиск везде'">
                            <i :class="searchMode === 'current' ? 'fas fa-folder' : 'fas fa-globe'" class="text-xs"></i>
                        </button>
                    </div>

                    <!-- Filter Dropdown -->
                    <div class="relative">
                        <button @click="showFilterDropdown = !showFilterDropdown"
                                class="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <i :class="'fas ' + currentFilterIcon" class="text-xs"></i>
                            <span class="hidden sm:inline">{{ currentFilterLabel }}</span>
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        
                        <div v-if="showFilterDropdown" 
                             class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50 min-w-[150px]">
                            <button v-for="filter in filterOptions"
                                    :key="filter.value"
                                    @click="selectFilter(filter.value)"
                                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                <i :class="'fas ' + filter.icon" class="text-xs w-4"></i>
                                {{ filter.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Sort Dropdown -->
                    <select v-model="localValue.sortBy"
                            class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700">
                        <option value="name">Имя</option>
                        <option value="size">Размер</option>
                        <option value="date">Дата</option>
                        <option value="type">Тип</option>
                    </select>

                    <!-- View Icons -->
                    <div class="flex">
                        <button @click="updateViewMode('list')" 
                                :class="localValue.viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400'"
                                class="p-1 rounded-l border border-gray-300 dark:border-gray-600"
                                title="Список">
                            <i class="fas fa-list text-xs"></i>
                        </button>
                        <button @click="updateViewMode('grid')" 
                                :class="localValue.viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400'"
                                class="p-1 rounded-r border border-gray-300 dark:border-gray-600 border-l-0"
                                title="Сетка">
                            <i class="fas fa-th text-xs"></i>
                        </button>
                    </div>

                    <!-- Actions Group -->
                    <div class="flex ml-auto">
                        <button @click="$emit('refresh')" 
                                class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                title="Обновить (F5)">
                            <i class="fas fa-sync-alt text-xs"></i>
                        </button>
                        <button @click="$emit('go-home')" 
                                class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ml-1"
                                title="Домой">
                            <i class="fas fa-home text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
});