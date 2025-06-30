// js/utils/theme-state.js - Глобальное реактивное состояние темы

window.ThemeState = Vue.observable({
    isDark: true,
    
    init() {
        // Проверяем сохраненную тему
        const saved = localStorage.getItem('theme');
        
        if (saved === 'light') {
            Vue.set(this, 'isDark', false);
            document.documentElement.classList.remove('dark');
        } else {
            // По умолчанию темная
            Vue.set(this, 'isDark', true);
            document.documentElement.classList.add('dark');
            if (!saved) {
                localStorage.setItem('theme', 'dark');
            }
        }
    },
    
    toggle() {
        Vue.set(this, 'isDark', !this.isDark);
        
        if (this.isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        
        console.log('Theme toggled to:', this.isDark ? 'dark' : 'light');
        
        // Триггерим событие для дополнительной надежности
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: this.isDark } }));
    }
});