import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createAccount } from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SelectField } from '@/components/ui/select';

export default function AdminCreateAccountPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const plan = formData.get('plan') as string;
    const newAccount = await createAccount({ name, plan: plan as 'trial' | 'starter' | 'pro' | 'enterprise' });
    redirect(`/admin/accounts/${newAccount.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-[0.82rem]">
        <Link href="/admin/accounts" className="text-signal hover:text-ink font-bold">
          ← Accounts
        </Link>
      </nav>

      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">
          Create account
        </p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          New tenant account
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Creates an empty account. Add users and enable modules from the detail page.
        </p>
      </div>

      <form action={handleCreate} className="border-border max-w-lg rounded-[8px] border bg-white p-6">
        <div className="grid gap-4">
          <TextField
            label="Account name"
            name="name"
            required
            placeholder="Acme Corp"
            data-testid="create-account-name"
          />
          <SelectField label="Plan" name="plan" defaultValue="trial">
            <option value="trial">Trial</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </SelectField>
          <div className="mt-2 flex gap-3">
            <Button type="submit" size="medium" data-testid="create-account-submit">
              Create account
            </Button>
            <Link href="/admin/accounts">
              <Button type="button" variant="secondary" size="medium">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
