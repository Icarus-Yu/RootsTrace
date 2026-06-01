# 设计系统接入 · 改动说明

将 RootsTrace 前端从「Telegram 天蓝」配色切换到「墨与笺」设计系统。
所有改动**仅涉以下文件**，组件 JSX 结构几乎没动，路由 / 状态管理 / API 层完全未触。

## 改动的文件

| 文件 | 改动 |
|---|---|
| `index.html` | 引入 Google Fonts（Noto Serif SC + Inter + Noto Sans SC + JetBrains Mono），`lang` 改为 `zh-CN`，`<title>` 改为中文 |
| `src/main.tsx` | 增加 `<ConfigProvider theme={...} locale={zhCN}>`，把全部 AntD 组件的 token（色、字体、圆角、阴影）一次性切到新系统 |
| `src/styles.css` | 整文件重写：新的 CSS 变量、新的 `.rt-*` 样式、AntD 全局微调（`.ant-tag-blue` 等都被映射到新调色板） |
| `src/components/Layout/MainLayout.tsx` | 品牌区结构小调（badge + 文案分两层），副标题文字从 "Genealogy workspace" 改为 "RootsTrace" |
| `src/pages/Login/index.tsx` | 标语换行，新增「根之茂者其实遂…」一句引文 |
| `src/pages/Dashboard/index.tsx` | 三张 ECharts（性别 / 代际 / 关系）配色 + 字体 + tooltip 全换新 |
| `src/pages/Families/index.tsx` | 首列 Avatar 颜色用 CSS 变量 |
| `src/components/FamilyTree/FamilyTreeChart.tsx` | ECharts 节点 / 连线配色换新 |
| `src/components/AncestorTree/AncestorTreeChart.tsx` | 同上 |
| `src/components/KinshipPath/KinshipPathChart.tsx` | 同上 |

## 颜色对照

| 旧 | 新 | 用途 |
|---|---|---|
| `#229ed9` 天蓝 | `#2c4a52` 黛 | 主色（CTA / 链接 / 选中态） |
| `#229ed9`（性别·男） | `#4a6772` 黛灰 | 男性 |
| `#d84f8b` 桃红（性别·女） | `#8e5a6b` 黯紫 | 女性 |
| `#9bb9cc` 浅蓝（连线） | `#b3c1c5` 黛-200 | 树图连线 |
| `#f4f8fb` 冷灰底 | `#faf8f3` 米白 | 页面底色 |
| `#dbe8f2` 蓝灰边 | `#ece8de` 暖米 | 描边 |

## 不需要装新依赖
`antd/locale/zh_CN` 是 antd 5 自带的，`package.json` 不需要改。

## 启动
```bash
cd roots-trace-frontend
npm install
npm run dev
```

字体走 Google Fonts CDN，国内可能略慢；如要本地化：把 .ttf / .woff2 放到 `public/fonts/`，在 `src/styles.css` 顶部加 `@font-face` 即可，无需改 token。

## 仍待你确认
- 字体（Google Fonts 是替代品，如有授权字库请替换）
- 品牌图标「根」目前是字符占位，如有正式印章 / Logo 请放入 `public/`
