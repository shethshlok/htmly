FROM oven/bun:latest AS web-builder

WORKDIR /app/web

COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile

COPY web/ ./

ARG PUBLIC_URL=https://html.shloksheth.tech
ENV NEXT_PUBLIC_HTMLY_URL=$PUBLIC_URL
RUN bun run build

FROM oven/bun:latest

# Set working directory
WORKDIR /app

COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production

COPY index.ts ./
COPY --from=web-builder /app/web/out ./site

# Ensure the public directory exists
RUN mkdir -p public

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTED_DIR=/app/public
ENV SITE_DIR=/app/site

# Expose the web server port
EXPOSE 3000

# Run the server
CMD ["bun", "run", "index.ts"]
