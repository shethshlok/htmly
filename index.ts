import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
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

if (process.env.TRANSPORT === "stdio") {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
} else {
  const app = express();
  const transports = new Map<string, SSEServerTransport>();

  app.use(express.static(PUBLIC_DIR));
  
  app.get("/sse", async (req, res) => {
    console.error(`[SSE] New connection request`);
    const server = createMcpServer();
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    
    // Heartbeat to keep Cloudflare connection alive
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    res.on("close", () => {
      clearInterval(heartbeat);
      transports.delete(transport.sessionId);
      console.error(`[SSE] Connection closed: ${transport.sessionId}`);
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
  app.listen(PORT, () => console.error(`Htmly running on port ${PORT} (SSE mode)`));
}
