import { revalidatePath } from 'next/cache';

import {
  listAiAgents,
  createAiAgent,
  updateAiAgent,
  deleteAiAgent,
} from '@/lib/admin/ai-actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SelectField } from '@/components/ui/select';

export default async function AdminAiAgentsPage() {
  const agents = await listAiAgents();

  const agentsByType = {
    agent: agents.filter((a) => a.type === 'agent'),
    subagent: agents.filter((a) => a.type === 'subagent'),
    skill: agents.filter((a) => a.type === 'skill'),
  };

  // Build a lookup for parent agent names
  const agentNameById = new Map(agents.map((a) => [a.id, a.name]));

  async function handleCreate(formData: FormData) {
    'use server';
    const slug = formData.get('slug') as string;
    const name = formData.get('name') as string;
    const type = formData.get('type') as 'agent' | 'subagent' | 'skill';
    const description = formData.get('description') as string;
    await createAiAgent({ slug, name, type, description: description || undefined });
    revalidatePath('/admin/ai/agents');
  }

  async function handleToggle(id: string, enabled: boolean) {
    'use server';
    await updateAiAgent({ id, enabled });
    revalidatePath('/admin/ai/agents');
  }

  async function handleDelete(id: string) {
    'use server';
    await deleteAiAgent({ id });
    revalidatePath('/admin/ai/agents');
  }

  function truncate(text: string | null, max = 60): string {
    if (!text) return '—';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  function renderGroup(type: 'agent' | 'subagent' | 'skill', rows: typeof agents) {
    const labels = { agent: 'Agents', subagent: 'Subagents', skill: 'Skills' };

    return (
      <div key={type}>
        <h2 className="text-ink mb-2 text-[1rem] font-extrabold">
          {labels[type]}{' '}
          <span className="text-text-secondary text-[0.85rem] font-bold">({rows.length})</span>
        </h2>
        <div className="border-border overflow-hidden rounded-[8px] border bg-white">
          <table className="w-full border-collapse text-[0.85rem]">
            <thead>
              <tr className="border-border bg-wash border-b text-left">
                <th className="px-4 py-3 font-extrabold text-ink">Name</th>
                <th className="px-4 py-3 font-extrabold text-ink">Slug</th>
                <th className="px-4 py-3 font-extrabold text-ink">Description</th>
                {type === 'subagent' ? (
                  <th className="px-4 py-3 font-extrabold text-ink">Parent</th>
                ) : null}
                <th className="px-4 py-3 font-extrabold text-ink">Status</th>
                <th className="px-4 py-3 font-extrabold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-bold text-ink">{row.name}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-[0.8rem]">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{truncate(row.description)}</td>
                  {type === 'subagent' ? (
                    <td className="px-4 py-3 text-text-secondary">
                      {row.parentAgentId ? agentNameById.get(row.parentAgentId) ?? '—' : '—'}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                        row.enabled
                          ? 'bg-wash-green text-signal'
                          : 'bg-wash text-text-secondary'
                      }`}
                    >
                      {row.enabled ? 'enabled' : 'disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <form
                        action={async () => {
                          'use server';
                          await handleToggle(row.id, !row.enabled);
                        }}
                      >
                        <Button type="submit" variant="secondary" size="small">
                          {row.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          'use server';
                          await handleDelete(row.id);
                        }}
                      >
                        <Button type="submit" variant="secondary" size="small">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={type === 'subagent' ? 6 : 5}
                    className="px-4 py-6 text-center text-text-secondary"
                  >
                    No {labels[type].toLowerCase()} configured yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">AI Agents</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Agent management
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Configure AI agents, subagents, and skills. {agents.length} total registered.
        </p>
      </div>

      {/* Create form */}
      <form
        action={handleCreate}
        className="border-border max-w-lg rounded-[8px] border bg-white p-6"
      >
        <h2 className="text-ink mb-4 text-[1rem] font-extrabold">Add new agent</h2>
        <div className="grid gap-4">
          <TextField
            label="Slug"
            name="slug"
            required
            placeholder="my-agent"
          />
          <TextField
            label="Name"
            name="name"
            required
            placeholder="My Agent"
          />
          <SelectField label="Type" name="type" defaultValue="agent">
            <option value="agent">Agent</option>
            <option value="subagent">Subagent</option>
            <option value="skill">Skill</option>
          </SelectField>
          <label className="grid gap-1.5">
            <span className="text-ink text-[0.8rem] font-extrabold">Description</span>
            <textarea
              name="description"
              rows={2}
              placeholder="What this agent does…"
              className="text-ink placeholder:text-text-secondary/55 focus:border-signal w-full rounded-[8px] border border-border bg-white px-[13px] py-3 outline-none transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_var(--wash-green)]"
            />
          </label>
          <div className="mt-2">
            <Button type="submit" size="medium">
              Create
            </Button>
          </div>
        </div>
      </form>

      {/* Grouped tables */}
      {renderGroup('agent', agentsByType.agent)}
      {renderGroup('subagent', agentsByType.subagent)}
      {renderGroup('skill', agentsByType.skill)}
    </div>
  );
}
