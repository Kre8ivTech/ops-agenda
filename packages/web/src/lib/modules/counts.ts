import { isUnhandled } from '@/lib/dashboard/brief';
import { listTasks } from '@/lib/tasks/actions';

/** Open (unhandled) task count for the sidebar badge. Returns 0 on DB failure. */
export async function countOpenTasks(tenant: {
  accountId: string;
  userId: string;
}): Promise<number> {
  try {
    const tasks = await listTasks(tenant);
    return tasks.filter(isUnhandled).length;
  } catch {
    return 0;
  }
}
