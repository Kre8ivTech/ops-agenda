'use server';

import { markTaskHandled, reopenTask, refreshDashboard } from '@/lib/tasks/actions';

export async function markHandledAction(formData: FormData) {
  const accountId = String(formData.get('accountId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  const id = String(formData.get('id') ?? '');
  await markTaskHandled({ accountId, userId }, { id });
}

export async function reopenAction(formData: FormData) {
  const accountId = String(formData.get('accountId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  const id = String(formData.get('id') ?? '');
  await reopenTask({ accountId, userId }, { id });
}

export async function refreshDashboardAction() {
  await refreshDashboard();
}
