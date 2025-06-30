// Альтернативная версия компонента header с watch

Vue.component('file-manager-header-alt', {
    name: 'file-manager-header',
    props: {
        user: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            isDarkTheme: true,
            watchInterval: null
        };
    },
    mounted() {
        // Начальная синхронизация
        this.syncTheme();
        
        // Отслеживаем изменения каждые 50мс
        this.watchInterval = setInterval(() => {
            this.syncTheme();
        }, 50);
    },
    beforeDestroy() {
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
        }
    },
    methods: {
        toggleTheme() {
            // Переключаем глобальное состояние
            if (window.ThemeState) {
                window.ThemeState.toggle();
            } else {
                // Fallback
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                }
            }
            
            // Синхронизируем немедленно
            this.syncTheme();
        },
        syncTheme() {
            const isDark = window.ThemeState ? window.ThemeState.isDark : document.documentElement.classList.contains('dark');
            if (this.isDarkTheme !== isDark) {
                this.isDarkTheme = isDark;
            }
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
                        <button @click="toggleTheme" 
                                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                :title="isDarkTheme ? 'Переключить на светлую тему' : 'Переключить на темную тему'">
                            <transition name="fade" mode="out-in">
                                <i v-if="isDarkTheme" key="sun" class="fas fa-sun text-yellow-400"></i>
                                <i v-else key="moon" class="fas fa-moon text-gray-600"></i>
                            </transition>
                        </button>
                        <button @click="$emit('logout')" 
                                class="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors">
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
        </header>
    `
});