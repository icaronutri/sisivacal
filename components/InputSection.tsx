
import React, { useState } from 'react';
import { FormData, PropertyImage, PropertyDocument } from '../types';
import { FormInput } from './FormInput';
import { formatCurrency } from '../utils';
import { Save, Check, Image as ImageIcon, FileText, Trash2, Plus, Loader2 } from 'lucide-react';

interface Props {
  data: FormData;
  onChange: (data: FormData) => void;
  onSave: () => Promise<void>;
}

const InputSection: React.FC<Props> = ({ data, onChange, onSave }) => {
  const [subTab, setSubTab] = useState<'dados' | 'fotos' | 'docs'>('dados');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [newLink, setNewLink] = useState('');
  const [newLinkName, setNewLinkName] = useState('');

  const update = (field: keyof FormData, val: any) => {
    onChange({ ...data, [field]: val });
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    await onSave();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const getCalculatedCost = (percent: number) => {
    return data.bidValue * (percent / 100);
  };

  // Image Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: PropertyImage = {
          id: Date.now().toString(),
          url: reader.result as string,
          isCover: data.images.length === 0 // First image is cover
        };
        update('images', [...data.images, newImage]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id: string) => {
    update('images', data.images.filter(img => img.id !== id));
  };

  const setCover = (id: string) => {
    const updated = data.images.map(img => ({
      ...img,
      isCover: img.id === id
    }));
    update('images', updated);
  };

  // Document Handling
  const addDocumentLink = () => {
    if (newLink && newLinkName) {
        const newDoc: PropertyDocument = {
            id: Date.now().toString(),
            name: newLinkName,
            link: newLink,
            type: 'link'
        };
        update('documents', [...data.documents, newDoc]);
        setNewLink('');
        setNewLinkName('');
    }
  };

  const removeDoc = (id: string) => {
      update('documents', data.documents.filter(d => d.id !== id));
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header & Save */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">
                {subTab === 'dados' ? 'Editar Dados do Leilão' : subTab === 'fotos' ? 'Galeria de Fotos' : 'Documentos do Imóvel'}
            </h2>
            <p className="text-sm text-gray-500">
                {data.city ? `${data.city} - ${data.address || 'Sem endereço'}` : 'Novo Imóvel'}
            </p>
        </div>
        <button 
           onClick={handleSave}
           disabled={saveStatus === 'saving'}
           className={`flex items-center gap-2 px-6 py-2.5 rounded shadow-sm font-bold transition-all ${
             saveStatus === 'saved' 
                ? 'bg-green-600 text-white' 
                : saveStatus === 'saving'
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
           }`}
         >
           {saveStatus === 'saved' && <Check size={18} />}
           {saveStatus === 'saving' && <Loader2 size={18} className="animate-spin" />}
           {saveStatus === 'idle' && <Save size={18} />}
           {saveStatus === 'saved' ? 'Salvo!' : saveStatus === 'saving' ? 'Salvando...' : 'Salvar Imóvel'}
         </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-full md:w-auto self-start overflow-x-auto">
          <button 
            onClick={() => setSubTab('dados')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${subTab === 'dados' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          >
              <FileText size={16}/> Dados Gerais
          </button>
          <button 
            onClick={() => setSubTab('fotos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${subTab === 'fotos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          >
              <ImageIcon size={16}/> Galeria de Fotos
          </button>
          <button 
            onClick={() => setSubTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${subTab === 'docs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          >
              <FileText size={16}/> Documentos
          </button>
      </div>

      {/* CONTENT: DATA */}
      {subTab === 'dados' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Basic Info */}
            <div className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-100 pb-2">1. Dados do Imóvel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="Cidade" value={data.city} onChange={v => update('city', v)} />
                <FormInput label="Origem" value={data.propertyOrigin} onChange={v => update('propertyOrigin', v)} />
                <div className="col-span-1 md:col-span-2">
                    <FormInput label="Endereço" value={data.address} onChange={v => update('address', v)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <FormInput label="Link do Leilão" value={data.auctionLink} onChange={v => update('auctionLink', v)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <FormInput 
                        label="Tipo de Leilão" 
                        type="select" 
                        value={data.auctionType} 
                        onChange={v => update('auctionType', v)} 
                        options={[
                            'Judicial - 1º Leilão',
                            'Judicial - 2º Leilão',
                            'Extrajudicial - Lei 9.514',
                            'Extrajudicial - Bancos',
                            'Venda Direta Bancos',
                            'Venda Direta Pós-Leilão',
                            'Leilão Órgãos Públicos'
                        ]}
                    />
                </div>
            </div>
            </div>

            {/* Payment */}
            <div className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-100 pb-2">2. Pagamento</h3>
            <FormInput 
                label="Forma de Pagamento" 
                type="select" 
                value={data.paymentMethod} 
                onChange={v => update('paymentMethod', v)} 
                options={[
                    'À Vista', 'À Vista com Desconto', 'Parcelamento Judicial', 
                    'Financiamento - Caixa', 'Financiamento - BB', 'Financiamento - Itaú', 
                    'Financiamento - Santander', 'Financiamento - Bradesco', 
                    'FGTS', 'Consórcio Contemplado', 'Carta de Crédito'
                ]}
            />
            {data.paymentMethod === 'À Vista com Desconto' && (
                <FormInput label="Desconto (%)" type="number" value={data.cashDiscountPercent} onChange={v => update('cashDiscountPercent', v)} prefix="%" />
            )}
            {(data.paymentMethod.includes('Financiamento') || data.paymentMethod.includes('Parcelamento')) && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                    <FormInput label="Entrada (%)" type="number" value={data.financingEntryPercent} onChange={v => update('financingEntryPercent', v)} prefix="%" />
                    <FormInput label="Parcelas" type="number" value={data.financingMonths} onChange={v => update('financingMonths', v)} />
                    <FormInput label="Juros Mensal (%)" type="number" value={data.financingRateMonthly} onChange={v => update('financingRateMonthly', v)} prefix="%" />
                </div>
            )}
            </div>

            {/* Expenses */}
            <div className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-100 pb-2">3. Despesas do Negócio</h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <FormInput label="Valor do Lance Base" type="currency" value={data.bidValue} onChange={v => update('bidValue', v)} prefix="R$" />
                </div>
                
                <FormInput label="Incremento Lance" type="currency" value={data.bidIncrement} onChange={v => update('bidIncrement', v)} prefix="R$" />
                <FormInput label="Comissão Leiloeiro (%)" type="number" value={data.auctioneerFeePercent} onChange={v => update('auctioneerFeePercent', v)} prefix="%" />
                
                <FormInput label="ITBI (%)" type="number" value={data.itbiPercent} onChange={v => update('itbiPercent', v)} prefix="%" />
                <FormInput label="IPTU Mensal" type="currency" value={data.iptuMonthly} onChange={v => update('iptuMonthly', v)} prefix="R$" />
                
                <FormInput label="Condomínio Mensal" type="currency" value={data.condoMonthly} onChange={v => update('condoMonthly', v)} prefix="R$" />
                <FormInput label="Débitos / Dívidas" type="currency" value={data.debts} onChange={v => update('debts', v)} prefix="R$" />
                
                <FormInput label="Reformas" type="currency" value={data.reforms} onChange={v => update('reforms', v)} prefix="R$" />
                <FormInput label="Assessoria" type="currency" value={data.advisoryFee} onChange={v => update('advisoryFee', v)} prefix="R$" />
                
                <div className="col-span-2 border-t pt-2 mt-2">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Custos de Cartório (Percentual)</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <FormInput label="Escritura (%)" type="number" value={data.deedPercent} onChange={v => update('deedPercent', v)} prefix="%" step="0.1" />
                        <span className="text-xs text-gray-500 font-medium">= {formatCurrency(getCalculatedCost(data.deedPercent))}</span>
                    </div>
                    <div>
                        <FormInput label="Registro (%)" type="number" value={data.registryPercent} onChange={v => update('registryPercent', v)} prefix="%" step="0.1" />
                        <span className="text-xs text-gray-500 font-medium">= {formatCurrency(getCalculatedCost(data.registryPercent))}</span>
                    </div>
                </div>
                </div>

                <FormInput label="Desocupação" type="currency" value={data.vacationCost} onChange={v => update('vacationCost', v)} prefix="R$" />
            </div>
            </div>

            {/* Revenue */}
            <div className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-100 pb-2">4. Receitas e Parâmetros</h3>
            <div className="space-y-3">
                <FormInput label="Valor de Venda (Mercado)" type="currency" value={data.marketValue} onChange={v => update('marketValue', v)} prefix="R$" />
                <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Desconto na Venda (%)" type="number" value={data.saleDiscountPercent} onChange={v => update('saleDiscountPercent', v)} prefix="%" />
                    <FormInput label="Comissão Corretor (%)" type="number" value={data.brokerFeePercent} onChange={v => update('brokerFeePercent', v)} prefix="%" />
                </div>
                <FormInput label="Receita Aluguel (Mensal)" type="currency" value={data.rentRevenue} onChange={v => update('rentRevenue', v)} prefix="R$" />
                <hr className="my-2"/>
                <FormInput label="Lucro Mínimo Desejado (%)" type="number" value={data.minProfitPercent} onChange={v => update('minProfitPercent', v)} prefix="%" />
            </div>
            </div>
        </div>
      )}

      {/* CONTENT: PHOTOS */}
      {subTab === 'fotos' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Fotos do Imóvel</h3>
                <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer flex items-center gap-2">
                    <Plus size={18} /> Adicionar Foto
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
            </div>

            {data.images.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-300">
                    Nenhuma foto adicionada.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.images.map((img) => (
                        <div key={img.id} className="relative group border rounded-lg overflow-hidden h-40">
                            <img src={img.url} alt="Property" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
                                {!img.isCover && (
                                    <button onClick={() => setCover(img.id)} className="text-white text-xs bg-blue-600 px-2 py-1 rounded">Definir Capa</button>
                                )}
                                <button onClick={() => removeImage(img.id)} className="text-white bg-red-600 p-1 rounded"><Trash2 size={16}/></button>
                            </div>
                            {img.isCover && (
                                <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-2 py-0.5 font-bold uppercase">Capa</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <p className="text-xs text-gray-500 mt-4">As fotos serão exibidas no relatório final. A foto marcada como "Capa" aparecerá primeiro.</p>
        </div>
      )}

      {/* CONTENT: DOCUMENTS */}
      {subTab === 'docs' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
             <div className="mb-6">
                <h3 className="font-bold text-gray-800 text-lg mb-2">Adicionar Link de Documento</h3>
                <p className="text-sm text-gray-500 mb-4">Adicione links para Google Drive, Dropbox ou sites onde os documentos (Matrícula, Edital, etc) estão hospedados.</p>
                <div className="flex flex-col md:flex-row gap-3">
                    <input 
                        type="text" 
                        placeholder="Nome do Documento (Ex: Matrícula)" 
                        className="border rounded px-3 py-2 text-sm flex-1"
                        value={newLinkName}
                        onChange={e => setNewLinkName(e.target.value)}
                    />
                    <input 
                        type="text" 
                        placeholder="Link (https://...)" 
                        className="border rounded px-3 py-2 text-sm flex-[2]"
                        value={newLink}
                        onChange={e => setNewLink(e.target.value)}
                    />
                    <button onClick={addDocumentLink} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Adicionar</button>
                </div>
             </div>

             <div className="space-y-2">
                 {data.documents.length === 0 && (
                     <div className="text-center py-6 text-gray-400">Nenhum documento adicionado.</div>
                 )}
                 {data.documents.map((doc) => (
                     <div key={doc.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                         <div className="flex items-center gap-3">
                             <FileText size={20} className="text-blue-500" />
                             <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-800">{doc.name}</span>
                                <a href={doc.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[200px] md:max-w-md">{doc.link}</a>
                             </div>
                         </div>
                         <button onClick={() => removeDoc(doc.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                     </div>
                 ))}
             </div>
        </div>
      )}

    </div>
  );
};

export default InputSection;