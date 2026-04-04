# Настройка SSL (HTTPS) для pjm.likonchik.xyz

Сообщение браузера «Небезопасно» или «Опасно» при входе на сайт обычно означает одно из:

- **Нет валидного SSL-сертификата** — используется HTTP или самоподписанный сертификат.
- **Сертификат просрочен** или выдан для другого домена.
- **Nginx не настроен на использование сертификата** Let's Encrypt.

Ниже — как поставить доверенный бесплатный сертификат и проверить его.

---

## 1. Быстрая проверка на сервере

На машине, где крутится nginx, выполните:

```bash
# Есть ли сертификаты Let's Encrypt?
ls -la /etc/letsencrypt/live/

# Срок действия сертификата для вашего домена (подставьте свой домен)
openssl x509 -enddate -noout -in /etc/letsencrypt/live/pjm.likonchik.xyz/fullchain.pem

# Какой сертификат отдаёт nginx при запросе по HTTPS?
echo | openssl s_client -servername pjm.likonchik.xyz -connect pjm.likonchik.xyz:443 2>/dev/null | openssl x509 -noout -dates -subject
```

Если каталога `live/pjm.likonchik.xyz` нет или сертификат просрочен — нужны шаги ниже.

---

## 2. Установка Certbot (Let's Encrypt)

На сервере (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

Для других ОС: https://certbot.eff.org/ — выберите систему и «Nginx».

---

## 3. Получение сертификата

**Важно:** домен `pjm.likonchik.xyz` должен указывать (DNS A-запись) на IP этого сервера. Порт 80 должен быть открыт с интернета (для проверки Let's Encrypt).

```bash
# Certbot сам подставит сертификат в nginx, если найдёт виртуальный хост для домена
sudo certbot --nginx -d pjm.likonchik.xyz
```

Следуйте подсказкам (email, согласие с условиями). Certbot:

- получит сертификат;
- прописал в nginx использование `fullchain.pem` и `privkey.pem`;
- при необходимости включит редирект HTTP → HTTPS.

Проверка:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

После этого откройте в браузере https://pjm.likonchik.xyz — предупреждение «Опасно» должно пропасть (при условии что нет других проблем с цепочкой/доменом).

---

## 4. Если nginx правите вручную

Типичный фрагмент для HTTPS в конфиге nginx (пути к сертификатам — как после `certbot --nginx`):

```nginx
server {
    listen 443 ssl http2;
    server_name pjm.likonchik.xyz;

    ssl_certificate     /etc/letsencrypt/live/pjm.likonchik.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pjm.likonchik.xyz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;  # если есть
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Редирект с HTTP на HTTPS:

```nginx
server {
    listen 80;
    server_name pjm.likonchik.xyz;
    return 301 https://$host$request_uri;
}
```

Проверка и перезагрузка:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Автопродление сертификата

Let's Encrypt выдаёт сертификаты на 90 дней. Продление:

```bash
sudo certbot renew --dry-run   # проверка
sudo certbot renew             # реальное продление
```

Обычно уже настроен таймер/крон:

```bash
systemctl list-timers | grep certbot
# или
sudo cat /etc/cron.d/certbot
```

При необходимости добавьте в cron:

```bash
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 6. HSTS (опционально)

После того как HTTPS работает и предупреждение пропало, можно включить HSTS в приложении, чтобы браузер всегда ходил по HTTPS. В проекте уже есть заголовки в `next.config.ts`; при желании можно добавить (только если сайт **всегда** доступен по HTTPS):

```ts
{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }
```

Добавляйте HSTS только когда уверены в стабильной работе HTTPS, иначе пользователь может «застрять» на HTTPS при сбоях сертификата.

---

## 7. Что проверить, если всё ещё «Опасно»

| Проблема | Что сделать |
|----------|-------------|
| Сертификат самоподписанный | Получить сертификат через `certbot --nginx -d pjm.likonchik.xyz` и перезагрузить nginx. |
| Сертификат просрочен | `sudo certbot renew` и `sudo systemctl reload nginx`. |
| Домен в сертификате не совпадает | В certbot указать нужный домен: `-d pjm.likonchik.xyz`. |
| Nginx не использует сертификат | В `server { listen 443 ssl; ... }` указать `ssl_certificate` и `ssl_certificate_key` на файлы из `/etc/letsencrypt/live/pjm.likonchik.xyz/`. |
| Порт 443 закрыт файрволом | Открыть: `sudo ufw allow 443/tcp && sudo ufw reload` (или аналог для вашего файрвола). |

После корректной настройки сертификата и nginx браузер перестаёт показывать предупреждение для https://pjm.likonchik.xyz.
