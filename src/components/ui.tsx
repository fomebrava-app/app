import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
} from "react";
import { cn } from "../utils/cn";
import { IconClose, IconSearch, IconCheck, IconAlert } from "./icons";

/* ---------------- Button ---------------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-white text-black border-2 border-neutral-700 hover:bg-neutral-50",
    secondary:
      "bg-white text-black border border-neutral-300 hover:bg-neutral-50",
    ghost: "bg-transparent text-neutral-700 border border-transparent hover:bg-neutral-100",
    danger:
      "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-100",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-[13px]",
    md: "px-4 py-2 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------------- Summary Card ---------------- */
export function SummaryCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-neutral-500">{label}</p>
        {icon && <span className="text-neutral-400">{icon}</span>}
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-black">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-neutral-500">{hint}</p>}
    </Card>
  );
}

/* ---------------- Status Badge ---------------- */
type BadgeTone = "strong" | "medium" | "soft" | "outline";
export function StatusBadge({
  children,
  tone = "medium",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    strong: "bg-neutral-800 text-white border-neutral-800",
    medium: "bg-neutral-200 text-neutral-800 border-neutral-300",
    soft: "bg-neutral-100 text-neutral-600 border-neutral-200",
    outline: "bg-white text-neutral-700 border-neutral-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 text-[12px] font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Form Field ---------------- */
export function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-[13px] font-medium text-neutral-700">
          {label}
          {required && <span className="text-neutral-500"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-neutral-500">{error}</p>}
    </div>
  );
}

const fieldBase =
  "w-full rounded border bg-white px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 transition-colors";

export function Input({
  className,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(
        fieldBase,
        error ? "border-neutral-500" : "border-neutral-300",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldBase, "border-neutral-300 min-h-[90px] resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  error,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className={cn(
        fieldBase,
        error ? "border-neutral-500" : "border-neutral-300",
        "appearance-none pr-8",
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.6rem center",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

/* ---------------- Search Field ---------------- */
export function SearchField({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldBase, "border-neutral-300 pl-9")}
      />
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div
        className={cn(
          "w-full rounded-md border border-neutral-200 bg-white shadow-sm",
          sizes[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-black">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Confirm Dialog ---------------- */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <IconAlert className="h-6 w-6 flex-shrink-0 text-neutral-500" />
        <p className="text-sm text-neutral-700">{message}</p>
      </div>
    </Modal>
  );
}

/* ---------------- Empty State ---------------- */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
      {icon && <div className="text-neutral-300">{icon}</div>}
      <p className="text-base font-semibold text-neutral-800">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {action}
    </div>
  );
}

/* ---------------- Loading ---------------- */
export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ---------------- Toast ---------------- */
export function Toast({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white shadow-sm">
        <IconCheck className="h-4 w-4" />
        {message}
      </div>
    </div>
  );
}

/* ---------------- Toggle ---------------- */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors",
          checked ? "border-neutral-700 bg-neutral-800" : "border-neutral-300 bg-neutral-100"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform",
            checked ? "left-0.5 translate-x-5" : "left-0.5"
          )}
          style={{ height: 18, width: 18 }}
        />
      </button>
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </label>
  );
}
