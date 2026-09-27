import type { FastifyInstance } from "fastify";
import { registerJobImportRoute } from "./job-import";
import { registerKnowledgeImportRoute } from "./knowledge-import";
import type { BillingService } from "../billing/service";
import { registerLinkedInImportRoute, type LinkedInImportOptions } from "./linkedin-import";

export function registerImportRoutes(
  app: FastifyInstance,
  billing?: BillingService,
  maxUploadSizeBytes?: number,
  linkedin?: LinkedInImportOptions,
) {
  registerJobImportRoute(app);
  registerKnowledgeImportRoute(app, billing, maxUploadSizeBytes);
  registerLinkedInImportRoute(app, linkedin);
}
