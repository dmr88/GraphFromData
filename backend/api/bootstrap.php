<?php
/**
 * Общая точка входа для всех эндпоинтов: подключение конфига, БД, сессии,
 * CORS-заголовков и хелперов JSON-ответа.
 *
 * Каждый эндпоинт начинается со строки:
 *     require __DIR__ . '/../bootstrap.php';
 */
declare(strict_types=1);

// Подгружаем зависимости Composer (PhpSpreadsheet)
$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require $autoload;
}

// Конфиг: либо api/config.php (для классической установки),
// либо переменные окружения (для Docker). Env-переменные имеют приоритет если заданы.
$configFile = __DIR__ . '/config.php';
$CONFIG = file_exists($configFile) ? require $configFile : [];

// Применяем env-переменные поверх конфига
$envDb = [
    'host'    => getenv('GFD_DB_HOST')    ?: null,
    'port'    => getenv('GFD_DB_PORT')    ?: null,
    'name'    => getenv('GFD_DB_NAME')    ?: null,
    'user'    => getenv('GFD_DB_USER')    ?: null,
    'pass'    => getenv('GFD_DB_PASS')    ?: null,
    'charset' => getenv('GFD_DB_CHARSET') ?: null,
];
$CONFIG['db'] = $CONFIG['db'] ?? [];
foreach ($envDb as $k => $v) {
    if ($v !== null && $v !== '') $CONFIG['db'][$k] = $v;
}
if ($cors = getenv('GFD_CORS_ALLOWED_ORIGINS')) {
    $CONFIG['cors_allowed_origins'] = $cors;
}
if ($maxUpload = getenv('GFD_MAX_UPLOAD_SIZE')) {
    $CONFIG['max_upload_size'] = (int)$maxUpload;
}
if ($uploadsDir = getenv('GFD_UPLOADS_DIR')) {
    $CONFIG['uploads_dir'] = $uploadsDir;
}

// Проверка минимально необходимых полей
if (empty($CONFIG['db']['host']) || empty($CONFIG['db']['name'])
    || empty($CONFIG['db']['user'])) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Не настроены параметры БД. Создайте api/config.php или задайте переменные GFD_DB_*.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// CORS
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_map('trim', explode(',', (string)($CONFIG['cors_allowed_origins'] ?? '')));
$corsOk  = false;
if ($allowed) {
    if (in_array('*', $allowed, true)) {
        // Wildcard режим — БЕЗ credentials (спецификация запрещает их сочетание)
        header('Access-Control-Allow-Origin: *');
        $corsOk = true;
    } elseif ($origin !== '' && in_array($origin, $allowed, true)) {
        // Конкретный whitelisted origin — можно с credentials
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
        $corsOk = true;
    }
    if ($corsOk) {
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Max-Age: 600');
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// JSON-ответ — глобальные заголовки
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Сессии
$isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_set_cookie_params([
    'lifetime' => (int)($CONFIG['session_lifetime'] ?? 28800),
    'path'     => '/',
    'httponly' => true,
    'secure'   => $isHttps,        // под HTTPS — только secure cookie
    'samesite' => 'Lax',
]);
ini_set('session.use_strict_mode', '1');
session_name('GFD_SESSID');
session_start();

// Подключение к БД через PDO. Детали ошибки логируем, наружу — лаконичное сообщение.
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $CONFIG['db']['host'],
        $CONFIG['db']['port'] ?? 3306,
        $CONFIG['db']['name'],
        $CONFIG['db']['charset'] ?? 'utf8mb4'
    );
    $pdo = new PDO($dsn, $CONFIG['db']['user'], $CONFIG['db']['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    error_log('[GFD] DB connect failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Не удалось подключиться к БД'], JSON_UNESCAPED_UNICODE);
    exit;
}

// ===================== Хелперы =====================

/** Отдать JSON и выйти. */
function json_response(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

/** Отдать ошибку JSON-ом и выйти. */
function json_error(string $message, int $code = 400, array $extra = []): void
{
    json_response(['error' => $message] + $extra, $code);
}

/** Проверить, что пользователь авторизован. Иначе — 401 и выход. */
function require_auth(): array
{
    if (empty($_SESSION['admin_id'])) {
        json_error('Требуется авторизация', 401);
    }
    return [
        'id'       => (int)$_SESSION['admin_id'],
        'username' => (string)($_SESSION['admin_username'] ?? ''),
    ];
}

/** Получить тело POST как JSON. */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
