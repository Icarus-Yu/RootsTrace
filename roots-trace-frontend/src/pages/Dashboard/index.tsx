import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Select, Statistic, Typography, message, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import CountUp from 'react-countup';
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
    tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,0.9)', borderWeight: 0, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' },
    legend: { bottom: 10, itemWidth: 10, itemHeight: 10, borderRadius: 5 },
    color: ['#229ed9', '#d84f8b'],
    series: [
      {
        type: 'pie',
        radius: ['50%', '72%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: [
          { name: '男性', value: dashboard?.maleMembers ?? 0 },
          { name: '女性', value: dashboard?.femaleMembers ?? 0 },
        ],
      },
    ],
  }), [dashboard]);

  const generationOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: dashboard?.generationDistribution.map((item) => `第${item.label}代`) ?? [], axisTick: { show: false }, axisLine: { lineStyle: { color: '#dbe8f2' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f0f4f8' } } },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    series: [{ 
      type: 'bar', 
      data: dashboard?.generationDistribution.map((item) => item.value) ?? [], 
      barWidth: '45%',
      itemStyle: { 
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#229ed9' }, { offset: 1, color: '#62c4f6' }]
        },
        borderRadius: [6, 6, 0, 0] 
      } 
    }],
  }), [dashboard]);

  const relationOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    color: ['#229ed9', '#66c4f1', '#8fd3ff', '#55d6be', '#f0b95e'],
    series: [
      {
        type: 'pie',
        radius: '65%',
        itemStyle: { borderRadius: 8 },
        data: dashboard?.relationDistribution.map((item) => ({ name: item.label, value: item.value })) ?? [],
      },
    ],
  }), [dashboard]);

  const renderStat = (title: string, value: number = 0, suffix: string = '') => (
    <Card className="rt-stat-card">
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <Statistic 
          title={title} 
          value={value} 
          formatter={(val) => <CountUp end={Number(val)} duration={2} separator="," />}
          suffix={suffix} 
        />
      )}
    </Card>
  );

  return (
    <div className="rt-page">
      <Row justify="space-between" align="middle" className="rt-page-header">
        <Col>
          <Title level={4} className="rt-page-title">仪表盘</Title>
          <Text className="rt-page-subtitle">查看族谱成员规模、性别、代际和关系统计。</Text>
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

      {!familyId && !loading ? (
        <div style={{ padding: '60px 0' }}><Empty description="请先创建族谱" /></div>
      ) : (
        <>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={6}>{renderStat('总成员数', dashboard?.totalMembers)}</Col>
            <Col xs={24} sm={12} lg={6}>{renderStat('男性成员', dashboard?.maleMembers)}</Col>
            <Col xs={24} sm={12} lg={6}>{renderStat('女性成员', dashboard?.femaleMembers)}</Col>
            <Col xs={24} sm={12} lg={6}>{renderStat('平均寿命', dashboard?.averageLifespan, '岁')}</Col>
          </Row>

          <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
            <Col xs={24} lg={8}>
              <Card className="rt-card rt-chart-card" title="性别比例">
                {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : <ReactECharts option={genderOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />}
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Card className="rt-card rt-chart-card" title="代际分布">
                {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : <ReactECharts option={generationOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />}
              </Card>
            </Col>
            <Col xs={24}>
              <Card className="rt-card rt-chart-card" title="关系类型分布">
                {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : <ReactECharts option={relationOption} style={{ height: 340 }} opts={{ renderer: 'svg' }} />}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
