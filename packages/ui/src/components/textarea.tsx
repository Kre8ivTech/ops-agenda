import type { ReactNode, TextareaHTMLAttributes } from 'react';

export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
}

export function TextareaField({
  id,
  label,
  hint,
  error,
  className = '',
  ...props
}: TextareaFieldProps) {
  const fieldId = id ?? props.name;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <label className="grid gap-1.5">
      <span className="text-ink text-[0.8rem] font-extrabold">{label}</span>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`text-ink placeholder:text-text-secondary/55 focus:border-signal w-full rounded-[8px] border bg-white px-[13px] py-[11px] outline-none transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_var(--wash-green)] ${
          error ? 'border-risk' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error ? (
        <span id={`${fieldId}-error`} className="text-risk text-[0.78rem]">
          {error}
        </span>
      ) : hint ? (
        <span id={`${fieldId}-hint`} className="text-text-secondary text-[0.78rem]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
