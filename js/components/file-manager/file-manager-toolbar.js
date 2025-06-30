// js/components/file-manager/file-manager-toolbar.js

Vue.component('file-manager-toolbar', {
    props: {
        value: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            filterOptions: [
                { value: 'all', label: 'Все', icon: '📁' },
                { value: 'image', label: 'Изображения', icon: '🖼️' },
                { value: 'document', label: 'Документы', icon: '📄' },
                { value: 'archive', label: 'Архивы', icon: '📦' },
                { value: 'iso', label: 'ISO', icon: '💿' }
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
        }
    },
    methods: {
        updateViewMode(mode) {
            this.localValue.viewMode = mode;
            Storage.setViewMode(mode);
        }
    },
    template: `
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div class="flex flex-wrap gap-3 items-center">
                    <!-- Search with mode toggle -->
                    <div class="flex-1 min-w-[300px]">
                        <div class="flex gap-2">
                            <div class="relative flex-1">
                                <input type="text" 
                                       v-model="localValue.searchQuery"
                                       @keyup.enter="handleSearch"
                                       placeholder="Поиск файлов... (Ctrl+K)"
                                       class="search-input w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm">
                                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            </div>
                            <select v-model="searchMode"
                                    @change="handleSearchModeChange"
                                    class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm">
                                <option value="current">В текущей папке</option>
                                <option value="global">Везде</option>
                            </select>
                        </div>
                    </div>

                    <!-- Sort -->
                    <select v-model="localValue.sortBy"
                            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm">
                        <option value="name">По имени</option>
                        <option value="size">По размеру</option>
                        <option value="date">По дате</option>
                        <option value="type">По типу</option>
                    </select>

                    <!-- View Toggle -->
                    <div class="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                        <button @click="updateViewMode('list')" 
                                :class="localValue.viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'"
                                class="px-3 py-2 text-sm transition-colors">
                            <i class="fas fa-list"></i>
                        </button>
                        <button @click="updateViewMode('grid')" 
                                :class="localValue.viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'"
                                class="px-3 py-2 text-sm transition-colors border-l border-gray-300 dark:border-gray-600">
                            <i class="fas fa-th-large"></i>
                        </button>
                    </div>

                    <!-- Filters -->
                    <div class="flex flex-wrap gap-2">
                        <button v-for="filter in filterOptions" 
                                :key="filter.value"
                                @click="localValue.currentFilter = filter.value" 
                                :class="localValue.currentFilter === filter.value ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
                                class="px-3 py-1 rounded-full text-sm transition-colors">
                            <span>{{ filter.icon }} {{ filter.label }}</span>
                        </button>
                    </div>

                    <!-- Refresh Button -->
                    <button @click="$emit('refresh')" 
                            class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                            title="Обновить (F5)">
                        <i class="fas fa-sync-alt"></i>
                    </button>

                    <!-- Home Button -->
                    <button @click="$emit('go-home')" 
                            class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                            title="Домой">
                        <i class="fas fa-home"></i>
                    </button>
                </div>
            </div>
        </div>
    `
});