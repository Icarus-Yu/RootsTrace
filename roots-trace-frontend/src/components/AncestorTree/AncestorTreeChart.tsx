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
    symbolSize: node.depth === 0 ? 55 : 35,
    itemStyle: {
      color: node.gender === 'M' ? '#1f3b4d' : '#4a2531', // 深青/赭红
      shadowBlur: 12,
      shadowColor: 'rgba(212, 175, 55, 0.4)', // 金色光晕
      borderWidth: 2,
      borderColor: '#d4af37' // 古铜金
    },
    label: { 
      show: true,
      position: 'bottom',
      backgroundColor: '#fdfbf7', // 宣纸底色
      borderColor: '#c6a87c',
      borderWidth: 1,
      padding: [4, 8],
      borderRadius: 4,
      shadowColor: 'rgba(0,0,0,0.2)',
      shadowBlur: 6,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      distance: 10,
      formatter: '{name|{b}}',
      rich: {
        name: {
          color: '#3e2723',
          fontSize: 13,
          fontWeight: 'bold',
          fontFamily: '"Noto Serif SC", STZhongsong, serif'
        }
      }
    },
    originalData: node
  }));

  const nodeIds = new Set(nodes.map((node) => node.id));
  const links = nodes.filter((node) => node.parentId && nodeIds.has(node.parentId)).map((node) => ({
    source: String(node.id),
    target: String(node.parentId),
    lineStyle: { width: 2, curveness: 0.3, color: '#c6a87c' } // 金色弯曲主干连线
  }));

  return (
    <ReactECharts
      style={{ height: 500 }}
      option={{
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(26, 26, 26, 0.9)',
          borderColor: '#d4af37',
          textStyle: { color: '#fdfbf7' },
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const d = params.data.originalData;
              return `<div style="font-family: 'Noto Serif SC', serif; padding: 4px;">
                <b style="font-size: 16px; color: #d4af37;">${d.name}</b><br/>
                <span style="color: #bbb;">第 ${d.generation} 代 · ${d.gender === 'M' ? '男' : '女'}</span>
              </div>`;
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
            edgeSymbolSize: [0, 10],
            force: { repulsion: 400, edgeLength: 120, gravity: 0.1 },
            label: { show: true },
            emphasis: { focus: 'adjacency', lineStyle: { width: 4, color: '#d4af37' } },
          },
        ],
      }}
    />
  );
};

export default AncestorTreeChart;
