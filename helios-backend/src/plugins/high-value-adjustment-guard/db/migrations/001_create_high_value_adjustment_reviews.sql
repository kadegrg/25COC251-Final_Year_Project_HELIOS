-- ═══════════════════════════════════════════════════════════════════════
-- Plugin: high-value-adjustment-guard — Review log table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS plugin_high_value_adjustment_reviews (
  review_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id        UUID NOT NULL,
  site_id              STRING NULL,
  outcome              STRING NOT NULL CHECK (outcome IN ('ALLOWED','DENIED','FLAGGED')),
  reason               STRING NULL,
  reviewed_by_user_id  UUID NULL,
  request_id           STRING NULL,
  correlation_id       STRING NULL,
  details_json         JSONB NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plugin_hv_adj_reviews_adjustment
  ON plugin_high_value_adjustment_reviews (adjustment_id);

CREATE INDEX IF NOT EXISTS idx_plugin_hv_adj_reviews_outcome_created
  ON plugin_high_value_adjustment_reviews (outcome, created_at DESC);

