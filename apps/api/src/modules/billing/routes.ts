import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requirePermission } from "../auth/routes";
import { BillingError, BillingService } from "./service";
import { CreditPackError, interviewPack } from "./credit-pack";
import { RadicoinPackError, radicoinPacks } from "./radicoin-pack";
import { renderOfficialInvoicePdf } from "./invoice-pdf";

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});
const optionalQueryValue = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const adminListSchema = pageSchema.extend({
  search: z.string().max(100).default(""),
  sortBy: optionalQueryValue(z.string().max(40)),
  sortDirection: optionalQueryValue(z.enum(["asc", "desc"])),
});
const orderListSchema = adminListSchema.extend({
  status: optionalQueryValue(z.enum(["pending", "paid", "failed", "canceled", "refunded"])),
  planId: optionalQueryValue(z.string().max(64)),
});
const paymentListSchema = adminListSchema.extend({
  status: optionalQueryValue(z.enum(["initiated", "verified", "failed", "canceled", "refunded"])),
});
const membershipListSchema = adminListSchema.extend({
  accountType: optionalQueryValue(z.enum(["candidate", "employer"])),
  planId: optionalQueryValue(z.string().max(64)),
  membershipStatus: optionalQueryValue(z.enum(["active", "expired", "canceled"])),
  userStatus: optionalQueryValue(z.enum(["active", "suspended"])),
});
const createOrderSchema = z.object({
  planId: z.string().min(1).max(64),
  paymentMethod: z.enum(["gateway", "radicoin"]).default("gateway"),
  idempotencyKey: z.uuid().optional(),
});
const createCreditPackOrderSchema = z.object({
  packId: z.literal(interviewPack.id),
  paymentMethod: z.enum(["gateway", "radicoin"]),
  idempotencyKey: z.uuid(),
});
const createRadicoinPackOrderSchema = z.object({
  packId: z.enum(radicoinPacks.map((pack) => pack.id) as [string, ...string[]]),
  idempotencyKey: z.uuid(),
});
const redeemWithRadicoinSchema = createOrderSchema.extend({ idempotencyKey: z.uuid() });
const callbackSchema = z.union([
  z.object({ Authority: z.string().min(1), Status: z.string().min(1) }),
  z.object({ transaction_id: z.uuid(), status: z.string().min(1) }),
]);

function callbackIdentity(query: z.infer<typeof callbackSchema>) {
  return "Authority" in query
    ? { authority: query.Authority, status: query.Status }
    : { authority: query.transaction_id, status: query.status };
}
const userParamsSchema = z.object({ id: z.uuid() });
const grantPlanSchema = z.object({
  planId: z.string().min(1).max(64),
  mode: z.enum(["add", "replace"]).default("add"),
});
const extendSchema = z.object({ days: z.number().int().min(1).max(3650) });
const adjustCreditSchema = z.object({
  resource: z.enum(["resume", "pdf", "ai", "match", "interview"]),
  units: z
    .number()
    .int()
    .min(-100_000)
    .max(100_000)
    .refine((value) => value !== 0),
  reason: z.string().trim().max(500).optional(),
});
const cancelSchema = z.object({ reason: z.string().trim().max(500).optional() });
const modelUsageStatsSchema = pageSchema.extend({
  days: z.coerce.number().int().min(1).max(365).default(30),
  provider: optionalQueryValue(z.enum(["freeDeepseekAPI", "gapgpt"])),
  sortBy: optionalQueryValue(z.string().max(40)),
  sortDirection: optionalQueryValue(z.enum(["asc", "desc"])),
});

function requireCustomer(request: FastifyRequest, reply: FastifyReply) {
  if (request.auth?.user.role === "user") return true;
  reply.code(403).send({
    error: "حساب‌های مدیریتی امکان خرید یا مصرف بسته ندارند.",
    requestId: request.id,
  });
  return false;
}

export function registerBillingRoutes(app: FastifyInstance, billing: BillingService) {
  app.get("/api/billing/plans", (request) =>
    billing.listPlans(request.auth?.user.role === "user" ? request.auth.user.accountType : undefined),
  );

  app.get("/api/billing/credit-packs", (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    return billing.creditPacks.catalog();
  });

  app.get("/api/billing/radicoin-packs", (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    return billing.radicoinPacks.catalog();
  });

  app.post("/api/billing/radicoin-packs/orders", async (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    const input = createRadicoinPackOrderSchema.parse(request.body);
    const result = await billing.radicoinPacks.createOrder(
      request.auth!.user.id,
      request.auth!.user.phone,
      input.packId,
      input.idempotencyKey,
    );
    return reply.code(201).send(result);
  });

  app.get("/api/billing/radicoin-packs/orders", (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    return billing.radicoinPacks.listOrders(request.auth!.user.id);
  });

  app.get("/api/billing/radicoin-packs/callback", async (request, reply) => {
    const { authority } = callbackIdentity(callbackSchema.parse(request.query));
    return reply.redirect(await billing.radicoinPacks.handleCallback(authority));
  });

  app.post("/api/billing/credit-packs/orders", async (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    const input = createCreditPackOrderSchema.parse(request.body);
    const result = await billing.creditPacks.createOrder(
      request.auth!.user.id,
      request.auth!.user.phone,
      input.paymentMethod,
      input.idempotencyKey,
    );
    return reply.code(201).send(result);
  });

  app.get<{ Params: { id: string } }>("/api/billing/credit-packs/orders/:id", (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    return billing.creditPacks.getOrder(request.auth!.user.id, id);
  });

  app.get("/api/billing/credit-packs/callback", async (request, reply) => {
    const { authority } = callbackIdentity(callbackSchema.parse(request.query));
    return reply.redirect(await billing.creditPacks.handleCallback(authority));
  });

  app.get("/api/billing/membership", (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    return billing.getMembership(request.auth!.user.id);
  });

  app.get("/api/billing/orders", (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    const query = orderListSchema.omit({ planId: true }).parse(request.query);
    return query.sortBy || query.sortDirection
      ? billing.listUserOrders(
          request.auth!.user.id,
          query.page,
          query.pageSize,
          query.search,
          query.status,
          query.sortBy,
          query.sortDirection,
        )
      : billing.listUserOrders(request.auth!.user.id, query.page, query.pageSize, query.search, query.status);
  });

  app.get<{ Params: { id: string } }>("/api/billing/orders/:id/invoice", async (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const invoice = await billing.getUserInvoice(request.auth!.user.id, id);
    const buyerName =
      (invoice.buyer.accountType === "employer" ? invoice.buyer.companyName : invoice.buyer.fullName) ??
      (invoice.buyer.accountType === "employer" ? "کارفرمای رادیکار" : "کاربر رادیکار");
    const pdf = await renderOfficialInvoicePdf({ buyerName, buyerPhone: invoice.buyer.phone, order: invoice.order, plan: invoice.plan });
    return reply
      .header("content-disposition", `attachment; filename=invoice-${invoice.order.orderNumber}.pdf`)
      .type("application/pdf")
      .send(pdf);
  });

  app.post("/api/billing/orders", async (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    const input = createOrderSchema.parse(request.body);
    const result = await billing.createOrder(
      request.auth!.user.id,
      request.auth!.user.phone,
      input.planId,
      input.paymentMethod,
      input.idempotencyKey,
    );
    return reply.code(201).send(result);
  });

  app.post("/api/billing/radicoin/redeem", async (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    const input = redeemWithRadicoinSchema.parse(request.body);
    return reply
      .code(201)
      .send(await billing.redeemPlanWithRadicoins(request.auth!.user.id, input.planId, input.idempotencyKey));
  });

  app.post("/api/billing/usage/pdf", async (request, reply) => {
    if (!requireCustomer(request, reply)) return;
    await billing.consumeUsage(request.auth!.user.id, { pdf: 1 }, "resume_pdf_export", request.id);
    return reply.code(204).send();
  });

  app.get("/api/billing/callback", async (request, reply) => {
    const { authority, status } = callbackIdentity(callbackSchema.parse(request.query));
    const redirectUrl = await billing.handleCallback(authority, status);
    return reply.redirect(redirectUrl);
  });

  app.get("/api/admin/orders", (request, reply) => {
    if (!requirePermission(request, reply, "orders:read:any")) return;
    const query = orderListSchema.parse(request.query);
    return query.sortBy || query.sortDirection
      ? billing.listAdminOrders(
          query.search,
          query.page,
          query.pageSize,
          query.status,
          query.planId,
          query.sortBy,
          query.sortDirection,
        )
      : billing.listAdminOrders(query.search, query.page, query.pageSize, query.status, query.planId);
  });

  app.get("/api/admin/billing-stats", (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    return billing.getBillingStats();
  });

  app.get("/api/admin/model-usage", (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const query = modelUsageStatsSchema.parse(request.query);
    return query.sortBy || query.sortDirection
      ? billing.getModelUsageStats(
          query.days,
          query.page,
          query.pageSize,
          query.provider,
          query.sortBy,
          query.sortDirection,
        )
      : billing.getModelUsageStats(query.days, query.page, query.pageSize, query.provider);
  });

  app.get("/api/admin/payments", (request, reply) => {
    if (!requirePermission(request, reply, "payments:read:any")) return;
    const query = paymentListSchema.parse(request.query);
    return query.sortBy || query.sortDirection
      ? billing.listAdminPayments(
          query.page,
          query.pageSize,
          query.search,
          query.status,
          query.sortBy,
          query.sortDirection,
        )
      : billing.listAdminPayments(query.page, query.pageSize, query.search, query.status);
  });

  app.get("/api/admin/memberships", (request, reply) => {
    if (!requirePermission(request, reply, "memberships:manage:any")) return;
    const query = membershipListSchema.parse(request.query);
    return query.sortBy || query.sortDirection || query.accountType
      ? billing.listMembershipUsers(
          query.search,
          query.page,
          query.pageSize,
          query.planId,
          query.membershipStatus,
          query.userStatus,
          query.sortBy,
          query.sortDirection,
          query.accountType,
        )
      : billing.listMembershipUsers(
          query.search,
          query.page,
          query.pageSize,
          query.planId,
          query.membershipStatus,
          query.userStatus,
        );
  });

  app.get<{ Params: { id: string } }>("/api/admin/users/:id/membership", (request, reply) => {
    if (!requirePermission(request, reply, "memberships:manage:any")) return;
    return billing.getAdminMembership(userParamsSchema.parse(request.params).id);
  });

  app.post<{ Params: { id: string } }>("/api/admin/users/:id/membership/grant", (request, reply) => {
    if (!requirePermission(request, reply, "memberships:manage:any")) return;
    const userId = userParamsSchema.parse(request.params).id;
    const input = grantPlanSchema.parse(request.body);
    return input.mode === "replace"
      ? billing.adminReplacePlan(userId, input.planId, request.auth!.user.id)
      : billing.adminGrantPlan(userId, input.planId, request.auth!.user.id);
  });

  app.post<{ Params: { id: string } }>("/api/admin/users/:id/membership/extend", (request, reply) => {
    if (!requirePermission(request, reply, "memberships:manage:any")) return;
    const userId = userParamsSchema.parse(request.params).id;
    const input = extendSchema.parse(request.body);
    return billing.adminExtendMembership(userId, input.days, request.auth!.user.id);
  });

  app.post<{ Params: { id: string } }>("/api/admin/users/:id/membership/credits", (request, reply) => {
    if (!requirePermission(request, reply, "memberships:manage:any")) return;
    const userId = userParamsSchema.parse(request.params).id;
    const input = adjustCreditSchema.parse(request.body);
    return billing.adminAdjustCredit(userId, input.resource, input.units, request.auth!.user.id, input.reason);
  });

  app.post<{ Params: { id: string } }>("/api/admin/users/:id/membership/cancel", (request, reply) => {
    if (!requirePermission(request, reply, "memberships:manage:any")) return;
    const userId = userParamsSchema.parse(request.params).id;
    const input = cancelSchema.parse(request.body ?? {});
    return billing.adminCancelMembership(userId, request.auth!.user.id, input.reason);
  });
}

export function handleBillingError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (!(error instanceof BillingError || error instanceof CreditPackError || error instanceof RadicoinPackError))
    return false;
  reply.code(error.statusCode).send({ error: error.message, requestId: request.id });
  return true;
}
