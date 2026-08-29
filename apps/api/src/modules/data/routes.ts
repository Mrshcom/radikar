import type { FastifyInstance } from "fastify";
import type { DataCollection } from "@radicar/shared-types";
import { baseRecordSchema, dataCollectionSchema } from "@radicar/validators";
import type { RecordRepository } from "./record-repository";
import { requirePermission } from "../auth/routes";
import type { BillingService } from "../billing/service";

type CollectionParams = { collection: string };
type RecordParams = CollectionParams & { id: string };

function parseCollection(value: string): DataCollection {
  return dataCollectionSchema.parse(value);
}

export function registerDataRoutes(
  app: FastifyInstance,
  repository: RecordRepository,
  billing?: BillingService,
) {
  app.get<{ Params: CollectionParams }>(
    "/v1/data/:collection",
    async (request, reply) => {
      if (!requirePermission(request, reply, "own:data:read")) return;
      return repository.list(request.auth!.user.id, parseCollection(request.params.collection));
    },
  );

  app.get<{ Params: RecordParams }>(
    "/v1/data/:collection/:id",
    async (request, reply) => {
      if (!requirePermission(request, reply, "own:data:read")) return;
      return repository.get(
        request.auth!.user.id,
        parseCollection(request.params.collection),
        request.params.id,
      );
    },
  );

  app.put<{ Params: RecordParams }>(
    "/v1/data/:collection/:id",
    async (request, reply) => {
      if (!requirePermission(request, reply, "own:data:write")) return;
      const collection = parseCollection(request.params.collection);
      const record = baseRecordSchema.parse(request.body);
      if (record.id !== request.params.id) {
        return reply.code(400).send({
          error: "شناسه مسیر با شناسه رکورد یکسان نیست.",
          requestId: request.id,
        });
      }
      const isNewResume =
        collection === "resumes" &&
        !(await repository.get(request.auth!.user.id, collection, record.id));
      if (isNewResume && billing) {
        await billing.consumeUsage(
          request.auth!.user.id,
          { resume: 1 },
          "resume_create",
          request.id,
        );
      }
      try {
        return await repository.put(request.auth!.user.id, collection, record);
      } catch (error) {
        if (isNewResume && billing) {
          await billing.refundUsage(
            request.auth!.user.id,
            { resume: 1 },
            "resume_create",
            request.id,
          );
        }
        throw error;
      }
    },
  );

  app.delete<{ Params: RecordParams }>(
    "/v1/data/:collection/:id",
    async (request, reply) => {
      if (!requirePermission(request, reply, "own:data:write")) return;
      await repository.remove(
        request.auth!.user.id,
        parseCollection(request.params.collection),
        request.params.id,
      );
      return reply.code(204).send();
    },
  );

  app.delete<{ Params: CollectionParams }>(
    "/v1/data/:collection",
    async (request, reply) => {
      if (!requirePermission(request, reply, "own:data:write")) return;
      await repository.clear(request.auth!.user.id, parseCollection(request.params.collection));
      return reply.code(204).send();
    },
  );
}
