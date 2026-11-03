# Вход через Telegram

Telegram Login (OpenID Connect) от @StudiaOSBot. Отдельный процесс бота, webhook и Mini App не создаются. Bot API token не нужен. Пароль Telegram сайт не принимает.

## Настройка
В BotFather переключить Login Widget на OpenID Connect Login. Добавить Allowed URLs:
- https://studio-os-production-edbe.up.railway.app
- https://studio-os-production-edbe.up.railway.app/api/auth/telegram/callback

В секретах Node.js сервиса задать TELEGRAM_CLIENT_ID=9297780783, TELEGRAM_CLIENT_SECRET из BotFather и TELEGRAM_ADMIN_ID=930826522. APP_ORIGIN должен точно соответствовать HTTPS-домену. Секрет не помещать в Git, NEXT_PUBLIC_, браузер, отчёт или аргументы команд. Для локальной среды отдельно зарегистрировать её origin/callback в BotFather. Без полной конфигурации кнопка отключена. Новую production-версию публиковать после отдельного разрешения владельца.

## Доверие и права
POST /api/auth/telegram/start требует точного Origin, ограничивает попытки общим с password login глобальным лимитом 30 в минуту, создаёт state, PKCE S256 и nonce на 5 минут. Lax HttpOnly cookie привязывает callback к браузеру; в production она Secure и __Host-. В БД только хеши state/cookie и временные verifier/nonce; истёкшие попытки очищаются при новом входе.

Callback обменивает code только на фиксированном Telegram endpoint. Проверяются RS256 подпись по фиксированному JWKS, issuer, audience, nonce, exp/iat/nbf и безопасный числовой id. JWKS кешируется на 5 минут. Попытка потребляется один раз даже при конкуренции. Ответы ограничены по размеру, запросы — по времени. URL возврата задаёт сервер.

Только подтверждённый id 930826522 при совпадении с TELEGRAM_ADMIN_ID получает ADMIN с аудитом. Username, имя, email, query и браузерные роли прав не дают. Другие новые пользователи получают CLIENT. Связь — уникальный TelegramIdentity.telegramUserId; объединения по email нет. Повторный вход не дублирует пользователя. Заблокированный User не активируется автоматически.

Используется существующая AdminSession и инфраструктура отзыва. Имя таблицы сохранено для совместимости; authProvider различает PASSWORD и TELEGRAM. Password-сессии проверяют версию Credential; Telegram-сессии требуют identity, а ADMIN — актуальный owner ID. Удаление identity, блокировка User, отзыв сессии и удаление owner ID прекращают соответствующий доступ. Logout отзывает токен в БД и очищает cookie. Права проверяются на сервере при каждом защищённом запросе.

Cookie содержит случайный opaque token, в БД — SHA-256; HttpOnly/Secure/SameSite=Strict, 8 часов. Telegram id_token/access_token не хранятся. Аудит содержит создание, выдачу owner-права, успешный/ошибочный вход и logout без секретов. /login, /account и /admin/login используют одну интеграцию; аккаунт показывает только факт входа, без новой логики заказов.

## Проверки
pnpm test: подпись/подмена ID, алгоритм, ключ, issuer/audience/nonce, сроки и числовые ограничения.

pnpm telegram:test: только отдельная пустая локальная БД *_test с одинаковыми DATABASE_URL/DATABASE_TEST_URL. Проверяет browser binding, replay, гонку, истечение, PKCE, ADMIN владельца, CLIENT без прав админки, отзыв owner ID, блокировку, logout и отсутствие секретов в аудите. Telegram заменён подписанными синтетическими ответами; это не live-проверка Telegram.

После размещения владелец завершает реальный вход в Telegram и проверяет /admin. Проверка внешнего входа не завершена до этого подтверждения.

Источник: [официальный Telegram Login / OIDC](https://core.telegram.org/bots/telegram-login).

Успешный callback возвращает HTML-документ 200 с CSP nonce, внутренней навигацией и ссылкой для браузера без JavaScript. Он завершает cross-site цепочку до перехода в /admin или /account, чтобы SameSite=Strict cookie отправлялась корректно. Внешние адреса назначения не принимаются. Live id может быть десятичной строкой: нормализация выполняется после проверки подписи с ограничением безопасного целого.
