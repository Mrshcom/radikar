import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { supportMessages, supportTickets, users, type Database } from "@radikar/database";
import { z } from "zod";

const ticketParams = z.object({ id: z.uuid() });
const createTicketInput = z.object({
  subject: z.string().trim().min(5).max(160),
  category: z.enum(["technical", "account", "payment", "other"]),
  message: z.string().trim().min(10).max(10000),
});
const messageInput = z.object({ message: z.string().trim().min(2).max(10000) });
const listInput = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(["all", "open", "answered", "closed"]).default("all"),
  accountType: z.enum(["all", "candidate", "employer"]).default("all"),
});

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  const user = request.auth?.user;
  if (user?.role === "user") return user;
  reply.code(user ? 403 : 401).send({ error: "اجازه دسترسی به این بخش را نداری.", requestId: request.id });
  return null;
}

function requireSuperadmin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.auth?.user;
  if (user?.role === "superadmin") return user;
  reply.code(user ? 403 : 401).send({ error: "اجازه دسترسی به این بخش را نداری.", requestId: request.id });
  return null;
}

async function findTicket(database: Database, id: string, ownerUserId?: string) {
  const [ticket] = await database
    .select({
      id: supportTickets.id,
      ownerUserId: supportTickets.ownerUserId,
      accountType: supportTickets.accountType,
      subject: supportTickets.subject,
      category: supportTickets.category,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      ownerName: users.fullName,
      ownerEmail: users.email,
      ownerPhone: users.phone,
    })
    .from(supportTickets)
    .innerJoin(users, eq(users.id, supportTickets.ownerUserId))
    .where(and(eq(supportTickets.id, id), ownerUserId ? eq(supportTickets.ownerUserId, ownerUserId) : undefined))
    .limit(1);
  return ticket;
}

async function ticketDetail(database: Database, id: string, ownerUserId?: string) {
  const ticket = await findTicket(database, id, ownerUserId);
  if (!ticket) return null;
  const messages = await database
    .select({
      id: supportMessages.id,
      authorRole: supportMessages.authorRole,
      body: supportMessages.body,
      createdAt: supportMessages.createdAt,
    })
    .from(supportMessages)
    .where(eq(supportMessages.ticketId, id))
    .orderBy(asc(supportMessages.createdAt));
  return { ...ticket, messages };
}

export function registerSupportRoutes(app: FastifyInstance, database: Database) {
  app.get("/api/support/tickets", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) return;
    const tickets = await database.select().from(supportTickets)
      .where(eq(supportTickets.ownerUserId, user.id)).orderBy(desc(supportTickets.updatedAt));
    return { tickets };
  });

  app.post("/api/support/tickets", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) return;
    const input = createTicketInput.parse(request.body);
    const now = new Date();
    const id = randomUUID();
    await database.transaction(async (tx) => {
      await tx.insert(supportTickets).values({ id, ownerUserId: user.id, accountType: user.accountType,
        subject: input.subject, category: input.category, status: "open", createdAt: now, updatedAt: now });
      await tx.insert(supportMessages).values({ id: randomUUID(), ticketId: id, authorUserId: user.id,
        authorRole: "user", body: input.message, createdAt: now });
    });
    return reply.code(201).send({ ticket: await ticketDetail(database, id, user.id) });
  });

  app.get("/api/support/tickets/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) return;
    const { id } = ticketParams.parse(request.params);
    const ticket = await ticketDetail(database, id, user.id);
    if (!ticket) return reply.code(404).send({ error: "تیکت پیدا نشد.", requestId: request.id });
    return { ticket };
  });

  app.post("/api/support/tickets/:id/messages", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) return;
    const { id } = ticketParams.parse(request.params);
    const { message } = messageInput.parse(request.body);
    const ticket = await findTicket(database, id, user.id);
    if (!ticket) return reply.code(404).send({ error: "تیکت پیدا نشد.", requestId: request.id });
    if (ticket.status === "closed") return reply.code(409).send({ error: "این تیکت بسته شده است.", requestId: request.id });
    const now = new Date();
    await database.transaction(async (tx) => {
      await tx.insert(supportMessages).values({ id: randomUUID(), ticketId: id, authorUserId: user.id,
        authorRole: "user", body: message, createdAt: now });
      await tx.update(supportTickets).set({ status: "open", updatedAt: now }).where(eq(supportTickets.id, id));
    });
    return { ticket: await ticketDetail(database, id, user.id) };
  });

  app.get("/api/admin/support/tickets", async (request, reply) => {
    if (!requireSuperadmin(request, reply)) return;
    const input = listInput.parse(request.query);
    const condition = and(
      input.status === "all" ? undefined : eq(supportTickets.status, input.status),
      input.accountType === "all" ? undefined : eq(supportTickets.accountType, input.accountType),
    );
    const [tickets, [totalRow]] = await Promise.all([
      database.select({ id: supportTickets.id, ownerUserId: supportTickets.ownerUserId,
        accountType: supportTickets.accountType, subject: supportTickets.subject,
        category: supportTickets.category, status: supportTickets.status,
        createdAt: supportTickets.createdAt, updatedAt: supportTickets.updatedAt,
        ownerName: users.fullName, ownerEmail: users.email, ownerPhone: users.phone })
        .from(supportTickets).innerJoin(users, eq(users.id, supportTickets.ownerUserId))
        .where(condition).orderBy(desc(supportTickets.updatedAt)).limit(30).offset((input.page - 1) * 30),
      database.select({ value: count() }).from(supportTickets).where(condition),
    ]);
    return { tickets, total: totalRow?.value ?? 0, page: input.page, pageSize: 30 };
  });

  app.get("/api/admin/support/tickets/:id", async (request, reply) => {
    if (!requireSuperadmin(request, reply)) return;
    const { id } = ticketParams.parse(request.params);
    const ticket = await ticketDetail(database, id);
    if (!ticket) return reply.code(404).send({ error: "تیکت پیدا نشد.", requestId: request.id });
    return { ticket };
  });

  app.post("/api/admin/support/tickets/:id/messages", async (request, reply) => {
    const user = requireSuperadmin(request, reply);
    if (!user) return;
    const { id } = ticketParams.parse(request.params);
    const { message } = messageInput.parse(request.body);
    const ticket = await findTicket(database, id);
    if (!ticket) return reply.code(404).send({ error: "تیکت پیدا نشد.", requestId: request.id });
    if (ticket.status === "closed") return reply.code(409).send({ error: "برای پاسخ، ابتدا تیکت را باز کن.", requestId: request.id });
    const now = new Date();
    await database.transaction(async (tx) => {
      await tx.insert(supportMessages).values({ id: randomUUID(), ticketId: id, authorUserId: user.id,
        authorRole: "support", body: message, createdAt: now });
      await tx.update(supportTickets).set({ status: "answered", updatedAt: now }).where(eq(supportTickets.id, id));
    });
    return { ticket: await ticketDetail(database, id) };
  });

  app.patch("/api/admin/support/tickets/:id/status", async (request, reply) => {
    if (!requireSuperadmin(request, reply)) return;
    const { id } = ticketParams.parse(request.params);
    const { status } = z.object({ status: z.enum(["open", "closed"]) }).parse(request.body);
    const [ticket] = await database.update(supportTickets).set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, id)).returning({ id: supportTickets.id });
    if (!ticket) return reply.code(404).send({ error: "تیکت پیدا نشد.", requestId: request.id });
    return { ticket: await ticketDetail(database, id) };
  });
}
