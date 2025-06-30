// js/utils/api.js - API утилиты

window.API = {
    baseUrl: '/api',
    oldApiUrl: '/api.php',

    // Получить заголовки авторизации
    getAuthHeaders() {
        const token = Storage.getToken();
        if (!token) return {};

        // Проверяем формат токена
        if (token.includes(':')) {
            // Старый формат (Basic auth)
            return { 'Authorization': `Basic ${token}` };
        } else {
            // Новый формат (Bearer token)
            return { 'Authorization': `Bearer ${token}` };
        }
    },

    // Логин
    async login(credentials) {
        try {
            // Сначала пробуем новый API
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (response.ok) {
                const data = await response.json();
                Storage.setToken(data.token);
                return data;
            } else if (response.status === 404) {
                // Fallback на старый API
                return await this.loginOldApi(credentials);
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            // Если новый API недоступен, пробуем старый
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                return await this.loginOldApi(credentials);
            }
            throw error;
        }
    },

    // Логин через старый API (Basic Auth)
    async loginOldApi(credentials) {
        const basicToken = btoa(`${credentials.username}:${credentials.password}`);

        try {
            const response = await fetch(`${this.oldApiUrl}?action=list`, {
                headers: { 'Authorization': `Basic ${basicToken}` }
            });

            if (response.ok) {
                Storage.setToken(basicToken);
                return {
                    success: true,
                    token: basicToken,
                    user: {
                        username: credentials.username,
                        name: credentials.username
                    }
                };
            } else if (response.status === 401) {
                throw new Error('Invalid credentials');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            if (error.message === 'Invalid credentials') {
                throw error;
            }
            throw new Error('Network error');
        }
    },

    // Проверка авторизации
    async checkAuth() {
        try {
            const token = Storage.getToken();
            if (!token) return null;

            if (token.includes(':')) {
                // Старый формат - проверяем через list
                const response = await fetch(`${this.oldApiUrl}?action=list&dir=`, {
                    headers: this.getAuthHeaders()
                });

                if (response.ok) {
                    const username = atob(token).split(':')[0];
                    return { username, name: username };
                }
            } else {
                // Новый формат
                const response = await fetch(`${this.baseUrl}/me`, {
                    headers: this.getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.user;
                } else if (response.status === 404) {
                    // Fallback на проверку через старый API
                    const listResponse = await fetch(`${this.oldApiUrl}?action=list&dir=`, {
                        headers: this.getAuthHeaders()
                    });

                    if (listResponse.ok) {
                        return { username: 'user', name: 'User' };
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Auth check failed:', error);
            return null;
        }
    },

    // Выход
    logout() {
        Storage.clearToken();
    },

    // Получить список файлов
    async getFiles(path = '') {
        const response = await fetch(`${this.oldApiUrl}?action=list&dir=${encodeURIComponent(path)}`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                Storage.clearToken();
                window.location.reload();
            }
            throw new Error('Failed to load files');
        }

        const data = await response.json();

        // Обработка ошибок в ответе
        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    },

    // Получить ссылку на скачивание
    async getDownloadLink(path) {
        const response = await fetch(`${this.oldApiUrl}?action=download&file=${encodeURIComponent(path)}`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to get download link');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    }
};