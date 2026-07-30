'use server';

import { markTaskHandled, reopenTask, refreshDashboard } from '@/lib/tasks/actions';

export async function markHandledAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  await markTaskHandled({ id });
}

export async function reopenAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  await reopenTask({ id });
}

export async function refreshDashboardAction() {
  await refreshDashboard();
}
