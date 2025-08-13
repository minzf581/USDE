import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { companyAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { isParentCompanyAdmin } from '../config/userRoles';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentCompany, setCurrentCompany] = useState(null);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [isParentCompany, setIsParentCompany] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取公司信息
  const fetchCompanyInfo = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if user is parent company admin based on email and role
      const userIsParentAdmin = user ? isParentCompanyAdmin(user.email, user.role) : false;
      
      if (userIsParentAdmin) {
        // For demo@usde.com or other parent company admins, set up parent company structure
        setIsParentCompany(true);
        
        // Create mock parent company data for demo purposes
        const mockParentCompany = {
          id: 'parent-001',
          name: 'USDE Demo Corporation',
          type: 'parent',
          companyCode: 'USDE001',
          walletAddress: '0x1234567890abcdef',
          kycStatus: 'approved',
          status: 'active'
        };
        
        setCurrentCompany(mockParentCompany);
        
        // Create mock subsidiaries for demo purposes
        const mockSubsidiaries = [
          {
            id: 'sub-001',
            name: 'USDE Asia Pacific',
            companyCode: 'USDE002',
            walletAddress: '0xabcdef1234567890',
            kycStatus: 'approved',
            status: 'active',
            balance: { available: 2500000 },
            userCount: 8,
            treasurySettings: {
              monthlyBudget: 1000000,
              quarterlyBudget: 3000000,
              dailyTransferLimit: 100000
            }
          },
          {
            id: 'sub-002',
            name: 'USDE Europe',
            companyCode: 'USDE003',
            walletAddress: '0x9876543210fedcba',
            kycStatus: 'approved',
            status: 'active',
            balance: { available: 1800000 },
            userCount: 5,
            treasurySettings: {
              monthlyBudget: 800000,
              quarterlyBudget: 2400000,
              dailyTransferLimit: 80000
            }
          }
        ];
        
        setSubsidiaries(mockSubsidiaries);
      } else {
        // For regular users, try to fetch actual company data
        try {
          const response = await companyAPI.getCurrentCompany();
          const company = response.data.company;
          
          setCurrentCompany(company);
          setIsParentCompany(company.type === 'parent');
          
          // 如果是父公司，获取子公司列表
          if (company.type === 'parent') {
            const subsidiariesResponse = await companyAPI.getSubsidiaries(company.id);
            setSubsidiaries(subsidiariesResponse.data.subsidiaries || []);
          }
        } catch (apiError) {
          console.error('Error fetching company info from API:', apiError);
          // Fallback to user role check
          setIsParentCompany(userIsParentAdmin);
        }
      }
    } catch (error) {
      console.error('Error in fetchCompanyInfo:', error);
      setError('Failed to load company information');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 刷新子公司列表
  const refreshSubsidiaries = useCallback(async () => {
    if (isParentCompany && currentCompany) {
      try {
        const response = await companyAPI.getSubsidiaries(currentCompany.id);
        setSubsidiaries(response.data.subsidiaries || []);
      } catch (error) {
        console.error('Error refreshing subsidiaries:', error);
      }
    }
  }, [isParentCompany, currentCompany]);

  // 切换当前公司
  const switchCompany = useCallback((companyId) => {
    if (companyId === 'all') {
      setCurrentCompany(null); // 显示所有公司
    } else if (companyId === currentCompany?.id) {
      setCurrentCompany(currentCompany); // 父公司
    } else {
      const subsidiary = subsidiaries.find(sub => sub.id === companyId);
      if (subsidiary) {
        setCurrentCompany(subsidiary);
      }
    }
  }, [currentCompany, subsidiaries]);

  // 获取可用公司列表
  const getAvailableCompanies = useCallback(() => {
    if (!isParentCompany) {
      return [currentCompany].filter(Boolean);
    }
    
    return [
      { ...currentCompany, name: `${currentCompany.name} (Parent)` },
      ...subsidiaries
    ].filter(Boolean);
  }, [currentCompany, subsidiaries, isParentCompany]);

  // 获取合并余额
  const getConsolidatedBalance = useCallback(async (token = 'USDC') => {
    if (!isParentCompany || !currentCompany) {
      return null;
    }
    
    try {
      const response = await companyAPI.getConsolidatedBalance(currentCompany.id, token);
      return response.data;
    } catch (error) {
      console.error('Error fetching consolidated balance:', error);
      return null;
    }
  }, [isParentCompany, currentCompany]);

  // 初始化
  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  const contextValue = {
    currentCompany,
    subsidiaries,
    isParentCompany,
    loading,
    error,
    availableCompanies: getAvailableCompanies(),
    switchCompany,
    refreshSubsidiaries,
    getConsolidatedBalance,
    fetchCompanyInfo
  };

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
};
