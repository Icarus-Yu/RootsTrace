import { Typography } from 'antd';

const { Title } = Typography;

const Dashboard = () => {
  return (
    <div>
      <Title level={4}>仪表盘</Title>
      <p>系统总体统计信息将在这里显示（总人数、代际分布等）。</p>
    </div>
  );
};

export default Dashboard;
