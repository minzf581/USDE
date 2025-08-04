import React from 'react';
import { FileText } from 'lucide-react';

const KYCPage = () => {
  return (
    <div className="p-6">
      <div className="text-center">
        <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-secondary-dark mb-2">KYC Verification</h1>
        <p className="text-secondary-dark/70">Complete your Know Your Customer verification</p>
        <p className="text-secondary-dark/50 mt-4">Coming soon...</p>
      </div>
    </div>
  );
};

export default KYCPage; 