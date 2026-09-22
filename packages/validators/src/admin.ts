import { z } from "zod";

export const updateAdminAliasSchema = z.object({
  adminAlias: z
    .string()
    .trim()
    .max(80, "نام مستعار نمی‌تواند بیشتر از ۸۰ کاراکتر باشد.")
    .nullable(),
});

export type UpdateAdminAliasInput = z.infer<typeof updateAdminAliasSchema>;

export const adminUserEditSchema = z.object({
  adminAlias: z.string().trim().max(80, "نام مستعار نمی‌تواند بیشتر از ۸۰ کاراکتر باشد.").nullable(),
  role: z.enum(["user", "admin", "superadmin"]),
  status: z.enum(["active", "suspended"]),
});

export type AdminUserEditInput = z.infer<typeof adminUserEditSchema>;
