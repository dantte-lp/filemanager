<?php
/**
 * Файл конфигурации пользователей с RBAC
 *
 * ВАЖНО: Этот файл должен находиться вне публичной директории
 * или быть защищен через .htaccess
 *
 * Для генерации хеша пароля используйте:
 * echo password_hash('ваш_пароль', PASSWORD_DEFAULT);
 */

return [
    'users' => [
        // Формат: 'логин' => ['password' => 'хеш_пароля', 'role' => 'роль']

        // Администратор - полный доступ (просмотр, загрузка, скачивание, удаление)
        'admin' => [
            'password' => '$2y$12$Elsi1rokZ8YvrS7z2phHCuo7/cga8Gwn6SQkI0bmi4yImOiWDSW1u',
            'role' => 'admin'
        ],

        // Обычный пользователь - ограниченный доступ (просмотр, загрузка, скачивание)
        'user' => [
            'password' => '$2y$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // password: secret
            'role' => 'user'
        ],

        // Добавьте своих пользователей здесь:
        // 'username' => [
        //     'password' => password_hash('your_password', PASSWORD_DEFAULT),
        //     'role' => 'user' // или 'admin'
        // ],
    ],

    // Определение прав для ролей
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
    ],

    // Дополнительные настройки безопасности
    'security' => [
        'min_password_length' => 8,
        'require_strong_password' => true,
        'max_login_attempts' => 5,
        'lockout_duration' => 900, // 15 минут в секундах
    ]
];