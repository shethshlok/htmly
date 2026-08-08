# Htmly

Htmly is one self-hosted application containing both:

- the public marketing and onboarding site;
- the MCP service that hosts generated HTML previews.

The marketing source lives in `web/` and is exported as static files during the Docker build. The Bun/Express service serves that export alongside its API and preview routes, so Vercel is not required.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing and onboarding site |
| `/mcp` | MCP Streamable HTTP endpoint |
| `/sse` and `/messages` | Legacy MCP SSE transport |
| `/host` | Direct HTML hosting API |
| `/{workspace}/{file}` | Generated preview files |
| `/healthz` | Container health check |

Generated workspaces remain online for 24 hours. The `public/` directory is mounted into the container for persistence, while the marketing build is baked into `/app/site`. Keeping these locations separate prevents the persistent volume from hiding the landing page.

## Local development

```bash
bun install --frozen-lockfile
bun install --cwd web --frozen-lockfile

# Build the static site and start the combined service.
NEXT_PUBLIC_HTMLY_URL=http://127.0.0.1:3000 bun run build:web
BASE_URL=http://127.0.0.1:3000 bun start
```

For frontend-only development, run `bun run dev:web`.

## Build and test

```bash
bun run build
HTMLY_TEST_BASE_URL=http://127.0.0.1:3000 bun run test:deployed
```

## Docker deployment

`BASE_URL` controls both the links returned by the MCP server and the URL compiled into the marketing site:

```bash
BASE_URL=https://html.shloksheth.tech docker compose up -d --build
docker compose ps
curl --fail https://html.shloksheth.tech/healthz
```

The default remains `https://html.shloksheth.tech`, which avoids breaking existing MCP clients during the initial merge. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for moving `htmly.shloksheth.tech` from Vercel to the computer and, optionally, making it the canonical hostname.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Internal Bun server port |
| `BASE_URL` | `https://html.shloksheth.tech` | Public origin used in generated links |
| `SITE_DIR` | `web/out` | Exported marketing site directory |
| `HOSTED_DIR` | `public` | Persistent generated-preview directory |
| `NEXT_PUBLIC_HTMLY_URL` | `https://html.shloksheth.tech` | Public origin embedded in a local frontend build |

Built with Bun, Next.js, and the Model Context Protocol SDK.
