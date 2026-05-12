import { Typography } from 'antd';

const { Title } = Typography;

const Queries = () => {
  return (
    <div>
      <Title level={4}>亲缘查询</Title>
      <p>祖先追溯、后代查询和亲缘路径查询将在这里进行，并使用 ECharts 展示图表。</p>
    </div>
  );
};

export default Queries;
