import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectionEntityAssigner } from './connection-entity-assigner';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  assignConnectionEntity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('@/lib/entities/actions', () => ({
  assignConnectionEntity: mocks.assignConnectionEntity,
}));

const entities = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Personal', kind: 'personal' as const },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Northstar Advisory', kind: 'llc' as const },
];

describe('ConnectionEntityAssigner', () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.assignConnectionEntity.mockReset();
    mocks.assignConnectionEntity.mockResolvedValue(undefined);
  });

  it('assigns the selected entity to the given connection', async () => {
    const user = userEvent.setup();
    render(
      <ConnectionEntityAssigner
        connectionId="33333333-3333-4333-8333-333333333333"
        accountLabel="info@example.com mail"
        entityId={entities[0].id}
        entities={entities}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Entity for info@example.com mail' }),
      entities[1].id,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.assignConnectionEntity).toHaveBeenCalledWith({
        connectionId: '33333333-3333-4333-8333-333333333333',
        entityId: entities[1].id,
      });
      expect(mocks.refresh).toHaveBeenCalledOnce();
      expect(screen.getByRole('status')).toHaveTextContent('Saved');
    });
  });

  it('shows an error when assignment fails', async () => {
    mocks.assignConnectionEntity.mockRejectedValueOnce(new Error('Unavailable'));
    const user = userEvent.setup();
    render(
      <ConnectionEntityAssigner
        connectionId="33333333-3333-4333-8333-333333333333"
        accountLabel="info@example.com mail"
        entityId={entities[0].id}
        entities={entities}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Entity for info@example.com mail' }),
      entities[1].id,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save entity. Try again.');
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
