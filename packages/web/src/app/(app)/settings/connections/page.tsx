import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SelectField } from '@/components/ui/select';
import { getSession } from '@/lib/auth';
import { listConnections, deleteConnection, createImapConnection, testConnection, addSharedMailbox } from '@/lib/connectors/actions';
import { PROVIDER_LIST } from '@/lib/connectors';

const STATUS_STYLE: Record<string, string> = {
  healthy: 'bg-wash-green text-signal',
  degraded: 'bg-[#fff3cd] text-[#856404]',
  pending: 'bg-wash text-text-secondary',
  revoked: 'bg-risk-wash text-ink',
};

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const hasTenant = !!(session?.accountId && session?.userId);

  let connections: Awaited<ReturnType<typeof listConnections>> = [];
  if (hasTenant) {
    try {
      connections = await listConnections();
    } catch {
      // DB unavailable — show empty
    }
  }

  const oauthProviders = PROVIDER_LIST.filter((p) => p.supportsOAuth);
  const mailConnections = connections.filter((c) => c.kind === 'mail');

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
      <div>
        <nav className="text-[0.82rem] mb-3">
          <Link href="/settings" className="text-signal hover:text-ink font-bold">
            ← Settings
          </Link>
        </nav>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Connections</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Email & Calendar
        </h1>
        <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.92rem] leading-[1.5]">
          Connect your email and calendar accounts. Ops Agenda reads metadata only — message bodies are never stored.
        </p>
      </div>

      {/* Success/error banners */}
      {params.success === 'connected' ? (
        <div className="border-border bg-wash-green text-signal rounded-[8px] border px-4 py-3 text-[0.85rem] font-bold">
          ✓ Account connected successfully!
        </div>
      ) : null}
      {params.error ? (
        <div className="border-border bg-risk-wash text-ink rounded-[8px] border px-4 py-3 text-[0.85rem]">
          Connection failed: {params.error}
        </div>
      ) : null}

      {/* Active connections */}
      {connections.length > 0 ? (
        <section className="border-border rounded-[8px] border bg-white">
          <div className="border-border border-b px-5 py-3">
            <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">
              Active connections ({connections.length})
            </h2>
          </div>
          <table className="w-full border-collapse text-[0.82rem]">
            <thead>
              <tr className="bg-wash text-left">
                <th className="px-5 py-2 font-extrabold text-ink">Account</th>
                <th className="px-5 py-2 font-extrabold text-ink">Provider</th>
                <th className="px-5 py-2 font-extrabold text-ink">Type</th>
                <th className="px-5 py-2 font-extrabold text-ink">Status</th>
                <th className="px-5 py-2 font-extrabold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {connections.map((conn) => (
                <tr key={conn.id}>
                  <td className="px-5 py-2.5 font-bold text-ink">
                    {conn.externalAccountRef ?? '—'}
                  </td>
                  <td className="px-5 py-2.5 text-text-secondary capitalize">{conn.provider}</td>
                  <td className="px-5 py-2.5 text-text-secondary capitalize">{conn.kind}</td>
                  <td className="px-5 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold ${STATUS_STYLE[conn.status] ?? 'bg-wash text-text-secondary'}`}>
                      {conn.status}
                    </span>
                  </td>
                  <td className="flex gap-2 px-5 py-2.5">
                    <form action={async () => {
                      'use server';
                      await testConnection({ connectionId: conn.id });
                    }}>
                      <Button type="submit" variant="ghost" size="small">Test</Button>
                    </form>
                    <form action={async () => {
                      'use server';
                      await deleteConnection({ connectionId: conn.id });
                    }}>
                      <Button type="submit" variant="ghost" size="small">Disconnect</Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Shared Mailboxes */}
      {mailConnections.length > 0 ? (
        <SharedMailboxSection mailConnections={mailConnections} />
      ) : null}

      {/* Add OAuth connection */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-2 text-[0.95rem] font-extrabold">Connect an account</h2>
        <p className="text-text-secondary m-0 mb-4 text-[0.82rem]">
          Sign in with your email provider to grant read-only access to mail and calendar metadata.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {oauthProviders.map((p) => (
            <a
              key={p.provider}
              href={`/api/connectors/${p.provider}/authorize`}
              className="border-border hover:border-ink flex items-center gap-3 rounded-[8px] border px-4 py-3 transition-colors"
            >
              <span className="text-xl">{p.icon}</span>
              <div>
                <p className="text-ink m-0 text-[0.85rem] font-extrabold">{p.label}</p>
                <p className="text-text-secondary m-0 text-[0.75rem]">{p.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* IMAP/POP manual config */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-2 text-[0.95rem] font-extrabold">IMAP / POP3</h2>
        <p className="text-text-secondary m-0 mb-4 text-[0.82rem]">
          For providers without OAuth support, connect using IMAP credentials (app password recommended).
        </p>
        <form
          action={async (formData: FormData) => {
            'use server';
            await createImapConnection({
              email: formData.get('email') as string,
              host: formData.get('host') as string,
              port: Number(formData.get('port')),
              security: formData.get('security') as 'ssl' | 'starttls' | 'none',
              username: formData.get('username') as string,
              password: formData.get('password') as string,
            });
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <TextField label="Email address" name="email" type="email" required placeholder="you@company.com" />
          <TextField label="IMAP host" name="host" required placeholder="imap.gmail.com" />
          <TextField label="Port" name="port" type="number" required defaultValue="993" />
          <SelectField label="Security" name="security" defaultValue="ssl">
            <option value="ssl">SSL/TLS</option>
            <option value="starttls">STARTTLS</option>
            <option value="none">None</option>
          </SelectField>
          <TextField label="Username" name="username" required placeholder="you@company.com" />
          <TextField label="Password / App password" name="password" type="password" required />
          <div className="sm:col-span-2">
            <Button type="submit" size="medium">
              Test & Connect
            </Button>
          </div>
        </form>
      </section>

      {/* Scopes explanation */}
      <section className="border-border rounded-[8px] border bg-white/70 px-5 py-4">
        <h3 className="text-ink m-0 mb-2 text-[0.85rem] font-extrabold">What we access</h3>
        <ul className="text-text-secondary m-0 list-none space-y-1.5 p-0 text-[0.82rem]">
          <li>✓ Email subject lines, senders, dates, and read status</li>
          <li>✓ Calendar event titles, times, and attendee lists</li>
          <li>✓ Shared/delegated mailbox metadata (if you have delegate access)</li>
          <li>✓ Create focus-time blocks in your calendar (only when you click Apply)</li>
          <li>✗ Email bodies are never read, stored, or processed</li>
          <li>✗ We cannot send emails or modify existing events</li>
        </ul>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Mailbox Section
// ---------------------------------------------------------------------------

interface SharedMailboxSectionProps {
  mailConnections: Awaited<ReturnType<typeof listConnections>>;
}

async function SharedMailboxSection({ mailConnections }: SharedMailboxSectionProps) {
  // Try to auto-discover shared mailboxes
  let discovered: { provider: string; email: string; displayName: string; connectionId: string }[] = [];
  try {
    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${appUrl}/api/connectors/shared-mailboxes`, {
      cache: 'no-store',
      headers: { cookie: '' }, // Server component — use internal fetch
    });
    if (res.ok) {
      const data = await res.json();
      discovered = data.sharedMailboxes ?? [];
    }
  } catch {
    // Discovery failed — still show manual form
  }

  // Find parent connections (Microsoft/Google mail connections to use as token source)
  const parentConnections = mailConnections.filter(
    (c) => c.provider === 'microsoft' || c.provider === 'google',
  );

  if (parentConnections.length === 0) return null;

  return (
    <section className="border-border rounded-[8px] border bg-white p-5">
      <h2 className="text-ink m-0 mb-1 text-[0.95rem] font-extrabold">Shared Mailboxes</h2>
      <p className="text-text-secondary m-0 mb-4 text-[0.82rem]">
        Connect shared or delegated mailboxes your account has access to. These use the same OAuth token as your primary connection.
      </p>

      {/* Auto-discovered shared mailboxes */}
      {discovered.length > 0 ? (
        <div className="mb-5">
          <p className="text-text-secondary m-0 mb-2 text-[0.72rem] font-extrabold uppercase">
            Discovered ({discovered.length})
          </p>
          <div className="flex flex-col gap-2">
            {discovered.map((mb) => (
              <div key={mb.email} className="border-border flex items-center justify-between rounded-[8px] border px-4 py-3">
                <div>
                  <p className="text-ink m-0 text-[0.85rem] font-bold">{mb.displayName}</p>
                  <p className="text-text-secondary m-0 text-[0.76rem]">{mb.email}</p>
                </div>
                <form action={async () => {
                  'use server';
                  await addSharedMailbox({
                    provider: mb.provider,
                    email: mb.email,
                    displayName: mb.displayName,
                    parentConnectionId: mb.connectionId,
                  });
                }}>
                  <Button type="submit" variant="primary" size="small">Connect</Button>
                </form>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-border mb-5 rounded-[8px] border border-dashed px-4 py-4 text-center">
          <p className="text-text-secondary m-0 text-[0.82rem]">
            No shared mailboxes auto-detected. You can add one manually below.
          </p>
        </div>
      )}

      {/* Manual add form */}
      <div className="border-border rounded-[8px] border bg-wash/50 p-4">
        <p className="text-ink m-0 mb-3 text-[0.82rem] font-extrabold">Add manually</p>
        <form
          action={async (formData: FormData) => {
            'use server';
            const email = formData.get('shared_email') as string;
            const displayName = formData.get('shared_name') as string;
            const parentId = formData.get('parent_connection') as string;
            const parentConn = parentConnections.find((c) => c.id === parentId);
            if (!parentConn) return;
            await addSharedMailbox({
              provider: parentConn.provider,
              email,
              displayName: displayName || email,
              parentConnectionId: parentId,
            });
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <TextField
            label="Shared mailbox email"
            name="shared_email"
            type="email"
            required
            placeholder="shared@yourcompany.com"
          />
          <TextField
            label="Display name"
            name="shared_name"
            placeholder="Office Inbox"
          />
          <SelectField label="Parent connection" name="parent_connection" required>
            {parentConnections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.provider === 'microsoft' ? '📧 ' : '📬 '}
                {c.externalAccountRef ?? c.provider}
              </option>
            ))}
          </SelectField>
          <div className="flex items-end">
            <Button type="submit" size="medium">
              Add shared mailbox
            </Button>
          </div>
        </form>
        <p className="text-text-secondary m-0 mt-3 text-[0.74rem]">
          Your account must have delegate access to the shared mailbox in Exchange Admin Center / Google Admin.
        </p>
      </div>
    </section>
  );
}
