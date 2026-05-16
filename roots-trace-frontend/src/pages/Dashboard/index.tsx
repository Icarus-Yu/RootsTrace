import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Select, Statistic, Typography, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import { familyApi } from '../../api/services';
import type { DashboardData, Family } from '../../types';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyId, setFamilyId] = useState<number>();
  const [dashboard, setDashboard] = useState<DashboardData>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const list = await familyApi.list();
        setFamilies(list);
        setFamilyId(list[0]?.id);
      } catch (error: any) {
        message.error(error.response?.data?.message || '族谱加载失败');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!familyId) return;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        setDashboard(await familyApi.dashboard(familyId));
      } catch (error: any) {
        message.error(error.response?.data?.message || '统计数据加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [familyId]);

  const genderOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        data: [
          { name: '男性', value: dashboard?.maleMembers ?? 0 },
          { name: '女性', value: dashboard?.femaleMembers ?? 0 },
        ],
      },
    ],
  }), [dashboard]);

  const generationOption = useMemo(() => ({
    tooltip: {},
    xAxis: { type: 'category', data: dashboard?.generationDistribution.map((item) => `第${item.label}代`) ?? [] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: dashboard?.generationDistribution.map((item) => item.value) ?? [], itemStyle: { color: '#4078c0' } }],
  }), [dashboard]);

  const relationOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: '65%',
        data: dashboard?.relationDistribution.map((item) => ({ name: item.label, value: item.value })) ?? [],
      },
    ],
  }), [dashboard]);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>仪表盘</Title>
          <Text type="secondary">查看族谱成员规模、性别、代际和关系统计。</Text>
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

      {!familyId ? (
        <Empty description="请先创建族谱" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}><Statistic title="总成员数" value={dashboard?.totalMembers ?? 0} /></Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}><Statistic title="男性成员" value={dashboard?.maleMembers ?? 0} /></Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}><Statistic title="女性成员" value={dashboard?.femaleMembers ?? 0} /></Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}><Statistic title="平均寿命" value={dashboard?.averageLifespan ?? 0} suffix="岁" precision={1} /></Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={8}>
              <Card title="性别比例" loading={loading}>
                <ReactECharts option={genderOption} style={{ height: 300 }} />
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Card title="代际分布" loading={loading}>
                <ReactECharts option={generationOption} style={{ height: 300 }} />
              </Card>
            </Col>
            <Col xs={24}>
              <Card title="关系类型分布" loading={loading}>
                <ReactECharts option={relationOption} style={{ height: 300 }} />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
