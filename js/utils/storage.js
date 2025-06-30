// js/utils/storage.js - Утилиты для работы с localStorage

window.Storage = {
    keys: {
        token: 'filemanager_authToken',
        theme: 'filemanager_theme',
        settings: 'filemanager_settings'
    },

    // Token management
    getToken() {
        return localStorage.getItem(this.keys.token) || '';
    },

    setToken(token) {
        localStorage.setItem(this.keys.token, token);
    },

    clearToken() {
        localStorage.removeItem(this.keys.token);
    },

    // Theme management
    getTheme() {
        return localStorage.getItem(this.keys.theme) || 'dark';
    },

    setTheme(theme) {
        localStorage.setItem(this.keys.theme, theme);
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
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};