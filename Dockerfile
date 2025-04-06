ARG NODE_VERSION="23.9.0"
ARG RUST_VERSION="1.85.0"
ARG NEXT_OUTPUT="standalone"

FROM rust:${RUST_VERSION}-bookworm AS rust-base

RUN \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  mv /etc/apt/apt.conf.d/docker-clean /tmp/docker-clean && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
  apt-get update && \
  apt-get install -y --no-install-recommends curl ca-certificates build-essential && \
  mv /tmp/docker-clean /etc/apt/apt.conf.d/docker-clean && rm -f /etc/apt/apt.conf.d/keep-cache

FROM rust-base AS rust-builder

RUN \
  --mount=source=wasm,target=/wasm,rw \
  (curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh) && \
  cd /wasm && \
  wasm-pack build -s nextjs-wasm-test --weak-refs --reference-types --out-dir /opt/pkg

FROM node:${NODE_VERSION}-alpine AS node-base

FROM node-base AS node-builder
ARG NEXT_OUTPUT

RUN \
  --mount=type=cache,target=/var/cache/apk,sharing=locked \
  --mount=type=cache,target=/root/.cache,sharing=locked \
  apk add rsync

COPY . /app
WORKDIR /app

RUN \
  --mount=from=rust-builder,source=/opt/pkg,target=/app/wasm/pkg \
  --mount=type=cache,target=/root/.cache,sharing=locked \
  corepack pnpm config set store-dir /root/.cache/pnpm-store && \
  corepack pnpm install && \
  corepack pnpm run next build --no-lint

# Available only ARG NEXT_OUTPUT="standalone"
FROM node-base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=node-builder /app/public ./public

COPY --from=node-builder /app/.next/standalone ./
COPY --from=node-builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000

# check=skip=JSONArgsRecommended
CMD HOSTNAME="0.0.0.0" node server.js

# Available only ARG NEXT_OUTPUT="export"
FROM nginx AS server

COPY --from=node-builder /app/out /usr/share/nginx/html
