import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HoverQR — QR & Barcode Toolkit for Chrome";
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

        {/* QR icon SVG */}
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
          {/* QR code icon (simplified SVG) */}
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
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="3" height="3" />
            <line x1="14" y1="20" x2="17" y2="20" />
            <line x1="20" y1="14" x2="20" y2="17" />
            <line x1="20" y1="20" x2="21" y2="20" />
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
          HoverQR
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
          QR &amp; Barcode Toolkit for Chrome
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
          }}
        >
          {["Decode on Hover", "Generate QR", "Snap & Decode", "Free & Pro"].map((label) => (
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
          hoverqr.codingfrontend.in
        </div>
      </div>
    ),
    { ...size }
  );
}
