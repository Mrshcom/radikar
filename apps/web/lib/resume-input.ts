import { normalizeStoredResumeData } from "@radicar/validators";
import type { ResumeData } from "../app/(panel)/resumes/resume-data.ts";

export function normalizeResumeDataInput(value: unknown): ResumeData {
  return normalizeStoredResumeData(value);
}
