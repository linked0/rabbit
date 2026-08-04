import Stripe from "stripe";

// 서버 전용 Stripe 클라이언트 — AP2 §2 (test mode). 키: docs/tasks/current-plan.md §1.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}
