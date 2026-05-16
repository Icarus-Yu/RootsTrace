import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tabs, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { memberApi, relationApi } from '../../api/services';
import type { Member, Relation, RelationType } from '../../types';

const { Title, Text } = Typography;

const relationLabels: Record<RelationType, string> = {
  PARENT_SON: '父子',
  PARENT_DAUGHTER: '父女',
  MOTHER_SON: '母子',
  MOTHER_DAUGHTER: '母女',
  SPOUSE: '配偶',
};

const Members = () => {
  const { id } = useParams();
  const familyId = Number(id);
  const [members, setMembers] = useState<Member[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [relationModalOpen, setRelationModalOpen] = useState(false);
  const [memberForm] = Form.useForm();
  const [relationForm] = Form.useForm();

  const memberOptions = useMemo(
    () => members.map((member) => ({ label: `${member.name} #${member.id}`, value: member.id })),
    [members],
  );
  const memberNameMap = useMemo(() => new Map(members.map((member) => [member.id, member.name])), [members]);

  const fetchMembers = async (targetPage = page, targetKeyword = keyword) => {
    setLoading(true);
    try {
      const result = await memberApi.list(familyId, { page: targetPage, size: 20, keyword: targetKeyword || undefined });
      setMembers(result.records);
      setTotal(result.total);
      setPage(result.current);
    } catch (error: any) {
      message.error(error.response?.data?.message || '成员列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelations = async () => {
    try {
      setRelations(await relationApi.list(familyId));
    } catch (error: any) {
      message.error(error.response?.data?.message || '关系列表加载失败');
    }
  };

  useEffect(() => {
    if (!familyId) return;
    fetchMembers(1);
    fetchRelations();
  }, [familyId]);

  const openCreateMember = () => {
    setEditingMember(null);
    memberForm.resetFields();
    memberForm.setFieldsValue({ gender: 'M', generation: 1 });
    setMemberModalOpen(true);
  };

  const openEditMember = (member: Member) => {
    setEditingMember(member);
    memberForm.setFieldsValue(member);
    setMemberModalOpen(true);
  };

  const submitMember = async () => {
    const values = await memberForm.validateFields();
    const payload = {
      name: values.name,
      gender: values.gender,
      birthYear: values.birthYear,
      deathYear: values.deathYear,
      bio: values.bio,
      generation: values.generation,
    };
    try {
      if (editingMember) {
        await memberApi.update(editingMember.id, payload);
        message.success('成员已更新');
      } else {
        await memberApi.create({ ...payload, familyId });
        message.success('成员已新增');
      }
      setMemberModalOpen(false);
      fetchMembers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存成员失败');
    }
  };

  const removeMember = async (memberId: number) => {
    try {
      await memberApi.remove(memberId);
      message.success('成员已删除');
      fetchMembers();
      fetchRelations();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除成员失败');
    }
  };

  const submitRelation = async () => {
    const values = await relationForm.validateFields();
    try {
      await relationApi.create({ ...values, familyId });
      message.success('关系已新增');
      setRelationModalOpen(false);
      relationForm.resetFields();
      fetchRelations();
    } catch (error: any) {
      message.error(error.response?.data?.message || '新增关系失败');
    }
  };

  const removeRelation = async (relationId: number) => {
    try {
      await relationApi.remove(relationId);
      message.success('关系已删除');
      fetchRelations();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除关系失败');
    }
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>成员管理</Title>
          <Text type="secondary">族谱 #{familyId} 的成员、搜索和关系维护。</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchMembers(1)}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateMember}>
            新增成员
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => setRelationModalOpen(true)}>
            新增关系
          </Button>
        </Space>
      </Space>

      <Tabs
        items={[
          {
            key: 'members',
            label: '成员',
            children: (
              <Card>
                <Space style={{ marginBottom: 16 }}>
                  <Input.Search
                    allowClear
                    placeholder="按姓名搜索"
                    onSearch={(value) => {
                      setKeyword(value);
                      setPage(1);
                      fetchMembers(1, value);
                    }}
                    style={{ width: 260 }}
                  />
                </Space>
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={members}
                  pagination={{
                    current: page,
                    total,
                    pageSize: 20,
                    onChange: (nextPage) => fetchMembers(nextPage),
                  }}
                  columns={[
                    { title: 'ID', dataIndex: 'id', width: 80 },
                    { title: '姓名', dataIndex: 'name' },
                    { title: '性别', dataIndex: 'gender', render: (value) => (value === 'M' ? '男' : '女') },
                    { title: '出生年', dataIndex: 'birthYear', render: (value) => value || '-' },
                    { title: '死亡年', dataIndex: 'deathYear', render: (value) => value || '-' },
                    { title: '代际', dataIndex: 'generation' },
                    {
                      title: '操作',
                      width: 180,
                      render: (_, record) => (
                        <Space>
                          <Button icon={<EditOutlined />} onClick={() => openEditMember(record)}>
                            编辑
                          </Button>
                          <Popconfirm title="确认删除该成员？" onConfirm={() => removeMember(record.id)}>
                            <Button danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'relations',
            label: '关系',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  dataSource={relations}
                  columns={[
                    { title: '起点成员', dataIndex: 'fromMemberId', render: (value) => `${memberNameMap.get(value) || '成员'} #${value}` },
                    { title: '终点成员', dataIndex: 'toMemberId', render: (value) => `${memberNameMap.get(value) || '成员'} #${value}` },
                    { title: '关系', dataIndex: 'relationType', render: (value: RelationType) => relationLabels[value] },
                    {
                      title: '操作',
                      width: 120,
                      render: (_, record) => (
                        <Popconfirm title="确认删除该关系？" onConfirm={() => removeRelation(record.id)}>
                          <Button danger icon={<DeleteOutlined />}>
                            删除
                          </Button>
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={editingMember ? '编辑成员' : '新增成员'}
        open={memberModalOpen}
        onOk={submitMember}
        onCancel={() => setMemberModalOpen(false)}
        destroyOnClose
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
            <Select options={[{ label: '男', value: 'M' }, { label: '女', value: 'F' }]} />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="birthYear" label="出生年" style={{ width: '50%' }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="deathYear" label="死亡年" style={{ width: '50%' }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="generation" label="代际" rules={[{ required: true, message: '请输入代际' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="bio" label="简介">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增关系"
        open={relationModalOpen}
        onOk={submitRelation}
        onCancel={() => setRelationModalOpen(false)}
        destroyOnClose
      >
        <Form form={relationForm} layout="vertical">
          <Form.Item name="fromMemberId" label="起点成员" rules={[{ required: true, message: '请选择起点成员' }]}>
            <Select showSearch optionFilterProp="label" options={memberOptions} />
          </Form.Item>
          <Form.Item name="toMemberId" label="终点成员" rules={[{ required: true, message: '请选择终点成员' }]}>
            <Select showSearch optionFilterProp="label" options={memberOptions} />
          </Form.Item>
          <Form.Item name="relationType" label="关系类型" rules={[{ required: true, message: '请选择关系类型' }]}>
            <Select
              options={Object.entries(relationLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Members;
