import type { FastifyInstance } from "fastify";
import type { DataCollection } from "@radikar/shared-types";
import { dataCollectionSchema, normalizeDataRecordForStorage } from "@radikar/validators";
import type { RecordRepository } from "./record-repository";
import { requirePermission } from "../auth/routes";
import type { BillingService } from "../billing/service";
import type { RadicoinService } from "../radicoin/service";
import type { ProductEventService } from "../analytics/service";

type CollectionParams = { collection: string };
type RecordParams = CollectionParams & { id: string };

function parseCollection(value: string): DataCollection {
  return dataCollectionSchema.parse(value);
}

export function registerDataRoutes(
  app: FastifyInstance,
  repository: RecordRepository,
  billing?: BillingService,
  radicoin?: RadicoinService,
  productEvents?: ProductEventService,
) {
  app.get<{ Params: CollectionParams }>("/v1/data/:collection", async (request, reply) => {
    if (!requirePermission(request, reply, "own:data:read")) return;
    return repository.list(request.auth!.user.id, parseCollection(request.params.collection));
  });

  app.get<{ Params: RecordParams }>("/v1/data/:collection/:id", async (request, reply) => {
    if (!requirePermission(request, reply, "own:data:read")) return;
    return repository.get(request.auth!.user.id, parseCollection(request.params.collection), request.params.id);
  });

  app.put<{ Params: RecordParams }>("/v1/data/:collection/:id", async (request, reply) => {
    if (!requirePermission(request, reply, "own:data:write")) return;
    const collection = parseCollection(request.params.collection);
    const record = normalizeDataRecordForStorage(collection, request.body);
    if (record.id !== request.params.id) {
      return reply.code(400).send({
        error: "شناسه مسیر با شناسه رکورد یکسان نیست.",
        requestId: request.id,
      });
    }
    const existingRecord = await repository.get(request.auth!.user.id, collection, record.id);
    const isNewResume = collection === "resumes" && !existingRecord;
    if (isNewResume && billing) {
      await billing.consumeUsage(request.auth!.user.id, { resume: 1 }, "resume_create", request.id);
    }
    try {
      const stored = await repository.put(request.auth!.user.id, collection, record);
      if (collection === "resumes") {
        await radicoin?.grantReferralActivation(request.auth!.user.id, request.id);
        await productEvents?.record(
          "resume_saved",
          `resume-saved:${request.auth!.user.id}:${record.id}:${record.updatedAt}`,
          request.auth!.user.id,
          { is_new: isNewResume },
        );
        if (typeof record.targetJobId === "string" && record.targetJobId)
          await productEvents?.record(
            "tailored_resume_created",
            `tailored-resume:${request.auth!.user.id}:${record.id}:${record.updatedAt}`,
            request.auth!.user.id,
            { source: "match" },
          );
      }
      if (collection === "jobs")
        await productEvents?.record(
          "job_input_submitted",
          `job-saved:${request.auth!.user.id}:${record.id}:${record.updatedAt}`,
          request.auth!.user.id,
          { source: "saved" },
        );
      if (collection === "applications")
        await productEvents?.record(
          "application_changed",
          `application:${request.auth!.user.id}:${record.id}:${record.updatedAt}`,
          request.auth!.user.id,
          { action: existingRecord ? "stage_changed" : "created" },
        );
      return stored;
    } catch (error) {
      if (isNewResume && billing) {
        await billing.refundUsage(request.auth!.user.id, { resume: 1 }, "resume_create", request.id);
      }
      throw error;
    }
  });

  app.delete<{ Params: RecordParams }>("/v1/data/:collection/:id", async (request, reply) => {
    if (!requirePermission(request, reply, "own:data:write")) return;
    await repository.remove(request.auth!.user.id, parseCollection(request.params.collection), request.params.id);
    return reply.code(204).send();
  });

  app.delete<{ Params: CollectionParams }>("/v1/data/:collection", async (request, reply) => {
    if (!requirePermission(request, reply, "own:data:write")) return;
    await repository.clear(request.auth!.user.id, parseCollection(request.params.collection));
    return reply.code(204).send();
  });
}
