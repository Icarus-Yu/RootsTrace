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
│   ├── .env                 # 环境变量配置
│   └── src/api/axios.ts     # 接口拦截器配置
└── scripts/
    └── data_generator.py    # 十万级模拟数据生成脚本
```

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
1. 确认 `roots-trace-frontend/.env` 中的 `VITE_API_BASE_URL` 指向后端地址。
2. 安装依赖并启动：
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

## 核心功能说明
- **递归查询**: 使用 PostgreSQL 的 `WITH RECURSIVE` 语法实现高效的祖先追溯、子孙查询和亲缘路径查找。
- **可视化**: 
  - `FamilyTreeChart`: 展示纵向族谱树。
  - `KinshipPathChart`: 基于 ECharts Graph 展示两人间的最短亲缘路径。
- **安全性**: 基于 JWT 的无状态认证，前端已配置 Axios 拦截器自动注入 Token。

## 后续开发计划
1. **AuthController**: 实现用户注册与登录接口。
2. **MemberController**: 实现家族成员的增删改查。
3. **RelationController**: 实现成员关系的建立与解除。
4. **QueryController**: 调用 `RelationMapper` 中的递归查询实现可视化数据接口。
