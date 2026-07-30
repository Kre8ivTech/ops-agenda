import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet' | 'ghost';
type Size = 'large' | 'medium' | 'small';

const VARIANT: Record<Variant, string> = {
  primary: 'border-transparent bg-ink text-white hover:bg-signal focus-visible:outline-signal',
  secondary: 'border-border bg-white text-ink hover:border-ink focus-visible:outline-signal',
  quiet: 'border-transparent bg-wash text-ink hover:bg-wash-green focus-visible:outline-signal',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:text-ink focus-visible:outline-signal',
};

const SIZE: Record<Size, string> = {
  large: 'h-12 rounded-[8px] px-5 text-[0.95rem] font-extrabold',
  medium: 'h-9 rounded-[8px] px-4 text-[0.83rem] font-extrabold',
  small: 'h-[34px] rounded-[7px] px-3 text-[0.82rem] font-extrabold',
};

const BASE =
  'inline-flex items-center justify-center gap-2.5 border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-55 disabled:pointer-events-none';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'large',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({
  variant = 'primary',
  size = 'large',
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`} {...props}>
      {children}
    </a>
  );
}
