import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from './priority-badge';

describe('PriorityBadge', () => {
  it('renders the priority code', () => {
    render(<PriorityBadge priority="P1" />);
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('exposes a descriptive accessible label rather than just the code', () => {
    render(<PriorityBadge priority="P2" />);
    expect(screen.getByLabelText('Priority 2 — act today')).toBeInTheDocument();
  });

  it('renders confidence as a whole percentage when provided', () => {
    render(<PriorityBadge priority="P3" confidence={0.923} />);
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('omits confidence entirely when not provided', () => {
    render(<PriorityBadge priority="FYSA" />);
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it('renders a confidence of 0 rather than treating it as absent', () => {
    render(<PriorityBadge priority="P1" confidence={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
