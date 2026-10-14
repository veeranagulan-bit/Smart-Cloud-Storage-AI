FROM oven/bun:1.4 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN bun run build

FROM oven/bun:1.4-slim

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 8080
ENV PORT=8080

CMD ["bun", "run", "preview", "--host", "0.0.0.0", "--port", "8080"]
