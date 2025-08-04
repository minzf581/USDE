import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { kycAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  User, 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

const KYC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Information
    companyNameEn: '',
    companyRegNumber: '',
    countryOfReg: '',
    regAddress: '',
    incorporationDate: '',
    companyType: '',
    
    // Compliance
    isPEP: false,
    isSanctioned: false,
    complianceAgreed: false,
    
    // UBOs
    ubos: [
      {
        name: '',
        idNumber: '',
        nationality: '',
        address: '',
        ownershipPercentage: '',
        addressProof: ''
      }
    ]
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await kycAPI.getKYCStatus();
      setKycStatus(response.data);
      
      if (response.data.status === 'approved') {
        toast.success('Your KYC has been approved!');
        navigate('/dashboard');
      } else if (response.data.status === 'rejected') {
        toast.error('Your KYC application was rejected. Please review and resubmit.');
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUBOChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ubos: prev.ubos.map((ubo, i) => 
        i === index ? { ...ubo, [field]: value } : ubo
      )
    }));
  };

  const addUBO = () => {
    setFormData(prev => ({
      ...prev,
      ubos: [...prev.ubos, {
        name: '',
        idNumber: '',
        nationality: '',
        address: '',
        ownershipPercentage: '',
        addressProof: ''
      }]
    }));
  };

  const removeUBO = (index) => {
    if (formData.ubos.length > 1) {
      setFormData(prev => ({
        ...prev,
        ubos: prev.ubos.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await kycAPI.submitKYC(formData);
      toast.success('KYC application submitted successfully!');
      setStep(4); // Show success step
      fetchKYCStatus();
    } catch (error) {
      console.error('KYC submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit KYC application');
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyInfoStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-blue-600">
        <Building2 size={20} />
        <h2 className="text-xl font-semibold">Company Information</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name (English) *
          </label>
          <input
            type="text"
            value={formData.companyNameEn}
            onChange={(e) => handleInputChange('companyNameEn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Acme International Pte Ltd"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Number (UEN) *
          </label>
          <input
            type="text"
            value={formData.companyRegNumber}
            onChange={(e) => handleInputChange('companyRegNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="201912345N"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country of Registration *
          </label>
          <input
            type="text"
            value={formData.countryOfReg}
            onChange={(e) => handleInputChange('countryOfReg', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Singapore"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Type *
          </label>
          <select
            value={formData.companyType}
            onChange={(e) => handleInputChange('companyType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select company type</option>
            <option value="Private Limited Company">Private Limited Company</option>
            <option value="Public Limited Company">Public Limited Company</option>
            <option value="Partnership">Partnership</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Branch Office">Branch Office</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registered Address *
          </label>
          <textarea
            value={formData.regAddress}
            onChange={(e) => handleInputChange('regAddress', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="123 Raffles Place, Singapore 048623"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incorporation Date *
          </label>
          <input
            type="date"
            value={formData.incorporationDate}
            onChange={(e) => handleInputChange('incorporationDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderUBOStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-blue-600">
          <User size={20} />
          <h2 className="text-xl font-semibold">Ultimate Beneficial Owners (UBO)</h2>
        </div>
        <button
          onClick={addUBO}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Add UBO</span>
        </button>
      </div>
      
      {formData.ubos.map((ubo, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">UBO {index + 1}</h3>
            {formData.ubos.length > 1 && (
              <button
                onClick={() => removeUBO(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={ubo.name}
                onChange={(e) => handleUBOChange(index, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID/Passport Number *
              </label>
              <input
                type="text"
                value={ubo.idNumber}
                onChange={(e) => handleUBOChange(index, 'idNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="S1234567A"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nationality *
              </label>
              <input
                type="text"
                value={ubo.nationality}
                onChange={(e) => handleUBOChange(index, 'nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Singapore"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ownership Percentage (%) *
              </label>
              <input
                type="number"
                value={ubo.ownershipPercentage}
                onChange={(e) => handleUBOChange(index, 'ownershipPercentage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25"
                min="0"
                max="100"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                value={ubo.address}
                onChange={(e) => handleUBOChange(index, 'address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="123 Main Street, Singapore 123456"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderComplianceStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-blue-600">
        <FileText size={20} />
        <h2 className="text-xl font-semibold">Compliance & Declarations</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="isPEP"
            checked={formData.isPEP}
            onChange={(e) => handleInputChange('isPEP', e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="isPEP" className="text-sm text-gray-700">
            Are any of the company directors or beneficial owners Politically Exposed Persons (PEP)?
          </label>
        </div>
        
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="isSanctioned"
            checked={formData.isSanctioned}
            onChange={(e) => handleInputChange('isSanctioned', e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="isSanctioned" className="text-sm text-gray-700">
            Is the company or any beneficial owner from a sanctioned country?
          </label>
        </div>
        
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="complianceAgreed"
            checked={formData.complianceAgreed}
            onChange={(e) => handleInputChange('complianceAgreed', e.target.checked)}
            className="mt-1"
            required
          />
          <label htmlFor="complianceAgreed" className="text-sm text-gray-700">
            I agree to the Terms of Service, Privacy Policy, and Compliance Guidelines *
          </label>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Important Notice</h3>
        <p className="text-sm text-yellow-700">
          By submitting this KYC application, you confirm that all information provided is accurate and complete. 
          Any false or misleading information may result in the rejection of your application or account suspension.
        </p>
      </div>
    </div>
  );

  const renderStatusStep = () => {
    if (!kycStatus) return null;
    
    const getStatusIcon = () => {
      switch (kycStatus.status) {
        case 'approved':
          return <CheckCircle className="text-green-500" size={24} />;
        case 'rejected':
          return <XCircle className="text-red-500" size={24} />;
        default:
          return <Clock className="text-yellow-500" size={24} />;
      }
    };

    const getStatusText = () => {
      switch (kycStatus.status) {
        case 'approved':
          return 'Your KYC application has been approved!';
        case 'rejected':
          return 'Your KYC application was rejected.';
        default:
          return 'Your KYC application is under review.';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <h2 className="text-xl font-semibold">{getStatusText()}</h2>
        </div>
        
        {kycStatus.latestReview && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-medium mb-2">Review Notes:</h3>
            <p className="text-sm text-gray-600">{kycStatus.latestReview.notes}</p>
          </div>
        )}
        
        {kycStatus.status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-700">
              Our compliance team will review your application within 3-5 business days. 
              You will receive an email notification once the review is complete.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderCompanyInfoStep();
      case 2:
        return renderUBOStep();
      case 3:
        return renderComplianceStep();
      case 4:
        return renderStatusStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.companyNameEn && formData.companyRegNumber && 
               formData.countryOfReg && formData.regAddress && 
               formData.incorporationDate && formData.companyType;
      case 2:
        return formData.ubos.every(ubo => 
          ubo.name && ubo.idNumber && ubo.nationality && 
          ubo.address && ubo.ownershipPercentage
        );
      case 3:
        return formData.complianceAgreed;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Application</h1>
            <p className="text-gray-600">
              Complete your Know Your Customer (KYC) verification to access all platform features.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { name: 'Company Info', icon: Building2 },
                { name: 'UBO Details', icon: User },
                { name: 'Compliance', icon: FileText },
                { name: 'Status', icon: CheckCircle }
              ].map((stepItem, index) => {
                const Icon = stepItem.icon;
                const isActive = step === index + 1;
                const isCompleted = step > index + 1;
                
                return (
                  <div key={index} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive ? 'border-blue-600 bg-blue-600 text-white' :
                      isCompleted ? 'border-green-600 bg-green-600 text-white' :
                      'border-gray-300 bg-gray-100 text-gray-500'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' :
                      isCompleted ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {stepItem.name}
                    </span>
                    {index < 3 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-4">
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : step === 3 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYC; 