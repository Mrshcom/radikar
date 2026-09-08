-- Backfill model usage costs that were recorded before provider pricing was wired.
-- Prices are USD per million tokens, so the resulting value is USD micros.
UPDATE "model_usage_events"
SET "estimated_cost_micros" = round(
  CASE "model"
    WHEN 'gapgpt-qwen-3.6' THEN "input_tokens" * 0.25 + "output_tokens" * 2
    WHEN 'gapgpt-qwen-3.6-thinking' THEN "input_tokens" * 0.25 + "output_tokens" * 2
    WHEN 'gapgpt-qwen-3.8' THEN "input_tokens" * 0.25 + "output_tokens" * 2
    WHEN 'gpt-5.6-sol' THEN "input_tokens" * 2.5 + "output_tokens" * 15
    WHEN 'gpt-5.6-luna' THEN "input_tokens" * 0.2 + "output_tokens" * 1.2
    WHEN 'gpt-5.6-terra' THEN "input_tokens" * 2 + "output_tokens" * 12
    WHEN 'gpt-5.5' THEN "input_tokens" * 5 + "output_tokens" * 30
    WHEN 'gpt-5.4' THEN "input_tokens" * 2.5 + "output_tokens" * 15
    WHEN 'gpt-5.2-pro' THEN "input_tokens" * 21 + "output_tokens" * 126
    WHEN 'gpt-5.3-codex-spark' THEN "input_tokens" * 1.75 + "output_tokens" * 14
    WHEN 'claude-fable-5' THEN "input_tokens" * 10 + "output_tokens" * 50
    WHEN 'claude-sonnet-5' THEN "input_tokens" * 2 + "output_tokens" * 10
    WHEN 'claude-opus-5' THEN "input_tokens" * 5 + "output_tokens" * 25
    WHEN 'gemini-3.1-pro-preview' THEN "input_tokens" * 2 + "output_tokens" * 12
    WHEN 'gemini-3.5-flash' THEN "input_tokens" * 1.5 + "output_tokens" * 9
    WHEN 'gemini-3.1-flash-lite' THEN "input_tokens" * 0.25 + "output_tokens" * 1.5
    WHEN 'gemini-3.1-flash-lite-preview' THEN "input_tokens" * 0.25 + "output_tokens" * 1.5
    WHEN 'gemini-3-flash-preview' THEN "input_tokens" * 0.5 + "output_tokens" * 3
    WHEN 'grok-4.3' THEN "input_tokens" * 1.25 + "output_tokens" * 2.5
    WHEN 'grok-4' THEN "input_tokens" * 3 + "output_tokens" * 15
    ELSE "estimated_cost_micros"
  END
)
WHERE "provider" = 'gapgpt';
