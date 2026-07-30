export default function TasksLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1400px] flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2">
        <div className="bg-wash h-3 w-24 animate-pulse rounded-full" />
        <div className="bg-wash h-7 w-40 animate-pulse rounded-[8px]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-border bg-wash h-[86px] animate-pulse rounded-[8px] border" />
        ))}
      </div>
      <div className="border-border grid divide-y divide-border rounded-[8px] border bg-white">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[68px] animate-pulse bg-white p-4">
            <div className="bg-wash h-4 w-2/3 rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading tasks…</span>
    </div>
  );
}
