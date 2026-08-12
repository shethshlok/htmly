import { afterAll, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import fs from "fs/promises";
import os from "os";
import path from "path";

const hostedDirs: string[] = [];

async function connectClient(era: "legacy" | "modern") {
  const hostedDir = await fs.mkdtemp(path.join(os.tmpdir(), `htmly-${era}-`));
  hostedDirs.push(hostedDir);

  const env = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  Object.assign(env, {
    TRANSPORT: "stdio",
    HOSTED_DIR: hostedDir,
    BASE_URL: "https://stdio.test",
  });

  const client = new Client(
    { name: `htmly-stdio-${era}`, version: "1.0.0" },
    era === "modern"
      ? { versionNegotiation: { mode: { pin: "2026-07-28" } } }
      : undefined,
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["run", path.join(import.meta.dir, "index.ts")],
    env,
    stderr: "pipe",
  });

  await client.connect(transport);
  return { client, transport };
}

for (const era of ["legacy", "modern"] as const) {
  test(`stdio serves ${era} MCP clients`, async () => {
    const { client } = await connectClient(era);
    try {
      expect(client.getProtocolEra()).toBe(era);
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toContain("htmly");
    } finally {
      await client.close();
    }
  }, 30_000);
}

afterAll(async () => {
  await Promise.all(hostedDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});
