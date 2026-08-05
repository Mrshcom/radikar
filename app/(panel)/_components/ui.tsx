"use client";

import { useEffect, type ReactNode } from "react";
import { Trash2, X } from "lucide-react";

export function Modal({
  title,
  description,
  headerActions,
  children,
  onClose,
  wide = false,
  document = false,
}: {
  title: string;
  description?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  document?: boolean;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-80 grid cursor-pointer place-items-center bg-[rgba(13,35,32,.48)] p-5 backdrop-blur-[5px] transition-colors hover:bg-[rgba(13,35,32,.52)]"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className={`${document ? "w-[min(804px,calc(100vw-32px))] max-w-[804px] overflow-hidden pb-0" : wide ? "w-[min(1440px,calc(100vw-32px))] max-w-[1440px] overflow-hidden pb-0" : "w-[min(520px,100%)]"} max-h-[calc(100vh-40px)] cursor-default overflow-auto rounded-[19px] border border-white/65 bg-white p-[22px] shadow-[0_26px_80px_rgba(10,38,33,.25)] max-[560px]:max-h-[calc(100vh-20px)] max-[560px]:rounded-[15px] max-[560px]:p-[17px]`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex flex-wrap items-center gap-3 border-b border-[#e7ebe6] pb-4">
          <div className="min-w-0 flex-1">
            <h2 className="mb-[5px] mt-0 text-[17px]">{title}</h2>
            {description && (
              <p className="m-0 text-[9px] leading-[1.8] text-[#758582]">
                {description}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex flex-wrap items-center gap-2">
              {headerActions}
            </div>
          )}
          <button
            className="grid place-items-center border-0 bg-transparent p-[5px] text-[#9ba5a3]"
            onClick={onClose}
            aria-label="بستن"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function DeleteConfirmModal({
  itemName,
  onCancel,
  onConfirm,
}: {
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title="تأیید حذف"
      description={`آیا از حذف «${itemName}» مطمئنی؟`}
      onClose={onCancel}
    >
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#dfe5df] bg-white px-4 text-[10px] font-bold text-[#526461] hover:bg-[#f7f9f7]"
          type="button"
          onClick={onCancel}
        >
          انصراف
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#b9433a] bg-[#c94f45] px-4 text-[10px] font-bold text-white shadow-[0_8px_20px_rgba(185,67,58,.24)] transition-colors duration-200 hover:border-[#a83830] hover:bg-[#b9433a]"
          type="button"
          onClick={onConfirm}
        >
          <Trash2 size={15} /> بله، حذف شود
        </button>
      </div>
    </Modal>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-[27px] flex min-h-16 items-start justify-between gap-5 max-[560px]:block">
      <div>
        {eyebrow && (
          <span className="text-[10px] text-[#9aa5a2]">{eyebrow}</span>
        )}
        <h1 className="mb-[7px] mt-[3px] text-[clamp(19px,2.2vw,27px)] leading-[1.35] tracking-[-.9px]">
          {title}
        </h1>
        {description && (
          <p className="m-0 text-xs text-[#758582]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
