import {
  McpServer,
  createMcpHandler,
  hostHeaderValidationResponse,
} from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const APP_VERSION = "3.0.0";
const MCP_PROTOCOL_VERSION = "2026-07-28";
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = (process.env.BASE_URL || "https://html.shloksheth.tech").replace(/\/$/, "");
const HOSTED_DIR = path.resolve(process.env.HOSTED_DIR || path.join(process.cwd(), "public"));
const SITE_DIR = path.resolve(process.env.SITE_DIR || path.join(process.cwd(), "web", "out"));
const HOSTED_FILE_TTL_MS = 24 * 60 * 60 * 1000;
const HOSTED_FILE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const HOSTED_FILE_METADATA_NAME = ".htmly.json";

const hostRequestSchema = z.object({
  files: z.array(z.object({
    name: z.string().min(1),
    content: z.string(),
  })).min(1),
  entryPoint: z.string().min(1).optional().default("index.html"),
});

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function isGeneratedWorkspaceName(name: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(name);
}

async function getHostedWorkspaceCreatedAt(workspaceDir: string) {
  try {
    const metadata = JSON.parse(
      await fs.readFile(path.join(workspaceDir, HOSTED_FILE_METADATA_NAME), "utf8"),
    ) as { createdAt?: string };
    const createdAtMs = metadata.createdAt ? Date.parse(metadata.createdAt) : Number.NaN;
    if (Number.isFinite(createdAtMs)) return createdAtMs;
  } catch {
    // Workspaces created before metadata support use filesystem timestamps.
  }

  const stats = await fs.stat(workspaceDir);
  return Math.min(stats.birthtimeMs, stats.mtimeMs);
}

async function isHostedWorkspaceExpired(workspaceDir: string, now = Date.now()) {
  return now - await getHostedWorkspaceCreatedAt(workspaceDir) >= HOSTED_FILE_TTL_MS;
}

async function cleanupExpiredHostedWorkspaces() {
  const now = Date.now();
  const entries = await fs.readdir(HOSTED_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || !isGeneratedWorkspaceName(entry.name)) continue;

    const workspaceDir = path.join(HOSTED_DIR, entry.name);
    try {
      if (await isHostedWorkspaceExpired(workspaceDir, now)) {
        await fs.rm(workspaceDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`Failed to clean hosted workspace ${entry.name}:`, error);
    }
  }
}

function startHostedWorkspaceCleanup() {
  cleanupExpiredHostedWorkspaces().catch((error) => {
    console.error("Initial hosted workspace cleanup failed:", error);
  });

  const cleanupInterval = setInterval(() => {
    cleanupExpiredHostedWorkspaces().catch((error) => {
      console.error("Hosted workspace cleanup failed:", error);
    });
  }, HOSTED_FILE_CLEANUP_INTERVAL_MS);
  cleanupInterval.unref();
}

async function hostFilesAsync(
  files: { name: string; content: string }[],
  entryPoint = "index.html",
) {
  const normalizedFiles = files.map((file) => ({
    name: path.basename(file.name),
    content: file.content,
  }));
  const normalizedEntryPoint = path.basename(entryPoint);
  const names = new Set(normalizedFiles.map((file) => file.name));

  if (names.size !== normalizedFiles.length) {
    throw new Error("File names must be unique after path normalization.");
  }
  if (names.has(HOSTED_FILE_METADATA_NAME)) {
    throw new Error(`${HOSTED_FILE_METADATA_NAME} is reserved.`);
  }
  if (!names.has(normalizedEntryPoint)) {
    throw new Error(`Entry point ${normalizedEntryPoint} was not included in files.`);
  }

  const requestId = crypto.randomUUID();
  const requestDir = path.join(HOSTED_DIR, requestId);
  const url = `${BASE_URL}/${requestId}/${encodeURIComponent(normalizedEntryPoint)}`;

  await ensureDir(requestDir);
  await Promise.all(normalizedFiles.map((file) =>
    fs.writeFile(path.join(requestDir, file.name), file.content)
  ));
  await fs.writeFile(
    path.join(requestDir, HOSTED_FILE_METADATA_NAME),
    JSON.stringify({ createdAt: new Date().toISOString() }),
  );

  return url;
}

function createHtmlyServer() {
  const server = new McpServer({ name: "Htmly", version: APP_VERSION });

  server.registerTool(
    "htmly",
    {
      title: "Host HTML",
      description: "Host HTML, CSS, and JavaScript files and return a live preview URL.",
      inputSchema: hostRequestSchema,
    },
    async ({ files, entryPoint }) => {
      const url = await hostFilesAsync(files, entryPoint);
      return {
        content: [{ type: "text", text: `Hosted: ${url}` }],
        structuredContent: { url },
      };
    },
  );

  return server;
}

const mcpHandler = createMcpHandler(() => createHtmlyServer(), {
  legacy: "stateless",
  responseMode: "auto",
  onerror: (error) => console.error("MCP request failed:", error),
});

const allowedMcpHostnames = Array.from(new Set([
  new URL(BASE_URL).hostname,
  "localhost",
  "127.0.0.1",
  "[::1]",
]));

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function withMcpCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "Mcp-Protocol-Version, Mcp-Session-Id");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function serveStatic(root: string, pathname: string, cacheControl: string) {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  let relativePath = decodedPath.replace(/^\/+/, "");
  if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";

  const segments = relativePath.split("/");
  if (segments.some((segment) => segment === ".." || segment.startsWith("."))) {
    return undefined;
  }

  let filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) return undefined;

  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) filePath = path.join(filePath, "index.html");
    const file = Bun.file(filePath);
    if (!await file.exists()) return undefined;
    return new Response(file, {
      headers: { "Cache-Control": cacheControl },
    });
  } catch {
    return undefined;
  }
}

async function handleHttpRequest(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/healthz" && request.method === "GET") {
    return jsonResponse({
      status: "ok",
      service: "htmly",
      version: APP_VERSION,
      mcpProtocol: MCP_PROTOCOL_VERSION,
      mcpMode: "stateless",
    });
  }

  if (url.pathname === "/host" && request.method === "POST") {
    try {
      const body = hostRequestSchema.parse(await request.json());
      return jsonResponse({ url: await hostFilesAsync(body.files, body.entryPoint) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request";
      return jsonResponse({ error: message }, 400);
    }
  }

  if (url.pathname === "/mcp") {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": [
            "Accept",
            "Authorization",
            "Content-Type",
            "Mcp-Method",
            "Mcp-Name",
            "Mcp-Protocol-Version",
            "Mcp-Session-Id",
          ].join(", "),
        },
      });
    }

    const invalidHost = hostHeaderValidationResponse(request, allowedMcpHostnames);
    if (invalidHost) return withMcpCors(invalidHost);
    return withMcpCors(await mcpHandler.fetch(request));
  }

  if (url.pathname === "/sse" || url.pathname === "/messages") {
    return jsonResponse({
      error: "Legacy SSE was retired. Connect using Streamable HTTP at /mcp.",
      mcpEndpoint: `${BASE_URL}/mcp`,
    }, 410);
  }

  const workspaceName = decodeURIComponent(url.pathname.split("/")[1] ?? "");
  if (isGeneratedWorkspaceName(workspaceName)) {
    const workspaceDir = path.join(HOSTED_DIR, workspaceName);
    try {
      if (await isHostedWorkspaceExpired(workspaceDir)) {
        fs.rm(workspaceDir, { recursive: true, force: true }).catch(console.error);
        return new Response("Hosted HTML expired after 24 hours.", { status: 410 });
      }
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        console.error(`Failed to check hosted workspace ${workspaceName}:`, error);
      }
    }

    const hosted = await serveStatic(HOSTED_DIR, url.pathname, "public, max-age=300");
    if (hosted) return hosted;
  }

  const site = await serveStatic(SITE_DIR, url.pathname, "public, max-age=300");
  return site ?? new Response("Not found", { status: 404 });
}

async function main() {
  await ensureDir(HOSTED_DIR);
  startHostedWorkspaceCleanup();

  if (process.env.TRANSPORT === "stdio") {
    serveStdio(() => createHtmlyServer(), {
      legacy: "serve",
      onerror: (error) => console.error("MCP stdio failed:", error),
    });
    return;
  }

  const server = Bun.serve({
    port: PORT,
    hostname: "0.0.0.0",
    fetch: handleHttpRequest,
    error(error) {
      console.error("Unhandled HTTP error:", error);
      return jsonResponse({ error: "Internal server error" }, 500);
    },
  });

  const shutdown = async () => {
    await mcpHandler.close();
    await server.stop();
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  console.error(
    `Htmly v${APP_VERSION} (${MCP_PROTOCOL_VERSION}, stateless) listening at ${BASE_URL} on port ${server.port}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
