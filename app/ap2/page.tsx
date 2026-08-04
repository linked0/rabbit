import type Stripe from "stripe";
import Nav from "../Nav";
import TechNotes from "../TechNotes";
import TechNotesLink from "../TechNotesLink";
import PaymentReceipt from "../PaymentReceipt";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { getStripe } from "@/lib/stripe";
import { AP2_PRODUCT } from "@/lib/ap2-data";
import { POC_CARDS } from "@/lib/poc-cards";

const AP2_CARD = POC_CARDS.find((c) => c.key === "ap2")!;

// AP2 §2 — "agent buys data, settles via Stripe" 목업. 설계: docs/tasks/current-plan.md §2.
// 결제 성공 후에도 이 페이지로 돌아와(success_url) session_id로 결제 상태를 서버에서 검증한다 —
// 클라이언트가 보낸 "성공했다"는 신호를 그대로 믿지 않기 위함.
export default async function Ap2Page({
  searchParams,
}: {
  searchParams: { session_id?: string; canceled?: string };
}) {
  const lang = getLang();
  let paidSession: Stripe.Checkout.Session | null = null;
  let pending = false;
  let verifyError: string | null = null;

  if (searchParams.session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id);
      if (session.payment_status === "paid") paidSession = session;
      else pending = true;
    } catch (e) {
      verifyError = String(e instanceof Error ? e.message : e);
    }
  }

  const fmtDate = (unixSeconds: number) =>
    new Date(unixSeconds * 1000).toLocaleString(lang === "ko" ? "ko-KR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Seoul",
    });

  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "AP2 — Stripe 정산 데모", "AP2 — Stripe Settlement Demo")}</h1>
        <p className="sub">
          {pick(
            lang,
            "에이전트가 데이터를 사고 Stripe Checkout(test mode)으로 정산하는 교육용 예시. 실제 결제는 발생하지 않습니다.",
            "An educational example: an agent buys data and settles via Stripe Checkout (test mode). No real charges occur."
          )}
        </p>
        <TechNotesLink lang={lang} />

        {paidSession && (
          <PaymentReceipt
            lang={lang}
            verifiedVia={pick(lang, "Stripe Checkout Session 조회 API", "Stripe Checkout Session retrieve API")}
            content={pick(lang, AP2_PRODUCT.contentKo, AP2_PRODUCT.contentEn)}
            rows={[
              { label: pick(lang, "세션 ID", "Session ID"), value: paidSession.id, mono: true },
              {
                label: "PaymentIntent",
                value:
                  typeof paidSession.payment_intent === "string"
                    ? paidSession.payment_intent
                    : paidSession.payment_intent?.id ?? "—",
                mono: true,
              },
              {
                label: pick(lang, "금액", "Amount"),
                value:
                  paidSession.amount_total != null
                    ? `$${(paidSession.amount_total / 100).toFixed(2)} ${(paidSession.currency ?? "usd").toUpperCase()}`
                    : "—",
              },
              {
                label: pick(lang, "결제 이메일", "Paid by"),
                value: paidSession.customer_details?.email ?? "—",
              },
              {
                label: pick(lang, "결제 시각", "Paid at"),
                value: `${fmtDate(paidSession.created)} KST`,
              },
              { label: pick(lang, "상태", "Status"), value: paidSession.payment_status },
            ]}
          />
        )}
        {pending && !verifyError && (
          <p className="sub" style={{ marginTop: 24 }}>
            {pick(lang, "결제가 아직 완료되지 않았습니다.", "Payment not completed yet.")}
          </p>
        )}
        {verifyError && (
          <p className="sub" style={{ marginTop: 24, color: "#dc2626" }}>
            {pick(lang, "결제 확인 중 오류: ", "Error verifying payment: ")}
            {verifyError}
          </p>
        )}
        {searchParams.canceled && (
          <p className="sub" style={{ marginTop: 24 }}>
            {pick(lang, "결제가 취소되었습니다.", "Payment canceled.")}
          </p>
        )}

        {!paidSession && (
          <div className="panel" style={{ marginTop: 24, maxWidth: 420 }}>
            <strong>{pick(lang, AP2_PRODUCT.titleKo, AP2_PRODUCT.titleEn)}</strong>
            <p className="sub" style={{ marginTop: 4 }}>
              {pick(lang, AP2_PRODUCT.descriptionKo, AP2_PRODUCT.descriptionEn)}
            </p>
            <p style={{ marginTop: 8, fontSize: 20, fontWeight: 600 }}>
              ${(AP2_PRODUCT.amountCents / 100).toFixed(2)}
            </p>
            <form action="/api/ap2/checkout" method="POST">
              <button type="submit">{pick(lang, "구매 (에이전트 대신 결제)", "Buy (pay on the agent's behalf)")}</button>
            </form>
            <p className="sub" style={{ marginTop: 12, fontSize: 13 }}>
              {pick(
                lang,
                "테스트 카드: 4242 4242 4242 4242, 임의의 미래 만료일 / CVC / 우편번호.",
                "Test card: 4242 4242 4242 4242, any future expiry / CVC / ZIP."
              )}
            </p>
          </div>
        )}

        <TechNotes cards={[AP2_CARD]} lang={lang} />
      </main>
    </>
  );
}
