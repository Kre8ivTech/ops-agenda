import { getSession } from '@/lib/auth';
import { listTasks } from '@/lib/tasks/actions';
import { CreateTaskForm } from '@/components/create-task-form';
import { ButtonLink } from '@/components/ui/button';

export default async function TasksPage() {
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="border-border bg-risk-wash text-ink rounded-[8px] border p-4">
        <p className="m-0 text-[0.95rem]">
          Your session is not linked to a tenant account. Complete onboarding to continue.
        </p>
        <ButtonLink href="/onboarding" className="mt-4" size="medium">
          Continue onboarding
        </ButtonLink>
      </div>
    );
  }

  const tenant = { accountId: session.accountId, userId: session.userId };
  let tasks: Awaited<ReturnType<typeof listTasks>> = [];
  let unavailable = false;
  try {
    tasks = await listTasks(tenant);
  } catch {
    unavailable = true;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">Tasks</h1>
        <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.95rem] leading-[1.5]">
          Open work that feeds the dashboard agenda. Mark items handled from here or the brief.
        </p>
      </div>

      {unavailable ? (
        <div className="border-border bg-info-wash text-ink rounded-[8px] border px-3.5 py-3 text-[0.85rem]">
          Database is not connected. Set{' '}
          <code className="font-mono text-[0.8rem]">DATABASE_URL</code> to create and list tasks.
        </div>
      ) : (
        <>
          <CreateTaskForm tenant={tenant} />
          <ul className="divide-border border-border divide-y rounded-[8px] border bg-white">
            {tasks.map((task) => (
              <li key={task.id} className="px-4 py-4">
                <div className="text-ink font-bold">{task.title}</div>
                <div className="text-text-secondary mt-1 font-mono text-[0.78rem]">
                  {task.priority.toUpperCase()} · {task.status}
                  {task.dueOn ? ` · Due ${task.dueOn.toLocaleDateString()}` : ''}
                  {task.flagState !== 'none' ? ` · ${task.flagState}` : ''}
                </div>
                {task.description ? (
                  <p className="text-text-secondary mt-1 text-[0.88rem]">{task.description}</p>
                ) : null}
              </li>
            ))}
            {tasks.length === 0 ? (
              <li className="text-text-secondary px-4 py-8 text-center text-[0.88rem]">
                No tasks yet.
              </li>
            ) : null}
          </ul>
        </>
      )}
    </div>
  );
}
