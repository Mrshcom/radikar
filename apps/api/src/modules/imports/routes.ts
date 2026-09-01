import type { FastifyInstance } from "fastify";
import { registerJobImportRoute } from "./job-import";
import { registerKnowledgeImportRoute } from "./knowledge-import";
import type { BillingService } from "../billing/service";

export function registerImportRoutes(app: FastifyInstance, billing?: BillingService) {
  registerJobImportRoute(app);
  registerKnowledgeImportRoute(app, billing);
}
