import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { DollarOutlined, BankOutlined, SwapOutlined } from '@ant-design/icons';
import { useCompany } from '../contexts/CompanyContext';

const ConsolidatedBalanceDashboard = () => {
  const { 
    subsidiaries, 
    isParentCompany, 
    getConsolidatedBalance 
  } = useCompany();
  
  const [consolidatedData, setConsolidatedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState('USDC');

  // 获取合并余额数据
  const fetchConsolidatedBalance = useCallback(async () => {
    if (!isParentCompany) return;
    
    try {
      setLoading(true);
      const data = await getConsolidatedBalance(selectedToken);
      setConsolidatedData(data);
    } catch (error) {
      console.error('Error fetching consolidated balance:', error);
    } finally {
      setLoading(false);
    }
  }, [isParentCompany, selectedToken, getConsolidatedBalance]);

  useEffect(() => {
    fetchConsolidatedBalance();
  }, [fetchConsolidatedBalance]);

  if (!isParentCompany) {
    return null;
  }

  const tokenOptions = ['USDC', 'USDT', 'DAI', 'ETH'];

  const balanceColumns = [
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.companyCode}
          </div>
        </div>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (value) => (
        <span style={{ fontWeight: 600, fontSize: '16px' }}>
          {value?.toLocaleString() || '0'} {selectedToken}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          active: { color: 'green', text: 'Active' },
          suspended: { color: 'orange', text: 'Suspended' },
          inactive: { color: 'red', text: 'Inactive' },
        };
        
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => (
        <span style={{ fontSize: '14px' }}>{count || 0} users</span>
      ),
    },
  ];

  const transferColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeConfig = {
          parent_to_subsidiary: { color: 'blue', text: 'Parent→Sub' },
          subsidiary_to_parent: { color: 'green', text: 'Sub→Parent' },
          subsidiary_to_subsidiary: { color: 'purple', text: 'Sub→Sub' },
        };
        
        const config = typeConfig[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span style={{ fontWeight: 500 }}>
          {amount?.toLocaleString()} {record.token}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          completed: { color: 'green', text: 'Completed' },
          pending: { color: 'orange', text: 'Pending' },
          failed: { color: 'red', text: 'Failed' },
        };
        
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  const mockTransferData = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'parent_to_subsidiary',
      amount: 500000,
      token: 'USDC',
      status: 'completed',
      from: 'Acme Corporation',
      to: 'Acme Asia Pacific',
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      type: 'subsidiary_to_parent',
      amount: 200000,
      token: 'USDT',
      status: 'pending',
      from: 'Acme Europe',
      to: 'Acme Corporation',
    },
  ];

  return (
    <div>
      {/* 合并余额概览 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BankOutlined style={{ color: '#1890ff' }} />
            <span>Consolidated Balance Overview</span>
          </div>
        }
        style={{ marginBottom: 24 }}
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Token:</span>
            <select 
              value={selectedToken} 
              onChange={(e) => setSelectedToken(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
            >
              {tokenOptions.map(token => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
          </div>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Balance"
                value={consolidatedData?.totalBalance || 0}
                suffix={selectedToken}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Parent Company Balance"
                value={consolidatedData?.parentBalance || 0}
                suffix={selectedToken}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Subsidiaries"
                value={subsidiaries.length}
                suffix=""
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={consolidatedData?.totalBalance || 0}
                suffix=""
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Company Balance Details */}
      <Card 
        title="Company Balance Details" 
        style={{ marginBottom: 24 }}
        loading={loading}
      >
        <Table
          columns={balanceColumns}
          dataSource={consolidatedData?.companies || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Cross-Company Transfer Records */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SwapOutlined style={{ color: '#52c41a' }} />
            <span>Recent Cross-Company Transfers</span>
          </div>
        }
      >
        <Table
          columns={transferColumns}
          dataSource={mockTransferData}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ConsolidatedBalanceDashboard;

