import { createThirdwebClient } from "thirdweb";

// AA §6 pillars 2-4 용 thirdweb 클라이언트. 키: docs/tasks/current-plan.md §1.
// 모듈 상수가 아니라 팩토리인 이유: clientId 를 NEXT_PUBLIC_* 로 읽으면 빌드 시점에 값이
// 코드에 박힌다 — Cloud Run 은 소스에서 빌드하고 .env 을 이미지에 넣지 않으므로
// 그렇게 하면 운영에서 빈 값으로 굳는다. 서버에서 런타임에 읽어 prop 으로 내려보낸다
// (2026-08-05, 배포 준비 중 발견).
export function makeThirdwebClient(clientId: string) {
  return createThirdwebClient({ clientId });
}
