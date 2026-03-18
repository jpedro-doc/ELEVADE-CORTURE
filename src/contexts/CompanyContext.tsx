import React, { createContext, useContext, useState, useCallback } from 'react';

interface CompanyContextType {
  selectedCod: string | null;
  setSelectedCod: (cod: string | null) => void;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCod, setSelectedCodState] = useState<string | null>(() => {
    return localStorage.getItem('gestao-pro-company-cod') || null;
  });

  const setSelectedCod = useCallback((cod: string | null) => {
    setSelectedCodState(cod);
    if (cod) {
      localStorage.setItem('gestao-pro-company-cod', cod);
    } else {
      localStorage.removeItem('gestao-pro-company-cod');
    }
  }, []);

  return (
    <CompanyContext.Provider value={{ selectedCod, setSelectedCod }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
};
