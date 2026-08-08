import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/site";

export const alt = "Htmly — Let your AI render real web pages";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#07070b",
          backgroundImage:
            "radial-gradient(60% 80% at 50% 0%, rgba(139,123,255,0.28) 0%, rgba(77,208,255,0.10) 40%, transparent 72%)",
          color: "#f4f4f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #8b7bff, #4dd0ff)",
              color: "#07070b",
              fontSize: "26px",
              fontWeight: 700,
            }}
          >
            {"</>"}
          </div>
          <div style={{ fontSize: "34px", fontWeight: 700 }}>Htmly</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <div
            style={{
              fontSize: "70px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            Stop reading plain markdown. See it rendered.
          </div>
          <div style={{ fontSize: "30px", color: "#9a9ab0", maxWidth: "880px" }}>
            An MCP server that turns your AI&apos;s answer into a real HTML page,
            deployed instantly.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "26px",
            color: "#4dd0ff",
            fontFamily: "monospace",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#4dd0ff",
            }}
          />
          {new URL(SITE_URL).host}
        </div>
      </div>
    ),
    size,
  );
}
