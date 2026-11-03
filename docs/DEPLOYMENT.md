# Размещение текущей версии

Один Node.js-сервис Railway запускает существующий Next.js SSR и общий server/. PostgreSQL — только Supabase. Для первого просмотра используется HTTPS-домен Railway; Cloudflare/DNS собственного домена настраивается отдельно, без дублирования backend в Workers.

## Образ и окружение
Dockerfile устанавливает pnpm по закреплённой версии и frozen lockfile, генерирует Prisma Client, собирает приложение без доступа к БД. Runtime работает от node, не root. В образе остаются Prisma CLI и tsx для миграций и однократного создания администратора. .env, локальные зависимости и кеши исключены из контекста сборки.

Переменные Railway (только серверные, без NEXT_PUBLIC_):
- NODE_ENV=production, PORT=3000, HOSTNAME=0.0.0.0.
- APP_ORIGIN — точный HTTPS origin созданного домена, без пути.
- DATABASE_URL — строка Supabase Session pooler (порт 5432, IPv4) с sslmode=require или более строгой проверкой TLS. Пароль URL-encoded. Не помещать строку в GitHub, чат или логи.
- DIRECT_URL — необязательная отдельная строка миграций: direct при доступном IPv6 либо Session pooler 5432. При отсутствии используется DATABASE_URL. Transaction pooler 6543 для миграций не выбирать.

Достаточно одной реплики в Amsterdam рядом с Supabase Ireland. Приложение использует не более пяти соединений на процесс, с ограничениями ожидания подключения/запроса. Пароли bootstrap не хранить в постоянных переменных сервиса.

## Настройки Railway
Источник — alexanderavyasov2605/Studio-OS-, ветка release/production-review, корень репозитория. Dockerfile определяется автоматически; build/start берутся из него.

В Settings задать:
- Pre-deploy command: pnpm deploy:check && pnpm db:migrate && pnpm db:seed.
- Healthcheck Path: /api/health; Timeout: 120 секунд.
- Restart policy: On Failure, ограниченное число повторов.
- Public domain: HTTPS, target port 3000.

Новый сервис не полагается на устаревший railway.json: интерфейс Railway сообщает, что Config as Code для новых сервисов недоступен с 2026-08-28. Настройки выполняются в панели; для будущей автоматизации использовать актуальный IaC.

Preflight проверяет production-режим, HTTPS origin, TLS подключения и отсутствие постоянных bootstrap-секретов. Сбой останавливает release до миграций. Seed повторяем и сохраняет изменения каталога. /api/health возвращает только ok/200 либо unavailable/503 и проверяет доступ к таблицам каталога/сессий; исключения и адрес БД не раскрываются.

## Первый администратор
После успешного запуска открыть защищённую Railway Console/SSH и выполнить pnpm admin:bootstrap, передав ADMIN_EMAIL/ADMIN_PASSWORD только в окружение этой команды. Пароль не вводить аргументом и не сохранять в истории команд. Можно использовать интерактивный bash read -s для скрытого ввода пароля, затем удалить переменные. Создание пользователя и аудит атомарны; повторный bootstrap и повышение существующего клиента запрещены. Личный пароль вводит владелец.

## Проверка и откат
Проверить /api/health, пять изделий /catalog, карточку и картинки, гостевой redirect /admin, /admin/login, вход/выход и публикацию товара из /admin/catalog. /ui-kit в production должен возвращать 404. Секреты не должны появляться в HTML, JSON или логах.

Для отката выбирать предыдущую успешную сборку Railway. Схему БД автоматически назад не откатывать: финансовая история и данные каталога сохраняются. Перед будущими миграциями существующей рабочей БД настроить и проверить резервирование.

Первый просмотр на trial не является обещанием бессрочного бесплатного размещения: лимит и срок видны в аккаунте Railway. Подключение платного плана выполняет владелец отдельно.

Источники: [Railway pre-deploy](https://docs.railway.com/deployments/pre-deploy-command), [healthchecks](https://docs.railway.com/deployments/healthchecks), [Railway IaC](https://docs.railway.com/infrastructure-as-code), [Supabase Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres).
