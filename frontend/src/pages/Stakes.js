import React from 'react';
import { Lock } from 'lucide-react';

const Stakes = () => {
  return (
    <div className="p-6">
      <div className="text-center">
        <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-secondary-dark mb-2">Stakes</h1>
        <p className="text-secondary-dark/70">Manage your locked USDE stakes and view earnings</p>
        <p className="text-secondary-dark/50 mt-4">Coming soon...</p>
      </div>
    </div>
  );
};

export default Stakes; 