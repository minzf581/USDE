import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const Withdrawals = () => {
  return (
    <div className="p-6">
      <div className="text-center">
        <ArrowUpRight className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-secondary-dark mb-2">Withdrawals</h1>
        <p className="text-secondary-dark/70">Withdraw USDE and convert back to USD</p>
        <p className="text-secondary-dark/50 mt-4">Coming soon...</p>
      </div>
    </div>
  );
};

export default Withdrawals; 