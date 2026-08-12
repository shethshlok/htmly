const DEFAULT_SITE_URL = "https://html.shloksheth.tech";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_HTMLY_URL ?? DEFAULT_SITE_URL
).replace(/\/$/, "");

export const MCP_URL = `${SITE_URL}/mcp`;
