// js/utils/file-helpers.js - Вспомогательные функции для файлов

window.FileHelpers = {
    // Иконки для типов файлов
    icons: {
        directory: 'fas fa-folder',
        image: 'fas fa-image',
        document: 'fas fa-file-alt',
        archive: 'fas fa-file-archive',
        code: 'fas fa-code',
        disk: 'fas fa-compact-disc',
        pdf: 'fas fa-file-pdf',
        txt: 'fas fa-file-alt',
        video: 'fas fa-video',
        audio: 'fas fa-music',
        excel: 'fas fa-file-excel',
        word: 'fas fa-file-word',
        powerpoint: 'fas fa-file-powerpoint',
        other: 'fas fa-file'
    },

    // Цвета для типов файлов
    colors: {
        directory: '#3b82f6',
        image: '#10b981',
        document: '#ef4444',
        archive: '#6366f1',
        code: '#14b8a6',
        disk: '#f59e0b',
        pdf: '#dc2626',
        video: '#8b5cf6',
        audio: '#ec4899',
        excel: '#10b981',
        word: '#2563eb',
        powerpoint: '#dc2626',
        other: '#6b7280'
    },

    // Расширения файлов по категориям
    categories: {
        image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif'],
        document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'odt', 'ods', 'odp', 'rtf'],
        archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tar.gz', 'tar.bz2', 'tar.xz'],
        code: ['js', 'ts', 'jsx', 'tsx', 'php', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'css', 'html', 'json', 'xml', 'yml', 'yaml', 'sh', 'bash'],
        disk: ['iso', 'img', 'dmg', 'vhd', 'vhdx', 'vmdk', 'vdi', 'qcow2', 'raw'],
        video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp'],
        audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'ape']
    },

    // Получить иконку файла
    getFileIcon(file) {
        if (file.type === 'directory') return this.icons.directory;

        const ext = file.extension?.toLowerCase();

        // Специальные иконки для определенных расширений
        if (ext === 'pdf') return this.icons.pdf;
        if (ext === 'txt') return this.icons.txt;
        if (['xls', 'xlsx'].includes(ext)) return this.icons.excel;
        if (['doc', 'docx'].includes(ext)) return this.icons.word;
        if (['ppt', 'pptx'].includes(ext)) return this.icons.powerpoint;

        // Иконки по категориям
        for (const [category, extensions] of Object.entries(this.categories)) {
            if (extensions.includes(ext)) {
                return this.icons[category] || this.icons.other;
            }
        }

        return this.icons.other;
    },

    // Получить иконку по расширению (для загрузки)
    getFileIconByExtension(extension) {
        const ext = extension.toLowerCase();

        // Специальные иконки
        if (ext === 'pdf') return this.icons.pdf;
        if (ext === 'txt') return this.icons.txt;
        if (['xls', 'xlsx'].includes(ext)) return this.icons.excel;
        if (['doc', 'docx'].includes(ext)) return this.icons.word;
        if (['ppt', 'pptx'].includes(ext)) return this.icons.powerpoint;

        // По категориям
        for (const [category, extensions] of Object.entries(this.categories)) {
            if (extensions.includes(ext)) {
                return this.icons[category] || this.icons.other;
            }
        }

        return this.icons.other;
    },

    // Получить цвет файла
    getFileColor(file) {
        if (file.type === 'directory') return this.colors.directory;

        const ext = file.extension?.toLowerCase();

        // Специальные цвета
        if (ext === 'pdf') return this.colors.pdf;
        if (['xls', 'xlsx'].includes(ext)) return this.colors.excel;
        if (['doc', 'docx'].includes(ext)) return this.colors.word;
        if (['ppt', 'pptx'].includes(ext)) return this.colors.powerpoint;

        // Цвета по категориям
        for (const [category, extensions] of Object.entries(this.categories)) {
            if (extensions.includes(ext)) {
                return this.colors[category] || this.colors.other;
            }
        }

        return this.colors.other;
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

        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleDateString('ru-RU', options);
    }
};