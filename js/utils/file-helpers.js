// js/utils/file-helpers.js - Вспомогательные функции для файлов

window.FileHelpers = {
    // Иконки для типов файлов
    icons: {
        directory: 'fas fa-folder',
        image: 'fas fa-image',
        document: 'fas fa-file-alt',
        archive: 'fas fa-file-archive',
        code: 'fas fa-code',
        iso: 'fas fa-compact-disc',
        pdf: 'fas fa-file-pdf',
        txt: 'fas fa-file-alt',
        video: 'fas fa-video',
        audio: 'fas fa-music',
        other: 'fas fa-file'
    },
    
    // Цвета для типов файлов
    colors: {
        directory: '#3b82f6',
        image: '#10b981',
        document: '#ef4444',
        archive: '#6366f1',
        code: '#14b8a6',
        iso: '#f59e0b',
        pdf: '#dc2626',
        video: '#8b5cf6',
        audio: '#ec4899',
        other: '#6b7280'
    },
    
    // Получить иконку файла
    getFileIcon(file) {
        if (file.type === 'directory') return this.icons.directory;
        if (file.extension === 'pdf') return this.icons.pdf;
        return this.icons[file.category] || this.icons.other;
    },
    
    // Получить цвет файла
    getFileColor(file) {
        if (file.type === 'directory') return this.colors.directory;
        if (file.extension === 'pdf') return this.colors.pdf;
        return this.colors[file.category] || this.colors.other;
    },
    
    // Форматировать размер файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Форматировать дату
    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Получить расширение файла
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },
    
    // Определить категорию файла
    getFileCategory(extension) {
        const categories = {
            image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'],
            document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'odt', 'ods', 'odp'],
            archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
            code: ['js', 'ts', 'jsx', 'tsx', 'php', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'css', 'html', 'json', 'xml', 'yml', 'yaml'],
            iso: ['iso', 'img', 'dmg', 'vhd', 'vhdx'],
            video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'],
            audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a']
        };
        
        for (const [category, extensions] of Object.entries(categories)) {
            if (extensions.includes(extension)) {
                return category;
            }
        }
        
        return 'other';
    },
    
    // Сортировка файлов
    sortFiles(files, sortBy = 'name') {
        return files.sort((a, b) => {
            // Папки всегда первые
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name, 'ru');
                case 'size':
                    return b.size - a.size;
                case 'date':
                    return b.modified - a.modified;
                case 'type':
                    const extA = a.extension || '';
                    const extB = b.extension || '';
                    return extA.localeCompare(extB);
                default:
                    return 0;
            }
        });
    },
    
    // Фильтрация файлов
    filterFiles(files, filter = 'all', searchQuery = '') {
        let filtered = [...files];
        
        // Фильтр по категории
        if (filter !== 'all') {
            filtered = filtered.filter(file => 
                file.type === 'directory' || file.category === filter
            );
        }
        
        // Поиск
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(file => 
                file.name.toLowerCase().includes(query)
            );
        }
        
        return filtered;
    },
    
    // Построить breadcrumb
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
    }
};