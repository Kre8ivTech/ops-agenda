import Link from 'next/link';

const COMING = [
  { label: 'Profile', note: 'Name, timezone, locale' },
  { label: 'Modules', note: 'Enable / disable plan-gated modules' },
  { label: 'Security', note: 'MFA, devices, step-up' },
  { label: 'Integrations', note: 'Connector health and reconnect' },
  { label: 'Notifications', note: 'Brief and alert preferences' },
  { label: 'Billing', note: 'Plan and Stripe Checkout' },
] as const;

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">Settings</p>
      <h1 className="m-0 text-[1.7rem] font-extrabold tracking-[-0.02em] text-ink">
        Workspace settings
      </h1>
      <p className="mt-3 m-0 max-w-[62ch] text-[0.95rem] leading-[1.5] text-text-secondary">
        Settings screens land with each Phase 1–3 capability. Sign out from the sidebar.
      </p>
      <ul className="mt-6 divide-y divide-border rounded-[8px] border border-border bg-white">
        {COMING.map((item) => (
          <li key={item.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span className="font-bold text-ink">{item.label}</span>
            <span className="text-[0.82rem] text-text-secondary">{item.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.88rem] text-text-secondary">
        Need a workspace?{' '}
        <Link href="/onboarding" className="font-extrabold text-signal hover:text-ink">
          Continue onboarding
        </Link>
      </p>
    </div>
  );
}
