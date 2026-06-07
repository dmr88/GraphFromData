<?php
/**
 * GET /api/data.php?topic_id=N[&period_id=...&category_id=...&city_id=...&age_group_id=...]
 *
 * Возвращает факты из measurements с join'ом справочников.
 * topic_id строго обязателен (без него нет смысла — слишком разнородные данные).
 *
 * Ответ:
 * {
 *   "rows": [ { topic, period, year_num, category, city, age_group,
 *               value, value_extra, note } ],
 *   "count": N
 * }
 */
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Метод не разрешён', 405);
}

$topicId = isset($_GET['topic_id']) ? (int)$_GET['topic_id'] : 0;
if ($topicId <= 0) {
    json_error('Параметр topic_id обязателен', 400);
}

function parse_id_list(?string $raw): ?array
{
    if ($raw === null || $raw === '') return null;
    $ids = array_filter(
        array_map(static fn($x) => (int)trim($x), explode(',', $raw)),
        static fn($v) => $v > 0
    );
    return $ids ? array_values($ids) : null;
}

$periodIds   = parse_id_list($_GET['period_id']    ?? null);
$categoryIds = parse_id_list($_GET['category_id']  ?? null);
$cityIds     = parse_id_list($_GET['city_id']      ?? null);
$ageIds      = parse_id_list($_GET['age_group_id'] ?? null);

$where  = ['m.topic_id = ?'];
$params = [$topicId];

$add = function (string $field, ?array $ids) use (&$where, &$params): void {
    if (!$ids) return;
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $where[] = "$field IN ($ph)";
    foreach ($ids as $id) $params[] = $id;
};
$add('m.period_id',    $periodIds);
$add('m.category_id',  $categoryIds);
$add('m.city_id',      $cityIds);
$add('m.age_group_id', $ageIds);

$sql = "
    SELECT
        t.slug        AS topic,
        p.label       AS period,
        p.year_num    AS year_num,
        c.name        AS category,
        c.unit        AS category_unit,
        ci.name       AS city,
        a.name        AS age_group,
        m.value       AS value,
        m.value_extra AS value_extra,
        m.note        AS note
    FROM measurements m
    INNER JOIN topics     t  ON t.id  = m.topic_id
    INNER JOIN periods    p  ON p.id  = m.period_id
    INNER JOIN categories c  ON c.id  = m.category_id
    LEFT  JOIN cities     ci ON ci.id = m.city_id
    LEFT  JOIN age_groups a  ON a.id  = m.age_group_id
    WHERE " . implode(' AND ', $where) . "
    ORDER BY p.sort_order, c.sort_order,
             COALESCE(ci.sort_order, 0),
             COALESCE(a.sort_order, 0)
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['year_num']    = (int)$r['year_num'];
        $r['value']       = (float)$r['value'];
        $r['value_extra'] = $r['value_extra'] !== null ? (float)$r['value_extra'] : null;
        // city и age_group могут быть NULL — оставляем как есть
    }
    json_response(['rows' => $rows, 'count' => count($rows)]);
} catch (Throwable $e) {
    error_log('[GFD] data.php error: ' . $e->getMessage());
    json_error('Ошибка выборки данных', 500);
}
