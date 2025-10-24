// Tipos para integração com API Belvo
// Documentação: https://developers.belvo.com

export interface BelvoInstitution {
  id: string;
  name: string;
  type: string;
  code: string;
  country: string;
  status: string;
  display_name: string;
  website?: string;
  logo?: string;
  icon_logo?: string;
  text_logo?: string;
  primary_color?: string;
  form_fields: Array<{
    name: string;
    type: string;
    label: string;
    validation?: string;
    placeholder?: string;
    validation_message?: string;
  }>;
  features: string[];
  integration_type: string;
  resources: string[];
}

export interface BelvoLink {
  id: string;
  institution: string;
  access_mode: string;
  last_accessed_at: string;
  status: string;
  created_by: string;
  refresh_rate: string;
  created_at: string;
  external_id?: string;
}

export interface BelvoAccount {
  id: string;
  link: string;
  institution: {
    name: string;
    type: string;
  };
  collected_at: string;
  category: string;
  type: string;
  name: string;
  number: string;
  balance: {
    current: number;
    available: number;
  };
  currency: string;
  bank_product_id?: string;
  internal_identification?: string;
  public_identification_name?: string;
  public_identification_value?: string;
  last_accessed_at: string;
  credit_data?: {
    credit_limit: number;
    cutting_date: string;
    next_payment_date: string;
    minimum_payment: number;
    no_interest_payment: number;
    last_payment_date: string;
    last_period_balance: number;
    interest_rate: number;
  };
  loan_data?: {
    credit_limit: number;
    cutting_date: string;
    next_payment_date: string;
    minimum_payment: number;
    no_interest_payment: number;
    last_payment_date: string;
    last_period_balance: number;
    interest_rate: number;
  };
  funds_data?: Array<{
    name: string;
    type: string;
    balance: number;
    percentage: number;
  }>;
  gig_payment_data?: {
    collected_at: string;
    acceptance_rate: number;
    cash_out_amount: number;
  };
}

export interface BelvoTransaction {
  id: string;
  account: {
    id: string;
    name: string;
    category: string;
    type: string;
  };
  collected_at: string;
  value_date: string;
  accounting_date: string;
  amount: number;
  balance: number;
  currency: string;
  description: string;
  observations?: string;
  merchant?: {
    name: string;
    website?: string;
  };
  category: string;
  subcategory?: string;
  reference?: string;
  type: string;
  status: string;
  credit_card_data?: {
    bill_name: string;
  };
  gig_data?: {
    collected_at: string;
    pickup_at: string;
    dropoff_at: string;
    request_at: string;
    pickup_address: string;
    dropoff_address: string;
    distance: number;
    time: number;
  };
}

export interface BelvoApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface BelvoError {
  error: string;
  error_description: string;
  request_id: string;
}

export interface BelvoLinkRequest {
  institution: string;
  username: string;
  password: string;
  username2?: string;
  password2?: string;
  token?: string;
  access_mode?: 'single' | 'recurrent';
  fetch_resources?: string[];
  username_type?: string;
  certificate?: string;
  private_key?: string;
}

export interface BelvoAccountsRequest {
  link: string;
  date_from?: string;
  date_to?: string;
  token?: string;
  save_data?: boolean;
}

export interface BelvoTransactionsRequest {
  link: string;
  date_from?: string;
  date_to?: string;
  account?: string;
  token?: string;
  save_data?: boolean;
}

// Estados locais para armazenamento
export interface BelvoConnectionState {
  isConnected: boolean;
  links: BelvoLink[];
  accounts: BelvoAccount[];
  transactions: BelvoTransaction[];
  institutions: BelvoInstitution[];
  lastSync: string | null;
  error: string | null;
}

// Logs do sistema
export interface BelvoLogEntry {
  id: string;
  timestamp: string;
  type: 'success' | 'error' | 'info' | 'debug';
  operation: string;
  message: string;
  data?: any;
  error?: any;
}

// Configuração do Belvo
export interface BelvoConfig {
  baseUrl: string;
  secretId: string;
  secretPassword: string;
  debug: boolean;
}
