# RootsTrace - 寻根溯源族谱管理系统

「寻根溯源」是一个全栈族谱管理系统，核心功能是对复杂的树形人物关系进行高效建模、存储与可视化查询。

## 🚀 技术栈
- **后端**: Spring Boot 3.2, MyBatis-Plus 3.5, PostgreSQL 16+, JWT, Lombok
- **前端**: React 18, Vite, TypeScript, Ant Design 5, ECharts 5, Zustand
- **数据库**: PostgreSQL (支持递归 CTE 查询)

## 📂 项目结构
```text
RootsTrace/
├── roots-trace-backend/     # Spring Boot 后端
│   ├── src/main/resources/
│   │   ├── db/schema.sql    # 数据库初始化脚本
│   │   └── mapper/          # 核心递归 SQL 逻辑
├── roots-trace-frontend/    # React 前端
│   ├── src/api/             # Axios 实例和接口服务封装
│   ├── src/components/      # Layout 和 ECharts 图表组件
│   └── src/pages/           # 登录、族谱、成员、查询、Dashboard 页面
└── scripts/
    ├── data_generator.py            # 十万级模拟数据生成脚本
    └── performance_compare.sql      # 有/无索引 EXPLAIN 性能对比脚本
```

## ✅ 当前进度
- **第一阶段已完成**: 后端/前端基础工程、数据库 Schema、成员与关系模型、递归 CTE 查询、大数据生成脚本。
- **第二阶段已完成**: 注册登录、JWT 鉴权、族谱 CRUD、协作者邀请、成员 CRUD、关系新增/删除、查询权限收敛、Dashboard 统计接口、统一异常处理。
- **第三阶段已完成基础闭环**: 登录注册页、族谱列表、成员管理、关系管理、查询分析、Dashboard 和 ECharts 可视化组件已接入。
- **第四阶段进行中**: 已补充有/无索引性能对比脚本，仍需整理 ER 图、关系模式、范式分析、截图和数据库导出文件。

## 🛠️ 本地开发环境启动指南

### 第一步：数据库准备 (PostgreSQL)
1. 创建数据库 `genealogy`。
2. 确保 PostgreSQL 已启用 `pgcrypto` 和 `pg_trgm` 扩展（`schema.sql` 中已包含相关指令）。
3. 执行 `roots-trace-backend/src/main/resources/db/schema.sql` 初始化表结构。

### 第二步：后端启动
1. 修改 `roots-trace-backend/src/main/resources/application-dev.yml` 中的数据库用户名和密码。
2. 进入目录并启动：
   ```bash
   cd roots-trace-backend
   mvn spring-boot:run
   ```
   后端将运行在 `http://localhost:8080`。

### 第三步：前端启动
1. 默认通过 Vite proxy 将 `/api` 转发到 `http://localhost:8080`，通常不需要额外配置。
2. 如需直连其他后端地址，可设置 `VITE_API_BASE_URL`。
3. 安装依赖并启动：
   ```bash
   cd roots-trace-frontend
   npm install
   npm run dev
   ```
   前端将运行在 `http://localhost:5173`。

### 第四步：数据 mock (可选)
如果需要测试大数据量的性能（如 10 万条记录、30 代传承）：
```bash
# 确保已安装 python 依赖: pip install psycopg2-binary faker
python scripts/data_generator.py
```

### 第五步：性能对比 (可选)
用于课程报告中“有/无索引 EXPLAIN 对比”的截图材料：
```bash
psql -d genealogy -v family_id=1 -v ancestor_id=1 -v target_depth=3 -f scripts/performance_compare.sql
```

`target_depth=3` 表示从某祖先出发查询到曾孙这一层；如果报告口径要求“向下四层”，可改为 `target_depth=4`。

## 核心功能说明
- **递归查询**: 使用 PostgreSQL 的 `WITH RECURSIVE` 语法实现高效的祖先追溯、子孙查询和亲缘路径查找。
- **安全认证**: 使用 Spring Security + JWT；除注册、登录外，族谱、成员、关系和查询接口均需要登录。
- **族谱协作**: 族谱创建者可以通过用户名或邮箱邀请协作者，协作者可访问该族谱下的成员、关系和查询接口。
- **成员管理**: 支持分页、姓名搜索、新增、详情、更新和删除，并校验年份合法性。
- **关系管理**: 支持父子、母子、父女、母女和配偶关系；父母关系会校验年龄和血缘环路，配偶关系自动维护双向边。
- **Dashboard**: 按族谱统计总人数、性别数量、代际分布、寿命统计和关系类型分布。
- **可视化**:
  - `FamilyTreeChart`: 展示纵向族谱树。
  - `AncestorTreeChart`: 展示指定成员的祖先追溯结果。
  - `KinshipPathChart`: 基于 ECharts Graph 展示两人间的最短亲缘路径。
- **前端基础**: Axios 拦截器已配置，会自动注入 Token 并在 401 时清理登录态。
- **性能验证**: `scripts/performance_compare.sql` 可自动删除/重建关系索引并输出两组 `EXPLAIN ANALYZE`。

## 已实现后端接口
```http
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/families
POST   /api/families
GET    /api/families/{id}
PUT    /api/families/{id}
DELETE /api/families/{id}
POST   /api/families/{id}/collaborators

GET    /api/members/family/{familyId}
GET    /api/members/{id}
POST   /api/members
PUT    /api/members/{id}
DELETE /api/members/{id}

POST   /api/relations
GET    /api/relations/family/{familyId}
DELETE /api/relations/{id}

GET    /api/query/ancestors/{memberId}
GET    /api/query/descendants/{memberId}?depth=10
GET    /api/query/kinship?familyId=1&a=1&b=2

GET    /api/families/{familyId}/dashboard
```

## 后续开发计划
1. **验收材料**: 整理 ER 图、关系模式、3NF/BCNF 分析、核心 SQL、EXPLAIN 对比截图和数据库导出文件。
2. **演示数据**: 生成并截图证明 100,000+ 成员、单族谱 30+ 代、COPY 批量导入结果。
3. **前端优化**: 可选做路由级代码分割，降低 ECharts 打包后的 chunk 体积。
4. **大数据交互优化**: 可选做成员选择器远程搜索和族谱树按节点懒加载。
