
import { FormData, MonthlyResult, BidTableRow } from './types';
import { SIMULATION_MONTHS } from './constants';
import QRCode from 'qrcode';

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    if (!text) return '';
    return await QRCode.toDataURL(text, { width: 100, margin: 1 });
  } catch (err) {
    console.error(err);
    return '';
  }
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const parseCurrency = (value: string): number => {
  return Number(value.replace(/[^0-9,-]+/g, "").replace(",", "."));
};

const calculateIR = (profit: number, mode: 'PF' | 'PJ') => {
  if (profit <= 0) return 0;
  // Simplified logic based on PDF showing ~15% on net gain.
  // In reality, PF capital gain is 15%.
  return profit * 0.15;
};

export const calculateScenario = (data: FormData, month: number, overrideBid?: number): MonthlyResult => {
  const currentBid = overrideBid || data.bidValue;

  // Revenue
  const discountFactor = 1 - (data.saleDiscountPercent / 100);
  const salePrice = data.marketValue * discountFactor;
  const totalRent = data.rentRevenue * month;
  
  // Direct Expenses based on Bid
  const auctioneerFee = currentBid * (data.auctioneerFeePercent / 100);
  const itbi = currentBid * (data.itbiPercent / 100);
  
  // Calculated Fees based on Percentages
  const deed = currentBid * (data.deedPercent / 100);
  const registry = currentBid * (data.registryPercent / 100);

  // Holding Costs
  const condoTotal = data.condoMonthly * month;
  const iptuTotal = data.iptuMonthly * month;
  
  // Fixed Costs
  const reforms = data.reforms;
  const vacation = data.vacationCost;
  const debts = data.debts;
  const advisory = data.advisoryFee;

  // Sales Costs
  const brokerFee = salePrice * (data.brokerFeePercent / 100);

  // Financial
  // Assuming "Cost to Purchase" includes everything upfront.
  const opportunityCost = 0; 
  const financingInterest = 0; 

  // Subtotal Expenses (Before IR)
  const costWithoutIR = currentBid + auctioneerFee + itbi + reforms + vacation + debts + advisory + deed + registry + condoTotal + iptuTotal + brokerFee;

  // Gross Profit for IR Calculation
  const grossProfit = (salePrice + totalRent) - costWithoutIR;
  
  const incomeTax = calculateIR(grossProfit, data.incomeTaxMode);

  const totalCost = costWithoutIR + incomeTax;
  const netProfit = (salePrice + totalRent) - totalCost;

  const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  
  // Monthly Equivalent Rate: ((1 + ROI)^(1/n)) - 1
  const roiDecimal = roiPercent / 100;
  const monthlyRoi = ((Math.pow(1 + roiDecimal, 1 / month) - 1) * 100);

  // Initial Outlay (Cash needed upfront)
  let initialOutlay = currentBid + auctioneerFee + itbi + reforms + vacation + debts + advisory + deed + registry;
  if (data.paymentMethod.includes('À Vista com Desconto')) {
      const discount = currentBid * (data.cashDiscountPercent / 100);
      initialOutlay -= discount;
  }

  return {
    month,
    saleValue: salePrice,
    totalRevenue: salePrice + totalRent,
    auctioneerFee,
    itbi,
    reforms,
    vacation,
    debts,
    advisory,
    deed,
    registry,
    condoTotal,
    iptuTotal,
    opportunityCost,
    financingInterest,
    incomeTax,
    brokerFee,
    initialOutlay,
    totalCost,
    netProfit,
    roiPercent,
    monthlyRoi
  };
};

export const generateBidTable = (data: FormData): BidTableRow[] => {
  const rows: BidTableRow[] = [];
  const startBid = data.bidValue;
  const increment = data.bidIncrement || 1000;
  
  // Generate 10 rows
  for (let i = 0; i < 10; i++) {
    const simBid = startBid + (increment * i);
    const rowResults = SIMULATION_MONTHS.map(m => {
      const result = calculateScenario(data, m, simBid);
      return {
        month: m,
        profit: result.netProfit,
        roi: result.roiPercent
      };
    });
    rows.push({
      bidValue: simBid,
      resultsByMonth: rowResults
    });
  }
  return rows;
};