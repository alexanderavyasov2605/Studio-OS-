"use client";

import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { cx } from "@/lib/ui";

type FieldProps = { label: string; hint?: string; error?: string };
export function Input({ label, hint, error, id, className, required, ...props }: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  const description = [hint && `${fieldId}-hint`, error && `${fieldId}-error`, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return <div className="field"><label htmlFor={fieldId}>{label}{required && <span className="field__required"> (обязательно)</span>}</label>
    <input {...props} id={fieldId} required={required} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={description} className={cx("input", className)} />
    {hint && <p id={`${fieldId}-hint`} className="field__hint">{hint}</p>}
    {error && <p id={`${fieldId}-error`} className="field__error">{error}</p>}
  </div>;
}
export function Select({ label, hint, error, id, className, required, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  const description = [hint && `${fieldId}-hint`, error && `${fieldId}-error`, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return <div className="field"><label htmlFor={fieldId}>{label}{required && <span className="field__required"> (обязательно)</span>}</label>
    <select {...props} id={fieldId} required={required} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={description} className={cx("input", "select", className)}>{children}</select>
    {hint && <p id={`${fieldId}-hint`} className="field__hint">{hint}</p>}
    {error && <p id={`${fieldId}-error`} className="field__error">{error}</p>}
  </div>;
}
export function Checkbox({ label, hint, error, id, className, required, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; hint?: string; error?: string }) {
  const generated = useId();
  const fieldId = id ?? generated;
  const description = [hint && `${fieldId}-hint`, error && `${fieldId}-error`, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return <div className={cx("field", className)}>
    <label className="checkbox-label" htmlFor={fieldId}><input {...props} id={fieldId} type="checkbox" required={required} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={description} className="checkbox" /><span>{label}{required && <span className="field__required"> (обязательно)</span>}</span></label>
    {hint && <p id={`${fieldId}-hint`} className="field__hint">{hint}</p>}
    {error && <p id={`${fieldId}-error`} className="field__error">{error}</p>}
  </div>;
}
