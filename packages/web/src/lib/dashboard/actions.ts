'use server';

import {
  approveExtractedTasks,
  dismissExtractedTasks,
  markTaskHandled,
  refreshDashboard,
  reopenTask,
  startTask,
} from '@/lib/tasks/actions';

export async function markHandledAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  await markTaskHandled({ id });
}

export async function reopenAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  await reopenTask({ id });
}

export async function startTaskAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  await startTask({ id });
}

export async function approveExtractedAction() {
  await approveExtractedTasks();
}

export async function dismissExtractedAction() {
  await dismissExtractedTasks();
}

export async function refreshDashboardAction() {
  await refreshDashboard();
}
