export function HarnessLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ borderRadius: size * 0.22 }}
    >
      <defs>
        <linearGradient id="hd-bg" x1="512" y1="0" x2="512" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a5f"/>
          <stop offset="100%" stopColor="#0d1a2e"/>
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="1024" height="1024" rx="228" fill="url(#hd-bg)"/>

      {/* Track backgrounds */}
      <rect x="280" y="260" width="40" height="504" rx="20" fill="white" fillOpacity="0.07"/>
      <rect x="492" y="260" width="40" height="504" rx="20" fill="white" fillOpacity="0.07"/>
      <rect x="704" y="260" width="40" height="504" rx="20" fill="white" fillOpacity="0.07"/>

      {/* Active fills below knobs */}
      <rect x="280" y="480" width="40" height="284" rx="20" fill="#5eead4" fillOpacity="0.45"/>
      <rect x="492" y="390" width="40" height="374" rx="20" fill="#5eead4" fillOpacity="0.45"/>
      <rect x="704" y="570" width="40" height="194" rx="20" fill="#5eead4" fillOpacity="0.45"/>

      {/* Fader knobs */}
      <circle cx="300" cy="480" r="36" fill="white" fillOpacity="0.95"/>
      <circle cx="300" cy="480" r="15" fill="#5eead4"/>

      <circle cx="512" cy="390" r="36" fill="white" fillOpacity="0.95"/>
      <circle cx="512" cy="390" r="15" fill="#5eead4"/>

      <circle cx="724" cy="570" r="36" fill="white" fillOpacity="0.95"/>
      <circle cx="724" cy="570" r="15" fill="#5eead4"/>
    </svg>
  );
}
