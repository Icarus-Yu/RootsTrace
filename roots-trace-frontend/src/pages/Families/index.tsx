import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Space, Table, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { familyApi } from '../../api/services';
import type { Family } from '../../types';

const { Title, Text } = Typography;

const Families = () => {
  const navigate = useNavigate();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [collaboratorOpen, setCollaboratorOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [form] = Form.useForm();
  const [collaboratorForm] = Form.useForm();

  const fetchFamilies = async () => {
    setLoading(true);
    try {
      setFamilies(await familyApi.list());
    } catch (error: any) {
      message.error(error.response?.data?.message || '族谱列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const openCreate = () => {
    setEditingFamily(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (family: Family) => {
    setEditingFamily(family);
    form.setFieldsValue({
      ...family,
      compiledAt: family.compiledAt ? dayjs(family.compiledAt) : undefined,
    });
    setModalOpen(true);
  };

  const submitFamily = async () => {
    const values = await form.validateFields();
    const payload = {
      name: values.name,
      surname: values.surname,
      compiledAt: values.compiledAt?.format('YYYY-MM-DD'),
    };
    try {
      if (editingFamily) {
        await familyApi.update(editingFamily.id, payload);
        message.success('族谱已更新');
      } else {
        await familyApi.create(payload);
        message.success('族谱已创建');
      }
      setModalOpen(false);
      fetchFamilies();
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    }
  };

  const removeFamily = async (id: number) => {
    try {
      await familyApi.remove(id);
      message.success('族谱已删除');
      fetchFamilies();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const submitCollaborator = async () => {
    if (!selectedFamily) return;
    const values = await collaboratorForm.validateFields();
    try {
      await familyApi.addCollaborator(selectedFamily.id, values.account);
      message.success('协作者已添加');
      setCollaboratorOpen(false);
      collaboratorForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || '添加协作者失败');
    }
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>族谱管理</Title>
          <Text type="secondary">管理你创建或协作的族谱，并进入成员维护。</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建族谱
        </Button>
      </Space>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={families}
          columns={[
            { title: '族谱名称', dataIndex: 'name' },
            { title: '姓氏', dataIndex: 'surname', render: (value) => value || '-' },
            { title: '编修日期', dataIndex: 'compiledAt', render: (value) => value || '-' },
            {
              title: '操作',
              width: 360,
              render: (_, record) => (
                <Space wrap>
                  <Button icon={<TeamOutlined />} onClick={() => navigate(`/families/${record.id}/members`)}>
                    成员
                  </Button>
                  <Button icon={<UserAddOutlined />} onClick={() => {
                    setSelectedFamily(record);
                    setCollaboratorOpen(true);
                  }}>
                    协作者
                  </Button>
                  <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
                    编辑
                  </Button>
                  <Popconfirm title="确认删除该族谱？" onConfirm={() => removeFamily(record.id)}>
                    <Button danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingFamily ? '编辑族谱' : '新建族谱'}
        open={modalOpen}
        onOk={submitFamily}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="族谱名称" rules={[{ required: true, message: '请输入族谱名称' }]}>
            <Input placeholder="例如：张氏族谱" />
          </Form.Item>
          <Form.Item name="surname" label="姓氏">
            <Input placeholder="例如：张" />
          </Form.Item>
          <Form.Item name="compiledAt" label="编修日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`添加协作者${selectedFamily ? `：${selectedFamily.name}` : ''}`}
        open={collaboratorOpen}
        onOk={submitCollaborator}
        onCancel={() => setCollaboratorOpen(false)}
        destroyOnClose
      >
        <Form form={collaboratorForm} layout="vertical">
          <Form.Item name="account" label="用户名或邮箱" rules={[{ required: true, message: '请输入用户名或邮箱' }]}>
            <Input placeholder="协作者账号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Families;
