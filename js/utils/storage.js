// js/utils/storage.js - Утилиты для работы с localStorage

window.Storage = {
    keys: {
        token: 'authToken',
        theme: 'theme',
        viewMode: 'fileView',
        sortBy: 'fileSortBy',
        filter: 'fileFilter'
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
        return localStorage.getItem(this.keys.theme) || 'light';
    },
    
    setTheme(theme) {
        localStorage.setItem(this.keys.theme, theme);
    },
    
    // View preferences
    getViewMode() {
        return localStorage.getItem(this.keys.viewMode) || 'list';
    },
    
    setViewMode(mode) {
        localStorage.setItem(this.keys.viewMode, mode);
    },
    
    getSortBy() {
        return localStorage.getItem(this.keys.sortBy) || 'name';
    },
    
    setSortBy(sortBy) {
        localStorage.setItem(this.keys.sortBy, sortBy);
    },
    
    getFilter() {
        return localStorage.getItem(this.keys.filter) || 'all';
    },
    
    setFilter(filter) {
        localStorage.setItem(this.keys.filter, filter);
    },
    
    // Clear all data
    clearAll() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};