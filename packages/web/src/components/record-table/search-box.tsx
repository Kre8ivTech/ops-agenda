'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';

/** ST-04: server-side search — debounces into a `q` query param, resets `page`. */
export function SearchBox({
  paramName = 'q',
  placeholder = 'Search tasks',
}: {
  paramName?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialValue = searchParams.get(paramName) ?? '';

  function handleChange(next: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set(paramName, next);
      else params.delete(paramName);
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
  }

  return (
    <label className="border-border focus-within:border-signal flex h-[42px] w-full max-w-xs items-center gap-2 rounded-[8px] border bg-white px-3">
      <span className="sr-only">Search tasks by title</span>
      <input
        // Remounts (and re-syncs its uncontrolled value) whenever the URL's
        // search term changes some other way, e.g. a filter chip resets it.
        key={initialValue}
        type="search"
        defaultValue={initialValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="text-ink placeholder:text-text-secondary/60 w-full bg-transparent text-[0.88rem] outline-none"
      />
    </label>
  );
}
