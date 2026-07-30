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
      <span className="text-ink flex items-baseline justify-between gap-3 text-[0.8rem] font-extrabold">
        <span>{label}</span>
        {labelAside}
      </span>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`text-ink placeholder:text-text-secondary/55 focus:border-signal h-[46px] w-full rounded-[8px] border bg-white px-[13px] outline-none transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_var(--wash-green)] ${
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
