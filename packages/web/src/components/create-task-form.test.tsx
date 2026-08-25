import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CreateTaskForm } from './create-task-form';

vi.mock('@/lib/tasks/form-actions', () => ({
  createTaskAction: vi.fn(),
}));

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
    render(<CreateTaskForm />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New task' }));

    expect(screen.getByRole('dialog', { name: 'New task' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();
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
