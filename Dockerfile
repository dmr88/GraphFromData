# ============================================================
# Этап 1: сборка фронтенда
# ============================================================
FROM node:20-alpine AS build

WORKDIR /app

# Копируем только манифесты, чтобы кешировать npm install отдельно от исходников
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Копируем исходники и собираем
COPY . .
RUN npm run build

# ============================================================
# Этап 2: лёгкий nginx, отдающий собранные статические файлы
# ============================================================
FROM nginx:alpine AS runtime

# Удаляем дефолтный конфиг и кладём свой
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранный фронт из этапа build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Простая проверка живости — что nginx отвечает на порту 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
