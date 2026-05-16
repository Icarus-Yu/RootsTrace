import ReactECharts from 'echarts-for-react';
import { Empty } from 'antd';
import type { MemberNode } from '../../types';

interface TreeNode {
  name: string;
  value: number;
  itemStyle: { color: string };
  children?: TreeNode[];
}

interface Props {
  nodes: MemberNode[];
}

const toTree = (nodes: MemberNode[]): TreeNode[] => {
  const map = new Map<number, TreeNode>();
  nodes.forEach((node) => {
    map.set(node.id, {
      name: `${node.name}\n第 ${node.generation ?? '-'} 代`,
      value: node.id,
      itemStyle: { color: node.gender === 'M' ? '#4078c0' : '#d56b8a' },
      children: [],
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
    return rest;
  }
  return { ...node, children: node.children.map(pruneEmptyChildren) };
};

const FamilyTreeChart = ({ nodes }: Props) => {
  const data = toTree(nodes);
  if (!data.length) {
    return <Empty description="暂无查询结果" />;
  }

  return (
    <ReactECharts
      style={{ height: 480 }}
      option={{
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [
          {
            type: 'tree',
            data,
            top: 24,
            left: 40,
            right: 160,
            bottom: 24,
            symbolSize: 14,
            orient: 'LR',
            expandAndCollapse: true,
            initialTreeDepth: 3,
            label: { position: 'left', verticalAlign: 'middle', align: 'right', fontSize: 12 },
            leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } },
            lineStyle: { color: '#8c8c8c' },
            animationDuration: 300,
            animationDurationUpdate: 400,
          },
        ],
      }}
    />
  );
};

export default FamilyTreeChart;
