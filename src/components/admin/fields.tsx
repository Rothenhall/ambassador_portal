"use client";

import type { ReactNode } from "react";
import { ActionNote } from "@/components/ActionNote";
import type { RunnerStatus } from "@/components/use-action-runner";

/**
 * Form primitives for the authoring surface.
 *
 * The operator console is deliberately one page with a tab strip rather than a route per
 * screen, so these exist to keep a dozen small forms visually identical without a dozen
 * copies of the same markup.
 */

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-ink-60">{label}</span>
      {children}
      {hint && <span className="text-[0.7rem] text-ink-45">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  required,
  max,
  list,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  max?: number;
  list?: string;
}) {
  return (
    <input
      type={type}
      className="input"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      maxLength={max}
      list={list}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  disabled,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  mono?: boolean;
}) {
  return (
    <textarea
      className={`input ${mono ? "font-mono text-xs" : ""}`}
      rows={rows}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  disabled,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  /** Accessible name for selects that are not wrapped in a Field. */
  label?: string;
}) {
  return (
    <select aria-label={label} className="input" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      className="input"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function FormFooter({
  status,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
  disabled,
}: {
  status: RunnerStatus;
  pending: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <ActionNote status={status} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary btn-sm" disabled={pending || disabled} onClick={onSubmit}>
          {pending ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost btn-sm" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow !text-[0.6rem]">{title}</p>
          {description && <p className="mt-1 text-xs text-ink-45">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ListRow({ primary, secondary, trailing }: { primary: string; secondary?: string; trailing?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">
      <div className="min-w-0">
        <p className="truncate text-ink">{primary}</p>
        {secondary && <p className="truncate text-xs text-ink-45">{secondary}</p>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </div>
  );
}
