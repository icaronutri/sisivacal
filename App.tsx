
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import InputSection from './components/InputSection';
import MarketResearch from './components/MarketResearch';
import Results from './components/Results';
import BidTable from './components/BidTable';
import ReportView from './components/ReportView';
import PropertiesList from './components/PropertiesList';
import CloudSettings from './components/CloudSettings';
import { INITIAL_FORM_DATA, SIMULATION_MONTHS } from './constants';
import { FormData, SimulationResult } from './types';
import { calculateScenario, generateBidTable } from './utils';
import { storageService } from './services/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list'); // Default to list view
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);

  useEffect(() => {
    // Initialize storage with saved settings
    storageService.init(storageService.getSettings());
  }, []);

  // Recalculate whenever form data changes
  useEffect(() => {
    const timeline = SIMULATION_MONTHS.map(m => calculateScenario(formData, m));
    const bidTable = generateBidTable(formData);
    
    setSimulationResults({
      timeline,
      bidTable
    });
  }, [formData]);

  const handleSaveProperty = async () => {
    const dataToSave = { ...formData };
    if (!dataToSave.id) {
        dataToSave.id = Date.now().toString();
    }
    dataToSave.lastModified = Date.now();
    
    const success = await storageService.saveProperty(dataToSave);
    if (success) {
      setFormData(dataToSave); // Update state with ID
    }
  };

  const handleLoadProperty = (data: FormData) => {
      setFormData(data);
      setActiveTab('input');
  };

  const handleNewProperty = () => {
      setFormData({ ...INITIAL_FORM_DATA, id: '' }); // Reset ID for new
      setActiveTab('input');
  };

  const renderContent = () => {
    if (!simulationResults && activeTab !== 'list' && activeTab !== 'settings') return <div>Carregando...</div>;

    switch (activeTab) {
      case 'list':
          return <PropertiesList onLoadProperty={handleLoadProperty} onNewProperty={handleNewProperty} />;
      case 'settings':
          return <CloudSettings />;
      case 'input':
        return <InputSection data={formData} onChange={setFormData} onSave={handleSaveProperty} />;
      case 'market':
        return (
          <MarketResearch 
            formData={formData} 
            onUpdateSaleValue={(val) => setFormData(prev => ({ ...prev, marketValue: val }))} 
            onItemsChange={(items) => setFormData(prev => ({ ...prev, marketResearchItems: items }))}
          />
        );
      case 'results':
        return <Results data={formData} results={simulationResults!} />;
      case 'bidTable':
        return <BidTable data={formData} results={simulationResults!} />;
      case 'report':
        return <ReportView data={formData} results={simulationResults!} />;
      default:
        return <InputSection data={formData} onChange={setFormData} onSave={handleSaveProperty} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-y-auto h-[calc(100vh-60px)] md:h-screen w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;