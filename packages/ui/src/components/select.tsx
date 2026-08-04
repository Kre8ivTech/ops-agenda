import type { ReactNode, SelectHTMLAttributes } from 'react';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

export function SelectField({
  id,
  label,
  hint,
  error,
  className = '',
  children,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? props.name;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <label className="grid gap-1.5">
      <span className="text-ink text-[0.8rem] font-extrabold">{label}</span>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`text-ink focus:border-signal h-[46px] w-full rounded-[8px] border bg-white px-[13px] outline-none transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_var(--wash-green)] ${
          error ? 'border-risk' : 'border-border'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
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
