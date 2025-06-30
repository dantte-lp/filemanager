# Файловый менеджер с веб-интерфейсом

Современный файловый менеджер с веб-интерфейсом, поддержкой RBAC (ролевой модели доступа), темной темой и удобным управлением файлами.

## 🚀 Возможности

### Основной функционал
- ✅ **Авторизация** - безопасная аутентификация с хешированием паролей (bcrypt)
- ✅ **RBAC** - ролевая модель доступа (администратор/пользователь)
- ✅ **Просмотр файлов** - навигация по директориям с хлебными крошками
- ✅ **Загрузка файлов** - drag & drop, прогресс загрузки, транслитерация кириллицы
- ✅ **Скачивание файлов** - безопасное скачивание с временными токенами
- ✅ **Удаление файлов** - только для администраторов, с подтверждением
- ✅ **Поиск** - поиск файлов в текущей папке в реальном времени
- ✅ **Фильтрация** - по типам файлов (изображения, документы, архивы, образы дисков)
- ✅ **Сортировка** - по имени, размеру, дате, типу (с реверсом)
- ✅ **Темы** - светлая и темная тема с сохранением выбора

### Интерфейс
- 📱 **Адаптивный дизайн** - работает на мобильных устройствах
- 🎨 **Два режима отображения** - список и плитка
- 📋 **Копирование ссылок** - быстрое копирование ссылок на скачивание
- 🔄 **Обновление без перезагрузки** - AJAX для всех операций
- 🎯 **Интуитивный UI** - современный интерфейс на Vue.js и Tailwind CSS

### Безопасность
- 🔐 **Хеширование паролей** - bcrypt с солью
- 🛡️ **Защита от path traversal** - валидация всех путей
- 🔑 **Временные токены** - для безопасного скачивания
- 👥 **Ролевая модель** - разграничение прав доступа

## 📋 Требования

### Минимальные требования
- PHP 7.2+
- Nginx или Apache
- PHP-FPM
- Поддержка .htaccess (для Apache)

### Рекомендуемые
- PHP 8.0+
- Nginx 1.18+
- SSL сертификат

## 🛠️ Установка

### 1. Традиционная установка

#### Клонирование репозитория
```bash
cd /var/www
git clone https://github.com/your-repo/filemanager.git fileserver
cd fileserver
```

#### Настройка прав доступа
```bash
# Создаем группу для веб-сервисов
sudo groupadd webdata

# Добавляем пользователей в группу
sudo usermod -a -G webdata nginx
sudo usermod -a -G webdata php-fpm

# Устанавливаем права на директорию с файлами
sudo chown -R nginx:webdata /data
sudo chmod -R 775 /data
sudo find /data -type d -exec chmod g+s {} \;

# Права на директорию приложения
sudo chown -R nginx:nginx /var/www/fileserver
sudo chmod -R 755 /var/www/fileserver

# Перезапускаем сервисы
sudo systemctl restart php-fpm
sudo systemctl restart nginx
```

#### SELinux (если включен)
```bash
# Разрешаем httpd работать с файлами
sudo setsebool -P httpd_unified 1

# Или более точная настройка
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/data(/.*)?"
sudo restorecon -Rv /data
```

#### Настройка пользователей
```bash
# Запустите утилиту генерации паролей
php generate-password.php

# Или отредактируйте напрямую
vim config/users.php
```

### 2. Установка через Docker

#### Использование Docker Compose (рекомендуется)
```bash
# Клонируйте репозиторий
git clone https://github.com/your-repo/filemanager.git
cd filemanager

# Создайте директорию для данных
mkdir -p ./data

# Запустите контейнеры
docker-compose up -d

# Проверьте логи
docker-compose logs -f
```

#### Использование только Docker
```bash
# Сборка образа
docker build -t filemanager .

# Запуск контейнера
docker run -d \
  --name filemanager \
  -p 8080:80 \
  -v $(pwd)/data:/data \
  -v $(pwd)/config:/var/www/fileserver/config \
  filemanager
```

## ⚙️ Конфигурация

### Nginx конфигурация
Пример конфигурации находится в файле `nginx.conf`. Основные моменты:
- Поддержка больших файлов (до 100MB)
- Правильная обработка API endpoints
- Защита конфигурационных файлов
- CORS заголовки для API

### Настройка пользователей (config/users.php)
```php
return [
    'users' => [
        'admin' => [
            'password' => '$2y$10$...',  // Хеш пароля
            'role' => 'admin'             // Полный доступ
        ],
        'user' => [
            'password' => '$2y$10$...',   // Хеш пароля
            'role' => 'user'              // Без удаления
        ]
    ],
    'permissions' => [
        'admin' => [
            'view' => true,
            'download' => true,
            'upload' => true,
            'delete' => true
        ],
        'user' => [
            'view' => true,
            'download' => true,
            'upload' => true,
            'delete' => false
        ]
    ]
];
```

## 👥 Управление пользователями

### Создание нового пользователя
```bash
php generate-password.php
# Выберите опцию 1
# Введите имя пользователя
# Выберите роль (admin/user)
# Введите пароль
```

### Роли и права доступа

| Действие | Admin | User |
|----------|-------|------|
| Просмотр файлов | ✅ | ✅ |
| Скачивание | ✅ | ✅ |
| Загрузка | ✅ | ✅ |
| Удаление | ✅ | ❌ |

## 🔧 Настройка API

### Основные endpoints
- `GET /api.php?action=list&dir=path` - список файлов
- `GET /api.php?action=download&file=path` - получить ссылку на скачивание
- `GET /api.php?action=get&token=xxx` - скачать файл
- `GET /api.php?action=delete&file=path` - удалить файл
- `POST /api/upload` - загрузить файл

### Новые API endpoints
- `POST /api/login` - авторизация
- `GET /api/me` - информация о текущем пользователе

## 📁 Структура проекта

```
fileserver/
├── index.html          # Главная страница
├── api.php            # Backend API
├── .htaccess          # Конфигурация Apache
├── favicon.ico        # Иконка сайта
├── generate-password.php  # Утилита для генерации паролей
├── config/
│   └── users.php      # Конфигурация пользователей
├── js/
│   ├── app.js         # Основное приложение Vue.js
│   └── utils/
│       ├── api.js     # API функции
│       ├── storage.js # LocalStorage утилиты
│       └── file-helpers.js  # Вспомогательные функции
├── Dockerfile         # Docker образ
├── docker-compose.yml # Docker Compose конфигурация
└── nginx.conf        # Конфигурация Nginx
```

## 🐳 Docker

### Переменные окружения
- `PHP_MEMORY_LIMIT` - лимит памяти PHP (по умолчанию: 256M)
- `PHP_MAX_UPLOAD` - максимальный размер загрузки (по умолчанию: 100M)
- `PHP_MAX_POST` - максимальный размер POST (по умолчанию: 100M)

### Volumes
- `/data` - директория с файлами
- `/var/www/fileserver/config` - конфигурация пользователей

### Пример docker-compose.yml с SSL
```yaml
version: '3.8'

services:
  filemanager:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data:/data
      - ./config:/var/www/fileserver/config
      - ./ssl:/etc/nginx/ssl
    environment:
      - SSL_ENABLED=true
      - SSL_CERT=/etc/nginx/ssl/cert.pem
      - SSL_KEY=/etc/nginx/ssl/key.pem
```

## 🔍 Решение проблем

### Ошибка "Permission denied" при загрузке
```bash
# Проверьте права на директорию
ls -la /data

# Проверьте SELinux
getenforce
sudo setsebool -P httpd_unified 1
```

### Не работает авторизация
```bash
# Проверьте формат config/users.php
php -l config/users.php

# Проверьте хеш пароля
php generate-password.php
# Выберите опцию 2 для проверки
```

### Большие файлы не загружаются
Проверьте настройки в `nginx.conf`:
- `client_max_body_size 100M;`
- `fastcgi_read_timeout 3600;`

И в PHP (php.ini):
- `upload_max_filesize = 100M`
- `post_max_size = 100M`
- `max_execution_time = 300`

## 🤝 Вклад в проект

Приветствуются pull requests. Для больших изменений сначала откройте issue для обсуждения.

