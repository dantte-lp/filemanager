<?php
// api.php - Универсальный API для файлового менеджера

// Настройки для больших файлов
ini_set('max_execution_time', 3600); // 1 час
ini_set('max_input_time', 3600);
ini_set('memory_limit', '512M');
ini_set('post_max_size', '10240M');
ini_set('upload_max_filesize', '10240M');

// Отключаем ограничение времени выполнения для загрузки
set_time_limit(0);

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Загрузка конфигурации пользователей
$configFile = __DIR__ . '/config/users.php';
if (!file_exists($configFile)) {
    // Если файла нет, создаем дефолтный
    if (!is_dir(__DIR__ . '/config')) {
        mkdir(__DIR__ . '/config', 0755, true);
    }

    // Создаем файл с дефолтными пользователями
    $defaultConfig = '<?php
return [
    "users" => [
        // Дефолтные пользователи (ОБЯЗАТЕЛЬНО СМЕНИТЕ ПАРОЛИ!)
        "admin" => "$2y$10$iSN5tGdKXx5ZXeI5xvBkDudCBkPZl/gZDDzZJdFvV.hKnXzqKPQKC", // password: admin123
        "user" => "$2y$10$KxaAhEEJZ4ZBJRr2Tzelqee5qmhzo8Y5rLxO0ds9cgCjaoAIKgG.G", // password: user123
        "demo" => "$2y$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", // password: secret
    ]
];';
    file_put_contents($configFile, $defaultConfig);
}

$userConfig = require $configFile;

// Configuration
$config = [
    'root_dir' => '/data',
    'session_dir' => '/tmp/filemanager_sessions',
    'session_lifetime' => 3600, // 1 hour
    'users' => $userConfig['users'] ?? [],
    'permissions' => $userConfig['permissions'] ?? [],
    'max_upload_size' => 104857600, // 100MB
    'allowed_upload_extensions' => [] // Empty = all allowed
];

// Проверка доступности корневой директории
if (!is_dir($config['root_dir'])) {
    die(json_encode(['error' => 'Root directory does not exist: ' . $config['root_dir']]));
}

if (!is_readable($config['root_dir'])) {
    die(json_encode(['error' => 'Root directory is not readable: ' . $config['root_dir']]));
}

// Initialize session directory
if (!is_dir($config['session_dir'])) {
    mkdir($config['session_dir'], 0777, true);
}


// Определяем тип запроса (старый API или новый)
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$isNewApi = strpos($requestUri, '/api/') !== false;

// Если это новый API
if ($isNewApi) {
    // Парсим путь API
    $path = parse_url($requestUri, PHP_URL_PATH);
    $apiPath = str_replace('/api/', '', $path);
    $apiPath = trim($apiPath, '/');

    handleNewApiRequest($apiPath, $requestMethod);
} else {
    // Старый API
    handleOldApiRequest();
}

// Функция для обработки нового API
function handleNewApiRequest($apiPath, $method) {
    global $config;

    try {
        switch ($apiPath) {
            case 'login':
                if ($method !== 'POST') {
                    throw new Exception('Method not allowed', 405);
                }

                $input = json_decode(file_get_contents('php://input'), true);

                if (!isset($input['username']) || !isset($input['password'])) {
                    throw new Exception('Username and password required', 400);
                }

                $username = $input['username'];
                $password = $input['password'];

                if (isset($config['users'][$username])) {
                    $userInfo = $config['users'][$username];

                    // Поддержка старого формата (строка) и нового (массив)
                    if (is_string($userInfo)) {
                        // Старый формат - все пользователи считаются user
                        $passwordHash = $userInfo;
                        $role = 'user';
                    } else {
                        // Новый формат с ролями
                        $passwordHash = $userInfo['password'];
                        $role = $userInfo['role'] ?? 'user';
                    }

                    if (password_verify($password, $passwordHash)) {
                        // Генерируем токен
                        $token = bin2hex(random_bytes(32));

                        // Сохраняем сессию с ролью
                        $sessionData = [
                            'token' => $token,
                            'username' => $username,
                            'role' => $role,
                            'expires' => time() + $config['session_lifetime'],
                            'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
                        ];

                        $sessionFile = $config['session_dir'] . '/' . $token . '.json';
                        file_put_contents($sessionFile, json_encode($sessionData));

                        // Получаем права для роли
                        $permissions = $config['permissions'][$role] ?? [];

                        echo json_encode([
                            'success' => true,
                            'token' => $token,
                            'user' => [
                                'username' => $username,
                                'name' => ucfirst($username),
                                'role' => $role,
                                'permissions' => $permissions
                            ]
                        ]);
                    } else {
                        http_response_code(401);
                        echo json_encode([
                            'error' => 'Invalid credentials',
                            'message' => 'Неверный логин или пароль'
                        ]);
                    }
                } else {
                    http_response_code(401);
                    echo json_encode([
                        'error' => 'Invalid credentials',
                        'message' => 'Неверный логин или пароль'
                    ]);
                }
                break;

            case 'me':
                $token = getBearerToken();
                if (!$token || !validateToken($token)) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Invalid token']);
                    break;
                }

                $sessionData = getSessionData($token);

                // Получаем роль и права
                $role = $sessionData['role'] ?? 'user';
                $permissions = $config['permissions'][$role] ?? [];

                echo json_encode([
                    'user' => [
                        'username' => $sessionData['username'],
                        'name' => ucfirst($sessionData['username']),
                        'role' => $role,
                        'permissions' => $permissions
                    ]
                ]);
                break;

            case 'upload':
                if ($method !== 'POST') {
                    throw new Exception('Method not allowed', 405);
                }
                checkPermission('upload');
                handleUpload();
                break;

            default:
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
        }
    } catch (Exception $e) {
        $code = $e->getCode() ?: 400;
        http_response_code($code);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Функция для обработки старого API
function handleOldApiRequest() {
    global $config;

    $action = $_GET['action'] ?? 'list';

    // Для action=get и cleanup не проверяем авторизацию
    if ($action !== 'get' && $action !== 'cleanup') {
        // Для остальных действий проверяем базовую авторизацию
        if ($action === 'list' || $action === 'download') {
            checkPermission('view');
        }
    }

    switch ($action) {
        case 'list':
            checkPermission('view');
            $requestedDir = $_GET['dir'] ?? '';
            $requestedDir = trim($requestedDir, '/');
            $requestedDir = str_replace('..', '', $requestedDir);

            if ($requestedDir === '') {
                $dir = $config['root_dir'];
            } else {
                $dir = $config['root_dir'] . '/' . $requestedDir;
            }

            echo json_encode(getFiles($dir));
            break;

        case 'download':
            checkPermission('download');
            $file = $_GET['file'] ?? '';
            if (!$file) {
                http_response_code(400);
                die(json_encode(['error' => 'File parameter required']));
            }

            $file = str_replace(['..', '\\'], '', $file);
            $file = trim($file, '/');

            $fullPath = $config['root_dir'] . '/' . $file;
            $realFile = realpath($fullPath);
            $realRoot = realpath($config['root_dir']);

            if ($realFile === false || strpos($realFile, $realRoot) !== 0 || !is_file($realFile)) {
                http_response_code(404);
                die(json_encode(['error' => 'File not found']));
            }

            // Генерируем токен для скачивания
            $token = bin2hex(random_bytes(16));
            $expires = time() + $config['session_lifetime'];

            $sessionFile = $config['session_dir'] . '/' . $token . '.json';
            $sessionData = [
                'file' => $realFile,
                'expires' => $expires,
                'filename' => basename($realFile)
            ];

            file_put_contents($sessionFile, json_encode($sessionData));

            echo json_encode([
                'download_url' => '/api.php?action=get&token=' . $token,
                'filename' => basename($realFile),
                'expires' => $expires
            ]);
            break;

        case 'get':
            serveFile();
            break;

        case 'cleanup':
            cleanupSessions();
            break;

        case 'delete':
            checkPermission('delete');
            $file = $_GET['file'] ?? '';
            if (!$file) {
                http_response_code(400);
                die(json_encode(['error' => 'File parameter required']));
            }

            $file = str_replace(['..', '\\'], '', $file);
            $file = trim($file, '/');

            $fullPath = $config['root_dir'] . '/' . $file;
            $realFile = realpath($fullPath);
            $realRoot = realpath($config['root_dir']);

            // Проверка безопасности пути
            if ($realFile === false || strpos($realFile, $realRoot) !== 0) {
                http_response_code(404);
                die(json_encode(['error' => 'File not found']));
            }

            // Запрещаем удаление папок
            if (is_dir($realFile)) {
                http_response_code(403);
                die(json_encode(['error' => 'Cannot delete directories']));
            }

            // Проверка существования файла
            if (!is_file($realFile)) {
                http_response_code(404);
                die(json_encode(['error' => 'File not found']));
            }

            // Попытка удаления
            if (@unlink($realFile)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'File deleted successfully'
                ]);
            } else {
                http_response_code(500);
                die(json_encode(['error' => 'Failed to delete file']));
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
}

// Проверка авторизации
function checkAuth() {
    global $config;

    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? null;

    // Проверяем Basic авторизацию
    if ($authHeader && strpos($authHeader, 'Basic ') === 0) {
        $credentials = base64_decode(substr($authHeader, 6));
        if (strpos($credentials, ':') !== false) {
            list($username, $password) = explode(':', $credentials, 2);

            if (isset($config['users'][$username])) {
                $userInfo = $config['users'][$username];

                // Поддержка старого и нового формата
                if (is_string($userInfo)) {
                    $passwordHash = $userInfo;
                    $role = 'user';
                } else {
                    $passwordHash = $userInfo['password'];
                    $role = $userInfo['role'] ?? 'user';
                }

                if (password_verify($password, $passwordHash)) {
                    return [
                        'username' => $username,
                        'role' => $role,
                        'permissions' => $config['permissions'][$role] ?? []
                    ];
                }
            }
        }
    }

    // Проверяем Bearer токен
    if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        if (validateToken($token)) {
            $sessionData = getSessionData($token);
            $role = $sessionData['role'] ?? 'user';

            return [
                'username' => $sessionData['username'],
                'role' => $role,
                'permissions' => $config['permissions'][$role] ?? []
            ];
        }
    }

    http_response_code(401);
    die(json_encode(['error' => 'Authorization required']));
}

// Проверка конкретного разрешения
function checkPermission($permission) {
    $user = checkAuth();

    if (!isset($user['permissions'][$permission]) || !$user['permissions'][$permission]) {
        http_response_code(403);
        die(json_encode(['error' => 'Permission denied', 'message' => 'У вас нет прав для выполнения этого действия']));
    }

    return $user;
}

// Получение Bearer токена
function getBearerToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? null;

    if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
        return substr($authHeader, 7);
    }

    return null;
}

// Валидация токена
function validateToken($token) {
    global $config;

    $sessionFile = $config['session_dir'] . '/' . $token . '.json';

    if (!file_exists($sessionFile)) {
        return false;
    }

    $sessionData = json_decode(file_get_contents($sessionFile), true);

    if ($sessionData['expires'] < time()) {
        unlink($sessionFile);
        return false;
    }

    return true;
}

// Получение данных сессии
function getSessionData($token) {
    global $config;

    $sessionFile = $config['session_dir'] . '/' . $token . '.json';
    return json_decode(file_get_contents($sessionFile), true);
}

// Получение информации о файле
function getFileInfo($path) {
    $info = [
        'name' => basename($path),
        'path' => $path,
        'type' => is_dir($path) ? 'directory' : 'file',
        'size' => is_file($path) ? filesize($path) : 0,
        'modified' => filemtime($path),
        'permissions' => substr(sprintf('%o', fileperms($path)), -4),
        'readable' => is_readable($path),
        'writable' => is_writable($path)
    ];

    if (is_file($path)) {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $info['extension'] = $ext;
        $info['mime'] = mime_content_type($path);
    }

    return $info;
}

// Получение списка файлов
function getFiles($dir) {
    global $config;

    $realRoot = realpath($config['root_dir']);
    if ($realRoot === false) {
        return ['error' => 'Root directory not found'];
    }

    $realDir = realpath($dir);

    if ($realDir === false || strpos($realDir, $realRoot) !== 0) {
        return ['error' => 'Invalid directory'];
    }

    if (!is_dir($realDir)) {
        return ['error' => 'Directory not found'];
    }

    $files = [];
    $dirs = [];

    foreach (scandir($realDir) as $item) {
        if ($item === '.' || $item === '..') continue;

        // Скрываем системные папки
        if ($realDir === $realRoot && in_array(strtolower($item), ['api', 'config', 'js', 'css'])) {
            continue;
        }

        $path = $realDir . DIRECTORY_SEPARATOR . $item;
        $info = getFileInfo($path);

        // Создаем относительный путь
        $relativePath = str_replace($realRoot . DIRECTORY_SEPARATOR, '', $path);
        $relativePath = str_replace($realRoot, '', $relativePath);
        $relativePath = trim($relativePath, '/');
        $relativePath = str_replace('\\', '/', $relativePath); // Windows fix

        $info['relativePath'] = $relativePath;

        if ($info['type'] === 'directory') {
            $dirs[] = $info;
        } else {
            $files[] = $info;
        }
    }

    // Сортировка по имени
    usort($dirs, function($a, $b) {
        return strcasecmp($a['name'], $b['name']);
    });
    usort($files, function($a, $b) {
        return strcasecmp($a['name'], $b['name']);
    });

    return [
        'current' => str_replace($realRoot, '', $realDir),
        'parent' => dirname($realDir) !== $realRoot && strpos(dirname($realDir), $realRoot) === 0
            ? str_replace($realRoot, '', dirname($realDir))
            : null,
        'items' => array_merge($dirs, $files),
        'total' => count($dirs) + count($files)
    ];
}

// Отправка файла
function serveFile() {
    global $config;

    if (!isset($_GET['token'])) {
        http_response_code(400);
        die('Token required');
    }

    $token = $_GET['token'];
    $sessionFile = $config['session_dir'] . '/' . $token . '.json';

    if (!file_exists($sessionFile)) {
        http_response_code(404);
        die('Invalid or expired token');
    }

    $sessionData = json_decode(file_get_contents($sessionFile), true);

    if ($sessionData['expires'] < time()) {
        unlink($sessionFile);
        http_response_code(410);
        die('Token expired');
    }

    $realFile = $sessionData['file'];

    if (!file_exists($realFile)) {
        unlink($sessionFile);
        http_response_code(404);
        die('File not found');
    }

    // Удаляем токен после использования
    unlink($sessionFile);

    // Отключаем ограничения
    set_time_limit(0);
    ignore_user_abort(true);

    // Очищаем буферы
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Отключаем буферизацию nginx
    header('X-Accel-Buffering: no');

    $filesize = filesize($realFile);

    // Заголовки
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $sessionData['filename'] . '"');
    header('Content-Length: ' . $filesize);
    header('Accept-Ranges: bytes');
    header('Cache-Control: no-cache, no-store, must-revalidate');

    // Обработка частичных запросов
    $start = 0;
    $end = $filesize - 1;

    if (isset($_SERVER['HTTP_RANGE'])) {
        $range = $_SERVER['HTTP_RANGE'];
        list(, $range) = explode('=', $range, 2);
        list($start, $end) = explode('-', $range);
        $start = intval($start);
        if ($end === '') {
            $end = $filesize - 1;
        } else {
            $end = intval($end);
        }

        header('HTTP/1.1 206 Partial Content');
        header("Content-Range: bytes $start-$end/$filesize");
        header('Content-Length: ' . ($end - $start + 1));
    }

    // Отправка файла
    $fp = fopen($realFile, 'rb');
    if (!$fp) {
        http_response_code(500);
        die('Cannot open file');
    }

    fseek($fp, $start);

    $buffer = 1024 * 1024; // 1MB chunks
    $position = $start;

    while ($position <= $end && !feof($fp)) {
        $chunkSize = min($buffer, $end - $position + 1);
        echo fread($fp, $chunkSize);
        flush();
        $position += $chunkSize;
    }

    fclose($fp);
    exit;
}

// Очистка старых сессий
function cleanupSessions() {
    global $config;

    $files = glob($config['session_dir'] . '/*.json');
    $cleaned = 0;

    foreach ($files as $file) {
        $data = json_decode(file_get_contents($file), true);
        if ($data && $data['expires'] < time()) {
            unlink($file);
            $cleaned++;
        }
    }

    echo json_encode(['status' => 'cleaned', 'count' => $cleaned]);
}

// Обработка загрузки файлов
function handleUpload() {
    global $config;

    // Логирование для отладки
    error_log("=== Upload request received ===");
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));
    error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    error_log("Content-Length: " . ($_SERVER['CONTENT_LENGTH'] ?? 'not set'));
    error_log("Memory usage: " . memory_get_usage(true) / 1024 / 1024 . " MB");

    // Проверка на превышение post_max_size
    if (empty($_FILES) && empty($_POST) && $_SERVER['CONTENT_LENGTH'] > 0) {
        $displaySize = $_SERVER['CONTENT_LENGTH'];
        $displaySize = $displaySize / 1024 / 1024;
        error_log("Upload failed: post_max_size exceeded. Attempted size: {$displaySize}MB");
        http_response_code(413);
        die(json_encode([
            'error' => 'File too large. Maximum allowed size exceeded.',
            'details' => "Attempted upload: {$displaySize}MB, post_max_size: " . ini_get('post_max_size')
        ]));
    }

    // Дополнительная проверка прав (уже проверено, но для безопасности)
    checkPermission('upload');

    if (!isset($_FILES['file'])) {
        error_log("No file in FILES array");
        http_response_code(400);
        die(json_encode(['error' => 'No file uploaded', 'debug' => $_FILES]));
    }

    $uploadedFile = $_FILES['file'];
    $path = $_POST['path'] ?? '';

    // Проверка на ошибки загрузки
    if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        die(json_encode(['error' => 'Upload failed: ' . $uploadedFile['error']]));
    }

    // Проверка размера
    if ($uploadedFile['size'] > $config['max_upload_size']) {
        http_response_code(400);
        die(json_encode(['error' => 'File too large. Maximum size: ' . $config['max_upload_size'] . ' bytes']));
    }

    // Определяем директорию для загрузки
    $uploadDir = $config['root_dir'];
    if ($path) {
        $uploadDir = $config['root_dir'] . '/' . $path;
    }

    // Проверка безопасности пути
    $realUploadDir = realpath($uploadDir);
    $realRoot = realpath($config['root_dir']);

    if (!$realUploadDir || strpos($realUploadDir, $realRoot) !== 0) {
        http_response_code(400);
        die(json_encode(['error' => 'Invalid upload path']));
    }

    // Не разрешаем загрузку в корневую директорию
    if ($realUploadDir === $realRoot) {
        http_response_code(400);
        die(json_encode(['error' => 'Upload to root directory is not allowed']));
    }

    // Генерируем безопасное имя файла
    $fileName = basename($uploadedFile['name']);
    // Транслитерация кириллицы
    $fileName = transliterate($fileName);
    // Оставляем только безопасные символы
    $fileName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);

    // Убираем множественные подчеркивания
    $fileName = preg_replace('/_+/', '_', $fileName);
    $fileName = trim($fileName, '_');

    // Проверка расширения (если установлены ограничения)
    if (!empty($config['allowed_upload_extensions'])) {
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (!in_array($ext, $config['allowed_upload_extensions'])) {
            http_response_code(400);
            die(json_encode(['error' => 'File type not allowed']));
        }
    }

    // Если файл существует, добавляем суффикс
    $targetPath = $realUploadDir . '/' . $fileName;
    $counter = 1;
    $info = pathinfo($fileName);
    $baseName = $info['filename'];
    $extension = isset($info['extension']) ? '.' . $info['extension'] : '';

    while (file_exists($targetPath)) {
        $targetPath = $realUploadDir . '/' . $baseName . '_' . $counter . $extension;
        $counter++;
    }

    // Перемещаем загруженный файл
    if (move_uploaded_file($uploadedFile['tmp_name'], $targetPath)) {
        echo json_encode([
            'success' => true,
            'filename' => basename($targetPath),
            'size' => $uploadedFile['size']
        ]);
    } else {
        http_response_code(500);
        die(json_encode(['error' => 'Failed to save file']));
    }
}

// Функция транслитерации кириллицы
function transliterate($string) {
    $translit = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd',
        'е' => 'e', 'ё' => 'yo', 'ж' => 'zh', 'з' => 'z', 'и' => 'i',
        'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm', 'н' => 'n',
        'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't',
        'у' => 'u', 'ф' => 'f', 'х' => 'h', 'ц' => 'ts', 'ч' => 'ch',
        'ш' => 'sh', 'щ' => 'sch', 'ъ' => '', 'ы' => 'y', 'ь' => '',
        'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
        'А' => 'A', 'Б' => 'B', 'В' => 'V', 'Г' => 'G', 'Д' => 'D',
        'Е' => 'E', 'Ё' => 'Yo', 'Ж' => 'Zh', 'З' => 'Z', 'И' => 'I',
        'Й' => 'Y', 'К' => 'K', 'Л' => 'L', 'М' => 'M', 'Н' => 'N',
        'О' => 'O', 'П' => 'P', 'Р' => 'R', 'С' => 'S', 'Т' => 'T',
        'У' => 'U', 'Ф' => 'F', 'Х' => 'H', 'Ц' => 'Ts', 'Ч' => 'Ch',
        'Ш' => 'Sh', 'Щ' => 'Sch', 'Ъ' => '', 'Ы' => 'Y', 'Ь' => '',
        'Э' => 'E', 'Ю' => 'Yu', 'Я' => 'Ya',
        ' ' => '_', '№' => 'N'
    ];

    return strtr($string, $translit);
}