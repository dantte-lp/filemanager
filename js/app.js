// js/app.js - Основное Vue приложение

// Ждем загрузки DOM и всех компонентов
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Vue приложения
    const app = new Vue({
        el: '#app',
        
        data: {
            // Auth state
            showAuthModal: true,
            authError: '',
            authLoading: false,
            currentUser: null,
            
            // Toast state
            toast: {
                show: false,
                message: '',
                type: 'success' // success, error, info
            }
        },
        
        computed: {
            isAuthenticated() {
                return !!this.currentUser && Storage.getToken();
            }
        },
        
        methods: {
            async handleLogin(credentials) {
                this.authLoading = true;
                this.authError = '';
                
                try {
                    const response = await API.login(credentials);
                    
                    if (response.success) {
                        this.currentUser = response.user;
                        this.showAuthModal = false;
                        this.showToast('Вход выполнен успешно!', 'success');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    
                    if (error.message === 'Invalid credentials') {
                        this.authError = 'Неверный логин или пароль';
                    } else if (error.message === 'Network error') {
                        this.authError = 'Ошибка подключения к серверу';
                    } else {
                        this.authError = 'Произошла ошибка при входе';
                    }
                } finally {
                    this.authLoading = false;
                }
            },
            
            handleLogout() {
                API.logout();
                this.currentUser = null;
                this.showAuthModal = true;
                this.authError = '';
                this.showToast('Вы вышли из системы', 'info');
            },
            
            showToast(message, type = 'success') {
                this.toast = {
                    show: true,
                    message,
                    type
                };
                
                // Автоматически скрываем через 3 секунды
                setTimeout(() => {
                    this.closeToast();
                }, 3000);
            },
            
            closeToast() {
                this.toast.show = false;
            },
            
            async checkAuth() {
                // Проверяем сохраненный токен
                const token = Storage.getToken();
                if (!token) return;
                
                try {
                    const user = await API.checkAuth();
                    if (user) {
                        this.currentUser = user;
                        this.showAuthModal = false;
                    } else {
                        // Токен невалидный
                        Storage.clearToken();
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    Storage.clearToken();
                }
            },
            
            initializeTheme() {
                // Инициализируем глобальное состояние темы
                window.ThemeState.init();
            }
        },
        
        mounted() {
            // Инициализация темы
            this.initializeTheme();
            
            // Проверка авторизации
            this.checkAuth();
            
            // Глобальная обработка ошибок
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                this.showToast('Произошла непредвиденная ошибка', 'error');
            });
            
            // Глобальные события для toast уведомлений
            this.$root.$on('show-toast', (message, type) => {
                this.showToast(message, type);
            });
        },
        
        beforeDestroy() {
            this.$root.$off('show-toast');
        }
    });
    
    // Делаем app доступным глобально для отладки
    window.app = app;
});