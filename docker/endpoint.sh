#!/bin/sh
set -e

# Установка переменных окружения по умолчанию
export PHP_MEMORY_LIMIT=${PHP_MEMORY_LIMIT:-256M}
export PHP_MAX_UPLOAD=${PHP_MAX_UPLOAD:-100M}
export PHP_MAX_POST=${PHP_MAX_POST:-100M}
export PHP_MAX_EXECUTION_TIME=${PHP_MAX_EXECUTION_TIME:-300}

echo "Starting File Manager..."
echo "PHP Memory Limit: $PHP_MEMORY_LIMIT"
echo "PHP Max Upload: $PHP_MAX_UPLOAD"
echo "PHP Max POST: $PHP_MAX_POST"

# Проверка и создание необходимых директорий
mkdir -p /data
mkdir -p /var/www/fileserver/config
mkdir -p /tmp/filemanager_sessions
mkdir -p /var/log/nginx
mkdir -p /var/log/php
mkdir -p /var/log/supervisor
mkdir -p /run/php-fpm
mkdir -p /run/nginx

# Установка прав доступа
chown -R nginx:webdata /data
chown -R nginx:webdata /var/www/fileserver
chown -R nginx:webdata /tmp/filemanager_sessions
chown -R nginx:webdata /var/log/nginx
chown -R php-fpm:webdata /var/log/php
chown -R php-fpm:webdata /run/php-fpm

# Установка правильных прав
chmod -R 775 /data
chmod -R 755 /var/www/fileserver
chmod -R 775 /tmp/filemanager_sessions
chmod 750 /var/www/fileserver/config
chmod 750 /var/www/fileserver/generate-password.php

# Создание конфигурации пользователей по умолчанию, если не существует
if [ ! -f "/var/www/fileserver/config/users.php" ]; then
    echo "Creating default users configuration..."
    cat > /var/www/fileserver/config/users.php << 'EOF'
<?php
return [
    'users' => [
        // Дефолтные пользователи (ОБЯЗАТЕЛЬНО СМЕНИТЕ ПАРОЛИ!)
        // Пароль по умолчанию: admin123
        'admin' => [
            'password' => '$2y$10$YTRhNzhmMDNiOGI3ZjQzMO3vyvor7p9fRCAkr8N5XLQjPo8IZLaWu',
            'role' => 'admin'
        ],
        // Пароль по умолчанию: user123
        'user' => [
            'password' => '$2y$10$KxaAhEEJZ4ZBJRr2Tzelqee5qmhzo8Y5rLxO0ds9cgCjaoAIKgG.G',
            'role' => 'user'
        ],
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
EOF
    chmod 640 /var/www/fileserver/config/users.php
    chown nginx:webdata /var/www/fileserver/config/users.php

    echo "Default users created:"
    echo "  admin / admin123 (full access)"
    echo "  user / user123 (no delete)"
    echo "IMPORTANT: Change these passwords!"
fi

# Подстановка переменных окружения в конфигурации PHP
envsubst < /usr/local/etc/php/php.ini > /tmp/php.ini && mv /tmp/php.ini /usr/local/etc/php/php.ini
envsubst < /usr/local/etc/php-fpm.d/www.conf > /tmp/www.conf && mv /tmp/www.conf /usr/local/etc/php-fpm.d/www.conf

# Очистка старых сессий
find /tmp/filemanager_sessions -name "*.json" -mtime +1 -delete 2>/dev/null || true

echo "Starting supervisord..."
exec "$@"