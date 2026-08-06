import { PROFILE } from "@/lib/home-content";
import { pick } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// 홈 프로필의 연락 줄 (2026-08-06, jay: "이 부분이 어색하다").
//
// 바뀐 것 셋:
// ① "LINKS" 라벨을 없앴다 — 링크 세 개 옆에서 그 단어는 아무것도 설명하지 않는다.
// ② 글자를 플랫폼 이름에서 **핸들**로 바꿨다. 마크가 이미 어느 플랫폼인지 말하므로,
//    글자는 "거기서 그가 누구인가"를 말하는 편이 정보량이 크다. 방문자가 복사할 수 있는 것도
//    "GitHub"가 아니라 "linked0"이다.
// ③ hover 시 마크와 테두리가 **그 목적지 자신의 색**을 띤다 — LinkedIn 파랑, 메일은 이 사이트가
//    이미 쓰는 인디고. 장식이 아니라 미리보기다: 색이 곧 어디로 가는지를 말한다.
//    카드가 아니라 칩이므로 들어올리지 않는다 — 들어올리는 제스처는 피처드 카드의 것이다.

const ICONS: Record<string, React.ReactNode> = {
  GitHub: (
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  ),
  LinkedIn: (
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.222 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
  ),
};

function Mark({ name }: { name: string }) {
  return (
    <svg className="plink-mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export default function ProfileLinks({ lang }: { lang: Lang }) {
  return (
    <div className="plinks">
      {PROFILE.links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className={`plink plink-${l.label.toLowerCase()}`}
          // 화면에는 핸들만 보이므로, 스크린리더에는 어느 플랫폼인지까지 읽어준다.
          aria-label={`${l.label} — ${l.handle}`}
        >
          <Mark name={l.label} />
          <span>{l.handle}</span>
        </a>
      ))}
      <a
        href={`mailto:${PROFILE.email}`}
        className="plink plink-mail"
        aria-label={pick(lang, `이메일 — ${PROFILE.email}`, `Email — ${PROFILE.email}`)}
      >
        <svg
          className="plink-mark"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="4.5" width="20" height="15" rx="2.5" />
          <path d="M2.8 6.2 12 13l9.2-6.8" />
        </svg>
        <span>{PROFILE.email}</span>
      </a>
    </div>
  );
}
