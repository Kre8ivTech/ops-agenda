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
          Manage encrypted API keys for platform services. All secrets are encrypted at rest with AES-256-GCM.
        </p>
      </div>

      {/* Setup guides */}
      <details className="border-border rounded-[8px] border bg-white">
        <summary className="text-ink cursor-pointer px-5 py-3.5 text-[0.9rem] font-extrabold">
          📖 Setup Instructions by Provider
        </summary>
        <div className="border-border divide-border divide-y border-t px-5">
          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">Stripe</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For payment processing. Use a <strong>Restricted key</strong> with only the permissions Ops Agenda needs.
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">Stripe Dashboard → API Keys</a></li>
              <li>Click <strong>Create restricted key</strong> → name it &quot;Ops Agenda&quot;</li>
              <li>Grant: <code>Charges: Read</code>, <code>Customers: Read</code>, <code>Subscriptions: Read+Write</code></li>
              <li>Copy the key and paste below as: <code>{`{"api_key": "rk_live_..."}`}</code></li>
            </ol>
          </div>

          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">AWS Bedrock</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For AI model access. The ECS task role already has Bedrock access — this credential is only needed if calling from outside AWS.
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://console.aws.amazon.com/iam/home#/security_credentials" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">AWS IAM → Security Credentials</a></li>
              <li>Create an access key for an IAM user with <code>bedrock:InvokeModel</code> permission</li>
              <li>Paste as: <code>{`{"access_key_id": "AKIA...", "secret_access_key": "...", "region": "us-east-1"}`}</code></li>
            </ol>
            <p className="text-text-secondary m-0 mt-2 text-[0.78rem]">
              💡 <strong>Tip:</strong> If running on ECS, skip this — the task IAM role handles auth automatically.
            </p>
          </div>

          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">Office 365 (Microsoft)</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For email and calendar OAuth. Requires an Azure AD app registration.
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">Azure Portal → App Registrations</a></li>
              <li>Click <strong>New registration</strong> → name &quot;Ops Agenda&quot; → Accounts in any org (multitenant)</li>
              <li>Add redirect URI: <code>https://app.opsagenda.com/api/connectors/callback</code> (Web platform)</li>
              <li>Go to <strong>Certificates &amp; secrets</strong> → New client secret → copy the Value</li>
              <li>Go to <strong>API permissions</strong> → Add: <code>Mail.Read</code>, <code>Calendars.Read</code> (delegated)</li>
              <li>Copy the Application (client) ID from the Overview page</li>
              <li>Paste as: <code>{`{"client_id": "xxxxxxxx-...", "client_secret": "..."}`}</code></li>
            </ol>
          </div>

          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">Google Workspace</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For Gmail and Google Calendar OAuth. Requires a Google Cloud project with OAuth consent screen.
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">Google Cloud Console → Credentials</a></li>
              <li>Click <strong>Create Credentials → OAuth client ID</strong> → Web application</li>
              <li>Add authorized redirect URI: <code>https://app.opsagenda.com/api/connectors/callback</code></li>
              <li>Enable APIs: <a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">Gmail API</a> + <a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">Calendar API</a></li>
              <li>Set up the <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">OAuth consent screen</a> (external, add scopes: gmail.readonly, calendar.readonly)</li>
              <li>Paste as: <code>{`{"client_id": "xxxx.apps.googleusercontent.com", "client_secret": "GOCSPX-..."}`}</code></li>
            </ol>
          </div>

          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">Plaid</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For banking and financial data access (account balances, transactions).
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://dashboard.plaid.com/developers/keys" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">Plaid Dashboard → Keys</a></li>
              <li>Copy your <code>client_id</code> and <code>secret</code> (use Sandbox for testing, Production for live)</li>
              <li>Paste as: <code>{`{"client_id": "...", "secret": "...", "environment": "sandbox"}`}</code></li>
            </ol>
          </div>

          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">OpenAI</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For GPT model access (alternative to Bedrock/Anthropic).
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">OpenAI Platform → API Keys</a></li>
              <li>Create a new secret key → copy it</li>
              <li>Paste as: <code>{`{"api_key": "sk-proj-..."}`}</code></li>
            </ol>
          </div>

          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">Anthropic</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For Claude model access (powers task classification, daily briefs, and Ask).
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">Anthropic Console → API Keys</a></li>
              <li>Create a new key → copy it</li>
              <li>Paste as: <code>{`{"api_key": "sk-ant-api03-..."}`}</code></li>
            </ol>
            <p className="text-text-secondary m-0 mt-2 text-[0.78rem]">
              ⚡ <strong>Required for AI features:</strong> After adding this key, link it to the &quot;Claude Sonnet 4&quot; model in <a href="/admin/ai/models" className="text-signal hover:text-ink font-bold">AI → Models</a>.
            </p>
          </div>

          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">SendGrid</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For transactional email delivery (notifications, alerts, brief emails).
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">SendGrid → API Keys</a></li>
              <li>Create key with <strong>Restricted Access</strong> → Mail Send: Full Access</li>
              <li>Paste as: <code>{`{"api_key": "SG...."}`}</code></li>
            </ol>
          </div>

          <div className="py-4">
            <h3 className="text-ink m-0 mb-1.5 text-[0.85rem] font-extrabold">Twilio</h3>
            <p className="text-text-secondary m-0 mb-2 text-[0.82rem] leading-[1.5]">
              For SMS notifications (critical alerts, MFA codes).
            </p>
            <ol className="text-text-secondary m-0 list-decimal pl-5 text-[0.82rem] leading-[1.7]">
              <li>Go to <a href="https://console.twilio.com/" target="_blank" rel="noopener" className="text-signal hover:text-ink font-bold">Twilio Console</a></li>
              <li>Copy your Account SID and Auth Token from the dashboard</li>
              <li>Paste as: <code>{`{"account_sid": "AC...", "auth_token": "...", "from_number": "+1..."}`}</code></li>
            </ol>
          </div>
        </div>
      </details>

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
