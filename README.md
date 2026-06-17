# Htmly 🚀

**Htmly** is a high-fidelity HTML rendering and visualization engine built on the **Model Context Protocol (MCP)**. It allows AI agents and CLI tools to "push" HTML/CSS/JS code to a remote server and get an instant, hosted preview link.

Live at: [https://html.shloksheth.tech](https://html.shloksheth.tech)

## ✨ Features

- **Push-to-Visualize**: Instantly render any HTML/CSS/JS bundle.
- **Multi-File Support**: Handles complete project structures (index.html, styles.css, app.js, etc.).
- **Workspace Isolation**: Every request gets a unique, cryptographically secure UUID workspace.
- **7-Day Auto-Cleanup**: Automated background tasks purge expired workspaces to stay lean.
- **High Performance**: Parallelized file writes, Gzip compression, and optimized caching.
- **Remote First**: Built using SSE (Server-Sent Events) for seamless remote connectivity.

## 🛠️ Architecture

Htmly acts as a bridge between an **MCP Client** (like Claude Desktop or a CLI) and a **Web Browser**.

1. **Client** pushes a bundle of files via the `render_files` tool.
2. **Engine** creates an isolated workspace and writes files in parallel.
3. **Static Server** (Express) hosts the workspace immediately.
4. **Agent** receives a live URL (e.g., `https://html.shloksheth.tech/{uuid}/index.html`) to present to the user.

## 🚀 Installation

### 1. Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "htmly": {
      "url": "https://html.shloksheth.tech/sse"
    }
  }
}
```

### 2. Custom CLI / MCP Clients

Point your SSE transport to:
`https://html.shloksheth.tech/sse`

## 📦 Local Development

If you want to run your own instance of Htmly:

### Using Bun (Recommended)

```bash
# Install dependencies
bun install

# Start the server
bun start
```

### Using Docker

```bash
docker compose up --build -d
```

## ⚙️ Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | The port the server listens on. |
| `BASE_URL` | `https://html.shloksheth.tech` | The base URL for generated links. |

---

Built with ❤️ by [Shlok Sheth](https://github.com/shethshlok)
