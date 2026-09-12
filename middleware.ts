import { auth, isOwnerEmail } from "@/auth";

// 라우트 가드. 공개 표면은 딱 여기 적힌 것뿐이고, 나머지는 전부 오너
// (= ALLOWED_EMAILS 의 구글 계정) 로그인 필요 → 아니면 /login (2026-07-25, jay).
// app/Nav.tsx 의 `pub` 플래그와 짝을 이룬다 — 메뉴에서 숨긴 페이지는 URL 직접 입력도 막힌다.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/live", // 라이브 허브 — 돌아가는 카드만 (Nav pub, 2026-08-11)
  "/algorithms", // 알고리즘 허브 — 수학·알고리즘 노트 (Nav pub, 2026-08-11)
  "/poc", // PoCs 허브 — 만들고 있는 것 + TIL 섹션 (Nav pub, 2026-08-03)
  "/til", // → /poc 리다이렉트 (2026-08-11). 공유된 링크가 /login 으로 튀지 않도록 공개 유지.
  "/market", // 공개 시세만 — 메뉴에선 PoCs 허브 카드로만 노출 (라우트는 그대로 공개)
  "/xyz", // C4 관찰자 대시보드 — 공개 데이터만 (메뉴에선 PoCs 허브 카드로만 노출)
  "/api/relay", // /xyz 용 공개 relay 프록시 (키 불필요)
  "/api/indices", // /market 의 지수 카드용 — 공개 시세, 업스트림 60초 캐시
  "/api/orderbook", // /market 의 Hyperliquid L2 북용 — 공개 info API
  "/projects", // 수행 프로젝트 — 홈에 있던 피처드/프로젝트 전체 (Nav pub, 로그인 불필요)
  "/api/jay-chat", // 홈에 통합된 Jay Chat 의 API — 시간당 토큰 예산 + 버스트 가드로 보호됨
  "/live/ap2", // AP2 — Stripe 정산 데모 (test mode) — 메뉴에선 PoCs 허브 카드로만 노출 (라우트는 공개)
  "/api/ap2/checkout", // /live/ap2 용 Stripe Checkout 세션 생성 — 공개(로그인 불필요, 테스트 결제만)
  "/live/toss", // Toss Payments — KRW 정산 데모 (test mode) — /live/ap2와 동일하게 PoCs 허브 카드로만 노출
  "/live/aa", // AA — ERC-7702/7715 세션 키 + Agentic AA 4대 요소 데모 (Sepolia) — PoCs 허브 카드로만 노출
  "/live/7702", // EIP-7702 계정 인스펙터 — 읽기 전용(eth_getCode), PoCs 허브 카드로만 노출
  "/poc/dvt", // DVT 프로토콜 흡수 제안 정독 노트 — 정적 설명 페이지
  // 자율 결제 에이전트 — 아직 구현 전이라 각본만 도는 목업. 카드가 "준비 중"이라 허브에서
  // 링크되지 않고 URL로만 들어온다. 논의 중 공유하려면 로그인 없이 열려야 해서 공개로 둔다.
  "/live/agent",
  // OpenZeppelin Relayer·Monitor — 역시 각본만 도는 목업. 카드에서 링크되므로 공개가 아니면
  // 허브에서 눌렀을 때 /login 으로 튄다 (2026-08-11에 실제로 그랬다).
  "/poc/oz-relayer",
  // TIL 상세 — LMSR/하이브리드 AMM 정독 노트. 읽기 전용 정적 페이지라 /til 과 함께 공개.
  "/til/lmsr-hybrid-amm",
  // 게임 카드는 /poc 에서 비로그인 방문자에게도 보이는데 라우트가 막혀 있어 클릭하면
  // /login 으로 튀었다 (2026-08-11 발견 — oz-relayer 때와 같은 실패 유형). 자리표시자
  // 캔버스 게임이라 오너 전용 데이터가 없고, 카드가 공개면 라우트도 공개여야 한다.
  "/game",
  // 게임 정적 번들의 루트. 하위 경로(/jayverse-game/street, /jayverse-game/_next/...)는
  // 아래 matcher 의 `jayverse-game/` 제외로 미들웨어를 아예 안 타지만, 슬래시가 없는 이
  // 한 경로만은 그 제외에 안 걸려 여기서 열어준다 — next.config.js 가 index.html 로 잇는
  // 게임 랜딩이라, 빠뜨리면 방문자에게만 /login 으로 튄다.
  "/jayverse-game",
]);

// /poc 와 /live 아래는 전부 공개다 (2026-08-11 /poc, 2026-08-26 /live).
//
// 원래 이 파일의 규칙은 "명시적 허용 목록, prefix 매칭 금지"였고, 그래서 aa/scenarios/*
// 4개까지 손으로 적어 두었다. 그 규칙을 여기서만 푼다 — 이유는 두 번 데였기 때문이다:
// /poc/oz-relayer 를 추가하며 빠뜨려 /login 으로 튀었고, 카드 상세 동적 라우트(/poc/[key])는
// 애초에 손으로 적을 수가 없다(카드가 늘면 경로도 는다). 목록과 라우트가 갈라지는 실패는
// 빌드에도 tsc 에도 안 잡히고 배포 후에야 보인다.
//
// **/live 를 함께 넣는 이유(2026-08-26):** live 상세 5개가 /poc 에서 /live 로 옮겨졌다.
// PUBLIC_PATHS 의 정확 일치만으로는 `/live/aa/scenarios/<slug>` 같은 하위 경로가 빠지고,
// 그러면 배포 후에야 /login 으로 튀는 것을 발견하게 된다 — 위에 적힌 그 실패 그대로다.
// 서브트리 규칙을 경로와 **함께** 옮겨야 목록과 라우트가 갈라지지 않는다.
//
// 안전한 이유: 두 서브트리 모두 **설계상 전부 공개**다. 데모 허브이고, 오너 전용 데이터를
// 다루는 페이지가 여기 들어올 일이 없다. 비공개가 필요한 페이지가 생기면 이 밖에 두거나
// 아래에 예외를 명시할 것 — 그 순간 이 주석이 그 결정을 다시 꺼내 준다.
// (해당 후보 하나: `/live/agent/console` — 오너 전용 조작판이지만 `/api/agent/*` 가 이미
//  미들웨어와 라우트 양쪽에서 막혀 있어 데이터는 새지 않는다. 결정 대기 중.)
const isPublicDemoPath = (p: string) =>
  p === "/poc" || p.startsWith("/poc/") || p === "/live" || p.startsWith("/live/");

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // /home(= www.jaylabs.xyz 홈, Task 5)은 공개 — 정확히 /home 과 /home/* 만 (느슨한 prefix 방지)
  const isHome = pathname === "/home" || pathname.startsWith("/home/");
  if (PUBLIC_PATHS.has(pathname) || isHome || isPublicDemoPath(pathname) || pathname.startsWith("/api/auth/")) return;
  if (!isOwnerEmail(req.auth?.user?.email)) {
    // **API 는 리다이렉트하지 않는다** (2026-08-27, jay 가 콘솔에서 이 에러를 만나서).
    //
    // 로그인 페이지로 튕기면 `fetch(...).json()` 이 HTML 을 받아 이렇게 터진다:
    //
    //   SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
    //
    // 그 문장은 원인을 한 글자도 말하지 않는다 — 로그인이 필요하다는 사실이
    // 파서 에러로 위장된다. 라우트 핸들러들은 이미 401 JSON 을 돌려주는데,
    // 미들웨어가 그 앞에서 가로채기 때문에 그 정직한 응답이 화면에 닿지 못했다.
    // API 에는 API 가 이해하는 언어로 답한다.
    if (pathname.startsWith("/api/")) {
      return Response.json(
        { error: "unauthorized — sign in as the owner at /login" },
        { status: 401 },
      );
    }
    // 원래 가려던 곳을 들려보낸다 — 로그인 성공 후 여기로 돌려보내기 위해 (2026-07-27, jay).
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return Response.redirect(login);
  }
});

export const config = {
  // Next 정적 리소스/아이콘(파비콘·App Router icon) 제외, 나머지 전부 미들웨어 통과.
  // jayverse-game/ 는 /game 에 임베드되는 정적 게임 번들(public/jayverse-game/, 서브모듈
  // 정적 export) — 오너 데이터가 없는 읽기 전용 데모라 profile·whitepaper 처럼 통째로 제외한다.
  // 안 그러면 게임의 모든 에셋 요청이 인증에 걸려 /login 으로 302 된다.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|profile/|whitepaper/|jayverse-game/).*)",
  ],
};
