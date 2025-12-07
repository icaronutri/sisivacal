
export type AuctionType = 
  | 'Judicial - 1º Leilão'
  | 'Judicial - 2º Leilão'
  | 'Extrajudicial - Lei 9.514'
  | 'Extrajudicial - Bancos'
  | 'Venda Direta Bancos'
  | 'Venda Direta Pós-Leilão'
  | 'Leilão Órgãos Públicos';

export type PaymentMethod = 
  | 'À Vista'
  | 'À Vista com Desconto'
  | 'Parcelamento Judicial'
  | 'Financiamento - Caixa'
  | 'Financiamento - BB'
  | 'Financiamento - Itaú'
  | 'Financiamento - Santander'
  | 'Financiamento - Bradesco'
  | 'FGTS'
  | 'Consórcio Contemplado'
  | 'Carta de Crédito';

export interface MarketComparable {
  id: number;
  price: number;
  link: string;
  description: string;
}

export interface PropertyImage {
  id: string;
  url: string; // Base64 or URL
  isCover: boolean;
}

export interface PropertyDocument {
  id: string;
  name: string;
  link: string; // URL or internal reference
  type: 'pdf' | 'image' | 'link' | 'other';
}

export interface FormData {
  id: string; // Unique ID for saving
  lastModified: number;

  // Basic Info
  city: string;
  address: string;
  auctionLink: string;
  propertyOrigin: string;
  auctionType: AuctionType;
  
  // Payment
  paymentMethod: PaymentMethod;
  cashDiscountPercent: number; // For "À Vista com Desconto"
  financingEntryPercent: number; // For Financing/Installments
  financingRateMonthly: number; // Juros
  financingMonths: number;

  // Values & Expenses
  bidValue: number; // Lance
  bidIncrement: number; // For simulation table
  auctioneerFeePercent: number;
  itbiPercent: number;
  iptuMonthly: number;
  condoMonthly: number;
  debts: number; // Débitos do imóvel
  reforms: number;
  advisoryFee: number; // Custo assessoria
  vacationCost: number; // Custo desocupação
  
  // Changed to percentages
  deedPercent: number; // Escritura %
  registryPercent: number; // Registro %

  incomeTaxMode: 'PF' | 'PJ';
  incomeTaxRate: number; // Calculated or manual

  // Revenue
  marketValue: number; // Valor de Venda
  saleDiscountPercent: number;
  brokerFeePercent: number;
  rentRevenue: number; // During possession

  // Simulation Params
  minProfitPercent: number;

  // Market Research Detailed Data
  marketResearchItems: MarketComparable[];

  // Gallery & Docs
  images: PropertyImage[];
  documents: PropertyDocument[];
}

export interface MarketResearchData {
  average: number;
  median: number;
  min: number;
  max: number;
}

export interface MonthlyResult {
  month: number;
  saleValue: number;
  totalRevenue: number;
  
  // Expenses breakdown
  auctioneerFee: number;
  itbi: number;
  reforms: number;
  vacation: number;
  debts: number;
  advisory: number;
  deed: number;
  registry: number;
  condoTotal: number;
  iptuTotal: number;
  opportunityCost: number;
  financingInterest: number;
  incomeTax: number;
  brokerFee: number;
  
  initialOutlay: number; // Valor desembolsado inicialmente
  totalCost: number; // Custo final contábil
  
  netProfit: number; // Resultado Consolidado
  roiPercent: number; // Lucro (%)
  monthlyRoi: number; // Taxa Equiv. Mensal
}

export interface SimulationResult {
  timeline: MonthlyResult[];
  bidTable: BidTableRow[];
}

export interface BidTableRow {
  bidValue: number;
  resultsByMonth: {
    month: number;
    profit: number;
    roi: number;
  }[];
}

export interface AppSettings {
  storageType: 'local' | 'cloud';
  supabaseUrl: string;
  supabaseKey: string;
}

export interface ValidationStep {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  details?: string;
}