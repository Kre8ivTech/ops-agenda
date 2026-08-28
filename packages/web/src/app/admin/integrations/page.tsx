import Link from 'next/link';
import {
  listIntegrationCredentials,
  createIntegrationCredential,
  deleteIntegrationCredential,
  testIntegrationCredential,
  updateIntegrationCredential,
  rotateIntegrationCredential,
} from '@/lib/admin/integrations-actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';

// ---------------------------------------------------------------------------
// Provider definitions with their required fields
// ---------------------------------------------------------------------------

interface ProviderField {
  name: string;
  label: string;
  type?: string;
  placeholder: string;
  required?: boolean;
}

interface ProviderDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  docsUrl: string;
  docsLabel: string;
  fields: ProviderField[];
  /** Non-secret metadata field names shown after configure (optional). */
  metadataHints?: string[];
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'stripe',
    label: 'Stripe',
    icon: '💳',
    description: 'Payment processing, subscriptions, and billing management.',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    docsLabel: 'Stripe Dashboard → API Keys',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        placeholder: 'sk_live_... or rk_live_...',
        required: true,
      },
      { name: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...' },
    ],
  },
  {
    id: 'aws_bedrock',
    label: 'AWS Bedrock',
    icon: '🧠',
    description:
      'AI model inference via Amazon Bedrock. Skip if running on ECS with IAM role access.',
    docsUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
    docsLabel: 'AWS IAM → Security Credentials',
    fields: [
      { name: 'access_key_id', label: 'Access Key ID', placeholder: 'AKIA...', required: true },
      {
        name: 'secret_access_key',
        label: 'Secret Access Key',
        type: 'password',
        placeholder: 'wJalr...',
        required: true,
      },
      { name: 'region', label: 'Region', placeholder: 'us-east-1' },
    ],
    metadataHints: ['region'],
  },
  {
    id: 'office365',
    label: 'Office 365',
    icon: '📧',
    description:
      'Microsoft Graph app credentials for tenant Outlook mail and calendar OAuth. PRD scopes: Mail.Read + Calendars.Read (existing connector grants may be wider — do not migrate without a deliberate re-consent).',
    docsUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    docsLabel: 'Azure Portal → App Registrations',
    fields: [
      {
        name: 'client_id',
        label: 'Application (Client) ID',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true,
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
      },
      { name: 'tenant_id', label: 'Tenant ID', placeholder: 'common (for multitenant)' },
    ],
  },
  {
    id: 'google_workspace',
    label: 'Google Workspace',
    icon: '📬',
    description: 'Gmail and Google Calendar access via Google OAuth app credentials.',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    docsLabel: 'Google Cloud Console → Credentials',
    fields: [
      {
        name: 'client_id',
        label: 'Client ID',
        placeholder: 'xxxx.apps.googleusercontent.com',
        required: true,
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'GOCSPX-...',
        required: true,
      },
    ],
  },
  {
    id: 'plaid',
    label: 'Plaid',
    icon: '🏦',
    description: 'Banking data — account balances, transactions, and financial connections.',
    docsUrl: 'https://dashboard.plaid.com/developers/keys',
    docsLabel: 'Plaid Dashboard → Keys',
    fields: [
      { name: 'client_id', label: 'Client ID', placeholder: '5f3c...', required: true },
      { name: 'secret', label: 'Secret', type: 'password', placeholder: '...', required: true },
      {
        name: 'environment',
        label: 'Environment',
        placeholder: 'sandbox | development | production',
      },
    ],
    metadataHints: ['environment'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    icon: '🤖',
    description: 'Claude AI models — powers task classification, daily briefs, and Ask.',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'Anthropic Console → API Keys',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-ant-api03-...',
        required: true,
      },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    icon: '✨',
    description: 'GPT models — alternative AI provider for classification and generation.',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'OpenAI Platform → API Keys',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-proj-...',
        required: true,
      },
      { name: 'org_id', label: 'Organization ID (optional)', placeholder: 'org-...' },
    ],
  },
  {
    id: 'sendgrid',
    label: 'SendGrid',
    icon: '📤',
    description: 'Transactional email delivery for notifications, alerts, and daily briefs.',
    docsUrl: 'https://app.sendgrid.com/settings/api_keys',
    docsLabel: 'SendGrid → API Keys',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'SG....',
        required: true,
      },
      { name: 'from_email', label: 'From Email', placeholder: 'noreply@opsagenda.com' },
      { name: 'from_name', label: 'From Name', placeholder: 'Ops Agenda' },
    ],
    metadataHints: ['from_email', 'from_name'],
  },
  {
    id: 'twilio',
    label: 'Twilio',
    icon: '📱',
    description: 'SMS and voice for critical alerts and MFA.',
    docsUrl: 'https://console.twilio.com/',
    docsLabel: 'Twilio Console',
    fields: [
      { name: 'account_sid', label: 'Account SID', placeholder: 'AC...', required: true },
      {
        name: 'auth_token',
        label: 'Auth Token',
        type: 'password',
        placeholder: '...',
        required: true,
      },
      { name: 'from_number', label: 'From Number', placeholder: '+1234567890' },
    ],
    metadataHints: ['from_number'],
  },
];

const PROVIDER_LABELS: Record<string, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p.label]),
);

const testResultColor: Record<string, string> = {
  ok: 'bg-wash-green text-signal',
  decrypt_failed: 'bg-risk-wash text-ink',
  auth_failed: 'bg-risk-wash text-ink',
  network_error: 'bg-[#fff3cd] text-[#856404]',
  misconfigured: 'bg-[#fff3cd] text-[#856404]',
};

function metadataDetail(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const detail = (metadata as Record<string, unknown>).lastTestDetail;
  return typeof detail === 'string' ? detail : null;
}

export default async function AdminIntegrationsPage() {
  const credentials = await listIntegrationCredentials();

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteIntegrationCredential({ id });
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

  async function handleRotate(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const providerId = formData.get('provider') as string;
    const provider = PROVIDERS.find((p) => p.id === providerId);
    if (!provider) throw new Error('Unknown provider');

    const fields: Record<string, string> = {};
    for (const field of provider.fields) {
      const val = formData.get(field.name) as string | null;
      if (val?.trim()) fields[field.name] = val.trim();
    }
    if (Object.keys(fields).length === 0) {
      throw new Error('Provide at least one secret field to rotate');
    }
    await rotateIntegrationCredential({ id, secret: JSON.stringify(fields) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Integrations</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Platform Integrations
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Platform-wide OAuth app credentials and API keys used by Ops Agenda itself. All secrets
          are encrypted at rest (AES-256-GCM).
        </p>
        <p className="text-text-secondary m-0 mt-2 text-[0.85rem] leading-[1.45]">
          <strong className="text-ink">Integrations</strong> = platform keys (this page).{' '}
          <strong className="text-ink">Connections</strong> = per-tenant OAuth grants after a user
          connects mail, calendar, or bank accounts — manage those under{' '}
          <Link href="/admin/connections" className="text-signal hover:text-ink font-bold">
            Connections
          </Link>
          .
        </p>
      </div>

      {/* Provider cards grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const existing = credentials.find((c) => c.provider === provider.id);
          const isConfigured = !!existing;
          const testDetail = existing ? metadataDetail(existing.metadata) : null;

          return (
            <section
              key={provider.id}
              className={`border-border rounded-[8px] border bg-white transition-shadow ${
                isConfigured ? 'shadow-[0_0_0_2px_var(--wash-green)]' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{provider.icon}</span>
                  <div>
                    <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">{provider.label}</h2>
                    <p className="text-text-secondary m-0 mt-0.5 text-[0.78rem] leading-[1.4]">
                      {provider.description}
                    </p>
                  </div>
                </div>
                {isConfigured ? (
                  <span className="bg-wash-green text-signal shrink-0 rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold">
                    Connected
                  </span>
                ) : (
                  <span className="bg-wash text-text-secondary shrink-0 rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold">
                    Not configured
                  </span>
                )}
              </div>

              {/* If configured, show status + actions */}
              {isConfigured && existing ? (
                <div className="border-border border-t px-5 py-3">
                  <div className="flex flex-wrap items-center gap-3 text-[0.8rem]">
                    <span className="text-text-secondary">
                      <strong className="text-ink">{existing.label}</strong>
                    </span>
                    {existing.lastTestResult ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${
                          testResultColor[existing.lastTestResult] ?? 'bg-wash text-text-secondary'
                        }`}
                        title={testDetail ?? undefined}
                      >
                        {existing.lastTestResult}
                      </span>
                    ) : null}
                    <span className="text-text-secondary text-[0.75rem]">
                      Added {existing.createdAt.toLocaleDateString()}
                      {existing.lastTestedAt
                        ? ` · tested ${existing.lastTestedAt.toLocaleString()}`
                        : ''}
                    </span>
                  </div>
                  {testDetail ? (
                    <p className="text-text-secondary m-0 mt-1.5 text-[0.75rem]">{testDetail}</p>
                  ) : null}
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <form action={handleTest}>
                      <input type="hidden" name="id" value={existing.id} />
                      <Button type="submit" variant="quiet" size="small">
                        Test
                      </Button>
                    </form>
                    <form action={handleToggle}>
                      <input type="hidden" name="id" value={existing.id} />
                      <input type="hidden" name="enabled" value={String(existing.enabled)} />
                      <Button type="submit" variant="secondary" size="small">
                        {existing.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </form>
                    <form action={handleDelete}>
                      <input type="hidden" name="id" value={existing.id} />
                      <Button type="submit" variant="ghost" size="small">
                        Remove
                      </Button>
                    </form>
                  </div>

                  <details className="border-border bg-wash/40 mt-3 rounded-[6px] border">
                    <summary className="text-text-secondary cursor-pointer px-3 py-2 text-[0.78rem] font-bold">
                      Rotate secret
                    </summary>
                    <form
                      action={handleRotate}
                      className="border-border grid gap-3 border-t px-3 py-3"
                    >
                      <input type="hidden" name="id" value={existing.id} />
                      <input type="hidden" name="provider" value={provider.id} />
                      <p className="text-text-secondary m-0 text-[0.75rem]">
                        Re-enter the full secret payload. Previous ciphertext is replaced and
                        audited as a rotation (secrets are never written to the audit log).
                      </p>
                      {provider.fields.map((field) => (
                        <TextField
                          key={field.name}
                          label={field.label}
                          name={field.name}
                          type={field.type ?? 'text'}
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                      ))}
                      <div className="flex justify-end">
                        <Button type="submit" size="small">
                          Rotate & Encrypt
                        </Button>
                      </div>
                    </form>
                  </details>
                </div>
              ) : (
                /* If not configured, show the input form */
                <form
                  action={async (formData: FormData) => {
                    'use server';
                    const fields: Record<string, string> = {};
                    for (const key of formData.keys()) {
                      if (key === 'provider' || key === 'label') continue;
                      const val = formData.get(key) as string;
                      if (val?.trim()) fields[key] = val.trim();
                    }
                    const metaKeys =
                      PROVIDERS.find((p) => p.id === formData.get('provider'))?.metadataHints ?? [];
                    const metadata: Record<string, string> = {};
                    for (const key of metaKeys) {
                      if (fields[key]) metadata[key] = fields[key];
                    }
                    await createIntegrationCredential({
                      provider: formData.get('provider') as
                        | 'stripe'
                        | 'aws_bedrock'
                        | 'office365'
                        | 'google_workspace'
                        | 'plaid'
                        | 'openai'
                        | 'anthropic'
                        | 'sendgrid'
                        | 'twilio'
                        | 'custom',
                      label: (formData.get('label') as string) || `${formData.get('provider')} key`,
                      secret: JSON.stringify(fields),
                      metadata: Object.keys(metadata).length ? metadata : undefined,
                    });
                  }}
                  className="border-border border-t px-5 py-4"
                >
                  <input type="hidden" name="provider" value={provider.id} />
                  <div className="grid gap-3">
                    <TextField
                      label="Label"
                      name="label"
                      placeholder={`${provider.label} production`}
                      hint="A name to identify this credential"
                    />
                    {provider.fields.map((field) => (
                      <TextField
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        type={field.type ?? 'text'}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ))}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener"
                        className="text-signal hover:text-ink text-[0.78rem] font-bold"
                      >
                        ↗ {provider.docsLabel}
                      </a>
                      <Button type="submit" size="medium">
                        Save & Encrypt
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </section>
          );
        })}
      </div>

      {/* All credentials table (for visibility into everything stored) */}
      {credentials.length > 0 ? (
        <details className="border-border rounded-[8px] border bg-white">
          <summary className="text-text-secondary cursor-pointer px-5 py-3.5 text-[0.85rem] font-bold">
            All stored credentials ({credentials.length})
          </summary>
          <div className="border-border overflow-auto border-t">
            <table className="w-full border-collapse text-[0.82rem]">
              <thead>
                <tr className="bg-wash text-left">
                  <th className="text-ink px-4 py-2 font-extrabold">Provider</th>
                  <th className="text-ink px-4 py-2 font-extrabold">Label</th>
                  <th className="text-ink px-4 py-2 font-extrabold">Status</th>
                  <th className="text-ink px-4 py-2 font-extrabold">Last Test</th>
                  <th className="text-ink px-4 py-2 font-extrabold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {credentials.map((cred) => (
                  <tr key={cred.id}>
                    <td className="text-ink px-4 py-2 font-bold">
                      {PROVIDER_LABELS[cred.provider] ?? cred.provider}
                    </td>
                    <td className="text-text-secondary px-4 py-2">{cred.label}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${
                          cred.enabled ? 'bg-wash-green text-signal' : 'bg-risk-wash text-ink'
                        }`}
                      >
                        {cred.enabled ? 'active' : 'disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {cred.lastTestResult ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${
                            testResultColor[cred.lastTestResult] ?? 'bg-wash text-text-secondary'
                          }`}
                        >
                          {cred.lastTestResult}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-text-secondary whitespace-nowrap px-4 py-2">
                      {cred.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
