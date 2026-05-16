import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Empty, Drawer, Descriptions, Tag } from 'antd';
import type { MemberNode } from '../../types';

interface TreeNode {
  name: string;
  value: number;
  id: number;
  itemStyle: { color: string };
  children?: TreeNode[];
  originalData: MemberNode;
}

interface Props {
  nodes: MemberNode[];
}

const toTree = (nodes: MemberNode[]): TreeNode[] => {
  const map = new Map<number, TreeNode>();
  nodes.forEach((node) => {
    map.set(node.id, {
      name: `${node.name}`,
      value: node.id,
      id: node.id,
      itemStyle: { color: node.gender === 'M' ? '#229ed9' : '#d84f8b' },
      children: [],
      originalData: node,
    });
  });

  const roots: TreeNode[] = [];
  nodes.forEach((node) => {
    const treeNode = map.get(node.id);
    if (!treeNode) return;
    if (node.parentId && map.has(node.parentId) && node.parentId !== node.id) {
      map.get(node.parentId)?.children?.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  });

  return roots.map((root) => pruneEmptyChildren(root));
};

const pruneEmptyChildren = (node: TreeNode): TreeNode => {
  if (!node.children?.length) {
    const { children: _children, ...rest } = node;
    return rest as TreeNode;
  }
  return { ...node, children: node.children.map(pruneEmptyChildren) };
};

const FamilyTreeChart = ({ nodes }: Props) => {
  const [selectedMember, setSelectedMember] = useState<MemberNode | null>(null);
  const data = toTree(nodes);

  if (!data.length) {
    return <Empty description="暂无查询结果" />;
  }

  const onChartClick = (params: any) => {
    if (params.data && params.data.originalData) {
      setSelectedMember(params.data.originalData);
    }
  };

  return (
    <>
      <ReactECharts
        style={{ height: 600 }}
        onEvents={{ click: onChartClick }}
        option={{
          tooltip: { 
            trigger: 'item', 
            triggerOn: 'mousemove',
            formatter: (params: any) => {
              const d = params.data.originalData;
              return `${d.name}<br/>第 ${d.generation} 代<br/>${d.gender === 'M' ? '男' : '女'}`;
            }
          },
          series: [
            {
              type: 'tree',
              data,
              top: 40,
              left: 80,
              right: 180,
              bottom: 40,
              symbolSize: 12,
              edgeShape: 'polyline',
              roam: true, // Enable Zoom and Pan
              initialTreeDepth: 2,
              label: { 
                position: 'left', 
                verticalAlign: 'middle', 
                align: 'right', 
                fontSize: 12,
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: [4, 8],
                borderRadius: 4
              },
              leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } },
              lineStyle: { color: '#9bb9cc', width: 1.5, curveness: 0.5 },
              emphasis: { focus: 'descendant', itemStyle: { borderWidth: 4 } },
              animationDuration: 500,
            },
          ],
        }}
      />
      
      <Drawer
        title="成员详情"
        placement="right"
        width={400}
        onClose={() => setSelectedMember(null)}
        open={!!selectedMember}
      >
        {selectedMember && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="姓名"><strong>{selectedMember.name}</strong></Descriptions.Item>
            <Descriptions.Item label="性别">
              <Tag color={selectedMember.gender === 'M' ? 'blue' : 'magenta'}>
                {selectedMember.gender === 'M' ? '男' : '女'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="代际">第 {selectedMember.generation} 代</Descriptions.Item>
            <Descriptions.Item label="出生年份">{selectedMember.birthYear || '未知'}</Descriptions.Item>
            <Descriptions.Item label="逝世年份">{selectedMember.deathYear || '健在'}</Descriptions.Item>
            <Descriptions.Item label="简介">{selectedMember.bio || '暂无简介'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
};

export default FamilyTreeChart;
