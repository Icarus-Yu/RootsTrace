import { RouterProvider } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import router from './router';

// Theme + locale are provided by <ConfigProvider> in main.tsx (设计系统「墨与笺」).
// Here we only mount the AntdApp context (for message / notification / modal) and the router.
function App() {
  return (
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>
  );
}

export default App;
