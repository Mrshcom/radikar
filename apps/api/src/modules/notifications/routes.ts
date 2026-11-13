import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { userNotifications, type Database } from "@radikar/database";

export function registerNotificationRoutes(app: FastifyInstance, database: Database) {
  app.get("/api/notifications", async (request, reply) => {
    if (request.auth?.user.role !== "user" || request.auth.user.accountType !== "candidate")
      return reply.code(403).send({ error: "اعلان‌های کارجویی برای این حساب در دسترس نیست." });

    const userId = request.auth.user.id;
    const [items, [unread]] = await Promise.all([
      database
        .select()
        .from(userNotifications)
        .where(eq(userNotifications.userId, userId))
        .orderBy(desc(userNotifications.createdAt))
        .limit(30),
      database
        .select({ value: count() })
        .from(userNotifications)
        .where(and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt))),
    ]);

    return { items, unreadCount: Number(unread?.value ?? 0) };
  });

  app.post("/api/notifications/read-all", async (request, reply) => {
    if (request.auth?.user.role !== "user" || request.auth.user.accountType !== "candidate")
      return reply.code(403).send({ error: "اعلان‌های کارجویی برای این حساب در دسترس نیست." });

    await database
      .update(userNotifications)
      .set({ readAt: new Date() })
      .where(and(eq(userNotifications.userId, request.auth.user.id), isNull(userNotifications.readAt)));
    return reply.code(204).send();
  });
}
