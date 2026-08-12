# Single-computer deployment

## Recommended rollout

Use `html.shloksheth.tech` as the canonical origin for the first deployment. It already reaches the computer, so this merges the application without changing existing MCP client configuration. After verification, route `htmly.shloksheth.tech` through the same Cloudflare Tunnel and remove it from Vercel.

The computer's `100.72.220.101` address is private Tailscale space and should not be published in public DNS. Cloudflare Tunnel should continue to provide the outbound-only public connection.

## 1. Deploy the combined container

On the computer, in the Htmly checkout:

```bash
git pull --ff-only
BASE_URL=https://html.shloksheth.tech docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:6342/healthz
curl --fail http://127.0.0.1:6342/ | head
```

Do not delete `public/`; it contains the persistent hosted previews and is reused by the merged container.

## 2. Verify the existing hostname

```bash
curl --fail https://html.shloksheth.tech/
curl --fail https://html.shloksheth.tech/healthz
HTMLY_TEST_BASE_URL=https://html.shloksheth.tech bun run test:deployed
```

The root URL should return the marketing page, `/mcp` should serve stateless MCP `2026-07-28` plus stateless 2025-era compatibility, and generated preview URLs should continue to work. `/sse` now returns a `410` migration response because the obsolete SSE transport has been retired.

## 3. Move the Vercel hostname to the computer

In Cloudflare Zero Trust, add a second public hostname to the same tunnel used by `html.shloksheth.tech`:

```text
htmly.shloksheth.tech -> http://localhost:6342
```

That origin is correct when `cloudflared` runs directly on the computer. If `cloudflared` runs in Docker, attach it to the compose network and route to `http://mcp-html-server:3000` instead; `localhost` inside the tunnel container would point back to that container.

Replace the current Vercel DNS record for `htmly.shloksheth.tech` with the tunnel route. A Cloudflare Tunnel hostname is normally a proxied CNAME to `<tunnel-uuid>.cfargotunnel.com`. Verify the exact target from the existing `html.shloksheth.tech` route or the Zero Trust dashboard before changing DNS.

After DNS changes:

```bash
curl --fail https://htmly.shloksheth.tech/
curl --fail https://htmly.shloksheth.tech/healthz
```

Only remove the Vercel project/domain after these checks pass.

## 4. Optional canonical-hostname switch

Keeping `html.shloksheth.tech` canonical is the zero-breakage option. To make `htmly.shloksheth.tech` canonical later, rebuild the container with:

```bash
BASE_URL=https://htmly.shloksheth.tech docker compose up -d --build
```

Keep `html.shloksheth.tech` routed to the same service so existing MCP configurations continue working. Do not use a blanket HTTP redirect on `/mcp`; MCP clients POST protocol requests to that exact endpoint.

## MCP protocol compatibility

The server uses the stable MCP TypeScript SDK v2 and the `2026-07-28` protocol. Modern clients use `server/discover` and send self-contained requests. Older Streamable HTTP clients that use the 2025 initialization exchange are served by the SDK's stateless compatibility path at the same `/mcp` URL. Old SSE-only configurations must be changed from `/sse` to `/mcp`.

Because protocol sessions are gone, multiple Docker replicas do not require sticky routing or a shared MCP session store. Generated previews still live in `public/`, however, so multi-host replicas require shared object storage before they can serve each other's preview URLs.

## Rollback

If the merged container is unhealthy, restore the previous Git revision and rebuild the container. Leave both DNS records unchanged during application rollback. If only the new `htmly` hostname fails, point that record back to Vercel while leaving `html` and the MCP service untouched.
