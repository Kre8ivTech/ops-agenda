import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SelectField } from '@/components/ui/select';
import {
  createPlaidLinkToken,
  completePlaidLink,
  connectMonarch,
  createManualAccount,
} from '@/lib/finances/connect-actions';
import { importCsvTransactions } from '@/lib/finances/sync';
import { listAccounts } from '@/lib/finances/actions';

// ---------------------------------------------------------------------------
// Server Actions (form handlers)
// ---------------------------------------------------------------------------

async function handlePlaidConnect() {
  'use server';
  const result = await createPlaidLinkToken();
  if ('error' in result) {
    // In a real flow the link token would be passed to the client-side Plaid Link SDK.
    // For now we just surface errors server-side.
    throw new Error(result.error);
  }
  // The linkToken would be used client-side with Plaid Link.
  // This server action is a placeholder for triggering the flow.
}

async function handleMonarchConnect(formData: FormData) {
  'use server';
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  if (!email || !password) throw new Error('Email and password are required');
  const result = await connectMonarch({ email, password });
  if (!result.success) throw new Error(result.error ?? 'Connection failed');
}

async function handleCsvUpload(formData: FormData) {
  'use server';
  const accountId = formData.get('accountId') as string;
  const file = formData.get('file') as File | null;
  if (!accountId) throw new Error('Please select an account');
  if (!file) throw new Error('Please select a CSV file');
  const csvContent = await file.text();
  const result = await importCsvTransactions({ accountId, csvContent });
  if (result.errors.length > 0) {
    throw new Error(`Imported ${result.imported} rows with errors: ${result.errors.slice(0, 3).join('; ')}`);
  }
}

async function handleManualAccount(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const institution = (formData.get('institution') as string) || undefined;
  const kind = formData.get('kind') as string;
  const balanceStr = formData.get('balance') as string;
  const entityName = (formData.get('entityName') as string) || undefined;

  if (!name || !kind) throw new Error('Name and account type are required');
  const balance = parseFloat(balanceStr ?? '0');
  if (isNaN(balance)) throw new Error('Invalid balance value');

  const result = await createManualAccount({ name, institution, kind, balance, entityName });
  if (!result.success) throw new Error(result.error ?? 'Failed to create account');
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function FinancesConnectPage() {
  let accounts: { id: string; name: string }[] = [];
  try {
    const allAccounts = await listAccounts();
    accounts = allAccounts.map((a) => ({ id: a.id, name: a.name }));
  } catch {
    /* DB unavailable — render with empty account list */
  }

  return (
    <div className="min-w-0 flex-1">
      {/* Header */}
      <header className="mb-6">
        <p className="text-signal mb-1 text-[0.76rem] font-extrabold uppercase">Finances</p>
        <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">
          Connect Account
        </h1>
        <p className="text-text-secondary m-0 mt-1 text-[0.85rem]">
          Link a bank account, credit card, or upload transactions manually.
        </p>
      </header>

      {/* Provider Cards Grid */}
      <div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Plaid Card */}
        <div className="border-border rounded-xl border bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Bank">🏦</span>
            <h2 className="text-ink text-[1.05rem] font-bold">Plaid</h2>
          </div>
          <p className="text-text-secondary mb-4 text-[0.85rem] leading-relaxed">
            Connect bank accounts instantly via Plaid. Supports 12,000+ institutions.
          </p>
          <form action={handlePlaidConnect}>
            <Button type="submit">Connect with Plaid</Button>
          </form>
          <p className="text-text-secondary mt-3 text-[0.75rem] italic">
            Plaid integration requires PLAID_CLIENT_ID and PLAID_SECRET environment variables.
          </p>
        </div>

        {/* Monarch Money Card */}
        <div className="border-border rounded-xl border bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Crown">👑</span>
            <h2 className="text-ink text-[1.05rem] font-bold">Monarch Money</h2>
          </div>
          <p className="text-text-secondary mb-4 text-[0.85rem] leading-relaxed">
            Sync from your Monarch Money account — accounts, transactions, budgets.
          </p>
          <form action={handleMonarchConnect} className="space-y-3">
            <TextField
              name="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              required
            />
            <Button type="submit">Connect</Button>
          </form>
        </div>

        {/* Manual Upload Card */}
        <div className="border-border rounded-xl border bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Document">📄</span>
            <h2 className="text-ink text-[1.05rem] font-bold">Manual Upload</h2>
          </div>
          <p className="text-text-secondary mb-4 text-[0.85rem] leading-relaxed">
            Upload a CSV or OFX file from your bank statement.
          </p>
          <form action={handleCsvUpload} className="space-y-3">
            <SelectField name="accountId" label="Account" required>
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </SelectField>
            <div>
              <label
                htmlFor="csv-file"
                className="text-ink mb-1 block text-[0.82rem] font-medium"
              >
                File
              </label>
              <input
                id="csv-file"
                name="file"
                type="file"
                accept=".csv,.ofx"
                required
                className="border-border text-text-secondary block w-full rounded-lg border px-3 py-2 text-[0.85rem]"
              />
            </div>
            <Button type="submit">Upload</Button>
          </form>
        </div>
      </div>

      {/* Create Manual Account */}
      <section className="border-border max-w-lg rounded-xl border bg-white p-6">
        <h2 className="text-ink mb-4 text-[1.1rem] font-bold">Create Manual Account</h2>
        <form action={handleManualAccount} className="space-y-4">
          <TextField
            name="name"
            label="Account Name"
            placeholder="e.g. Business Checking"
            required
          />
          <TextField
            name="institution"
            label="Institution"
            placeholder="e.g. Chase Bank"
          />
          <SelectField name="kind" label="Account Type" required>
            <option value="">Select type…</option>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit_card">Credit Card</option>
            <option value="investment">Investment</option>
            <option value="tax">Tax</option>
          </SelectField>
          <TextField
            name="balance"
            label="Current Balance ($)"
            type="number"
            placeholder="0.00"
            required
          />
          <TextField
            name="entityName"
            label="Entity Name (optional)"
            placeholder="e.g. My LLC"
          />
          <Button type="submit">Create Account</Button>
        </form>
      </section>
    </div>
  );
}
