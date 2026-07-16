export default function AuthIllustration() {
  return (
    <svg
      viewBox="0 0 360 250"
      fill="none"
      style={{ width: 360, height: 250 }}
    >
      {/* Glow oval */}
      <ellipse
        cx="270"
        cy="75"
        rx="120"
        ry="70"
        fill="#262d5c"
      />
      {/* Monitor body */}
      <rect x="55" y="30" width="190" height="125" rx="14" fill="#2a3266" />
      {/* Screen */}
      <rect x="65" y="38" width="170" height="105" rx="8" fill="#151a38" />
      {/* Content bars */}
      <rect x="78" y="52" width="70" height="8" rx="4" fill="#ff7a59" />
      <rect x="78" y="66" width="90" height="8" rx="4" fill="#4a5cff" />
      <rect x="78" y="80" width="55" height="8" rx="4" fill="#4a5cff" />
      {/* Stand */}
      <rect x="135" y="155" width="30" height="12" rx="3" fill="#2a3266" />
      {/* Base */}
      <rect x="115" y="165" width="70" height="6" rx="3" fill="#2a3266" />
      {/* Ring avatar "问" */}
      <circle cx="260" cy="60" r="28" fill="none" stroke="#4a5cff" strokeWidth="2" />
      <circle cx="260" cy="60" r="24" fill="#ff7a59" />
      <text x="260" y="65" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Microsoft YaHei UI, sans-serif">问</text>
      {/* Ring avatar "答" */}
      <circle cx="305" cy="115" r="18" fill="none" stroke="#ff7a59" strokeWidth="2" />
      <circle cx="305" cy="115" r="15" fill="#4a5cff" />
      <text x="305" y="120" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Microsoft YaHei UI, sans-serif">答</text>
      {/* Decor dots */}
      <circle cx="230" cy="95" r="2.5" fill="#ff7a59" />
      <circle cx="318" cy="80" r="2" fill="#ff7a59" />
      <circle cx="340" cy="55" r="2" fill="#ff7a59" />
    </svg>
  );
}
