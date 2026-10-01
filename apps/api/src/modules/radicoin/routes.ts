import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requirePermission } from "../auth/routes";
import { RadicoinError, RadicoinService } from "./service";

const historySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) });
const pageSchema = z.object({ search: z.string().max(100).default(""), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(20) });
const settingsSchema = z.object({
  dailyLoginCoins: z.number().int().min(0).max(10_000), dailyActivityCoinCap: z.number().int().min(0).max(100_000), activityCoins: z.number().int().min(0).max(10_000),
  referrerSignupCoins: z.number().int().min(0).max(100_000), referredSignupCoins: z.number().int().min(0).max(100_000), referrerActivationCoins: z.number().int().min(0).max(100_000), referredActivationCoins: z.number().int().min(0).max(100_000), referrerUpgradeCoins: z.number().int().min(0).max(100_000), purchaserCoins: z.number().int().min(0).max(100_000),
  planCosts: z.array(z.object({ id: z.string().min(1).max(64), radicoinCost: z.number().int().positive().max(10_000_000).nullable() })).max(50),
});
const idempotencySchema = z.object({ idempotencyKey: z.uuid() });
const grantSchema = idempotencySchema.extend({ amount: z.number().int().positive().max(1_000_000), description: z.string().trim().min(3).max(200), expiresAt: z.iso.datetime().optional() });
const adjustmentSchema = idempotencySchema.extend({ amount: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0), description: z.string().trim().min(3).max(200) });

function requireCustomer(request: FastifyRequest, reply: FastifyReply) {
  if (request.auth?.user.role === "user") return true;
  reply.code(403).send({ error: "حساب‌های مدیریتی کیف پول رادیکوین ندارند.", requestId: request.id });
  return false;
}

export function registerRadicoinRoutes(app: FastifyInstance, radicoin: RadicoinService) {
  app.get("/api/radicoin/wallet", async (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    const { limit } = historySchema.parse(request.query);
    return radicoin.getWallet(request.auth!.user.id, limit);
  });

  app.get("/api/admin/radicoin/wallets/:id", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    return radicoin.getWallet(id, 100);
  });
  app.get("/api/admin/radicoin/settings", async (request, reply) => { if (!requirePermission(request, reply, "reports:read:any")) return; return radicoin.getAdminSettings(); });
  app.patch("/api/admin/radicoin/settings", async (request, reply) => { if (!requirePermission(request, reply, "radicoin:manage:any")) return; const { planCosts, ...settings } = settingsSchema.parse(request.body); return radicoin.updateAdminSettings(settings, planCosts); });
  app.get("/api/admin/radicoin/wallets", async (request, reply) => { if (!requirePermission(request, reply, "reports:read:any")) return; const query = pageSchema.parse(request.query); return radicoin.listWallets(query.search, query.page, query.pageSize); });
  app.post("/api/admin/radicoin/wallets/:id/promotional", async (request, reply) => { if (!requirePermission(request, reply, "radicoin:manage:any")) return; const { id } = z.object({ id: z.uuid() }).parse(request.params); const input = grantSchema.parse(request.body); await radicoin.grantPromotional(id, input.amount, input.description, input.expiresAt ? new Date(input.expiresAt) : undefined, request.auth!.user.id, input.idempotencyKey); return reply.code(201).send(await radicoin.getWallet(id, 100)); });
  app.post("/api/admin/radicoin/wallets/:id/adjust", async (request, reply) => { if (!requirePermission(request, reply, "radicoin:manage:any")) return; const { id } = z.object({ id: z.uuid() }).parse(request.params); const input = adjustmentSchema.parse(request.body); await radicoin.adjust(id, input.amount, input.description, request.auth!.user.id, input.idempotencyKey); return reply.code(201).send(await radicoin.getWallet(id, 100)); });
}

export function handleRadicoinError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (!(error instanceof RadicoinError)) return false;
  reply.code(error.statusCode).send({ error: error.message, requestId: request.id });
  return true;
}
