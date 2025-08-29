# Nginx serves whatever you mount in via docker-compose
FROM nginx:alpine

# Remove the image's default server config so our mounted configs take over cleanly
RUN rm -f /etc/nginx/conf.d/default.conf

# Ports are handled by docker-compose; exposing is optional
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
