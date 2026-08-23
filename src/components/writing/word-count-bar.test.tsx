import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WordCountBar } from './word-count-bar';

describe('WordCountBar', () => {
  it('shows the count against the requirement', () => {
    render(<WordCountBar count={186} minWords={250} />);

    expect(screen.getByText('186')).toBeInTheDocument();
    expect(screen.getByText('/ 250 words')).toBeInTheDocument();
  });

  it('reports progress toward the requirement', () => {
    render(<WordCountBar count={125} minWords={250} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('caps at full once the requirement is met rather than overflowing', () => {
    render(<WordCountBar count={400} minWords={250} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('announces how many words remain while short', () => {
    render(<WordCountBar count={200} minWords={250} />);
    expect(screen.getByText('50 words to go')).toBeInTheDocument();
  });

  it('announces that the requirement is met', () => {
    render(<WordCountBar count={250} minWords={250} />);
    expect(screen.getByText('Word requirement met')).toBeInTheDocument();
  });

  it('handles an empty essay without dividing by zero', () => {
    render(<WordCountBar count={0} minWords={250} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
