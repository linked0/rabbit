// 홈 피처드 PoC 카드의 마크 — Verex의 3D 구와 같은 64px 자리에 들어간다 (2026-08-06).
// 3D도 애니메이션도 쓰지 않는 건 의도다: 마크가 둘이 되면 서로 경쟁해서 둘 다 약해진다.
// Verex 쪽이 움직이는 쪽이고, 이쪽은 가만히 있는 쪽.
// 열쇠 모양인 이유는 이 카드가 세션 키 데모라서 — 위임받은 열쇠 하나가 이 PoC의 전부다.
export default function SessionKeyMark() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" role="presentation">
      <defs>
        {/* Verex의 인디고/푸시아와 겹치지 않는 색 — 두 카드가 같은 브랜드로 보이면 안 된다. */}
        <linearGradient id="skmark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#skmark)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 열쇠 머리 = 계정, 자루 = 위임된 권한, 이빨 = 그 권한에 걸린 제약 */}
        <circle cx="24" cy="24" r="11" />
        <path d="M32 32 L50 50" />
        <path d="M44 44 L38 50" />
        <path d="M50 50 L44 56" />
      </g>
    </svg>
  );
}
