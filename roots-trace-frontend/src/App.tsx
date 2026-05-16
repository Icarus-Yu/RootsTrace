import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './router';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#229ed9',
          borderRadius: 14,
          colorBgLayout: '#f4f8fb',
          colorText: '#17212b',
          colorTextSecondary: '#7d8b99',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Button: {
            borderRadius: 999,
            controlHeight: 38,
          },
          Card: {
            borderRadiusLG: 22,
          },
          Input: {
            borderRadius: 14,
          },
          Select: {
            borderRadius: 14,
          },
          Modal: {
            borderRadiusLG: 22,
          },
        },
      }}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
