// js/app.js - Основное Vue приложение

new Vue({
    el: '#app',

    data: {
        // Auth
        showAuthModal: true,
        authError: '',
        authLoading: false,
        currentUser: null,
        loginForm: {
            username: '',
            password: ''
        },

        // Toast
        toast: {
            show: false,
            message: '',
            type: 'success'
        },

        // Files
        loading: false,
        currentPath: '',
        allFiles: [],
        breadcrumb: [],

        // Filters
        filters: {
            searchQuery: '',
            sortBy: 'name',
            sortReverse: false,
            viewMode: 'list',
            currentFilter: 'all'
        },

        filterOptions: [
            { value: 'all', label: 'Все', icon: '📁' },
            { value: 'image', label: 'Изображения', icon: '🖼️' },
            { value: 'document', label: 'Документы', icon: '📄' },
            { value: 'archive', label: 'Архивы', icon: '📦' },
            { value: 'disk', label: 'Образы дисков', icon: '💿' }
        ],

        // Upload
        showUploadModal: false,
        uploadFiles: [],
        uploadProgress: {},
        uploadSpeed: {},
        uploadStartTime: {},
        uploading: false,
        dragOver: false,

        // Theme
        isDark: false,

        // Delete
        showDeleteModal: false,
        fileToDelete: null,
        deleting: false
    },

    computed: {
        filteredFiles() {
            let files = [...this.allFiles];

            // Поиск в текущей папке
            if (this.filters.searchQuery) {
                const query = this.filters.searchQuery.toLowerCase();
                files = files.filter(file =>
                    file.name.toLowerCase().includes(query)
                );
            }

            // Фильтрация по типу
            if (this.filters.currentFilter !== 'all') {
                files = files.filter(file => {
                    if (file.type === 'directory') return true;

                    const filterExtensions = FileHelpers.categories[this.filters.currentFilter];
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
                switch (this.filters.sortBy) {
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

                return this.filters.sortReverse ? -result : result;
            });

            return files;
        },

        totalUploadSize() {
            const total = this.uploadFiles.reduce((sum, file) => sum + file.size, 0);
            return this.formatFileSize(total);
        }
    },

    methods: {
        // Helper method для проверки прав
        hasPermission(permission) {
            return this.currentUser?.permissions?.[permission] === true;
        },

        // Auth methods
        async handleLogin() {
            if (!this.loginForm.username || !this.loginForm.password) return;

            this.authLoading = true;
            this.authError = '';

            try {
                const response = await API.login(this.loginForm);

                if (response.success) {
                    this.currentUser = response.user;
                    this.showAuthModal = false;
                    this.showToast('Вход выполнен успешно!', 'success');
                    this.loadFiles('');
                }
            } catch (error) {
                console.error('Login error:', error);
                this.authError = error.message === 'Invalid credentials'
                    ? 'Неверный логин или пароль'
                    : 'Ошибка подключения к серверу';
            } finally {
                this.authLoading = false;
            }
        },

        handleLogout() {
            API.logout();
            this.currentUser = null;
            this.showAuthModal = true;
            this.loginForm = { username: '', password: '' };
            this.authError = '';
            this.showToast('Вы вышли из системы', 'info');
        },

        async checkAuth() {
            const token = Storage.getToken();
            if (!token) return;

            try {
                const user = await API.checkAuth();
                if (user) {
                    this.currentUser = user;
                    this.showAuthModal = false;
                    this.loadFiles('');
                } else {
                    Storage.clearToken();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                Storage.clearToken();
            }
        },

        // File methods
        async loadFiles(path = '') {
            this.loading = true;
            this.currentPath = path;

            try {
                const data = await API.getFiles(path);
                this.allFiles = data.items || [];
                this.breadcrumb = this.buildBreadcrumb(path);
            } catch (error) {
                console.error('Error loading files:', error);
                this.showToast('Ошибка загрузки файлов', 'error');
                this.allFiles = [];
            } finally {
                this.loading = false;
            }
        },

        refreshFiles() {
            this.loadFiles(this.currentPath);
        },

        navigateHome() {
            this.loadFiles('');
        },

        handleFileClick(file) {
            if (file.type === 'directory') {
                this.loadFiles(file.relativePath);
            } else {
                this.downloadFile(file);
            }
        },

        async downloadFile(file) {
            try {
                const data = await API.getDownloadLink(file.relativePath);

                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = data.download_url;
                document.body.appendChild(iframe);

                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 5000);

                this.showToast('Загрузка началась', 'success');
            } catch (error) {
                console.error('Download error:', error);
                this.showToast('Ошибка при скачивании файла', 'error');
            }
        },

        async copyDownloadLink(file) {
            try {
                const data = await API.getDownloadLink(file.relativePath);
                const fullUrl = window.location.origin + data.download_url;

                try {
                    await navigator.clipboard.writeText(fullUrl);
                    this.showToast('Ссылка скопирована!', 'success');
                } catch (err) {
                    this.fallbackCopyToClipboard(fullUrl);
                }
            } catch (error) {
                console.error('Copy link error:', error);
                this.showToast('Ошибка при копировании ссылки', 'error');
            }
        },

        fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                this.showToast('Ссылка скопирована!', 'success');
            } catch (err) {
                prompt('Скопируйте ссылку:', text);
            }

            document.body.removeChild(textArea);
        },

        buildBreadcrumb(path) {
            if (!path) return [];

            const parts = path.split('/').filter(p => p);
            const breadcrumb = [];
            let currentPath = '';

            parts.forEach(part => {
                currentPath += (currentPath ? '/' : '') + part;
                breadcrumb.push({
                    name: part,
                    path: currentPath
                });
            });

            return breadcrumb;
        },

        // Upload methods
        handleFileSelect(event) {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                // Ограничиваем одним файлом
                this.uploadFiles = [files[0]];
                this.uploadProgress = {};
                this.$set(this.uploadProgress, files[0].name, 0);
            }
            // Очищаем input для возможности выбрать тот же файл снова
            event.target.value = '';
        },

        handleDrop(event) {
            this.dragOver = false;
            const files = Array.from(event.dataTransfer.files);
            if (files.length > 0) {
                // Ограничиваем одним файлом
                this.uploadFiles = [files[0]];
                this.uploadProgress = {};
                this.$set(this.uploadProgress, files[0].name, 0);
            }
        },


        removeUploadFile(index) {
            const file = this.uploadFiles[index];
            delete this.uploadProgress[file.name];
            this.uploadFiles.splice(index, 1);
        },

        async startUpload() {
            if (this.uploadFiles.length === 0) return;

            this.uploading = true;

            for (const file of this.uploadFiles) {
                try {
                    await this.uploadFile(file);
                } catch (error) {
                    console.error('Upload error:', error);
                    this.showToast(`Ошибка загрузки ${file.name}`, 'error');
                }
            }

            this.uploading = false;
            this.showToast('Загрузка завершена', 'success');
            this.closeUploadModal();
            this.refreshFiles();
        },

        async uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', this.currentPath);

            const xhr = new XMLHttpRequest();

            // Время начала загрузки
            this.$set(this.uploadStartTime, file.name, Date.now());
            let lastLoaded = 0;
            let lastTime = Date.now();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    this.$set(this.uploadProgress, file.name, progress);

                    // Вычисляем скорость
                    const currentTime = Date.now();
                    const timeDiff = (currentTime - lastTime) / 1000; // в секундах

                    if (timeDiff > 0.1) { // Обновляем скорость каждые 100мс
                        const bytesDiff = e.loaded - lastLoaded;
                        const speed = bytesDiff / timeDiff; // байт в секунду

                        this.$set(this.uploadSpeed, file.name, this.formatSpeed(speed));

                        lastLoaded = e.loaded;
                        lastTime = currentTime;
                    }
                }
            });

            return new Promise((resolve, reject) => {
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        // Очищаем данные о скорости после завершения
                        this.$delete(this.uploadSpeed, file.name);
                        this.$delete(this.uploadStartTime, file.name);
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    this.$delete(this.uploadSpeed, file.name);
                    this.$delete(this.uploadStartTime, file.name);
                    reject(new Error('Network error'));
                });

                xhr.open('POST', '/api/upload');
                xhr.setRequestHeader('Authorization', API.getAuthHeaders().Authorization);
                xhr.send(formData);
            });
        },

        formatSpeed(bytesPerSecond) {
            if (bytesPerSecond < 1024) {
                return bytesPerSecond.toFixed(0) + ' B/s';
            } else if (bytesPerSecond < 1024 * 1024) {
                return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
            } else if (bytesPerSecond < 1024 * 1024 * 1024) {
                return (bytesPerSecond / (1024 * 1024)).toFixed(1) + ' MB/s';
            } else {
                return (bytesPerSecond / (1024 * 1024 * 1024)).toFixed(1) + ' GB/s';
            }
        },

        closeUploadModal() {
            this.showUploadModal = false;
            this.uploadFiles = [];
            this.uploadProgress = {};
            this.uploadSpeed = {};
            this.uploadStartTime = {};
            this.dragOver = false;
        },

        getUploadFileIcon(file) {
            const ext = file.name.split('.').pop().toLowerCase();
            return FileHelpers.getFileIconByExtension(ext);
        },

        // Theme methods
        toggleTheme() {
            this.isDark = !this.isDark;

            if (this.isDark) {
                document.documentElement.classList.add('dark');
                Storage.setTheme('dark');
            } else {
                document.documentElement.classList.remove('dark');
                Storage.setTheme('light');
            }
        },

        initTheme() {
            const savedTheme = Storage.getTheme();
            this.isDark = savedTheme === 'dark';

            if (this.isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },

        // Toast methods
        showToast(message, type = 'success') {
            this.toast = {
                show: true,
                message,
                type
            };

            setTimeout(() => {
                this.closeToast();
            }, 3000);
        },

        closeToast() {
            this.toast.show = false;
        },

        // Helper methods
        getFileIcon(file) {
            return FileHelpers.getFileIcon(file);
        },

        getFileColor(file) {
            return FileHelpers.getFileColor(file);
        },

        formatFileSize(bytes) {
            return FileHelpers.formatFileSize(bytes);
        },

        formatDate(timestamp) {
            return FileHelpers.formatDate(timestamp);
        },

        calculateTimeRemaining(file) {
            const progress = this.uploadProgress[file.name] || 0;
            const startTime = this.uploadStartTime[file.name];

            if (!startTime || progress === 0 || progress === 100) {
                return '';
            }

            const elapsedTime = Date.now() - startTime;
            const totalTime = (elapsedTime / progress) * 100;
            const remainingTime = totalTime - elapsedTime;

            // Конвертируем в секунды
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
        },

        // Delete methods
        confirmDelete(file) {
            this.fileToDelete = file;
            this.showDeleteModal = true;
        },

        cancelDelete() {
            this.fileToDelete = null;
            this.showDeleteModal = false;
        },

        async deleteFile() {
            if (!this.fileToDelete) return;

            this.deleting = true;

            try {
                await API.deleteFile(this.fileToDelete.relativePath);
                this.showToast('Файл удален успешно', 'success');
                this.showDeleteModal = false;
                this.fileToDelete = null;
                // Обновляем список файлов
                this.refreshFiles();
            } catch (error) {
                console.error('Delete error:', error);
                this.showToast(error.message || 'Ошибка при удалении файла', 'error');
            } finally {
                this.deleting = false;
            }
        }
    },

    mounted() {
        this.initTheme();
        this.checkAuth();

        // Focus на поле username при открытии
        this.$nextTick(() => {
            if (this.$refs.usernameInput) {
                this.$refs.usernameInput.focus();
            }
        });

        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            // F5 для обновления
            if (e.key === 'F5') {
                e.preventDefault();
                this.refreshFiles();
            }
        });

        // Восстановление настроек
        const savedSettings = Storage.getSettings();
        if (savedSettings) {
            Object.assign(this.filters, savedSettings);
        }
    },

    watch: {
        filters: {
            deep: true,
            handler(newFilters) {
                Storage.saveSettings({
                    sortBy: newFilters.sortBy,
                    sortReverse: newFilters.sortReverse,
                    viewMode: newFilters.viewMode,
                    currentFilter: newFilters.currentFilter
                });
            }
        }
    }
});