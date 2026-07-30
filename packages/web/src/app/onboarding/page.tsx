import { OnboardingForm } from '@/components/onboarding-form';

export default function OnboardingPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="w-full max-w-md rounded border border-zinc-200 p-8 dark:border-zinc-800">
        <h1 className="mb-2 text-xl font-semibold">Create your workspace</h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Phase 1 onboarding shell — seeds a tenant account, admin user, and enables Productivity.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
