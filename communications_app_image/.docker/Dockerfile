# Stage 1: Build the Node.js application
FROM node:23.1-alpine

RUN apk add --no-cache nginx && apk add openrc
RUN adduser -D -g 'www' www
ADD . /app
# Set working directory
WORKDIR /app

RUN chown -R www:www /app
RUN npm install
RUN npm run build:prod # If you have a build step for your Node.js app

WORKDIR /etc/nginx
COPY ./communications_app_image/nginx.conf /etc/nginx
COPY ./communications_app_image/communications-app.conf /etc/nginx/sites-enabled/

RUN mkdir -p /var/www/app.wisecodedev.com
RUN chown -R www:www /var/www/app.wisecodedev.com
RUN cp -a /app/build/. /var/www/app.wisecodedev.com

COPY ./communications_app_image/start-nginx /usr/local/bin
RUN chmod -R 755 /usr/local/bin/start-nginx

CMD ["start-nginx"]