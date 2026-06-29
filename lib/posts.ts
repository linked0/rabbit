import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

// content/profile/<slug>.md (linked0.github.io 글을 앱에 복사) → HTML.
// 빌드 시(SSG) 읽어서 렌더하므로 런타임 파일 의존성 없음.
marked.setOptions({ gfm: true, breaks: false });

export function getPostHtml(slug: string): string {
  const file = path.join(process.cwd(), "content/profile", `${slug}.md`);
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
  // YAML front matter 제거
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  // Jekyll 이미지 경로 → public/profile/
  const fixed = body.replace(/\{\{\s*site\.baseurl\s*\}\}\/assets\/img\//g, "/profile/");
  return marked.parse(fixed, { async: false }) as string;
}
