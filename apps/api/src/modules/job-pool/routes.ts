import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requirePermission } from "../auth/routes";
import type { JobPoolService } from "./service";

const settingsSchema = z.object({
  enabled: z.boolean(),
  dailyLimit: z.number().int().min(150).max(500),
  intervalHours: z.number().int().min(1).max(24),
  publishedAt: z.enum(["r86400", "r604800", "r2592000"]),
  locations: z.array(z.string().trim().min(2).max(100)).min(1).max(10),
});
const optionalNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().int().min(0).optional(),
);
const reportQuerySchema = z.object({ days: z.coerce.number().int().min(1).max(90).default(30) });
const jobsQuerySchema = z.object({
  query: z.string().trim().max(100).default(""),
  location: z.string().trim().max(100).default(""),
  salaryMin: optionalNumber,
  salaryMax: optionalNumber,
  salaryCurrency: z.enum(["USD", "EUR", "GBP"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["title", "company", "location", "salary", "date"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

export function registerJobPoolRoutes(app: FastifyInstance, jobPool: JobPoolService) {
  app.get("/api/job-pool/jobs", async (request, reply) => {
    if (!requirePermission(request, reply, "own:data:read")) return;
    return jobPool.listPublicJobs(jobsQuerySchema.parse(request.query));
  });

  app.get("/api/admin/job-pool", async (request, reply) => {
    if (!requirePermission(request, reply, "job-pool:manage:any")) return;
    return jobPool.getSummary();
  });

  app.post("/api/admin/job-pool/sync", async (request, reply) => {
    if (!requirePermission(request, reply, "job-pool:manage:any")) return;
    const result = await jobPool.syncDailyPool({ ignoreInterval: true });
    return reply.code(201).send(result);
  });

  app.patch("/api/admin/job-pool/settings", async (request, reply) => {
    if (!requirePermission(request, reply, "job-pool:manage:any")) return;
    return reply.send(await jobPool.updateSettings(settingsSchema.parse(request.body)));
  });

  app.get("/api/admin/job-pool/report", async (request, reply) => {
    if (!requirePermission(request, reply, "job-pool:manage:any")) return;
    return jobPool.getReport(reportQuerySchema.parse(request.query).days);
  });

  app.get("/api/admin/job-pool/jobs", async (request, reply) => {
    if (!requirePermission(request, reply, "job-pool:manage:any")) return;
    return jobPool.listJobs(jobsQuerySchema.parse(request.query));
  });
}
