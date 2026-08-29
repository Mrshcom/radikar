import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requirePermission } from "../auth/routes";
import { BillingError, BillingService } from "./service";

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const adminListSchema = pageSchema.extend({ search: z.string().max(100).default("") });
const createOrderSchema = z.object({ planId: z.string().min(1).max(64) });
const callbackSchema = z.object({
  Authority: z.string().min(1),
  Status: z.string().min(1),
});
const userParamsSchema = z.object({ id: z.uuid() });
const grantPlanSchema = z.object({ planId: z.string().min(1).max(64) });
const extendSchema = z.object({ days: z.number().int().min(1).max(3650) });
const adjustCreditSchema = z.object({
  resource: z.enum(["resume", "pdf", "ai", "match", "interview"]),
  units: z.number().int().min(-100_000).max(100_000).refine((value) => value !== 0),
  reason: z.string().trim().max(500).optional(),
});
const cancelSchema = z.object({ reason: z.string().trim().max(500).optional() });

export function registerBillingRoutes(app: FastifyInstance, billing: BillingService) {
  app.get("/api/billing/plans", () => billing.listPlans());

  app.get("/api/billing/membership", (request) =>
    billing.getMembership(request.auth!.user.id),
  );

  app.get("/api/billing/orders", (request) => {
    const query = pageSchema.parse(request.query);
    return billing.listUserOrders(request.auth!.user.id, query.page, query.pageSize);
  });

  app.post("/api/billing/orders", async (request, reply) => {
    const input = createOrderSchema.parse(request.body);
    const result = await billing.createOrder(
      request.auth!.user.id,
      request.auth!.user.phone,
      input.planId,
    );
    return reply.code(201).send(result);
  });

  app.post("/api/billing/usage/pdf", async (request, reply) => {
    await billing.consumeUsage(
      request.auth!.user.id,
      { pdf: 1 },
      "resume_pdf_export",
      request.id,
    );
    return reply.code(204).send();
  });

  app.get("/api/billing/callback", async (request, reply) => {
    const query = callbackSchema.parse(request.query);
    const redirectUrl = await billing.handleCallback(query.Authority, query.Status);
    return reply.redirect(redirectUrl);
  });

  app.get("/api/admin/orders", (request, reply) => {
    if (!requirePermission(request, reply, "orders:read:any")) return;
    const query = adminListSchema.parse(request.query);
    return billing.listAdminOrders(query.search, query.page, query.pageSize);
  });

  app.get("/api/admin/billing-stats", (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    return billing.getBillingStats();
  });

  app.get("/api/admin/payments", (request, reply) => {
    if (!requirePermission(request, reply, "payments:read:any")) return;
    const query = pageSchema.parse(request.query);
    return billing.listAdminPayments(query.page, query.pageSize);
  });

  app.get("/api/admin/memberships", (request, reply) => {
    if (!requirePermission(request, reply, "memberships:manage:any")) return;
    const query = adminListSchema.parse(request.query);
    return billing.listMembershipUsers(query.search, query.page, query.pageSize);
  });

  app.get<{ Params: { id: string } }>(
    "/api/admin/users/:id/membership",
    (request, reply) => {
      if (!requirePermission(request, reply, "memberships:manage:any")) return;
      return billing.getAdminMembership(userParamsSchema.parse(request.params).id);
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/users/:id/membership/grant",
    (request, reply) => {
      if (!requirePermission(request, reply, "memberships:manage:any")) return;
      const userId = userParamsSchema.parse(request.params).id;
      const input = grantPlanSchema.parse(request.body);
      return billing.adminGrantPlan(userId, input.planId, request.auth!.user.id);
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/users/:id/membership/extend",
    (request, reply) => {
      if (!requirePermission(request, reply, "memberships:manage:any")) return;
      const userId = userParamsSchema.parse(request.params).id;
      const input = extendSchema.parse(request.body);
      return billing.adminExtendMembership(userId, input.days, request.auth!.user.id);
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/users/:id/membership/credits",
    (request, reply) => {
      if (!requirePermission(request, reply, "memberships:manage:any")) return;
      const userId = userParamsSchema.parse(request.params).id;
      const input = adjustCreditSchema.parse(request.body);
      return billing.adminAdjustCredit(
        userId,
        input.resource,
        input.units,
        request.auth!.user.id,
        input.reason,
      );
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/users/:id/membership/cancel",
    (request, reply) => {
      if (!requirePermission(request, reply, "memberships:manage:any")) return;
      const userId = userParamsSchema.parse(request.params).id;
      const input = cancelSchema.parse(request.body ?? {});
      return billing.adminCancelMembership(
        userId,
        request.auth!.user.id,
        input.reason,
      );
    },
  );
}

export function handleBillingError(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!(error instanceof BillingError)) return false;
  reply.code(error.statusCode).send({ error: error.message, requestId: request.id });
  return true;
}
