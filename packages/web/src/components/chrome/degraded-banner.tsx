/**
 * Connector health banner placeholder.
 * Hidden by default. Pass `show` or open any app route with `?banner=1` from the layout.
 */
export function DegradedBanner({ show = false }: { show?: boolean }) {
  if (!show) return null;

  return (
    <div
      role="status"
      className="border-border bg-risk-wash text-ink flex items-start gap-3 rounded-[8px] border px-3.5 py-3 text-[0.88rem] leading-[1.45]"
    >
      <span className="bg-risk mt-1.5 size-[7px] shrink-0 rounded-full" aria-hidden />
      <p className="m-0">
        Two accounts stopped returning calendar data at 4:12 AM. Reconnect from Settings →
        Integrations when connectors are live.
      </p>
    </div>
  );
}
