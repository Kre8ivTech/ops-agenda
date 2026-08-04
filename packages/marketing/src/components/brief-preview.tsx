import { BRIEF_ROWS } from '@/lib/marketing-content';
import { ACCENT_TONE, PILL_TONE } from '@/lib/tone';

/**
 * Illustrative mock of the 06:00 brief — not a live screenshot. Built from the
 * same tokens as the product so it reads as the real thing without claiming to
 * be a literal capture.
 */
export function BriefPreview() {
  return (
    <div className="border-border shadow-panel min-w-0 flex-[1.25_1_400px] overflow-hidden rounded-[10px] border bg-white">
      <div className="border-border bg-wash flex items-center justify-between gap-4 border-b px-5 py-[14px]">
        <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase leading-none tracking-[0.1em]">
          Tuesday 29 July · 14 items
        </span>
        <span className="text-text-secondary inline-flex items-center gap-[7px] text-[0.78rem]">
          <span className="bg-signal h-[7px] w-[7px] rounded-full shadow-[0_0_0_3px_var(--wash-green)]" />
          Generated 06:02
        </span>
      </div>

      <div className="p-5">
        {BRIEF_ROWS.map((row) => (
          <div
            key={row.title}
            className={`border-border mb-2.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[8px] border border-l-[3px] bg-white px-[14px] py-[13px] ${ACCENT_TONE[row.accent]}`}
          >
            <span
              className={`rounded-full px-[7px] py-1 font-mono text-[0.7rem] font-extrabold leading-none ${PILL_TONE[row.tone]}`}
            >
              {row.priority}
            </span>
            <span className="grid min-w-0 gap-[3px]">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.92rem] font-bold">
                {row.title}
              </span>
              <span className="text-text-secondary text-[0.8rem] leading-[1.4]">{row.why}</span>
            </span>
            <span
              className={`whitespace-nowrap text-[0.8rem] ${
                row.urgentMeta ? 'text-risk font-bold' : 'text-text-secondary'
              }`}
            >
              {row.meta}
            </span>
          </div>
        ))}

        <p className="border-border text-text-secondary m-0 mt-4 border-l-2 pl-3 text-[0.84rem] leading-[1.45]">
          Every flagged item explains itself in one sentence, traceable to the record it came from.
          If it cannot explain itself, it does not get flagged.
        </p>
      </div>
    </div>
  );
}
