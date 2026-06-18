import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

const server = new McpServer({ name: "Htmly", version: "2.0.0" });

// Instruction Prompt: Explains the purpose and design philosophy
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

// The Core Logic
async function hostFiles(files: { name: string, content: string }[], entryPoint: string = "index.html") {
  const requestId = crypto.randomUUID();
  const requestDir = path.join(PUBLIC_DIR, requestId);
  await ensureDir(requestDir);

  await Promise.all(
    files.map(file => fs.writeFile(path.join(requestDir, path.basename(file.name)), file.content))
  );

  return `${BASE_URL}/${requestId}/${entryPoint}`;
}

// 1. MCP Tool (for Gemini CLI)
server.tool("htmly", "Host HTML instantly.", {
  files: z.array(z.object({ name: z.string(), content: z.string() })),
  entryPoint: z.string().optional().default("index.html"),
}, async ({ files, entryPoint }) => {
  const url = await hostFiles(files, entryPoint);
  return { content: [{ type: "text", text: `Hosted: ${url}` }] };
});

// 2. Main Entry Point
async function main() {
  await ensureDir(PUBLIC_DIR);

  // If TRANSPORT=stdio, run as MCP server
  if (process.env.TRANSPORT === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } else {
    // Otherwise, run as a Simple REST API
    const app = express();
    app.use(express.json());
    app.use(express.static(PUBLIC_DIR));

    app.post("/host", async (req, res) => {
      try {
        const { files, entryPoint } = req.body;
        const url = await hostFiles(files, entryPoint);
        res.json({ url });
      } catch (err) {
        res.status(500).json({ error: "Failed to host files" });
      }
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.error(`Simple Htmly API running at ${BASE_URL}`);
    });
  }
}

main().catch(console.error);
