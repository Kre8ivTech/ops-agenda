import Link from 'next/link';

/** ST-04: server-side pagination. */
export function Pagination({
  page,
  pageSize,
  total,
  buildHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-text-secondary m-0 text-[0.82rem]">
        {start}–{end} of {total}
      </p>
      <div className="flex gap-2">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={atStart}
          tabIndex={atStart ? -1 : undefined}
          className={`border-border inline-flex h-9 items-center rounded-[8px] border bg-white px-3.5 text-[0.82rem] font-extrabold ${
            atStart ? 'pointer-events-none opacity-45' : 'text-ink hover:border-ink'
          }`}
        >
          Previous
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={atEnd}
          tabIndex={atEnd ? -1 : undefined}
          className={`border-border inline-flex h-9 items-center rounded-[8px] border bg-white px-3.5 text-[0.82rem] font-extrabold ${
            atEnd ? 'pointer-events-none opacity-45' : 'text-ink hover:border-ink'
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
