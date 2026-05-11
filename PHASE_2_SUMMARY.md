# 寻根溯源 (RootsTrace) 项目第二阶段阶段性总结

## 📝 任务目标
在第一阶段完成基础框架、数据库设计和递归查询接口后，第二阶段开始补齐系统的认证和核心管理能力。本阶段目标是完成用户注册登录、JWT 登录态识别、族谱管理、成员管理和关系管理的后端闭环，为后续 Dashboard、查询权限收敛和前端页面接入打基础。

## 🏗️ 已完成工作

### 1. 用户与认证基础能力
- **用户实体映射**: 新增 `User` 实体和 `UserMapper`，对接数据库中已有的 `users` 表。
- **注册接口**: 实现 `POST /api/auth/register`，支持用户名、邮箱、密码注册，并校验用户名和邮箱重复。
- **登录接口**: 实现 `POST /api/auth/login`，支持用户名或邮箱登录。
- **密码安全**: 接入 `BCryptPasswordEncoder`，注册时密码哈希后入库，登录时使用 BCrypt 校验。
- **响应脱敏**: 新增 `UserVO`，接口返回用户信息时不暴露 `password` 字段。

### 2. JWT 登录态识别
- **Token 签发**: 登录成功后通过 `JwtUtil` 生成 JWT，包含 `userId` 和用户名主题信息。
- **JWT 过滤器**: 新增 `JwtAuthenticationFilter`，从 `Authorization: Bearer <token>` 请求头中解析并校验 token。
- **当前用户上下文**: 新增 `AuthUserPrincipal`，将当前用户的 `id`、`username`、`email` 放入 Spring Security 上下文。
- **当前用户接口**: 实现 `GET /api/auth/me`，用于根据 token 获取当前登录用户。
- **无状态认证配置**: 将 Spring Security 配置为 `STATELESS`，认证状态由 JWT 承载，不依赖服务端 Session。

### 3. 族谱管理基础入口
- **族谱实体映射**: 新增 `Family` 实体和 `FamilyMapper`，对接数据库中的 `families` 表。
- **创建族谱接口**: 实现 `POST /api/families`，创建时自动将 `ownerId` 设置为当前登录用户 ID。
- **族谱列表接口**: 实现 `GET /api/families`，查询当前登录用户创建且未软删除的族谱。
- **族谱详情接口**: 实现 `GET /api/families/{id}`，只允许族谱 owner 查看。
- **族谱更新接口**: 实现 `PUT /api/families/{id}`，支持修改族谱名称、姓氏和编修日期。
- **族谱软删除接口**: 实现 `DELETE /api/families/{id}`，通过写入 `deletedAt` 保留历史数据。
- **接口保护**: 将 `/api/families/**` 配置为需要登录，避免未认证用户创建或查看族谱。

### 4. 成员管理升级
- **成员请求 DTO**: 新增 `CreateMemberRequest` 和 `UpdateMemberRequest`，不再直接暴露实体作为入参。
- **分页成员列表**: 升级 `GET /api/members/family/{familyId}`，支持 `page`、`size` 和 `keyword` 姓名搜索。
- **成员详情接口**: 实现 `GET /api/members/{id}`，返回单个成员信息。
- **成员新增接口**: 实现 `POST /api/members`，自动记录 `createdBy` 为当前用户 ID。
- **成员更新接口**: 实现 `PUT /api/members/{id}`，支持基础信息编辑。
- **成员删除接口**: 实现 `DELETE /api/members/{id}`，删除成员时由数据库外键级联处理相关关系。
- **成员数据校验**: 校验姓名、性别、代际、出生年份、死亡年份，并阻止死亡年份早于出生年份。

### 5. 关系管理接口
- **关系请求 DTO**: 新增 `CreateRelationRequest`，约束关系类型必须为数据库枚举允许值。
- **新增关系接口**: 实现 `POST /api/relations`，支持父子、母子、父女、母女和配偶关系。
- **删除关系接口**: 实现 `DELETE /api/relations/{id}`。
- **同族谱校验**: 新增关系时校验两端成员必须属于同一个族谱。
- **重复关系处理**: 依赖数据库唯一约束并捕获重复插入异常，返回业务错误。
- **父母关系校验**: 校验父母出生年份必须早于子女。
- **防环校验**: 新增父母关系前检查是否会造成血缘环路。
- **配偶双向维护**: 新增 `SPOUSE` 时自动补充反向配偶关系，删除时同步删除反向边。

### 6. 权限逻辑整理
- **权限 Helper 抽取**: 新增 `AuthContextService`，统一封装当前用户获取、活跃族谱查询和族谱 owner 校验。
- **Controller 去重**: `FamilyController`、`MemberController`、`RelationController` 改为复用 `AuthContextService`，减少重复鉴权代码。
- **接口认证范围扩大**: `/api/auth/me`、`/api/families/**`、`/api/members/**`、`/api/relations/**` 均要求登录。
- **权限策略**: 当前阶段先采用 owner-only 权限模型，协作者权限后续接入 `family_collaborators` 后扩展。

### 7. 工程整理
- **占位文件清理**: 删除了已经有实际代码目录下的 `.gitkeep` 文件，保留仍为空目录中的占位文件。
- **编译验证**: 每次关键改动后均执行 Maven 编译检查，确认当前后端代码可以正常编译。

## 🔧 关键实现说明

### 1. 当前认证链路

```text
注册 / 登录
  -> 登录成功返回 JWT
  -> 前端请求携带 Authorization: Bearer token
  -> JwtAuthenticationFilter 校验 token
  -> SecurityContext 保存当前用户
  -> Controller 通过 Authentication 获取当前用户
```

### 2. 当前可用接口

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/families
POST /api/families
GET  /api/families/{id}
PUT  /api/families/{id}
DELETE /api/families/{id}
GET  /api/members/family/{familyId}
GET  /api/members/{id}
POST /api/members
PUT  /api/members/{id}
DELETE /api/members/{id}
POST /api/relations
DELETE /api/relations/{id}
```

### 3. 当前请求示例

注册：

```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

登录：

```json
{
  "account": "zhangsan",
  "password": "123456"
}
```

创建族谱：

```json
{
  "name": "张氏族谱",
  "surname": "张",
  "compiledAt": "2026-05-07"
}
```

创建成员：

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

创建关系：

```json
{
  "familyId": 1,
  "fromMemberId": 10,
  "toMemberId": 20,
  "relationType": "PARENT_SON"
}
```

## 🚦 当前状态
- **认证模块**: 已完成注册、登录、JWT 签发、JWT 校验和当前用户查询的基础闭环。
- **族谱模块**: 已完成列表、创建、详情、更新和软删除。
- **成员模块**: 已完成分页列表、姓名搜索、详情、新增、更新和删除。
- **关系模块**: 已完成新增和删除，并包含同族谱校验、重复关系处理、父母年龄校验、防环校验和配偶双向维护。
- **安全配置**: 认证、族谱、成员和关系管理接口已要求登录；第一阶段查询接口暂时保持开放，后续可按族谱权限收敛。
- **权限模型**: 当前采用 owner-only 权限，后续可扩展协作者权限。
- **前端**: 尚未接入这些新接口，后续需要在 Axios 拦截器中统一携带 token。

## 📅 下一步计划
1. **查询接口权限收敛**: 将祖先、后代、亲缘路径查询与族谱权限绑定，避免越权查询成员关系。
2. **Dashboard 统计接口**: 实现总人数、性别比例、代际分布、寿命统计等后端接口。
3. **协作者能力**: 补充 `FamilyCollaborator` 实体、Mapper 和邀请接口，扩展 owner-only 权限模型。
4. **前端接入**: 实现登录、注册、族谱列表、成员管理和关系管理页面，打通真实认证流程。
5. **异常处理统一化**: 增加全局异常处理，统一参数校验错误、数据库约束错误和鉴权错误响应格式。
