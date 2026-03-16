import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

function RunnerMark() {
  return (
    <svg width="260" height="260" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="icon-fill" x1="24" y1="16" x2="72" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8E7A4" />
          <stop offset="0.45" stopColor="#D4AF54" />
          <stop offset="1" stopColor="#8F6820" />
        </linearGradient>
        <linearGradient id="icon-stroke" x1="18" y1="22" x2="82" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3C4" />
          <stop offset="0.5" stopColor="#D4AF54" />
          <stop offset="1" stopColor="#956B1E" />
        </linearGradient>
      </defs>
      <path d="M17 48C24 45 30 41 35 35" stroke="url(#icon-stroke)" strokeWidth="4.5" strokeLinecap="round" opacity="0.34" />
      <path d="M12 60C20 58 28 54 36 47" stroke="url(#icon-stroke)" strokeWidth="3.5" strokeLinecap="round" opacity="0.2" />
      <circle cx="60" cy="18" r="8" fill="url(#icon-fill)" />
      <path d="M45 33L58 27L72 36" stroke="url(#icon-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M58 27L48 46L33 58" stroke="url(#icon-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M49 46L67 50L81 40" stroke="url(#icon-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 46L42 74" stroke="url(#icon-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M67 50L76 74" stroke="url(#icon-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M43 35L53 39" stroke="url(#icon-stroke)" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      <path d="M42 74H52" stroke="url(#icon-stroke)" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <path d="M75 74H83" stroke="url(#icon-stroke)" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 20%, rgba(214,180,83,0.28), transparent 34%), linear-gradient(180deg, #090909 0%, #111114 48%, #1a1818 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 36,
            borderRadius: 80,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 320,
            height: 320,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(212,175,84,0.16), rgba(212,175,84,0.02) 72%)",
          }}
        >
          <RunnerMark />
        </div>
      </div>
    ),
    size,
  );
}
