import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Empty, Drawer, Descriptions, Tag } from 'antd';
import type { MemberNode } from '../../types';

interface TreeNode {
  name: string;
  value: number;
  id: number;
  itemStyle: { color: string; borderColor: string; borderWidth: number };
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
      itemStyle: { 
        color: node.gender === 'M' ? '#1f3b4d' : '#4a2531', // 深青 / 赭红
        borderColor: '#d4af37', // 古铜金边框
        borderWidth: 2
      },
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
            backgroundColor: 'rgba(26, 26, 26, 0.9)',
            borderColor: '#d4af37',
            textStyle: { color: '#fdfbf7' },
            formatter: (params: any) => {
              const d = params.data.originalData;
              return `<div style="font-family: 'Noto Serif SC', serif; padding: 4px;">
                <b style="font-size: 16px; color: #d4af37;">${d.name}</b><br/>
                <span style="color: #bbb;">第 ${d.generation} 代 · ${d.gender === 'M' ? '男' : '女'}</span>
              </div>`;
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
              symbol: 'circle',
              symbolSize: 16,
              edgeShape: 'curve',
              roam: true, // Enable Zoom and Pan
              initialTreeDepth: 3,
              label: { 
                position: 'left', 
                verticalAlign: 'middle', 
                align: 'right', 
                backgroundColor: '#fdfbf7', // 宣纸底色
                borderColor: '#c6a87c', // 木牌/碑文边框色
                borderWidth: 1,
                padding: [6, 12],
                borderRadius: 4,
                shadowColor: 'rgba(0,0,0,0.15)',
                shadowBlur: 8,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                formatter: '{name|{b}}',
                rich: {
                  name: {
                    color: '#3e2723', // 深墨色
                    fontSize: 14,
                    fontWeight: 'bold',
                    fontFamily: '"Noto Serif SC", STZhongsong, serif'
                  }
                }
              },
              leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } },
              lineStyle: { color: '#c6a87c', width: 2, curveness: 0.3 }, // 金色自然曲线
              emphasis: { focus: 'descendant', itemStyle: { borderWidth: 4, borderColor: '#fff' } },
              animationDuration: 750,
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
              <Tag color={selectedMember.gender === 'M' ? 'gold' : 'volcano'}>
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
