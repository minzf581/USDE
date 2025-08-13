import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, InputNumber, message, Tag, Space } from 'antd';
import { TransactionOutlined, SettingOutlined, SwapOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
// import { useCompany } from '../../contexts/CompanyContext'; // 暂时注释掉未使用的import
import { companyAPI } from '../../services/api';
import InternalTransferForm from '../InternalTransferForm';

const SubsidiaryDashboard = () => {
  const { id } = useParams();
  const [subsidiary, setSubsidiary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [settingsForm] = Form.useForm();

  const fetchSubsidiaryData = useCallback(async () => {
    try {
      setLoading(true);
      const [subsidiaryRes, transactionsRes] = await Promise.all([
        companyAPI.getCompanySettings(id),
        companyAPI.getInternalTransfers(id)
      ]);
      setSubsidiary(subsidiaryRes.data.company || subsidiaryRes.data);
      setTransactions(transactionsRes.data.transactions || transactionsRes.data || []);
    } catch (error) {
      message.error('Failed to fetch subsidiary data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubsidiaryData();
  }, [fetchSubsidiaryData]);

  const handleTransferSuccess = () => {
    fetchSubsidiaryData();
  };

  const handleUpdateSettings = async (values) => {
    try {
      await companyAPI.updateCompanySettings(id, values);
      message.success('Settings updated successfully');
      setSettingsModalVisible(false);
      settingsForm.resetFields();
      fetchSubsidiaryData();
    } catch (error) {
      message.error('Failed to update settings');
    }
  };

  const transactionColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => {
        const typeConfig = {
          internal_transfer: { color: 'blue', text: '内部转账' },
          external_payment: { color: 'green', text: '外部支付' },
          withdrawal: { color: 'orange', text: '提现' },
          deposit: { color: 'purple', text: '存款' },
        };
        
        const config = typeConfig[text] || { color: 'default', text: text };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      render: (text, record) => {
        if (record.type === 'internal_transfer') {
          return (
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.fromCompany} → {record.toCompany}
              </div>
            </div>
          );
        }
        return text || '-';
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record) => (
        <span style={{ fontWeight: 500 }}>
          {text?.toLocaleString()} {record.token || 'USDC'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        const statusConfig = {
          pending: { color: 'orange', text: '待处理' },
          completed: { color: 'green', text: '已完成' },
          failed: { color: 'red', text: '失败' },
          approved: { color: 'blue', text: '已审批' },
        };
        
        const config = statusConfig[text] || { color: 'default', text: text };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  if (!subsidiary) {
    return <div>加载中...</div>;
  }

  return (
    <div>
              <Card title={`${subsidiary.name} - Subsidiary Dashboard`}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="UC Balance" value={subsidiary.ucBalance} suffix="UC" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="USDE Balance" value={subsidiary.usdeBalance} suffix="USDE" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Earnings" value={subsidiary.totalEarnings} prefix="$" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="KYC Status" value={subsidiary.kycStatus === 'approved' ? 'Approved' : 'Pending'} />
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={() => setTransferModalVisible(true)}
            >
              Internal Transfer
            </Button>
            <Button
              icon={<TransactionOutlined />}
              onClick={() => setTransferModalVisible(true)}
            >
              External Payment
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => {
                if (subsidiary?.treasurySettings) {
                  settingsForm.setFieldsValue(subsidiary.treasurySettings);
                }
                setSettingsModalVisible(true);
              }}
            >
              Settings
            </Button>
          </Space>
        </div>

        <Card title="Recent Transactions" style={{ marginTop: 24 }}>
          <Table
            columns={transactionColumns}
            dataSource={transactions}
            loading={loading}
            rowKey="id"
          />
        </Card>
      </Card>

      <InternalTransferForm
        visible={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        onSuccess={handleTransferSuccess}
      />

      <Modal
        title="Subsidiary Settings"
        visible={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        onOk={() => settingsForm.submit()}
      >
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={handleUpdateSettings}
        >
          <Form.Item
            name="monthlyBudget"
            label="Monthly Budget"
            rules={[{ required: true, message: 'Please enter monthly budget' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="Enter monthly budget"
            />
          </Form.Item>
          <Form.Item
            name="quarterlyBudget"
            label="Quarterly Budget"
            rules={[{ required: true, message: 'Please enter quarterly budget' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="Enter quarterly budget"
            />
          </Form.Item>
          <Form.Item
            name="approvalThreshold"
            label="Approval Threshold"
            rules={[{ required: true, message: 'Please enter approval threshold' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="Enter approval threshold"
            />
          </Form.Item>
          <Form.Item
            name="autoApprovalEnabled"
            label="Auto-Approval"
            valuePropName="checked"
          >
            <Input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubsidiaryDashboard;
