import {
  listIntegrationCredentials,
  createIntegrationCredential,
  deleteIntegrationCredential,
  testIntegrationCredential,
  updateIntegrationCredential,
} from '@/lib/admin/integrations-actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SelectField } from '@/components/ui/select';

const PROVIDER_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  aws_bedrock: 'AWS Bedrock',
  office365: 'Office 365',
  google_workspace: 'Google Workspace',
  plaid: 'Plaid',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  sendgrid: 'SendGrid',
  twilio: 'Twilio',
  custom: 'Custom',
};

const PROVIDER_OPTIONS = Object.entries(PROVIDER_LABELS) as [string, string][];

const testResultColor: Record<string, string> = {
  ok: 'bg-wash-green text-signal',
  decrypt_failed: 'bg-risk-wash text-ink',
};

export default async function AdminIntegrationsPage() {
  const credentials = await listIntegrationCredentials();

  async function handleCreate(formData: FormData) {
    'use server';
    const provider = formData.get('provider') as string;
    const label = formData.get('label') as string;
    const secret = formData.get('secret') as string;
    await createIntegrationCredential({ provider: provider as 'stripe' | 'aws_bedrock' | 'office365' | 'google_workspace' | 'plaid' | 'openai' | 'anthropic' | 'sendgrid' | 'twilio' | 'custom', label, secret });
  }

  async function handleTest(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await testIntegrationCredential({ id });
  }

  async function handleToggle(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const enabled = formData.get('enabled') === 'true';
    await updateIntegrationCredential({ id, enabled: !enabled });
  }

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteIntegrationCredential({ id });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Integrations</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Integration Credentials
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Manage encrypted API keys for platform services.
        </p>
      </div>

      {/* Add new credential form */}
      <form action={handleCreate} className="border-border rounded-[8px] border bg-white p-5">
        <p className="text-ink mb-4 text-[0.9rem] font-extrabold">Add new credential</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Provider" name="provider" required>
            <option value="">Select provider…</option>
            {PROVIDER_OPTIONS.map(([value, display]) => (
              <option key={value} value={value}>
                {display}
              </option>
            ))}
          </SelectField>
          <TextField label="Label" name="label" placeholder="e.g. Production key" required />
          <TextField
            label="Secret (API key / JSON)"
            name="secret"
            placeholder='{"api_key": "sk-..."}'
            required
          />
        </div>
        <div className="mt-4">
          <Button type="submit" size="medium">
            Add Credential
          </Button>
        </div>
      </form>

      {/* Credentials table */}
      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">Provider</th>
              <th className="px-4 py-3 font-extrabold text-ink">Label</th>
              <th className="px-4 py-3 font-extrabold text-ink">Enabled</th>
              <th className="px-4 py-3 font-extrabold text-ink">Last Test</th>
              <th className="px-4 py-3 font-extrabold text-ink">Created</th>
              <th className="px-4 py-3 font-extrabold text-ink">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {credentials.map((cred) => (
              <tr key={cred.id}>
                <td className="px-4 py-3 font-bold text-ink">
                  {PROVIDER_LABELS[cred.provider] ?? cred.provider}
                </td>
                <td className="px-4 py-3 text-text-secondary">{cred.label}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                      cred.enabled ? 'bg-wash-green text-signal' : 'bg-risk-wash text-ink'
                    }`}
                  >
                    {cred.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {cred.lastTestResult ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                        testResultColor[cred.lastTestResult] ?? 'bg-wash text-text-secondary'
                      }`}
                    >
                      {cred.lastTestResult}
                    </span>
                  ) : (
                    <span className="text-text-secondary">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                  {cred.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <form action={handleTest}>
                      <input type="hidden" name="id" value={cred.id} />
                      <Button type="submit" variant="quiet" size="small">
                        Test
                      </Button>
                    </form>
                    <form action={handleToggle}>
                      <input type="hidden" name="id" value={cred.id} />
                      <input type="hidden" name="enabled" value={String(cred.enabled)} />
                      <Button type="submit" variant="secondary" size="small">
                        {cred.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </form>
                    <form action={handleDelete}>
                      <input type="hidden" name="id" value={cred.id} />
                      <Button type="submit" variant="ghost" size="small">
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {credentials.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-text-secondary">
                  No credentials configured yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
