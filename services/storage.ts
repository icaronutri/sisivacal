
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings, FormData, ValidationStep } from '../types';

let supabase: SupabaseClient | null = null;
let currentSettings: AppSettings | null = null;

// HARDCODED CREDENTIALS (ALWAYS ACTIVE)
const DEFAULT_URL = "https://zdcglqhdneeuskevdxat.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkY2dscWhkbmVldXNrZXZkeGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDY3OTEsImV4cCI6MjA4MDYyMjc5MX0.OHOkC5kkZ2dQECrGFAYArle13LHIzbGGANwjyStP42Y";

export const storageService = {
  
  init: (settings: AppSettings) => {
    // Force usage of hardcoded credentials if missing
    const finalUrl = settings.supabaseUrl || DEFAULT_URL;
    const finalKey = settings.supabaseKey || DEFAULT_KEY;

    currentSettings = { ...settings, supabaseUrl: finalUrl, supabaseKey: finalKey, storageType: 'cloud' };

    try {
        supabase = createClient(finalUrl, finalKey);
    } catch (e) {
        console.error("Failed to init supabase", e);
        supabase = null;
    }
  },

  getSettings: (): AppSettings => {
    // Always return CLOUD type and DEFAULT credentials as base
    const defaultSettings: AppSettings = {
      storageType: 'cloud', // FORCE CLOUD
      supabaseUrl: DEFAULT_URL,
      supabaseKey: DEFAULT_KEY
    };
    
    // We try to get from local storage just in case user overrode them, 
    // but we enforce storageType = 'cloud'
    const saved = localStorage.getItem('sis_settings');
    if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, storageType: 'cloud' }; 
    }
    return defaultSettings;
  },

  saveSettings: (settings: AppSettings) => {
    const toSave = { ...settings, storageType: 'cloud' as const };
    localStorage.setItem('sis_settings', JSON.stringify(toSave));
    storageService.init(toSave);
  },

  getPublicUrl: (bucket: string, path: string): string => {
      // Use current instance or fallback to default URL
      const baseUrl = (currentSettings?.supabaseUrl || DEFAULT_URL).replace(/\/$/, "");
      return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
  },

  testConnection: async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
    if (!url || !key) return { success: false, message: "URL e Key são obrigatórios." };
    try {
      const tempClient = createClient(url, key);
      const { error } = await tempClient.from('properties').select('id').limit(1);
      
      if (error) {
        if (error.code === '42P01') return { success: false, message: "Conectado, mas tabelas não encontradas." };
        if (error.code === 'PGRST301') return { success: false, message: "Erro de permissão (RLS)." };
        return { success: false, message: `Erro do Supabase: ${error.message}` };
      }
      return { success: true, message: "Conexão bem-sucedida!" };
    } catch (e: any) {
      return { success: false, message: "URL inválida ou erro de rede." };
    }
  },

  validateInfrastructure: async (): Promise<ValidationStep[]> => {
    if (!supabase) return [];

    const steps: ValidationStep[] = [
        { id: 'table', name: 'Tabela de Dados (properties)', status: 'pending' },
        { id: 'bucket_assets', name: 'Storage: Imagens (assets)', status: 'pending' },
        { id: 'bucket_reports', name: 'Storage: Relatórios PDF (reports)', status: 'pending' },
        { id: 'policies', name: 'Permissões de Acesso', status: 'pending' }
    ];

    // 1. Check Table
    const { error: tableError } = await supabase.from('properties').select('id').limit(1);
    steps[0].status = tableError && tableError.code !== 'PGRST116' ? 'error' : 'success';
    steps[0].details = tableError ? tableError.message : undefined;

    // 2. Check Buckets & Policies by trying a test upload
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const fileName = `test_infra_${Date.now()}.txt`;

    // Test Assets Bucket
    const { error: uploadAssetsError } = await supabase.storage.from('assets').upload(fileName, testFile);
    if (!uploadAssetsError) {
        steps[1].status = 'success';
        await supabase.storage.from('assets').remove([fileName]); 
    } else {
        steps[1].status = 'error';
        steps[1].details = uploadAssetsError.message;
    }

    // Test Reports Bucket
    const { error: uploadReportsError } = await supabase.storage.from('reports').upload(fileName, testFile);
    if (!uploadReportsError) {
        steps[2].status = 'success';
        await supabase.storage.from('reports').remove([fileName]); 
    } else {
        steps[2].status = 'error';
        steps[2].details = uploadReportsError.message;
    }

    // Policies Check
    if (steps[1].status === 'success' && steps[2].status === 'success') {
        steps[3].status = 'success';
    } else {
        steps[3].status = 'error';
        steps[3].details = "Falha ao gravar arquivos. Verifique as Policies.";
    }

    return steps;
  },

  uploadFile: async (file: File): Promise<string | null> => {
     if (!supabase) return null;
     
     const fileExt = file.name.split('.').pop();
     const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
     const filePath = `${fileName}`;

     const { error } = await supabase.storage.from('assets').upload(filePath, file);

     if (error) {
         console.error('Upload error', error);
         alert("Erro ao enviar imagem: " + error.message);
         return null;
     }

     const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
     return data.publicUrl;
  },

  uploadReport: async (blob: Blob, propertyId: string): Promise<string | null> => {
    if (!supabase) return null;

    const filePath = `${propertyId}.pdf`;
    
    // Upsert = true to overwrite existing report for this property
    const { error } = await supabase.storage.from('reports').upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true
    });

    if (error) {
        console.error('PDF Upload error', error);
        alert("Erro ao publicar PDF: " + error.message);
        return null;
    }

    const { data } = supabase.storage.from('reports').getPublicUrl(filePath);
    return data.publicUrl;
  },

  saveProperty: async (data: FormData): Promise<boolean> => {
    if (!currentSettings) storageService.init(storageService.getSettings());

    if (!supabase) {
        // Fallback init
        storageService.init(storageService.getSettings());
        if(!supabase) {
            alert("Erro fatal: Não foi possível conectar ao Supabase.");
            return false;
        }
    }

    const { error } = await supabase
    .from('properties')
    .upsert({ 
        id: data.id, 
        content: data,
        last_modified: data.lastModified
    });
    
    if (error) {
        console.error("Supabase Save Error:", error);
        alert(`Erro ao salvar na nuvem: ${error.message}`);
        return false;
    }
    return true;
  },

  loadProperties: async (): Promise<FormData[]> => {
    if (!currentSettings) storageService.init(storageService.getSettings());

    if (!supabase) return [];

    const { data, error } = await supabase
    .from('properties')
    .select('*');
    
    if (error) {
        console.error("Supabase Load Error", error);
        return [];
    }
    
    return (data || []).map((row: any) => row.content).sort((a: FormData, b: FormData) => b.lastModified - a.lastModified);
  },

  deleteProperty: async (id: string): Promise<boolean> => {
    if (!currentSettings) storageService.init(storageService.getSettings());
    if (!supabase) return false;

    const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);
    
    if (error) {
        alert("Erro ao excluir da nuvem");
        return false;
    }
    return true;
  }
};
