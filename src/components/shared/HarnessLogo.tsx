export function HarnessLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="1024" height="1024" rx="228" fill="#111d3a" />
      <g stroke="white" strokeWidth="2.5" strokeOpacity="0.18" strokeLinecap="round" fill="none">
        <path d="M310,340 L260,500 L420,580 L490,420 Z" />
        <path d="M490,420 L600,350 L700,370 L790,310" />
      </g>
      <circle cx="310" cy="340" r="14" fill="white" />
      <circle cx="310" cy="340" r="6" fill="#5eead4" opacity="0.6" />
      <circle cx="260" cy="500" r="11" fill="white" />
      <circle cx="420" cy="580" r="10" fill="white" />
      <circle cx="490" cy="420" r="9" fill="white" />
      <circle cx="600" cy="350" r="13" fill="white" />
      <circle cx="700" cy="370" r="11" fill="white" />
      <circle cx="790" cy="310" r="10" fill="white" />
    </svg>
  );
}
