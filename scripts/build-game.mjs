#!/usr/bin/env node
// games/jayverse-game (git submodule) → public/jayverse-game/ 정적 번들.
//
// 왜 빌드해서 복사하나: 게임은 Next 16 / React 19 + react-three-fiber 9 이고 rabbit 은
// Next 14 / React 18 이다. 컴포넌트를 직접 import 하려면 rabbit 전체를 올려야 하므로,
// 게임을 자기 툴체인으로 따로 빌드해 정적 파일만 가져온다 — 두 런타임이 만나지 않는다.
// `EXPORT_STATIC=1` + `NEXT_PUBLIC_BASE_PATH` 는 게임 저장소가 이 용도로 미리 열어둔
// 스위치다 (games/jayverse-game/next.config.ts 주석 참고).
//
// 산출물은 커밋하지 않는다 (.gitignore). 로컬은 이 스크립트를, 클라우드는 Dockerfile 이
// 같은 명령을 돌려 이미지 안에서 만든다 — 빌드 산출물이 저장소에서 낡아가는 일이 없다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const GAME_DIR = path.join(REPO_ROOT, 'games', 'jayverse-game');
const OUT_DIR = path.join(GAME_DIR, 'out');
const DEST = path.join(REPO_ROOT, 'public', 'jayverse-game');
// 게임이 서빙될 하위 경로. 여기를 바꾸면 app/game/page.tsx 의 iframe src 와
// next.config.js 의 rewrite 도 같이 바꿔야 한다 — 세 곳이 같은 문자열을 본다.
const BASE_PATH = '/jayverse-game';

// 서브모듈이 안 받아진 상태(빈 디렉터리)면 조용히 넘기지 않는다. 넘기면 /game 이
// 폴백 화면으로 뜨는데, 그건 "빌드를 안 돌렸다"와 구분이 안 되는 종류의 실패다.
if (!fs.existsSync(path.join(GAME_DIR, 'package.json'))) {
  console.error(
    `❌ ${path.relative(REPO_ROOT, GAME_DIR)} 가 비어 있습니다 (서브모듈 미초기화).\n` +
    `   먼저: git submodule update --init --recursive`,
  );
  process.exit(1);
}

const run = (cmd, args, cwd, env) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

console.log('▶ jayverse-game 의존성 설치');
run('pnpm', ['install', '--frozen-lockfile'], GAME_DIR);

console.log(`▶ jayverse-game 정적 빌드 (basePath=${BASE_PATH})`);
fs.rmSync(OUT_DIR, { recursive: true, force: true });
run('pnpm', ['build'], GAME_DIR, { EXPORT_STATIC: '1', NEXT_PUBLIC_BASE_PATH: BASE_PATH });

// out/index.html 이 없으면 next build 가 export 모드로 안 돌았다는 뜻 — 빈 폴더를
// public/ 에 복사해두면 /game 이 흰 화면으로 뜨므로 여기서 멈춘다.
if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
  console.error(`❌ ${path.relative(REPO_ROOT, OUT_DIR)}/index.html 이 없습니다 — 정적 export 실패.`);
  process.exit(1);
}

console.log(`▶ ${path.relative(REPO_ROOT, DEST)} 로 복사`);
fs.rmSync(DEST, { recursive: true, force: true });
fs.cpSync(OUT_DIR, DEST, { recursive: true });

const count = fs.readdirSync(DEST, { recursive: true }).length;
console.log(`✅ jayverse-game → public${BASE_PATH}/ (${count} 항목). /game 에서 iframe 으로 로드됩니다.`);
