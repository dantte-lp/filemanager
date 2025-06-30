// js/utils/file-helpers.js - Вспомогательные функции для файлов (ES6 модуль)

export const FileHelpers = {
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
        disk: ['iso', 'img', 'dmg', 'vhd', 'vhdx', 'vmdk', 'vdi', 'qcow2', 'raw', 'qcow', 'qed', 'ovf', 'ova', 'vbox-extpack', 'nvram', 'vmx', 'vmsd', 'vmsn', 'vmss'],
        video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp'],
        audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'ape']
    },

    // Получить иконку файла
    getFileIcon(file) {
        if (!file) return this.icons.other;

        if (file.type === 'directory') return this.icons.directory;

        const ext = file.extension?.toLowerCase();
        if (!ext) return this.icons.other;

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
        if (!extension) return this.icons.other;

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
        if (!file) return this.colors.other;

        if (file.type === 'directory') return this.colors.directory;

        const ext = file.extension?.toLowerCase();
        if (!ext) return this.colors.other;

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
        if (typeof bytes !== 'number' || bytes < 0) return '0 B';
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        if (i >= sizes.length) return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(2)} ${sizes[sizes.length - 1]}`;

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },

    // Форматировать дату
    formatDate(timestamp) {
        if (!timestamp) return '-';

        const date = new Date(timestamp * 1000);

        if (isNaN(date.getTime())) return '-';

        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        try {
            return date.toLocaleDateString('ru-RU', options);
        } catch (e) {
            return date.toLocaleDateString('en-US', options);
        }
    },

    // Получить расширение файла
    getFileExtension(filename) {
        if (!filename || typeof filename !== 'string') return '';

        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1 || lastDot === filename.length - 1) return '';

        return filename.substring(lastDot + 1).toLowerCase();
    },

    // Получить имя файла без расширения
    getFileNameWithoutExtension(filename) {
        if (!filename || typeof filename !== 'string') return '';

        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1) return filename;

        return filename.substring(0, lastDot);
    },

    // Определить MIME тип по расширению
    getMimeType(extension) {
        const mimeTypes = {
            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'ico': 'image/x-icon',

            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',

            // Archives
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'tar': 'application/x-tar',
            'gz': 'application/gzip',

            // Code
            'js': 'application/javascript',
            'json': 'application/json',
            'html': 'text/html',
            'css': 'text/css',
            'xml': 'application/xml',

            // Video
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
            'mov': 'video/quicktime',
            'webm': 'video/webm',

            // Audio
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac'
        };

        return mimeTypes[extension?.toLowerCase()] || 'application/octet-stream';
    }
};

// Также экспортируем в глобальную область для обратной совместимости
window.FileHelpers = FileHelpers;