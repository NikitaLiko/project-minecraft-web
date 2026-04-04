# Загрузка лаунчера

## Ошибка «Network error» или 413

При загрузке лаунчера (.exe, до 150 МБ) часто возникает **413 Payload Too Large** или «Network error», если nginx обрывает запрос.

### Решение: увеличить лимит в nginx

В конфиг nginx для сайта добавьте:

```nginx
client_max_body_size 150M;
```

Обычно это в `/etc/nginx/sites-available/` или в `server { ... }` блоке.

Пример:

```nginx
server {
    listen 443 ssl http2;
    server_name pjm.likonchik.xyz;
    client_max_body_size 150M;  # <-- добавить

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;  # для долгих загрузок
    }
}
```

После правок:

```bash
sudo nginx -t && sudo systemctl reload nginx
```
