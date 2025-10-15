# syntax=docker.io/docker/dockerfile:1

FROM imbios/bun-node:23-debian AS base

FROM base AS deps
WORKDIR /app

# Copie Prisma avant d’installer pour pouvoir build les schémas si besoin
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Copie les fichiers de dépendances
COPY package.json bun.lock* ./

# Installation selon le gestionnaire de paquets
RUN \
  if [ -f bun.lock ]; then bun install --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Prisma doit être installé ici (pour les migrations)
RUN bun add -D prisma
ENV PATH="/root/.bun/bin:${PATH}"

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma présent ici aussi (nécessaire pour build et migrations)
RUN bun add -D prisma
ENV PATH="/root/.bun/bin:${PATH}"

# ⚙️ Build de l’application Next.js
RUN bun run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1  # (optionnel)

# Création de l'utilisateur non-root
RUN addgroup --system --gid 3000 nodejs \
 && adduser --system --uid 3000 nextjs

# Copie du build standalone Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copie node_modules pour que Prisma et Bun soient dispo
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

RUN chown -R nextjs:nodejs /app/node_modules /app/.next /app/prisma

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node server.js"]