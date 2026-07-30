import { describe, it, expect } from 'vitest';
import { parseClassification, sortByPriority, type Classification } from './priority';

const make = (priority: Classification['priority'], confidence: number): Classification => ({
  priority,
  confidence,
  rationale: 'test',
});

describe('sortByPriority', () => {
  it('orders P1 before P2 before P3 before FYSA', () => {
    const sorted = sortByPriority([make('FYSA', 1), make('P3', 1), make('P1', 1), make('P2', 1)]);
    expect(sorted.map((c) => c.priority)).toEqual(['P1', 'P2', 'P3', 'FYSA']);
  });

  it('breaks ties by descending confidence', () => {
    const sorted = sortByPriority([make('P1', 0.4), make('P1', 0.9)]);
    expect(sorted.map((c) => c.confidence)).toEqual([0.9, 0.4]);
  });

  it('does not mutate its input', () => {
    const input = [make('P3', 1), make('P1', 1)];
    sortByPriority(input);
    expect(input[0].priority).toBe('P3');
  });
});

describe('parseClassification', () => {
  it('accepts a well-formed AI response', () => {
    const result = parseClassification({
      priority: 'P1',
      confidence: 0.92,
      rationale: 'CEO asked',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a priority outside the taxonomy', () => {
    const result = parseClassification({ priority: 'URGENT', confidence: 1, rationale: 'x' });
    expect(result.ok).toBe(false);
  });

  it('rejects a confidence score above 1', () => {
    const result = parseClassification({ priority: 'P1', confidence: 1.5, rationale: 'x' });
    expect(result.ok).toBe(false);
  });

  it('rejects a response missing confidence entirely', () => {
    const result = parseClassification({ priority: 'P1', rationale: 'x' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('confidence');
  });

  it('reports the offending field so failures are debuggable', () => {
    const result = parseClassification({ priority: 'nope', confidence: 0.5, rationale: 'x' });
    if (!result.ok) expect(result.error).toContain('priority');
  });
});
