import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import 'antd/dist/reset.css';
import './styles.css';

/**
 * RootsTrace · Design System theme
 * 「墨与笺」— ink on rice paper.
 * Tokens mirror src/styles.css custom properties; centralized here so all
 * Ant Design components (Button, Table, Modal, Select, …) pick up the system.
 */
const rtTheme = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    // Primary accent — 黛 Dài (slate ink-teal)
    colorPrimary: '#2c4a52',
    colorInfo: '#2c4a52',
    colorSuccess: '#5a6b3d',   // 苔 Tái
    colorWarning: '#a78a4e',   // 金 Jīn
    colorError: '#a8412a',     // 朱 Zhū

    // Neutrals — warm rice-paper
    colorBgBase: '#faf8f3',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#faf8f3',
    colorBgElevated: '#ffffff',
    colorTextBase: '#18181a',
    colorText: '#18181a',
    colorTextSecondary: '#3a3a3d',
    colorTextTertiary: '#6e6e73',
    colorTextQuaternary: '#a1a1a6',
    colorBorder: '#d8d2c2',
    colorBorderSecondary: '#ece8de',
    colorFillSecondary: '#f3efe6',
    colorFillTertiary: '#faf8f3',

    // Type
    fontFamily:
      '"Inter", "Noto Sans SC", "PingFang SC", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    fontSize: 14,

    // Geometry
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // Motion / shadows — soft, Apple-restrained
    boxShadow:
      '0 2px 8px rgba(24,24,26,0.04), 0 1px 2px rgba(24,24,26,0.03)',
    boxShadowSecondary:
      '0 8px 24px rgba(24,24,26,0.06), 0 2px 6px rgba(24,24,26,0.04)',
    wireframe: false,
  },
  components: {
    Button: {
      controlHeight: 38,
      controlHeightLG: 44,
      primaryShadow: '0 6px 20px rgba(44,74,82,0.18)',
      fontWeight: 500,
    },
    Input: {
      controlHeight: 38,
      activeShadow: '0 0 0 3px rgba(44,74,82,0.12)',
    },
    Select: {
      controlHeight: 38,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 22,
    },
    Table: {
      headerBg: '#f3efe6',
      headerColor: '#6e6e73',
      headerSplitColor: '#ece8de',
      borderColor: '#ece8de',
      rowHoverBg: '#faf8f3',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#eef2f3',
      itemSelectedColor: '#1b3036',
      itemHoverBg: '#f3efe6',
      itemBorderRadius: 8,
      itemHeight: 42,
      fontSize: 14,
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Tabs: {
      itemSelectedColor: '#18181a',
      itemHoverColor: '#18181a',
      inkBarColor: '#2c4a52',
    },
    Statistic: {
      titleFontSize: 12,
      contentFontSize: 32,
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={rtTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
