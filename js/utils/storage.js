// js/utils/storage.js - Утилиты для работы с localStorage (ES6 модуль)

export const Storage = {
    keys: {
        token: 'filemanager_authToken',
        theme: 'filemanager_theme',
        settings: 'filemanager_settings'
    },

    // Token management
    getToken() {
        try {
            return localStorage.getItem(this.keys.token) || '';
        } catch (e) {
            console.error('Failed to get token:', e);
            return '';
        }
    },

    setToken(token) {
        try {
            localStorage.setItem(this.keys.token, token);
        } catch (e) {
            console.error('Failed to set token:', e);
        }
    },

    clearToken() {
        try {
            localStorage.removeItem(this.keys.token);
        } catch (e) {
            console.error('Failed to clear token:', e);
        }
    },

    // Theme management
    getTheme() {
        try {
            return localStorage.getItem(this.keys.theme) || 'dark';
        } catch (e) {
            console.error('Failed to get theme:', e);
            return 'dark';
        }
    },

    setTheme(theme) {
        try {
            localStorage.setItem(this.keys.theme, theme);
        } catch (e) {
            console.error('Failed to set theme:', e);
        }
    },

    // Settings management
    getSettings() {
        try {
            const settings = localStorage.getItem(this.keys.settings);
            return settings ? JSON.parse(settings) : null;
        } catch (e) {
            console.error('Failed to parse settings:', e);
            return null;
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.keys.settings, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    },

    // Clear all data
    clearAll() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (e) {
            console.error('Failed to clear storage:', e);
        }
    },

    // Check if localStorage is available
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Также экспортируем в глобальную область для обратной совместимости
window.Storage = Storage;