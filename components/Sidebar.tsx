
import React, { useState } from 'react';
import { LayoutDashboard, Calculator, Search, FileText, Table, Menu, X, Home, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'list', label: 'Meus Imóveis', icon: <Home size={20} /> },
    { id: 'input', label: 'Inserir Dados / Editar', icon: <Calculator size={20} /> },
    { id: 'market', label: 'Pesquisa de Mercado', icon: <Search size={20} /> },
    { id: 'results', label: 'Resultados Detalhados', icon: <LayoutDashboard size={20} /> },
    { id: 'bidTable', label: 'Tabela de Lances', icon: <Table size={20} /> },
    { id: 'report', label: 'Relatório Final', icon: <FileText size={20} /> },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-50 relative h-[60px]">
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-lg">Calculadora SIS IVA</span>
          <span className="text-xs text-slate-400">Análise Profissional</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <div className={`
        bg-slate-900 text-white flex-col
        fixed md:static inset-0 z-40 pt-[60px] md:pt-0
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:translate-x-0 hidden md:flex'}
        md:w-64 md:min-h-screen border-r border-slate-800
      `}>
        <div className="p-6 border-b border-slate-700 hidden md:block">
          <h1 className="text-xl font-bold text-center leading-tight">Calculadora<br/>SIS IVA</h1>
          <p className="text-xs text-slate-400 text-center mt-2">Análise Profissional</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          
          <hr className="border-slate-700 my-2" />
          
          <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings size={20} />
              <span className="font-medium">Config / Nuvem</span>
            </button>

        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
          © 2024 SIS IVA
        </div>
      </div>
    </>
  );
};

export default Sidebar;