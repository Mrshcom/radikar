import { z } from "zod";
import { dataCollections } from "@radicar/shared-types";

export const dataCollectionSchema = z.enum(dataCollections);

export const baseRecordSchema = z
  .object({
    id: z.string().trim().min(1).max(255),
    profileId: z.string().trim().min(1).max(255).optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .loose();
