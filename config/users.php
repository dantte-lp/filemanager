<?php
/**
 * Файл конфигурации пользователей
 * 
 * ВАЖНО: Этот файл должен находиться вне публичной директории
 * или быть защищен через .htaccess
 * 
 * Для генерации хеша пароля используйте:
 * echo password_hash('ваш_пароль', PASSWORD_DEFAULT);
 */

return [
    'users' => [
        // Формат: 'логин' => 'хеш_пароля'
        'admin' => '$2y$12$Elsi1rokZ8YvrS7z2phHCuo7/cga8Gwn6SQkI0bmi4yImOiWDSW1u',
        'user' => '$2y$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // password: secret
        
        // Добавьте своих пользователей здесь:
        // 'username' => password_hash('your_password', PASSWORD_DEFAULT),
    ],
    
    // Дополнительные настройки безопасности
    'security' => [
        'min_password_length' => 8,
        'require_strong_password' => true,
        'max_login_attempts' => 5,
        'lockout_duration' => 900, // 15 минут в секундах
    ]
];