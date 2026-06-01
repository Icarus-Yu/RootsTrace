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
      color: node.gender === 'M' ? '#4a6772' : '#8e5a6b',
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.15)',
      borderWidth: 2,
      borderColor: '#fff'
    },
    label: { 
      show: true,
      position: 'bottom',
      fontSize: 11,
      color: '#3a3a3d',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      padding: [2, 4],
      borderRadius: 2
    },
    originalData: node
  }));

  const nodeIds = new Set(nodes.map((node) => node.id));
  const links = nodes.filter((node) => node.parentId && nodeIds.has(node.parentId)).map((node) => ({
    source: String(node.id),
    target: String(node.parentId),
    lineStyle: { width: 1.5, curveness: 0.1, color: '#b3c1c5' }
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
