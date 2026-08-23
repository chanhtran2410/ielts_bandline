import { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

const FIELD_BASE =
  'w-full rounded-md border bg-surface px-3 py-2 text-[13.5px] text-ink ' +
  'placeholder:text-faint transition-colors ' +
  'aria-[invalid=true]:border-bad';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  /** Hides the label visually but keeps it for assistive tech. */
  labelHidden?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode;
}

/**
 * Wires label, hint and error text to the control with the right aria
 * attributes, so accessible validation is the default rather than an add-on.
 */
export function Field({ label, hint, error, labelHidden, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? id + '-hint' : undefined;
  const errorId = error ? id + '-error' : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={id} className={cn('text-xs font-semibold text-muted', labelHidden && 'sr-only')}>
          {label}
        </label>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-bad">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface FieldExtras {
  label?: string;
  hint?: string;
  error?: string;
  labelHidden?: boolean;
  wrapperClassName?: string;
}

/** Splits the field-shell props out so the control keeps a clean DOM surface. */
function shellProps({ label, hint, error, labelHidden, wrapperClassName }: FieldExtras) {
  return {
    ...(label !== undefined && { label }),
    ...(hint !== undefined && { hint }),
    ...(error !== undefined && { error }),
    ...(labelHidden !== undefined && { labelHidden }),
    ...(wrapperClassName !== undefined && { className: wrapperClassName }),
  };
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & FieldExtras;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, labelHidden, className, wrapperClassName, ...props },
  ref,
) {
  return (
    <Field {...shellProps({ label, hint, error, labelHidden, wrapperClassName })}>
      {({ id, describedBy, invalid }) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(FIELD_BASE, 'border-line focus:border-line-strong', className)}
          {...props}
        />
      )}
    </Field>
  );
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldExtras;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, labelHidden, className, wrapperClassName, ...props },
  ref,
) {
  return (
    <Field {...shellProps({ label, hint, error, labelHidden, wrapperClassName })}>
      {({ id, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(FIELD_BASE, 'resize-y border-line leading-relaxed focus:border-line-strong', className)}
          {...props}
        />
      )}
    </Field>
  );
});

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & FieldExtras;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, labelHidden, className, wrapperClassName, children, ...props },
  ref,
) {
  return (
    <Field {...shellProps({ label, hint, error, labelHidden, wrapperClassName })}>
      {({ id, describedBy, invalid }) => (
        <select
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(FIELD_BASE, 'cursor-pointer border-line pr-8 font-medium', className)}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
});
