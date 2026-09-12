#!/usr/bin/env bash
# 로컬 서버를 폰·다른 기기에서 열어보기 — Cloudflare 퀵 터널 (계정·라우터 설정 불필요).
#
# 사용법:
#   ./scripts/tunnel.sh            # jayverse-game 개발 서버(3050)를 공개 URL 로
#   ./scripts/tunnel.sh 3100       # rabbit 개발 서버(3100)를 공개 URL 로
#
# 동작: 지정 포트에 아무것도 없으면 그 포트의 개발 서버를 먼저 띄운 뒤, cloudflared 가
# 아웃바운드로 Cloudflare 엣지에 붙어 *.trycloudflare.com 주소를 받아온다. 인바운드 포트를
# 여는 게 아니라서 방화벽·공유기는 손댈 것이 없다. Ctrl-C 로 끝내면 터널도 서버도 같이 닫힌다.
#
# 알아둘 것:
#   - URL 은 실행할 때마다 바뀐다. 고정 주소가 필요하면 Tailscale(사설) 이나 Cloudflare 의
#     named tunnel(계정 필요) 로 올라가는 게 맞다 — 퀵 터널은 "지금 잠깐 보여주기" 용이다.
#   - URL 을 아는 사람은 누구나 들어온다. 게임(3050)은 관전 전용 샘플 저널이라 괜찮지만,
#     rabbit(3100)을 여는 경우 Google 로그인은 콜백 URL 이 안 맞아 동작하지 않는다 —
#     공개 페이지(/game, /poc, /live)만 보인다고 생각할 것.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=${1:-3050}

if ! command -v cloudflared >/dev/null 2>&1; then
  cat <<'MSG'
❌ cloudflared 가 없습니다. 설치 후 다시 실행하세요:
   macOS    brew install cloudflared
   Debian   sudo apt install cloudflared     (또는 pkg.cloudflare.com 의 저장소 추가)
   Windows  winget install Cloudflare.cloudflared
MSG
  exit 1
fi

# 포트가 비어 있으면 그 포트의 개발 서버를 백그라운드로 띄운다.
DEV_PID=""
if ! curl -s -o /dev/null --max-time 2 "http://localhost:$PORT"; then
  case "$PORT" in
    3050)
      [ -f games/jayverse-game/package.json ] || {
        echo "❌ games/jayverse-game 가 비어 있습니다: git submodule update --init --recursive"; exit 1; }
      echo "▶ jayverse-game 개발 서버 시작 (:$PORT)"
      (cd games/jayverse-game && pnpm dev >/dev/null 2>&1) & DEV_PID=$!
      ;;
    3100)
      echo "▶ rabbit 개발 서버 시작 (:$PORT)"
      pnpm dev >/dev/null 2>&1 & DEV_PID=$!
      ;;
    *)
      echo "❌ :$PORT 에 응답하는 서버가 없고, 이 포트는 자동으로 띄울 줄 모릅니다. 먼저 서버를 켜 주세요."
      exit 1
      ;;
  esac
  for _ in $(seq 1 60); do
    curl -s -o /dev/null --max-time 2 "http://localhost:$PORT" && break
    sleep 1
  done
  trap '[ -n "$DEV_PID" ] && kill "$DEV_PID" 2>/dev/null; true' EXIT
fi

echo "▶ Cloudflare 퀵 터널 → http://localhost:$PORT"
echo "  아래 출력에서 https://….trycloudflare.com 주소를 폰 브라우저에 입력하세요."
[ "$PORT" = 3050 ] && echo "  게임 재생 화면은 그 주소 뒤에 /street 를 붙입니다."
echo
exec cloudflared tunnel --url "http://localhost:$PORT"
