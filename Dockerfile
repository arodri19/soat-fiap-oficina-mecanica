# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
# instala todas as deps (incluindo devDeps para o prisma generate)
RUN npm ci

COPY prisma ./prisma
# gera o Prisma Client no stage de build
RUN npx prisma generate

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# copia apenas as deps de produção
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# copia o cliente Prisma gerado e o schema (necessário para migrations em runtime)
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# copia o código da aplicação
COPY src ./src

USER node

EXPOSE 4000

CMD ["node", "src/index.js"]
