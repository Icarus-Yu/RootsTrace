import { useMemo, useState } from 'react';
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
  /** Parent-linked nodes (founder first), as returned by /query/family-tree. */
  nodes: MemberNode[];
  rootId?: number;
  height?: number;
}

const MALE = '#4a6772';
const FEMALE = '#8e5a6b';

const buildForest = (nodes: MemberNode[], rootId?: number): TreeNode[] => {
  const map = new Map<number, TreeNode>();
  nodes.forEach((node) => {
    map.set(node.id, {
      name: node.name,
      value: node.id,
      id: node.id,
      itemStyle: { color: node.gender === 'M' ? MALE : FEMALE },
      children: [],
      originalData: node,
    });
  });

  const roots: TreeNode[] = [];
  nodes.forEach((node) => {
    const treeNode = map.get(node.id);
    if (!treeNode) return;
    const hasParent = node.parentId && map.has(node.parentId) && node.parentId !== node.id;
    if (hasParent) {
      map.get(node.parentId!)?.children?.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  });

  // Prefer the explicit root when provided; fall back to whatever has no parent.
  const preferred = rootId !== undefined ? roots.filter((r) => r.id === rootId) : [];
  const ordered = preferred.length ? [...preferred, ...roots.filter((r) => r.id !== rootId)] : roots;
  return ordered.map(stripEmptyChildren);
};

const stripEmptyChildren = (node: TreeNode): TreeNode => {
  if (!node.children?.length) {
    const { children: _children, ...rest } = node;
    return rest as TreeNode;
  }
  return { ...node, children: node.children.map(stripEmptyChildren) };
};

const FullFamilyTreeChart = ({ nodes, rootId, height = 640 }: Props) => {
  const [selected, setSelected] = useState<MemberNode | null>(null);
  const data = useMemo(() => buildForest(nodes, rootId), [nodes, rootId]);

  if (!data.length) {
    return <Empty description="暂无族谱数据" />;
  }

  return (
    <>
      <ReactECharts
        style={{ height }}
        notMerge
        onEvents={{
          click: (params: any) => {
            if (params?.data?.originalData) setSelected(params.data.originalData);
          },
        }}
        option={{
          tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove',
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderColor: '#ece8de',
            borderWidth: 1,
            textStyle: { color: '#18181a', fontSize: 12 },
            extraCssText: 'box-shadow: 0 8px 24px rgba(24,24,26,0.08); border-radius: 8px;',
            formatter: (params: any) => {
              const d: MemberNode = params.data.originalData;
              const life = `${d.birthYear ?? '?'} – ${d.deathYear ?? '健在'}`;
              return `${d.name}<br/>第 ${d.generation} 代 · ${d.gender === 'M' ? '男' : '女'}<br/>${life}`;
            },
          },
          series: [
            {
              type: 'tree',
              data,
              top: 28,
              left: 32,
              right: 32,
              bottom: 28,
              orient: 'TB', // top-down — reads like a real genealogy chart
              symbol: 'circle',
              symbolSize: 11,
              roam: true, // zoom + pan for large trees
              initialTreeDepth: -1, // expand the whole tree
              expandAndCollapse: false,
              label: {
                position: 'top',
                rotate: 90,
                align: 'left',
                verticalAlign: 'middle',
                fontSize: 11,
                color: '#3a3a3d',
                distance: 6,
              },
              leaves: {
                label: { position: 'bottom', rotate: 90, align: 'right', verticalAlign: 'middle' },
              },
              lineStyle: { color: '#b3c1c5', width: 1.2, curveness: 0 },
              emphasis: { focus: 'descendant', itemStyle: { borderColor: '#2c4a52', borderWidth: 3 } },
              animationDuration: 400,
            },
          ],
        }}
      />

      <Drawer
        title="成员详情"
        placement="right"
        width={400}
        onClose={() => setSelected(null)}
        open={!!selected}
      >
        {selected && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="姓名"><strong>{selected.name}</strong></Descriptions.Item>
            <Descriptions.Item label="性别">
              <Tag color={selected.gender === 'M' ? 'blue' : 'magenta'}>
                {selected.gender === 'M' ? '男' : '女'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="代际">第 {selected.generation} 代</Descriptions.Item>
            <Descriptions.Item label="出生年份">{selected.birthYear || '未知'}</Descriptions.Item>
            <Descriptions.Item label="逝世年份">{selected.deathYear || '健在'}</Descriptions.Item>
            <Descriptions.Item label="简介">{selected.bio || '暂无简介'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
};

export default FullFamilyTreeChart;
