import { ImageResponse } from "next/og";
import { THE_RUN_COLORS } from "@/shared/ui/the-run-mark";
import { TheRunMarkSvg } from "@/shared/ui/the-run-mark-svg";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";


// 앱 아이콘: 검정 바탕 + 금색 R. iOS·안드로이드가 모서리를 직접 둥글게 자르므로 꽉 찬 사각형으로 둔다.
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
          background: THE_RUN_COLORS.ink,
        }}
      >
        <TheRunMarkSvg px={340} />
      </div>
    ),
    size,
  );
}
