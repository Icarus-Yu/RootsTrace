import { Button, Card, Form, Input, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/services';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values: { account: string; password: string }) => {
    try {
      const result = await authApi.login(values);
      setAuth(result.token, result.user);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '登录失败');
    }
  };

  return (
    <div className="rt-auth-page">
      <section className="rt-auth-hero">
        <div className="rt-auth-mark">根</div>
        <h1 className="rt-auth-heading">把家族脉络整理成清晰可查的关系网络</h1>
        <p className="rt-auth-copy">
          管理族谱成员、维护亲缘关系，并用图谱方式追溯祖先、查看后代和亲缘路径。
        </p>
      </section>
      <section className="rt-auth-panel">
      <Card className="rt-auth-card" styles={{ body: { padding: 28 } }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} className="rt-page-title">欢迎回来</Title>
          <Text type="secondary">登录后继续维护你的族谱档案</Text>
        </div>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="account"
            rules={[{ required: true, message: '请输入用户名或邮箱' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名或邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => navigate('/register')}>
              没有账号？去注册
            </Button>
          </div>
        </Form>
      </Card>
      </section>
    </div>
  );
};

export default Login;
