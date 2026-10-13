import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { productTimelineInputSchema } from "@radikar/validators";
import { z } from "zod";
import { requirePermission } from "../auth/routes";
import { ProductTimelineError, type ProductTimelineService } from "./service";

const paramsSchema = z.object({ id: z.uuid() });

export function handleProductTimelineError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (!(error instanceof ProductTimelineError)) return false;
  reply.code(error.status).send({ error: error.message, requestId: request.id });
  return true;
}

export function registerProductTimelineRoutes(app: FastifyInstance, service: ProductTimelineService) {
  app.get("/api/product-timeline", async (request, reply) => {
    if (!requirePermission(request, reply, "own:data:read")) return;
    return { items: await service.listPublished() };
  });

  app.get("/api/admin/product-timeline", async (request, reply) => {
    if (!requirePermission(request, reply, "product-timeline:manage:any")) return;
    return { items: await service.listAdmin() };
  });

  app.post("/api/admin/product-timeline", async (request, reply) => {
    if (!requirePermission(request, reply, "product-timeline:manage:any")) return;
    const item = await service.create(productTimelineInputSchema.parse(request.body));
    return reply.code(201).send({ item });
  });

  app.put("/api/admin/product-timeline/:id", async (request, reply) => {
    if (!requirePermission(request, reply, "product-timeline:manage:any")) return;
    const { id } = paramsSchema.parse(request.params);
    return { item: await service.update(id, productTimelineInputSchema.parse(request.body)) };
  });

  app.post("/api/admin/product-timeline/:id/publish", async (request, reply) => {
    if (!requirePermission(request, reply, "product-timeline:manage:any")) return;
    const { id } = paramsSchema.parse(request.params);
    return { item: await service.publish(id) };
  });

  app.post("/api/admin/product-timeline/:id/unpublish", async (request, reply) => {
    if (!requirePermission(request, reply, "product-timeline:manage:any")) return;
    const { id } = paramsSchema.parse(request.params);
    return { item: await service.unpublish(id) };
  });

  app.delete("/api/admin/product-timeline/:id", async (request, reply) => {
    if (!requirePermission(request, reply, "product-timeline:manage:any")) return;
    const { id } = paramsSchema.parse(request.params);
    await service.remove(id);
    return reply.code(204).send();
  });
}
