import { cn } from '@/lib/cn';

/**
 * The icon set transcribed from the design canvas. All glyphs are drawn on a
 * 16x16 grid with a 1.6 stroke, so they stay optically consistent at any size.
 */
export type IconName =
  | 'grid'
  | 'book'
  | 'clock'
  | 'pencil'
  | 'trend'
  | 'alert'
  | 'bookmark'
  | 'sparkle'
  | 'sparkles'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'check'
  | 'flag'
  | 'flag-filled'
  | 'arrow-right'
  | 'arrow-up'
  | 'calendar'
  | 'menu'
  | 'close'
  | 'plus';

const PATHS: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </>
  ),
  book: (
    <>
      <path d="M8 3.5C6.5 2.3 4.5 2 2 2v10.5c2.5 0 4.5.3 6 1.5 1.5-1.2 3.5-1.5 6-1.5V2c-2.5 0-4.5.3-6 1.5z" />
      <path d="M8 3.5V14" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.3 1.5" />
    </>
  ),
  pencil: <path d="M11.5 2.5l2 2L5 13l-2.7.7.7-2.7 8.5-8.5z" />,
  trend: (
    <>
      <path d="M2 12l4-4 3 3 5-6" />
      <path d="M10 5h4v4" />
    </>
  ),
  alert: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </>
  ),
  bookmark: <path d="M4 2h8v12l-4-2.5L4 14V2z" />,
  sparkle: <path d="M8 2l1.2 3.4L12.6 6.6 9.2 7.8 8 11.2 6.8 7.8 3.4 6.6l3.4-1.2L8 2z" />,
  sparkles: (
    <>
      <path d="M8 2l1.2 3.4L12.6 6.6 9.2 7.8 8 11.2 6.8 7.8 3.4 6.6l3.4-1.2L8 2z" />
      <path d="M13 10.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" />
    </>
  ),
  'chevron-left': <path d="M10 3L5 8l5 5" />,
  'chevron-right': <path d="M6 3l5 5-5 5" />,
  'chevron-down': <path d="M4 6.5L8 10.5 12 6.5" />,
  check: <path d="M2.5 8.5L6 12 13.5 4" />,
  flag: (
    <>
      <path d="M3.5 2v12" />
      <path d="M3.5 2.5h8l-2 3 2 3h-8" />
    </>
  ),
  'flag-filled': <path d="M3.5 2v12h1V8.5h8l-2-3 2-3h-9z" fill="currentColor" stroke="none" />,
  'arrow-right': <path d="M3 8h10M9 4l4 4-4 4" />,
  'arrow-up': <path d="M8 13V3M4 7l4-4 4 4" />,
  calendar: (
    <>
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" />
    </>
  ),
  menu: <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  plus: <path d="M8 3v10M3 8h10" />,
};

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'children'> {
  name: IconName;
  size?: number;
  /**
   * Accessible name. Omit for icons that only decorate a text label — the
   * default is aria-hidden, which is correct for the overwhelming majority.
   */
  title?: string;
}

export function Icon({ name, size = 16, title, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
