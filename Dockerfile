FROM php:8.1-fpm-alpine

# Установка необходимых пакетов
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    bash \
    shadow \
    # Для работы с файлами
    file \
    # Для генерации паролей
    openssl

# Установка PHP расширений
RUN docker-php-ext-install \
    opcache \
    pdo \
    pdo_mysql

# Копирование конфигурации PHP
COPY docker/php/php.ini /usr/local/etc/php/php.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

# Копирование конфигурации Nginx
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

# Копирование конфигурации Supervisor
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Создание пользователя и групп
RUN addgroup -g 1000 -S webdata && \
    adduser -u 1000 -S nginx -G webdata && \
    adduser -u 1001 -S php-fpm -G webdata

# Создание необходимых директорий
RUN mkdir -p /var/www/fileserver && \
    mkdir -p /data && \
    mkdir -p /var/log/supervisor && \
    mkdir -p /run/nginx && \
    mkdir -p /run/php-fpm && \
    mkdir -p /tmp/filemanager_sessions

# Копирование файлов приложения
COPY --chown=nginx:webdata . /var/www/fileserver/

# Установка прав доступа
RUN chown -R nginx:webdata /var/www/fileserver && \
    chown -R nginx:webdata /data && \
    chown -R nginx:webdata /tmp/filemanager_sessions && \
    chmod -R 755 /var/www/fileserver && \
    chmod -R 775 /data && \
    chmod -R 775 /tmp/filemanager_sessions && \
    # Защита конфигурационных файлов
    chmod 750 /var/www/fileserver/config && \
    chmod 640 /var/www/fileserver/config/users.php && \
    chmod 750 /var/www/fileserver/generate-password.php

# Создание volume points
VOLUME ["/data", "/var/www/fileserver/config"]

# Открытие портов
EXPOSE 80

# Создание entrypoint скрипта
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Запуск через supervisor
ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]