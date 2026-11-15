"use client";

import { RadicoinStore } from "@/app/_components/radicoin-store";
import { useAuth } from "@/app/_components/auth";

function CandidateRadicoinStore() {
  return (
    <RadicoinStore
      backHref="/radicoins"
      backLabel="بازگشت به کیف پول رادیکوین"
      description="کیف پولت را شارژ کن تا بتوانی پلن‌ها و خدمات رادیکار را با رادیکوین تهیه کنی."
    />
  );
}

function EmployerRadicoinStore() {
  return (
    <RadicoinStore
      backHref="/radicoins"
      backLabel="بازگشت به کیف پول رادیکوین"
      description="کیف پولت را برای پایش رزومه و دعوت نامزدها به مصاحبه شارژ کن."
    />
  );
}

export default function RadicoinBuyRoute() {
  const { user } = useAuth();

  return user?.accountType === "employer" ? <EmployerRadicoinStore /> : <CandidateRadicoinStore />;
}
