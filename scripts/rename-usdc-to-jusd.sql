-- jUSD replaces MockUSDC as the ecosystem stablecoin (jay, 2026-09-15).
--
-- Rabbit applies its schema with `prisma db push`, which has no rename step:
-- pushing the renamed schema would DROP the old columns and ADD empty new ones,
-- silently zeroing every live mandate's cap/drawn and every tick's spend. Run
-- this first and the subsequent `db push` becomes a no-op.
--
--   psql "$DATABASE_URL" -f scripts/rename-usdc-to-jusd.sql
--
-- Idempotent: re-running it after a successful run does nothing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'Mandate' AND column_name = 'capUsdc') THEN
    ALTER TABLE "Mandate" RENAME COLUMN "capUsdc" TO "capJusd";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'Mandate' AND column_name = 'drawnUsdc') THEN
    ALTER TABLE "Mandate" RENAME COLUMN "drawnUsdc" TO "drawnJusd";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'AgentTick' AND column_name = 'spentUsdc') THEN
    ALTER TABLE "AgentTick" RENAME COLUMN "spentUsdc" TO "spentJusd";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'AgentTick' AND column_name = 'budgetLeftUsdc') THEN
    ALTER TABLE "AgentTick" RENAME COLUMN "budgetLeftUsdc" TO "budgetLeftJusd";
  END IF;
END $$;
