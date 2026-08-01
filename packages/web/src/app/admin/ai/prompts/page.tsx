import {
  listAiPrompts,
  createAiPrompt,
  updateAiPrompt,
  deleteAiPrompt,
} from '@/lib/admin/ai-actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SelectField } from '@/components/ui/select';

export default async function AdminAiPromptsPage() {
  const prompts = await listAiPrompts();

  async function handleCreate(formData: FormData) {
    'use server';
    const slug = formData.get('slug') as string;
    const name = formData.get('name') as string;
    const kind = formData.get('kind') as 'system' | 'template' | 'guardrail' | 'few_shot';
    const content = formData.get('content') as string;
    const version = (formData.get('version') as string) || '1.0.0';
    await createAiPrompt({ slug, name, kind, content, version });
  }

  async function handleToggle(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const enabled = formData.get('enabled') === 'true';
    await updateAiPrompt({ id, enabled: !enabled });
  }

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteAiPrompt({ id });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">
          AI Prompts
        </p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Prompt management
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} registered. Manage system
          prompts, templates, guardrails, and few-shot examples.
        </p>
      </div>

      {/* Create form */}
      <form action={handleCreate} className="border-border max-w-lg rounded-[8px] border bg-white p-6">
        <p className="text-signal mb-4 text-[0.76rem] font-extrabold uppercase">
          New prompt
        </p>
        <div className="grid gap-4">
          <TextField label="Slug" name="slug" required placeholder="daily-brief-system" />
          <TextField label="Name" name="name" required placeholder="Daily Brief System Prompt" />
          <SelectField label="Kind" name="kind" defaultValue="system">
            <option value="system">system</option>
            <option value="template">template</option>
            <option value="guardrail">guardrail</option>
            <option value="few_shot">few_shot</option>
          </SelectField>
          <div>
            <label className="text-ink mb-1.5 block text-[0.82rem] font-bold">Content</label>
            <textarea
              name="content"
              required
              rows={4}
              placeholder="You are a helpful assistant that..."
              className="text-ink placeholder:text-text-secondary/55 focus:border-signal w-full rounded-[8px] border border-border bg-white px-[13px] py-3 outline-none transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_var(--wash-green)]"
            />
          </div>
          <TextField label="Version" name="version" placeholder="1.0.0" />
          <div className="mt-2">
            <Button type="submit" size="medium">
              Create prompt
            </Button>
          </div>
        </div>
      </form>

      {/* Prompts table */}
      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">Name</th>
              <th className="px-4 py-3 font-extrabold text-ink">Slug</th>
              <th className="px-4 py-3 font-extrabold text-ink">Kind</th>
              <th className="px-4 py-3 font-extrabold text-ink">Content</th>
              <th className="px-4 py-3 font-extrabold text-ink">Version</th>
              <th className="px-4 py-3 font-extrabold text-ink">Status</th>
              <th className="px-4 py-3 font-extrabold text-ink">Updated</th>
              <th className="px-4 py-3 font-extrabold text-ink">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {prompts.map((prompt) => (
              <tr key={prompt.id}>
                <td className="px-4 py-3 font-bold text-ink">{prompt.name}</td>
                <td className="px-4 py-3 text-text-secondary">{prompt.slug}</td>
                <td className="px-4 py-3 text-text-secondary">{prompt.kind}</td>
                <td className="max-w-[200px] px-4 py-3 text-text-secondary">
                  <span className="block truncate">
                    {prompt.content.length > 80
                      ? `${prompt.content.slice(0, 80)}…`
                      : prompt.content}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{prompt.version}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                      prompt.enabled
                        ? 'bg-wash-green text-signal'
                        : 'bg-wash text-text-secondary'
                    }`}
                  >
                    {prompt.enabled ? 'enabled' : 'disabled'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                  {prompt.updatedAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <form action={handleToggle}>
                      <input type="hidden" name="id" value={prompt.id} />
                      <input type="hidden" name="enabled" value={String(prompt.enabled)} />
                      <Button type="submit" variant="secondary" size="small">
                        {prompt.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </form>
                    <form action={handleDelete}>
                      <input type="hidden" name="id" value={prompt.id} />
                      <Button type="submit" variant="secondary" size="small">
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {prompts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-text-secondary">
                  No prompts registered yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
