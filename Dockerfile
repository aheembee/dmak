# D_MAK MUSIC — production image. No build step, no dependencies.
FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

WORKDIR /app
COPY package.json server.js ./
COPY lib ./lib
COPY content ./content
COPY public ./public

# Runtime data (inbox, subscribers, analytics) lives here — mount a volume.
RUN mkdir -p data && printf '[]' > data/messages.json && printf '[]' > data/subscribers.json && printf '{"total":0,"paths":{},"days":{}}' > data/analytics.json

RUN addgroup -S dmak && adduser -S dmak -G dmak && chown -R dmak:dmak /app
USER dmak

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
