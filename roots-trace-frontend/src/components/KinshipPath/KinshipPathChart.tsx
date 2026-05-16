import ReactECharts from 'echarts-for-react';
import { Empty } from 'antd';
import type { Member } from '../../types';

interface Props {
  pathEdges?: string[];
  members: Member[];
}

const KinshipPathChart = ({ pathEdges = [], members }: Props) => {
  if (!pathEdges.length) {
    return <Empty description="暂无路径结果" />;
  }

  const memberMap = new Map(members.map((member) => [member.id, member]));
  const ids = Array.from(
    new Set(pathEdges.flatMap((edge) => edge.split('->').map((value) => Number(value)))),
  ).filter(Boolean);

  return (
    <ReactECharts
      style={{ height: 380 }}
      option={{
        tooltip: {},
        series: [
          {
            type: 'graph',
            layout: 'circular',
            roam: true,
            data: ids.map((id) => {
              const member = memberMap.get(id);
              return {
                id: String(id),
                name: member ? `${member.name}\n#${id}` : `成员 #${id}`,
                symbolSize: 54,
                itemStyle: { color: member?.gender === 'F' ? '#d56b8a' : '#4078c0' },
              };
            }),
            links: pathEdges.map((edge) => {
              const [source, target] = edge.split('->');
              return { source, target };
            }),
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: [4, 10],
            label: { show: true },
            lineStyle: { width: 2, color: '#597ef7' },
          },
        ],
      }}
    />
  );
};

export default KinshipPathChart;
