// js/components/file-manager/file-manager.js

Vue.component('file-manager', {
    template: '#file-manager-template',
    props: {
        user: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            // State
            loading: false,
            downloading: false,
            downloadProgress: 0,
            showUploadModal: false,
            
            // Files
            currentPath: '',
            allFiles: [],
            filteredFiles: [],
            breadcrumb: [],
            
            // Filters
            filters: {
                searchQuery: '',
                sortBy: Storage.getSortBy(),
                viewMode: Storage.getViewMode(),
                currentFilter: Storage.getFilter()
            }
        };
    },
    watch: {
        'filters.searchQuery': 'applyFilters',
        'filters.sortBy': 'applyFilters',
        'filters.currentFilter': 'applyFilters'
    },
    methods: {
        async loadFiles(path = '') {
            this.loading = true;
            this.currentPath = path;
            
            try {
                const data = await API.getFiles(path);
                this.allFiles = data.items || [];
                this.breadcrumb = FileHelpers.buildBreadcrumb(path);
                this.applyFilters();
            } catch (error) {
                console.error('Error loading files:', error);
                this.$root.$emit('show-toast', 'Ошибка загрузки файлов', 'error');
                this.allFiles = [];
                this.filteredFiles = [];
            } finally {
                this.loading = false;
            }
        },
        
        applyFilters() {
            // Фильтрация
            let files = FileHelpers.filterFiles(
                this.allFiles, 
                this.filters.currentFilter, 
                this.filters.searchQuery
            );
            
            // Сортировка
            files = FileHelpers.sortFiles(files, this.filters.sortBy);
            
            this.filteredFiles = files;
            
            // Сохраняем настройки
            Storage.setSortBy(this.filters.sortBy);
            Storage.setFilter(this.filters.currentFilter);
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
                
                // Создаем iframe для скачивания
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = data.download_url;
                document.body.appendChild(iframe);
                
                // Удаляем через 5 секунд
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 5000);
                
                this.$root.$emit('show-toast', 'Загрузка началась', 'success');
            } catch (error) {
                console.error('Download error:', error);
                this.$root.$emit('show-toast', 'Ошибка при скачивании файла', 'error');
            }
        },
        
        async copyDownloadLink(file) {
            try {
                const data = await API.getDownloadLink(file.relativePath);
                const fullUrl = window.location.origin + data.download_url;
                
                // Копируем в буфер обмена
                try {
                    await navigator.clipboard.writeText(fullUrl);
                    this.$root.$emit('show-toast', 'Ссылка скопирована!', 'success');
                } catch (err) {
                    // Fallback для старых браузеров
                    this.fallbackCopyToClipboard(fullUrl);
                }
            } catch (error) {
                console.error('Copy link error:', error);
                this.$root.$emit('show-toast', 'Ошибка при копировании ссылки', 'error');
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
                this.$root.$emit('show-toast', 'Ссылка скопирована!', 'success');
            } catch (err) {
                prompt('Скопируйте ссылку:', text);
            }
            
            document.body.removeChild(textArea);
        },
        
        refreshFiles() {
            this.loadFiles(this.currentPath);
        },
        
        navigateHome() {
            this.loadFiles('');
        },
        
        showUpload() {
            this.showUploadModal = true;
        },
        
        handleUploadComplete() {
            this.showUploadModal = false;
            this.refreshFiles();
        },
        
        toggleTheme() {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                document.documentElement.classList.remove('dark');
                Storage.setTheme('light');
            } else {
                document.documentElement.classList.add('dark');
                Storage.setTheme('dark');
            }
            
            // Триггерим кастомное событие
            window.dispatchEvent(new Event('theme-changed'));
            
            // Форсируем обновление всех компонентов
            this.$forceUpdate();
            this.$children.forEach(child => {
                if (child.$forceUpdate) {
                    child.$forceUpdate();
                }
            });
        },
        
        async performGlobalSearch() {
            if (!this.filters.searchQuery) return;
            
            this.globalSearchLoading = true;
            this.loading = true;
            
            try {
                const results = await API.searchFiles(this.filters.searchQuery, '');
                
                // Проверяем, что получили корректный ответ
                if (results.error) {
                    throw new Error(results.error);
                }
                
                this.allFiles = results.results || [];
                this.breadcrumb = [{name: 'Результаты поиска', path: ''}];
                this.applyFilters();
                this.$root.$emit('show-toast', `Найдено файлов: ${results.total || 0}`, 'info');
            } catch (error) {
                console.error('Search error:', error);
                this.$root.$emit('show-toast', 'Ошибка поиска', 'error');
                this.allFiles = [];
                this.filteredFiles = [];
            } finally {
                this.globalSearchLoading = false;
                this.loading = false;
            }
        },
        
        handleSearchModeChange(mode) {
            this.searchMode = mode;
            if (mode === 'global' && this.filters.searchQuery) {
                this.performGlobalSearch();
            } else if (mode === 'current') {
                this.loadFiles(this.currentPath);
            }
        }
    },
    mounted() {
        // Загружаем корневую директорию
        this.loadFiles('');
        
        // Слушаем события фильтров
        this.$on('update-filters', (newFilters) => {
            Object.assign(this.filters, newFilters);
        });
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            // Ctrl+K или Cmd+K для поиска
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }
});