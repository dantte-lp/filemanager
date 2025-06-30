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
            if (error.message === 'Failed to fetch') {
                return await this.loginOldApi(credentials);
            }
            throw error;
        }
    },
    
    // Логин через старый API
    async loginOldApi(credentials) {
        const basicToken = btoa(`${credentials.username}:${credentials.password}`);
        
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
        } else {
            throw new Error('Invalid credentials');
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
            throw new Error('Failed to load files');
        }
        
        return await response.json();
    },
    
    // Получить ссылку на скачивание
    async getDownloadLink(path) {
        const response = await fetch(`${this.oldApiUrl}?action=download&file=${encodeURIComponent(path)}`, {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to get download link');
        }
        
        return await response.json();
    },
    
    // Поиск файлов
    async searchFiles(query, path = '') {
        try {
            const response = await fetch(`${this.oldApiUrl}?action=search&q=${encodeURIComponent(query)}&path=${encodeURIComponent(path)}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Search failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Search API error:', error);
            throw error;
        }
    }
};