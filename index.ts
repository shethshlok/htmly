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
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

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
  cleanup();
}

function createMcpServer() {
  const server = new McpServer({
    name: "Htmly",
    version: "1.5.0",
  });

  server.prompt(
    "htmly-hosting",
    {},
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are an expert at instant web hosting. 
Your goal is to use the 'htmly' tool to instantly host and visualize HTML files for the user.

When the user wants to see a preview or host some code:
1. GENERATE: Create the necessary HTML, CSS, and JS.
2. HOST: Use the 'htmly' tool to push the code and get a live link.
3. PRESENT: Share the link immediately so the user can see their hosted content.`
          }
        }
      ]
    })
  );

  server.tool(
    "htmly",
    "A simple way to host HTML files instantly for visualization and testing. Returns a live link to the rendered content.",
    {
      files: z.array(z.object({
        name: z.string().describe("Filename (e.g. 'index.html', 'styles.css')"),
        content: z.string().describe("The source code to host"),
      })).describe("The bundle of files to host"),
      entryPoint: z.string().optional().default("index.html").describe("The primary file to open"),
    },
    async ({ files, entryPoint }) => {
      const requestId = crypto.randomUUID();
      const requestDir = path.join(PUBLIC_DIR, requestId);
      await ensureDir(requestDir);

      await Promise.all(
        files.map(file => 
          fs.writeFile(path.join(requestDir, path.basename(file.name)), file.content, "utf-8")
        )
      );

      const url = `${BASE_URL}/${requestId}/${entryPoint}`;
      return {
        content: [
          {
            type: "text",
            text: `Content hosted successfully! View it here: ${url}`,
          },
        ],
      };
    }
  );

  return server;
}

const app = express();
const transports = new Map<string, SSEServerTransport>();

app.use(compression({
  filter: (req, res) => {
    if (req.path === "/sse") return false;
    return compression.filter(req, res);
  }
}));
app.use(express.static(PUBLIC_DIR, {
  maxAge: '1h',
  immutable: true,
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "docs.html"));
});

app.get("/sse", async (req, res) => {
  const server = createMcpServer();
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  res.on("close", () => { 
    transports.delete(transport.sessionId);
  });
  
  try {
    await server.connect(transport);
    console.error(`[SSE] New connection established: ${transport.sessionId}`);
  } catch (error) {
    console.error("[SSE] Connection error:", error);
  }
});

app.post("/messages", express.json(), async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) { 
    res.status(404).send("Session not found"); 
    return; 
  }
  await transport.handlePostMessage(req, res);
});

async function main() {
  await ensureDir(PUBLIC_DIR);
  startCleanupTask();

  if (process.env.TRANSPORT === "stdio") {
    const server = createMcpServer();
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Htmly (v1.5.0) running on stdio");
  } else {
    app.listen(PORT, () => {
      console.error(`Htmly (v1.5.0) running on ${BASE_URL}`);
    });
  }
}

main().catch(console.error);
