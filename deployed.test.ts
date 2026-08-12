import { expect, test } from "bun:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const BASE_URL = (process.env.HTMLY_TEST_BASE_URL ?? "https://html.shloksheth.tech").replace(/\/$/, "");

function uniqueHtml(label: string) {
  const marker = `${label}-${crypto.randomUUID()}`;
  return {
    marker,
    content: `<!doctype html><html><body><h1>${marker}</h1></body></html>`,
  };
}

function extractHostedUrl(text: string | undefined) {
  const url = text?.match(/https?:\/\/\S+/)?.[0];
  if (!url) throw new Error(`No hosted URL found in MCP response: ${text}`);
  return url;
}

test("deployed HTTP /host uploads and serves HTML", async () => {
  const { marker, content } = uniqueHtml("http-host");

  const response = await fetch(`${BASE_URL}/host`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      files: [{ name: "index.html", content }],
    }),
    signal: AbortSignal.timeout(12_000),
  });

  expect(response.status).toBe(200);

  const body = await response.json() as { url?: string };
  expect(body.url).toStartWith(`${BASE_URL}/`);

  const hosted = await fetch(body.url!, { signal: AbortSignal.timeout(12_000) });
  expect(hosted.status).toBe(200);
  expect(await hosted.text()).toContain(marker);
}, 30_000);

test("health check advertises stateless MCP 2026-07-28", async () => {
  const response = await fetch(`${BASE_URL}/healthz`, {
    signal: AbortSignal.timeout(12_000),
  });
  const body = await response.json() as {
    status?: string;
    mcpProtocol?: string;
    mcpMode?: string;
  };

  expect(response.status).toBe(200);
  expect(body.status).toBe("ok");
  expect(body.mcpProtocol).toBe("2026-07-28");
  expect(body.mcpMode).toBe("stateless");
});

test("retired SSE endpoint directs clients to Streamable HTTP", async () => {
  const response = await fetch(`${BASE_URL}/sse`, {
    signal: AbortSignal.timeout(12_000),
  });
  const body = await response.json() as { mcpEndpoint?: string };

  expect(response.status).toBe(410);
  expect(body.mcpEndpoint).toBe(`${BASE_URL}/mcp`);
});

test("legacy 2025 client works through stateless compatibility", async () => {
  const client = new Client({ name: "htmly-legacy-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${BASE_URL}/mcp`));
  const { marker, content } = uniqueHtml("mcp-legacy");

  try {
    await client.connect(transport);
    expect(client.getProtocolEra()).toBe("legacy");
    expect(transport.sessionId).toBeUndefined();

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toContain("htmly");

    const result = await client.callTool({
      name: "htmly",
      arguments: {
        files: [{ name: "index.html", content }],
      },
    });

    const text = result.content.find((item) => item.type === "text")?.text;
    const hostedUrl = extractHostedUrl(text);

    const hosted = await fetch(hostedUrl, { signal: AbortSignal.timeout(12_000) });
    expect(hosted.status).toBe(200);
    expect(await hosted.text()).toContain(marker);
  } finally {
    await client.close();
  }
}, 45_000);

test("modern MCP 2026-07-28 client lists and calls htmly without a session", async () => {
  const client = new Client(
    { name: "htmly-modern-test", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
  const transport = new StreamableHTTPClientTransport(new URL(`${BASE_URL}/mcp`));
  const { marker, content } = uniqueHtml("mcp-modern");

  try {
    await client.connect(transport);
    expect(client.getProtocolEra()).toBe("modern");

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toContain("htmly");
    expect(transport.sessionId).toBeUndefined();

    const result = await client.callTool({
      name: "htmly",
      arguments: {
        files: [{ name: "index.html", content }],
      },
    });

    const text = result.content.find((item) => item.type === "text")?.text;
    const hostedUrl = extractHostedUrl(text);

    const hosted = await fetch(hostedUrl, { signal: AbortSignal.timeout(12_000) });
    expect(hosted.status).toBe(200);
    expect(await hosted.text()).toContain(marker);
  } finally {
    await client.close();
  }
}, 45_000);
