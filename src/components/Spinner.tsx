import './Spinner.css';

interface SpinnerProps {
  /** Visual size in px. Defaults to 16 (inline) — use 24+ for block loaders. */
  size?: number;
  /** Accessible label announced to screen readers. */
  label?: string;
}

export function Spinner({ size = 16, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      className="spinner"
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    />
  );
}
