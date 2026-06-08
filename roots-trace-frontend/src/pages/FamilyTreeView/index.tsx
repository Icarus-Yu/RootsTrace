import { useEffect, useState } from 'react';
import { Alert, Card, Col, Empty, Row, Select, Skeleton, Space, Tag, Typography, message } from 'antd';
import { ManOutlined, WomanOutlined } from '@ant-design/icons';
import { familyApi, queryApi } from '../../api/services';
import FullFamilyTreeChart from '../../components/FamilyTree/FullFamilyTreeChart';
import type { Family, FamilyTree } from '../../types';

const { Title, Text } = Typography;

const FamilyTreeView = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyId, setFamilyId] = useState<number>();
  const [tree, setTree] = useState<FamilyTree>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const list = await familyApi.list();
        setFamilies(list);
        if (list.length > 0) setFamilyId(list[0].id);
      } catch (error: any) {
        message.error(error.response?.data?.message || '族谱加载失败');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!familyId) return;
    const load = async () => {
      setLoading(true);
      try {
        setTree(await queryApi.familyTree(familyId));
      } catch (error: any) {
        message.error(error.response?.data?.message || '族谱树加载失败');
        setTree(undefined);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [familyId]);

  const currentFamily = families.find((f) => f.id === familyId);

  return (
    <div className="rt-page">
      <Row justify="space-between" align="middle" className="rt-page-header">
        <Col>
          <Title level={4} className="rt-page-title">族谱树</Title>
          <Text className="rt-page-subtitle">
            以始祖为根、自上而下展开的世系图。点击节点查看成员详情，可缩放与拖拽。
          </Text>
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

      <Card className="rt-card rt-chart-card">
        {!familyId && !loading ? (
          <div style={{ padding: '60px 0' }}>
            <Empty description="请先创建族谱" />
          </div>
        ) : loading ? (
          <Skeleton active paragraph={{ rows: 14 }} />
        ) : (
          <>
            <Space size="middle" wrap style={{ marginBottom: 16 }}>
              <Tag color="default">
                {currentFamily?.name}
                {currentFamily?.surname ? `（${currentFamily.surname}氏）` : ''}
              </Tag>
              <Text type="secondary">
                共 {tree?.totalMembers ?? 0} 人 · 展示 {tree?.nodes.length ?? 0} 个世系节点
              </Text>
              <Tag icon={<ManOutlined />} color="blue">男</Tag>
              <Tag icon={<WomanOutlined />} color="magenta">女</Tag>
            </Space>

            {tree && !tree.full && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={`该族谱规模较大（共 ${tree.totalMembers} 人），为保证可读性仅展示自始祖起的前 ${tree.depth} 代世系。`}
              />
            )}

            {tree && tree.nodes.length > 0 ? (
              <FullFamilyTreeChart nodes={tree.nodes} rootId={tree.rootId} height={660} />
            ) : (
              <Empty description="暂无族谱数据" />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default FamilyTreeView;
