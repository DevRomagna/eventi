FROM php:7.0-apache
RUN docker-php-ext-install -j$(nproc) mysqli
COPY ./*.php /var/www/html/