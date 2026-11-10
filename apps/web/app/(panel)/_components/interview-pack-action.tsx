"use client";

import { useState } from "react";
import { ArrowLeft, CalendarClock, Coins, CreditCard, LoaderCircle, MessagesSquare, Sparkles } from "lucide-react";
import { useToast } from "@/app/_components/toast";
import { useBuyCreditPack, useCreditPacks } from "@/lib/credit-packs";
import { formatTomans } from "@/lib/billing";
import { useRadicoinWallet } from "@/lib/radicoins";
import { PersianDateTime } from "@/lib/date-time-display";
import { Modal } from "./ui";

export function InterviewPackAction({ expiresAt }: { expiresAt: string }) {
  const [open, setOpen] = useState(false);
  const catalog = useCreditPacks();
  const wallet = useRadicoinWallet();
  const buy = useBuyCreditPack();
  const notify = useToast();
  const pack = catalog.data?.find((item) => item.id === "interview-3");
  const balance = wallet.data?.wallet?.availableCoins ?? 0;

  const purchase = (paymentMethod: "gateway" | "radicoin") => {
    if (!pack) return;
    buy.mutate(
      { packId: pack.id, paymentMethod, idempotencyKey: crypto.randomUUID() },
      {
        onSuccess: (result) => {
          if (result.checkout === "activated") {
            setOpen(false);
            notify("۳ جلسهٔ مصاحبه و اعتبار AI همراه آن به حسابت اضافه شد.");
          }
        },
      },
    );
  };

  return (
    <>
      <button
        className="w-fit rounded-lg border border-[#0f7b62] bg-white px-3 py-2 text-[10px] font-bold text-[#0f7b62] hover:bg-[#edf7f2]"
        onClick={() => setOpen(true)}
        type="button"
      >
        افزودن اعتبار مصاحبه
      </button>
      {open && (
        <Modal title="اعتبار بیشتر برای مصاحبه" onClose={() => !buy.isPending && setOpen(false)} showCloseButton>
          {catalog.isPending ? (
            <p className="mt-5 text-[#667d74]">در حال دریافت مشخصات بسته…</p>
          ) : catalog.isError || !pack ? (
            <p className="mt-5 text-[#a13f37]">مشخصات بسته در دسترس نیست. کمی بعد دوباره تلاش کن.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              <div className="relative overflow-hidden rounded-[20px] bg-linear-to-bl from-[#0c765f] via-[#118c70] to-[#20a183] p-5 text-white">
                <div
                  aria-hidden="true"
                  className="absolute -top-16 -left-16 size-44 rounded-full border-[28px] border-white/10"
                />
                <div aria-hidden="true" className="absolute -right-12 -bottom-20 size-48 rounded-full bg-white/8" />
                <div className="relative flex flex-wrap items-end justify-between gap-5">
                  <div className="grid gap-2">
                    <span className="w-fit rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-bold">
                      بستهٔ تکمیلی پلن حرفه‌ای
                    </span>
                    <strong className="text-[30px] leading-tight font-black sm:text-[36px]">
                      {pack.interviewCredits.toLocaleString("fa-IR")} جلسهٔ مصاحبه
                    </strong>
                    <span className="text-[11px] text-white/85">ادامهٔ تمرین، بدون تغییر پلن فعلی</span>
                  </div>
                  <div className="rounded-[16px] border border-white/35 bg-white px-4 py-3 text-[#125441] shadow-sm">
                    <span className="block text-[10px] font-bold text-[#66827a]">قیمت کل بسته</span>
                    <strong className="mt-1 block whitespace-nowrap text-[22px] leading-tight font-black">
                      {formatTomans(pack.amountRials)} <small className="text-[11px]">تومان</small>
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-[15px] border border-[#dcebe4] bg-[#f5faf7] p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#def3e9] text-[#0f7b62]">
                    <MessagesSquare aria-hidden="true" size={19} />
                  </span>
                  <span className="grid gap-0.5">
                    <strong className="text-[14px] text-[#193a33]">
                      {pack.interviewCredits.toLocaleString("fa-IR")} جلسه
                    </strong>
                    <small className="text-[9px] text-[#71877d]">تمرین مصاحبه</small>
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-[15px] border border-[#dcebe4] bg-[#f5faf7] p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#def3e9] text-[#0f7b62]">
                    <Sparkles aria-hidden="true" size={19} />
                  </span>
                  <span className="grid gap-0.5">
                    <strong className="text-[14px] text-[#193a33]">
                      {pack.aiCredits.toLocaleString("fa-IR")} اعتبار AI
                    </strong>
                    <small className="text-[9px] text-[#71877d]">همراه بسته</small>
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <strong className="text-[11px] text-[#29463d]">روش پرداخت را انتخاب کن</strong>
                <button
                  className="flex min-h-16 items-center gap-3 rounded-[14px] border border-[#0f7b62] bg-[#0f7b62] px-4 py-3 text-right text-white transition-colors hover:bg-[#0a6b55] disabled:opacity-50"
                  disabled={buy.isPending}
                  onClick={() => purchase("gateway")}
                  type="button"
                >
                  <CreditCard aria-hidden="true" className="shrink-0" size={21} />
                  <span className="flex-1">
                    <strong className="block text-[12px]">پرداخت آنلاین</strong>
                    <small className="mt-0.5 block text-[9px] text-white/80">
                      {formatTomans(pack.amountRials)} تومان از درگاه بانکی
                    </small>
                  </span>
                  {buy.isPending ? (
                    <LoaderCircle className="animate-spin" size={17} />
                  ) : (
                    <ArrowLeft aria-hidden="true" size={17} />
                  )}
                </button>
                <button
                  className="flex min-h-16 items-center gap-3 rounded-[14px] border border-[#d7e8dd] bg-white px-4 py-3 text-right text-[#175b49] transition-colors hover:border-[#0f7b62] hover:bg-[#f5faf7] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={buy.isPending || wallet.isPending || balance < pack.radicoinCost}
                  onClick={() => purchase("radicoin")}
                  type="button"
                >
                  <Coins aria-hidden="true" className="shrink-0" size={21} />
                  <span className="flex-1">
                    <strong className="block text-[12px]">
                      پرداخت با {pack.radicoinCost.toLocaleString("fa-IR")} رادیکوین
                    </strong>
                    <small className="mt-0.5 block text-[9px] text-[#71877d]">
                      {wallet.isPending
                        ? "در حال بررسی موجودی…"
                        : `موجودی تو: ${balance.toLocaleString("fa-IR")} رادیکوین`}
                    </small>
                  </span>
                  <ArrowLeft aria-hidden="true" size={17} />
                </button>
              </div>

              {buy.isError && (
                <p role="alert" className="m-0 rounded-lg bg-[#fff1ef] p-3 text-[11px] text-[#a13f37]">
                  {buy.error instanceof Error ? buy.error.message : "خرید بسته انجام نشد."}
                </p>
              )}
              <p className="m-0 flex items-start gap-2 rounded-[12px] bg-[#f7f8f5] px-3 py-2 text-[10px] leading-6 text-[#697b71]">
                <CalendarClock aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
                <span>
                  اعتبارها به پلن فعلی اضافه می‌شوند و تا <PersianDateTime value={expiresAt} /> قابل استفاده‌اند.
                </span>
              </p>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
