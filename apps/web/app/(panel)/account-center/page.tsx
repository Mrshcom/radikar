"use client";

import { useAuth } from "@/app/_components/auth";
import EmployerAccountCenter from "@/app/(employer)/employer/account-center/employer-account-center";
import CandidateAccountCenter from "./candidate-account-center";

export default function AccountCenterRoute() {
  const { user } = useAuth();

  return user?.accountType === "employer" ? <EmployerAccountCenter /> : <CandidateAccountCenter />;
}
