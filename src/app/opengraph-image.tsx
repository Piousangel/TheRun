import { ImageResponse } from "next/og";
import { TheRunMarkSvg } from "@/shared/ui/the-run-mark-svg";
import { THE_RUN_COLORS } from "@/shared/ui/the-run-mark";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";


export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          padding: "56px 64px",
          background:
            "radial-gradient(circle at 24% 12%, rgba(214,180,83,0.24), transparent 28%), linear-gradient(135deg, #070707 0%, #121215 44%, #1b1a1c 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 28,
            borderRadius: 40,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: THE_RUN_COLORS.ink,
                border: "1px solid rgba(200,168,88,0.35)",
              }}
            >
              <TheRunMarkSvg px={62} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 20, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(255,234,173,0.76)" }}>
                The Run
              </div>
              <div style={{ fontSize: 28, marginTop: 10, color: "rgba(255,255,255,0.88)" }}>
                Club Operating System
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 74, fontWeight: 700, lineHeight: 1.04, maxWidth: 760 }}>
              <span>Matchday flow,</span>
              <span>built for a real club.</span>
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.5, color: "rgba(255,255,255,0.7)", maxWidth: 760 }}>
              투표, 출석, 공지, 경기 운영을 하나의 러닝 리듬으로 연결하는 The Run 워크스페이스.
            </div>
          </div>
        </div>

        <div
          style={{
            width: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 260,
              height: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: "radial-gradient(circle, rgba(212,175,84,0.18), rgba(212,175,84,0.02) 72%)",
            }}
          >
            <TheRunMarkSvg px={200} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
