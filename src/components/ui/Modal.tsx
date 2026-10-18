"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";
import { cn } from "@/lib/utils/cn";
import { Heading } from "./Heading";
import { IconButton } from "./IconButton";

const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" } as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const items = container.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (items.length === 0) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || active === container)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizes;
  dismissible?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  dismissible = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  ariaLabel,
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || !mounted) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible && closeOnEsc) onCloseRef.current();
      if (e.key === "Tab") trapFocus(e, panelRef.current);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, dismissible, closeOnEsc, mounted]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 animate-backdrop-in bg-backdrop/60"
        onClick={dismissible && closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[90vh] w-full animate-modal-in flex-col rounded-lg border-2 border-ink bg-surface text-fg shadow-brutal-lg outline-none",
          sizes[size],
          className,
        )}
      >
        {(title || dismissible) && (
          <div className="flex items-start gap-4 border-b-2 border-ink px-5 py-4">
            {title && (
              <Heading level="h3" as="h2" id={titleId} className="flex-1">
                {title}
              </Heading>
            )}
            {dismissible && (
              <IconButton
                icon={<LuX />}
                label="ปิด"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="-mr-2 ml-auto"
              />
            )}
          </div>
        )}
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t-2 border-ink px-5 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
