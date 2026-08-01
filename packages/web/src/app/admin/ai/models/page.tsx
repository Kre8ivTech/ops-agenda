import { revalidatePath } from 'next/cache';

import { listAiModels, createAiModel, updateAiModel, deleteAiModel } from '@/lib/admin/ai-actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SelectField } from '@/components/ui/select';

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  aws_bedrock: 'AWS Bedrock',
  google: 'Google',
  azure: 'Azure',
  local: 'Local',
};

export default async function AdminAiModelsPage() {
  const models = await listAiModels();

  async function handleCreate(formData: FormData) {
    'use server';
    await createAiModel({
      provider: formData.get('provider') as 'anthropic' | 'openai' | 'aws_bedrock' | 'google' | 'azure' | 'local',
      modelId: formData.get('modelId') as string,
      displayName: formData.get('displayName') as string,
      contextWindow: (formData.get('contextWindow') as string) || undefined,
      maxOutput: (formData.get('maxOutput') as string) || undefined,
      costPer1kInput: (formData.get('costPer1kInput') as string) || undefined,
      costPer1kOutput: (formData.get('costPer1kOutput') as string) || undefined,
      isDefault: formData.get('isDefault') === 'on',
    });
    revalidatePath('/admin/ai/models');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">AI Models</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Model registry
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Register and manage AI models available to agents and prompts.
        </p>
      </div>

      {/* Models table */}
      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">Display Name</th>
              <th className="px-4 py-3 font-extrabold text-ink">Provider</th>
              <th className="px-4 py-3 font-extrabold text-ink">Model ID</th>
              <th className="px-4 py-3 font-extrabold text-ink">Context Window</th>
              <th className="px-4 py-3 font-extrabold text-ink">Cost (per 1K tokens)</th>
              <th className="px-4 py-3 font-extrabold text-ink">Default</th>
              <th className="px-4 py-3 font-extrabold text-ink">Status</th>
              <th className="px-4 py-3 font-extrabold text-ink">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {models.map((model) => (
              <tr key={model.id}>
                <td className="px-4 py-3 font-bold text-ink">{model.displayName}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {PROVIDER_LABELS[model.provider] ?? model.provider}
                </td>
                <td className="px-4 py-3 font-mono text-[0.8rem] text-text-secondary">
                  {model.modelId}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {model.contextWindow ?? '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {model.costPer1kInput || model.costPer1kOutput
                    ? `$${model.costPer1kInput ?? '—'} / $${model.costPer1kOutput ?? '—'}`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {model.isDefault ? (
                    <span className="rounded-full bg-wash-green px-2.5 py-1 text-[0.75rem] font-extrabold text-signal">
                      default
                    </span>
                  ) : (
                    <span className="text-text-secondary text-[0.75rem]">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                      model.enabled ? 'bg-wash-green text-signal' : 'bg-wash text-text-secondary'
                    }`}
                  >
                    {model.enabled ? 'enabled' : 'disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {!model.isDefault && (
                      <form
                        action={async () => {
                          'use server';
                          await updateAiModel({ id: model.id, isDefault: true });
                        }}
                      >
                        <Button type="submit" variant="secondary" size="small">
                          Set Default
                        </Button>
                      </form>
                    )}
                    <form
                      action={async () => {
                        'use server';
                        await updateAiModel({ id: model.id, enabled: !model.enabled });
                      }}
                    >
                      <Button type="submit" variant="secondary" size="small">
                        {model.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        'use server';
                        await deleteAiModel({ id: model.id });
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
            {models.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-text-secondary">
                  No models registered yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Register new model form */}
      <div>
        <h2 className="text-ink mb-3 text-[1.1rem] font-extrabold">Register new model</h2>
        <form action={handleCreate} className="border-border max-w-2xl rounded-[8px] border bg-white p-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Provider" name="provider" required>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="aws_bedrock">AWS Bedrock</option>
                <option value="google">Google</option>
                <option value="azure">Azure</option>
                <option value="local">Local</option>
              </SelectField>
              <TextField
                label="Model ID"
                name="modelId"
                required
                placeholder="claude-sonnet-4-20250514"
              />
            </div>
            <TextField
              label="Display Name"
              name="displayName"
              required
              placeholder="Claude Sonnet 4"
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Context Window"
                name="contextWindow"
                placeholder="200000"
              />
              <TextField
                label="Max Output"
                name="maxOutput"
                placeholder="8192"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Cost per 1K input tokens"
                name="costPer1kInput"
                placeholder="0.003"
              />
              <TextField
                label="Cost per 1K output tokens"
                name="costPer1kOutput"
                placeholder="0.015"
              />
            </div>
            <label className="flex items-center gap-2 text-[0.85rem] text-ink">
              <input type="checkbox" name="isDefault" className="rounded border-border" />
              <span className="font-bold">Set as default model</span>
            </label>
            <div className="mt-2">
              <Button type="submit" size="medium">
                Register model
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
