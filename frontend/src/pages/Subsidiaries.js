import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  message, 
  Tag, 
  Space,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  BankOutlined,
  UserOutlined,
  DollarOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useCompany } from '../contexts/CompanyContext';
import { companyAPI } from '../services/api';

const { Option } = Select;

const Subsidiaries = () => {
  const { currentCompany, subsidiaries, isParentCompany, refreshSubsidiaries } = useCompany();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubsidiary, setEditingSubsidiary] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (isParentCompany) {
      refreshSubsidiaries();
    }
  }, [isParentCompany, refreshSubsidiaries]);

  const handleAddSubsidiary = () => {
    setEditingSubsidiary(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditSubsidiary = (subsidiary) => {
    setEditingSubsidiary(subsidiary);
    form.setFieldsValue({
      name: subsidiary.name,
      companyCode: subsidiary.companyCode,
      walletAddress: subsidiary.walletAddress,
      monthlyBudget: subsidiary.treasurySettings?.monthlyBudget,
      quarterlyBudget: subsidiary.treasurySettings?.quarterlyBudget,
      dailyTransferLimit: subsidiary.treasurySettings?.dailyTransferLimit,
      allowCrossBorder: subsidiary.treasurySettings?.allowCrossBorder,
      autoApprovalEnabled: subsidiary.treasurySettings?.autoApprovalEnabled,
      autoApprovalThreshold: subsidiary.treasurySettings?.autoApprovalThreshold,
      approvalThresholds: subsidiary.treasurySettings?.approvalThresholds || [
        { maxAmount: 1000, requiredApprovals: 1, estimatedTime: '2-4 hours' },
        { maxAmount: 10000, requiredApprovals: 2, estimatedTime: '4-8 hours' },
        { maxAmount: 100000, requiredApprovals: 3, estimatedTime: '8-24 hours' }
      ]
    });
    setModalVisible(true);
  };

  const handleDeleteSubsidiary = async (subsidiaryId) => {
    try {
      await companyAPI.deleteSubsidiary(subsidiaryId);
      message.success('Subsidiary deleted successfully');
      refreshSubsidiaries();
    } catch (error) {
      message.error('Failed to delete subsidiary');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const subsidiaryData = {
        name: values.name,
        companyCode: values.companyCode,
        walletAddress: values.walletAddress,
        parentCompanyId: currentCompany.id,
        treasurySettings: {
          monthlyBudget: values.monthlyBudget,
          quarterlyBudget: values.quarterlyBudget,
          dailyTransferLimit: values.dailyTransferLimit,
          allowCrossBorder: values.allowCrossBorder,
          autoApprovalEnabled: values.autoApprovalEnabled,
          autoApprovalThreshold: values.autoApprovalThreshold,
          approvalThresholds: values.approvalThresholds
        }
      };

      if (editingSubsidiary) {
        await companyAPI.updateSubsidiary(editingSubsidiary.id, subsidiaryData);
        message.success('Subsidiary information updated successfully');
      } else {
        await companyAPI.registerSubsidiary(subsidiaryData);
        message.success('Subsidiary created successfully');
      }

      setModalVisible(false);
      refreshSubsidiaries();
      
    } catch (error) {
      console.error('Error saving subsidiary:', error);
      message.error(editingSubsidiary ? 'Failed to update subsidiary' : 'Failed to create subsidiary');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Company Info',
      key: 'companyInfo',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '16px' }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Code: {record.companyCode}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Wallet: {record.walletAddress?.slice(0, 10)}...{record.walletAddress?.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      title: 'Financial Status',
      key: 'financialStatus',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '14px' }}>
            <span style={{ color: '#666' }}>Balance: </span>
            <span style={{ fontWeight: 500 }}>
              ${(record.balance?.available || 0).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Monthly Budget: ${(record.treasurySettings?.monthlyBudget || 0).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const statusConfig = {
          active: { color: 'green', text: 'Active' },
          suspended: { color: 'orange', text: 'Suspended' },
          inactive: { color: 'red', text: 'Inactive' },
        };
        
        const config = statusConfig[record.status] || { color: 'default', text: record.status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'KYC Status',
      key: 'kycStatus',
      render: (_, record) => {
        const kycConfig = {
          approved: { color: 'green', text: 'Approved' },
          pending: { color: 'orange', text: 'Pending' },
          rejected: { color: 'red', text: 'Rejected' },
        };
        
        const config = kycConfig[record.kycStatus] || { color: 'default', text: record.kycStatus };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Users',
      key: 'userCount',
      render: (_, record) => (
        <span style={{ fontSize: '14px' }}>{record.userCount || 0} users</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => window.location.href = `/subsidiary/${record.id}/dashboard`}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditSubsidiary(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              size="small"
              danger
              onClick={() => {
                Modal.confirm({
                  title: 'Confirm Delete',
                  content: `Are you sure you want to delete subsidiary "${record.name}"? This action cannot be undone.`,
                  okText: 'Delete',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk: () => handleDeleteSubsidiary(record.id)
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (!isParentCompany) {
    return (
      <div className="p-6">
        <div className="text-center">
          <BankOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Subsidiary Management</h3>
          <p className="text-gray-500">Only parent company administrators can access this feature</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subsidiary Management</h1>
          <p className="text-gray-600">Manage your subsidiaries and financial configurations</p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddSubsidiary}
        >
          Add Subsidiary
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={16}>
                  <Col span={6}>
            <Card>
              <Statistic
                title="Total Subsidiaries"
                value={subsidiaries.length}
                suffix=""
                prefix={<BankOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={subsidiaries.reduce((sum, sub) => sum + (sub.userCount || 0), 0)}
                suffix=""
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Balance"
                value={subsidiaries.reduce((sum, sub) => sum + (sub.balance?.available || 0), 0)}
                suffix="USD"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Subsidiaries"
                value={subsidiaries.filter(sub => sub.status === 'active').length}
                suffix=""
                prefix={<SettingOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
      </Row>

      {/* Subsidiaries Table */}
      <Card title="Subsidiaries List">
        <Table
          columns={columns}
          dataSource={subsidiaries}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} entries`
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingSubsidiary ? 'Edit Subsidiary' : 'Add Subsidiary'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            allowCrossBorder: false,
            autoApprovalEnabled: false,
            autoApprovalThreshold: 1000,
            approvalThresholds: [
              { maxAmount: 1000, requiredApprovals: 1, estimatedTime: '2-4 hours' },
              { maxAmount: 10000, requiredApprovals: 2, estimatedTime: '4-8 hours' },
              { maxAmount: 100000, requiredApprovals: 3, estimatedTime: '8-24 hours' }
            ]
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
              >
                <Input placeholder="Enter company name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="companyCode"
                label="Company Code"
                rules={[{ required: true, message: 'Please enter company code' }]}
              >
                <Input placeholder="e.g., ACME002" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="walletAddress"
            label="Wallet Address"
            rules={[{ required: true, message: 'Please enter wallet address' }]}
          >
            <Input placeholder="0x..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="monthlyBudget"
                label="Monthly Budget"
                rules={[{ required: true, message: 'Please enter monthly budget' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="100,000"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quarterlyBudget"
                label="Quarterly Budget"
                rules={[{ required: true, message: 'Please enter quarterly budget' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="300,000"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dailyTransferLimit"
                label="Daily Transfer Limit"
                rules={[{ required: true, message: 'Please enter daily transfer limit' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="10,000"
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="allowCrossBorder"
                label="Allow Cross-Border Transfers"
                valuePropName="checked"
              >
                <Select>
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="autoApprovalEnabled"
                label="Enable Auto-Approval"
                valuePropName="checked"
              >
                <Select>
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="autoApprovalThreshold"
            label="Auto-Approval Threshold"
            rules={[{ required: true, message: 'Please enter auto-approval threshold' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="1,000"
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
              >
                {editingSubsidiary ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Subsidiaries;
