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

function createMcpServer() {
  const server = new McpServer({
    name: "Htmly",
    version: "1.5.0",
  });

  server.tool(
    "htmly",
    "Host HTML/CSS/JS instantly for preview.",
    {
      files: z.array(z.object({
        name: z.string(),
        content: z.string(),
      })),
      entryPoint: z.string().optional().default("index.html"),
    },
    async ({ files, entryPoint }) => {
      const requestId = crypto.randomUUID();
      const requestDir = path.join(PUBLIC_DIR, requestId);
      await ensureDir(requestDir);

      await Promise.all(
        files.map(file => fs.writeFile(path.join(requestDir, path.basename(file.name)), file.content))
      );

      return {
        content: [{
          type: "text",
          text: `Hosted: ${BASE_URL}/${requestId}/${entryPoint}`
        }]
      };
    }
  );

  return server;
}

const app = express();

// Research-backed: Disable compression for SSE to prevent buffering
app.use(compression({
  filter: (req, res) => {
    if (req.headers['accept'] === 'text/event-stream') return false;
    return compression.filter(req, res);
  }
}));

if (process.env.TRANSPORT === "stdio") {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
} else {
  const transports = new Map<string, SSEServerTransport>();

  app.use(express.static(PUBLIC_DIR));
  
  app.get("/sse", async (req, res) => {
    // Research-backed: Anti-buffering and keep-alive headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const server = createMcpServer();
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    
    // Send immediate initial comment to flush headers
    res.write(': ok\n\n');

    // Research-backed: Heartbeat every 30s to stay under Cloudflare's 100s limit
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    res.on("close", () => {
      clearInterval(heartbeat);
      transports.delete(transport.sessionId);
    });
    
    await server.connect(transport);
  });

  app.post("/messages", express.json(), async (req, res) => {
    const transport = transports.get(req.query.sessionId as string);
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(404).send("Session not found");
    }
  });

  await ensureDir(PUBLIC_DIR);
  app.listen(PORT, "0.0.0.0", () => console.error(`Htmly (v1.5.0) ready at ${BASE_URL}`));
}
