import { Typography } from 'antd';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

const Members = () => {
  const { id } = useParams();

  return (
    <div>
      <Title level={4}>成员管理 - 族谱 {id}</Title>
      <p>此族谱的成员列表、搜索、新增和编辑在这里进行。</p>
    </div>
  );
};

export default Members;
