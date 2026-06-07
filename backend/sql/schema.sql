-- =====================================================================
-- Схема БД для проекта Graph From Data — экологические и медицинские
-- показатели по Восточно-Казахстанской области (ВКО).
--
-- Звезда: 4 общих справочника (themes/topics, periods, cities, age_groups)
-- + категории (привязаны к теме) + одна факт-таблица measurements.
-- Часть размерностей опциональна — например, у питьевой воды нет города,
-- у атмосферы нет возрастной группы.
--
-- СУБД: MySQL 5.7+ / MariaDB 10.3+
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- ТЕМЫ (заболеваемость, питьевая вода, радиация, атмосфера и т.д.)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `topics`;
CREATE TABLE `topics` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug`        VARCHAR(64)  NOT NULL COMMENT 'morbidity, water, radiation, ...',
    `name`        VARCHAR(128) NOT NULL COMMENT 'Человекочитаемое имя темы',
    `description` VARCHAR(512) NULL,
    `unit`        VARCHAR(64)  NULL COMMENT 'Единица измерения по умолчанию (например: случаев на 100 000)',
    `sort_order`  INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_topic_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Тематические разделы (заболеваемость, питьевая вода, радиация, атмосфера, качество воздуха)';

-- ---------------------------------------------------------------------
-- ОБЩИЕ СПРАВОЧНИКИ
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `periods`;
CREATE TABLE `periods` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `label`        VARCHAR(32)  NOT NULL,
    `year_num`     SMALLINT     NOT NULL,
    `is_full_year` TINYINT(1)   NOT NULL DEFAULT 1,
    `sort_order`   INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_period_label` (`label`),
    KEY `idx_year` (`year_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Периоды наблюдения (годы, кварталы, месяцы, полугодия)';

DROP TABLE IF EXISTS `cities`;
CREATE TABLE `cities` (
    `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`            VARCHAR(128) NOT NULL,
    `is_region_total` TINYINT(1)   NOT NULL DEFAULT 0,
    `sort_order`      INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_city_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Города и районы ВКО (общий справочник для всех тем)';

DROP TABLE IF EXISTS `age_groups`;
CREATE TABLE `age_groups` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(32)  NOT NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_age_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Возрастные группы (только для темы заболеваемости)';

-- ---------------------------------------------------------------------
-- КАТЕГОРИИ — привязаны к теме
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `topic_id`   INT UNSIGNED NOT NULL,
    `name`       VARCHAR(255) NOT NULL COMMENT 'Болезнь, загрязнитель, показатель',
    `unit`       VARCHAR(64)  NULL COMMENT 'Единица измерения (переопределяет тему)',
    `sort_order` INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_topic_category` (`topic_id`, `name`),
    KEY `idx_category_topic` (`topic_id`),
    CONSTRAINT `fk_category_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Категории показателей (уникальны в рамках темы)';

-- ---------------------------------------------------------------------
-- ФАКТ-ТАБЛИЦА (одна строка — одно числовое значение в разрезе)
-- city_id и age_group_id могут быть NULL для тем без этих размерностей.
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `measurements`;
CREATE TABLE `measurements` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `topic_id`     INT UNSIGNED    NOT NULL,
    `period_id`    INT UNSIGNED    NOT NULL,
    `category_id`  INT UNSIGNED    NOT NULL,
    `city_id`      INT UNSIGNED    NULL,
    `age_group_id` INT UNSIGNED    NULL,
    `value`        DECIMAL(18, 4)  NOT NULL,
    `value_extra`  DECIMAL(18, 4)  NULL COMMENT 'Дополнительное значение (например, макс при наличии средней)',
    `note`         VARCHAR(255)    NULL COMMENT 'Свободный комментарий (исходное значение, если был диапазон)',
    `created_at`   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Хитрость: MySQL считает NULL уникальными значениями, поэтому ON DUPLICATE KEY
    -- не сработает для тем без city/age. Используем generated-колонки с COALESCE(..., 0)
    -- как «реальный» уникальный ключ. INSERT/UPDATE по-прежнему работает с NULL.
    `city_key`     INT UNSIGNED GENERATED ALWAYS AS (IFNULL(`city_id`, 0))      STORED,
    `age_key`      INT UNSIGNED GENERATED ALWAYS AS (IFNULL(`age_group_id`, 0)) STORED,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_dimensions`
        (`topic_id`, `period_id`, `category_id`, `city_key`, `age_key`),
    KEY `idx_topic_period`    (`topic_id`, `period_id`),
    KEY `idx_topic_category`  (`topic_id`, `category_id`),
    KEY `idx_city`            (`city_id`),
    CONSTRAINT `fk_m_topic`     FOREIGN KEY (`topic_id`)     REFERENCES `topics`     (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_m_period`    FOREIGN KEY (`period_id`)    REFERENCES `periods`    (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_m_category`  FOREIGN KEY (`category_id`)  REFERENCES `categories` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_m_city`      FOREIGN KEY (`city_id`)      REFERENCES `cities`     (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_m_age_group` FOREIGN KEY (`age_group_id`) REFERENCES `age_groups` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Универсальная факт-таблица для всех тем';

-- ---------------------------------------------------------------------
-- СЛУЖЕБНЫЕ
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username`      VARCHAR(64)  NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_login_at` TIMESTAMP    NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `upload_log`;
CREATE TABLE `upload_log` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `topic_id`       INT UNSIGNED    NULL,
    `filename`       VARCHAR(255)    NOT NULL,
    `file_size`      INT UNSIGNED    NOT NULL,
    `rows_inserted`  INT             NOT NULL DEFAULT 0,
    `rows_updated`   INT             NOT NULL DEFAULT 0,
    `rows_skipped`   INT             NOT NULL DEFAULT 0,
    `status`         ENUM('success','partial','failed') NOT NULL,
    `error_message`  TEXT            NULL,
    `uploaded_by`    INT UNSIGNED    NULL,
    `uploaded_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_uploaded_at` (`uploaded_at`),
    CONSTRAINT `fk_upload_admin` FOREIGN KEY (`uploaded_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_upload_topic` FOREIGN KEY (`topic_id`)    REFERENCES `topics` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Представление для удобных JOIN-запросов
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW `v_measurements_full` AS
SELECT
    t.slug        AS topic_slug,
    t.name        AS topic,
    p.label       AS period,
    p.year_num    AS year_num,
    c.name        AS category,
    c.unit        AS category_unit,
    ci.name       AS city,
    ci.is_region_total,
    a.name        AS age_group,
    m.value       AS value,
    m.value_extra AS value_extra,
    m.note        AS note,
    m.updated_at  AS updated_at
FROM measurements m
INNER JOIN topics     t  ON t.id  = m.topic_id
INNER JOIN periods    p  ON p.id  = m.period_id
INNER JOIN categories c  ON c.id  = m.category_id
LEFT  JOIN cities     ci ON ci.id = m.city_id
LEFT  JOIN age_groups a  ON a.id  = m.age_group_id;
