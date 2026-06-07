<?php
/**
 * GET /api/me.php — проверка текущей сессии. Возвращает либо данные юзера,
 * либо { "authenticated": false }.
 */
require __DIR__ . '/../bootstrap.php';

if (!empty($_SESSION['admin_id'])) {
    json_response([
        'authenticated' => true,
        'user' => ['username' => (string)($_SESSION['admin_username'] ?? '')],
    ]);
}
json_response(['authenticated' => false]);
