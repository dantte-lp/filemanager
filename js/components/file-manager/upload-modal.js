// js/components/file-manager/upload-modal.js

Vue.component('upload-modal', {
    props: {
        show: {
            type: Boolean,
            default: false
        },
        currentPath: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            files: [],
            uploading: false,
            uploadProgress: {},
            dragOver: false
        };
    },
    computed: {
        totalSize() {
            return this.files.reduce((total, file) => total + file.size, 0);
        },
        totalSizeFormatted() {
            return this.formatFileSize(this.totalSize);
        }
    },
    methods: {
        handleFileSelect(event) {
            const selectedFiles = Array.from(event.target.files);
            this.addFiles(selectedFiles);
        },
        
        handleDrop(event) {
            event.preventDefault();
            this.dragOver = false;
            
            const droppedFiles = Array.from(event.dataTransfer.files);
            this.addFiles(droppedFiles);
        },
        
        handleDragOver(event) {
            event.preventDefault();
            this.dragOver = true;
        },
        
        handleDragLeave() {
            this.dragOver = false;
        },
        
        addFiles(newFiles) {
            // Фильтруем дубликаты
            newFiles.forEach(file => {
                if (!this.files.find(f => f.name === file.name && f.size === file.size)) {
                    this.files.push(file);
                    this.$set(this.uploadProgress, file.name, 0);
                }
            });
        },
        
        removeFile(index) {
            const file = this.files[index];
            delete this.uploadProgress[file.name];
            this.files.splice(index, 1);
        },
        
        async uploadFiles() {
            if (this.files.length === 0) return;
            
            this.uploading = true;
            
            for (const file of this.files) {
                try {
                    await this.uploadFile(file);
                } catch (error) {
                    console.error('Upload error:', error);
                    this.$root.$emit('show-toast', `Ошибка загрузки ${file.name}`, 'error');
                }
            }
            
            this.uploading = false;
            this.$root.$emit('show-toast', 'Загрузка завершена', 'success');
            this.$emit('upload-complete');
            this.close();
        },
        
        async uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', this.currentPath);
            
            const xhr = new XMLHttpRequest();
            
            // Отслеживание прогресса
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    this.$set(this.uploadProgress, file.name, progress);
                }
            });
            
            // Промис для ожидания завершения
            return new Promise((resolve, reject) => {
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                });
                
                xhr.addEventListener('error', () => {
                    reject(new Error('Network error'));
                });
                
                xhr.open('POST', '/api/upload');
                xhr.setRequestHeader('Authorization', API.getAuthHeaders().Authorization);
                xhr.send(formData);
            });
        },
        
        formatFileSize(bytes) {
            return FileHelpers.formatFileSize(bytes);
        },
        
        getFileIcon(file) {
            const ext = file.name.split('.').pop().toLowerCase();
            const category = FileHelpers.getFileCategory(ext);
            return FileHelpers.icons[category] || FileHelpers.icons.other;
        },
        
        close() {
            this.files = [];
            this.uploadProgress = {};
            this.dragOver = false;
            this.$emit('close');
        }
    },
    template: `
        <transition name="fade">
            <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <transition name="slide-fade">
                    <div v-if="show" class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <!-- Header -->
                        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 class="text-xl font-semibold">Загрузка файлов</h2>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Загрузка в: {{ currentPath || 'Корневая папка' }}
                            </p>
                        </div>
                        
                        <!-- Drop Zone -->
                        <div class="p-6 flex-1 overflow-y-auto">
                            <div 
                                @drop="handleDrop"
                                @dragover="handleDragOver"
                                @dragleave="handleDragLeave"
                                :class="[
                                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                                    dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
                                ]">
                                
                                <i class="fas fa-cloud-upload-alt text-4xl mb-4" 
                                   :class="dragOver ? 'text-blue-500' : 'text-gray-400'"></i>
                                
                                <p class="text-gray-600 dark:text-gray-400 mb-4">
                                    Перетащите файлы сюда или
                                </p>
                                
                                <label class="btn-primary cursor-pointer">
                                    <i class="fas fa-folder-open mr-2"></i>
                                    Выбрать файлы
                                    <input type="file" 
                                           multiple 
                                           @change="handleFileSelect" 
                                           class="hidden">
                                </label>
                            </div>
                            
                            <!-- File List -->
                            <div v-if="files.length > 0" class="mt-6">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="font-medium">
                                        Выбрано файлов: {{ files.length }} ({{ totalSizeFormatted }})
                                    </h3>
                                    <button @click="files = []; uploadProgress = {}"
                                            class="text-sm text-red-600 hover:text-red-700">
                                        Очистить все
                                    </button>
                                </div>
                                
                                <div class="space-y-2">
                                    <div v-for="(file, index) in files" 
                                         :key="file.name + file.size"
                                         class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        
                                        <i :class="getFileIcon(file)" 
                                           class="text-xl mr-3 text-gray-600 dark:text-gray-400"></i>
                                        
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium truncate">{{ file.name }}</p>
                                            <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
                                            
                                            <!-- Progress Bar -->
                                            <div v-if="uploadProgress[file.name] > 0" 
                                                 class="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                <div class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                     :style="'width: ' + uploadProgress[file.name] + '%'"></div>
                                            </div>
                                        </div>
                                        
                                        <button v-if="!uploading"
                                                @click="removeFile(index)"
                                                class="ml-3 p-1 text-red-600 hover:text-red-700">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button @click="close" 
                                    :disabled="uploading"
                                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                                Отмена
                            </button>
                            <button @click="uploadFiles" 
                                    :disabled="files.length === 0 || uploading"
                                    class="btn-primary">
                                <i v-if="!uploading" class="fas fa-upload mr-2"></i>
                                <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                                {{ uploading ? 'Загрузка...' : 'Загрузить' }}
                            </button>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>
    `
});