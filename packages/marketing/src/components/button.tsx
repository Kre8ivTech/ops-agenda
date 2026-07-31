import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';
type Size = 'large' | 'medium';

const VARIANT: Record<Variant, string> = {
  primary: 'border-transparent bg-ink text-white hover:bg-signal',
  secondary: 'border-border bg-white text-ink hover:border-ink',
  quiet: 'border-transparent bg-wash text-ink hover:bg-wash-green',
};

const SIZE: Record<Size, string> = {
  large: 'h-12 rounded-[8px] px-5 text-[0.95rem] font-extrabold',
  medium: 'h-10 rounded-[8px] px-4 text-[0.85rem] font-extrabold',
};

const BASE =
  'inline-flex items-center justify-center gap-2.5 border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal';

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
