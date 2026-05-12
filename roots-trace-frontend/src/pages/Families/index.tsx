import { Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Families = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Title level={4}>族谱管理</Title>
      <p>族谱列表在这里显示。</p>
      <Button type="primary" onClick={() => navigate('/families/1/members')}>
        查看测试族谱成员 (ID: 1)
      </Button>
    </div>
  );
};

export default Families;
