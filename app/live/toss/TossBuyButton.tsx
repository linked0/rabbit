"use client";

import Script from "next/script";
import { useState } from "react";

// Toss Payments 결제창 SDK — 공식 script 태그 로드 방식 (npm 패키지 버전 어긋남 위험 회피).
// window.TossPayments(clientKey).requestPayment(...) 로 호스팅된 결제창으로 리다이렉트.
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
    };
  }
}

export default function TossBuyButton({
  clientKey,
  amount,
  orderName,
  buyLabel,
  errorLabel,
}: {
  clientKey: string;
  amount: number;
  orderName: string;
  buyLabel: string;
  errorLabel: string;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setError(null);
    if (!clientKey || !window.TossPayments) {
      setError(errorLabel);
      return;
    }
    const orderId = crypto.randomUUID();
    try {
      await window.TossPayments(clientKey).requestPayment("카드", {
        amount,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/live/toss`,
        failUrl: `${window.location.origin}/live/toss`,
      });
    } catch (e) {
      // 사용자가 결제창을 닫는 경우도 여기로 온다 — 에러로 취급하지 않는다.
      if (e instanceof Error && e.message) setError(e.message);
    }
  }

  return (
    <>
      <Script src="https://js.tosspayments.com/v1/payment" onLoad={() => setReady(true)} />
      <button type="button" onClick={buy} disabled={!ready}>
        {buyLabel}
      </button>
      {error && (
        <p className="sub" style={{ marginTop: 8, color: "#dc2626" }}>
          {error}
        </p>
      )}
    </>
  );
}
