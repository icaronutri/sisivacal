import React from 'react';

interface Props {
  label: string;
  value: any;
  onChange: (val: any) => void;
  type?: 'text' | 'number' | 'currency' | 'percent' | 'select';
  options?: string[];
  prefix?: string;
  step?: string;
}

export const FormInput: React.FC<Props> = ({ label, value, onChange, type = 'text', options, prefix, step }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val: any = e.target.value;
    if (type === 'number' || type === 'currency' || type === 'percent') {
      val = parseFloat(val);
      if (isNaN(val)) val = 0;
    }
    onChange(val);
  };

  if (type === 'select') {
    return (
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
        <select 
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={value}
          onChange={handleChange}
        >
          {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          type={type === 'text' ? 'text' : 'number'}
          step={step || (type === 'currency' ? "0.01" : "any")}
          className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${prefix ? 'pl-10' : ''}`}
          value={value}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};