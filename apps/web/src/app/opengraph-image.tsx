import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sentinel — Set the rules before AI agents act. Early access in development.";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#202923",
        color: "#f5f4ee",
        padding: "68px 76px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, border: "2px solid #f5f4ee", borderBottomRightRadius: 13, fontSize: 39, lineHeight: 1 }}>s</div>
        <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: -2 }}>Sentinel</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 86, fontSize: 76, fontWeight: 600, lineHeight: 1.04, letterSpacing: -3 }}>
        <span>Set the rules</span>
        <span>before agents act.</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 24, borderTop: "1px solid #657267", fontSize: 20 }}>
        <span>Tool governance for AI agents</span>
        <span style={{ color: "#d1df9d" }}>In development</span>
      </div>
    </div>,
    size,
  );
}
