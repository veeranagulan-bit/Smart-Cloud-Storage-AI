FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/.output/public /app/public

EXPOSE 8080
ENV PORT=8080

CMD ["sh", "-c", "serve -s public -l ${PORT:-8080}"]
