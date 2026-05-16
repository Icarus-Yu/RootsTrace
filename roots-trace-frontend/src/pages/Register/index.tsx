import { Button, Card, Form, Input, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/services';

const { Title, Text } = Typography;

const Register = () => {
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; email: string; password: string }) => {
    try {
      await authApi.register(values);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '注册失败');
    }
  };

  return (
    <div className="rt-auth-page">
      <section className="rt-auth-hero">
        <div className="rt-auth-mark">谱</div>
        <h1 className="rt-auth-heading">从第一份族谱开始，建立可协作的家族档案</h1>
        <p className="rt-auth-copy">
          创建账号后可以新建族谱、邀请协作者，并逐步完善成员和关系数据。
        </p>
      </section>
      <section className="rt-auth-panel">
      <Card className="rt-auth-card" styles={{ body: { padding: 28 } }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} className="rt-page-title">注册新账号</Title>
          <Text type="secondary">开启你的族谱管理空间</Text>
        </div>
        <Form name="register" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => navigate('/login')}>
              已有账号？去登录
            </Button>
          </div>
        </Form>
      </Card>
      </section>
    </div>
  );
};

export default Register;
