// js/components/file-manager/file-grid-view.js

Vue.component('file-grid-view', {
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
        }
    },
    template: `
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="file in files" 
                 :key="file.path"
                 @click="$emit('file-click', file)" 
                 class="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 text-center group relative">
                <button v-if="file.type === 'file'" 
                        @click.stop="$emit('copy-link', file)"
                        class="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                        title="Копировать ссылку">
                    <i class="fas fa-link text-sm"></i>
                </button>
                <i :class="getIcon(file)" 
                   class="text-5xl mb-2 group-hover:scale-110 transition-transform"
                   :style="'color: ' + getColor(file)"></i>
                <p class="text-sm truncate">{{ file.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ file.type === 'file' ? formatSize(file.size) : '' }}
                </p>
            </div>
        </div>
    `
});