"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type IntegrityStatus = {
  dataSource: 'live-api' | 'mock' | 'cached' | 'none';
  lastUpdated?: number;
};

const defaultStatus: IntegrityStatus = { dataSource: 'none' };

interface IntegrityStatusContextType {
  status: IntegrityStatus;
  setStatus: (status: IntegrityStatus) => void;
}

const IntegrityStatusContext = createContext<IntegrityStatusContextType | undefined>(undefined);

export const IntegrityStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<IntegrityStatus>(defaultStatus);
  return (
    <IntegrityStatusContext.Provider value={{ status, setStatus }}>
      {children}
    </IntegrityStatusContext.Provider>
  );
};

export function useIntegrityStatus() {
  const ctx = useContext(IntegrityStatusContext);
  if (!ctx) throw new Error('useIntegrityStatus must be used within IntegrityStatusProvider');
  return ctx.status;
}

export function useSetIntegrityStatus() {
  const ctx = useContext(IntegrityStatusContext);
  if (!ctx) throw new Error('useSetIntegrityStatus must be used within IntegrityStatusProvider');
  return ctx.setStatus;
}