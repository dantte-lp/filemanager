// js/components/file-manager/file-list-view.js

Vue.component('file-list-view', {
    props: {
        files: {
            type: Array,
            required: true
        }
    },
    methods: {
        getIcon(file) {
            return FileHelpers.getFileIcon(file);
        },
        getColor(file) {
            return FileHelpers.getFileColor(file);
        },
        formatSize(size) {
            return FileHelpers.formatFileSize(size);
        },
        formatDate(timestamp) {
            return FileHelpers.formatDate(timestamp);
        }
    },
    template: `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Имя
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                            Размер
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                            Изменено
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="file in files" 
                        :key="file.path"
                        @click="$emit('file-click', file)" 
                        class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <i :class="getIcon(file)" 
                                   class="text-2xl mr-3"
                                   :style="'color: ' + getColor(file)"></i>
                                <span class="text-sm">{{ file.name }}</span>
                                <button v-if="file.type === 'file'" 
                                        @click.stop="$emit('copy-link', file)"
                                        class="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        title="Копировать ссылку">
                                    <i class="fas fa-link text-sm"></i>
                                </button>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            <span>{{ file.type === 'file' ? formatSize(file.size) : '-' }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                            <span>{{ formatDate(file.modified) }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
});