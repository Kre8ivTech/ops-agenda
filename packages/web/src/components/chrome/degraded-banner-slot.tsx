'use client';

import { useSearchParams } from 'next/navigation';

import { DegradedBanner } from '@/components/chrome/degraded-banner';

/** Reads `?banner=1` so QA can force the placeholder without wiring connector health. */
export function DegradedBannerSlot() {
  const params = useSearchParams();
  return <DegradedBanner show={params.get('banner') === '1'} />;
}
