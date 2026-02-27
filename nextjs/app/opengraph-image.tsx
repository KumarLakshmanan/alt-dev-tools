import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ALT-DEV TOOLS — Sidebar DevTools for Chrome";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0e1a 0%, #1a1730 50%, #0f0e1a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative purple glow blobs */}
        <div
          style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
            top: "-100px",
            left: "-100px",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
            bottom: "-80px",
            right: "-80px",
          }}
        />

        {/* DevTools icon SVG */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "96px",
            height: "96px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            marginBottom: "32px",
            boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
          }}
        >
          {/* Code brackets icon */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "800",
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: "16px",
            display: "flex",
          }}
        >
          ALT-DEV TOOLS
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#a5b4fc",
            fontWeight: "400",
            marginBottom: "40px",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: "1.4",
            display: "flex",
          }}
        >
          Sidebar DevTools for Chrome
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
          }}
        >
          {["Elements", "Console", "Network", "Sources", "Performance"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                background: "rgba(99,102,241,0.18)",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#c7d2fe",
                fontSize: "18px",
                fontWeight: "500",
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL badge */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            color: "#6366f1",
            fontSize: "18px",
            fontWeight: "600",
            letterSpacing: "0.02em",
            display: "flex",
          }}
        >
          altdevtools.codingfrontend.in
        </div>
      </div>
    ),
    { ...size }
  );
}
