# PHP 8.2 + Apache образ для бэкенда заболеваемости.
# Включает pdo_mysql, gd, zip (нужно PhpSpreadsheet), composer-зависимости.
FROM php:8.2-apache

# Системные библиотеки для расширений PHP
RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype-dev \
        libonig-dev \
        libxml2-dev \
        unzip \
        git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql gd zip mbstring xml \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer из официального образа
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Apache: mod_rewrite для .htaccess, AllowOverride для api/, лимиты на загрузку
RUN a2enmod rewrite headers
RUN { \
        echo '<Directory /var/www/html>'; \
        echo '    AllowOverride All'; \
        echo '    Require all granted'; \
        echo '</Directory>'; \
    } > /etc/apache2/conf-available/gfd-override.conf \
    && a2enconf gfd-override
RUN { \
        echo 'upload_max_filesize = 25M'; \
        echo 'post_max_size = 30M'; \
        echo 'memory_limit = 256M'; \
        echo 'max_execution_time = 120'; \
        echo 'date.timezone = Asia/Almaty'; \
    } > /usr/local/etc/php/conf.d/gfd.ini

WORKDIR /var/www/html

# Сначала только composer.json — чтобы слой с vendor/ кешировался отдельно
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader \
    || composer install --no-dev --no-interaction --no-progress

# Копируем остальной код
COPY . .

# Делаем папку загрузок записываемой для www-data
RUN mkdir -p uploads && chown -R www-data:www-data uploads

# Apache по умолчанию слушает 80. DocumentRoot = /var/www/html.
# Эндпоинты будут доступны как /api/endpoints/login.php, поэтому делаем
# симлинк /var/www/html/api -> /var/www/html/api (он уже там),
# но добавим .htaccess в api/ если понадобится rewrite.

EXPOSE 80
