import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CreateTaskForm } from './create-task-form';

vi.mock('@/lib/tasks/form-actions', () => ({
  createTaskAction: vi.fn(),
}));

const assignableUsers = [
  { id: 'user-1', name: 'Alex Rivera', email: 'alex@example.com' },
  { id: 'user-2', name: 'Jordan Lee', email: 'jordan@example.com' },
];

const entities = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Acme LLC', kind: 'llc' as const },
];

beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value() {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value() {
        this.open = false;
      },
    },
  });
});

describe('CreateTaskForm', () => {
  it('opens the task form in a named modal', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskForm assignableUsers={assignableUsers} entities={entities} defaultEntityId={entities[0].id} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New task' }));

    expect(screen.getByRole('dialog', { name: 'New task' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();
  });

  it('shows assignee email and company fields', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskForm assignableUsers={assignableUsers} entities={entities} defaultEntityId={entities[0].id} />,
    );

    await user.click(screen.getByRole('button', { name: 'New task' }));

    expect(screen.getByLabelText('Assignee email')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Company' })).toHaveValue(entities[0].id);
  });

  it('closes from the cancel action', async () => {
    const user = userEvent.setup();
    render(<CreateTaskForm />);

    await user.click(screen.getByRole('button', { name: 'New task' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when the user presses Escape', async () => {
    const user = userEvent.setup();
    render(<CreateTaskForm />);

    await user.click(screen.getByRole('button', { name: 'New task' }));
    fireEvent(screen.getByRole('dialog', { name: 'New task' }), new Event('cancel'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
