FROM node:20-bookworm-slim

# @shelby-protocol/media-prepare shells out to a real ffmpeg/ffprobe binary
# and requires v7+ — Debian bookworm's own `apt install ffmpeg` ships an
# older version that fails the app's own version check, so pull a current
# static build instead (works on both amd64 and arm64 VM shapes).
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl xz-utils ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && ARCH=$(dpkg --print-architecture) \
  && if [ "$ARCH" = "arm64" ]; then FFMPEG_ARCH=arm64; else FFMPEG_ARCH=amd64; fi \
  && curl -fL "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-${FFMPEG_ARCH}-static.tar.xz" -o /tmp/ffmpeg.tar.xz \
  && tar -xf /tmp/ffmpeg.tar.xz -C /tmp \
  && mv /tmp/ffmpeg-*-static/ffmpeg /tmp/ffmpeg-*-static/ffprobe /usr/local/bin/ \
  && rm -rf /tmp/ffmpeg*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Runs the TS source directly via tsx (same as `npm start` locally) —
# no separate build step to keep in sync.
EXPOSE 8787
CMD ["npx", "tsx", "src/index.ts"]
