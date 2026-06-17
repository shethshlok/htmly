import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
const TTL_DAYS = 7;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run cleanup every hour

async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Optimized Cleanup: Runs on an interval rather than per-request
 * to prevent disk I/O bottlenecks.
 */
async function startCleanupTask() {
  const cleanup = async () => {
    try {
      console.error("[Maintenance] Starting background cleanup...");
      const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
      const now = Date.now();
      
      const deletions = entries
        .filter(entry => entry.name !== "docs.html")
        .map(async (entry) => {
          const fullPath = path.join(PUBLIC_DIR, entry.name);
          const stats = await fs.stat(fullPath);
          if (now - stats.mtimeMs > TTL_MS) {
            return fs.rm(fullPath, { recursive: true, force: true });
          }
        });

      await Promise.all(deletions);
      console.error("[Maintenance] Cleanup complete.");
    } catch (error) {
      console.error("[Maintenance] Cleanup error:", error);
    }
  };

  setInterval(cleanup, CLEANUP_INTERVAL_MS);
  // Also run once on startup
  cleanup();
}

const server = new McpServer({
  name: "Htmly-Visualizer",
  version: "1.4.1",
});

server.prompt(
  "visualize-content",
  {},
  () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are a high-end UI/UX Visualizer. 
Your goal is to provide a "Better View" of any content the user asks for by rendering it as a beautiful HTML document.

When the user asks for a visualization or a change:
1. PUSH CODE: Transform the data or request into a production-grade HTML/CSS/JS project bundle.
2. BETTER VISUALIZATION: Use sophisticated layouts, typography, and interactive elements.
3. RENDER: Use 'render_files' to push your code and get a live domain link.`
        }
      }
    ]
  })
);

server.tool(
  "render_files",
  "Pushes HTML/CSS/JS code for instant visualization. Returns a live domain link.",
  {
    files: z.array(z.object({
      name: z.string().describe("Filename (e.g. 'index.html')"),
      content: z.string().describe("Source code"),
    })),
    entryPoint: z.string().optional().default("index.html"),
  },
  async ({ files, entryPoint }) => {
    const requestId = crypto.randomUUID();
    const requestDir = path.join(PUBLIC_DIR, requestId);
    await ensureDir(requestDir);

    // OPTIMIZATION: Parallelize file writes
    await Promise.all(
      files.map(file => 
        fs.writeFile(path.join(requestDir, path.basename(file.name)), file.content, "utf-8")
      )
    );

    return {
      content: [
        {
          type: "text",
          text: `Content pushed successfully! Visualize your changes here: ${BASE_URL}/${requestId}/${entryPoint}`,
        },
      ],
    };
  }
);

const app = express();
const transports = new Map<string, SSEServerTransport>();

// OPTIMIZATION: Gzip compression for all responses
app.use(compression());

// OPTIMIZATION: Efficient static serving with cache control
app.use(express.static(PUBLIC_DIR, {
  maxAge: '1h', // Cache files for 1 hour to reduce repeated disk reads
  immutable: true,
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "docs.html"));
});

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  res.on("close", () => { transports.delete(transport.sessionId); });
  await server.connect(transport);
});

app.post("/messages", express.json(), async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) { res.status(404).send("Session not found"); return; }
  await transport.handlePostMessage(req, res);
});

async function main() {
  await ensureDir(PUBLIC_DIR);
  startCleanupTask();
  app.listen(PORT, () => {
    console.error(`HTML Visualizer Engine (v1.4.0) running on ${BASE_URL}`);
  });
}

main().catch(console.error);
