-- Reservations created before pending_coins was enforced are reconciled from
-- their immutable pending ledger rows. This migration is safe to rerun.
UPDATE "radicoin_wallets" AS wallet
SET "pending_coins" = COALESCE(
  (
    SELECT SUM(ABS(transaction."amount"))::integer
    FROM "radicoin_transactions" AS transaction
    WHERE transaction."user_id" = wallet."user_id"
      AND transaction."source" = 'redemption'
      AND transaction."status" = 'pending'
  ),
  0
);
