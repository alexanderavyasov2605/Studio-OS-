# Server boundary

Business logic and Prisma access belong here, shared by transports. Authentication is implemented in server/auth; other domains remain future work.
Every server entry point must import `server-only`.
Client components and browser-safe lib must not import this directory. Only the enumerated server admin pages/HTTP adapter may import auth/pages or auth/http; both entry points are marked server-only. Proxy uses the marked auth entry point. Internal Node modules also support trusted CLI/tests.
Prisma client output is ignored in server/generated/prisma and generated before build/typecheck. Authentication and database tools use it on the server; browser UI never imports it. Do not duplicate authorization in the route layer.
