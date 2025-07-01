// js/app-vue3.js - Основное приложение для Vue 3

// Проверяем, что Vue загружен
if (typeof Vue === 'undefined') {
    console.error('Vue.js не загружен!');
    alert('Ошибка загрузки приложения. Попробуйте обновить страницу.');
}

// Проверяем, что все утилиты загружены
if (typeof API === 'undefined' || typeof Storage === 'undefined' || typeof FileHelpers === 'undefined') {
    console.error('Не все модули загружены!');
    console.log('API:', typeof API);
    console.log('Storage:', typeof Storage);
    console.log('FileHelpers:', typeof FileHelpers);
}

const { createApp, ref, computed, reactive, onMounted, nextTick, watch } = Vue;

createApp({
    setup() {
        // Auth
        const showAuthModal = ref(true);
        const authError = ref('');
        const authLoading = ref(false);
        const currentUser = ref(null);
        const loginForm = reactive({
            username: '',
            password: ''
        });

        // Toast
        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });

        // Files
        const loading = ref(false);
        const currentPath = ref('');
        const allFiles = ref([]);
        const breadcrumb = ref([]);

        // Filters
        const filters = reactive({
            searchQuery: '',
            sortBy: 'name',
            sortReverse: false,
            viewMode: 'list',
            currentFilter: 'all'
        });

        const filterOptions = [
            { value: 'all', label: 'Все', icon: '📁' },
            { value: 'image', label: 'Изображения', icon: '🖼️' },
            { value: 'document', label: 'Документы', icon: '📄' },
            { value: 'archive', label: 'Архивы', icon: '📦' },
            { value: 'disk', label: 'Образы дисков', icon: '💿' }
        ];

        // Upload
        const showUploadModal = ref(false);
        const uploadFiles = ref([]);
        const uploadProgress = reactive({});
        const uploadSpeed = reactive({});
        const uploadStartTime = reactive({});
        const uploading = ref(false);
        const dragOver = ref(false);

        // Theme
        const isDark = ref(false);

        // Delete
        const showDeleteModal = ref(false);
        const fileToDelete = ref(null);
        const deleting = ref(false);

        // Template refs
        const usernameInput = ref(null);
        const fileInput = ref(null);

        // Computed
        const filteredFiles = computed(() => {
            let files = [...allFiles.value];

            // Поиск в текущей папке
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                files = files.filter(file =>
                    file.name.toLowerCase().includes(query)
                );
            }

            // Фильтрация по типу
            if (filters.currentFilter !== 'all') {
                files = files.filter(file => {
                    if (file.type === 'directory') return true;

                    const filterExtensions = FileHelpers.categories[filters.currentFilter];
                    if (!filterExtensions) return false;

                    return filterExtensions.includes(file.extension);
                });
            }

            // Сортировка
            files.sort((a, b) => {
                // Папки всегда первые
                if (a.type === 'directory' && b.type !== 'directory') return -1;
                if (a.type !== 'directory' && b.type === 'directory') return 1;

                let result = 0;
                switch (filters.sortBy) {
                    case 'name':
                        result = a.name.localeCompare(b.name, 'ru');
                        break;
                    case 'size':
                        result = a.size - b.size;
                        break;
                    case 'date':
                        result = a.modified - b.modified;
                        break;
                    case 'type':
                        const extA = a.extension || '';
                        const extB = b.extension || '';
                        result = extA.localeCompare(extB);
                        break;
                }

                return filters.sortReverse ? -result : result;
            });

            return files;
        });

        const totalUploadSize = computed(() => {
            const total = uploadFiles.value.reduce((sum, file) => sum + file.size, 0);
            return formatFileSize(total);
        });

        // Methods
        const hasPermission = (permission) => {
            return currentUser.value?.permissions?.[permission] === true;
        };

        // Auth methods
        const handleLogin = async () => {
            if (!loginForm.username || !loginForm.password) return;

            authLoading.value = true;
            authError.value = '';

            try {
                const response = await API.login(loginForm);

                if (response.success) {
                    currentUser.value = response.user;
                    showAuthModal.value = false;
                    showToast('Вход выполнен успешно!', 'success');
                    loadFiles('');
                }
            } catch (error) {
                console.error('Login error:', error);
                authError.value = error.message === 'Invalid credentials'
                    ? 'Неверный логин или пароль'
                    : 'Ошибка подключения к серверу';
            } finally {
                authLoading.value = false;
            }
        };

        const handleLogout = () => {
            API.logout();
            currentUser.value = null;
            showAuthModal.value = true;
            loginForm.username = '';
            loginForm.password = '';
            authError.value = '';
            showToast('Вы вышли из системы', 'info');
        };

        const checkAuth = async () => {
            const token = Storage.getToken();
            if (!token) return;

            try {
                const user = await API.checkAuth();
                if (user) {
                    currentUser.value = user;
                    showAuthModal.value = false;
                    loadFiles('');
                } else {
                    Storage.clearToken();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                Storage.clearToken();
            }
        };

        // File methods
        const loadFiles = async (path = '') => {
            loading.value = true;
            currentPath.value = path;

            try {
                const data = await API.getFiles(path);
                allFiles.value = data.items || [];
                breadcrumb.value = buildBreadcrumb(path);
            } catch (error) {
                console.error('Error loading files:', error);
                showToast('Ошибка загрузки файлов', 'error');
                allFiles.value = [];
            } finally {
                loading.value = false;
            }
        };

        const refreshFiles = () => {
            loadFiles(currentPath.value);
        };

        const navigateHome = () => {
            loadFiles('');
        };

        const handleFileClick = (file) => {
            if (file.type === 'directory') {
                loadFiles(file.relativePath);
            } else {
                downloadFile(file);
            }
        };

        const downloadFile = async (file) => {
            try {
                const data = await API.getDownloadLink(file.relativePath);

                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = data.download_url;
                document.body.appendChild(iframe);

                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 5000);

                showToast('Загрузка началась', 'success');
            } catch (error) {
                console.error('Download error:', error);
                showToast('Ошибка при скачивании файла', 'error');
            }
        };

        const copyDownloadLink = async (file) => {
            try {
                const data = await API.getDownloadLink(file.relativePath);
                const fullUrl = window.location.origin + data.download_url;

                try {
                    await navigator.clipboard.writeText(fullUrl);
                    showToast('Ссылка скопирована!', 'success');
                } catch (err) {
                    fallbackCopyToClipboard(fullUrl);
                }
            } catch (error) {
                console.error('Copy link error:', error);
                showToast('Ошибка при копировании ссылки', 'error');
            }
        };

        const fallbackCopyToClipboard = (text) => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                showToast('Ссылка скопирована!', 'success');
            } catch (err) {
                prompt('Скопируйте ссылку:', text);
            }

            document.body.removeChild(textArea);
        };

        const buildBreadcrumb = (path) => {
            if (!path) return [];

            const parts = path.split('/').filter(p => p);
            const breadcrumbItems = [];
            let currentBreadcrumbPath = '';

            parts.forEach(part => {
                currentBreadcrumbPath += (currentBreadcrumbPath ? '/' : '') + part;
                breadcrumbItems.push({
                    name: part,
                    path: currentBreadcrumbPath
                });
            });

            return breadcrumbItems;
        };

        // Upload methods
        const handleFileSelect = (event) => {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                uploadFiles.value = [files[0]];
                uploadProgress[files[0].name] = 0;
                uploadSpeed[files[0].name] = '';
            }
            event.target.value = '';
        };

        const handleDrop = (event) => {
            dragOver.value = false;
            const files = Array.from(event.dataTransfer.files);
            if (files.length > 0) {
                uploadFiles.value = [files[0]];
                uploadProgress[files[0].name] = 0;
                uploadSpeed[files[0].name] = '';
            }
        };

        const removeUploadFile = (index) => {
            const file = uploadFiles.value[index];
            delete uploadProgress[file.name];
            delete uploadSpeed[file.name];
            delete uploadStartTime[file.name];
            uploadFiles.value.splice(index, 1);
        };

        const startUpload = async () => {
            if (uploadFiles.value.length === 0) return;

            uploading.value = true;

            for (const file of uploadFiles.value) {
                try {
                    await uploadFile(file);
                } catch (error) {
                    console.error('Upload error:', error);
                    showToast(`Ошибка загрузки ${file.name}`, 'error');
                }
            }

            uploading.value = false;
            showToast('Загрузка завершена', 'success');
            closeUploadModal();
            refreshFiles();
        };

        const uploadFile = async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', currentPath.value);

            const xhr = new XMLHttpRequest();

            uploadStartTime[file.name] = Date.now();
            let lastLoaded = 0;
            let lastTime = Date.now();

            // Настройки для больших файлов
            xhr.timeout = 0; // Отключаем таймаут

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    uploadProgress[file.name] = progress;

                    const currentTime = Date.now();
                    const timeDiff = (currentTime - lastTime) / 1000;

                    if (timeDiff > 0.1) {
                        const bytesDiff = e.loaded - lastLoaded;
                        const speed = bytesDiff / timeDiff;

                        uploadSpeed[file.name] = formatSpeed(speed);

                        lastLoaded = e.loaded;
                        lastTime = currentTime;
                    }
                }
            });

            // Обработка ошибок
            xhr.upload.addEventListener('error', (e) => {
                console.error('Upload error event:', e);
            });

            xhr.upload.addEventListener('abort', (e) => {
                console.error('Upload aborted:', e);
            });

            return new Promise((resolve, reject) => {
                xhr.addEventListener('load', () => {
                    console.log('Upload response status:', xhr.status);
                    console.log('Upload response:', xhr.responseText);

                    if (xhr.status === 200) {
                        delete uploadSpeed[file.name];
                        delete uploadStartTime[file.name];
                        resolve(xhr.response);
                    } else {
                        let errorMessage = `Upload failed: ${xhr.status} ${xhr.statusText}`;
                        try {
                            const response = JSON.parse(xhr.responseText);
                            errorMessage = response.error || errorMessage;
                            if (response.details) {
                                errorMessage += ` - ${response.details}`;
                            }
                        } catch (e) {
                            // Ignore JSON parse error
                        }
                        reject(new Error(errorMessage));
                    }
                });

                xhr.addEventListener('error', () => {
                    delete uploadSpeed[file.name];
                    delete uploadStartTime[file.name];
                    reject(new Error('Network error'));
                });

                xhr.addEventListener('timeout', () => {
                    delete uploadSpeed[file.name];
                    delete uploadStartTime[file.name];
                    reject(new Error('Upload timeout'));
                });

                xhr.open('POST', '/api/upload');
                xhr.setRequestHeader('Authorization', API.getAuthHeaders().Authorization);

                // Важно: не устанавливаем Content-Type для FormData
                // браузер сам установит правильный boundary

                xhr.send(formData);
            });
        };

        const formatSpeed = (bytesPerSecond) => {
            if (bytesPerSecond < 1024) {
                return bytesPerSecond.toFixed(0) + ' B/s';
            } else if (bytesPerSecond < 1024 * 1024) {
                return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
            } else if (bytesPerSecond < 1024 * 1024 * 1024) {
                return (bytesPerSecond / (1024 * 1024)).toFixed(1) + ' MB/s';
            } else {
                return (bytesPerSecond / (1024 * 1024 * 1024)).toFixed(1) + ' GB/s';
            }
        };

        const closeUploadModal = () => {
            showUploadModal.value = false;
            uploadFiles.value = [];
            Object.keys(uploadProgress).forEach(key => delete uploadProgress[key]);
            Object.keys(uploadSpeed).forEach(key => delete uploadSpeed[key]);
            Object.keys(uploadStartTime).forEach(key => delete uploadStartTime[key]);
            dragOver.value = false;
        };

        const getUploadFileIcon = (file) => {
            const ext = file.name.split('.').pop().toLowerCase();
            return FileHelpers.getFileIconByExtension(ext);
        };

        const calculateTimeRemaining = (file) => {
            const progress = uploadProgress[file.name] || 0;
            const startTime = uploadStartTime[file.name];

            if (!startTime || progress === 0 || progress === 100) {
                return '';
            }

            const elapsedTime = Date.now() - startTime;
            const totalTime = (elapsedTime / progress) * 100;
            const remainingTime = totalTime - elapsedTime;

            const seconds = Math.ceil(remainingTime / 1000);

            if (seconds < 60) {
                return `${seconds} сек`;
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                const sec = seconds % 60;
                return `${minutes}:${sec.toString().padStart(2, '0')}`;
            } else {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                return `${hours}ч ${minutes}м`;
            }
        };

        // Theme methods
        const toggleTheme = () => {
            isDark.value = !isDark.value;

            if (isDark.value) {
                document.documentElement.classList.add('dark');
                Storage.setTheme('dark');
            } else {
                document.documentElement.classList.remove('dark');
                Storage.setTheme('light');
            }
        };

        const initTheme = () => {
            const savedTheme = Storage.getTheme();
            isDark.value = savedTheme === 'dark';

            if (isDark.value) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        // Toast methods
        const showToast = (message, type = 'success') => {
            toast.message = message;
            toast.type = type;
            toast.show = true;

            setTimeout(() => {
                closeToast();
            }, 3000);
        };

        const closeToast = () => {
            toast.show = false;
        };

        // Delete methods
        const confirmDelete = (file) => {
            fileToDelete.value = file;
            showDeleteModal.value = true;
        };

        const cancelDelete = () => {
            fileToDelete.value = null;
            showDeleteModal.value = false;
        };

        const deleteFile = async () => {
            if (!fileToDelete.value) return;

            deleting.value = true;

            try {
                await API.deleteFile(fileToDelete.value.relativePath);
                showToast('Файл удален успешно', 'success');
                showDeleteModal.value = false;
                fileToDelete.value = null;
                refreshFiles();
            } catch (error) {
                console.error('Delete error:', error);
                showToast(error.message || 'Ошибка при удалении файла', 'error');
            } finally {
                deleting.value = false;
            }
        };

        // Helper methods
        const getFileIcon = (file) => {
            return FileHelpers.getFileIcon(file);
        };

        const getFileColor = (file) => {
            return FileHelpers.getFileColor(file);
        };

        const formatFileSize = (bytes) => {
            return FileHelpers.formatFileSize(bytes);
        };

        const formatDate = (timestamp) => {
            return FileHelpers.formatDate(timestamp);
        };

        // Lifecycle
        onMounted(() => {
            console.log('App mounted');

            initTheme();
            checkAuth();

            // Focus на поле username при открытии
            nextTick(() => {
                if (usernameInput.value && showAuthModal.value) {
                    usernameInput.value.focus();
                }
            });

            // Горячие клавиши
            document.addEventListener('keydown', (e) => {
                if (e.key === 'F5') {
                    e.preventDefault();
                    refreshFiles();
                }
            });

            // Восстановление настроек
            const savedSettings = Storage.getSettings();
            if (savedSettings) {
                Object.assign(filters, savedSettings);
            }
        });

        // Watchers
        watch(() => filters, (newFilters) => {
            Storage.saveSettings({
                sortBy: newFilters.sortBy,
                sortReverse: newFilters.sortReverse,
                viewMode: newFilters.viewMode,
                currentFilter: newFilters.currentFilter
            });
        }, { deep: true });

        // Return everything for template
        return {
            // Refs
            showAuthModal,
            authError,
            authLoading,
            currentUser,
            loginForm,
            toast,
            loading,
            currentPath,
            allFiles,
            breadcrumb,
            filters,
            filterOptions,
            showUploadModal,
            uploadFiles,
            uploadProgress,
            uploadSpeed,
            uploadStartTime,
            uploading,
            dragOver,
            isDark,
            showDeleteModal,
            fileToDelete,
            deleting,
            usernameInput,
            fileInput,

            // Computed
            filteredFiles,
            totalUploadSize,

            // Methods
            hasPermission,
            handleLogin,
            handleLogout,
            checkAuth,
            loadFiles,
            refreshFiles,
            navigateHome,
            handleFileClick,
            downloadFile,
            copyDownloadLink,
            handleFileSelect,
            handleDrop,
            removeUploadFile,
            startUpload,
            closeUploadModal,
            getUploadFileIcon,
            calculateTimeRemaining,
            toggleTheme,
            showToast,
            closeToast,
            confirmDelete,
            cancelDelete,
            deleteFile,
            getFileIcon,
            getFileColor,
            formatFileSize,
            formatDate
        };
    }
}).mount('#app');