import { onboardTenant } from '@/lib/onboarding/actions';

export function OnboardingForm() {
  return (
    <form action={onboardTenant} className="space-y-4">
      <div>
        <label htmlFor="accountName" className="block text-sm font-medium">
          Workspace name
        </label>
        <input
          id="accountName"
          name="accountName"
          type="text"
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        />
      </div>
      <div>
        <label htmlFor="userName" className="block text-sm font-medium">
          Your name
        </label>
        <input
          id="userName"
          name="userName"
          type="text"
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        />
      </div>
      <div>
        <label htmlFor="userEmail" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="userEmail"
          name="userEmail"
          type="email"
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Create workspace
      </button>
    </form>
  );
}
