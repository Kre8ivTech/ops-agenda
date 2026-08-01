import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  addUserToAccount,
  deleteAccount,
  getAccountDetail,
  removeUserFromAccount,
  setAccountStatus,
  setModuleEnabled,
  setUserStatus,
  updateAccount,
} from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SelectField } from '@/components/ui/select';

const ALL_MODULES = [
  'plan',
  'productivity',
  'finances',
  'business',
  'health',
  'life',
  'research',
  'social',
] as const;

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const detail = await getAccountDetail(accountId);

  if (!detail) notFound();

  const enabledModules = new Set(detail.modules.filter((m) => m.enabled).map((m) => m.module));

  // --- Server actions bound to this account ---

  async function handleUpdate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const plan = formData.get('plan') as string;
    await updateAccount({
      accountId,
      name: name || undefined,
      plan: plan as 'trial' | 'starter' | 'pro' | 'enterprise',
    });
  }

  async function handleSuspend() {
    'use server';
    await setAccountStatus({
      accountId,
      status: 'suspended',
    });
  }

  async function handleReactivate() {
    'use server';
    await setAccountStatus({
      accountId,
      status: 'active',
    });
  }

  async function handleDelete() {
    'use server';
    await deleteAccount({ accountId });
    redirect('/admin/accounts');
  }

  async function handleAddUser(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const name = formData.get('userName') as string;
    const role = formData.get('role') as string;
    await addUserToAccount({
      accountId,
      email,
      name,
      role: role as 'admin' | 'member',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="text-[0.82rem]">
        <Link href="/admin/accounts" className="text-signal hover:text-ink font-bold">
          ← Accounts
        </Link>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">
            Account detail
          </p>
          <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
            {detail.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.85rem]">
            <span
              className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                detail.status === 'active'
                  ? 'bg-wash-green text-signal'
                  : 'bg-risk-wash text-ink'
              }`}
            >
              {detail.status}
            </span>
            <span className="text-text-secondary">Plan: {detail.plan}</span>
            <span className="text-text-secondary">
              Since {detail.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
        <code className="bg-wash text-text-secondary rounded px-2 py-1 font-mono text-[0.75rem]">
          {detail.id}
        </code>
      </div>

      {/* Edit account form */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-4 text-[0.95rem] font-extrabold">Edit account</h2>
        <form action={handleUpdate} className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <TextField label="Name" name="name" defaultValue={detail.name} required />
          <SelectField label="Plan" name="plan" defaultValue={detail.plan}>
            <option value="trial">Trial</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </SelectField>
          <Button type="submit" size="medium" variant="secondary">
            Save
          </Button>
        </form>
      </section>

      {/* Users */}
      <section className="border-border rounded-[8px] border bg-white">
        <div className="border-border flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">
            Users ({detail.users.length})
          </h2>
        </div>

        {/* User table */}
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[0.82rem]">
            <thead>
              <tr className="bg-wash text-left">
                <th className="px-5 py-2 font-extrabold text-ink">Email</th>
                <th className="px-5 py-2 font-extrabold text-ink">Name</th>
                <th className="px-5 py-2 font-extrabold text-ink">Role</th>
                <th className="px-5 py-2 font-extrabold text-ink">Status</th>
                <th className="px-5 py-2 font-extrabold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {detail.users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-2 font-bold text-ink">{u.email}</td>
                  <td className="px-5 py-2 text-text-secondary">{u.name ?? '—'}</td>
                  <td className="px-5 py-2 text-text-secondary">{u.role}</td>
                  <td className="px-5 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${
                        u.status === 'active'
                          ? 'bg-wash-green text-signal'
                          : 'bg-risk-wash text-ink'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="flex gap-2 px-5 py-2">
                    <form
                      action={async () => {
                        'use server';
                        await setUserStatus({
                          accountId,
                          userId: u.id,
                          status: u.status === 'active' ? 'suspended' : 'active',
                        });
                      }}
                    >
                      <Button type="submit" variant="ghost" size="small">
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        'use server';
                        await removeUserFromAccount({ accountId, userId: u.id });
                      }}
                    >
                      <Button type="submit" variant="ghost" size="small">
                        Remove
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {detail.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-4 text-center text-text-secondary">
                    No users in this account.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Add user form */}
        <div className="border-border border-t px-5 py-4">
          <p className="text-text-secondary mb-3 text-[0.8rem] font-extrabold uppercase">
            Add user
          </p>
          <form action={handleAddUser} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <TextField label="Email" name="email" type="email" required placeholder="user@company.com" />
            <TextField label="Name" name="userName" required placeholder="Jane Smith" />
            <SelectField label="Role" name="role" defaultValue="member">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </SelectField>
            <Button type="submit" size="medium" variant="secondary">
              Add
            </Button>
          </form>
        </div>
      </section>

      {/* Modules */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-4 text-[0.95rem] font-extrabold">Modules</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ALL_MODULES.map((mod) => {
            const enabled = enabledModules.has(mod);
            return (
              <form
                key={mod}
                action={async () => {
                  'use server';
                  await setModuleEnabled({ accountId, module: mod, enabled: !enabled });
                }}
              >
                <button
                  type="submit"
                  className={`flex w-full items-center gap-2.5 rounded-[8px] border px-4 py-3 text-left text-[0.82rem] font-bold transition-colors ${
                    enabled
                      ? 'border-signal bg-wash-green text-signal'
                      : 'border-border bg-wash text-text-secondary hover:border-ink'
                  }`}
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${
                      enabled ? 'bg-signal' : 'bg-border'
                    }`}
                  />
                  {mod}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      {/* Connections */}
      {detail.connections.length > 0 ? (
        <section className="border-border overflow-hidden rounded-[8px] border bg-white">
          <div className="border-border border-b px-5 py-3">
            <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">
              Connections ({detail.connections.length})
            </h2>
          </div>
          <table className="w-full border-collapse text-[0.82rem]">
            <thead>
              <tr className="bg-wash text-left">
                <th className="px-5 py-2 font-extrabold text-ink">Provider</th>
                <th className="px-5 py-2 font-extrabold text-ink">Kind</th>
                <th className="px-5 py-2 font-extrabold text-ink">Status</th>
                <th className="px-5 py-2 font-extrabold text-ink">Last sync</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {detail.connections.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-2 font-bold text-ink">{c.provider}</td>
                  <td className="px-5 py-2 text-text-secondary">{c.kind}</td>
                  <td className="px-5 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${
                        c.status === 'healthy'
                          ? 'bg-wash-green text-signal'
                          : c.status === 'degraded'
                            ? 'bg-[#fff3cd] text-[#856404]'
                            : 'bg-wash text-text-secondary'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-2 text-text-secondary">
                    {c.lastSyncAt ? c.lastSyncAt.toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Recent audit events */}
      {detail.recentAudit.length > 0 ? (
        <section className="border-border overflow-hidden rounded-[8px] border bg-white">
          <div className="border-border border-b px-5 py-3">
            <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">
              Recent activity ({detail.recentAudit.length})
            </h2>
          </div>
          <table className="w-full border-collapse text-[0.82rem]">
            <thead>
              <tr className="bg-wash text-left">
                <th className="px-5 py-2 font-extrabold text-ink">When</th>
                <th className="px-5 py-2 font-extrabold text-ink">Action</th>
                <th className="px-5 py-2 font-extrabold text-ink">Target</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {detail.recentAudit.map((evt) => (
                <tr key={evt.id}>
                  <td className="whitespace-nowrap px-5 py-2 text-text-secondary">
                    {evt.at.toLocaleString()}
                  </td>
                  <td className="px-5 py-2 text-ink">{evt.action}</td>
                  <td className="px-5 py-2 text-text-secondary">{evt.targetType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Danger zone */}
      <section className="border-border rounded-[8px] border border-red-200 bg-red-50/50 p-5">
        <h2 className="m-0 mb-2 text-[0.95rem] font-extrabold text-red-800">Danger zone</h2>
        <p className="text-text-secondary m-0 mb-4 text-[0.82rem]">
          These actions are destructive and may not be reversible.
        </p>
        <div className="flex flex-wrap gap-3">
          {detail.status === 'active' ? (
            <form action={handleSuspend}>
              <Button type="submit" variant="secondary" size="small">
                Suspend account
              </Button>
            </form>
          ) : (
            <form action={handleReactivate}>
              <Button type="submit" variant="secondary" size="small">
                Reactivate account
              </Button>
            </form>
          )}
          <form action={handleDelete}>
            <Button
              type="submit"
              variant="secondary"
              size="small"
              className="border-red-300 text-red-700 hover:border-red-500 hover:bg-red-50"
            >
              Delete account permanently
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
