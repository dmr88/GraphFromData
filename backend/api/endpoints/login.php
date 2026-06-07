<?php
/**
 * POST /api/login.php
 * Body: { "username": "...", "password": "..." }
 * Ответ: { "ok": true, "user": { "username": "..." } } или 401.
 */
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Метод не разрешён', 405);
}

$body = read_json_body();
$username = trim((string)($body['username'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($username === '' || $password === '') {
    json_error('Укажите логин и пароль', 400);
}

$stmt = $pdo->prepare('SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$admin = $stmt->fetch();

// Брут-форс защита-минимум: одинаковая задержка при неверном пароле/несуществующем юзере
if (!$admin || !password_verify($password, $admin['password_hash'])) {
    usleep(300_000);
    json_error('Неверный логин или пароль', 401);
}

// Перевыпускаем session id (защита от session fixation)
session_regenerate_id(true);
$_SESSION['admin_id']       = (int)$admin['id'];
$_SESSION['admin_username'] = $admin['username'];

$pdo->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = ?')
    ->execute([$admin['id']]);

json_response(['ok' => true, 'user' => ['username' => $admin['username']]]);
