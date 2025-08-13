import React from 'react';
import { Select, Card } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import { useCompany } from '../contexts/CompanyContext';

const { Option } = Select;

const CompanySelector = () => {
  const { 
    currentCompany, 
    subsidiaries, 
    isParentCompany, 
    switchCompany,
    loading 
  } = useCompany();

  if (!isParentCompany || loading) {
    return null;
  }

  const handleCompanyChange = (companyId) => {
    switchCompany(companyId);
  };

  const getCompanyDisplayName = (company) => {
    if (company.id === currentCompany?.id) {
      return `${company.name} (Parent)`;
    }
    return company.name;
  };

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: '12px 16px' }}
    >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BankOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500, marginRight: 8 }}>Company:</span>
          <Select
            defaultValue="all"
            style={{ minWidth: 200 }}
            onChange={handleCompanyChange}
            placeholder="Select Company"
          >
            <Option value="all">All Companies</Option>
            <Option value={currentCompany?.id}>
              {getCompanyDisplayName(currentCompany)}
            </Option>
            {subsidiaries.map(sub => (
              <Option key={sub.id} value={sub.id}>
                {sub.name}
              </Option>
            ))}
          </Select>
        </div>
    </Card>
  );
};

export default CompanySelector;
