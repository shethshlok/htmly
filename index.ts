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
const SSE_HEARTBEAT_INTERVAL_MS = 25_000;

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

  await ensureDir(requestDir);
  await Promise.all(
    files.map(file => fs.writeFile(path.join(requestDir, path.basename(file.name)), file.content))
  );

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
const transports = new Map<string, SSEServerTransport>();

// Middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['accept'] === 'text/event-stream') return false;
    return compression.filter(req, res);
  }
}));
app.use(express.static(PUBLIC_DIR));

// Routes
app.post("/host", express.json(), async (req, res) => {
  const { files, entryPoint } = req.body;
  const url = await hostFilesAsync(files, entryPoint);
  res.json({ url });
});

app.get("/sse", async (req, res) => {
  const server = createMcpServer();
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  
  const cleanup = async () => {
    if (closed) return;
    closed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = undefined;
    }
    transports.delete(transport.sessionId);
    await server.close();
  };

  res.on("close", () => {
    cleanup().catch(console.error);
  });
  
  await server.connect(transport);
  if (closed) return;

  heartbeat = setInterval(() => {
    if (!res.destroyed) {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    }
  }, SSE_HEARTBEAT_INTERVAL_MS);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).send("Session not found");
  }
});

async function main() {
  await ensureDir(PUBLIC_DIR);

  if (process.env.TRANSPORT === "stdio") {
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } else {
    app.listen(PORT, "0.0.0.0", () => {
      console.error(`Htmly (v2.2.0) listening at ${BASE_URL} (Port: ${PORT})`);
    });
  }
}

main().catch(console.error);
