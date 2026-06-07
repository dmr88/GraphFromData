# Graph From Data

Веб-приложение для построения графиков и диаграмм из Excel-файлов с возможностью переключать вкладки данных и менять тип графика через селектор.

## Возможности

- Загрузка `.xlsx` / `.xls` / `.csv` прямо в браузере (без сервера)
- Переключатель листов Excel (каждый лист — отдельный набор данных)
- Селектор типа графика: **bar, line, area, pie, scatter**
- Выбор колонок для осей X / Y, несколько серий одновременно
- Предпросмотр данных активного листа
- Автосохранение настроек (тип графика, активный лист, оси) в `localStorage`
- Архитектура с абстрактным слоем источника данных — легко подключить API/БД в будущем

## Стек

- **React 18** + **TypeScript** + **Vite**
- **Recharts** — графики
- **SheetJS (xlsx)** — парсинг Excel
- **Zustand** — управление состоянием + persist для localStorage
- **Tailwind CSS** — стилизация

## Локальный запуск (полный стек: фронт + API + БД)

Требуется **Node.js 20+** и **Docker** с плагином Compose.

```bash
# 1. Зависимости фронтенда
npm install

# 2. Поднимаем БД и PHP-API в Docker
docker compose -f docker-compose.dev.yml up -d --build

# 3. Создаём админа (admin / admin123)
docker compose -f docker-compose.dev.yml --profile setup run --rm admin-setup

# 4. Запускаем фронтенд
npm run dev
```

После запуска:
- **Фронт:** http://localhost:5173 (откроется автоматически)
- **API:** http://localhost:8080/api/*
- **MariaDB:** localhost:3306 (`gfd_user` / `gfd_pass` / `graph_from_data`)

Запросы `/api/*` из браузера автоматически проксируются Vite-ом на бэкенд, поэтому CORS не мешает.

**Что внутри БД сразу после старта:** **5 тем** (заболеваемость, питьевая вода, радиация, атмосфера, качество воздуха), 30 периодов, 44 города, 10 557 фактов. Это попадает туда автоматически из `backend/sql/seed.sql` при первом создании volume `dbdata`.

**Переключение тем и источников** в UI: вверху страницы — выпадающий список тем + кнопки «База данных» / «Excel-файл». В режиме API можно войти как `admin` / `admin123` и **залить новый Excel** через форму загрузки, указав целевую тему — данные попадут в БД (UPSERT по уникальному ключу).

> ⚠️ **Если у вас уже была старая версия БД** (только заболеваемость) — пересоздайте volume, чтобы применилась новая схема с темами:
> ```bash
> docker compose -f docker-compose.dev.yml down -v
> docker compose -f docker-compose.dev.yml up -d --build
> ```

**Полезные команды:**

```bash
# Перелить данные с нуля (стирает БД)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d

# Логи API
docker compose -f docker-compose.dev.yml logs -f api

# Зайти в БД через CLI
docker compose -f docker-compose.dev.yml exec db mariadb -ugfd_user -pgfd_pass graph_from_data

# Остановить
docker compose -f docker-compose.dev.yml down
```

## Работа только с Excel (без бэкенда)

Если нужно просто построить графики из локального xlsx и БД не интересует — пропускайте шаги 2-3, оставайтесь в режиме «Excel-файл» в UI. Для теста есть `public/заболеваемость_очищенный.xlsx` и `public/sample.xlsx`.

## Сборка для продакшена

```bash
npm run build      # сборка в папку dist/
npm run preview    # локальный предпросмотр сборки
```

## Развёртывание через Docker

В проекте уже лежат `Dockerfile`, `nginx.conf`, `docker-compose.yml` и `.dockerignore`. Образ multi-stage — сборка идёт в `node:20-alpine`, а раздаёт готовый сайт лёгкий `nginx:alpine`.

**Самый простой запуск (docker compose):**

```bash
docker compose up -d --build
```

Сайт будет доступен на `http://localhost` (порт 80). Чтобы изменить порт — отредактируйте секцию `ports` в `docker-compose.yml` (например, `"8080:80"`).

**Без compose, чистый Docker:**

```bash
docker build -t graph-from-data .
docker run -d -p 80:80 --restart unless-stopped --name gfd graph-from-data
```

**Обновление после изменений:**

```bash
docker compose up -d --build    # пересоберёт и перезапустит контейнер
```

**Деплой на сервер:** скопируйте всю папку проекта (или склонируйте git-репозиторий) на сервер, где установлен Docker, и выполните `docker compose up -d --build`. Никаких локальных Node.js/npm на сервере не нужно — сборка идёт внутри контейнера.

Для HTTPS поставьте перед контейнером reverse-proxy (Caddy / Traefik / nginx на хосте с Let's Encrypt) и проксируйте на порт контейнера.

## Структура проекта

```
src/
├── components/
│   ├── FileUploader.tsx       # загрузка Excel-файла
│   ├── SheetTabs.tsx          # переключатель листов
│   ├── ChartTypeSelector.tsx  # селектор типа графика
│   ├── AxisSelector.tsx       # выбор колонок X/Y
│   ├── DataTable.tsx          # предпросмотр данных
│   └── charts/
│       └── ChartRenderer.tsx  # отрисовка всех типов графиков
├── hooks/
│   └── useExcelData.ts        # хук для загрузки Excel
├── services/
│   └── dataSource.ts          # абстракция источника данных
├── store/
│   └── dataStore.ts           # Zustand-store с persist
├── types/
│   └── index.ts               # общие типы
├── App.tsx                    # корневой компонент
└── main.tsx                   # точка входа
```

## Расширение до базы данных

В файле `src/services/dataSource.ts` есть интерфейс `DataSource` и закомментированная заготовка `ApiDataSource`. Чтобы перейти на бэкенд:

1. Реализуйте `ApiDataSource` (или `DatabaseDataSource`) с тем же интерфейсом
2. Добавьте выбор источника в UI (или просто замените вызов в хуке)
3. Бэкенд должен возвращать данные в формате `Dataset` из `src/types/index.ts`

Рекомендуемый бэкенд-стек: **Node.js + Express/Fastify + Prisma + PostgreSQL** или **FastAPI + SQLAlchemy + PostgreSQL**.
