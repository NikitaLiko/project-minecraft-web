# Полная инструкция: API и игровая статистика для мода

Ваш бэкенд (pjm.likonchik.xyz) уже имеет API для статистики. Ниже — как подключить к нему мод и отобразить экран «Игровая статистика» (убийства, смерти, K/D, победы, поражения, время в игре).

---

## 1. Обзор API

| Метод | URL | Заголовок | Назначение |
|-------|-----|-----------|------------|
| **POST** | `/api/minecraft/event` | `X-API-Key` обязателен | Отправка событий: убийство, смерть, вход/выход, победа/поражение |
| **POST** | `/api/minecraft/stats` | `X-API-Key` обязателен | Полная синхронизация статистики (опционально) |
| **GET** | `/api/minecraft/stats/{username}` | не нужен | Получить статистику игрока для отображения в UI |

**Базовый URL:** `https://pjm.likonchik.xyz`

---

## 2. Получение API-ключа

Запросы **POST** к `/api/minecraft/event` и `/api/minecraft/stats` принимаются только с заголовком `X-API-Key` с валидным ключом из БД.

### Создание ключа в БД (один раз)

На сервере с проектом warborn выполните (подставьте свой ключ и имя):

```bash
cd /root/warborn
npx prisma db execute --stdin <<EOF
INSERT INTO api_keys (\`key\`, name) VALUES ('ваш-секретный-ключ-для-мода', 'minecraft-server');
EOF
```

Или через MySQL:

```sql
USE warborn;
INSERT INTO api_keys (`key`, name) VALUES ('ваш-секретный-ключ-для-мода', 'minecraft-server');
```

Ключ нужно будет прописать в конфиге мода (см. ниже).

---

## 3. Описание эндпоинтов

### 3.1. POST `/api/minecraft/event` — отправка событий

**Заголовки:**
- `Content-Type: application/json`
- `X-API-Key: <ваш_ключ>`

**Тело (JSON):**

Обязательные поля:
- `username` (string) — ник игрока (как на сайте).
- `uuid` (string) — UUID игрока (как в лаунчере/сайте, с дефисами).
- `event` (string) — тип события: `join` | `leave` | `kill` | `death` | `win` | `loss`.

Опционально:
- для `kill`: `victim` (string), `damageDealt` (number);
- для `death`: `killer` (string), `damageTaken` (number).

**Примеры:**

```json
{"username":"Likonchik","uuid":"c07a9841-2275-4ba0-8f1c-2e1599a1f22f","event":"join"}
```
```json
{"username":"Likonchik","uuid":"c07a9841-2275-4ba0-8f1c-2e1599a1f22f","event":"kill","victim":"Enemy","damageDealt":150}
```
```json
{"username":"Likonchik","uuid":"c07a9841-2275-4ba0-8f1c-2e1599a1f22f","event":"death","killer":"Sniper","damageTaken":100}
```
```json
{"username":"Likonchik","uuid":"c07a9841-2275-4ba0-8f1c-2e1599a1f22f","event":"win"}
```
```json
{"username":"Likonchik","uuid":"c07a9841-2275-4ba0-8f1c-2e1599a1f22f","event":"leave"}
```

**Успешный ответ:** `200 OK`, тело например: `{"success":true,"event":"kill"}`.

**Ошибки:** `401` (нет/неверный API-ключ), `404` (игрок не найден в БД сайта), `400` (неверный JSON или нет username/uuid/event).

---

### 3.2. POST `/api/minecraft/stats` — полная синхронизация (опционально)

Нужен, если мод сам хранит счётчики и периодически «сливает» их на сервер (например, раз в N минут или при выходе).

**Заголовки:** те же (Content-Type, X-API-Key).

**Тело (JSON):** обязательны `username`, `uuid`; остальные поля опциональны и перезаписывают значения в БД:

- `kills`, `deaths`, `wins`, `losses`
- `damageDealt`, `damageTaken`
- `blocksPlaced`, `blocksBroken`
- `playTime` (в минутах)
- `level`, `experience`, `money`, `faction`
- `isOnline` (boolean)

Пример:

```json
{
  "username": "Likonchik",
  "uuid": "c07a9841-2275-4ba0-8f1c-2e1599a1f22f",
  "kills": 10,
  "deaths": 3,
  "wins": 2,
  "losses": 1,
  "playTime": 120,
  "isOnline": true
}
```

---

### 3.3. GET `/api/minecraft/stats/{username}` — получение статистики для UI

Публичный запрос (без API-ключа). Используется модом для экрана «Игровая статистика».

**Пример:** `GET https://pjm.likonchik.xyz/api/minecraft/stats/Likonchik`

**Ответ 200 (JSON):**

```json
{
  "username": "Likonchik",
  "uuid": "c07a9841-2275-4ba0-8f1c-2e1599a1f22f",
  "kills": 10,
  "deaths": 3,
  "kd": "3.33",
  "wins": 2,
  "losses": 1,
  "playTime": 120,
  "level": 1,
  "experience": 0,
  "money": 0,
  "faction": null,
  "damageDealt": 1500,
  "damageTaken": 500,
  "blocksPlaced": 0,
  "blocksBroken": 0,
  "isOnline": true,
  "lastSeen": "2026-03-04T15:00:00.000Z",
  "registeredAt": "2026-01-15T10:00:00.000Z"
}
```

По этому ответу мод заполняет экран (УБИЙСТВА, СМЕРТИ, K/D, ПОБЕДЫ, ПОРАЖЕНИЯ, ВРЕМЯ В ИГРЕ).

---

## 4. Реализация в моде (логика)

### 4.1. Конфиг мода

- **API Base URL:** `https://pjm.likonchik.xyz`
- **API Key:** тот же, что добавлен в `api_keys` (только для POST event/stats).

Хранить в конфиге мода (config file или в коде для теста). Не светить ключ в открытых репозиториях.

### 4.2. Когда отправлять события

| Событие | Когда вызывать |
|---------|-----------------|
| `join` | Игрок зашёл на сервер (вход в мир / логин на вашем игровом режиме). |
| `leave` | Игрок вышел (дисконнект / выход из мира). |
| `kill` | Игрок кого-то убил (ваш код обрабатывает убийство). |
| `death` | Игрок умер (обработчик смерти). |
| `win` | Игрок победил в раунде/матче. |
| `loss` | Игрок проиграл раунд/матч. |

Данные для тела: `username` и `uuid` брать из текущего игрока (сессия/профиль после авторизации через лаунчер). UUID — в формате с дефисами (как в ответе authlib).

### 4.3. Время в игре (playTime)

- Вариант A: на бэкенде не обновлять playTime из мода — тогда в GET-статистике может быть 0, пока вы не добавите логику (например, по разнице lastSeen при join/leave).
- Вариант B: мод считает минуты в игре локально и раз в 5–10 минут или при выходе отправляет **POST /api/minecraft/stats** с полем `playTime` (в минутах). Тогда на экране «Время в игре» будет актуальное значение.

Рекомендация: считать время в моде и периодически (или при leave) отправлять POST `/api/minecraft/stats` с обновлённым `playTime`.

### 4.4. Отображение экрана «Игровая статистика»

1. По нажатию кнопки «Статистика» (или аналог) выполнить запрос:
   `GET https://pjm.likonchik.xyz/api/minecraft/stats/{username}`  
   где `username` — ник текущего игрока.
2. Распарсить JSON и подставить в UI:
   - УБИЙСТВА → `kills`
   - СМЕРТИ → `deaths`
   - K/D → `kd` (уже строка с двумя знаками после запятой)
   - ПОБЕДЫ → `wins`
   - ПОРАЖЕНИЯ → `losses`
   - ВРЕМЯ В ИГРЕ → `playTime` + « мин»

Если запрос вернул 404 или ошибку — показать «Игрок не найден» или «Нет данных».

---

## 5. Пример кода (Java, HTTP-клиент)

Ниже — минимальные примеры без привязки к конкретному загрузчику (Forge/NeoForge/Fabric). Адаптируйте под свой мод (события, конфиг, поток выполнения).

### 5.1. Отправка события (POST /api/minecraft/event)

```java
public static void sendEvent(String apiKey, String username, String uuid, String event,
                             String victim, String killer, Double damageDealt, Double damageTaken) {
    String url = "https://pjm.likonchik.xyz/api/minecraft/event";
    // Постройте JSON: username, uuid, event и при необходимости victim, killer, damageDealt, damageTaken
    String json = buildEventJson(username, uuid, event, victim, killer, damageDealt, damageTaken);

    HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .header("X-API-Key", apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

    try {
        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            // логировать response.body()
        }
    } catch (Exception e) {
        // логировать
    }
}

private static String buildEventJson(String username, String uuid, String event,
                                     String victim, String killer, Double damageDealt, Double damageTaken) {
    StringBuilder sb = new StringBuilder();
    sb.append("{\"username\":\"").append(escape(username)).append("\",\"uuid\":\"").append(escape(uuid)).append("\",\"event\":\"").append(event).append("\"");
    if (victim != null) sb.append(",\"victim\":\"").append(escape(victim)).append("\"");
    if (killer != null) sb.append(",\"killer\":\"").append(escape(killer)).append("\"");
    if (damageDealt != null) sb.append(",\"damageDealt\":").append(damageDealt);
    if (damageTaken != null) sb.append(",\"damageTaken\":").append(damageTaken);
    sb.append("}");
    return sb.toString();
}
```

### 5.2. Получение статистики для UI (GET /api/minecraft/stats/{username})

```java
public static String fetchStatsJson(String username) {
    String url = "https://pjm.likonchik.xyz/api/minecraft/stats/" + URLEncoder.encode(username, StandardCharsets.UTF_8);

    HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .build();

    try {
        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            return response.body();
        }
    } catch (Exception e) {
        // логировать
    }
    return null;
}
```

Дальше в моде парсить JSON (например, Gson/Jackson) и подставлять в экран:
- `kills`, `deaths`, `kd`, `wins`, `losses`, `playTime`.

### 5.3. Вызовы в нужные моменты

- При входе игрока в мир/на сервер: `sendEvent(apiKey, name, uuid, "join", null, null, null, null);`
- При выходе: `sendEvent(apiKey, name, uuid, "leave", null, null, null, null);`
- При убийстве: `sendEvent(apiKey, name, uuid, "kill", victimName, null, damageDealt, null);`
- При смерти: `sendEvent(apiKey, name, uuid, "death", null, killerName, null, damageTaken);`
- При победе/поражении: `sendEvent(apiKey, name, uuid, "win", null, null, null, null);` или `"loss"`.

`username` и `uuid` берите из игровой сессии (после authlib это должен быть тот же пользователь, что и на сайте).

---

## 6. Чек-лист по шагам

1. Создать API-ключ в таблице `api_keys` и прописать его в конфиге мода.
2. В моде при старте/остановке и при игровых событиях вызывать POST `/api/minecraft/event` с заголовком `X-API-Key`.
3. Реализовать экран «Игровая статистика»: по запросу делать GET `/api/minecraft/stats/{username}` и выводить убийства, смерти, K/D, победы, поражения, время в игре.
4. (Опционально) Вести учёт времени в игре и периодически или при выходе отправлять POST `/api/minecraft/stats` с `playTime`.

После этого статистика с сервера и экран в игре будут согласованы с вашим бэкендом pjm.likonchik.xyz.
