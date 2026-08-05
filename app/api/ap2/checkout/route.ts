import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { AP2_PRODUCT } from "@/lib/ap2-data";

export const dynamic = "force-dynamic";

// POST /api/ap2/checkout — AP2 §2 목업 결제 세션 생성.
// 일반 <form method="POST"> 제출을 받아 Stripe Checkout으로 303 리다이렉트 (클라이언트 JS 불필요).
export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: AP2_PRODUCT.currency,
          unit_amount: AP2_PRODUCT.amountCents,
          product_data: {
            name: AP2_PRODUCT.titleEn,
            description: AP2_PRODUCT.descriptionEn,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/poc/ap2?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/poc/ap2?canceled=1`,
  });
  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 502 });
  }
  return NextResponse.redirect(session.url, 303);
}
