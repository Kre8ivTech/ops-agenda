import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EntitySwitcherClient } from './entity-switcher-client';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  setSelectedEntity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('@/lib/entities/actions', () => ({
  setSelectedEntity: mocks.setSelectedEntity,
}));

const entities = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Personal', kind: 'personal' as const },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Acme LLC', kind: 'llc' as const },
];

describe('EntitySwitcherClient', () => {
  it('changes the active entity and refreshes scoped data', async () => {
    const user = userEvent.setup();
    render(
      <EntitySwitcherClient
        entities={entities}
        selectedEntityId="11111111-1111-4111-8111-111111111111"
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Entity switcher' }),
      '22222222-2222-4222-8222-222222222222',
    );

    await waitFor(() => {
      expect(mocks.setSelectedEntity).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
      expect(mocks.refresh).toHaveBeenCalledOnce();
    });
  });

  it('offers an all-entities view', () => {
    render(<EntitySwitcherClient entities={entities} selectedEntityId="all" />);
    expect(screen.getByRole('option', { name: 'All entities' })).toBeInTheDocument();
  });
});
