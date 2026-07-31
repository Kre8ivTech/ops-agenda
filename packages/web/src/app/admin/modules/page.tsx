import { listAllModuleStates, setModuleEnabled } from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';

export default async function AdminModulesPage() {
  const rows = await listAllModuleStates();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Modules</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Module flags by account
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Enable or disable a module for a single account. Accounts with no rows here have never
          had any module toggled.
        </p>
      </div>

      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">Account</th>
              <th className="px-4 py-3 font-extrabold text-ink">Module</th>
              <th className="px-4 py-3 font-extrabold text-ink">Status</th>
              <th className="px-4 py-3 font-extrabold text-ink">Action</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row) => (
              <tr key={`${row.accountId}-${row.module}`}>
                <td className="px-4 py-3 font-bold text-ink">{row.accountName}</td>
                <td className="px-4 py-3 text-text-secondary">{row.module}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                      row.enabled ? 'bg-wash-green text-signal' : 'bg-wash text-text-secondary'
                    }`}
                  >
                    {row.enabled ? 'enabled' : 'disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      'use server';
                      await setModuleEnabled({
                        accountId: row.accountId,
                        module: row.module as Parameters<typeof setModuleEnabled>[0]['module'],
                        enabled: !row.enabled,
                      });
                    }}
                  >
                    <Button type="submit" variant="secondary" size="small">
                      {row.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">
                  No module state rows yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
