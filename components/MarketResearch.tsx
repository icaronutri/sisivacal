
import React, { useState, useEffect } from 'react';
import { FormData, MarketResearchData, MarketComparable } from '../types';
import { formatCurrency } from '../utils';
import { ExternalLink, Save, Check } from 'lucide-react';

interface Props {
  formData: FormData;
  onUpdateSaleValue: (value: number) => void;
  // Optional prop to update parent state if we want full persistence
  onItemsChange?: (items: MarketComparable[]) => void;
}

const MarketResearch: React.FC<Props> = ({ formData, onUpdateSaleValue, onItemsChange }) => {
  const [items, setItems] = useState<MarketComparable[]>(formData.marketResearchItems || []);
  const [stats, setStats] = useState<MarketResearchData | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setItems(formData.marketResearchItems);
  }, [formData.marketResearchItems]);

  useEffect(() => {
    const validPrices = items
      .map(i => i.price)
      .filter(p => p > 0);

    if (validPrices.length > 0) {
      const sum = validPrices.reduce((a, b) => a + b, 0);
      const avg = sum / validPrices.length;
      
      const sorted = [...validPrices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

      setStats({
        average: avg,
        median: median,
        min: sorted[0],
        max: sorted[sorted.length - 1]
      });
    } else {
      setStats(null);
    }
  }, [items]);

  const handleItemChange = (id: number, field: keyof MarketComparable, value: any) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(newItems);
    if (onItemsChange) {
        onItemsChange(newItems);
    }
  };

  const handleSave = () => {
    // Visual confirmation since state is already lifted
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
       <div className="flex justify-between items-center border-b pb-2 mb-6">
         <h2 className="text-2xl font-bold text-gray-800">Pesquisa de Mercado Detalhada</h2>
         <button 
           onClick={handleSave}
           className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-all ${
             showSaved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
           }`}
         >
           {showSaved ? <Check size={18} /> : <Save size={18} />}
           {showSaved ? 'Pesquisa Salva!' : 'Salvar Pesquisa'}
         </button>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 p-4">
             <h3 className="font-bold text-blue-800 mb-4 border-b pb-2">Amostras de Imóveis Semelhantes</h3>
             <div className="space-y-6">
                {items.map((item, index) => (
                   <div key={item.id} className="bg-gray-50 p-4 rounded border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                         <span className="font-bold text-sm text-gray-600">Amostra #{index + 1}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Valor (R$)</label>
                            <input
                              type="number"
                              className="w-full border rounded px-2 py-1.5 text-sm"
                              value={item.price || ''}
                              onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))}
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Link do Anúncio</label>
                            <div className="flex">
                                <input
                                type="text"
                                className="w-full border rounded-l px-2 py-1.5 text-sm"
                                value={item.link}
                                placeholder="https://..."
                                onChange={(e) => handleItemChange(item.id, 'link', e.target.value)}
                                />
                                {item.link && (
                                    <a href={item.link} target="_blank" rel="noreferrer" className="bg-blue-100 hover:bg-blue-200 border border-l-0 rounded-r px-2 flex items-center">
                                        <ExternalLink size={14} className="text-blue-700"/>
                                    </a>
                                )}
                            </div>
                         </div>
                         <div className="col-span-1 md:col-span-2">
                             <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição / Notas</label>
                             <input
                                type="text"
                                className="w-full border rounded px-2 py-1.5 text-sm"
                                placeholder="Ex: Mesmo condomínio, porém reformado..."
                                value={item.description}
                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                             />
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
             <div className="bg-slate-50 p-6 rounded-lg border border-gray-200 sticky top-4">
                <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Estatísticas do Mercado</h3>
                {stats ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
                      <div className="text-xs text-gray-500 uppercase font-bold">Média de Mercado</div>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.average)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                        <div className="text-xs text-gray-500 uppercase font-bold">Mediana</div>
                        <div className="text-lg font-semibold">{formatCurrency(stats.median)}</div>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                        <div className="text-xs text-gray-500 uppercase font-bold">Menor Valor</div>
                        <div className="text-lg font-semibold text-green-600">{formatCurrency(stats.min)}</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Use a média calculada como valor de venda.</p>
                        <button
                        onClick={() => onUpdateSaleValue(stats.average)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition shadow-md"
                        >
                        Aplicar Média
                        </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-10 text-sm">
                    Preencha os valores para gerar estatísticas.
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default MarketResearch;
