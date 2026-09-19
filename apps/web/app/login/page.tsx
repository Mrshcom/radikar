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
import { useToast } from "@/app/_components/toast";
import { normalizeDigits } from "@radikar/validators";

const localizedNumericString = z.string().trim().transform(normalizeDigits);

const phoneSchema = z.object({
  phone: localizedNumericString.pipe(
    z.string().min(1, "شماره همراه را وارد کن.").regex(
      /^09\d{9}$/,
      "شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد.",
    ),
  ),
});

const otpSchema = z.object({
  otp: localizedNumericString.pipe(
    z.string().regex(/^\d{6}$/, "کد یک‌بارمصرف باید ۶ رقم باشد."),
  ),
});

type PhoneValues = z.infer<typeof phoneSchema>;
type OtpValues = z.infer<typeof otpSchema>;

const fieldClass =
  "h-11 w-full rounded-[12px] border border-[#dce5df] bg-white ps-11 pe-4 text-left text-[13px] text-[#233936] outline-none transition placeholder:text-[#a3afac] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10 sm:h-12";

export default function LoginPage() {
  const router = useRouter();
  const notify = useToast();
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
      notify("کد ورود با موفقیت ارسال شد.");
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
      notify("با موفقیت وارد حساب کاربری شدی.");
      router.replace(result.user.role === "user" ? "/dashboard" : "/admin");
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
      notify("کد ورود مجدداً ارسال شد.");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "ارسال مجدد کد ناموفق بود.");
    }
    otpInputRefs.current[0]?.focus();
  };

  const updateOtpDigit = (index: number, value: string) => {
    const digit = normalizeDigits(value).replace(/\D/g, "").slice(-1);
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
    const pastedCode = normalizeDigits(event.clipboardData.getData("text"))
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedCode) return;
    event.preventDefault();
    setOtpDigits(Array.from({ length: 6 }, (_, index) => pastedCode[index] || ""));
    setOtpValue("otp", pastedCode, { shouldValidate: false });
    clearOtpErrors("otp");
    otpInputRefs.current[Math.min(pastedCode.length, 6) - 1]?.focus();
    if (pastedCode.length === 6) void handleOtpSubmit(verifyOtp)();
  };

  return (
    <main className="relative grid h-[100dvh] min-h-0 place-items-center overflow-hidden bg-[#f2f5f0] px-4 py-4 sm:px-6 sm:py-6 max-lg:bg-[radial-gradient(circle_at_85%_0%,#23765c_0%,#075543_52%,#043a2f_100%)]">
      <Image
        src="/images/login-career-path.png"
        alt=""
        fill
        sizes="(max-width: 1023px) 100vw, 0px"
        className="pointer-events-none object-cover object-center opacity-30 lg:hidden"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(3,66,52,.2)_0%,rgba(2,43,35,.68)_100%)] lg:hidden" />
      <div className="pointer-events-none absolute -right-32 -top-40 size-[420px] rounded-full bg-white/10 blur-3xl lg:bg-[#0f7b62]/8" />
      <div className="pointer-events-none absolute -bottom-48 -left-36 size-[460px] rounded-full bg-[#d8b35c]/10 blur-3xl" />

      <section className="relative grid max-h-full w-full max-w-[980px] overflow-y-auto overflow-x-hidden lg:rounded-[28px] lg:border lg:border-white/80 lg:bg-white lg:shadow-[0_30px_90px_rgba(24,55,48,.12)] lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden min-h-[560px] overflow-hidden bg-[#075543] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Image
            src="/images/login-career-path.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 48vw, 0px"
            className="pointer-events-none object-cover object-center opacity-90"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(3,66,52,.08)_25%,rgba(2,43,35,.48)_100%)]" />
          <div className="absolute -bottom-28 -left-20 size-[340px] rounded-full border-[55px] border-white/6" />
          <div className="relative flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-[15px] bg-white shadow-[0_10px_24px_rgba(2,44,34,.18)]">
              <Image src="/radikar-logo.png" alt="لوگوی رادیکار" width={42} height={42} />
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

        <div className="flex flex-col justify-center rounded-[24px] bg-white px-5 py-7 shadow-[0_18px_50px_rgba(2,44,34,.22)] sm:px-8 sm:py-9 lg:min-h-[560px] lg:rounded-none lg:px-14 lg:py-10 lg:shadow-none">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-[14px] bg-[#edf7f1]">
              <Image src="/radikar-logo.png" alt="لوگوی رادیکار" width={34} height={34} />
            </span>
            <strong className="text-[19px] text-[#19312f]">رادیکار</strong>
          </div>

          <div className="mb-6">
            <p className="mb-1.5 mt-0 text-[11px] font-bold text-[#0f7b62]">خوش آمدی</p>
            <h2 className="m-0 text-[25px] font-black tracking-[-.5px] text-[#19312f] sm:text-[27px]">ورود به حساب کاربری</h2>
            <p className="mb-0 mt-2 text-[11px] leading-7 text-[#7b8b87] sm:mt-3 sm:leading-[1.9]">
              {step === "phone"
                ? "شماره همراهت را وارد کن تا کد ورود برایت ارسال شود."
                : `کد ۶ رقمی ارسال‌شده به ${submittedPhone} را وارد کن.`}
            </p>
          </div>

          {step === "phone" ? (
            <form className="grid gap-4" onSubmit={handlePhoneSubmit(sendOtp)} noValidate>
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
                    onInput={(event) => {
                      event.currentTarget.value = normalizeDigits(event.currentTarget.value);
                    }}
                  />
                </span>
                {phoneErrors.phone && <span className="text-[10px] font-medium text-[#c64c54]">{phoneErrors.phone.message}</span>}
              </label>

              <button
                className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border-0 bg-[#0f7b62] px-5 text-[12px] font-extrabold text-white shadow-[0_10px_24px_rgba(15,123,98,.22)] transition hover:bg-[#0b6954] disabled:cursor-wait disabled:opacity-65 sm:mt-2 sm:h-12"
                type="submit"
                disabled={isSending}
              >
                {isSending ? "در حال ارسال..." : "دریافت کد ورود"}
                {!isSending && <ArrowLeft size={17} />}
              </button>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={handleOtpSubmit(verifyOtp)} noValidate>
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
                      className="h-12 min-w-0 rounded-[12px] border border-[#d9dfda] bg-white text-center text-[20px] font-bold text-[#233936] outline-none transition focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/12 sm:h-14 sm:rounded-[14px] sm:text-[21px]"
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
                className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border-0 bg-[#0f7b62] px-5 text-[12px] font-extrabold text-white shadow-[0_10px_24px_rgba(15,123,98,.22)] transition hover:bg-[#0b6954] disabled:cursor-wait disabled:opacity-65 sm:mt-2 sm:h-12"
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

          <Link
            className="mx-auto mt-6 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0f7b62] no-underline transition hover:text-[#0b6954] sm:mt-8"
            href="/"
          >
            <ArrowRight size={14} />
            بازگشت به سایت
          </Link>
        </div>
      </section>
    </main>
  );
}
