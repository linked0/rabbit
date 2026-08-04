// 서버 전용 Toss Payments 결제승인 호출 — §7 (test mode). 키: docs/tasks/current-plan.md §1.
export type TossPaymentSummary = {
  status: string;
  paymentKey: string;
  orderId: string;
  totalAmount: number;
  method: string | null; // Toss가 한국어로 반환 — 예: "카드"
  approvedAt: string | null; // ISO 8601 (+09:00 오프셋 포함)
  receiptUrl: string | null; // Toss가 발급하는 공식 영수증 페이지
};

type ConfirmResult = ({ ok: true } & TossPaymentSummary) | { ok: false; error: string };

export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<ConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) return { ok: false, error: "TOSS_SECRET_KEY is not set" };

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
    cache: "no-store",
  });

  const body = await res.json();
  // Toss가 서버에 기록된 실제 승인 금액과 다르면 confirm 자체가 실패한다 — 클라이언트가
  // 리다이렉트 URL의 amount를 조작해도 여기서 걸러진다(별도 DB 대조 불필요).
  if (!res.ok) return { ok: false, error: body?.message ?? `HTTP ${res.status}` };
  return {
    ok: true,
    status: body?.status ?? "DONE",
    paymentKey: body?.paymentKey ?? paymentKey,
    orderId: body?.orderId ?? orderId,
    totalAmount: body?.totalAmount ?? amount,
    method: body?.method ?? null,
    approvedAt: body?.approvedAt ?? null,
    receiptUrl: body?.receipt?.url ?? null,
  };
}
