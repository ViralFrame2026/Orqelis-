import { ImageResponse } from "next/og";

export const alt = "ORQELIS — Comercio digital administrado con IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: "#2b211e",
        color: "#fffaf5",
        padding: "76px 92px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", right: -90, top: -130, width: 500, height: 500, borderRadius: 999, background: "#d9432e", opacity: 0.25 }} />
      <div style={{ position: "absolute", right: 160, bottom: -260, width: 520, height: 520, borderRadius: 999, background: "#f36b32", opacity: 0.16 }} />
      <div style={{ display: "flex", flexDirection: "column", width: 820 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 106, height: 106, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "46% 54% 49% 51% / 52% 46% 54% 48%", background: "#f36b32", position: "relative" }}>
            <div style={{ width: 55, height: 55, display: "flex", border: "12px solid #fffaf5", borderRadius: 999 }} />
            <div style={{ width: 13, height: 42, display: "flex", borderRadius: 999, background: "#fffaf5", position: "absolute", right: 20, bottom: 10, transform: "rotate(-43deg)" }} />
          </div>
          <div style={{ display: "flex", fontSize: 52, letterSpacing: 9, fontWeight: 900 }}>ORQELIS</div>
        </div>
        <div style={{ display: "flex", marginTop: 42, maxWidth: 820, fontSize: 70, lineHeight: 1.04, fontWeight: 800 }}>Pedís. ORQELIS lo hace.</div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 27, color: "#f0c9ad", letterSpacing: 1 }}>Tienda · Admin · Inteligencia Artificial</div>
      </div>
    </div>,
    size,
  );
}
