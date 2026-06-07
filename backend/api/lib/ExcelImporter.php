<?php
declare(strict_types=1);

use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Импорт Excel-файла с данными в БД (тема указывается извне).
 *
 * Ожидаемые колонки в листе "Полные данные" (любой порядок):
 *   Обязательные: «Год», «Категория», «Значение»
 *   Опциональные: «Город», «Возрастная группа», «Доп. значение», «Примечание»
 *
 * Поведение:
 *   - UPSERT по (topic, period, category, city, age_group) — обновляет значение
 *   - Неизвестные категории/города/возраста/периоды создаются автоматически
 *   - Категории всегда привязываются к topic_id, заданному при создании импортёра
 *   - Транзакционно: ошибка → откат
 */
class ExcelImporter
{
    public const REQUIRED = ['Год', 'Категория', 'Значение'];
    public const OPTIONAL = ['Город', 'Возрастная группа', 'Доп. значение', 'Примечание'];

    public int $inserted  = 0;
    public int $updated   = 0;
    public int $unchanged = 0;
    public int $skipped   = 0;
    public array $errors  = [];

    private PDO $pdo;
    private int $topicId;
    private array $periodCache    = [];
    private array $categoryCache  = [];  // (topic_id . "|" . name) → id
    private array $cityCache      = [];
    private array $ageGroupCache  = [];

    public function __construct(PDO $pdo, int $topicId)
    {
        $this->pdo     = $pdo;
        $this->topicId = $topicId;
        // Проверим, что тема существует
        $st = $pdo->prepare('SELECT id FROM topics WHERE id = ?');
        $st->execute([$topicId]);
        if (!$st->fetchColumn()) {
            throw new RuntimeException("Тема с id=$topicId не найдена в БД");
        }
    }

    public function import(string $filePath): void
    {
        if (!is_readable($filePath)) {
            throw new RuntimeException("Файл недоступен: $filePath");
        }
        $reader = IOFactory::createReaderForFile($filePath);
        $reader->setReadDataOnly(true);
        $sp = $reader->load($filePath);

        $sheet = $sp->sheetNameExists('Полные данные')
            ? $sp->getSheetByName('Полные данные')
            : $sp->getActiveSheet();

        $rows = $sheet->toArray(null, true, true, false);
        if (count($rows) < 2) {
            throw new RuntimeException('В файле нет данных');
        }

        $header = array_map(static fn($v) => trim((string)$v), $rows[0]);
        $colMap = $this->mapColumns($header);
        if (!$colMap) {
            throw new RuntimeException(
                'Не найдены обязательные колонки. Нужны: ' . implode(', ', self::REQUIRED)
                . '. Найдены: ' . implode(' | ', $header)
            );
        }

        $this->prefillCaches();

        $this->pdo->beginTransaction();
        try {
            $upsert = $this->pdo->prepare('
                INSERT INTO measurements
                    (topic_id, period_id, category_id, city_id, age_group_id, value, value_extra, note)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    value       = VALUES(value),
                    value_extra = VALUES(value_extra),
                    note        = VALUES(note),
                    updated_at  = CURRENT_TIMESTAMP
            ');

            $rowNum = 1;
            foreach (array_slice($rows, 1) as $row) {
                $rowNum++;
                $period   = trim((string)($row[$colMap['Год']] ?? ''));
                $category = trim((string)($row[$colMap['Категория']] ?? ''));
                $rawValue = $row[$colMap['Значение']] ?? null;
                $city     = isset($colMap['Город']) ? trim((string)($row[$colMap['Город']] ?? '')) : '';
                $age      = isset($colMap['Возрастная группа']) ? trim((string)($row[$colMap['Возрастная группа']] ?? '')) : '';
                $rawExtra = isset($colMap['Доп. значение']) ? ($row[$colMap['Доп. значение']] ?? null) : null;
                $note     = isset($colMap['Примечание']) ? trim((string)($row[$colMap['Примечание']] ?? '')) : '';

                if ($period === '' && $category === '' && ($rawValue === '' || $rawValue === null)) {
                    continue; // пустая строка
                }
                if ($period === '' || $category === '') {
                    $this->skipped++;
                    $this->errors[] = "Строка $rowNum: пустые обязательные поля";
                    continue;
                }
                $value = $this->parseNumber($rawValue);
                if ($value === null) {
                    $this->skipped++;
                    $this->errors[] = "Строка $rowNum: нечисловое значение «{$rawValue}»";
                    continue;
                }
                $extra = $this->parseNumber($rawExtra);

                try {
                    $periodId   = $this->getOrCreatePeriod($period);
                    $categoryId = $this->getOrCreateCategory($category);
                    $cityId     = $city !== '' ? $this->getOrCreateCity($city) : null;
                    $ageId      = $age  !== '' ? $this->getOrCreateAgeGroup($age) : null;
                } catch (Throwable $e) {
                    $this->skipped++;
                    $this->errors[] = "Строка $rowNum: " . $e->getMessage();
                    continue;
                }

                $upsert->execute([
                    $this->topicId, $periodId, $categoryId, $cityId, $ageId,
                    $value, $extra, $note !== '' ? $note : null,
                ]);
                $rc = $upsert->rowCount();
                if ($rc === 1)      $this->inserted++;
                elseif ($rc === 2)  $this->updated++;
                else                $this->unchanged++;
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw new RuntimeException('Импорт прерван: ' . $e->getMessage(), 0, $e);
        }
    }

    private function mapColumns(array $header): ?array
    {
        $map = [];
        foreach (self::REQUIRED as $req) {
            $idx = array_search($req, $header, true);
            if ($idx === false) return null;
            $map[$req] = (int)$idx;
        }
        foreach (self::OPTIONAL as $opt) {
            $idx = array_search($opt, $header, true);
            if ($idx !== false) $map[$opt] = (int)$idx;
        }
        return $map;
    }

    private function parseNumber(mixed $v): ?float
    {
        if ($v === null || $v === '') return null;
        if (is_numeric($v)) return (float)$v;
        $s = str_replace([' ', "\u{00A0}", ','], ['', '', '.'], (string)$v);
        return is_numeric($s) ? (float)$s : null;
    }

    private function prefillCaches(): void
    {
        foreach ($this->pdo->query('SELECT id, label AS k FROM periods') as $r) {
            $this->periodCache[$r['k']] = (int)$r['id'];
        }
        $st = $this->pdo->prepare('SELECT id, name FROM categories WHERE topic_id = ?');
        $st->execute([$this->topicId]);
        foreach ($st as $r) {
            $this->categoryCache[$r['name']] = (int)$r['id'];
        }
        foreach ($this->pdo->query('SELECT id, name AS k FROM cities') as $r) {
            $this->cityCache[$r['k']] = (int)$r['id'];
        }
        foreach ($this->pdo->query('SELECT id, name AS k FROM age_groups') as $r) {
            $this->ageGroupCache[$r['k']] = (int)$r['id'];
        }
    }

    private function getOrCreatePeriod(string $label): int
    {
        if (isset($this->periodCache[$label])) return $this->periodCache[$label];
        $yearNum = 0;
        if (preg_match('/(\d{4})/', $label, $m)) $yearNum = (int)$m[1];
        $isFull = preg_match('/^\s*\d{4}\s*$/', $label) ? 1 : 0;
        $so = $isFull ? $yearNum * 100 + 99 : $yearNum * 100 + 5;
        $st = $this->pdo->prepare(
            'INSERT INTO periods (label, year_num, is_full_year, sort_order) VALUES (?, ?, ?, ?)'
        );
        $st->execute([$label, $yearNum, $isFull, $so]);
        $id = (int)$this->pdo->lastInsertId();
        $this->periodCache[$label] = $id;
        return $id;
    }

    private function getOrCreateCategory(string $name): int
    {
        if (isset($this->categoryCache[$name])) return $this->categoryCache[$name];
        $maxOrder = (int)$this->pdo->query(
            'SELECT IFNULL(MAX(sort_order), 0) FROM categories'
        )->fetchColumn();
        $st = $this->pdo->prepare(
            'INSERT INTO categories (topic_id, name, sort_order) VALUES (?, ?, ?)'
        );
        $st->execute([$this->topicId, $name, $maxOrder + 10]);
        $id = (int)$this->pdo->lastInsertId();
        $this->categoryCache[$name] = $id;
        return $id;
    }

    private function getOrCreateCity(string $name): int
    {
        if (isset($this->cityCache[$name])) return $this->cityCache[$name];
        $isTotal  = ($name === 'ВКО (всего)') ? 1 : 0;
        $maxOrder = (int)$this->pdo->query(
            'SELECT IFNULL(MAX(sort_order), 0) FROM cities'
        )->fetchColumn();
        $st = $this->pdo->prepare(
            'INSERT INTO cities (name, is_region_total, sort_order) VALUES (?, ?, ?)'
        );
        $st->execute([$name, $isTotal, $maxOrder + 10]);
        $id = (int)$this->pdo->lastInsertId();
        $this->cityCache[$name] = $id;
        return $id;
    }

    private function getOrCreateAgeGroup(string $name): int
    {
        if (isset($this->ageGroupCache[$name])) return $this->ageGroupCache[$name];
        $order = match (mb_strtolower($name)) {
            'всего'     => 10,
            'взрослые'  => 20,
            'подростки' => 30,
            'дети'      => 40,
            default     => 99,
        };
        $st = $this->pdo->prepare('INSERT INTO age_groups (name, sort_order) VALUES (?, ?)');
        $st->execute([$name, $order]);
        $id = (int)$this->pdo->lastInsertId();
        $this->ageGroupCache[$name] = $id;
        return $id;
    }
}
