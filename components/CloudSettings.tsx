
import React, { useState, useEffect } from 'react';
import { AppSettings, ValidationStep } from '../types';
import { storageService } from '../services/storage';
import { Save, Check, Activity, AlertTriangle, ShieldCheck, Database, HardDrive } from 'lucide-react';

const CloudSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<{success: boolean; message: string} | null>(null);
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);
  const [testing, setTesting] = useState(false);

  // Auto-test on mount if credentials exist
  useEffect(() => {
      if(settings.supabaseUrl && settings.supabaseKey) {
          handleFullDiagnosis();
      }
  }, []);

  const handleFullDiagnosis = async () => {
    setTesting(true);
    setValidationSteps([]);
    
    // 1. Basic Connection
    const connResult = await storageService.testConnection(settings.supabaseUrl, settings.supabaseKey);
    setTestStatus(connResult);

    if (connResult.success) {
        // 2. Infra Validation
        const steps = await storageService.validateInfrastructure();
        setValidationSteps(steps);
    }
    setTesting(false);
  };

  const handleSave = () => {
    storageService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isAllGood = testStatus?.success && validationSteps.length > 0 && validationSteps.every(s => s.status === 'success');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Diagnóstico da Nuvem</h2>
        <p className="text-gray-500">Status da conexão e infraestrutura do Supabase.</p>
      </div>

      {/* Main Status Card */}
      <div className={`p-6 rounded-lg border-2 ${isAllGood ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex justify-between items-start mb-6">
              <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      {isAllGood ? <ShieldCheck className="text-green-600" size={28}/> : <Activity className="text-gray-400" size={28}/>}
                      Status da Conexão
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                      {settings.supabaseUrl ? `Conectado a: ${settings.supabaseUrl}` : 'Não configurado'}
                  </p>
              </div>
              <button 
                  onClick={handleFullDiagnosis}
                  disabled={testing}
                  className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                  {testing ? <Activity className="animate-spin" size={16}/> : <Activity size={16}/>}
                  Rodar Diagnóstico Completo
              </button>
          </div>

          {/* Validation Steps UI */}
          <div className="space-y-3">
              {validationSteps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                          {step.id.includes('bucket') ? <HardDrive size={18} className="text-gray-400"/> : <Database size={18} className="text-gray-400"/>}
                          <span className="font-medium text-gray-700">{step.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                           {step.status === 'pending' && <span className="text-gray-400 text-xs font-bold">AGUARDANDO...</span>}
                           {step.status === 'success' && <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={14}/> OK</span>}
                           {step.status === 'error' && (
                               <div className="text-right">
                                   <span className="text-red-600 text-xs font-bold flex items-center justify-end gap-1"><AlertTriangle size={14}/> ERRO</span>
                                   <span className="text-[10px] text-red-500 block max-w-[200px] truncate">{step.details}</span>
                               </div>
                           )}
                      </div>
                  </div>
              ))}
          </div>

          {/* Error Solution / SQL */}
          {!isAllGood && validationSteps.some(s => s.status === 'error') && (
               <div className="mt-6 bg-slate-900 text-slate-200 p-4 rounded-lg animate-fadeIn">
                <div className="flex items-center gap-2 mb-3 text-yellow-400">
                    <AlertTriangle size={20} />
                    <span className="font-bold text-sm">CORREÇÃO NECESSÁRIA</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                    Sua infraestrutura na nuvem está incompleta. Copie o código abaixo, vá ao <strong>SQL Editor</strong> do Supabase e execute-o.
                </p>
                <pre className="text-[10px] md:text-xs overflow-x-auto whitespace-pre-wrap font-mono select-all bg-black p-3 rounded border border-slate-700">
{`-- 1. Tabela de Imóveis (Se ainda não existir)
create table if not exists properties (
  id text primary key,
  content jsonb not null,
  last_modified bigint
);
alter table properties enable row level security;
create policy "Public Access" on properties for all using (true) with check (true);

-- 2. Storage Bucket: REPORTS (PDFs)
insert into storage.buckets (id, name, public) 
values ('reports', 'reports', true)
on conflict (id) do nothing;

-- 3. Políticas de Acesso: REPORTS
create policy "Public Select Reports" on storage.objects for select using (bucket_id = 'reports');
create policy "Public Insert Reports" on storage.objects for insert with check (bucket_id = 'reports');
create policy "Public Update Reports" on storage.objects for update using (bucket_id = 'reports');
create policy "Public Delete Reports" on storage.objects for delete using (bucket_id = 'reports');

-- 4. Storage Bucket: ASSETS (Imagens)
insert into storage.buckets (id, name, public) 
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- 5. Políticas de Acesso: ASSETS
create policy "Public Select Assets" on storage.objects for select using (bucket_id = 'assets');
create policy "Public Insert Assets" on storage.objects for insert with check (bucket_id = 'assets');
create policy "Public Delete Assets" on storage.objects for delete using (bucket_id = 'assets');`}
                </pre>
             </div>
          )}
      </div>

      {/* Accordion for Credentials (Hidden if all good) */}
      <details className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm" open={!isAllGood}>
          <summary className="font-bold text-gray-700 cursor-pointer flex items-center gap-2">
              Credenciais de Acesso (Editar)
          </summary>
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Project URL</label>
                 <input 
                   type="text" 
                   value={settings.supabaseUrl} 
                   onChange={e => setSettings({...settings, supabaseUrl: e.target.value})}
                   className="w-full border rounded px-3 py-2 text-sm font-mono bg-gray-50"
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">API Key</label>
                 <input 
                   type="password" 
                   value={settings.supabaseKey} 
                   onChange={e => setSettings({...settings, supabaseKey: e.target.value})}
                   className="w-full border rounded px-3 py-2 text-sm font-mono bg-gray-50"
                 />
               </div>
               <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold text-white transition-all ${saved ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-700'}`}
               >
                {saved ? <Check size={16}/> : <Save size={16}/>}
                {saved ? 'Salvo' : 'Atualizar Credenciais'}
               </button>
          </div>
      </details>

    </div>
  );
};

export default CloudSettings;
