# 寻根溯源族谱管理系统开发计划

> 来源：由 `genealogy_dev_doc.docx` 转写整理，并结合当前仓库实现状态补充开发细节。

## 1. 项目概述

「寻根溯源」是一个面向族谱资料管理、亲缘关系检索和树形可视化的 Web 系统。系统核心目标是把层级不确定、规模可能很大的家族成员关系建模为可查询的有向图，并通过 PostgreSQL 递归 CTE、Spring Boot REST API 和 React + ECharts 前端完成增删改查、追溯、展示和实验验收。

当前仓库采用前后端分离结构：

```text
RootsTrace/
├── roots-trace-backend/      # Spring Boot 后端
├── roots-trace-frontend/     # React + Vite 前端
├── scripts/                  # 数据生成和辅助脚本
├── genealogy_dev_doc.docx    # 原始开发文档
├── README.md
└── PHASE_1_SUMMARY.md
```

## 2. 技术选型

| 层次 | 技术 | 当前/计划版本 | 选型理由 |
| --- | --- | --- | --- |
| 数据库 | PostgreSQL | 16+ | 原生支持 `WITH RECURSIVE`，适合祖先、后代、路径类查询 |
| 后端框架 | Spring Boot | 3.2.x | 生态成熟，适合快速搭建 REST API |
| ORM | MyBatis-Plus | 3.5.x | 常规 CRUD 简洁，复杂递归 SQL 可落在 XML Mapper |
| 后端语言 | Java | 17 LTS | 与 Spring Boot 3 兼容，长期支持 |
| 安全认证 | Spring Security + JWT | 规划中 | 前后端分离下使用无状态 token，便于扩展 |
| 前端框架 | React | 18 | 组件化组织页面和图表 |
| 前端工具链 | Vite + TypeScript | Vite 5 / TS 5 | 开发启动快，类型约束更清晰 |
| UI 组件库 | Ant Design | 5.x | 表单、表格、布局能力完整 |
| 图表库 | ECharts | 5.x | 支持 Tree、Graph 等关系可视化 |
| 状态管理 | Zustand | 4.x | 轻量，适合认证状态和少量全局状态 |

## 3. 功能模块

| 模块 | 功能范围 | 补充说明 |
| --- | --- | --- |
| 用户管理 | 注册、登录、JWT 鉴权、当前用户信息 | 密码使用 BCrypt 哈希；登录后前端持久化 token |
| 族谱管理 | 创建族谱、族谱列表、详情、协作者 | `families.owner_id` 标识创建者，`family_collaborators` 管理协作 |
| 成员管理 | 新增、编辑、删除、分页、模糊搜索 | 姓名搜索使用 `pg_trgm` GIN 索引；列表接口需要分页参数 |
| 关系管理 | 父子、父女、母子、母女、配偶关系 | 血缘关系有方向，配偶关系建议双向存储或在查询层统一处理 |
| 祖先追溯 | 给定成员向上查询所有祖先 | 使用递归 CTE，限制最大深度避免异常环路 |
| 后代查询 | 给定成员向下查询直系后代 | 支持 `depth` 参数，默认 10 代 |
| 亲缘路径 | 两名成员间最短亲缘路径 | 当前已有 SQL 雏形，后续需补足双向边和路径节点还原 |
| 树形可视化 | 族谱树、祖先树、亲缘路径图 | ECharts Tree 展示纵向族谱，Graph 展示成员路径 |
| Dashboard | 总人数、性别比例、代际分布、寿命统计 | 作为数据库实验统计分析和前端图表展示入口 |
| 审计日志 | 记录核心增删改操作 | 可先实现数据库表，再逐步补充切面或服务层记录 |

## 4. 当前实现状态

### 4.1 已完成

- 后端基础项目已存在：`roots-trace-backend`。
- 前端基础项目已存在：`roots-trace-frontend`。
- 数据库 DDL 已落在 `roots-trace-backend/src/main/resources/db/schema.sql`。
- 已实现实体：`Member`、`Relation`。
- 已实现 Mapper：`MemberMapper`、`RelationMapper`。
- 已实现通用响应：`Result<T>`。
- 已实现基础接口：
  - `GET /api/members/family/{familyId}`
  - `POST /api/members`
  - `GET /api/query/ancestors/{memberId}`
  - `GET /api/query/descendants/{memberId}?depth=10`
  - `GET /api/query/kinship?familyId=1&a=1&b=2`
- 已实现递归 SQL：
  - 祖先追溯
  - 后代查询
  - 亲缘路径查询雏形
- 前端已配置：
  - Axios 实例
  - Zustand 认证状态存储
  - 目录骨架和页面占位目录
- 已有第一阶段总结：`PHASE_1_SUMMARY.md`。

### 4.2 待补齐

- 用户、族谱、协作者相关实体、Mapper、Service、Controller。
- Auth 注册登录、JWT 过滤器、当前用户上下文。
- 成员管理完整 CRUD、分页、按姓名模糊搜索。
- 关系管理接口，包含关系合法性校验和防环校验。
- Dashboard 统计接口。
- 前端页面实现：登录、注册、族谱列表、成员管理、查询页、Dashboard。
- ECharts 组件实现：族谱树、祖先树、亲缘路径图。
- 后端集成测试和前端构建验证。

## 5. 数据库设计

### 5.1 核心模型

系统把族谱关系建模为「节点 + 边」：

- `members`：家族成员节点。
- `relations`：成员关系边。
- 血缘边从父母指向子女，例如 `from_member_id -> to_member_id`。
- 配偶边无天然方向，建议统一采用双向记录，或者单条记录配合查询 SQL 做双向展开。

### 5.2 表结构

| 表名 | 说明 | 关键字段 |
| --- | --- | --- |
| `users` | 系统用户 | `username`、`email`、`password` |
| `families` | 族谱 | `name`、`surname`、`owner_id`、`deleted_at` |
| `family_collaborators` | 协作者 | 复合主键 `(family_id, user_id)` |
| `members` | 成员 | `family_id`、`name`、`gender`、`birth_year`、`death_year`、`generation` |
| `relations` | 关系 | `family_id`、`from_member_id`、`to_member_id`、`relation_type` |
| `audit_log` | 审计日志 | `table_name`、`operation`、`record_id`、`operator_id` |

### 5.3 约束与索引

- `members.gender` 约束为 `M` 或 `F`。
- `members.death_year >= birth_year`。
- `relations.relation_type` 使用枚举类型：
  - `PARENT_SON`
  - `PARENT_DAUGHTER`
  - `MOTHER_SON`
  - `MOTHER_DAUGHTER`
  - `SPOUSE`
- `relations` 使用唯一约束避免重复关系：
  - `(family_id, from_member_id, to_member_id, relation_type)`
- `idx_members_name_trgm`：姓名模糊搜索索引。
- `idx_relations_from`：按父节点/起点查子节点。
- `idx_relations_to`：按子节点/终点反查父节点。
- `idx_members_family_generation`：按族谱和代际统计。

### 5.4 需要修正的细节

当前 `schema.sql` 中部分中文注释出现编码异常，建议后续统一保存为 UTF-8。实际表结构可用，但文档、报告和课堂验收材料中应使用正常中文注释，避免影响可读性。

## 6. 后端开发计划

### 6.1 分层结构

后端建议维持以下分层：

```text
com.genealogy
├── config       # Security、MyBatis-Plus、跨域等配置
├── controller   # REST API
├── service      # 业务逻辑、事务、权限校验
├── mapper       # MyBatis-Plus Mapper
├── entity       # 数据库实体
├── dto
│   ├── request  # 入参 DTO
│   └── response # 出参 VO
├── common       # Result、分页结果、异常处理
└── util         # JWT、密码、树转换等工具
```

### 6.2 API 清单

| 方法 | 路径 | 说明 | 优先级 |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | 用户注册 | P0 |
| `POST` | `/api/auth/login` | 用户登录并返回 JWT | P0 |
| `GET` | `/api/auth/me` | 获取当前用户 | P1 |
| `GET` | `/api/families` | 当前用户可见族谱列表 | P0 |
| `POST` | `/api/families` | 创建族谱 | P0 |
| `GET` | `/api/families/{id}` | 族谱详情 | P1 |
| `PUT` | `/api/families/{id}` | 更新族谱信息 | P1 |
| `DELETE` | `/api/families/{id}` | 软删除族谱 | P1 |
| `POST` | `/api/families/{id}/collaborators` | 邀请协作者 | P2 |
| `GET` | `/api/members/family/{familyId}` | 成员列表 | 已有雏形 |
| `POST` | `/api/members` | 新增成员 | 已有雏形 |
| `PUT` | `/api/members/{id}` | 更新成员 | P0 |
| `DELETE` | `/api/members/{id}` | 删除成员 | P0 |
| `POST` | `/api/relations` | 新增关系 | P0 |
| `DELETE` | `/api/relations/{id}` | 删除关系 | P1 |
| `GET` | `/api/query/ancestors/{memberId}` | 祖先追溯 | 已有 |
| `GET` | `/api/query/descendants/{memberId}` | 后代查询 | 已有 |
| `GET` | `/api/query/kinship` | 亲缘路径 | 已有雏形 |
| `GET` | `/api/families/{id}/dashboard` | 统计面板 | P1 |

### 6.3 DTO 建议

注册请求：

```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

登录响应：

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "zhangsan"
  }
}
```

成员创建请求：

```json
{
  "familyId": 1,
  "name": "张三",
  "gender": "M",
  "birthYear": 1950,
  "deathYear": null,
  "bio": "人物简介",
  "generation": 12
}
```

关系创建请求：

```json
{
  "familyId": 1,
  "fromMemberId": 10,
  "toMemberId": 20,
  "relationType": "PARENT_SON"
}
```

### 6.4 业务规则

- 同一族谱内成员姓名可重复，但成员列表需要展示出生年、代际、性别辅助区分。
- 新增血缘关系时，`from_member_id` 与 `to_member_id` 必须属于同一族谱。
- 新增父母关系时，父母出生年必须早于子女出生年。
- 新增父母关系前需要检测是否造成环路。
- 同一名子女最多可有一个父亲关系和一个母亲关系，是否强制由业务需求决定。
- 删除成员时由外键级联删除相关关系；前端需要二次确认。
- 查询接口需要限制最大递归深度，避免脏数据造成无界查询。

### 6.5 核心 SQL

祖先追溯：

```sql
WITH RECURSIVE ancestors AS (
    SELECT m.id, m.name, m.gender, m.birth_year, m.death_year, m.generation,
           CAST(NULL AS BIGINT) AS parent_id, 0 AS depth
    FROM members m
    WHERE m.id = :memberId
    UNION ALL
    SELECT m.id, m.name, m.gender, m.birth_year, m.death_year, m.generation,
           r.from_member_id AS parent_id, a.depth + 1
    FROM members m
    JOIN relations r ON r.from_member_id = m.id
    JOIN ancestors a ON a.id = r.to_member_id
    WHERE r.relation_type IN ('PARENT_SON', 'PARENT_DAUGHTER', 'MOTHER_SON', 'MOTHER_DAUGHTER')
      AND a.depth < 100
)
SELECT DISTINCT *
FROM ancestors
ORDER BY depth;
```

后代查询：

```sql
WITH RECURSIVE descendants AS (
    SELECT m.id, m.name, m.gender, m.birth_year, m.death_year, m.generation,
           CAST(NULL AS BIGINT) AS parent_id, 0 AS depth
    FROM members m
    WHERE m.id = :memberId
    UNION ALL
    SELECT m.id, m.name, m.gender, m.birth_year, m.death_year, m.generation,
           r.from_member_id AS parent_id, d.depth + 1
    FROM members m
    JOIN relations r ON r.to_member_id = m.id
    JOIN descendants d ON d.id = r.from_member_id
    WHERE r.relation_type IN ('PARENT_SON', 'PARENT_DAUGHTER', 'MOTHER_SON', 'MOTHER_DAUGHTER')
      AND d.depth < :maxDepth
)
SELECT *
FROM descendants
ORDER BY depth, id;
```

实验验收 SQL 还应包含：

- 给定成员的配偶及所有子女。
- 平均寿命最长的一代。
- 年龄超过 50 岁且无配偶的男性成员。
- 出生年早于本代平均出生年的成员。
- 四代曾孙递归统计。

## 7. 前端开发计划

### 7.1 页面结构

| 页面 | 路由 | 功能 |
| --- | --- | --- |
| 登录 | `/login` | 账号密码登录，保存 token |
| 注册 | `/register` | 创建账号 |
| Dashboard | `/dashboard` | 总人数、性别比例、代际分布、寿命统计 |
| 族谱列表 | `/families` | 展示当前用户可见族谱，创建族谱 |
| 成员管理 | `/families/:id/members` | 成员列表、搜索、新增、编辑、删除 |
| 查询分析 | `/queries` | 祖先、后代、亲缘路径查询 |

### 7.2 组件计划

| 组件 | 位置 | 说明 |
| --- | --- | --- |
| `FamilyTreeChart` | `src/components/FamilyTree/` | 使用 ECharts Tree 展示族谱分支 |
| `AncestorTreeChart` | `src/components/AncestorTree/` | 展示指定成员的祖先追溯结果 |
| `KinshipPathChart` | `src/components/KinshipPath/` | 使用 ECharts Graph 展示两人路径 |
| `MemberForm` | `src/pages/Members/` | 新增和编辑成员共用表单 |
| `RelationForm` | `src/pages/Members/` 或 `src/pages/Queries/` | 创建成员关系 |
| `PrivateRoute` | `src/router/` | 未登录跳转到 `/login` |

### 7.3 前端状态

- `authStore`：保存 `token` 和当前用户。
- 页面内状态：族谱列表、成员分页、查询结果使用组件局部状态即可。
- 后续如需跨页面共享当前族谱，可新增 `familyStore`。

### 7.4 可视化细节

- 族谱树默认展开 3 代，避免大数据一次性渲染卡顿。
- 大族谱查询需要后端支持按节点懒加载子孙。
- 男性和女性节点使用不同颜色或图形，但图例应保持简洁。
- 亲缘路径图只展示最短路径相关节点，不直接渲染整个族谱。
- 查询结果为空时展示空状态，不显示空白图表。

## 8. 数据生成与性能验证

### 8.1 数据规模目标

- 至少 10 个族谱。
- 系统总成员数不少于 100,000。
- 至少 1 个族谱不少于 50,000 名成员。
- 至少 1 个族谱包含 30 代以上传承。
- 关系数据应覆盖父子、父女、母子、母女和配偶。

### 8.2 生成脚本要求

`scripts/data_generator.py` 应支持：

- 数据库连接参数可配置。
- 自动创建测试用户和测试族谱。
- 使用 `COPY` 批量导入成员和关系。
- 保证成员 `family_id`、`generation`、出生年逻辑一致。
- 输出每个族谱生成的成员数、关系数、代数。

### 8.3 性能验证

姓名模糊搜索：

```sql
EXPLAIN ANALYZE
SELECT *
FROM members
WHERE family_id = 1
  AND name LIKE '%志%';
```

递归四代查询：

```sql
EXPLAIN ANALYZE
WITH RECURSIVE d AS (
    SELECT id, 0 AS depth
    FROM members
    WHERE id = 1
    UNION ALL
    SELECT m.id, d.depth + 1
    FROM members m
    JOIN relations r ON r.to_member_id = m.id
    JOIN d ON d.id = r.from_member_id
    WHERE d.depth < 4
)
SELECT COUNT(*)
FROM d
WHERE depth = 4;
```

验收材料中建议保留有索引和无索引两组 `EXPLAIN ANALYZE` 截图，说明 `pg_trgm` 和关系索引对查询性能的影响。

## 9. 阶段计划

### 第一阶段：基础框架与递归查询

状态：基本完成。

- 搭建后端 Spring Boot 项目。
- 搭建前端 React + Vite 项目。
- 完成数据库 Schema。
- 完成成员和关系基础实体。
- 打通祖先、后代、亲缘路径基础查询。
- 编写大数据生成脚本。

### 第二阶段：认证与核心管理功能

目标：完成可登录、可建族谱、可管理成员的闭环。

- 新增 `User`、`Family`、`FamilyCollaborator` 实体和 Mapper。
- 实现注册、登录、JWT 鉴权。
- 实现族谱 CRUD。
- 完善成员 CRUD、分页和搜索。
- 实现关系新增和删除。
- 补充统一异常处理和参数校验。

### 第三阶段：前端页面与可视化

目标：让系统具备可演示的完整界面。

- 实现登录、注册页面。
- 实现 Dashboard 页面。
- 实现族谱列表和成员管理页面。
- 实现祖先查询、后代查询、亲缘路径查询页面。
- 接入 ECharts Tree 和 Graph。
- 完成空状态、加载态、错误提示。

### 第四阶段：性能、测试与报告材料

目标：完成数据库课程验收所需证据。

- 生成 100,000+ 条模拟成员数据。
- 执行核心 SQL 和递归查询截图。
- 执行索引性能对比截图。
- 导出数据库 `.sql` 文件。
- 补充 ER 图、关系模式、3NF/BCNF 分析。
- 编写个人贡献和实验总结。

## 10. 启动与验证

### 10.1 数据库

```bash
createdb genealogy
psql -d genealogy -f roots-trace-backend/src/main/resources/db/schema.sql
```

### 10.2 后端

```bash
cd roots-trace-backend
mvn spring-boot:run
```

默认地址：

```text
http://localhost:8080
```

### 10.3 前端

```bash
cd roots-trace-frontend
npm install
npm run dev
```

默认地址：

```text
http://localhost:5173
```

### 10.4 导出

```bash
pg_dump -U postgres genealogy > genealogy_backup.sql
```

## 11. 验收 Checklist

| 验收项目 | 状态 | 说明 |
| --- | --- | --- |
| ER 图绘制 | 未完成 | 需要标注实体、属性、联系类型和基数 |
| 关系模式转换 | 未完成 | 需要说明主键、外键、函数依赖 |
| 3NF/BCNF 分析 | 未完成 | 重点分析 `users`、`families`、`members`、`relations` |
| DDL 文件 | 部分完成 | 已有主外键、CHECK、触发器，需修复中文注释编码 |
| 100,000+ 测试数据 | 部分完成 | 以实际数据库导入结果为准 |
| 单族谱 30+ 代 | 部分完成 | 需要截图或 SQL 证明 |
| COPY 批量导入导出 | 未完成 | 需要控制台或数据库截图 |
| 5 条核心 SQL | 部分完成 | 文档已有，需落到可执行脚本或报告 |
| 递归 CTE 祖先查询 | 已完成基础版 | 需要演示截图 |
| 索引 EXPLAIN 对比 | 未完成 | 需要有无索引两组结果 |
| 图形化界面 | 未完成 | 前端页面仍需实现 |
| 族谱树可视化 | 未完成 | ECharts Tree 组件待实现 |
| 亲缘路径可视化 | 未完成 | ECharts Graph 组件待实现 |
| Dashboard 统计 | 未完成 | 后端接口和前端图表待实现 |
| 实验报告个人贡献 | 未完成 | 课程提交前补齐 |
| 数据库导出文件 | 未完成 | 课程提交前导出 `.sql` |

## 12. 风险与处理方案

| 风险 | 影响 | 处理方案 |
| --- | --- | --- |
| 递归关系出现环 | 查询无限递归或结果异常 | SQL 限制深度，业务新增关系前检测环路 |
| 大族谱图表卡顿 | 前端不可用 | 默认只加载局部树，支持按节点展开 |
| 配偶关系方向不统一 | 查询遗漏路径 | 统一双向存储，或在 SQL 中把配偶边展开为双向 |
| `schema.sql` 注释乱码 | 报告可读性下降 | 统一 UTF-8 重写注释 |
| JWT 只生成未校验 | 接口安全无效 | 增加过滤器和 Spring Security 上下文 |
| Mapper SQL 与 VO 字段不匹配 | 返回字段为空 | 保持 SQL 别名与 Java 驼峰字段一致 |
| 自动初始化覆盖数据 | 大数据被清空或重复 | 开发环境手动执行 schema，生产禁用自动初始化 |

## 13. 下一步建议

优先完成第二阶段的后端闭环：认证、族谱、成员、关系。完成后再做前端页面接入和图表，否则界面容易因为接口契约变化反复调整。
