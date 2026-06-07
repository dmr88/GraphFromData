<?php
/**
 * GET /api/metadata.php[?topic_id=N]
 *
 * Без параметров: возвращает все справочники.
 * С topic_id: возвращает темы + категории и города/возраста, отфильтрованные
 * по реально присутствующим в фактах для этой темы.
 *
 * Ответ:
 * {
 *   "topics":     [ { "id": 1, "slug": "morbidity", "name": "...", "unit": "...", "has_age": true, "has_city": true } ],
 *   "periods":    [ ... ],
 *   "categories": [ { "id": 1, "topic_id": 1, "name": "..." } ],
 *   "cities":     [ ... ],
 *   "age_groups": [ ... ]
 * }
 */
require __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Метод не разрешён', 405);
}

$topicId = isset($_GET['topic_id']) ? (int)$_GET['topic_id'] : 0;

try {
    $topics = $pdo->query(
        'SELECT id, slug, name, description, unit, sort_order FROM topics ORDER BY sort_order, name'
    )->fetchAll();

    // По каждой теме узнаём, есть ли city/age в её фактах — фронт сможет
    // скрывать ненужные селекторы.
    $featureStmt = $pdo->query('
        SELECT topic_id,
               MAX(city_id IS NOT NULL)      AS has_city,
               MAX(age_group_id IS NOT NULL) AS has_age
        FROM measurements
        GROUP BY topic_id
    ');
    $features = [];
    foreach ($featureStmt as $row) {
        $features[(int)$row['topic_id']] = [
            'has_city' => (bool)$row['has_city'],
            'has_age'  => (bool)$row['has_age'],
        ];
    }
    foreach ($topics as &$t) {
        $t['id']         = (int)$t['id'];
        $t['sort_order'] = (int)$t['sort_order'];
        $f               = $features[$t['id']] ?? ['has_city' => false, 'has_age' => false];
        $t['has_city']   = $f['has_city'];
        $t['has_age']    = $f['has_age'];
    }
    unset($t);

    // Периоды и категории — фильтруем по теме, если указано
    if ($topicId > 0) {
        $periods = $pdo->prepare('
            SELECT DISTINCT p.id, p.label, p.year_num, p.is_full_year, p.sort_order
            FROM periods p
            INNER JOIN measurements m ON m.period_id = p.id
            WHERE m.topic_id = ?
            ORDER BY p.sort_order, p.year_num
        ');
        $periods->execute([$topicId]);
        $periods = $periods->fetchAll();

        $categories = $pdo->prepare('
            SELECT id, topic_id, name, unit, sort_order
            FROM categories WHERE topic_id = ?
            ORDER BY sort_order, name
        ');
        $categories->execute([$topicId]);
        $categories = $categories->fetchAll();

        $cities = $pdo->prepare('
            SELECT DISTINCT ci.id, ci.name, ci.is_region_total, ci.sort_order
            FROM cities ci
            INNER JOIN measurements m ON m.city_id = ci.id
            WHERE m.topic_id = ?
            ORDER BY ci.sort_order, ci.name
        ');
        $cities->execute([$topicId]);
        $cities = $cities->fetchAll();

        $ageGroups = $pdo->prepare('
            SELECT DISTINCT a.id, a.name, a.sort_order
            FROM age_groups a
            INNER JOIN measurements m ON m.age_group_id = a.id
            WHERE m.topic_id = ?
            ORDER BY a.sort_order, a.name
        ');
        $ageGroups->execute([$topicId]);
        $ageGroups = $ageGroups->fetchAll();
    } else {
        $periods    = $pdo->query('SELECT id, label, year_num, is_full_year, sort_order FROM periods ORDER BY sort_order')->fetchAll();
        $categories = $pdo->query('SELECT id, topic_id, name, unit, sort_order FROM categories ORDER BY topic_id, sort_order')->fetchAll();
        $cities     = $pdo->query('SELECT id, name, is_region_total, sort_order FROM cities ORDER BY sort_order, name')->fetchAll();
        $ageGroups  = $pdo->query('SELECT id, name, sort_order FROM age_groups ORDER BY sort_order, name')->fetchAll();
    }

    // Приводим типы
    $toInt = function (array $rows, array $keys): array {
        foreach ($rows as &$r) {
            foreach ($keys as $k) {
                if (isset($r[$k])) $r[$k] = (int)$r[$k];
            }
        }
        return $rows;
    };

    json_response([
        'topics'     => $topics,
        'periods'    => $toInt($periods,    ['id', 'year_num', 'is_full_year', 'sort_order']),
        'categories' => $toInt($categories, ['id', 'topic_id', 'sort_order']),
        'cities'     => $toInt($cities,     ['id', 'is_region_total', 'sort_order']),
        'age_groups' => $toInt($ageGroups,  ['id', 'sort_order']),
    ]);
} catch (Throwable $e) {
    error_log('[GFD] metadata.php error: ' . $e->getMessage());
    json_error('Ошибка чтения справочников', 500);
}
