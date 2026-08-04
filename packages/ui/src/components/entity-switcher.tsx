/**
 * Entity switcher stub — persistence and scoping land with multi-entity Phase 1 polish.
 */
export function EntitySwitcher() {
  return (
    <label className="text-text-secondary inline-flex items-center gap-2 text-[0.82rem]">
      <span className="text-ink font-extrabold">Entity</span>
      <select
        className="border-border text-ink focus:border-signal h-9 rounded-[8px] border bg-white px-3 text-[0.83rem] font-extrabold outline-none focus:shadow-[0_0_0_3px_var(--wash-green)]"
        defaultValue="personal"
        aria-label="Entity switcher"
      >
        <option value="personal">Personal</option>
      </select>
    </label>
  );
}
