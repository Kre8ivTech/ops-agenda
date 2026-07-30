import type { InputHTMLAttributes, ReactNode } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: ReactNode;
  labelAside?: ReactNode;
  error?: string;
}

export function TextField({
  id,
  label,
  hint,
  labelAside,
  error,
  className = '',
  ...props
}: TextFieldProps) {
  const fieldId = id ?? props.name;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline justify-between gap-3 text-[0.8rem] font-extrabold text-ink">
        <span>{label}</span>
        {labelAside}
      </span>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-[46px] w-full rounded-[8px] border bg-white px-[13px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-text-secondary/55 focus:border-signal focus:shadow-[0_0_0_3px_var(--wash-green)] ${
          error ? 'border-risk' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error ? (
        <span id={`${fieldId}-error`} className="text-[0.78rem] text-risk">
          {error}
        </span>
      ) : hint ? (
        <span id={`${fieldId}-hint`} className="text-[0.78rem] text-text-secondary">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
