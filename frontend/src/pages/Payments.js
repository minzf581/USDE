import React from 'react';
import { CreditCard } from 'lucide-react';

const Payments = () => {
  return (
    <div className="p-6">
      <div className="text-center">
        <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-secondary-dark mb-2">Payments</h1>
        <p className="text-secondary-dark/70">Send USDE payments to suppliers and manage payment history</p>
        <p className="text-secondary-dark/50 mt-4">Coming soon...</p>
      </div>
    </div>
  );
};

export default Payments; 