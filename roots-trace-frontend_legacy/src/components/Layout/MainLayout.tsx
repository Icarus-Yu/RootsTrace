import { Layout, Menu, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Header, Content, Sider } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/families',
      icon: <TeamOutlined />,
      label: '族谱管理',
    },
    {
      key: '/queries',
      icon: <SearchOutlined />,
      label: '亲缘查询',
    },
  ];

  // Map sub-routes like /families/1/members to the parent menu key
  const getSelectedKeys = () => {
    if (location.pathname.startsWith('/families')) {
      return ['/families'];
    }
    return [location.pathname];
  };

  return (
    <Layout className="rt-app-shell">
      <Sider width={236} className="rt-sider">
        <div className="rt-brand">
          <div className="rt-brand-badge">根</div>
          <div className="rt-brand-title">寻根溯源</div>
          <div className="rt-brand-subtitle">Genealogy workspace</div>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          className="rt-topbar"
        >
          <div className="rt-topbar-brand">寻根溯源</div>
          <div className="rt-user-pill">
            <span className="rt-avatar-chip"><UserOutlined /></span>
            <span>{user?.username || '用户'}</span>
          </div>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content className="rt-content">
          <div className="rt-page-surface">
            <Outlet />
          </div>
        </Content>
        <nav className="rt-bottom-nav" aria-label="移动端主导航">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`rt-mobile-tab ${getSelectedKeys().includes(item.key) ? 'rt-mobile-tab-active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
