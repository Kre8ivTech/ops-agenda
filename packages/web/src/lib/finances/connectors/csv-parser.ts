// CSV transaction parser
// Supports common bank CSV formats with various date and amount conventions.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  balance?: number;
}

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

const DATE_FORMATS: Array<{ regex: RegExp; parse: (match: RegExpMatchArray) => string }> = [
  {
    // YYYY-MM-DD
    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    parse: (m) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
  },
  {
    // MM/DD/YYYY
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    parse: (m) => `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`,
  },
  {
    // DD/MM/YYYY
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    parse: (m) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`,
  },
];

function parseDate(raw: string): string | null {
  const trimmed = raw.trim();

  for (const fmt of DATE_FORMATS) {
    const match = trimmed.match(fmt.regex);
    if (match) {
      return fmt.parse(match);
    }
  }

  // Fallback: try native Date parsing
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return null;
}

// ---------------------------------------------------------------------------
// CSV parsing helpers
// ---------------------------------------------------------------------------

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

function parseAmount(raw: string): number | null {
  // Remove currency symbols, spaces, and handle parentheses as negative
  let cleaned = raw.trim().replace(/[$£€\s]/g, '');
  let negative = false;

  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1);
    negative = true;
  }

  if (cleaned.startsWith('-')) {
    cleaned = cleaned.slice(1);
    negative = true;
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  return negative ? -num : num;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isHeaderRow(fields: string[]): boolean {
  const headerPatterns = ['date', 'description', 'amount', 'debit', 'credit', 'balance', 'transaction'];
  const normalized = fields.map(normalizeHeader);
  // Consider it a header if at least 2 fields match common header names
  const matches = normalized.filter((f) => headerPatterns.some((p) => f.includes(p)));
  return matches.length >= 2;
}

// ---------------------------------------------------------------------------
// Column detection
// ---------------------------------------------------------------------------

interface ColumnMap {
  date: number;
  description: number;
  amount: number | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

function detectColumns(headers: string[]): ColumnMap {
  const normalized = headers.map(normalizeHeader);

  const find = (patterns: string[]): number | null => {
    const idx = normalized.findIndex((h) =>
      patterns.some((p) => h.includes(p)),
    );
    return idx >= 0 ? idx : null;
  };

  const date = find(['date', 'posted', 'transactiondate']);
  const description = find(['description', 'memo', 'narrative', 'details', 'payee', 'name']);
  const amount = find(['amount', 'total']);
  const debit = find(['debit', 'withdrawal', 'out']);
  const credit = find(['credit', 'deposit', 'in']);
  const balance = find(['balance', 'runningbalance']);

  return {
    date: date ?? 0,
    description: description ?? 1,
    amount,
    debit,
    credit,
    balance,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a bank CSV string into structured transaction rows.
 * Supports:
 * - Single amount column (negative = out, positive = in)
 * - Separate Debit/Credit columns
 * - Common date formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
 * - Auto-detects and skips header row
 */
export function parseTransactionsCsv(csvContent: string): ParsedTransaction[] {
  const lines = csvContent
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const firstRow = splitCsvLine(lines[0]);
  let dataStartIndex = 0;
  let columns: ColumnMap;

  if (isHeaderRow(firstRow)) {
    columns = detectColumns(firstRow);
    dataStartIndex = 1;
  } else {
    // No header detected — assume common order: Date, Description, Amount, Balance
    columns = {
      date: 0,
      description: 1,
      amount: 2,
      debit: null,
      credit: null,
      balance: firstRow.length > 3 ? 3 : null,
    };
  }

  const transactions: ParsedTransaction[] = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i]);

    const dateRaw = fields[columns.date] ?? '';
    const date = parseDate(dateRaw);
    if (!date) continue; // skip rows without a valid date

    const description = fields[columns.description] ?? '';

    let amount: number;
    let direction: 'in' | 'out';

    if (columns.debit !== null && columns.credit !== null) {
      // Separate debit/credit columns
      const debitVal = parseAmount(fields[columns.debit] ?? '');
      const creditVal = parseAmount(fields[columns.credit] ?? '');

      if (creditVal && creditVal > 0) {
        amount = creditVal;
        direction = 'in';
      } else if (debitVal && debitVal > 0) {
        amount = debitVal;
        direction = 'out';
      } else if (debitVal && debitVal < 0) {
        // Sometimes debit is negative
        amount = Math.abs(debitVal);
        direction = 'out';
      } else {
        continue; // no valid amount found
      }
    } else if (columns.amount !== null) {
      // Single amount column
      const parsed = parseAmount(fields[columns.amount] ?? '');
      if (parsed === null) continue;

      amount = Math.abs(parsed);
      direction = parsed < 0 ? 'out' : 'in';
    } else {
      continue; // cannot determine amount
    }

    const balance =
      columns.balance !== null ? parseAmount(fields[columns.balance] ?? '') ?? undefined : undefined;

    transactions.push({
      date,
      description: description.replace(/^["']|["']$/g, ''),
      amount,
      direction,
      balance: balance ?? undefined,
    });
  }

  return transactions;
}

/**
 * Validates parsed transactions and returns valid rows and error messages.
 */
export function validateParsedTransactions(
  rows: ParsedTransaction[],
): { valid: ParsedTransaction[]; errors: string[] } {
  const valid: ParsedTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors: string[] = [];

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      rowErrors.push(`Row ${i + 1}: Invalid date format "${row.date}"`);
    } else {
      const d = new Date(row.date);
      if (isNaN(d.getTime())) {
        rowErrors.push(`Row ${i + 1}: Invalid date "${row.date}"`);
      }
    }

    // Validate amount
    if (typeof row.amount !== 'number' || isNaN(row.amount) || row.amount <= 0) {
      rowErrors.push(`Row ${i + 1}: Invalid amount "${row.amount}"`);
    }

    // Validate direction
    if (row.direction !== 'in' && row.direction !== 'out') {
      rowErrors.push(`Row ${i + 1}: Invalid direction "${row.direction}"`);
    }

    // Validate description
    if (!row.description || row.description.trim().length === 0) {
      rowErrors.push(`Row ${i + 1}: Missing description`);
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      valid.push(row);
    }
  }

  return { valid, errors };
}
