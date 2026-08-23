import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'on-dark' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-on-dark hover:bg-ink-soft',
  accent: 'bg-accent text-on-dark hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
  ghost: 'text-muted hover:bg-line-soft hover:text-ink',
  'on-dark': 'border border-muted text-on-dark hover:border-faint',
  danger: 'bg-bad text-on-dark hover:brightness-90',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'gap-1.5 px-3 py-[7px] text-[12.5px]',
  md: 'gap-2 px-[18px] py-2 text-[13px]',
  lg: 'gap-2 px-[26px] py-[11px] text-[14px]',
};

const BASE =
  'inline-flex items-center justify-center rounded-md font-semibold transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
});

export type ButtonLinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, 'className'> & { disabled?: boolean };

/**
 * A link that looks like a button. Kept separate from Button so navigation
 * stays a real anchor — right-click, middle-click and keyboard all keep working.
 */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      {...props}
    />
  );
}
