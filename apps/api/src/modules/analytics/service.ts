import { randomUUID } from "node:crypto";
import { productEvents, type Database } from "@radikar/database";

export type ProductEventName =
  | "auth_otp_requested"
  | "auth_otp_delivery_result"
  | "auth_signup_completed"
  | "resume_saved"
  | "job_input_submitted"
  | "match_analysis_result"
  | "tailored_resume_created"
  | "application_changed"
  | "membership_checkout_result";
type SafeProperties = Record<string, string | number | boolean | null>;

const blockedPropertyKeys = /phone|email|resume|description|text|content|prompt|answer/i;
function sanitizeProperties(properties: SafeProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        (!blockedPropertyKeys.test(key) && ["string", "number", "boolean"].includes(typeof value)) || value === null,
    ),
  );
}

export class ProductEventService {
  constructor(private readonly database: Database) {}
  async record(name: ProductEventName, idempotencyKey: string, userId?: string, properties: SafeProperties = {}) {
    await this.database
      .insert(productEvents)
      .values({
        id: randomUUID(),
        name,
        userId: userId ?? null,
        idempotencyKey,
        properties: sanitizeProperties(properties),
        occurredAt: new Date(),
      })
      .onConflictDoNothing({ target: productEvents.idempotencyKey });
  }
}
