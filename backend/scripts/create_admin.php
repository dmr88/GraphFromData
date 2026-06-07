<?php
/**
 * Создаёт или обновляет учётную запись администратора.
 *
 * Использование:
 *     php scripts/create_admin.php <username> <password>
 *
 * Если пользователь существует — пароль будет перезаписан.
 */
declare(strict_types=1);

if ($argc < 3) {
    fwrite(STDERR, "Использование: php scripts/create_admin.php <username> <password>\n");
    exit(2);
}
$username = trim((string)$argv[1]);
$password = (string)$argv[2];

if ($username === '' || strlen($password) < 6) {
    fwrite(STDERR, "ERROR: пустой логин или пароль короче 6 символов.\n");
    exit(3);
}

// Конфиг: файл или env (как в bootstrap.php)
$configFile = __DIR__ . '/../api/config.php';
$config = file_exists($configFile) ? require $configFile : ['db' => []];
foreach (['host' => 'GFD_DB_HOST', 'port' => 'GFD_DB_PORT', 'name' => 'GFD_DB_NAME',
          'user' => 'GFD_DB_USER', 'pass' => 'GFD_DB_PASS'] as $k => $env) {
    $v = getenv($env);
    if ($v !== false && $v !== '') $config['db'][$k] = $v;
}
if (empty($config['db']['host']) || empty($config['db']['name']) || empty($config['db']['user'])) {
    fwrite(STDERR, "ERROR: не настроены DB параметры (config.php или GFD_DB_* env).\n");
    exit(4);
}

$dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
    $config['db']['host'],
    $config['db']['port'] ?? 3306,
    $config['db']['name'],
    $config['db']['charset'] ?? 'utf8mb4'
);
$pdo = new PDO($dsn, $config['db']['user'], $config['db']['pass'] ?? '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)'
);
$stmt->execute([$username, $hash]);

echo "[OK] Учётная запись '$username' создана/обновлена.\n";
