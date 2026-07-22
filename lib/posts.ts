import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import type { Lang } from "./i18n";

// content/profile/<slug>.md (linked0.github.io 글을 앱에 복사) → HTML.
// 언어 선택에 맞춰 <slug>.<lang>.md 우선, 없으면 기본 <slug>.md(영어) 폴백.
marked.setOptions({ gfm: true, breaks: false });

// 각 글은 한 파일에 영어(위) + "## Korean Version" 아래 한국어(아래)가 함께 있다.
// 이 마커로 나눠 선택 언어 부분만 렌더한다.
const KOREAN_MARKER = /^##\s+Korean Version\s*$/m;

function pickLangSection(md: string, lang: Lang): string {
  const m = md.match(KOREAN_MARKER);
  if (!m || m.index === undefined) return md; // 분리 마커 없으면 전체 사용
  if (lang === "ko") {
    // "## Korean Version" 이후(한국어 본문). 헤딩 라인 자체는 제외.
    return md.slice(m.index + m[0].length).trim();
  }
  // 영어: 마커 앞부분에서 한국어 링크 div + 끝의 --- 구분선 제거.
  return md
    .slice(0, m.index)
    .replace(/<div[^>]*>\s*<a href="#for-korean-users">[\s\S]*?<\/a>\s*<\/div>/gi, "")
    .replace(/\n+---\s*$/g, "")
    .trim();
}

export function getPostHtml(slug: string, lang: Lang = "en"): string {
  const file = path.join(process.cwd(), "content/profile", `${slug}.md`);
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
  // YAML front matter 제거 → 언어 섹션 분리 → 이미지 경로 보정 → HTML.
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  const section = pickLangSection(body, lang);
  const fixed = section.replace(/\{\{\s*site\.baseurl\s*\}\}\/assets\/img\//g, "/profile/");
  return marked.parse(fixed, { async: false }) as string;
}
