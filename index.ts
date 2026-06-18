import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import compression from "compression";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `https://html.shloksheth.tech`;
const PUBLIC_DIR = path.join(process.cwd(), "public");

async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function hostFilesAsync(files: { name: string, content: string }[], entryPoint: string = "index.html") {
  const requestId = crypto.randomUUID();
  const requestDir = path.join(PUBLIC_DIR, requestId);
  const url = `${BASE_URL}/${requestId}/${entryPoint}`;

  ensureDir(requestDir).then(() => {
    return Promise.all(
      files.map(file => fs.writeFile(path.join(requestDir, path.basename(file.name)), file.content))
    );
  }).catch(err => console.error(`[Async] Error writing ${requestId}:`, err));

  return url;
}

function createMcpServer() {
  const server = new McpServer({ name: "Htmly", version: "2.2.0" });

  server.prompt(
    "visualize",
    { content: z.string().describe("Content to visualize") },
    ({ content }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `You are a high-end UI/UX Visualizer. Render this content as a beautiful HTML document using Htmly.\n\n<content>\n${content}\n</content>`
        }
      }]
    })
  );

  server.tool("htmly", "Host HTML instantly for visualization.", {
    files: z.array(z.object({ name: z.string(), content: z.string() })),
    entryPoint: z.string().optional().default("index.html"),
  }, async ({ files, entryPoint }) => {
    const url = await hostFilesAsync(files, entryPoint);
    return { content: [{ type: "text", text: `Hosted: ${url}` }] };
  });

  return server;
}

const app = express();

// Disable compression for SSE
app.use(compression({
  filter: (req, res) => {
    if (req.headers['accept'] === 'text/event-stream') return false;
    return compression.filter(req, res);
  }
}));

async function main() {
  await ensureDir(PUBLIC_DIR);

  if (process.env.TRANSPORT === "stdio") {
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } else {
    const transports = new Map<string, SSEServerTransport>();
    app.use(express.json());
    app.use(express.static(PUBLIC_DIR));

    app.post("/host", async (req, res) => {
      const { files, entryPoint } = req.body;
      const url = await hostFilesAsync(files, entryPoint);
      res.json({ url });
    });

    app.get("/sse", async (req, res) => {
      // Set headers for maximum proxy compatibility
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const server = createMcpServer();
      const transport = new SSEServerTransport("/messages", res);
      
      // The SDK sends the endpoint event, but we'll add heartbeats to keep the H2 stream open
      const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 15000);

      transports.set(transport.sessionId, transport);
      
      res.on("close", () => {
        clearInterval(heartbeat);
        transports.delete(transport.sessionId);
      });
      
      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const transport = transports.get(req.query.sessionId as string);
      if (transport) await transport.handlePostMessage(req, res);
      else res.status(404).send("Session not found");
    });

    app.listen(PORT, "0.0.0.0", () => console.error(`Htmly (v2.2.0) listening at ${BASE_URL}`));
  }
}

main().catch(console.error);
