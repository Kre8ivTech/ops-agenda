/**
 * Entity switcher stub — persistence and scoping land with multi-entity Phase 1 polish.
 */
export function EntitySwitcher() {
  return (
    <label className="inline-flex items-center gap-2 text-[0.82rem] text-text-secondary">
      <span className="font-extrabold text-ink">Entity</span>
      <select
        className="h-9 rounded-[8px] border border-border bg-white px-3 text-[0.83rem] font-extrabold text-ink outline-none focus:border-signal focus:shadow-[0_0_0_3px_var(--wash-green)]"
        defaultValue="personal"
        aria-label="Entity switcher"
      >
        <option value="personal">Personal</option>
      </select>
    </label>
  );
}
