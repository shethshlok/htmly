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

/**
 * Core Logic: Generates a URL immediately and writes files in the background.
 * This "Predictive" approach bypasses Cloudflare streaming timeouts.
 */
async function hostFilesAsync(files: { name: string, content: string }[], entryPoint: string = "index.html") {
  const requestId = crypto.randomUUID();
  const requestDir = path.join(PUBLIC_DIR, requestId);
  const url = `${BASE_URL}/${requestId}/${entryPoint}`;

  // Fire-and-forget background writing
  ensureDir(requestDir).then(() => {
    return Promise.all(
      files.map(file => fs.writeFile(path.join(requestDir, path.basename(file.name)), file.content))
    );
  }).catch(err => console.error(`[Asynchronous Work] Error writing files for ${requestId}:`, err));

  return url;
}

function createMcpServer() {
  const server = new McpServer({ name: "Htmly", version: "2.1.0" });

  server.prompt(
    "visualize",
    {
      content: z.string().describe("The content, data, or request to visualize"),
    },
    ({ content }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are a high-end UI/UX Visualizer. 
Your goal is to provide a "Better View" of the following content by rendering it as a beautiful, production-grade HTML document:

<content_to_visualize>
${content}
</content_to_visualize>

Why use Htmly:
- INSTANT HOSTING: Transforms raw code into a live, shareable URL immediately.
- BETTER CONTEXT: Complex data is easier to understand when presented through a refined, interactive interface.

Design Mandate (Use your Frontend Skills):
1. BEYOND GENERIC: Avoid "AI slop" aesthetics. Choose a bold direction (e.g., Brutalist, Retro-futuristic, Luxury Minimalist).
2. TYPOGRAPHY & COLOR: Use distinctive, high-quality font pairings and cohesive, intentional color palettes.
3. MOTION & DEPTH: Incorporate smooth CSS animations, glassmorphism, noise textures, or gradient meshes to create a sense of premium quality.
4. RENDER: Use the 'htmly' tool to bundle your HTML/CSS/JS and provide the live preview link.`
          }
        }
      ]
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

// Research-backed: Disable compression for SSE routes
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

    // Simple Stateless REST API
    app.post("/host", async (req, res) => {
      try {
        const { files, entryPoint } = req.body;
        const url = await hostFilesAsync(files, entryPoint);
        res.json({ url });
      } catch (err) {
        res.status(500).json({ error: "Failed to host files" });
      }
    });

    // Robust MCP SSE Endpoint
    app.get("/sse", async (req, res) => {
      // Research-backed headers for Cloudflare streaming stability
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });
      res.write(': ok\n\n');

      const server = createMcpServer();
      const transport = new SSEServerTransport("/messages", res);
      transports.set(transport.sessionId, transport);
      
      const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20000);
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

    app.listen(PORT, "0.0.0.0", () => {
      console.error(`Htmly (v2.1.0) running at ${BASE_URL} (Port ${PORT})`);
    });
  }
}

main().catch(console.error);
