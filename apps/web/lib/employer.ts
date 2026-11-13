import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiRequest } from "@/lib/api-client";
import { apiUrl } from "@/lib/api-url";

export type EmployerPosition = {
  id: string;
  companyName: string;
  title: string;
  description: string;
  workflowStage: number;
  reviewMethod: "manual" | "smart" | null;
  screeningStatus: "not_started" | "processing" | "completed" | "failed";
  screeningError: string | null;
  interviewQuestions?: string[] | null;
  createdAt: string;
};

export const positionScreeningBadge: Record<EmployerPosition["screeningStatus"], { label: string; className: string }> =
  {
    not_started: {
      label: "در انتظار پایش",
      className: "bg-[#fff2dc] text-[#9a6b20]",
    },
    processing: {
      label: "در حال پایش",
      className: "bg-[#e8f0fb] text-[#5278a5]",
    },
    completed: {
      label: "پایش کامل",
      className: "bg-[#e5f4ec] text-[#0f7b62]",
    },
    failed: {
      label: "پایش ناموفق",
      className: "bg-[#fff0ed] text-[#b2513e]",
    },
  };

export function positionWorkflowBadge(position: EmployerPosition) {
  if (
    position.reviewMethod === "manual" &&
    position.screeningStatus !== "processing" &&
    position.screeningStatus !== "completed"
  )
    return { label: "بررسی دستی", className: "bg-[#e8f0fb] text-[#5278a5]" };
  if (position.workflowStage === 2 && position.screeningStatus === "not_started")
    return { label: "در حال افزودن رزومه", className: "bg-[#fff2dc] text-[#9a6b20]" };
  return positionScreeningBadge[position.screeningStatus];
}

export type EmployerProfile = {
  userId: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
};

export type EmployerCandidate = {
  id: string;
  resumeBankId: string | null;
  fileName: string;
  hasOriginalFile: boolean;
  extractionError: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  screeningStatus: "pending" | "ready" | "duplicate" | "unreadable" | "failed";
  matchEvidence: {
    score: number;
    matched: string[];
    missing: string[];
    unknown: string[];
    summary: string;
  } | null;
  invitationStatus: "not_invited" | "invited" | "accepted" | "started" | "completed" | "expired";
  invitationDeadline: string | null;
  interviewAnswers: string[] | null;
  conversationQuestions: string[] | null;
  interviewReport: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    topics?: { title: string; score: number; evidence: string }[];
  } | null;
  interviewFeedbackSharedAt: string | null;
};

export type EmployerBankResume = {
  id: string;
  fileName: string;
  hasOriginalFile: boolean;
  extractionError: string | null;
  name: string | null;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  canDelete: boolean;
  positions: Array<{
    id: string;
    positionId: string;
    positionTitle: string;
    invitationStatus: EmployerCandidate["invitationStatus"];
    invitationDeadline: string | null;
    interviewScore: number | null;
    updatedAt: string;
  }>;
};

export type EmployerPositionDetail = {
  position: EmployerPosition;
  candidates: EmployerCandidate[];
  costs: { screening: number; interview: number };
};

export const employerKeys = {
  profile: ["employer", "profile"] as const,
  positions: ["employer", "positions"] as const,
  resumeBank: ["employer", "resume-bank"] as const,
  bankResume: (id: string) => ["employer", "resume-bank", id] as const,
  bankResumeFile: (id: string) => ["employer", "resume-bank", id, "file"] as const,
  position: (id: string) => ["employer", "positions", id] as const,
  resume: (id: string, candidateId: string) => ["employer", "positions", id, "resumes", candidateId] as const,
  resumeFile: (id: string, candidateId: string) =>
    ["employer", "positions", id, "resumes", candidateId, "file"] as const,
  interviews: ["employer", "interviews"] as const,
};

export function useEmployerProfile() {
  return useQuery({
    queryKey: employerKeys.profile,
    queryFn: () => apiRequest<{ profile: EmployerProfile | null }>("/api/employer/profile"),
    staleTime: 60_000,
  });
}

export function useUpdateEmployerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { companyName: string }) =>
      apiRequest<{ profile: EmployerProfile }>("/api/employer/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (result) => queryClient.setQueryData(employerKeys.profile, result),
  });
}

export function useEmployerPositions() {
  return useQuery({
    queryKey: employerKeys.positions,
    queryFn: () => apiRequest<EmployerPosition[]>("/api/employer/positions"),
    staleTime: 30_000,
  });
}

export function useEmployerResumeBank(enabled = true) {
  return useQuery({
    queryKey: employerKeys.resumeBank,
    queryFn: () => apiRequest<EmployerBankResume[]>("/api/employer/resume-bank"),
    staleTime: 15_000,
    enabled,
  });
}

export function useEmployerBankResume(id: string | null) {
  return useQuery({
    queryKey: employerKeys.bankResume(id ?? ""),
    queryFn: () =>
      apiRequest<{ id: string; fileName: string; resumeText: string; extractionError: string | null }>(
        `/api/employer/resume-bank/${id}`,
      ),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useEmployerBankResumeFile(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: employerKeys.bankResumeFile(id ?? ""),
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/employer/resume-bank/${id}/file`), { credentials: "include" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new ApiError(response.status, body.error || "دریافت فایل رزومه ناموفق بود.");
      }
      return response.blob();
    },
    enabled: enabled && Boolean(id),
    staleTime: 60_000,
  });
}

export function useEmployerPosition(id: string, refreshInterval = 0) {
  return useQuery({
    queryKey: employerKeys.position(id),
    queryFn: () => apiRequest<EmployerPositionDetail>(`/api/employer/positions/${id}`),
    staleTime: 5_000,
    enabled: Boolean(id),
    refetchInterval: refreshInterval || false,
  });
}

export function useSetEmployerInterviewFeedbackSharing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, shared }: { candidateId: string; shared: boolean }) =>
      apiRequest<{ candidateId: string; shared: boolean; sharedAt: string | null }>(
        `/api/employer/positions/${id}/interviews/${candidateId}/feedback-sharing`,
        { method: "PATCH", body: JSON.stringify({ shared }) },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerKeys.position(id) });
    },
  });
}

export function useEmployerResume(id: string, candidateId: string | null) {
  return useQuery({
    queryKey: employerKeys.resume(id, candidateId ?? ""),
    queryFn: () =>
      apiRequest<{ id: string; fileName: string; resumeText: string; extractionError: string | null }>(
        `/api/employer/positions/${id}/resumes/${candidateId}`,
      ),
    enabled: Boolean(id && candidateId),
    staleTime: 60_000,
  });
}

export function useEmployerResumeFile(id: string, candidateId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: employerKeys.resumeFile(id, candidateId ?? ""),
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/employer/positions/${id}/resumes/${candidateId}/file`), {
        credentials: "include",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new ApiError(response.status, body.error || "دریافت فایل رزومه ناموفق بود.");
      }
      return response.blob();
    },
    enabled: enabled && Boolean(id && candidateId),
    staleTime: 60_000,
  });
}
