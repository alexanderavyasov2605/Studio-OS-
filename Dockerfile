FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.25.0
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
# Keep Prisma CLI/tsx in this MVP image for release migrations and one-time setup.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next-auth ./.next-auth
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/prisma.config.ts /app/next.config.ts /app/tsconfig.json ./
USER node
EXPOSE 3000
CMD ["pnpm", "start", "--hostname", "0.0.0.0"]
