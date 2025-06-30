// js/components/file-manager/download-progress.js

Vue.component('download-progress', {
    props: {
        progress: {
            type: Number,
            default: 0
        }
    },
    template: `
        <transition name="slide-fade">
            <div class="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px]">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">Загрузка файла...</span>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                         :style="'width: ' + progress + '%'"></div>
                </div>
            </div>
        </transition>
    `
});