import { getSession } from '@/lib/auth';
import { listTasks } from '@/lib/tasks/actions';
import { CreateTaskForm } from '@/components/create-task-form';

export default async function TasksPage() {
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-900">
        Your session is not linked to a tenant account. Complete onboarding to continue.
      </div>
    );
  }

  const tenant = { accountId: session.accountId, userId: session.userId };
  const tasks = await listTasks(tenant);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tasks</h1>
      <CreateTaskForm tenant={tenant} />
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {tasks.map((task) => (
          <li key={task.id} className="py-4">
            <div className="font-medium">{task.title}</div>
            <div className="text-sm text-zinc-500">
              {task.priority} · {task.status}
              {task.dueOn ? ` · Due ${task.dueOn.toLocaleDateString()}` : ''}
            </div>
            {task.description ? (
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{task.description}</p>
            ) : null}
          </li>
        ))}
        {tasks.length === 0 ? <li className="py-8 text-sm text-zinc-500">No tasks yet.</li> : null}
      </ul>
    </div>
  );
}
