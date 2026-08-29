"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Phone, RefreshCw, Sparkles } from "lucide-react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { authQueryKey, type CurrentUser } from "@/app/_components/auth";

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "شماره همراه را وارد کن.")
    .regex(/^09\d{9}$/, "شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد."),
});

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "کد یک‌بارمصرف باید ۶ رقم باشد."),
});

type PhoneValues = z.infer<typeof phoneSchema>;
type OtpValues = z.infer<typeof otpSchema>;

const fieldClass =
  "h-12 w-full rounded-[12px] border border-[#dce5df] bg-white ps-11 pe-4 text-left text-[13px] text-[#233936] outline-none transition placeholder:text-[#a3afac] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [otpDigits, setOtpDigits] = useState(() => Array(6).fill(""));
  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors, isSubmitting: isSending },
  } = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    reset: resetOtp,
    setValue: setOtpValue,
    clearErrors: clearOtpErrors,
    formState: { errors: otpErrors, isSubmitting: isVerifying },
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const queryClient = useQueryClient();
  const requestOtp = useMutation({
    mutationFn: (phone: string) =>
      apiRequest<{ challengeId: string; expiresInSeconds: number; developmentCode?: string }>(
        "/api/auth/request-otp",
        { method: "POST", body: JSON.stringify({ phone }) },
      ),
  });
  const verifyOtpMutation = useMutation({
    mutationFn: (input: { phone: string; challengeId: string; code: string }) =>
      apiRequest<{ user: CurrentUser; expiresAt: string }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });

  const sendOtp = async ({ phone }: PhoneValues) => {
    setServerError("");
    try {
      const result = await requestOtp.mutateAsync(phone);
      setSubmittedPhone(phone);
      setChallengeId(result.challengeId);
      setDevelopmentCode(result.developmentCode ?? "");
      resetOtp({ otp: "" });
      setOtpDigits(Array(6).fill(""));
      setStep("otp");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "ارسال کد ورود ناموفق بود.");
    }
  };

  const verifyOtp = async ({ otp }: OtpValues) => {
    if (!challengeId) return;
    setServerError("");
    try {
      const result = await verifyOtpMutation.mutateAsync({
        phone: submittedPhone,
        challengeId,
        code: otp,
      });
      queryClient.clear();
      queryClient.setQueryData(authQueryKey, { user: result.user });
      router.replace(result.user.role === "superadmin" ? "/admin" : "/dashboard");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "بررسی کد ورود ناموفق بود.");
    }
  };

  const resendOtp = async () => {
    resetOtp({ otp: "" });
    setOtpDigits(Array(6).fill(""));
    setServerError("");
    try {
      const result = await requestOtp.mutateAsync(submittedPhone);
      setChallengeId(result.challengeId);
      setDevelopmentCode(result.developmentCode ?? "");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "ارسال مجدد کد ناموفق بود.");
    }
    otpInputRefs.current[0]?.focus();
  };

  const updateOtpDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const digits = [...otpDigits];
    digits[index] = digit;
    setOtpDigits(digits);
    const completedCode = digits.join("");
    setOtpValue("otp", completedCode, { shouldValidate: false });
    clearOtpErrors("otp");
    if (digit && index < 5) otpInputRefs.current[index + 1]?.focus();
    if (completedCode.length === 6) void handleOtpSubmit(verifyOtp)();
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace" || otpDigits[index]) return;
    otpInputRefs.current[Math.max(index - 1, 0)]?.focus();
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedCode) return;
    event.preventDefault();
    setOtpDigits(Array.from({ length: 6 }, (_, index) => pastedCode[index] || ""));
    setOtpValue("otp", pastedCode, { shouldValidate: false });
    clearOtpErrors("otp");
    otpInputRefs.current[Math.min(pastedCode.length, 6) - 1]?.focus();
    if (pastedCode.length === 6) void handleOtpSubmit(verifyOtp)();
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f2f5f0] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -right-32 -top-40 size-[420px] rounded-full bg-[#0f7b62]/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-36 size-[460px] rounded-full bg-[#d8b35c]/10 blur-3xl" />

      <section className="relative grid w-full max-w-[980px] overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(24,55,48,.12)] lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden min-h-[650px] overflow-hidden bg-[#0f735c] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,.16),transparent_36%),linear-gradient(145deg,transparent_45%,rgba(4,69,54,.45))]" />
          <div className="absolute -bottom-28 -left-20 size-[340px] rounded-full border-[55px] border-white/6" />
          <div className="relative flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-[15px] bg-white shadow-[0_10px_24px_rgba(2,44,34,.18)]">
              <Image src="/logo.svg" alt="لوگوی رادیکار" width={31} height={31} />
            </span>
            <div>
              <strong className="block text-[21px]">رادیکار</strong>
              <span className="text-[10px] text-white/70">دستیار هوشمند مسیر شغلی</span>
            </div>
          </div>

          <div className="relative max-w-[400px]">
            <span className="mb-5 grid size-11 place-items-center rounded-[14px] bg-white/12 ring-1 ring-white/15">
              <Sparkles size={22} />
            </span>
            <h1 className="m-0 text-[34px] font-black leading-[1.55] tracking-[-.8px]">
              مسیر شغلی بعدی‌ات،
              <br />از همین‌جا شروع می‌شود.
            </h1>
            <p className="mb-0 mt-5 text-[13px] leading-[2] text-white/72">
              رزومه حرفه‌ای بساز، فرصت‌های مناسب را پیدا کن و روند اپلای‌هایت را یک‌جا مدیریت کن.
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-[10px] text-white/65">
            <span className="h-px w-10 bg-white/35" />
            هوشمندانه‌تر برای آینده شغلی‌ات تصمیم بگیر
          </div>
        </div>

        <div className="flex min-h-[650px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Image src="/logo.svg" alt="لوگوی رادیکار" width={42} height={42} />
            <strong className="text-[20px]">رادیکار</strong>
          </div>

          <div className="mb-8">
            <p className="mb-2 mt-0 text-[11px] font-bold text-[#0f7b62]">خوش آمدی</p>
            <h2 className="m-0 text-[27px] font-black tracking-[-.5px] text-[#19312f]">ورود به حساب کاربری</h2>
            <p className="mb-0 mt-3 text-[11px] leading-[1.9] text-[#7b8b87]">
              {step === "phone"
                ? "شماره همراهت را وارد کن تا کد ورود برایت ارسال شود."
                : `کد ۶ رقمی ارسال‌شده به ${submittedPhone} را وارد کن.`}
            </p>
          </div>

          {step === "phone" ? (
            <form className="grid gap-5" onSubmit={handlePhoneSubmit(sendOtp)} noValidate>
              <label className="grid gap-2 text-[11px] font-bold text-[#354b47]">
                شماره همراه
                <span className="relative block" dir="ltr">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#83928f]" size={17} />
                  <input
                    {...registerPhone("phone")}
                    className={fieldClass}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    placeholder="09123456789"
                  />
                </span>
                {phoneErrors.phone && <span className="text-[10px] font-medium text-[#c64c54]">{phoneErrors.phone.message}</span>}
              </label>

              <button
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border-0 bg-[#0f7b62] px-5 text-[12px] font-extrabold text-white shadow-[0_10px_24px_rgba(15,123,98,.22)] transition hover:bg-[#0b6954] disabled:cursor-wait disabled:opacity-65"
                type="submit"
                disabled={isSending}
              >
                {isSending ? "در حال ارسال..." : "دریافت کد ورود"}
                {!isSending && <ArrowLeft size={17} />}
              </button>
            </form>
          ) : (
            <form className="grid gap-5" onSubmit={handleOtpSubmit(verifyOtp)} noValidate>
              <label className="grid gap-2 text-[11px] font-bold text-[#354b47]">
                کد یک‌بارمصرف
                <input {...registerOtp("otp")} type="hidden" />
                <div
                  className="grid grid-cols-6 gap-2 sm:gap-3"
                  dir="ltr"
                  onPaste={handleOtpPaste}
                >
                  {Array.from({ length: 6 }, (_, index) => (
                    <input
                      className="h-14 min-w-0 rounded-[14px] border border-[#d9dfda] bg-white text-center text-[21px] font-bold text-[#233936] outline-none transition focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/12"
                      ref={(element) => {
                        otpInputRefs.current[index] = element;
                      }}
                      value={otpDigits[index]}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      aria-label={`رقم ${index + 1} کد یک‌بارمصرف`}
                      autoFocus={index === 0}
                      onChange={(event) => updateOtpDigit(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      key={index}
                    />
                  ))}
                </div>
                {otpErrors.otp && <span className="text-[10px] font-medium text-[#c64c54]">{otpErrors.otp.message}</span>}
              </label>

              <div className="flex items-center justify-between gap-3 text-[10px]">
                <button
                  className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 font-bold text-[#0f7b62]"
                  type="button"
                  onClick={() => void resendOtp()}
                >
                  <RefreshCw size={14} />
                  ارسال مجدد کد
                </button>
                <button
                  className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[#687a76]"
                  type="button"
                  onClick={() => setStep("phone")}
                >
                  <ArrowRight size={14} />
                  اصلاح شماره
                </button>
              </div>

              {developmentCode && (
                <p className="m-0 rounded-[10px] border border-[#d8e8e1] bg-[#f2f8f5] px-3 py-2 text-[10px] text-[#397060]">
                  کد محیط توسعه: <strong dir="ltr">{developmentCode}</strong>
                </p>
              )}

              <button
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border-0 bg-[#0f7b62] px-5 text-[12px] font-extrabold text-white shadow-[0_10px_24px_rgba(15,123,98,.22)] transition hover:bg-[#0b6954] disabled:cursor-wait disabled:opacity-65"
                type="submit"
                disabled={isVerifying}
              >
                {isVerifying ? "در حال بررسی..." : "تأیید و ورود"}
                {!isVerifying && <ArrowLeft size={17} />}
              </button>
            </form>
          )}

          {serverError && (
            <p className="mb-0 mt-4 rounded-[10px] bg-[#fff1ef] px-3 py-2 text-[10px] font-medium text-[#b34545]" role="alert">
              {serverError}
            </p>
          )}

          <p className="mb-0 mt-8 text-center text-[10px] text-[#7d8c89]">
            حساب کاربری نداری؟{" "}
            <Link className="font-extrabold text-[#0f7b62] no-underline" href="#">
              ساخت حساب جدید
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
