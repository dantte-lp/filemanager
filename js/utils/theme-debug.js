// js/utils/theme-debug.js - Отладка темы

window.ThemeDebug = {
    // Показать текущее состояние темы
    status() {
        console.log('=== Theme Status ===');
        console.log('HTML classes:', document.documentElement.className);
        console.log('Has dark class:', document.documentElement.classList.contains('dark'));
        console.log('LocalStorage theme:', localStorage.getItem('theme'));
        console.log('System prefers dark:', window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        // Проверка Tailwind
        const testEl = document.createElement('div');
        testEl.className = 'bg-white dark:bg-gray-900';
        document.body.appendChild(testEl);
        const computed = window.getComputedStyle(testEl);
        const bgColor = computed.backgroundColor;
        document.body.removeChild(testEl);
        console.log('Test element bg color:', bgColor);
        console.log('Tailwind dark mode working:', bgColor === 'rgb(17, 24, 39)' || bgColor === 'rgb(17, 24, 39, 1)' ? 'YES' : 'NO');
    },
    
    // Переключить тему вручную
    toggle() {
        const isDark = document.documentElement.classList.contains('dark');
        console.log('Current theme:', isDark ? 'dark' : 'light');
        
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            console.log('Switched to: light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            console.log('Switched to: dark');
        }
        
        this.status();
    },
    
    // Сбросить тему
    reset() {
        document.documentElement.classList.remove('dark');
        localStorage.removeItem('theme');
        console.log('Theme reset completed');
        this.status();
    },
    
    // Мониторинг изменений
    monitor() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    console.log('HTML class changed:', document.documentElement.className);
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        console.log('Theme monitoring started. Changes will be logged.');
        return observer;
    }
};

// Автоматически показываем статус при загрузке
if (window.location.hostname === 'localhost' || window.location.hostname.includes('test')) {
    setTimeout(() => {
        console.log('%c Theme Debug Loaded. Use ThemeDebug.status() to check theme state.', 'color: blue; font-weight: bold');
        ThemeDebug.status();
    }, 1000);
}