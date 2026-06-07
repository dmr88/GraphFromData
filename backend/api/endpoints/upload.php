<?php
/**
 * POST /api/upload.php
 * Поля формы:
 *   file      — .xlsx/.xls/.csv (multipart/form-data)
 *   topic_id  — id темы, к которой относятся данные
 *
 * Требуется авторизация (cookie-сессия после /api/login.php).
 */
require __DIR__ . '/../bootstrap.php';
require __DIR__ . '/../lib/ExcelImporter.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Метод не разрешён', 405);
}

$admin = require_auth();

$topicId = isset($_POST['topic_id']) ? (int)$_POST['topic_id'] : 0;
if ($topicId <= 0) {
    json_error('Не указано поле формы topic_id (id темы)', 400);
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    json_error('Не передан файл (поле "file")', 400);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $codes = [
        UPLOAD_ERR_INI_SIZE   => 'Файл больше upload_max_filesize в php.ini',
        UPLOAD_ERR_FORM_SIZE  => 'Файл больше MAX_FILE_SIZE формы',
        UPLOAD_ERR_PARTIAL    => 'Файл загружен не полностью',
        UPLOAD_ERR_NO_FILE    => 'Файл не выбран',
        UPLOAD_ERR_NO_TMP_DIR => 'Нет временной папки',
        UPLOAD_ERR_CANT_WRITE => 'Не удалось записать файл',
        UPLOAD_ERR_EXTENSION  => 'Загрузка остановлена PHP-расширением',
    ];
    json_error($codes[$file['error']] ?? 'Ошибка загрузки', 400);
}

$maxSize = (int)($CONFIG['max_upload_size'] ?? 20 * 1024 * 1024);
if ($file['size'] > $maxSize) {
    json_error('Файл больше максимально допустимых ' . number_format($maxSize / 1024 / 1024, 1) . ' МБ', 413);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['xlsx', 'xls', 'csv'], true)) {
    json_error('Допустимые форматы: .xlsx, .xls, .csv', 400);
}

$uploadsDir = (string)($CONFIG['uploads_dir'] ?? __DIR__ . '/../../uploads');
if (!is_dir($uploadsDir)) @mkdir($uploadsDir, 0775, true);

$savedName = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$savedPath = rtrim($uploadsDir, '/') . '/' . $savedName;
if (!move_uploaded_file($file['tmp_name'], $savedPath)) {
    json_error('Не удалось сохранить файл', 500);
}

$importer = null;
$status    = 'success';
$errorMsg  = null;
$userError = null;
try {
    $importer = new ExcelImporter($pdo, $topicId);
    $importer->import($savedPath);
    if ($importer->skipped > 0) $status = 'partial';
} catch (RuntimeException $e) {
    $status    = 'failed';
    $errorMsg  = $e->getMessage();
    $userError = $e->getMessage();
} catch (Throwable $e) {
    $status    = 'failed';
    $errorMsg  = get_class($e) . ': ' . $e->getMessage();
    $userError = 'Внутренняя ошибка при импорте. Сообщите администратору.';
    error_log('[GFD] upload.php import failed: ' . $errorMsg);
}

$logStmt = $pdo->prepare('
    INSERT INTO upload_log
        (topic_id, filename, file_size, rows_inserted, rows_updated, rows_skipped,
         status, error_message, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
');
$logStmt->execute([
    $topicId,
    $file['name'],
    $file['size'],
    $importer?->inserted ?? 0,
    $importer?->updated  ?? 0,
    $importer?->skipped  ?? 0,
    $status,
    $errorMsg,
    $admin['id'],
]);
$uploadId = (int)$pdo->lastInsertId();

if ($status === 'failed') {
    json_error($userError ?? 'Импорт не удался', 422, ['upload_id' => $uploadId]);
}

json_response([
    'ok'        => true,
    'inserted'  => $importer->inserted,
    'updated'   => $importer->updated,
    'unchanged' => $importer->unchanged,
    'skipped'   => $importer->skipped,
    'warnings'  => array_slice($importer->errors, 0, 50),
    'upload_id' => $uploadId,
]);
