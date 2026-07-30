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
      <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Settings</p>
      <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
        Workspace settings
      </h1>
      <p className="text-text-secondary m-0 mt-3 max-w-[62ch] text-[0.95rem] leading-[1.5]">
        Settings screens land with each Phase 1–3 capability. Sign out from the sidebar.
      </p>
      <ul className="divide-border border-border mt-6 divide-y rounded-[8px] border bg-white">
        {COMING.map((item) => (
          <li key={item.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span className="text-ink font-bold">{item.label}</span>
            <span className="text-text-secondary text-[0.82rem]">{item.note}</span>
          </li>
        ))}
      </ul>
      <p className="text-text-secondary mt-4 text-[0.88rem]">
        Need a workspace?{' '}
        <Link href="/onboarding" className="text-signal hover:text-ink font-extrabold">
          Continue onboarding
        </Link>
      </p>
    </div>
  );
}
