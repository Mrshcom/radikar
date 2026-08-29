import type { FastifyInstance } from "fastify";
import { registerJobImportRoute } from "./job-import";
import { registerKnowledgeImportRoute } from "./knowledge-import";

export function registerImportRoutes(app: FastifyInstance) {
  registerJobImportRoute(app);
  registerKnowledgeImportRoute(app);
}
