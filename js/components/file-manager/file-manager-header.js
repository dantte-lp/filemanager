// js/components/file-manager/file-manager-header.js

Vue.component('file-manager-header', {
    name: 'file-manager-header',
    props: {
        user: {
            type: Object,
            required: true
        }
    },
    template: `
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <h1 class="text-xl font-light">Файловый менеджер</h1>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                            {{ user.name || user.username }}
                        </span>
                        <button @click="$emit('toggle-theme')" 
                                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Переключить тему">
                            <i v-if="!isDark" class="fas fa-moon"></i>
                            <i v-else class="fas fa-sun"></i>
                        </button>
                        <button @click="$emit('logout')" 
                                class="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors">
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
        </header>
    `,
    computed: {
        isDark() {
            return document.documentElement.classList.contains('dark');
        }
    }
});