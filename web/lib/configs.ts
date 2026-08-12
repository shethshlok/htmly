import { MCP_URL } from "./site";

export { MCP_URL, SITE_URL } from "./site";
export const SKILL_URL =
  "https://github.com/shethshlok/htmly/tree/main/skills/htmly";
export const SKILL_INSTALL_PROMPT = `Use $skill-installer to install ${SKILL_URL}`;

export type InstallMethod = {
  id: string;
  label: string;
  blurb: string;
  /** path the user should open / file to edit */
  location?: string;
  language: "json" | "bash";
  code: string;
};

export const INSTALL_METHODS: InstallMethod[] = [
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    blurb:
      "Open Settings → Developer → Edit Config, then add Htmly to your mcpServers and restart the app.",
    location: "claude_desktop_config.json",
    language: "json",
    code: `{
  "mcpServers": {
    "htmly": {
      "url": "${MCP_URL}"
    }
  }
}`,
  },
  {
    id: "claude-code",
    label: "Claude Code",
    blurb: "Add the server from your terminal with a single command.",
    location: "terminal",
    language: "bash",
    code: `claude mcp add --transport http htmly ${MCP_URL}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    blurb:
      "Create (or edit) .cursor/mcp.json in your project, or add it globally from Settings → MCP.",
    location: ".cursor/mcp.json",
    language: "json",
    code: `{
  "mcpServers": {
    "htmly": {
      "url": "${MCP_URL}"
    }
  }
}`,
  },
  {
    id: "vscode",
    label: "VS Code",
    blurb:
      "Add a server to .vscode/mcp.json (GitHub Copilot Agent mode) and reload the window.",
    location: ".vscode/mcp.json",
    language: "json",
    code: `{
  "servers": {
    "htmly": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`,
  },
  {
    id: "generic",
    label: "Any MCP client",
    blurb:
      "Htmly speaks stateless MCP 2026-07-28 over Streamable HTTP, with compatibility for older Streamable HTTP clients at the same endpoint.",
    location: "MCP endpoint",
    language: "bash",
    code: MCP_URL,
  },
];

export const FEATURES = [
  {
    title: "Push-to-visualize",
    body: "Your agent sends a bundle of HTML/CSS/JS through one tool - htmly - and gets back a live URL instantly.",
    icon: "bolt",
  },
  {
    title: "Multi-file projects",
    body: "Full project structures are supported: index.html, styles.css, app.js and more, written in parallel for speed.",
    icon: "files",
  },
  {
    title: "Isolated workspaces",
    body: "Every request gets its own cryptographically unique workspace, so previews never collide.",
    icon: "shield",
  },
  {
    title: "No local runtime",
    body: "The renderer stays remote. Add the instruction skill and point your client at one URL - no server process or app package to run.",
    icon: "cloud",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Connect Htmly",
    body: "Add the MCP endpoint to your AI client using any of the methods above. Takes about a minute.",
  },
  {
    n: "02",
    title: "Ask for a visual",
    body: 'Tell your agent what you want to see — "show me this data as a dashboard" — and it writes the HTML.',
  },
  {
    n: "03",
    title: "Open the live link",
    body: "Htmly hosts the result and hands your agent a real URL. Click it and the page is already live.",
  },
];

export const FAQS = [
  {
    q: "What exactly is an MCP server?",
    a: "MCP (Model Context Protocol) is an open standard that lets AI assistants use external tools. Htmly exposes one tool, htmly, which turns code your AI writes into a hosted web page.",
  },
  {
    q: "Do I need to run anything locally?",
    a: "No. The renderer is hosted and remote-first. The Htmly skill adds agent instructions, and the MCP connection is a single URL — there is no server process or app package running on your machine.",
  },
  {
    q: "Which clients work with Htmly?",
    a: "Any MCP-compatible client that supports remote MCP transport: Claude Desktop, Claude Code, Cursor, VS Code (Copilot Agent), and custom clients built on the MCP SDK.",
  },
  {
    q: "How long do my previews stay online?",
    a: "Workspaces stay online for 24 hours. After that, stale links expire and the engine removes the hosted files to keep resource usage bounded.",
  },
  {
    q: "Can I self-host it?",
    a: "Yes. Htmly is built with Bun and ships with a Dockerfile, so you can run your own instance and point BASE_URL at your own domain.",
  },
];
