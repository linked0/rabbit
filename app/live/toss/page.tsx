import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import TechNotesLink from "../../TechNotesLink";
import PaymentReceipt from "../../PaymentReceipt";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { confirmTossPayment, type TossPaymentSummary } from "@/lib/toss";
import { TOSS_PRODUCT } from "@/lib/toss-data";
import { POC_CARDS } from "@/lib/poc-cards";
import TossBuyButton from "./TossBuyButton";

const TOSS_CARD = POC_CARDS.find((c) => c.key === "toss-payments")!;

// Toss Payments §7 — AP2(§2)의 KRW 버전. 설계: docs/features/toss-payments.md.
// successUrl이 이 페이지 자신이라 결제 성공 시 paymentKey/orderId/amount 쿼리로 돌아온다 —
// 여기서 서버가 Toss 결제승인 API로 검증 후에만 데이터를 공개한다(클라이언트 신호를 믿지 않음).
export default async function TossPage({
  searchParams,
}: {
  searchParams: { paymentKey?: string; orderId?: string; amount?: string; code?: string };
}) {
  const lang = getLang();
  let payment: TossPaymentSummary | null = null;
  let confirmError: string | null = null;

  if (searchParams.paymentKey && searchParams.orderId && searchParams.amount) {
    const result = await confirmTossPayment(
      searchParams.paymentKey,
      searchParams.orderId,
      Number(searchParams.amount)
    );
    if (result.ok) payment = result;
    else confirmError = result.error;
  } else if (searchParams.code) {
    // 결제 실패/취소 시 Toss가 failUrl로 code/message 쿼리를 붙여 돌려보낸다.
    confirmError = searchParams.code;
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === "ko" ? "ko-KR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Seoul",
    });

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/live" ko="라이브" en="Live" />
        <h1>{pick(lang, "Toss Payments — KRW 정산 데모", "Toss Payments — KRW Settlement Demo")}</h1>
        <p className="sub">
          {pick(
            lang,
            "에이전트가 데이터를 사고 Toss Payments(test mode)로 정산하는 교육용 예시 — AP2/Stripe의 국내 버전. 실제 결제는 발생하지 않습니다.",
            "An educational example: an agent buys data and settles via Toss Payments (test mode) — the KRW counterpart to AP2/Stripe. No real charges occur."
          )}
        </p>
        <TechNotesLink lang={lang} />

        {payment && (
          <PaymentReceipt
            lang={lang}
            verifiedVia={pick(lang, "Toss 결제승인(confirm) API", "Toss payment-confirm API")}
            content={pick(lang, TOSS_PRODUCT.contentKo, TOSS_PRODUCT.contentEn)}
            receiptUrl={payment.receiptUrl}
            rows={[
              { label: pick(lang, "주문 번호", "Order ID"), value: payment.orderId, mono: true },
              { label: "paymentKey", value: payment.paymentKey, mono: true },
              {
                label: pick(lang, "결제 수단", "Method"),
                value: payment.method ?? "—",
              },
              {
                label: pick(lang, "금액", "Amount"),
                value: pick(
                  lang,
                  `${payment.totalAmount.toLocaleString()}원 (KRW)`,
                  `₩${payment.totalAmount.toLocaleString()} KRW`
                ),
              },
              {
                label: pick(lang, "승인 시각", "Approved at"),
                value: payment.approvedAt ? `${fmtDate(payment.approvedAt)} KST` : "—",
              },
              { label: pick(lang, "상태", "Status"), value: payment.status },
            ]}
          />
        )}
        {confirmError && (
          <p className="sub" style={{ marginTop: 24, color: "#dc2626" }}>
            {pick(lang, "결제 확인 실패: ", "Payment verification failed: ")}
            {confirmError}
          </p>
        )}

        {!payment && (
          <div className="panel" style={{ marginTop: 24, maxWidth: 420 }}>
            <strong>{pick(lang, TOSS_PRODUCT.titleKo, TOSS_PRODUCT.titleEn)}</strong>
            <p className="sub" style={{ marginTop: 4 }}>
              {pick(lang, TOSS_PRODUCT.descriptionKo, TOSS_PRODUCT.descriptionEn)}
            </p>
            <p style={{ marginTop: 8, fontSize: 20, fontWeight: 600 }}>
              {pick(lang, `${TOSS_PRODUCT.amountKrw.toLocaleString()}원`, `₩${TOSS_PRODUCT.amountKrw.toLocaleString()}`)}
            </p>
            <TossBuyButton
              clientKey={process.env.TOSS_CLIENT_KEY ?? process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ""}
              amount={TOSS_PRODUCT.amountKrw}
              orderName={pick(lang, TOSS_PRODUCT.titleKo, TOSS_PRODUCT.titleEn)}
              buyLabel={pick(lang, "구매 (에이전트 대신 결제)", "Buy (pay on the agent's behalf)")}
              errorLabel={pick(lang, "결제 위젯 로딩 중 — 잠시 후 다시 시도하세요.", "Payment widget still loading — try again shortly.")}
            />
            <p className="sub" style={{ marginTop: 12, fontSize: 13 }}>
              {pick(
                lang,
                "테스트 카드: 4330 1234 5678 5678, 임의의 유효기간, 비밀번호 앞 2자리 00, 생년월일/사업자번호 임의.",
                "Test card: 4330 1234 5678 5678, any expiry, any 2-digit password prefix, any birth date."
              )}
            </p>
          </div>
        )}

        <TechNotes cards={[TOSS_CARD]} lang={lang} />
      </main>
    </>
  );
}
