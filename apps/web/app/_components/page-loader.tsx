import Image from "next/image";

export function PageLoader() {
  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f7f2] px-5"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 size-72 rounded-full bg-[#dff1e9]/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-28 -left-20 size-80 rounded-full bg-[#e7f5ef]/80 blur-3xl"
      />

      <section className="relative w-full max-w-[370px] px-5 py-9 text-center">
        <div className="mx-auto grid size-[82px] place-items-center rounded-[26px] bg-[#e9f6f0]">
          <Image
            src="/radikar-logo.png"
            alt="رادیکار"
            width={62}
            height={62}
            priority
            className="size-[62px] object-contain"
          />
        </div>

        <h1 className="mt-5 text-xs font-normal text-[#193936]">
          در حال بارگذاری
        </h1>

        <div
          className="mx-auto mt-3 h-[3px] w-full max-w-[220px] overflow-hidden rounded-full bg-[#e8f1ed]"
          dir="ltr"
          role="progressbar"
          aria-label="در حال بارگذاری"
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="block h-full w-0 rounded-full bg-[#0f7b62] animate-[page-loader-fill_1.1s_ease-in-out_infinite]" />
        </div>
      </section>
    </main>
  );
}
