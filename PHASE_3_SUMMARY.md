# 寻根溯源 (RootsTrace) 项目第三阶段阶段性总结

## 任务目标

第三阶段目标是把第二阶段完成的后端认证、族谱、成员、关系和查询接口接入前端，并补齐 Dashboard 与 ECharts 可视化能力，让系统具备可演示的完整界面闭环。

## 已完成工作

### 1. 后端 Dashboard 与关系查询补齐

- 新增 `DashboardResponse`，返回总人数、男女数量、已故成员数量、平均寿命、代际分布和关系类型分布。
- 实现 `GET /api/families/{id}/dashboard`，并复用当前族谱权限校验。
- 实现 `GET /api/relations/family/{familyId}`，用于前端关系列表和删除操作。
- 将亲缘路径 SQL 调整为双向边展开，避免只能沿父母到子女方向查询导致路径遗漏。

### 2. 前端接口层整理

- 将 Axios 默认地址调整为 `/api`，配合 Vite proxy 避免开发环境跨域问题。
- 新增 `src/api/services.ts`，封装认证、族谱、成员、关系、查询接口。
- 新增 `src/types/index.ts`，集中维护前后端数据类型。

### 3. 认证页面真实接入

- 登录页接入 `POST /api/auth/login`，成功后保存真实 JWT 和用户信息。
- 注册页接入 `POST /api/auth/register`，成功后跳转登录。
- Axios 请求拦截器继续统一附带 `Authorization: Bearer <token>`。

### 4. 族谱与成员管理页面

- 族谱页支持列表、新建、编辑、软删除和添加协作者。
- 成员页支持分页列表、姓名搜索、新增、编辑、删除。
- 成员页新增关系管理 Tab，支持关系列表、新增关系和删除关系。

### 5. Dashboard 与查询可视化

- Dashboard 页面支持选择族谱并展示统计卡片、性别饼图、代际柱状图和关系分布图。
- 查询页支持祖先追溯、后代查询和亲缘路径查询。
- 新增 ECharts 组件：
  - `FamilyTreeChart`
  - `AncestorTreeChart`
  - `KinshipPathChart`

## 当前验证结果

- 后端：`mvn test` 通过。
- 前端：`npm run build` 通过。
- 前端开发服务器：`http://127.0.0.1:5173/` 返回 200。
- 后端开发服务器：`http://127.0.0.1:8080/` 已启动，未带 token 访问 `/api/auth/me` 正常返回 401。

## 剩余事项

- 补充课程验收材料：ER 图、关系模式、3NF/BCNF 分析、EXPLAIN ANALYZE 截图和数据库导出文件。
- 可选优化：前端路由级代码分割，降低 ECharts 打包后的 chunk 体积。
- 可选优化：成员选择器支持远程搜索，适配 10 万级成员数据。
