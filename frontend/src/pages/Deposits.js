import React from 'react';
import { ArrowDownLeft } from 'lucide-react';

const Deposits = () => {
  return (
    <div className="p-6">
      <div className="text-center">
        <ArrowDownLeft className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-secondary-dark mb-2">Deposits</h1>
        <p className="text-secondary-dark/70">Deposit funds and mint USDE stablecoins</p>
        <p className="text-secondary-dark/50 mt-4">Coming soon...</p>
      </div>
    </div>
  );
};

export default Deposits; 