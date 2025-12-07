import React from 'react';
import { FormData, SimulationResult } from '../types';
import { formatCurrency, formatPercent } from '../utils';
import { COLORS } from '../constants';

interface Props {
  data: FormData;
  results: SimulationResult;
}

const Results: React.FC<Props> = ({ data, results }) => {
  const getRoiColor = (roi: number) => {
    if (roi >= data.minProfitPercent) return COLORS.success;
    if (roi > 0) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-8">
      
      {/* Detailed Result Breakdown */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Detalhamento Financeiro</h2>
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
          <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 text-left">Item</th>
                {results.timeline.map(t => (
                  <th key={t.month} className="p-3 border-l border-gray-700">{t.month} Meses</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <tr className="bg-gray-50 font-semibold text-blue-900">
                <td className="p-2 text-left">Receita Venda</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200">{formatCurrency(t.saleValue)}</td>)}
              </tr>
              <tr className="bg-white">
                <td className="p-2 text-left">Receita Aluguel</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200">{formatCurrency(t.totalRevenue - t.saleValue)}</td>)}
              </tr>
              
              {/* Expenses */}
              <tr className="bg-gray-100 font-bold"><td colSpan={results.timeline.length + 1} className="p-2 text-left text-gray-700">Despesas</td></tr>
              
              <tr>
                <td className="p-2 text-left">Comissão Corretor</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200 text-red-600">-{formatCurrency(t.brokerFee)}</td>)}
              </tr>
              <tr>
                <td className="p-2 text-left">Valor Imóvel (Lance)</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200 text-red-600">-{formatCurrency(data.bidValue)}</td>)}
              </tr>
              <tr>
                <td className="p-2 text-left">Débitos</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200 text-red-600">-{formatCurrency(t.debts)}</td>)}
              </tr>
              <tr>
                <td className="p-2 text-left">Reformas</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200 text-red-600">-{formatCurrency(t.reforms)}</td>)}
              </tr>
               <tr>
                <td className="p-2 text-left">Comissão Leiloeiro</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200 text-red-600">-{formatCurrency(t.auctioneerFee)}</td>)}
              </tr>
               <tr>
                <td className="p-2 text-left">ITBI</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200 text-red-600">-{formatCurrency(t.itbi)}</td>)}
              </tr>
               <tr>
                <td className="p-2 text-left">Custos Fixos (IPTU/Cond)</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200 text-red-600">-{formatCurrency(t.iptuTotal + t.condoTotal)}</td>)}
              </tr>
               <tr>
                <td className="p-2 text-left">Imposto de Renda</td>
                {results.timeline.map(t => <td key={t.month} className="p-2 border-l border-gray-200 text-red-600">-{formatCurrency(t.incomeTax)}</td>)}
              </tr>

               {/* Results */}
              <tr className="bg-gray-800 text-white font-bold">
                <td className="p-3 text-left">Resultado Consolidado</td>
                {results.timeline.map(t => <td key={t.month} className="p-3 border-l border-gray-700">{formatCurrency(t.netProfit)}</td>)}
              </tr>
              <tr className="bg-gray-200 font-bold text-gray-900">
                 <td className="p-3 text-left">Lucro (%)</td>
                 {results.timeline.map(t => (
                   <td key={t.month} className={`p-3 border-l border-white ${getRoiColor(t.roiPercent)}`}>
                     {formatPercent(t.roiPercent)}
                   </td>
                 ))}
              </tr>
               <tr className="bg-gray-100 font-bold text-gray-900">
                 <td className="p-3 text-left">Taxa Equiv. Mensal</td>
                 {results.timeline.map(t => (
                   <td key={t.month} className="p-3 border-l border-white">
                     {formatPercent(t.monthlyRoi)}
                   </td>
                 ))}
              </tr>

            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default Results;