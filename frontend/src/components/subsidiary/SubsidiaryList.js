import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons';
import { subsidiaryAPI } from '../../services/api';

const SubsidiaryList = () => {
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedSubsidiary, setSelectedSubsidiary] = useState(null);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [consolidatedBalance, setConsolidatedBalance] = useState(null);

  const fetchSubsidiaries = async () => {
    try {
      setLoading(true);
      // 这里需要从用户信息中获取parentCompanyId，暂时使用一个示例ID
      const parentCompanyId = 'demo-company-id'; // 这个应该从用户上下文获取
      const response = await subsidiaryAPI.getSubsidiaries(parentCompanyId);
      setSubsidiaries(response.data.subsidiaries || []);
    } catch (error) {
      message.error('获取子公司列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsolidatedBalance = async () => {
    try {
      // 这里需要从用户信息中获取parentCompanyId，暂时使用一个示例ID
      const parentCompanyId = 'demo-company-id'; // 这个应该从用户上下文获取
      const response = await subsidiaryAPI.getConsolidatedBalance(parentCompanyId);
      setConsolidatedBalance(response.data.consolidatedBalance);
      setBalanceModalVisible(true);
    } catch (error) {
      message.error('获取合并余额失败');
    }
  };

  useEffect(() => {
    fetchSubsidiaries();
  }, []);

  const handleCreateSubsidiary = async (values) => {
    try {
      await subsidiaryAPI.createSubsidiary(values);
      message.success('子公司创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchSubsidiaries();
    } catch (error) {
      message.error('创建子公司失败');
    }
  };

  const handleEditSubsidiary = (record) => {
    setSelectedSubsidiary(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const columns = [
    {
      title: '公司名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '公司代码',
      dataIndex: 'companyCode',
      key: 'companyCode',
    },
    {
      title: 'UC余额',
      dataIndex: 'ucBalance',
      key: 'ucBalance',
      render: (text) => `${text} UC`,
    },
    {
      title: 'USDE余额',
      dataIndex: 'usdeBalance',
      key: 'usdeBalance',
      render: (text) => `${text} USDE`,
    },
    {
      title: 'KYC状态',
      dataIndex: 'kycStatus',
      key: 'kycStatus',
      render: (text) => {
        const statusMap = {
          pending: '待审核',
          approved: '已通过',
          rejected: '已拒绝',
        };
        return statusMap[text] || text;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditSubsidiary(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<BarChartOutlined />}
            onClick={() => window.location.href = `/subsidiary/${record.id}/dashboard`}
          >
            查看
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="子公司管理"
        extra={
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedSubsidiary(null);
                form.resetFields();
                setModalVisible(true);
              }}
              style={{ marginRight: 16 }}
            >
              创建子公司
            </Button>
            <Button
              onClick={fetchConsolidatedBalance}
              icon={<BarChartOutlined />}
            >
              查看合并余额
            </Button>
          </>
        }
      >
        <Table
          columns={columns}
          dataSource={subsidiaries}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title={selectedSubsidiary ? "编辑子公司" : "创建子公司"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubsidiary}
        >
          <Form.Item
            name="name"
            label="公司名称"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="公司邮箱"
            rules={[
              { required: true, message: '请输入公司邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="companyCode"
            label="公司代码"
            rules={[{ required: true, message: '请输入公司代码' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="companyAddress"
            label="区块链地址"
            rules={[{ required: true, message: '请输入区块链地址' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="合并余额"
        visible={balanceModalVisible}
        onCancel={() => setBalanceModalVisible(false)}
        footer={null}
      >
        {consolidatedBalance && (
          <div>
            <h3>母公司余额</h3>
            <p>UC: {consolidatedBalance.parentCompany.ucBalance}</p>
            <p>USDE: {consolidatedBalance.parentCompany.usdeBalance}</p>
            
            <h3>子公司总余额</h3>
            <p>UC: {consolidatedBalance.subsidiaries.totalUC}</p>
            <p>USDE: {consolidatedBalance.subsidiaries.totalUSDE}</p>
            <p>子公司数量: {consolidatedBalance.subsidiaries.count}</p>
            
            <h3>合并总余额</h3>
            <p>UC: {consolidatedBalance.consolidated.totalUC}</p>
            <p>USDE: {consolidatedBalance.consolidated.totalUSDE}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SubsidiaryList;
