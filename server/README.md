# Server boundary

Future business logic and Prisma access belong here, shared by the backend and bot.
Every server entry point must import `server-only`.
UI (`app`, `components`) and browser-safe `lib` must not import this directory.
No API routes, Server Actions, queries, auth or domain operations exist in stage 1.
Prisma client output is ignored in `server/generated/prisma`; it is not generated or imported by the UI build.
