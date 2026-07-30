'use client';

import { useFormState } from 'react-dom';
import { onboardTenant } from '@/lib/onboarding/actions';

export function OnboardingForm() {
  const [state, action, isPending] = useFormState(async (_prev: unknown, formData: FormData) => {
    return onboardTenant({
      accountName: formData.get('accountName') as string,
      userEmail: formData.get('userEmail') as string,
      userName: formData.get('userName') as string,
    });
  }, null);

  return (
    <>
      <form action={action} className="space-y-4">
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
          disabled={isPending}
          className="w-full rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? 'Creating…' : 'Create workspace'}
        </button>
      </form>
      {state ? (
        <div className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-medium">Workspace created</p>
          <p className="mt-1 break-all">account_id: {state.account.id}</p>
          <p className="break-all">user_id: {state.user.id}</p>
          <p className="mt-2 text-green-800">
            In a full flow the Cognito sub would be linked and the session updated.
          </p>
        </div>
      ) : null}
    </>
  );
}
