import ReactECharts from 'echarts-for-react';
import { Empty } from 'antd';
import type { MemberNode } from '../../types';

interface Props {
  nodes: MemberNode[];
}

const AncestorTreeChart = ({ nodes }: Props) => {
  if (!nodes.length) {
    return <Empty description="暂无查询结果" />;
  }

  const data = nodes.map((node) => ({
    id: String(node.id),
    name: `${node.name}\n第 ${node.generation ?? '-'} 代`,
    value: node.id,
    symbolSize: node.depth === 0 ? 58 : 46,
    itemStyle: { color: node.gender === 'M' ? '#4078c0' : '#d56b8a' },
    label: { fontSize: 12 },
    x: (node.depth ?? 0) * 160,
    y: node.id,
  }));

  const sorted = [...nodes].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
  const links = sorted.slice(1).map((node, index) => ({
    source: String(node.id),
    target: String(sorted[index].id),
  }));

  return (
    <ReactECharts
      style={{ height: 420 }}
      option={{
        tooltip: {},
        series: [
          {
            type: 'graph',
            layout: 'force',
            roam: true,
            data,
            links,
            edgeSymbol: ['circle', 'arrow'],
            force: { repulsion: 260, edgeLength: 120 },
            label: { show: true },
            lineStyle: { color: '#8c8c8c' },
          },
        ],
      }}
    />
  );
};

export default AncestorTreeChart;
