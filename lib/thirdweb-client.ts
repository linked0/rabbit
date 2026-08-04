import { createThirdwebClient } from "thirdweb";

// 클라이언트/서버 공용 thirdweb 클라이언트 — AA §6 pillars 2–4. 키: docs/tasks/current-plan.md §1.
export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ?? "",
});
