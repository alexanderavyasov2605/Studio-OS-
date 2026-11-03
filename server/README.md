# Server boundary

Business logic and Prisma access belong here, shared by transports. Authentication is implemented in server/auth; catalog reads, validation and mutations in server/catalog. Other domains remain future work.
Every server entry point must import `server-only`.
Client components and browser-safe lib must not import this directory. Enumerated server adapters may import auth/pages, auth/http, catalog or catalog/admin; these entry points are marked server-only. Public catalog entry exports only public reads. Proxy uses the marked auth entry point. Internal Node modules also support trusted CLI/tests.
Prisma client output is ignored in server/generated/prisma and generated before build/typecheck. Authentication and database tools use it on the server; browser UI never imports it. Do not duplicate authorization in the route layer.
