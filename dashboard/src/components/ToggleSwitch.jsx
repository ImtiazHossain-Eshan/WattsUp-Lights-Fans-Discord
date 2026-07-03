/**
 * Accessible on/off switch (CSS slider). Controlled: renders `checked`, calls
 * `onChange(nextValue)` on click. `busy` disables it during an in-flight request.
 */
export default function ToggleSwitch({
  checked,
  onChange,
  busy = false,
  label,
  size = "sm",
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch switch--${size}`}
      disabled={busy}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
      {label && <span className="switch-label">{label}</span>}
    </button>
  );
}
