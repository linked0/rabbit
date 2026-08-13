import fs from "node:fs";
import path from "node:path";

// PoC 카드의 "관련 코드" — docs/code/pocs/<key>.py 를 그대로 읽어 온다 (jay, 2026-08-13).
// 로컬 docs/pocs.html(scripts/generate-pocs-html.mjs)과 같은 파일을 같은 규칙으로 읽는
// 단일 소스. 배포 이미지에는 Dockerfile 이 docs/code/ 만 별도로 복사해 온다.
export function getPocCodeSnippet(key: string): string | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "docs", "code", "pocs", `${key}.py`), "utf8");
  } catch {
    return null;
  }
}

export const POC_CODE_REPO_HREF = (key: string) =>
  `https://github.com/linked0/rabbit/blob/main/docs/code/pocs/${key}.py`;
