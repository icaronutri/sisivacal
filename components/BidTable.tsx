import React from 'react';
import { FormData, SimulationResult } from '../types';
import { formatCurrency, formatPercent } from '../utils';
import { COLORS } from '../constants';

interface Props {
  data: FormData;
  results: SimulationResult;
}

const BidTable: React.FC<Props> = ({ data, results }) => {
  const getRoiColor = (roi: number) => {
    if (roi >= data.minProfitPercent) return COLORS.success;
    if (roi > 0) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
       <h2 className="text-2xl font-bold text-gray-800 mb-4">Tabela de Lances (Sensibilidade)</h2>
       <p className="mb-4 text-sm text-gray-600">Análise de viabilidade variando o valor do lance com incremento de {formatCurrency(data.bidIncrement)}.</p>
       
       <div className="overflow-x-auto border border-gray-900">
         <table className="w-full text-sm text-center border-collapse">
            <thead>
                <tr className="bg-white">
                    <th className={`border border-black p-2 bg-white text-left`}>Valor Lance</th>
                    <th className={`border border-black p-2 bg-white`}>Parâmetros</th>
                    <th colSpan={results.timeline.length} className="border border-black p-2 font-bold text-lg bg-gray-50">Giro Venda (meses)</th>
                </tr>
                <tr className="bg-gray-100">
                    <th className="border border-black bg-white"></th>
                    <th className="border border-black bg-white"></th>
                    {results.timeline.map(t => (
                        <th key={t.month} className="border border-black p-1">{t.month} meses</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {results.bidTable.map((row, idx) => (
                    <React.Fragment key={idx}>
                        {/* Result Row */}
                        <tr className="bg-green-100">
                            <td rowSpan={2} className="border border-black p-2 font-bold bg-white text-left align-middle">
                                {formatCurrency(row.bidValue)}
                            </td>
                            <td className="border border-black p-1 text-xs font-semibold bg-white">Resultado</td>
                            {row.resultsByMonth.map(r => (
                                <td key={r.month} className={`border border-black p-1 text-xs ${getRoiColor(r.roi)}`}>
                                    {formatCurrency(r.profit)}
                                </td>
                            ))}
                        </tr>
                        {/* ROI Row */}
                        <tr className="bg-white">
                            <td className="border border-black p-1 text-xs font-semibold">Lucro</td>
                             {row.resultsByMonth.map(r => (
                                <td key={r.month} className={`border border-black p-1 text-xs ${getRoiColor(r.roi)}`}>
                                    {formatPercent(r.roi)}
                                </td>
                            ))}
                        </tr>
                    </React.Fragment>
                ))}
            </tbody>
         </table>
       </div>
    </div>
  );
};

export default BidTable;