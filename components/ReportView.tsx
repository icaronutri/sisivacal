
import React, { useEffect, useState } from 'react';
import { FormData, SimulationResult } from '../types';
import { formatCurrency, formatPercent, generateQRCode } from '../utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, Link as LinkIcon, CloudUpload, Check, Loader2, QrCode } from 'lucide-react';
import { storageService } from '../services/storage';

interface Props {
  data: FormData;
  results: SimulationResult;
}

const ReportView: React.FC<Props> = ({ data, results }) => {
  const reportRef = React.useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [targetPdfUrl, setTargetPdfUrl] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // 1. Determine the Target URL for the PDF in the Cloud
  useEffect(() => {
     if (data.id) {
         // This is where the PDF *will* be once uploaded
         const url = storageService.getPublicUrl('reports', `${data.id}.pdf`);
         setTargetPdfUrl(url);
         
         // Generate QR pointing to that File URL
         generateQRCode(url).then(setQrCodeUrl);
     }
  }, [data.id]);

  const getRoiColor = (roi: number) => {
    if (roi >= data.minProfitPercent) return 'bg-[#4ade80]';
    if (roi > 0) return 'bg-[#facc15]';
    return 'bg-[#f87171]';
  };

  const getMarketStats = () => {
      const valid = data.marketResearchItems.filter(i => i.price > 0);
      if (valid.length === 0) return null;
      const sum = valid.reduce((acc, curr) => acc + curr.price, 0);
      const avg = sum / valid.length;
      const prices = valid.map(i => i.price).sort((a,b) => a - b);
      const min = prices[0];
      const max = prices[prices.length-1];
      return { avg, min, max, count: valid.length };
  };

  const marketStats = getMarketStats();
  const coverImage = data.images.find(i => i.isCover) || data.images[0];

  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (!reportRef.current) return null;
    
    // Capture
    const canvas = await html2canvas(reportRef.current, {
        scale: 2, 
        useCORS: true,
        logging: false,
        windowWidth: 1200
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = pdfWidth / imgWidth;
    const finalHeight = imgHeight * ratio;

    let heightLeft = finalHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
        position = heightLeft - finalHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalHeight);
        heightLeft -= pdfHeight;
    }

    return pdf.output('blob');
  };

  const handleDownloadPdf = async () => {
      const blob = await generatePdfBlob();
      if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Relatorio_SIS_IVA_${data.city}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
      }
  };

  const handlePublishToCloud = async () => {
      if (!data.id) return;
      setUploadStatus('uploading');
      
      try {
        const blob = await generatePdfBlob();
        if (blob) {
            const url = await storageService.uploadReport(blob, data.id);
            if (url) {
                setUploadStatus('success');
            } else {
                setUploadStatus('error');
            }
        }
      } catch (e) {
          console.error(e);
          setUploadStatus('error');
      }
  };

  // Reusable styles for PDF replica
  const boxStyle = "border-2 border-black p-2 mb-2 bg-white";
  const titleStyle = "font-bold text-lg mb-1 relative inline-block bg-white pr-2 z-10";
  const lineStyle = "absolute top-4 left-0 w-full h-0.5 bg-black -z-0";

  return (
    <div className="flex flex-col items-center bg-gray-500 py-10 min-h-screen">
      
      {/* Action Bar */}
      <div className="bg-white p-3 md:p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 no-print sticky top-2 z-30 justify-center">
         <button 
            onClick={handlePublishToCloud}
            className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base md:px-6 rounded font-bold transition-all border-2 border-blue-600 ${
                uploadStatus === 'success' ? 'bg-green-100 text-green-700 border-green-600' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
         >
            {uploadStatus === 'uploading' && <Loader2 size={18} className="animate-spin" />}
            {uploadStatus === 'success' && <Check size={18} />}
            {uploadStatus === 'idle' && <CloudUpload size={18} />}
            {uploadStatus === 'idle' && 'Publicar / Ativar QR Code'}
            {uploadStatus === 'uploading' && 'Gerando e Enviando...'}
            {uploadStatus === 'success' && 'Publicado com Sucesso!'}
            {uploadStatus === 'error' && 'Erro ao Publicar'}
         </button>

         <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm md:text-base md:px-6 rounded font-bold">
            <Download size={18} /> <span className="hidden md:inline">Baixar PDF</span>
         </button>
         <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 text-sm md:text-base md:px-6 rounded font-bold">
            <Printer size={18} /> <span className="hidden md:inline">Imprimir</span>
         </button>
      </div>
      
      {/* Info Message */}
      <div className="mb-4 text-center max-w-2xl px-4 no-print">
         {uploadStatus === 'idle' && (
             <div className="bg-blue-100 text-blue-800 p-2 rounded text-sm flex items-center justify-center gap-2">
                 <QrCode size={16} />
                 <span>O QR Code abaixo apontará para este relatório. Clique em <strong>"Publicar"</strong> acima para tornar o link válido.</span>
             </div>
         )}
         {uploadStatus === 'success' && (
             <div className="bg-green-100 text-green-800 p-2 rounded text-sm flex items-center justify-center gap-2">
                 <Check size={16} />
                 <span>Relatório online! O QR Code agora funciona e leva direto para este documento.</span>
                 <a href={targetPdfUrl} target="_blank" rel="noreferrer" className="underline font-bold">Testar Link</a>
             </div>
         )}
      </div>

      <div className="text-white text-sm mb-2 md:hidden">Role horizontalmente para ver o relatório completo</div>

      {/* The Report Container */}
      <div className="w-full overflow-x-auto flex justify-center px-4">
        {/* We stack pages vertically in one container for html2canvas to capture them all */}
        <div ref={reportRef} className="flex flex-col gap-10">
            
            {/* PAGE 1 */}
            <div 
                className="bg-white min-w-[210mm] w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl text-black font-sans text-sm relative"
                style={{ boxSizing: 'border-box' }}
            >
                {/* Header with QR */}
                <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-6">
                    <h1 className="text-xl font-bold uppercase text-left flex-1 pt-2">
                        Relatório SP {data.city} - {data.propertyOrigin.toUpperCase()} - LEILÃO
                    </h1>
                    {qrCodeUrl && (
                        <div className="flex flex-col items-center ml-4 bg-white p-1 border border-black">
                            <img src={qrCodeUrl} alt="QR Relatório" className="w-24 h-24 rendering-pixelated" />
                            <span className="text-[9px] uppercase mt-1 font-bold">Ler Relatório</span>
                        </div>
                    )}
                </div>

                {/* Main Photo (if available) */}
                {coverImage && (
                    <div className="w-full h-48 mb-4 border-2 border-black bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img src={coverImage.url} alt="Capa" className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Basic Info */}
                <div className="relative mb-4">
                    <h2 className={titleStyle}>Informações Básicas Leilão</h2>
                    <div className={lineStyle}></div>
                    <div className={boxStyle}>
                        <div className="grid grid-cols-2 gap-2">
                            <div><span className="font-bold">Valor Lance:</span> {formatCurrency(data.bidValue)}</div>
                            <div><span className="font-bold">Tipo Leilão:</span> {data.auctionType}</div>
                            <div className="col-span-2 truncate"><span className="font-bold">Link Leilão:</span> <a href={data.auctionLink} className="text-blue-600 underline">{data.auctionLink}</a></div>
                        </div>
                    </div>
                </div>

                {/* Financials: Revenue & Expenses side by side approx */}
                <div className="relative mb-4">
                    <h2 className={titleStyle}>Receitas</h2>
                    <div className={lineStyle}></div>
                    <div className={boxStyle}>
                        <div className="grid grid-cols-2">
                            <div>
                                <div className="mb-1"><span className="font-bold">Preço Venda:</span> {formatCurrency(data.marketValue)}</div>
                                <div className="mb-1"><span className="font-bold">Desconto Venda:</span> {formatPercent(data.saleDiscountPercent)}</div>
                                <div className="mb-1"><span className="font-bold">Porcentagem Corretor:</span> {formatPercent(data.brokerFeePercent)}</div>
                                <div className="mb-1"><span className="font-bold">Receita Aluguel:</span> {formatCurrency(data.rentRevenue)}</div>
                            </div>
                            <div className="border-l pl-4 border-black flex flex-col justify-center">
                                <span className="font-bold text-xs uppercase text-gray-500 mb-1">Referência Mercado</span>
                                {marketStats ? (
                                    <>
                                        <div className="text-lg font-bold">{formatCurrency(marketStats.avg)}</div>
                                        <div className="text-xs">Média de {marketStats.count} amostras</div>
                                        <div className="text-[10px] text-gray-500 mt-1">Ver detalhe Pag. 2</div>
                                    </>
                                ) : (
                                    <div className="text-xs text-gray-400">Sem dados de pesquisa</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expenses */}
                <div className="relative mb-4">
                    <h2 className={titleStyle}>Despesas</h2>
                    <div className={lineStyle}></div>
                    <div className={boxStyle}>
                        <div className="mb-2">
                            <span className="font-bold block">ITBI</span>
                            <span className="text-xs">Base Cálculo: Valor Arrematação &nbsp;&nbsp;&nbsp; Alíquota: {formatPercent(data.itbiPercent)}</span>
                        </div>
                        <div className="mb-2">
                            <span className="font-bold block">Custo Oportunidade</span>
                            <span className="text-xs">Rend. Líq: 0,00% (a.a.) &nbsp;&nbsp;&nbsp; Condomínio: {formatCurrency(data.condoMonthly)} &nbsp;&nbsp;&nbsp; IPTU: {formatCurrency(data.iptuMonthly)}</span>
                        </div>
                        <div className="mb-2">
                            <span className="font-bold block">Imposto Renda</span>
                            <span className="text-xs">Tipo Tributação: {data.incomeTaxMode === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                        </div>
                        <div>
                            <span className="font-bold block">Despesas Adicionais</span>
                            <div className="grid grid-cols-2 gap-x-2 text-xs">
                                <div>Reformas: {formatCurrency(data.reforms)}</div>
                                <div>Custo Desocupação: {formatCurrency(data.vacationCost)}</div>
                                <div>Leiloeiro: {formatPercent(data.auctioneerFeePercent)} ({formatCurrency(data.bidValue * data.auctioneerFeePercent/100)})</div>
                                <div>Débitos: {formatCurrency(data.debts)}</div>
                                <div>Assessoria: {formatCurrency(data.advisoryFee)}</div>
                                <div className="col-span-2 mt-1 pt-1 border-t border-dashed border-gray-400">
                                    <span className="font-bold">Cartório:</span> Escritura {formatPercent(data.deedPercent)} + Registro {formatPercent(data.registryPercent)} = {formatCurrency(data.bidValue * (data.deedPercent + data.registryPercent)/100)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment */}
                <div className="relative mb-4">
                    <h2 className={titleStyle}>Pagamento</h2>
                    <div className={lineStyle}></div>
                    <div className={boxStyle}>
                        <div><span className="font-bold">Tipo Pagamento:</span> {data.paymentMethod}</div>
                        {data.paymentMethod === 'À Vista com Desconto' && (
                            <div><span className="font-bold">Desconto à vista:</span> {formatPercent(data.cashDiscountPercent)}</div>
                        )}
                    </div>
                </div>

                {/* MOVED: Simulation Details to Page 2 */}
                
                {/* Results Table Small */}
                <h2 className="font-bold text-center text-xl mt-6 mb-2">Resultados</h2>
                <table className="w-full text-xs text-center border-collapse border border-black mb-6">
                    <thead>
                        <tr>
                            <th className="border border-black p-1">Giro Venda(meses)</th>
                            {results.timeline.map(t => <th key={t.month} className="border border-black p-1">{t.month} meses</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-black p-1 font-bold">Resultado Consolidado</td>
                            {results.timeline.map(t => <td key={t.month} className="border border-black p-1">{formatCurrency(t.netProfit)}</td>)}
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">Lucro (%)</td>
                            {results.timeline.map(t => <td key={t.month} className="border border-black p-1">{formatPercent(t.roiPercent)}</td>)}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* PAGE 2: MARKET RESEARCH & GALLERY */}
            <div 
                className="bg-white min-w-[210mm] w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl text-black font-sans text-sm relative flex flex-col"
                style={{ boxSizing: 'border-box' }}
            >
                 {/* Header Page 2 */}
                 <h1 className="text-xl font-bold uppercase text-center mb-6 border-b-2 border-black pb-2">
                    Análise Detalhada - {data.city}
                </h1>

                {/* Simulation Summary Box - MOVED HERE with 3cm spacing */}
                <div className="relative mb-6" style={{ marginTop: '3cm' }}>
                    <h2 className={titleStyle}>Detalhes Simulação</h2>
                    <div className={lineStyle}></div>
                    <div className={boxStyle}>
                        <div><span className="font-bold">Giro Venda:</span> 12 meses</div>
                        <div><span className="font-bold">Lucro Mínimo:</span> {formatPercent(data.minProfitPercent)}</div>
                        <div><span className="font-bold">Incremento Lance:</span> {formatCurrency(data.bidIncrement)}</div>
                        <div><span className="font-bold">Meses até propriedade:</span> 0</div>
                    </div>
                </div>

                {/* Market Research Stats */}
                <div className="relative mb-6">
                    <h2 className={titleStyle}>Indicadores de Preço (Pesquisa)</h2>
                    <div className={lineStyle}></div>
                    <div className={boxStyle}>
                        {marketStats ? (
                             <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="border-r border-black last:border-0">
                                    <div className="text-xs font-bold text-gray-500 uppercase">Média</div>
                                    <div className="text-xl font-bold">{formatCurrency(marketStats.avg)}</div>
                                </div>
                                <div className="border-r border-black last:border-0">
                                    <div className="text-xs font-bold text-gray-500 uppercase">Mínimo</div>
                                    <div className="text-lg font-semibold text-green-700">{formatCurrency(marketStats.min)}</div>
                                </div>
                                <div className="border-r border-black last:border-0">
                                    <div className="text-xs font-bold text-gray-500 uppercase">Máximo</div>
                                    <div className="text-lg font-semibold text-red-700">{formatCurrency(marketStats.max)}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Amostras</div>
                                    <div className="text-lg font-semibold">{marketStats.count}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">Nenhum dado de mercado registrado.</div>
                        )}
                    </div>
                </div>

                {/* Market Research Table */}
                <h2 className="font-bold text-lg mb-2 mt-2">Comparáveis de Mercado</h2>
                <table className="w-full text-xs border-collapse border border-black mb-6 table-fixed">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border border-black p-2 w-[5%] text-center">#</th>
                            <th className="border border-black p-2 w-[40%] text-left">Descrição / Notas</th>
                            <th className="border border-black p-2 w-[35%] text-left">Link / Fonte</th>
                            <th className="border border-black p-2 w-[20%] text-right">Valor Anunciado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.marketResearchItems.filter(i => i.price > 0 || i.link || i.description).map((item, idx) => (
                            <tr key={idx} className="even:bg-gray-50">
                                <td className="border border-black p-2 text-center font-bold align-top">{idx + 1}</td>
                                <td className="border border-black p-2 align-top whitespace-normal break-words">
                                    {item.description || <span className="text-gray-400 italic">Sem descrição</span>}
                                </td>
                                <td className="border border-black p-2 align-top break-all text-[10px] leading-tight text-blue-800">
                                    {item.link ? item.link : <span className="text-gray-400">-</span>}
                                </td>
                                <td className="border border-black p-2 text-right font-bold align-top">
                                    {item.price > 0 ? formatCurrency(item.price) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Photo Gallery Grid */}
                {data.images.length > 0 && (
                    <div className="mb-6 break-inside-avoid">
                        <h2 className={titleStyle}>Galeria de Imagens</h2>
                        <div className={lineStyle}></div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                             {data.images.slice(0, 6).map((img, idx) => (
                                 <div key={idx} className="h-32 border border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                                     <img src={img.url} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                                 </div>
                             ))}
                        </div>
                    </div>
                )}

                 {/* Document Links */}
                 <div className="mb-6 break-inside-avoid">
                    <h2 className={titleStyle}>Documentação Anexa</h2>
                    <div className={lineStyle}></div>
                    <div className="mt-4 space-y-2">
                        {data.documents.length === 0 && <p className="text-xs text-gray-500 italic">Nenhum documento anexado.</p>}
                        {data.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs border-b border-gray-200 pb-1">
                                <LinkIcon size={12} className="text-blue-600"/>
                                <span className="font-bold">{doc.name}:</span>
                                <a href={doc.link} target="_blank" className="text-blue-600 underline truncate">{doc.link}</a>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center text-[10px] text-gray-500 mt-auto">
                    Relatório gerado automaticamente por Calculadora SIS IVA - {new Date().toLocaleDateString()}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ReportView;
