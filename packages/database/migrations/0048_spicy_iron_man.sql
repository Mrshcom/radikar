CREATE INDEX "employer_candidates_position_hash_idx" ON "employer_candidates" USING btree ("position_id","file_hash");--> statement-breakpoint
CREATE INDEX "employer_candidates_position_email_idx" ON "employer_candidates" USING btree ("position_id","email");--> statement-breakpoint
CREATE INDEX "employer_candidates_position_phone_idx" ON "employer_candidates" USING btree ("position_id","phone");--> statement-breakpoint
CREATE INDEX "employer_resume_bank_owner_email_idx" ON "employer_resume_bank" USING btree ("owner_user_id","email");--> statement-breakpoint
CREATE INDEX "employer_resume_bank_owner_phone_idx" ON "employer_resume_bank" USING btree ("owner_user_id","phone");