import { Fragment } from "react";
import { pick } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export type ReceiptRow = { label: string; value: string; mono?: boolean };

// 결제 성공 후 보여주는 구조화된 영수증 패널 — AP2(Stripe)·Toss 데모 공용 (jay, 2026-08-04).
// "결제 확인됨" 한 줄 대신, 서버 검증을 통과한 실제 결제 메타데이터를 표 형태로 보여준다.
export default function PaymentReceipt({
  lang,
  rows,
  verifiedVia,
  content,
  receiptUrl,
}: {
  lang: Lang;
  rows: ReceiptRow[];
  verifiedVia: string; // 검증에 쓰인 API 이름 — 예: "Stripe Checkout Session API"
  content: string; // 결제 후 공개되는 구매 콘텐츠
  receiptUrl?: string | null; // 결제사가 발급한 공식 영수증 URL (Toss만 제공)
}) {
  return (
    <div className="panel" style={{ marginTop: 24, borderColor: "#16a34a" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <strong>{pick(lang, "결제 확인됨", "Payment verified")}</strong>
        <span className="poc-badge poc-badge-live">{pick(lang, "승인 완료", "Approved")}</span>
      </div>

      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gap: "8px 20px",
          margin: "14px 0 0",
          fontSize: 14,
        }}
      >
        {rows.map((r) => (
          <Fragment key={r.label}>
            <dt className="muted">{r.label}</dt>
            <dd
              style={{
                margin: 0,
                wordBreak: "break-all",
                fontFamily: r.mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
                fontSize: r.mono ? 13 : undefined,
              }}
            >
              {r.value}
            </dd>
          </Fragment>
        ))}
      </dl>

      <p className="sub" style={{ marginTop: 12, fontSize: 13 }}>
        ✓{" "}
        {pick(
          lang,
          `서버가 ${verifiedVia}로 직접 재검증한 결과입니다 — 클라이언트 리다이렉트만으로는 신뢰하지 않습니다.`,
          `Re-verified server-side via the ${verifiedVia} — the client redirect alone is never trusted.`
        )}
      </p>

      <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--muted-surface)", borderRadius: 8 }}>
        <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {pick(lang, "구매한 데이터", "Purchased data")}
        </div>
        <p style={{ margin: "6px 0 0" }}>{content}</p>
      </div>

      {receiptUrl && (
        <p style={{ marginTop: 12, fontSize: 14 }}>
          <a href={receiptUrl} target="_blank" rel="noreferrer">
            {pick(lang, "공식 영수증 보기", "View official receipt")} ↗
          </a>
        </p>
      )}
    </div>
  );
}
