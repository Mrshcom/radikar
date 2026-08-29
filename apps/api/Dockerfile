FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/validators/package.json packages/validators/package.json
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev \
      --workspace @radicar/api \
      --workspace @radicar/config \
      --workspace @radicar/database \
      --workspace @radicar/ai \
      --workspace @radicar/shared-types \
      --workspace @radicar/validators \
      --include-workspace-root=false

COPY apps/api apps/api
COPY packages/config packages/config
COPY packages/database packages/database
COPY packages/ai packages/ai
COPY packages/shared-types packages/shared-types
COPY packages/validators packages/validators

ENV NODE_ENV=production
EXPOSE 3162

CMD ["npm", "run", "start:api"]
