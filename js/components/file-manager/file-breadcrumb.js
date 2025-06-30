// js/components/file-manager/file-breadcrumb.js

Vue.component('file-breadcrumb', {
    props: {
        items: {
            type: Array,
            default: () => []
        }
    },
    template: `
        <div class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <nav class="flex items-center space-x-2 text-sm">
                    <button @click="$emit('navigate', '')" 
                            class="text-blue-500 hover:text-blue-600 transition-colors">
                        <i class="fas fa-home"></i> Домой
                    </button>
                    <template v-for="(item, index) in items">
                        <span :key="'sep-' + index" class="flex items-center space-x-2">
                            <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
                            <button @click="$emit('navigate', item.path)" 
                                    class="text-blue-500 hover:text-blue-600 transition-colors">
                                {{ item.name }}
                            </button>
                        </span>
                    </template>
                </nav>
            </div>
        </div>
    `
});