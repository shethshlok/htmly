import { expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

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

test("deployed SSE endpoint emits endpoint event and heartbeat", async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);

  try {
    const response = await fetch(`${BASE_URL}/sse`, {
      headers: { accept: "text/event-stream" },
      signal: controller.signal,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.body).toBeTruthy();

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let stream = "";

    while (!stream.includes(": heartbeat")) {
      const { done, value } = await reader.read();
      if (done) break;
      stream += decoder.decode(value, { stream: true });
    }

    await reader.cancel();

    expect(stream).toContain("event: endpoint");
    expect(stream).toContain("data: /messages?sessionId=");
    expect(stream).toContain(": heartbeat");
  } finally {
    clearTimeout(timeout);
  }
}, 45_000);

test("deployed MCP SSE client lists and calls htmly tool", async () => {
  const client = new Client({ name: "htmly-deployed-test", version: "1.0.0" });
  const transport = new SSEClientTransport(new URL(`${BASE_URL}/sse`));
  const { marker, content } = uniqueHtml("mcp-sse");

  try {
    await client.connect(transport);

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

test("deployed MCP Streamable HTTP client lists and calls htmly tool", async () => {
  const client = new Client({ name: "htmly-deployed-streamable-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${BASE_URL}/mcp`));
  const { marker, content } = uniqueHtml("mcp-http");

  try {
    await client.connect(transport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toContain("htmly");
    expect(transport.sessionId).toBeTruthy();

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
    await transport.terminateSession().catch(() => undefined);
    await client.close();
  }
}, 45_000);
