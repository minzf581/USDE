import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Button, 
  message, 
  Card,
  Row,
  Col,
  Alert
} from 'antd';
import { SwapOutlined, BankOutlined, DollarOutlined } from '@ant-design/icons';
import { useCompany } from '../contexts/CompanyContext';
import { companyAPI } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const InternalTransferForm = ({ visible, onCancel, onSuccess }) => {
  const { currentCompany, subsidiaries, isParentCompany } = useCompany();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableTokens] = useState(['USDC', 'USDT', 'DAI']);
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [sourceBalance, setSourceBalance] = useState(0);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState(null);

  // 获取可用目标公司
  const getAvailableTargetCompanies = () => {
    if (!isParentCompany) {
      // 子公司只能向父公司转账
      return [currentCompany?.parentCompany].filter(Boolean);
    }
    
    // 父公司可以向所有子公司转账
    return subsidiaries;
  };

  // 获取源公司余额
  const fetchSourceBalance = useCallback(async () => {
    if (!currentCompany) return;
    
    try {
      // 这里应该调用实际的API获取余额
      // 暂时使用模拟数据
      const mockBalance = Math.floor(Math.random() * 1000000) + 100000;
      setSourceBalance(mockBalance);
    } catch (error) {
      console.error('Error fetching source balance:', error);
    }
  }, [currentCompany]);

  // 检查审批要求
  const checkApprovalRequirements = (amount) => {
    if (!currentCompany?.transferSettings) return;
    
    const { approvalThresholds } = currentCompany.transferSettings;
    
    for (const threshold of approvalThresholds) {
      if (amount <= threshold.maxAmount) {
        setApprovalRequired(true);
        setApprovalDetails({
          requiredApprovals: threshold.requiredApprovals,
          estimatedTime: threshold.estimatedTime || '2-4 hours',
          approvers: threshold.approvers || []
        });
        return;
      }
    }
    
    setApprovalRequired(false);
    setApprovalDetails(null);
  };

  // 处理转账提交
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const transferData = {
        sourceCompanyId: currentCompany.id,
        targetCompanyId: values.targetCompany,
        amount: values.amount,
        token: selectedToken,
        purpose: values.purpose,
        priority: values.priority || 'normal'
      };

      await companyAPI.internalTransfer(transferData);
      
      message.success('Transfer request submitted successfully, awaiting approval');
      form.resetFields();
      onSuccess?.();
      onCancel();
      
    } catch (error) {
      console.error('Transfer error:', error);
      message.error('Failed to submit transfer request');
    } finally {
      setLoading(false);
    }
  };

  // 当可见性改变时重置表单
  useEffect(() => {
    if (visible) {
      form.resetFields();
      fetchSourceBalance();
    }
  }, [visible, form, fetchSourceBalance]);

  // 当金额改变时检查审批要求
  const handleAmountChange = (amount) => {
    if (amount) {
      checkApprovalRequirements(amount);
    }
  };

  const targetCompanies = getAvailableTargetCompanies();

  return (
    <Modal
              title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SwapOutlined style={{ color: '#1890ff' }} />
            <span>Internal Transfer</span>
          </div>
        }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: 'normal'
        }}
      >
        {/* Transfer Type Selection */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <BankOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontWeight: 500 }}>Transfer Type</span>
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {isParentCompany ? 'Parent Company → Subsidiary' : 'Subsidiary → Parent Company'}
          </div>
        </Card>

        {/* Source Company Information */}
        <Form.Item label="Source Company">
          <Input
            value={currentCompany?.name || 'Unknown Company'}
            disabled
            prefix={<BankOutlined />}
          />
        </Form.Item>

        {/* Target Company Selection */}
        <Form.Item
          name="targetCompany"
          label="Target Company"
          rules={[{ required: true, message: 'Please select target company' }]}
        >
          <Select placeholder="Select target company">
            {targetCompanies.map(company => (
              <Option key={company.id} value={company.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{company.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {company.companyCode}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Token and Amount */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Token Type">
              <Select
                value={selectedToken}
                onChange={setSelectedToken}
                placeholder="Select token"
              >
                {availableTokens.map(token => (
                  <Option key={token} value={token}>{token}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Available Balance">
              <Input
                value={`${sourceBalance.toLocaleString()} ${selectedToken}`}
                disabled
                prefix={<DollarOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="amount"
          label="Transfer Amount"
          rules={[
            { required: true, message: 'Please enter transfer amount' },
            { type: 'number', min: 1, message: 'Amount must be greater than 0' },
            {
              validator: (_, value) => {
                if (value && value > sourceBalance) {
                  return Promise.reject(new Error('Transfer amount cannot exceed available balance'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={sourceBalance}
            precision={2}
            placeholder="Enter transfer amount"
            onChange={handleAmountChange}
            addonAfter={selectedToken}
          />
        </Form.Item>

        {/* Priority Selection */}
        <Form.Item name="priority" label="Priority">
          <Select placeholder="Select priority">
            <Option value="low">Low</Option>
            <Option value="normal">Normal</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
        </Form.Item>

        {/* Transfer Purpose */}
        <Form.Item
          name="purpose"
          label="Transfer Purpose"
          rules={[{ required: true, message: 'Please enter transfer purpose' }]}
        >
          <TextArea
            rows={3}
            placeholder="Please describe the transfer purpose in detail, e.g., Q4 budget allocation, operational funds, etc."
            maxLength={200}
            showCount
          />
        </Form.Item>

        {/* Approval Requirements Notice */}
        {approvalRequired && approvalDetails && (
          <Alert
            message="Approval Requirements"
            description={
              <div>
                <p>This transfer requires <strong>{approvalDetails.requiredApprovals}</strong> approval(s)</p>
                <p>Estimated approval time: <strong>{approvalDetails.estimatedTime}</strong></p>
                {approvalDetails.approvers.length > 0 && (
                  <p>Approvers: {approvalDetails.approvers.join(', ')}</p>
                )}
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Action Buttons */}
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SwapOutlined />}
          >
            Submit Transfer Request
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InternalTransferForm;

