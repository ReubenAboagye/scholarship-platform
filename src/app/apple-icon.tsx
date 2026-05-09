import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e3a8a",
          borderRadius: "40px",
        }}
      >
        <span
          style={{
            color: "#fbbf24",
            fontSize: 110,
            fontWeight: 700,
            fontFamily: "ui-serif, Georgia, serif",
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
