export type FinanceProvider = 'plaid' | 'monarch' | 'csv';

export interface FinanceConnectorConfig {
  provider: FinanceProvider;
  label: string;
  description: string;
  icon: string;
  requiresCredentials: boolean;
}

export const FINANCE_PROVIDERS: Record<FinanceProvider, FinanceConnectorConfig> = {
  plaid: {
    provider: 'plaid',
    label: 'Plaid',
    description: 'Connect bank accounts instantly via Plaid Link',
    icon: '🏦',
    requiresCredentials: true,
  },
  monarch: {
    provider: 'monarch',
    label: 'Monarch Money',
    description: 'Sync accounts and transactions from your Monarch Money account',
    icon: '👑',
    requiresCredentials: true,
  },
  csv: {
    provider: 'csv',
    label: 'Manual Upload',
    description: 'Upload a CSV or OFX file from your bank',
    icon: '📄',
    requiresCredentials: false,
  },
};

export const FINANCE_PROVIDER_LIST = Object.values(FINANCE_PROVIDERS);
