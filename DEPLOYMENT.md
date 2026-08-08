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

The root URL should now return the marketing page instead of the previous 404, while `/mcp`, `/sse`, and generated preview URLs continue to work.

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

Keep `html.shloksheth.tech` routed to the same service so existing MCP configurations continue working. Because MCP clients may POST or hold event streams, do not use a blanket HTTP redirect on the old hostname for `/mcp`, `/sse`, or `/messages`.

## Rollback

If the merged container is unhealthy, restore the previous Git revision and rebuild the container. Leave both DNS records unchanged during application rollback. If only the new `htmly` hostname fails, point that record back to Vercel while leaving `html` and the MCP service untouched.
