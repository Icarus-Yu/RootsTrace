import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, InputNumber, Row, Select, Space, Tabs, Typography, message, Skeleton } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { familyApi, memberApi, queryApi } from '../../api/services';
import AncestorTreeChart from '../../components/AncestorTree/AncestorTreeChart';
import FamilyTreeChart from '../../components/FamilyTree/FamilyTreeChart';
import KinshipPathChart from '../../components/KinshipPath/KinshipPathChart';
import type { Family, KinshipPath, Member, MemberNode } from '../../types';

const { Title, Text } = Typography;

const Queries = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyId, setFamilyId] = useState<number>();
  const [members, setMembers] = useState<Member[]>([]);
  const [ancestors, setAncestors] = useState<MemberNode[]>([]);
  const [descendants, setDescendants] = useState<MemberNode[]>([]);
  const [kinship, setKinship] = useState<KinshipPath>();
  const [loading, setLoading] = useState(false);
  const [ancestorForm] = Form.useForm();
  const [descendantForm] = Form.useForm();
  const [kinshipForm] = Form.useForm();

  const memberOptions = useMemo(
    () => members.map((member) => ({ label: `${member.name} #${member.id}`, value: member.id })),
    [members],
  );

  useEffect(() => {
    const init = async () => {
      try {
        const list = await familyApi.list();
        setFamilies(list);
        if (list.length > 0) {
          setFamilyId(list[0].id);
        }
      } catch (error: any) {
        message.error(error.response?.data?.message || '族谱加载失败');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!familyId) return;
    const loadMembers = async () => {
      try {
        const result = await memberApi.list(familyId, { page: 1, size: 200 }); // Increase size for better search
        setMembers(result.records);
        setAncestors([]);
        setDescendants([]);
        setKinship(undefined);
        ancestorForm.resetFields();
        descendantForm.resetFields();
        kinshipForm.resetFields();
      } catch (error: any) {
        message.error(error.response?.data?.message || '成员加载失败');
      }
    };
    loadMembers();
  }, [familyId]);

  const searchAncestors = async () => {
    const values = await ancestorForm.validateFields();
    setLoading(true);
    try {
      setAncestors(await queryApi.ancestors(values.memberId));
    } catch (error: any) {
      message.error(error.response?.data?.message || '祖先查询失败');
    } finally {
      setLoading(false);
    }
  };

  const searchDescendants = async () => {
    const values = await descendantForm.validateFields();
    setLoading(true);
    try {
      setDescendants(await queryApi.descendants(values.memberId, values.depth ?? 10));
    } catch (error: any) {
      message.error(error.response?.data?.message || '后代查询失败');
    } finally {
      setLoading(false);
    }
  };

  const searchKinship = async () => {
    if (!familyId) return;
    const values = await kinshipForm.validateFields();
    setLoading(true);
    try {
      setKinship(await queryApi.kinship(familyId, values.memberAId, values.memberBId));
    } catch (error: any) {
      message.error(error.response?.data?.message || '亲缘路径查询失败');
    } finally {
      setLoading(false);
    }
  };

  const memberSelect = (name: string, label: string) => (
    <Form.Item name={name} label={label} rules={[{ required: true, message: `请选择${label}` }]} style={{ marginBottom: 12 }}>
      <Select showSearch optionFilterProp="label" options={memberOptions} placeholder="输入姓名或 ID 搜索" style={{ minWidth: 200 }} />
    </Form.Item>
  );

  return (
    <div className="rt-page">
      <Row justify="space-between" align="middle" className="rt-page-header">
        <Col>
          <Title level={4} className="rt-page-title">亲缘查询</Title>
          <Text className="rt-page-subtitle">查询祖先、后代和两名成员间的最短亲缘路径。</Text>
        </Col>
        <Col>
          <Select
            style={{ width: 240 }}
            placeholder="选择族谱"
            value={familyId}
            onChange={setFamilyId}
            options={families.map((family) => ({ label: family.name, value: family.id }))}
          />
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'ancestors',
            label: '祖先追溯',
            children: (
              <Card className="rt-card rt-chart-card">
                <Form form={ancestorForm} layout="inline" style={{ marginBottom: 24 }}>
                  {memberSelect('memberId', '中心成员')}
                  <Form.Item>
                    <Button type="primary" icon={<SearchOutlined />} onClick={searchAncestors}>
                      查询祖先
                    </Button>
                  </Form.Item>
                </Form>
                {loading ? <Skeleton active paragraph={{ rows: 12 }} /> : <AncestorTreeChart nodes={ancestors} />}
              </Card>
            ),
          },
          {
            key: 'descendants',
            label: '后代查询',
            children: (
              <Card className="rt-card rt-chart-card">
                <Form form={descendantForm} layout="inline" initialValues={{ depth: 10 }} style={{ marginBottom: 24 }}>
                  {memberSelect('memberId', '起始成员')}
                  <Form.Item name="depth" label="搜索代数">
                    <InputNumber min={1} max={100} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" icon={<SearchOutlined />} onClick={searchDescendants}>
                      展开后代
                    </Button>
                  </Form.Item>
                </Form>
                {loading ? <Skeleton active paragraph={{ rows: 12 }} /> : <FamilyTreeChart nodes={descendants} />}
              </Card>
            ),
          },
          {
            key: 'kinship',
            label: '亲缘路径',
            children: (
              <Card className="rt-card rt-chart-card">
                <Form form={kinshipForm} layout="inline" style={{ marginBottom: 24 }}>
                  {memberSelect('memberAId', '成员 A')}
                  {memberSelect('memberBId', '成员 B')}
                  <Form.Item>
                    <Button type="primary" icon={<SearchOutlined />} onClick={searchKinship}>
                      计算路径
                    </Button>
                  </Form.Item>
                </Form>
                {loading ? (
                  <Skeleton active paragraph={{ rows: 12 }} />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <KinshipPathChart pathEdges={kinship?.pathEdges} members={members} />
                  </Space>
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Queries;
