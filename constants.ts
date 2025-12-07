
import { FormData } from './types';

export const INITIAL_FORM_DATA: FormData = {
  id: '',
  lastModified: Date.now(),
  city: '',
  address: '',
  auctionLink: '',
  propertyOrigin: 'Banco',
  auctionType: 'Extrajudicial - Bancos',
  
  paymentMethod: 'À Vista',
  cashDiscountPercent: 10,
  financingEntryPercent: 25,
  financingRateMonthly: 1.0,
  financingMonths: 36,

  bidValue: 110000,
  bidIncrement: 3000,
  auctioneerFeePercent: 5,
  itbiPercent: 2,
  iptuMonthly: 0,
  condoMonthly: 0,
  debts: 0,
  reforms: 30000,
  advisoryFee: 0,
  vacationCost: 5000,
  
  // Updated defaults to percentages
  deedPercent: 1.5, // Avg market default
  registryPercent: 1.0, // Avg market default

  incomeTaxMode: 'PF',
  incomeTaxRate: 15,

  marketValue: 260000,
  saleDiscountPercent: 0,
  brokerFeePercent: 6,
  rentRevenue: 0,

  minProfitPercent: 30,

  marketResearchItems: [
    { id: 1, price: 0, link: '', description: '' },
    { id: 2, price: 0, link: '', description: '' },
    { id: 3, price: 0, link: '', description: '' },
    { id: 4, price: 0, link: '', description: '' },
    { id: 5, price: 0, link: '', description: '' },
  ],

  images: [],
  documents: []
};

export const SIMULATION_MONTHS = [1, 3, 4, 6, 7, 9, 10, 12];

export const COLORS = {
  bgHeader: 'bg-gray-200',
  border: 'border-black',
  textHeader: 'text-gray-900 font-bold',
  zebra: 'even:bg-gray-50',
  success: 'bg-[#4ade80]', // Bright green like PDF
  warning: 'bg-[#facc15]', // Yellow
  danger: 'bg-[#f87171]', // Red
};