import { cn } from '@/lib/cn';

export type CardTone = 'default' | 'dark' | 'sunken' | 'accent' | 'raised';

const TONES: Record<CardTone, string> = {
  default: 'bg-surface border border-line shadow-card',
  dark: 'bg-ink text-on-dark',
  sunken: 'bg-sunken border border-line-soft',
  accent: 'bg-accent-soft border border-accent-soft-line',
  raised: 'bg-surface border-[1.5px] border-line-strong shadow-pop',
};

export type CardElement = 'div' | 'section' | 'article' | 'li';

export type CardProps<E extends CardElement = 'div'> = {
  tone?: CardTone;
  /** Use `section` or `article` when the card is a landmark in the page. */
  as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, 'as'>;

export function Card<E extends CardElement = 'div'>({ tone = 'default', as, className, ...props }: CardProps<E>) {
  const Tag = (as ?? 'div') as React.ElementType;
  return <Tag className={cn('rounded-2xl', TONES[tone], className as string | undefined)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-baseline justify-between gap-4', className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  as: Tag = 'h2',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' }) {
  return <Tag className={cn('font-display text-[15px] font-semibold', className)} {...props} />;
}

export function CardNote({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs font-medium text-faint', className)} {...props} />;
}

/** A muted footnote separated by a hairline, as used on the analysis cards. */
export function CardFootnote({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 border-t border-line-soft pt-3 text-xs leading-relaxed text-faint', className)}
      {...props}
    />
  );
}
