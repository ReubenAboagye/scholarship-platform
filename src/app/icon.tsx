import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

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
          backgroundColor: "#1e3a8a",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            color: "#fbbf24",
            fontSize: 22,
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
