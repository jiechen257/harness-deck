import { useId } from "react";

export function HarnessLogo({ size = 28 }: { size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const shardA = `honeShardA${id}`;
  const shardB = `honeShardB${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="hone-mark"
    >
      <defs>
        <linearGradient id={shardA} x1="28" y1="18" x2="126" y2="144" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7fbff" />
          <stop offset="0.55" stopColor="currentColor" />
          <stop offset="1" stopColor="#173456" />
        </linearGradient>
        <linearGradient id={shardB} x1="42" y1="30" x2="94" y2="138" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#dbeafe" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path className="rim" fill={`url(#${shardA})`} d="M75 14 119 41 143 85 120 137 65 146 24 116 16 66 38 31Z" />
      <path fill={`url(#${shardB})`} d="M75 14c8 25 0 45-16 61-14 15-22 32-20 58l26 13 55-9c-7-30-22-50-46-62 18-18 25-37 1-61Z" opacity=".92" />
      <path fill="#f7fbff" d="M38 31 75 14c13 30-8 51-28 69L16 66Z" opacity=".7" />
      <path fill="#173456" d="M39 133c1-32-7-51-23-67l8 50 41 30Z" opacity=".42" />
      <path className="cut" d="M75 15c11 31-3 48-24 68m-12 50c1-31 10-48 35-58 25 10 41 30 47 62" fill="none" />
    </svg>
  );
}
