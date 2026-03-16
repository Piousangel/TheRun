import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function RunnerMark() {
  return (
    <svg width="220" height="220" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="og-fill" x1="24" y1="16" x2="72" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8E7A4" />
          <stop offset="0.45" stopColor="#D4AF54" />
          <stop offset="1" stopColor="#8F6820" />
        </linearGradient>
        <linearGradient id="og-stroke" x1="18" y1="22" x2="82" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3C4" />
          <stop offset="0.5" stopColor="#D4AF54" />
          <stop offset="1" stopColor="#956B1E" />
        </linearGradient>
      </defs>
      <path d="M17 48C24 45 30 41 35 35" stroke="url(#og-stroke)" strokeWidth="4.5" strokeLinecap="round" opacity="0.34" />
      <path d="M12 60C20 58 28 54 36 47" stroke="url(#og-stroke)" strokeWidth="3.5" strokeLinecap="round" opacity="0.2" />
      <circle cx="60" cy="18" r="8" fill="url(#og-fill)" />
      <path d="M45 33L58 27L72 36" stroke="url(#og-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M58 27L48 46L33 58" stroke="url(#og-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M49 46L67 50L81 40" stroke="url(#og-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 46L42 74" stroke="url(#og-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M67 50L76 74" stroke="url(#og-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M43 35L53 39" stroke="url(#og-stroke)" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      <path d="M42 74H52" stroke="url(#og-stroke)" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <path d="M75 74H83" stroke="url(#og-stroke)" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

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
                background: "linear-gradient(160deg, rgba(212,175,84,0.18), rgba(255,255,255,0.06))",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <RunnerMark />
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
            <RunnerMark />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
