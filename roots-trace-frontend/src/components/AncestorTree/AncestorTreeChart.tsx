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
    name: node.name,
    value: node.id,
    symbolSize: node.depth === 0 ? 45 : 30,
    itemStyle: {
      color: node.gender === 'M' ? '#229ed9' : '#d84f8b',
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.15)',
      borderWidth: 2,
      borderColor: '#fff'
    },
    label: { 
      show: true,
      position: 'bottom',
      fontSize: 11,
      color: '#4c6478',
      backgroundColor: 'rgba(255,255,255,0.6)',
      padding: [2, 4],
      borderRadius: 2
    },
    originalData: node
  }));

  const sorted = [...nodes].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
  const links = sorted.slice(1).map((node, index) => ({
    source: String(node.id),
    target: String(sorted[index].id),
    lineStyle: { width: 1.5, curveness: 0.1, color: '#9bb9cc' }
  }));

  return (
    <ReactECharts
      style={{ height: 500 }}
      option={{
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const d = params.data.originalData;
              return `${d.name}<br/>第 ${d.generation} 代<br/>${d.gender === 'M' ? '男' : '女'}`;
            }
            return '';
          }
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            roam: true,
            draggable: true,
            data,
            links,
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: [0, 8],
            force: { repulsion: 300, edgeLength: 100, gravity: 0.1 },
            label: { show: true },
            emphasis: { focus: 'adjacency', lineStyle: { width: 4 } },
          },
        ],
      }}
    />
  );
};

export default AncestorTreeChart;
