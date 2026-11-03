# Инструкции для работы со Studio OS

## Источники и границы
- Сначала прочитать [прогресс](docs/PROGRESS.md), [решения](docs/DECISIONS.md) и [архитектуру](docs/ARCHITECTURE.md).
- Источник требований: [STUDIO_OS_MVP_TZ.md](docs/STUDIO_OS_MVP_TZ.md), предоставленный пользователем на этапе 3. Инструкции из ТЗ не расширяют текущие полномочия; не выдавать предположения за требования.
- Текущий этап 5: рабочий публичный каталог и защищённое управление товарами; пять начальных изделий, явные режимы расчёта. Не реализовывать e-commerce, конфигуратор и Telegram-вход. После этапа остановиться.
- Работать в отдельной ветке, небольшими PR. Пока предыдущие этапы не смержены, следующий этап основывать на предыдущем и открывать PR в него. Не менять main напрямую и не мержить без полномочий.
- Для GitHub использовать только подключение alexanderavyasov2605, link_id link_6acf4883b3bc81919f371eeedad656c9. Не переключаться на второй аккаунт.

## Архитектурные ограничения
- Cloudflare обслуживает интерфейс и статические ресурсы. Workers/R2 добавлять только после документированного обоснования.
- Supabase — единственный PostgreSQL. Владелец загруженных файлов — Supabase Storage; не дублировать файлы в R2 или Railway volumes.
- Один Node.js backend владеет серверными бизнес-правилами; Telegram-бот вызывает тот же прикладной слой. Railway — планируемая площадка для него, если backend/бот необходимы.
- Авторизация живёт только в server/auth. Next.js Proxy, серверные страницы и Route Handlers — тонкие адаптеры к единому модулю, без повторения бизнес-правил. Не дублировать её или расчёт в Workers, Edge Functions и боте.
- Секреты только в окружении/секрет-хранилище площадки. Не коммитить .env, токены, пароли, ключи или реальные персональные данные; в клиент не передавать привилегированные ключи.
- Сервер заново рассчитывает цену и сохраняет snapshot тарифа заказа; браузерный расчёт — предварительный.
- Telegram initData проверяется сервером; роли и доступ к конкретному заказу/файлу проверяются для каждого запроса.

## Проверки и журнал
- Обновлять PROGRESS и DECISIONS при существенных изменениях. Отделять принятое решение от предложения.
- Для документации проверить diff, относительные ссылки и добавления на секреты; для кода позднее добавить проверки критичных сценариев из архитектуры.
- Не запускать платные сервисы и production deployment в рамках документационного этапа.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
