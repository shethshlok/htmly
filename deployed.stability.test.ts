import { expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE_URL = (process.env.HTMLY_TEST_BASE_URL ?? "https://html.shloksheth.tech").replace(/\/$/, "");
const MCP_URL = `${BASE_URL}/mcp`;
const CONCURRENT_CLIENTS = Number(process.env.HTMLY_STABILITY_CLIENTS ?? 6);
const CALLS_PER_CLIENT = Number(process.env.HTMLY_STABILITY_CALLS_PER_CLIENT ?? 3);

function extractHostedUrl(text: string | undefined) {
  const url = text?.match(/https?:\/\/\S+/)?.[0];
  if (!url) throw new Error(`No hosted URL found in MCP response: ${text}`);
  return url;
}

function buildImmersiveFiles(marker: string, clientIndex: number, callIndex: number) {
  return [
    {
      name: "index.html",
      content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Htmly stability ${marker}</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="shell" data-marker="${marker}">
    <section class="hero">
      <p class="eyebrow">deployment stability</p>
      <h1>${marker}</h1>
      <p id="client">client-${clientIndex} call-${callIndex}</p>
    </section>
    <section class="grid">
      ${Array.from({ length: 12 }, (_, index) => `<article><b>${index + 1}</b><span>${marker}</span></article>`).join("\n      ")}
    </section>
  </main>
  <script type="module" src="./app.js"></script>
</body>
</html>`,
    },
    {
      name: "styles.css",
      content: `:root { color-scheme: light; font-family: Inter, system-ui, sans-serif; }
body { margin: 0; background: #f7f8fb; color: #17202a; }
.shell { max-width: 1040px; margin: 0 auto; padding: 40px 20px; }
.hero { border: 1px solid #ccd3df; border-radius: 8px; padding: 24px; background: white; }
.eyebrow { margin: 0 0 8px; text-transform: uppercase; font-size: 12px; color: #596579; }
h1 { margin: 0; font-size: 32px; letter-spacing: 0; }
.grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
article { min-height: 64px; border: 1px solid #d9dee8; border-radius: 8px; padding: 10px; background: #ffffff; overflow-wrap: anywhere; }
article b { display: block; color: #195c5c; }
article span { font-size: 12px; }
@media (max-width: 680px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }`,
    },
    {
      name: "app.js",
      content: `const root = document.querySelector("[data-marker]");
if (!root || root.dataset.marker !== ${JSON.stringify(marker)}) {
  throw new Error("marker mismatch");
}
document.body.dataset.hydrated = "true";`,
    },
  ];
}

async function readUrl(url: string, timeoutMs = 12_000) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  const text = await response.text();
  return { response, text };
}

test("deployed MCP endpoint survives realistic concurrent Antigravity-style sessions", async () => {
  const startedAt = performance.now();
  const hostedUrls = new Set<string>();
  const markers = new Set<string>();

  await Promise.all(Array.from({ length: CONCURRENT_CLIENTS }, async (_, clientIndex) => {
    const client = new Client({
      name: `htmly-stability-${clientIndex}`,
      version: "1.0.0",
    });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));

    try {
      await client.connect(transport);

      const tools = await client.listTools();
      expect(tools.tools.find((tool) => tool.name === "htmly")?.description).toContain("Host HTML");
      expect(transport.sessionId).toBeTruthy();

      for (let callIndex = 0; callIndex < CALLS_PER_CLIENT; callIndex += 1) {
        const marker = `stability-${clientIndex}-${callIndex}-${crypto.randomUUID()}`;
        markers.add(marker);

        const result = await client.callTool({
          name: "htmly",
          arguments: {
            files: buildImmersiveFiles(marker, clientIndex, callIndex),
            entryPoint: "index.html",
          },
        });

        const text = result.content.find((item) => item.type === "text")?.text;
        const hostedUrl = extractHostedUrl(text);
        hostedUrls.add(hostedUrl);

        const [{ response: htmlResponse, text: html }, { response: cssResponse, text: css }, { response: jsResponse, text: js }] = await Promise.all([
          readUrl(hostedUrl),
          readUrl(new URL("./styles.css", hostedUrl).toString()),
          readUrl(new URL("./app.js", hostedUrl).toString()),
        ]);

        expect(htmlResponse.status).toBe(200);
        expect(cssResponse.status).toBe(200);
        expect(jsResponse.status).toBe(200);
        expect(html).toContain(marker);
        expect(html).toContain(`client-${clientIndex} call-${callIndex}`);
        expect(css).toContain("grid-template-columns");
        expect(js).toContain(marker);
      }
    } finally {
      await transport.terminateSession().catch(() => undefined);
      await client.close();
    }
  }));

  expect(hostedUrls.size).toBe(CONCURRENT_CLIENTS * CALLS_PER_CLIENT);
  expect(markers.size).toBe(CONCURRENT_CLIENTS * CALLS_PER_CLIENT);

  const elapsedMs = performance.now() - startedAt;
  expect(elapsedMs).toBeLessThan(60_000);
}, 90_000);
