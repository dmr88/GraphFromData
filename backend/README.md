# Graph From Data — Backend

PHP 8 + MySQL/MariaDB бэкенд для проекта заболеваемости ВКО. Предоставляет REST-API для фронтенда и эндпоинт загрузки Excel.

## Структура

```
backend/
├── composer.json
├── api/
│   ├── config.example.php        # шаблон конфига
│   ├── config.php                # ваш реальный конфиг (не в git)
│   ├── bootstrap.php             # общая инициализация (PDO, сессия, CORS)
│   ├── lib/
│   │   └── ExcelImporter.php     # парсинг и UPSERT данных из Excel
│   └── endpoints/
│       ├── login.php             # POST  /api/login.php
│       ├── logout.php            # POST  /api/logout.php
│       ├── me.php                # GET   /api/me.php
│       ├── metadata.php          # GET   /api/metadata.php
│       ├── data.php              # GET   /api/data.php?...
│       └── upload.php            # POST  /api/upload.php (auth)
├── scripts/
│   ├── generate_seed.py          # одноразовая генерация seed.sql из xlsx
│   └── create_admin.php          # создание/обновление админа из CLI
├── sql/
│   ├── schema.sql                # DDL: создание всех таблиц
│   └── seed.sql                  # 7632 строки начальных данных
└── uploads/                      # принимает загруженные через API файлы
```

## Установка на BitrixVM (CentOS 7)

### 1. Создание БД и пользователя

Зайдите на сервер и подключитесь к MySQL под root:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE graph_from_data
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gfd_user'@'localhost' IDENTIFIED BY 'ПРИДУМАЙТЕ_СИЛЬНЫЙ_ПАРОЛЬ';
GRANT ALL PRIVILEGES ON graph_from_data.* TO 'gfd_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Заливка структуры и данных

```bash
mysql -u gfd_user -p graph_from_data < sql/schema.sql
mysql -u gfd_user -p graph_from_data < sql/seed.sql
```

Проверка:

```bash
mysql -u gfd_user -p graph_from_data -e "SELECT COUNT(*) AS facts FROM morbidity;"
# Должно быть 7632
```

### 3. Установка зависимостей (Composer)

На BitrixVM composer обычно есть. Если нет:

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

Установка PhpSpreadsheet:

```bash
cd /home/bitrix/ext_www/db.zweb.kz/backend
composer install --no-dev --optimize-autoloader
```

### 4. Конфигурация

```bash
cp api/config.example.php api/config.php
nano api/config.php   # вписать пароль БД и домен фронта
chmod 600 api/config.php   # никто, кроме владельца, не прочитает
```

### 5. Создание администратора

```bash
php scripts/create_admin.php admin МойСложныйПароль123
```

### 6. Конфиг nginx (BitrixVM)

Откройте `/etc/nginx/bx/site_avaliable/bx_ext_db.zweb.kz.conf` и убедитесь, что в нём есть **обработка PHP** (по умолчанию BitrixVM добавляет её при создании сайта в меню). Также добавьте отдельный location для статики из `dist/` и API:

```nginx
server {
    listen 80;
    server_name db.zweb.kz;

    root /home/bitrix/ext_www/db.zweb.kz;
    index index.html;

    # Бэкенд: PHP-эндпоинты
    location ^~ /api/ {
        # Передаём в PHP-FPM (путь сокета может отличаться, проверьте у себя)
        location ~ \.php$ {
            try_files $uri =404;
            fastcgi_pass   unix:/var/run/php-fpm/php-fpm.sock;
            fastcgi_index  index.php;
            fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include        fastcgi_params;
        }
    }

    # Фронтенд: статика + SPA-fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

После правки:

```bash
nginx -t && systemctl reload nginx
```

### 7. Размещение PHP-файлов

Бэкенд должен быть доступен по пути `/api/`. Самый простой вариант — положить папку `api/` рядом с `index.html`:

```
/home/bitrix/ext_www/db.zweb.kz/
├── index.html               ← фронт (билд)
├── assets/                  ← фронт
└── api/                     ← симлинк или копия backend/api
    ├── bootstrap.php
    ├── config.php
    ├── endpoints/...
    └── lib/...
```

Аналогично — папка `vendor/` (зависимости Composer) должна быть **вне** доступных через web папок, либо в .htaccess/nginx надо явно её заблокировать.

**Рекомендуемый порядок:** держите весь бэкенд в `/home/bitrix/ext_www/db.zweb.kz/backend/`, а в корне сайта создайте симлинк:

```bash
cd /home/bitrix/ext_www/db.zweb.kz
ln -s backend/api api
```

## Проверка работы

```bash
# Должен вернуть JSON со справочниками
curl https://db.zweb.kz/api/metadata.php | head -c 500

# Должен вернуть { "authenticated": false }
curl https://db.zweb.kz/api/me.php

# Логин (с сохранением cookie)
curl -c cookie.txt -X POST https://db.zweb.kz/api/login.php \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"МойСложныйПароль123"}'

# Загрузка Excel (с использованием cookie)
curl -b cookie.txt -X POST https://db.zweb.kz/api/upload.php \
     -F "file=@/path/to/новые_данные.xlsx"
```

## Формат Excel для загрузки

Лист с именем **"Полные данные"** и колонками (любой порядок):

| Год | Категория | Город | Возрастная группа | Значение |
|---|---|---|---|---|
| 2025 | Все болезни | Өскемен | Всего | 48125.3 |
| 2025 | Все болезни | Өскемен | Взрослые | 38940.1 |
| ... | ... | ... | ... | ... |

Поведение:
- Если строка с такими же (Год, Категория, Город, Возраст) уже есть — значение перезаписывается.
- Если значения нет — создаётся новая запись.
- Новые города, категории, периоды, возрастные группы создаются автоматически.
- Импорт атомарный: либо все строки применились, либо ничего (откат при ошибке).

## API: краткая справка

| Эндпоинт | Метод | Описание |
|---|---|---|
| `/api/login.php`    | POST | Авторизация (body: `{username, password}`) |
| `/api/logout.php`   | POST | Закрыть сессию |
| `/api/me.php`       | GET  | Проверить текущую сессию |
| `/api/metadata.php` | GET  | Получить все справочники для селекторов |
| `/api/data.php`     | GET  | Получить данные с фильтрами |
| `/api/upload.php`   | POST | Загрузить Excel (auth, multipart, поле `file`) |

Параметры `/api/data.php` (все опциональны):
- `period_id=1,2,3` — фильтр по периодам
- `category_id=...` — по категориям
- `city_id=...` — по городам
- `age_group_id=...` — по возрастам
