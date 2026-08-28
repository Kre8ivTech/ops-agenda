import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BusinessSelector } from './business-selector';

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

const businesses = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Northstar Advisory' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Fieldnote Studio' },
];

describe('BusinessSelector', () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.setSelectedEntity.mockReset();
    mocks.setSelectedEntity.mockResolvedValue(undefined);
  });

  it('scopes the shared entity selection to the chosen business', async () => {
    const user = userEvent.setup();
    render(<BusinessSelector businesses={businesses} selectedBusinessId="all" />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Choose a business' }),
      businesses[0].id,
    );

    await waitFor(() => {
      expect(mocks.setSelectedEntity).toHaveBeenCalledWith(businesses[0].id);
      expect(mocks.refresh).toHaveBeenCalledOnce();
    });
  });

  it('restores the previous selection when the scope cannot be saved', async () => {
    mocks.setSelectedEntity.mockRejectedValueOnce(new Error('Unavailable'));
    const user = userEvent.setup();
    render(<BusinessSelector businesses={businesses} selectedBusinessId="all" />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Choose a business' }),
      businesses[1].id,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not change business. Try again.',
    );
    expect(screen.getByRole('combobox', { name: 'Choose a business' })).toHaveValue('all');
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
