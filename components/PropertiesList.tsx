
import React, { useEffect, useState } from 'react';
import { FormData } from '../types';
import { formatCurrency, formatPercent, calculateScenario } from '../utils';
import { storageService } from '../services/storage';
import { Trash2, PlusCircle, ImageOff, Cloud, RefreshCw } from 'lucide-react';

interface Props {
  onLoadProperty: (data: FormData) => void;
  onNewProperty: () => void;
}

const PropertiesList: React.FC<Props> = ({ onLoadProperty, onNewProperty }) => {
  const [properties, setProperties] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    const data = await storageService.loadProperties();
    setProperties(data);
    setLoading(false);
  };

  const deleteProperty = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
      await storageService.deleteProperty(id);
      loadProperties();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            Meus Imóveis
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"><Cloud size={12}/> Nuvem</span>
          </h2>
          <p className="text-gray-500">Gerencie sua carteira de oportunidades</p>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
            <button 
                onClick={loadProperties}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Atualizar lista"
            >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
                onClick={onNewProperty}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
            >
                <PlusCircle size={20} /> Nova Análise
            </button>
        </div>
      </div>

      {loading ? (
          <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-300">
           <h3 className="text-xl font-bold text-gray-400 mb-2">Nenhum imóvel encontrado</h3>
           <p className="text-gray-400 mb-6">Comece uma nova análise ou verifique sua conexão.</p>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(prop => {
                const cover = prop.images?.find(i => i.isCover) || prop.images?.[0];
                const sim = calculateScenario(prop, 6);

                return (
                <div 
                    key={prop.id} 
                    onClick={() => onLoadProperty(prop)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
                >
                    {/* Image Area */}
                    <div className="h-40 bg-gray-100 relative shrink-0">
                    {cover ? (
                        <img src={cover.url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageOff size={40} />
                        <span className="text-xs mt-2">Sem foto</span>
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                        onClick={(e) => deleteProperty(e, prop.id)}
                        className="bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-700"
                        title="Excluir"
                        >
                        <Trash2 size={16} />
                        </button>
                    </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-base text-gray-800 truncate mb-1">
                        {prop.city || 'Cidade não inf.'}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 truncate">
                        {prop.address || 'Endereço não informado'}
                    </p>
                    
                    <div className="mt-auto grid grid-cols-2 gap-y-3 gap-x-2 border-t pt-3 bg-gray-50 -mx-4 -mb-4 px-4 pb-3">
                        <div>
                            <div className="text-[10px] uppercase font-bold text-gray-500">Lance</div>
                            <div className="font-semibold text-sm text-gray-800">{formatCurrency(prop.bidValue)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-gray-500">Venda Est.</div>
                            <div className="font-semibold text-sm text-gray-800">{formatCurrency(prop.marketValue)}</div>
                        </div>
                        
                        <div>
                            <div className="text-[10px] uppercase font-bold text-gray-500">Lucro Líq. (6m)</div>
                            <div className={`font-bold text-sm ${sim.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(sim.netProfit)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-gray-500">Retorno (ROI)</div>
                            <div className={`font-bold text-sm ${sim.roiPercent >= prop.minProfitPercent ? 'text-green-600' : 'text-yellow-600'}`}>
                                {formatPercent(sim.roiPercent)}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                );
            })}
            </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesList;
